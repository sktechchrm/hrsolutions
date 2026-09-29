/**
 * Google Drive helper — talks to the signed-in USER's own Drive.
 *
 * How it works (no server of ours is involved at any point):
 *  1. Google Identity Services shows Google's own sign-in / consent popup
 *     and hands the browser a short-lived access token.
 *  2. We request only the `drive.file` scope: the app can see and manage
 *     ONLY files it created itself — never the rest of the user's Drive.
 *  3. The file is uploaded straight from the browser to Google (resumable
 *     upload, so progress can be shown and large files work).
 *  4. The file gets an "anyone with the link can view" permission, so the
 *     link can be sent over WhatsApp; the receiver needs no account.
 *  5. The token lives in memory only (never written to storage).
 *
 * Setup for the app owner: see DRIVE_SETUP.md (one Google OAuth Client ID).
 */

export const DRIVE_CLIENT_ID: string =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'HR Smart Solutions - Shared';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

export const MAX_UPLOAD_MB = 100;

export class DriveError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}

/* ── Google Identity Services loader ─────────────────────────────── */
let gisPromise: Promise<void> | null = null;

export function loadGis(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { gisPromise = null; reject(new DriveError('gis-load-failed')); };
    document.head.appendChild(s);
  });
  return gisPromise;
}

/* ── Token handling (memory only) ────────────────────────────────── */
let token = '';
let expiresAt = 0;
let tokenClient: any = null;
let pending: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null;

export const isConnected = () => !!token && Date.now() < expiresAt - 30_000;
export const isGisReady = () => !!(window as any).google?.accounts?.oauth2;

/**
 * Ask Google for an access token. MUST be called directly from a click
 * handler (before any `await`) — otherwise the browser blocks the popup.
 * Call `loadGis()` early (e.g. on mount) so the script is already there.
 */
export function connect(): Promise<string> {
  if (isConnected()) return Promise.resolve(token);
  return new Promise<string>((resolve, reject) => {
    if (!DRIVE_CLIENT_ID) return reject(new DriveError('not-configured'));
    if (!isGisReady()) return reject(new DriveError('gis-not-ready'));
    pending = { resolve, reject };
    if (!tokenClient) {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: DRIVE_CLIENT_ID,
        scope: SCOPE,
        callback: (resp: any) => {
          const p = pending; pending = null;
          if (resp?.error || !resp?.access_token) {
            p?.reject(new DriveError(resp?.error || 'auth-failed'));
            return;
          }
          token = resp.access_token;
          expiresAt = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
          p?.resolve(token);
        },
        error_callback: (err: any) => {
          const p = pending; pending = null;
          p?.reject(new DriveError(err?.type || 'auth-failed'));
        },
      });
    }
    tokenClient.requestAccessToken({ prompt: token ? '' : 'select_account' });
  });
}

export function disconnect() {
  const t = token;
  token = ''; expiresAt = 0; folderId = '';
  if (t && isGisReady()) (window as any).google.accounts.oauth2.revoke(t, () => {});
}

export function forgetToken() { token = ''; expiresAt = 0; }

/* ── REST helpers ────────────────────────────────────────────────── */
async function api(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new DriveError(data?.error?.message || `HTTP ${res.status}`, res.status);
  return data;
}

let folderId = '';

/** Finds (or creates) the app's own folder in the user's Drive. */
async function ensureFolder(): Promise<string> {
  if (folderId) return folderId;
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const found = await api(`/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`);
  if (found.files?.[0]?.id) return (folderId = found.files[0].id);
  const made = await api('/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  return (folderId = made.id);
}

export interface DriveFile { id: string; name: string; size: number; mimeType: string }

/** Resumable upload with progress (XHR is used because fetch cannot report upload progress). */
export async function uploadFile(
  file: Blob, name: string, onProgress: (pct: number) => void,
): Promise<DriveFile> {
  const parent = await ensureFolder();
  const mimeType = file.type || 'application/octet-stream';

  const start = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,mimeType',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(file.size),
      },
      body: JSON.stringify({ name, mimeType, parents: [parent] }),
    });
  if (!start.ok) {
    const e = await start.json().catch(() => ({}));
    throw new DriveError(e?.error?.message || `HTTP ${start.status}`, start.status);
  }
  const session = start.headers.get('Location');
  if (!session) throw new DriveError('no-upload-session');

  return new Promise<DriveFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', session);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onerror = () => reject(new DriveError('network'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const d = JSON.parse(xhr.responseText);
          resolve({ id: d.id, name: d.name, size: Number(d.size) || file.size, mimeType: d.mimeType || mimeType });
        } catch { reject(new DriveError('bad-response')); }
      } else reject(new DriveError(`HTTP ${xhr.status}`, xhr.status));
    };
    xhr.send(file);
  });
}

/** "Anyone with the link can view/download" — no Google account needed to open it. */
export function makePublic(id: string) {
  return api(`/drive/v3/files/${id}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
}

/** Turns link sharing off again (the file stays in the owner's Drive). */
export function stopSharing(id: string) {
  return api(`/drive/v3/files/${id}/permissions/anyoneWithLink`, { method: 'DELETE' });
}

/** Links: `download` starts the download when clicked; `view` opens Drive's preview page. */
export const links = (id: string) => ({
  download: `https://drive.google.com/uc?export=download&id=${id}`,
  view: `https://drive.google.com/file/d/${id}/view?usp=sharing`,
});

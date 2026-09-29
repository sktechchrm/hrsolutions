import { useEffect, useId, useRef, useState } from 'react';
import {
  FaGoogleDrive, FaCheckCircle, FaInfoCircle, FaCloudUploadAlt, FaFile,
  FaExternalLinkAlt, FaShieldAlt, FaWhatsapp, FaCopy, FaLink, FaBan,
  FaSignOutAlt, FaExclamationTriangle,
} from 'react-icons/fa';
import { FloatInput, ResultCard, ToggleGroup } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { accentInk } from '../../utils/color.ts';
import { shareWA, buildShare } from '../../utils/share.ts';
import {
  DRIVE_CLIENT_ID, MAX_UPLOAD_MB, DriveError, loadGis, isGisReady, isConnected,
  connect, disconnect, forgetToken, uploadFile, makePublic, stopSharing, links,
} from '../../utils/googleDrive.ts';

const A_BASE = '#0ea5e9';
// Module-level so the helper components below can read it; the main
// component re-assigns it on every render for the current theme.
let A = A_BASE;

interface Shared { id: string; name: string; size: number; download: string; view: string; on: boolean }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '12px 14px', marginBottom: 14, boxShadow: 'var(--shadow-card)',
};

function LinkRow({ label, value, copied, onCopy, bn }:
  { label: string; value: string; copied: boolean; onCopy: () => void; bn: boolean }) {
  const id = useId();
  return (
    <div style={{ marginBottom: 10 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input id={id} readOnly value={value} onFocus={e => e.currentTarget.select()}
          style={{ flex: 1, minWidth: 0, padding: '10px 12px', fontSize: 12.5, color: 'var(--text)', background: 'var(--surface2)',
            border: '1px solid var(--border2)', borderRadius: 10, fontFamily: 'monospace' }} />
        <button type="button" onClick={onCopy} style={{
          flexShrink: 0, minHeight: 44, padding: '0 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12.5,
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          background: copied ? 'var(--wa-bg)' : 'var(--surface)', color: copied ? 'var(--wa-fg)' : 'var(--text)',
          border: `1.5px solid ${copied ? 'var(--wa-bd)' : 'var(--border2)'}`,
        }}>
          {copied ? <FaCheckCircle size={12} aria-hidden /> : <FaCopy size={12} aria-hidden />}
          {copied ? (bn ? 'কপি হয়েছে' : 'Copied') : (bn ? 'কপি' : 'Copy')}
        </button>
      </div>
    </div>
  );
}

export default function DriveShareCalc({ history, onAdd, onClear }: CalcProps) {
  const { isDark } = useTheme();
  A = accentInk(A_BASE, isDark);
  const { lang } = useLang();
  const bn = lang === 'bn';
  const tr = (b: string, e: string) => (bn ? b : e);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textId = useId();
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [textTitle, setTextTitle] = useState('');
  const [textBody, setTextBody] = useState('');
  const [drag, setDrag] = useState(false);
  const [gisReady, setGisReady] = useState(isGisReady());
  const [connected, setConnected] = useState(isConnected());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [item, setItem] = useState<Shared | null>(null);
  const [copied, setCopied] = useState('');
  const [notice, setNotice] = useState('');

  const configured = !!DRIVE_CLIENT_ID;

  // Preload Google's sign-in script so the popup can open instantly on click.
  useEffect(() => {
    if (!configured) return;
    loadGis().then(() => setGisReady(true)).catch(() => setGisReady(false));
  }, [configured]);

  const errText = (e: unknown): string => {
    const m = e instanceof DriveError ? e.message : '';
    const s = e instanceof DriveError ? e.status : 0;
    if (m === 'popup_closed' || m === 'access_denied')
      return tr('Google সাইন-ইন সম্পন্ন হয়নি। আবার চেষ্টা করুন।', 'Google sign-in was not completed. Please try again.');
    if (m === 'popup_failed_to_open')
      return tr('সাইন-ইন উইন্ডো খোলা যায়নি। ব্রাউজারের পপ-আপ অনুমতি দিন।', 'Could not open the sign-in window. Please allow pop-ups for this site.');
    if (m === 'gis-not-ready' || m === 'gis-load-failed')
      return tr('Google সাইন-ইন লোড হয়নি। ইন্টারনেট দেখে আবার চাপুন।', 'Google sign-in has not loaded. Check your connection and tap again.');
    if (s === 401) return tr('সেশন শেষ হয়েছে। আবার সংযুক্ত করুন।', 'Your session expired. Please connect again.');
    if (s === 403) return tr('Google Drive অনুমতি দেয়নি (কোটা বা অ্যাক্সেস সমস্যা)।', 'Google Drive refused the request (quota or access problem).');
    if (m === 'network') return tr('নেটওয়ার্ক সমস্যা — সংযোগ দেখে আবার চেষ্টা করুন।', 'Network problem — check your connection and try again.');
    return tr('কিছু ভুল হয়েছে, আবার চেষ্টা করুন।', 'Something went wrong. Please try again.') + (m ? ` (${m})` : '');
  };

  const onEachError = (e: unknown) => {
    if (e instanceof DriveError && e.status === 401) { forgetToken(); setConnected(false); }
    setError(errText(e));
  };

  const pickFile = () => fileInputRef.current?.click();
  const takeFile = (f: File | null) => { setFile(f); setItem(null); setError(''); setNotice(''); };

  const upload = async () => {
    setError(''); setNotice('');
    if (!configured) { setError(tr('অ্যাপ এখনো Google-এর সাথে সেটআপ হয়নি (DRIVE_SETUP.md দেখুন)।', 'The app is not connected to Google yet (see DRIVE_SETUP.md).')); return; }

    let blob: Blob; let name: string;
    if (mode === 'file') {
      if (!file) { setError(tr('আগে একটি ফাইল বেছে নিন।', 'Please choose a file first.')); return; }
      blob = file; name = file.name;
    } else {
      if (!textBody.trim()) { setError(tr('শেয়ার করার লেখা/ডাটা লিখুন।', 'Type the text or data you want to share.')); return; }
      blob = new Blob([textBody], { type: 'text/plain;charset=utf-8' });
      const base = (textTitle.trim() || `note-${new Date().toISOString().slice(0, 10)}`).replace(/[\\/:*?"<>|]/g, '_');
      name = base.toLowerCase().endsWith('.txt') ? base : `${base}.txt`;
    }
    if (blob.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(tr(`ফাইল সর্বোচ্চ ${MAX_UPLOAD_MB} MB হতে পারে।`, `File must be ${MAX_UPLOAD_MB} MB or smaller.`)); return;
    }
    if (blob.size === 0) { setError(tr('ফাইলটি খালি।', 'The file is empty.')); return; }

    setBusy(true); setItem(null); setProgress(null);
    try {
      setStage(tr('Google-এ সংযুক্ত হচ্ছে…', 'Connecting to Google…'));
      await connect();                       // first await: keeps the popup tied to the click
      setConnected(true);
      setStage(tr('আপনার Drive-এ আপলোড হচ্ছে…', 'Uploading to your Drive…')); setProgress(0);
      const up = await uploadFile(blob, name, setProgress);
      setStage(tr('লিংক তৈরি হচ্ছে…', 'Creating the share link…')); setProgress(null);
      await makePublic(up.id);
      const l = links(up.id);
      const shared: Shared = { id: up.id, name: up.name, size: up.size, download: l.download, view: l.view, on: true };
      setItem(shared);
      onAdd('driveshare', `${up.name} · ${l.download}`);
      if (mode === 'file') { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
      else { setTextBody(''); setTextTitle(''); }
    } catch (e) { onEachError(e); }
    finally { setBusy(false); setProgress(null); setStage(''); }
  };

  const copy = async (key: string, value: string) => {
    try { await navigator.clipboard.writeText(value); }
    catch {
      const ta = document.createElement('textarea'); ta.value = value; document.body.appendChild(ta);
      ta.select(); try { document.execCommand('copy'); } catch { /* ignore */ } ta.remove();
    }
    setCopied(key); setTimeout(() => setCopied(''), 1800);
  };

  const shareText = item
    ? buildShare(tr('ফাইল শেয়ার', 'File shared'), [
        `${tr('ফাইল', 'File')}: ${item.name} (${formatSize(item.size)})`,
        `${tr('ডাউনলোড লিংক', 'Download link')}: ${item.download}`,
      ])
    : '';

  const revoke = async () => {
    if (!item) return;
    setError(''); setBusy(true);
    try {
      await connect();
      await stopSharing(item.id);
      setItem({ ...item, on: false });
    } catch (e) { onEachError(e); }
    finally { setBusy(false); }
  };

  const signOut = () => { disconnect(); setConnected(false); setNotice(tr('Google থেকে সংযোগ বিচ্ছিন্ন করা হয়েছে।', 'Disconnected from Google.')); };

  return (
    <CalcShell
      accent={A}
      onCalc={upload}
      calcLabel={busy ? tr('অপেক্ষা করুন…', 'Working…') : tr('আপলোড ও লিংক নিন', 'Upload & get link')}
      hasResult={!!item?.on}
      onShare={() => shareText && shareWA(shareText)}
      history={history}
      onClear={() => onClear?.('driveshare')}
      historyLabel={tr('ইতিহাস', 'History')}
      clearLabel={tr('মুছুন', 'Clear')}
    >
      {/* How it works */}
      <div style={{ background: `${A}12`, border: `1px solid ${A}35`, borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <FaInfoCircle size={15} color={A} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
        <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>
          {tr('ফাইল বা লেখা আপনার নিজের Google Drive-এ রাখুন, তারপর লিংক WhatsApp-এ পাঠান। যিনি লিংক পাবেন, ক্লিক করলেই ফাইল ডাউনলোড হবে — তাঁর Google অ্যাকাউন্ট লাগবে না।',
              'Save a file or text to your own Google Drive, then send the link on WhatsApp. Whoever gets the link taps it and the file downloads — no Google account needed.')}
        </div>
      </div>

      {!configured && (
        <div role="alert" style={{ ...card, borderColor: 'var(--warning)', display: 'flex', gap: 10 }}>
          <FaExclamationTriangle size={15} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
          <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>
            {tr('অ্যাপ মালিকের জন্য: Google Client ID সেট করা হয়নি। DRIVE_SETUP.md অনুসরণ করে VITE_GOOGLE_CLIENT_ID যোগ করুন।',
                'For the app owner: no Google Client ID is set. Follow DRIVE_SETUP.md and add VITE_GOOGLE_CLIENT_ID.')}
          </div>
        </div>
      )}

      {/* Connection status */}
      {configured && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaGoogleDrive size={20} color={connected ? A : 'var(--text3)'} aria-hidden />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
              {connected ? tr('Google Drive সংযুক্ত', 'Google Drive connected') : tr('Google Drive সংযুক্ত নয়', 'Google Drive not connected')}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.45 }}>
              {connected
                ? tr('ফাইল যাবে আপনার Drive-এর “HR Smart Solutions - Shared” ফোল্ডারে।', 'Files go to the “HR Smart Solutions - Shared” folder in your Drive.')
                : tr('আপলোড চাপলে Google সাইন-ইন খুলবে।', 'Google sign-in opens when you tap Upload.')}
            </div>
          </div>
          {connected ? (
            <button type="button" onClick={signOut} style={{ minHeight: 44, padding: '0 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
              background: 'var(--surface)', color: 'var(--text)', border: '1.5px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FaSignOutAlt size={12} aria-hidden />{tr('বিচ্ছিন্ন', 'Disconnect')}
            </button>
          ) : !gisReady && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{tr('লোড হচ্ছে…', 'Loading…')}</span>
          )}
        </div>
      )}

      <ToggleGroup
        label={tr('কী শেয়ার করবেন', 'What to share')}
        accent={A} value={mode}
        onChange={(v: string) => { setMode(v as 'file' | 'text'); setError(''); }}
        options={[['file', tr('ফাইল', 'File')], ['text', tr('লেখা / ডাটা', 'Text / data')]]}
      />

      {mode === 'file' ? (
        <>
          <input ref={fileInputRef} type="file" tabIndex={-1} aria-hidden style={{ display: 'none' }}
            onChange={e => takeFile(e.target.files?.[0] || null)} />
          <div
            role="button" tabIndex={0}
            aria-label={file ? `${file.name} — ${tr('অন্য ফাইল বেছে নিন', 'choose a different file')}` : tr('ফাইল বেছে নিন', 'Choose a file')}
            onClick={pickFile}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickFile(); } }}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); takeFile(e.dataTransfer.files?.[0] || null); }}
            style={{
              border: `2px dashed ${file || drag ? A : 'var(--border2)'}`, borderRadius: 16,
              padding: '26px 16px', textAlign: 'center', cursor: 'pointer',
              background: file || drag ? `${A}0d` : 'var(--surface)', marginBottom: 14, transition: 'all 0.15s',
            }}
          >
            {file ? (
              <>
                <FaFile size={24} color={A} style={{ marginBottom: 8 }} aria-hidden />
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', wordBreak: 'break-all', marginBottom: 3 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{formatSize(file.size)}</div>
                <div style={{ fontSize: 12, color: A, marginTop: 8, fontWeight: 700 }}>{tr('অন্য ফাইল বাছতে চাপুন', 'Tap to choose a different file')}</div>
              </>
            ) : (
              <>
                <FaCloudUploadAlt size={30} color="var(--text3)" style={{ marginBottom: 8 }} aria-hidden />
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{tr('ফাইল বেছে নিন', 'Choose a file')}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {tr(`অথবা এখানে টেনে আনুন · সর্বোচ্চ ${MAX_UPLOAD_MB} MB`, `or drag it here · up to ${MAX_UPLOAD_MB} MB`)}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <FloatInput label={tr('শিরোনাম (ঐচ্ছিক)', 'Title (optional)')} accent={A} type="text"
            placeholder={tr('যেমন: মিটিং নোট', 'e.g. Meeting notes')}
            value={textTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextTitle(e.target.value)} />
          <label htmlFor={textId} style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text2)', margin: '2px 0 6px' }}>
            {tr('লেখা / ডাটা', 'Text / data')}
          </label>
          <textarea id={textId} value={textBody} onChange={e => setTextBody(e.target.value)} rows={7}
            placeholder={tr('এখানে লিখুন বা পেস্ট করুন…', 'Type or paste here…')}
            style={{ width: '100%', padding: '12px 14px', fontSize: 14, lineHeight: 1.6, color: 'var(--text)', background: 'var(--surface)',
              border: '2px solid var(--border)', borderRadius: 13, fontFamily: 'inherit', resize: 'vertical', marginBottom: 14 }} />
        </>
      )}

      {busy && (
        <div role="status" aria-live="polite" style={{ ...card }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{stage}</div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? undefined}
            aria-label={tr('আপলোড অগ্রগতি', 'Upload progress')}
            style={{ height: 8, borderRadius: 4, background: 'var(--surface3)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: progress === null ? '35%' : `${progress}%`, background: A, borderRadius: 4, transition: 'width .2s' }} />
          </div>
          {progress !== null && <div style={{ fontSize: 11.5, color: 'var(--text2)', marginTop: 6 }}>{progress}%</div>}
        </div>
      )}

      {error && (
        <div role="alert" style={{ ...card, borderColor: 'var(--error)', color: 'var(--error)', fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>{error}</div>
      )}
      {notice && (
        <div role="status" style={{ ...card, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{notice}</div>
      )}

      {item && (
        <ResultCard accent={A}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <FaCheckCircle size={20} color="var(--success)" aria-hidden />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                {item.on ? tr('আপনার Drive-এ সংরক্ষিত ও লিংক তৈরি', 'Saved to your Drive · link ready') : tr('শেয়ারিং বন্ধ — লিংকটি আর কাজ করবে না', 'Sharing stopped — the link no longer works')}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text2)', wordBreak: 'break-all' }}>{item.name} · {formatSize(item.size)}</div>
            </div>
          </div>

          {item.on && (
            <>
              <button type="button" onClick={() => shareWA(shareText)} style={{
                width: '100%', minHeight: 48, marginBottom: 12, background: '#0b7a62', color: '#fff', border: 'none', borderRadius: 13,
                fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <FaWhatsapp size={20} aria-hidden />{tr('WhatsApp-এ লিংক পাঠান', 'Send link on WhatsApp')}
              </button>
              <LinkRow bn={bn} label={tr('ডাউনলোড লিংক (ক্লিকেই ডাউনলোড শুরু)', 'Download link (starts the download)')}
                value={item.download} copied={copied === 'dl'} onCopy={() => copy('dl', item.download)} />
              <LinkRow bn={bn} label={tr('প্রিভিউ লিংক (Drive পেজে খোলে)', 'Preview link (opens the Drive page)')}
                value={item.view} copied={copied === 'vw'} onCopy={() => copy('vw', item.view)} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <a href={item.view} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  borderRadius: 11, border: '1.5px solid var(--border2)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  <FaExternalLinkAlt size={12} aria-hidden />{tr('Drive-এ দেখুন', 'Open in Drive')}
                </a>
                <button type="button" onClick={revoke} disabled={busy} style={{ flex: 1, minWidth: 140, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  borderRadius: 11, border: '1.5px solid var(--danger-fg)', background: 'var(--danger-bg)', color: 'var(--danger-fg)', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                  <FaBan size={12} aria-hidden />{tr('শেয়ারিং বন্ধ করুন', 'Stop sharing')}
                </button>
              </div>
            </>
          )}
        </ResultCard>
      )}

      <div style={{ marginTop: 16, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <FaShieldAlt size={13} color="var(--text2)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
        <div style={{ fontSize: 11.5, color: 'var(--text2)', lineHeight: 1.65 }}>
          <FaLink size={10} aria-hidden style={{ marginRight: 4 }} />
          {tr('ফাইল যায় সরাসরি আপনার Google Drive-এ; আমাদের কোনো সার্ভারে নয়। অ্যাপ শুধু নিজের তৈরি ফাইলই দেখতে পায়। লিংক যার কাছে থাকবে সে-ই ডাউনলোড করতে পারবে — তাই সংবেদনশীল ফাইল পাঠাবেন না, আর দরকার শেষে “শেয়ারিং বন্ধ করুন” চাপুন।',
              'Files go straight to your own Google Drive, not to any server of ours. The app can only see files it created. Anyone who has the link can download the file, so avoid sensitive files and tap “Stop sharing” when you are done.')}
        </div>
      </div>
    </CalcShell>
  );
}

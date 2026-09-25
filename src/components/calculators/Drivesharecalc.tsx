import { useRef, useState } from 'react';
import {
  FaGoogleDrive, FaCheckCircle, FaTimesCircle, FaInfoCircle,
  FaCloudUploadAlt, FaFile, FaExternalLinkAlt, FaShieldAlt,
} from 'react-icons/fa';
import { FloatInput, ResultCard } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#0ea5e9';

/* ──────────────────────────────────────────────────────────────
   Paste the deployed Apps Script Web App URL here (ends in /exec).
   See Code.gs for the script this talks to and deployment steps.
   Until this is set, the Send button stays disabled with a clear
   message rather than silently failing.
   ────────────────────────────────────────────────────────────── */
const SCRIPT_URL = ''; // e.g. 'https://script.google.com/macros/s/AKfycb.../exec'

const MAX_FILE_MB = 8; // Apps Script quotas + base64 overhead make larger files unreliable

interface UploadResult {
  eligible: true;
  fileName: string;
  url?: string;
  fileSizeKB: number;
}
interface ErrorResult { eligible: false; error: string }

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DriveShareCalc({ history, onAdd, onClear }: CalcProps) {
  const { lang } = useLang();
  const bn = lang === 'bn';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | ErrorResult | null>(null);

  const notConfigured = !SCRIPT_URL;

  const pickFile = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
  };

  const send = async () => {
    if (notConfigured) {
      setResult({ eligible: false, error: bn
        ? 'এই ফিচারটি এখনও কনফিগার করা হয়নি — DriveShareCalc.tsx ফাইলে SCRIPT_URL বসাতে হবে (Code.gs দেখুন)।'
        : 'This feature isn\u2019t configured yet — SCRIPT_URL needs to be set in DriveShareCalc.tsx (see Code.gs for setup).' });
      return;
    }
    if (!file) {
      setResult({ eligible: false, error: bn ? 'একটি ফাইল বেছে নিন।' : 'Please choose a file.' });
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setResult({ eligible: false, error: bn
        ? `ফাইলের আকার সর্বোচ্চ ${MAX_FILE_MB} MB পর্যন্ত হতে পারে।`
        : `File size must be under ${MAX_FILE_MB} MB.` });
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const base64 = await readFileAsBase64(file);
      const payload = JSON.stringify({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        dataBase64: base64,
        note: note.trim(),
        uploader: uploaderName.trim(),
        ts: new Date().toISOString(),
      });

      // Content-Type: text/plain avoids a CORS preflight (application/json
      // would trigger one, and Apps Script doesn't implement doOptions).
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Upload failed');

      setResult({ eligible: true, fileName: data.fileName || file.name, url: data.url, fileSizeKB: file.size / 1024 });
      onAdd('driveshare', `${bn ? 'পাঠানো হয়েছে' : 'Sent'}: ${data.fileName || file.name}`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setResult({ eligible: false, error: bn
        ? `পাঠানো যায়নি — ইন্টারনেট সংযোগ পরীক্ষা করুন অথবা আবার চেষ্টা করুন। (${err?.message || 'অজানা ত্রুটি'})`
        : `Could not send — check your connection and try again. (${err?.message || 'unknown error'})` });
    } finally {
      setUploading(false);
    }
  };

  const share = result?.eligible && result.url
    ? buildShare(bn ? 'ফাইল পাঠানো হয়েছে' : 'File sent', [
        `${bn ? 'ফাইল' : 'File'}: ${result.fileName}`,
        `${bn ? 'লিংক' : 'Link'}: ${result.url}`,
      ])
    : null;

  return (
    <CalcShell
      accent={A}
      onCalc={send}
      calcLabel={uploading ? (bn ? 'পাঠানো হচ্ছে…' : 'Sending…') : (bn ? 'পাঠান' : 'Send')}
      hasResult={!!(result?.eligible)}
      onShare={() => share && shareWA(share)}
      history={history}
      onClear={() => onClear?.('driveshare')}
      historyLabel={bn ? 'ইতিহাস' : 'History'}
      clearLabel={bn ? 'মুছুন' : 'Clear'}
    >
      <div style={{ background: `${A}15`, border: `1px solid ${A}35`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <FaInfoCircle size={15} color={A} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: A, lineHeight: 1.55 }}>
          {bn
            ? 'যেকোনো ফাইল বেছে নিন ও পাঠান — এটি সরাসরি অ্যাপ পরিচালকের নির্বাচিত Google Drive ফোল্ডারে সংরক্ষিত হবে। আপনার নিজের Google অ্যাকাউন্ট দিয়ে লগইন করার প্রয়োজন নেই।'
            : 'Pick any file and send it — it goes straight into the app owner\u2019s chosen Google Drive folder. No Google sign-in needed on your end.'}
        </div>
      </div>

      {notConfigured && (
        <div style={{ background: '#2a1c05', border: '1px solid #92400e', borderRadius: 12, padding: '11px 13px', marginBottom: 16, fontSize: 12, color: '#fde68a', lineHeight: 1.6 }}>
          {bn
            ? 'সাইট পরিচালকের জন্য: এই ফিচার এখনও চালু হয়নি। Code.gs ডেপ্লয় করে সেই URL এই ফাইলের SCRIPT_URL-এ বসান।'
            : 'For the site owner: this feature isn\u2019t live yet. Deploy Code.gs and paste its URL into SCRIPT_URL in this file.'}
        </div>
      )}

      {/* File picker */}
      <input
        ref={fileInputRef} type="file" onChange={onFileChange}
        style={{ display: 'none' }}
      />
      <div
        onClick={pickFile}
        style={{
          border: `1.5px dashed ${file ? A : 'var(--border)'}`, borderRadius: 14,
          padding: '22px 16px', textAlign: 'center', cursor: 'pointer',
          background: file ? `${A}0d` : 'var(--surface)', marginBottom: 14, transition: 'all 0.15s',
        }}
      >
        {file ? (
          <>
            <FaFile size={22} color={A} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all', marginBottom: 3 }}>{file.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{formatSize(file.size)}</div>
            <div style={{ fontSize: 11, color: A, marginTop: 8, fontWeight: 700 }}>
              {bn ? 'অন্য ফাইল বেছে নিতে চাপুন' : 'Tap to choose a different file'}
            </div>
          </>
        ) : (
          <>
            <FaCloudUploadAlt size={26} color="var(--text3)" style={{ marginBottom: 8, opacity: 0.7 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 3 }}>
              {bn ? 'ফাইল বেছে নিতে চাপুন' : 'Tap to choose a file'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
              {bn ? `সর্বোচ্চ ${MAX_FILE_MB} MB` : `Up to ${MAX_FILE_MB} MB`}
            </div>
          </>
        )}
      </div>

      <FloatInput
        label={bn ? 'আপনার নাম (ঐচ্ছিক)' : 'Your name (optional)'}
        accent={A} type="text" placeholder={bn ? 'যেমন: রহিম উদ্দিন' : 'e.g. Jane Doe'}
        value={uploaderName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUploaderName(e.target.value)}
      />
      <FloatInput
        label={bn ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'}
        accent={A} type="text" placeholder={bn ? 'ফাইল সম্পর্কে সংক্ষিপ্ত বিবরণ' : 'A short note about this file'}
        value={note}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
      />

      {result && !result.eligible && (
        <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, marginTop: 12, lineHeight: 1.6 }}>
          ⚠️ {result.error}
        </div>
      )}

      {result?.eligible && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 14, background: '#0a2818', border: '2px solid #166534', borderRadius: 12, padding: '12px 16px' }}>
            <FaCheckCircle color="#4ade80" size={20} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>
              {bn ? 'পাঠানো হয়েছে ✓' : 'Sent ✓'}
            </span>
          </div>

          <ResultCard accent={A}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <FaGoogleDrive size={28} color={A} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all' }}>{result.fileName}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{formatSize(result.fileSizeKB * 1024)}</div>
            </div>
            {result.url && (
              <a
                href={result.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 16px', background: `${A}18`, border: `1.5px solid ${A}45`, borderRadius: 12,
                  color: A, fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}
              >
                <FaExternalLinkAlt size={12} />
                {bn ? 'Drive-এ দেখুন' : 'View in Drive'}
              </a>
            )}
          </ResultCard>
        </>
      )}

      <div style={{ marginTop: 16, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--surface2)', border: `1px solid var(--border)`, borderRadius: 12 }}>
        <FaShieldAlt size={12} color="var(--text3)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
          {bn
            ? 'ফাইলটি সরাসরি অ্যাপ পরিচালকের Google Drive-এ যাবে — অন্য কোনো তৃতীয় পক্ষের সার্ভারে সংরক্ষিত হয় না। সংবেদনশীল কিছু পাঠানোর আগে নিশ্চিত হয়ে নিন এটি সঠিক প্রাপক।'
            : 'The file goes directly to the app owner\u2019s Google Drive — it isn\u2019t stored on any other third-party server. Confirm this is the right recipient before sending anything sensitive.'}
        </div>
      </div>
    </CalcShell>
  );
}
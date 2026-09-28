import React from 'react';
import {
  FaGlobe, FaSun, FaMoon, FaPuzzlePiece,
  FaBaby, FaFileContract, FaVideo, FaGoogleDrive, FaIndustry,
} from 'react-icons/fa';
import { useLang } from '../context/LangContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { APPS } from '../utils/constants.ts';
import { onAccent, accentInk } from '../utils/color.ts';

/**
 * Home screen.
 * Was a JS-measured grid that stretched every card to fill the screen —
 * built for ~20 apps, it turned 5 apps into huge, mostly empty tiles.
 * Now a plain CSS grid with comfortably sized cards: auto-fills as many
 * columns as fit (2 on phones, 3–5 on tablet/desktop), scrolls if ever
 * needed, and needs no resize observer.
 */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  FaBaby, FaFileContract, FaVideo, FaGoogleDrive, FaIndustry,
};

const FONT = "'Noto Serif Bengali','Outfit','Noto Sans Bengali',sans-serif";

const STYLES = `
.hsc-root{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;background:var(--bg);font-family:${FONT}}
.hsc-header{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:max(env(safe-area-inset-top,0px),12px) clamp(14px,3vw,28px) 12px;
  background:var(--surface);border-bottom:1px solid var(--border);box-shadow:var(--shadow-bar)}
.hsc-brand{display:flex;align-items:center;gap:12px;min-width:0}
.hsc-logo{width:40px;height:40px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}
.hsc-title{font-size:clamp(16px,2.6vw,21px);font-weight:800;color:var(--text);line-height:1.2;margin:0}
.hsc-tag{font-size:clamp(12px,1.6vw,14px);color:var(--text2);margin:2px 0 0;line-height:1.3}
.hsc-actions{display:flex;gap:8px;flex-shrink:0}
.hsc-pill{display:flex;align-items:center;gap:6px;min-height:36px;padding:6px 13px;border-radius:20px;cursor:pointer;
  font-size:13px;font-weight:700;font-family:inherit;background:var(--surface);color:var(--text);border:1px solid var(--border2);
  transition:background .15s,transform .15s}
.hsc-pill:hover{background:var(--surface3)}
.hsc-pill:active{transform:scale(.97)}
.hsc-main{flex:1;min-height:0;overflow-y:auto;padding:20px clamp(14px,3vw,28px) 24px}
.hsc-inner{width:100%;max-width:1040px;margin:0 auto}
.hsc-label{font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--text2);margin:0 0 14px}
.hsc-grid{display:grid;gap:clamp(10px,2vw,18px);grid-template-columns:repeat(2,minmax(0,1fr))}
@media(min-width:640px){.hsc-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(min-width:1000px){.hsc-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}}
.hsc-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:12px;
  text-align:left;min-height:clamp(150px,22vh,190px);padding:clamp(14px,2vw,20px);border-radius:20px;cursor:pointer;
  font-family:inherit;color:inherit;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-card);
  overflow:hidden;isolation:isolate;
  transition:transform .18s cubic-bezier(.22,1,.36,1),box-shadow .18s,border-color .18s}
.hsc-card::before{content:'';position:absolute;inset:0;z-index:-1;opacity:.9;
  background:radial-gradient(120% 90% at 0% 0%,color-mix(in srgb,var(--ac) 13%,transparent) 0%,transparent 60%)}
.hsc-card::after{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--ac);opacity:.9}
.hsc-card:hover{transform:translateY(-3px);border-color:var(--ac)}
.hsc-card:active{transform:scale(.98)}
.hsc-pod{width:52px;height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
  background:color-mix(in srgb,var(--ac) 16%,var(--surface));border:1px solid color-mix(in srgb,var(--ac) 35%,transparent)}
.hsc-lm{display:block;font-size:clamp(15px,1.9vw,17px);font-weight:800;color:var(--text);line-height:1.25}
.hsc-ls{display:block;margin-top:4px;font-size:clamp(12px,1.5vw,13px);color:var(--text2);line-height:1.4}
.hsc-badge{position:absolute;top:10px;right:10px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;font-family:monospace;background:var(--ac)}
@media(prefers-reduced-motion:reduce){.hsc-card,.hsc-pill{transition:none}}
`;

interface Props {
  onOpen:  (id: string) => void;
  history: Record<string, string[]>;
}

export default function HomeScreen({ onOpen, history }: Props) {
  const { t, lang, toggle } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const bn = lang === 'bn';

  return (
    <div className="hsc-root">
      <style>{STYLES}</style>

      <header className="hsc-header">
        <div className="hsc-brand">
          <div className="hsc-logo" aria-hidden><FaPuzzlePiece size={20} /></div>
          <div style={{ minWidth: 0 }}>
            <h1 className="hsc-title">{t.appName}</h1>
            <p className="hsc-tag">{t.tagline}</p>
          </div>
        </div>
        <div className="hsc-actions">
          <button className="hsc-pill" onClick={toggleTheme}
            aria-label={isDark ? (bn ? 'দিনের মোডে যান' : 'Switch to day mode') : (bn ? 'রাতের মোডে যান' : 'Switch to night mode')}>
            {isDark ? <FaSun size={13} color="#f59e0b" aria-hidden /> : <FaMoon size={13} color="#6d28d9" aria-hidden />}
            <span>{isDark ? (bn ? 'দিন' : 'Day') : (bn ? 'রাত' : 'Night')}</span>
          </button>
          <button className="hsc-pill" onClick={toggle}
            aria-label={bn ? 'Switch to English' : 'বাংলায় দেখুন'}>
            <FaGlobe size={13} color="#6366f1" aria-hidden />
            <span>{bn ? 'EN' : 'বাং'}</span>
          </button>
        </div>
      </header>

      <main className="hsc-main">
        <div className="hsc-inner">
          <h2 className="hsc-label">{t.selectCalc}</h2>
          <div className="hsc-grid">
            {APPS.map(app => {
              const Icon = ICON_MAP[app.icon];
              const count = (history[app.id] || []).length;
              const appT = t.apps[app.id as keyof typeof t.apps];
              const label = appT?.label || app.id;
              const sub = appT?.desc || '';
              const ink = accentInk(app.color, isDark);
              return (
                <button
                  key={app.id}
                  className="hsc-card"
                  onClick={() => onOpen(app.id)}
                  style={{ '--ac': ink } as React.CSSProperties}
                >
                  {count > 0 && (
                    <span className="hsc-badge" style={{ color: onAccent(ink) }}
                      aria-label={bn ? `${count}টি সংরক্ষিত হিসাব` : `${count} saved calculations`}>{count}</span>
                  )}
                  <span className="hsc-pod" aria-hidden>{Icon && <Icon size={24} color={ink} />}</span>
                  <span>
                    <span className="hsc-lm">{label}</span>
                    {sub && <span className="hsc-ls">{sub}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

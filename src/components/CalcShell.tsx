/**
 * CalcShell — universal wrapper for every calculator.
 *
 * Layout (flex column, 100% height):
 *  ┌──────────────────────────────────┐
 *  │  Scrollable content (inputs+result) │  flex:1 overflow-y:auto
 *  ├──────────────────────────────────┤
 *  │  [Calculate]  [History]  [WA]    │  fixed, flex-shrink:0
 *  └──────────────────────────────────┘
 *
 * The ⓘ tooltip is handled by Header.tsx — NOT here.
 * No emoji anywhere — only react-icons/fa.
 */
import { useState } from 'react';
import {
  FaCalculator, FaWhatsapp, FaHistory,
  FaTrash, FaChevronDown,
} from 'react-icons/fa';

const D = {
  bg:      'var(--bg)',
  surface: 'var(--surface)',
  border:  'var(--border)',
  textPri: 'var(--text)',
  textSec: 'var(--text3)',
  textDim: 'var(--text4)',
  font:    "'Noto Serif Bengali','Outfit','Noto Sans Bengali',sans-serif",
};

interface Props {
  accent:        string;
  onCalc:        () => void;
  calcLabel?:    string;
  hasResult?:    boolean;
  onShare?:      () => void;
  history?:      string[];
  onClear?:      () => void;
  historyLabel?: string;
  clearLabel?:   string;
  children:      React.ReactNode;
}

export default function CalcShell({
  accent, onCalc,
  calcLabel = 'Calculate',
  hasResult = false,
  onShare,
  history = [],
  onClear,
  historyLabel = 'History',
  clearLabel = 'Clear',
  children,
}: Props) {
  const [histOpen, setHistOpen] = useState(false);
  const histCount = history.length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      background: 'var(--bg)', overflow: 'hidden',
      fontFamily: D.font, position: 'relative',
    }}>

      {/* ── Scrollable content — fills all space above bottom bar ── */}
      <div style={{
        flex: 1, minHeight: 0,
        overflowY: 'auto', overflowX: 'hidden',
        padding: '12px 14px 8px',
        scrollbarWidth: 'thin',
        scrollbarColor: `${accent}40 transparent`,
      } as React.CSSProperties}>
        {children}
      </div>

      {/* ── Fixed bottom bar: [Calculate] [History] [WhatsApp] ── */}
      <div style={{
        flexShrink: 0,
        padding: '10px 14px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)',
        background: 'var(--surface)',
        borderTop: `1px solid ${D.border}`,
        display: 'flex', gap: 8,
      }}>

        {/* Calculate */}
        <button
          onClick={onCalc}
          style={{
            flex: 1, padding: '14px 0',
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            color: '#fff', border: 'none', borderRadius: 13,
            fontSize: 15, fontWeight: 800, fontFamily: D.font,
            boxShadow: `0 4px 18px ${accent}44`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 7,
            minWidth: 0, letterSpacing: 0.3,
            transition: 'transform 0.1s',
          }}
          onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          onTouchEnd={e => (e.currentTarget.style.transform = '')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={e => (e.currentTarget.style.transform = '')}
        >
          <FaCalculator size={14} />
          {calcLabel}
        </button>

        {/* History */}
        <button
          onClick={() => setHistOpen(o => !o)}
          style={{
            width: 52, flexShrink: 0, padding: '14px 0',
            background: histOpen ? `${accent}18` : D.surface,
            color: histCount > 0 ? accent : D.textSec,
            border: `2px solid ${histCount > 0 ? accent + '55' : D.border}`,
            borderRadius: 13, cursor: 'pointer', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
          }}
        >
          <FaHistory size={17} />
          {histCount > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              background: accent, color: '#fff',
              borderRadius: 6, fontSize: 8, fontWeight: 900,
              padding: '1px 4px', minWidth: 14, height: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace',
            }}>
              {histCount > 99 ? '99+' : histCount}
            </span>
          )}
        </button>

        {/* WhatsApp */}
        <button
          onClick={onShare}
          disabled={!hasResult}
          style={{
            width: 52, flexShrink: 0, padding: '14px 0',
            background: hasResult ? '#0d2e18' : D.surface,
            color: hasResult ? '#25d366' : D.textDim,
            border: `2px solid ${hasResult ? '#25d36640' : D.border}`,
            borderRadius: 13,
            cursor: hasResult ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: hasResult ? '0 4px 14px rgba(37,211,102,0.15)' : 'none',
            transition: 'all 0.18s',
            opacity: hasResult ? 1 : 0.4,
          }}
          onTouchStart={e => hasResult && (e.currentTarget.style.transform = 'scale(0.94)')}
          onTouchEnd={e => (e.currentTarget.style.transform = '')}
        >
          <FaWhatsapp size={20} />
        </button>
      </div>

      {/* Backdrop */}
      {histOpen && (
        <div
          onClick={() => setHistOpen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 299,
            background: 'rgba(0,0,0,0.45)',
          }}
        />
      )}

      {/* History slide-up panel */}
      {histOpen && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 300,
          background: 'var(--surface)',
          border: `1.5px solid var(--border)`,
          borderRadius: '18px 18px 0 0',
          padding: '16px 16px 24px',
          maxHeight: '55%',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          animation: 'shellSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Handle */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: D.border, margin: '0 auto 14px',
          }} />

          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <FaHistory size={13} color={accent} />
              <span style={{ fontWeight: 800, fontSize: 14, color: D.textPri }}>
                {historyLabel} ({histCount})
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onClear && histCount > 0 && (
                <button onClick={onClear} style={{
                  background: '#2a0a0a', color: '#e74c3c',
                  border: 'none', borderRadius: 8,
                  padding: '6px 12px', fontSize: 12,
                  fontWeight: 700, fontFamily: D.font,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <FaTrash size={11} /> {clearLabel}
                </button>
              )}
              <button onClick={() => setHistOpen(false)} style={{
                background: 'var(--bg)', border: `1.5px solid ${D.border}`,
                borderRadius: 8, padding: '6px 10px',
                color: D.textSec, cursor: 'pointer',
                fontSize: 12, fontFamily: D.font, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <FaChevronDown size={10} /> Close
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{
            flex: 1, overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: `${accent}40 transparent`,
          } as React.CSSProperties}>
            {histCount === 0 ? (
              <div style={{
                textAlign: 'center', color: D.textSec,
                padding: '24px 0', fontSize: 14,
              }}>
                No history yet
              </div>
            ) : (
              [...history].reverse().map((item, i) => (
                <div key={i} style={{
                  fontSize: 13, padding: '9px 4px',
                  borderBottom: i < histCount - 1
                    ? `1px solid ${D.border}` : 'none',
                  color: i === 0 ? D.textPri : D.textSec,
                  lineHeight: 1.55,
                  wordBreak: 'break-word',
                  fontWeight: i === 0 ? 600 : 400,
                }}>
                  {i === 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: accent,
                      background: `${accent}18`, borderRadius: 4,
                      padding: '1px 5px', marginRight: 6, letterSpacing: 0.5,
                    }}>LATEST</span>
                  )}
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shellSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes popIn {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
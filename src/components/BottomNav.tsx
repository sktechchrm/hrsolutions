import { FaHome, FaVideo, FaQuestionCircle } from 'react-icons/fa';
import { useLang } from '../context/LangContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { accentInk } from '../utils/color.ts';

/**
 * Bottom navigation.
 * In the combined app, 3 destinations: Home (the app grid where all 4
 * calculators live), Video Call, and Support. Calculators are opened
 * from the Home grid, not cycled through a hidden tab group — with
 * only 4 of them, a grid is clearer and fully keyboard/screen-reader
 * navigable than a "tap again to cycle" pattern. A single-app Play
 * Store build (see App.tsx SINGLE_APP) passes `tabs={['support']}`
 * instead, since Home/Call belong only to the combined app.
 */
interface Tab {
  id: 'home' | 'call' | 'support';
  icon: React.ComponentType<{ size?: number; color?: string }>;
  bn: string; en: string;
  color: string;
}

const TABS: Tab[] = [
  { id: 'home',    icon: FaHome,           bn: 'হোম',     en: 'Home',    color: 'var(--text)' },
  { id: 'call',    icon: FaVideo,          bn: 'ভিডিও কল', en: 'Call',    color: '#06b6d4' },
  { id: 'support', icon: FaQuestionCircle, bn: 'সাপোর্ট',  en: 'Support', color: '#c41e3a' },
];

interface Props {
  activeId: string | null;
  onOpen: (id: string) => void;
  onShowHome: () => void;
  /** Which tabs to show, in order. Defaults to all three. A single-app
   * Play Store build passes just ['support'] — Home and Call are part of
   * the combined app's navigation and don't belong in a standalone
   * install of e.g. just Maternity Benefit. */
  tabs?: Array<'home' | 'call' | 'support'>;
}

export default function BottomNav({ activeId, onOpen, onShowHome, tabs }: Props) {
  const { lang } = useLang();
  const { isDark } = useTheme();
  const isHome = !activeId;
  const visibleTabs = tabs ? TABS.filter(t => tabs.includes(t.id)) : TABS;

  const handleTap = (tab: Tab) => {
    if (tab.id === 'home') { onShowHome(); return; }
    onOpen(tab.id);
  };

  return (
    <nav
      aria-label={lang === 'bn' ? 'প্রধান নেভিগেশন' : 'Primary navigation'}
      style={{
        flexShrink: 0,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 200,
        boxShadow: 'var(--shadow-nav)',
      }}
    >
      <div style={{ display: 'flex', height: 58, maxWidth: 720, margin: '0 auto', width: '100%' }}>
        {visibleTabs.map(tab => {
          const isActive = tab.id === 'home' ? isHome : activeId === tab.id;
          const Icon = tab.icon;
          const tint = tab.color.startsWith('#') ? accentInk(tab.color, isDark) : tab.color;
          const label = lang === 'bn' ? tab.bn : tab.en;
          return (
            <button
              key={tab.id}
              onClick={() => handleTap(tab)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                border: 'none', background: 'none', cursor: 'pointer',
                padding: '6px 2px 4px', position: 'relative',
                minHeight: 44,
                transition: 'transform 0.1s',
              }}
              onTouchStart={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.85)'}
              onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
            >
              {isActive && (
                <div aria-hidden style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24, height: 2.5, borderRadius: 2,
                  background: tint,
                }} />
              )}
              <div style={{
                width: 30, height: 30, borderRadius: 10,
                background: isActive ? (tab.color.startsWith('#') ? `${tint}20` : 'var(--surface3)') : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.18s',
              }}>
                <Icon size={17} color={isActive ? tint : 'var(--text3)'} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? tint : 'var(--text3)',
                fontFamily: 'inherit', transition: 'color 0.18s',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

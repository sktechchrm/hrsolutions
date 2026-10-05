import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  FaBaby, FaFileContract, FaVideo, FaGoogleDrive, FaIndustry,
  FaQuestionCircle,
} from 'react-icons/fa';

import { LangProvider, useLang } from './context/LangContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { useHistory } from './hooks/useHistory.ts';
import { APPS } from './utils/constants.ts';
import { useTheme } from './context/ThemeContext.tsx';
import { accentInk } from './utils/color.ts';

import HomeScreen from './components/HomeScreen.tsx';
import Header     from './components/Header.tsx';
import BottomNav  from './components/BottomNav.tsx';
import SupportScreen from './components/SupportScreen.tsx';
import CallScreen  from './components/CallScreen.tsx';

import MaternityCalc  from './components/calculators/MaternityCalc.tsx';
import FinalSettlementCalc from './components/calculators/FinalSettlementCalc.tsx';
import DriveShareCalc from './components/calculators/Drivesharecalc.tsx';
import WagesGridCalc  from './components/calculators/Wagesgridcalc.tsx';

// 'call' and 'support' are NOT registered here — neither takes CalcProps
// (no history/onAdd/onClear) — both are special-cased in AppInner below.
const SCREENS: Record<string, React.ComponentType<any>> = {
  maternity:       MaternityCalc,
  finalsettlement: FinalSettlementCalc,
  driveshare:      DriveShareCalc,
  wagesgrid:       WagesGridCalc,
};

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  FaBaby, FaFileContract, FaVideo, FaGoogleDrive, FaIndustry,
};

const APP_LABELS: Record<string, { en: string; bn: string }> = {
  maternity: { en: 'Maternity Benefit', bn: 'মাতৃত্ব সুবিধা' },
  finalsettlement: { en: 'Final Settlement', bn: 'চূড়ান্ত পাওনা' },
  call:     { en: 'Video Call',   bn: 'ভিডিও কল' },
  driveshare: { en: 'Share File',  bn: 'ফাইল শেয়ার' },
  wagesgrid: { en: 'Wages Grid',  bn: 'ওয়েজেস গ্রিড' },
  support:  { en: 'Support',      bn: 'সাপোর্ট' },
};

// One tooltip text per calculator — shown in Header ⓘ button
const APP_INFO: Record<string, { en: string; bn: string }> = {
  maternity: { en: 'Enter your joining date and delivery date (day / month / year).\nEnter monthly wage and number of surviving children.\nPress Calculate to see leave schedule and benefit amount per BD Labour Act, Sec 46.',
               bn: 'যোগদানের তারিখ ও প্রসবের তারিখ দিন (দিন / মাস / বছর)।\nমাসিক মজুরি ও জীবিত সন্তানের সংখ্যা দিন।\nহিসাব চাপুন — শ্রম আইন ধারা ৪৬ অনুযায়ী ছুটির সময়সূচি ও সুবিধা দেখুন।' },
  finalsettlement: { en: 'Enter joining and last attendance dates, and select the type of separation.\nEnter monthly wage, earned leave, and any notice/lay-off days that apply.\nPress Calculate to see the full receivable, deductions, and net payable breakdown.',
               bn: 'যোগদান ও সর্বশেষ উপস্থিতির তারিখ দিন এবং নিষ্পত্তির ধরন বেছে নিন।\nমাসিক মজুরি, অর্জিত ছুটি এবং প্রযোজ্য নোটিশ/লে-অফের দিন দিন।\nহিসাব চাপুন — মোট প্রাপ্য, কর্তন ও নিট প্রদেয়ের সম্পূর্ণ বিবরণ দেখুন।' },
  call:     { en: 'Tap Start call to get a link, and send it to the other person any way you like.\nOr open a link someone sent you to answer.\nWorks browser to browser — no account needed.',
               bn: 'কল শুরু করুন চাপুন, একটি লিংক পাবেন — যেকোনো মাধ্যমে অন্য ব্যক্তিকে পাঠান।\nঅথবা কেউ পাঠানো লিংক খুলে উত্তর দিন।\nব্রাউজার টু ব্রাউজার কাজ করে — কোনো অ্যাকাউন্ট প্রয়োজন নেই।' },
  driveshare: { en: 'Choose a file (or switch to Text / data and type it), then tap Upload & get link.\nGoogle asks you to sign in once. The file is saved in YOUR Google Drive and a download link is created.\nSend the link on WhatsApp — the receiver taps it and the file downloads, no account needed. Tap Stop sharing to switch the link off.',
               bn: 'ফাইল বেছে নিন (অথবা “লেখা / ডাটা” বেছে লিখুন), তারপর “আপলোড ও লিংক নিন” চাপুন।\nপ্রথমবার Google সাইন-ইন চাইবে। ফাইল আপনার নিজের Google Drive-এ জমা হবে এবং ডাউনলোড লিংক তৈরি হবে।\nলিংক WhatsApp-এ পাঠান — প্রাপক ক্লিক করলেই ফাইল ডাউনলোড হবে, অ্যাকাউন্ট লাগবে না। লিংক বন্ধ করতে “শেয়ারিং বন্ধ করুন” চাপুন।' },
  wagesgrid: { en: 'Select the job category, enter each evaluation factor (score or level), and the existing gross wage.\nPress Calculate to see the total score, achieved percentage, and the wage increment payable per the grid.',
               bn: 'পদের ধরন বেছে নিন, প্রতিটি মূল্যায়ন ফ্যাক্টর (স্কোর বা লেভেল) এবং বর্তমান মোট মজুরি দিন।\nহিসাব চাপুন — মোট স্কোর, অর্জিত শতাংশ ও গ্রিড অনুযায়ী প্রদেয় মজুরি বৃদ্ধি দেখুন।' },
  support:  { en: '', bn: '' },
};

/**
 * Single-app mode.
 *
 * The site can be loaded two ways:
 *  - https://…/calculator/            → the combined "HR Smart Solutions"
 *    app: Home grid with all 5 tools, as before.
 *  - https://…/calculator/?app=maternity (or finalsettlement / wagesgrid /
 *    driveshare / call) → opens directly into that ONE tool, with no Home
 *    grid and no way to browse into the other four. This is what each of
 *    the 5 separate Play Store listings points its TWA at (see the
 *    matching public/manifest-<id>.json and PLAY_STORE_5_APPS.md), so
 *    someone who installed "Maternity Benefit" only ever sees Maternity
 *    Benefit — not a grid with four unrelated tools sitting next to it.
 *
 * Read once at module load: the query string doesn't change during the
 * session (there's no in-app link that would add/remove ?app=), so a
 * plain constant is enough — no need to re-parse on every render or wire
 * up routing for what is, in effect, a fixed launch mode per install.
 */
const SINGLE_APP_IDS = ['maternity', 'finalsettlement', 'wagesgrid', 'driveshare', 'call'];
function getSingleAppId(): string | null {
  if (typeof window === 'undefined') return null;
  const requested = new URLSearchParams(window.location.search).get('app');
  return requested && SINGLE_APP_IDS.includes(requested) ? requested : null;
}
const SINGLE_APP = getSingleAppId();

function AppInner() {
  const [activeId, setActiveId] = useState<string | null>(SINGLE_APP);
  const { history, add, clear } = useHistory();
  const { lang } = useLang();
  const { isDark } = useTheme();

  // Point the installable manifest at the matching single-app one, so
  // someone who opens this URL straight in a mobile browser (not via the
  // Play Store) and taps "Add to Home screen" still gets the right name
  // and icon rather than the combined app's.
  useEffect(() => {
    if (!SINGLE_APP) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) link.href = `./manifest-${SINGLE_APP}.json`;
  }, []);

  // In single-app mode there's no Home grid to return to, so "back" goes
  // to this app's own screen instead of null — and the Header hides its
  // back arrow entirely once you're already there (nowhere further to go).
  const handleBack  = useCallback(() => setActiveId(SINGLE_APP), []);
  const handleOpen  = useCallback((id: string) => setActiveId(id), []);
  const handleHome  = useCallback(() => setActiveId(SINGLE_APP), []);
  const showBack    = activeId !== null && (!SINGLE_APP || activeId !== SINGLE_APP);
  // Full app: Home / Call / Support. Single-app install: just Support —
  // Home and Call belong to the combined app's navigation, not this one.
  const navTabs = useMemo<Array<'home' | 'call' | 'support'>>(
    () => (SINGLE_APP ? ['support'] : ['home', 'call', 'support']), []);

  const activeApp   = activeId ? APPS.find(a => a.id === activeId) : null;
  const Screen      = activeId && activeId !== 'support' && activeId !== 'call' ? SCREENS[activeId] : null;
  const ActiveIcon  = activeApp ? ICONS[activeApp.icon] : activeId === 'support' ? FaQuestionCircle : null;
  const activeLabel = activeId ? (APP_LABELS[activeId]?.[lang] || activeId) : '';
  const activeColor = accentInk(activeApp?.color || (activeId === 'support' ? '#c41e3a' : '#7c3aed'), isDark);
  const activeInfo  = activeId ? (APP_INFO[activeId]?.[lang] || '') : '';

  return (
    // .app-shell (index.css) is what actually caps/grows the app's
    // width per breakpoint — full-bleed on phones, a centered card
    // that widens on tablet/desktop so the Home grid (HomeScreen.tsx)
    // gets room to lay out more columns instead of stretching a
    // phone-width layout across a wide browser window.
    <div className="app-shell" style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden',
    }}>
      {/* Content area */}
      <div style={{
        flex: 1, minHeight: 0,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {activeId ? (
          <>
            {/* Header gets info= so it renders the ⓘ tooltip */}
            <Header
              onBack={handleBack}
              showBack={showBack}
              title={activeLabel}
              accent={activeColor}
              icon={ActiveIcon ?? undefined}
              info={activeInfo || undefined}
            />

            {activeId === 'support' ? (
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <SupportScreen />
              </div>
            ) : activeId === 'call' ? (
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <CallScreen />
              </div>
            ) : Screen ? (
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Screen history={history[activeId] || []} onAdd={add} onClear={clear} />
              </div>
            ) : null}
          </>
        ) : (
          <HomeScreen onOpen={handleOpen} history={history} />
        )}
      </div>

      {/* Bottom nav — always visible */}
      <BottomNav
        activeId={activeId}
        onOpen={handleOpen}
        onShowHome={handleHome}
        tabs={navTabs}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AppInner />
      </LangProvider>
    </ThemeProvider>
  );
}

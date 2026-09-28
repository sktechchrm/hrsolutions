import { FaWhatsapp, FaCode, FaShieldAlt, FaMobileAlt, FaUser, FaSave, FaShareAlt, FaLanguage, FaTabletAlt, FaBalanceScale } from 'react-icons/fa';
import { useLang } from '../context/LangContext.tsx';

const WHATSAPP = '8801732484884';

/**
 * Support / About screen.
 * - All colors come from theme CSS variables, so it now follows the
 *   day/night toggle (it used to be hardcoded dark-only).
 * - Contact cards that trigger an action are real <button>s (keyboard
 *   and screen-reader operable), not clickable <div>s.
 * - Copy reflects what the app actually ships today: 4 HR tools plus
 *   Video Call. The old "13+ calculators" claim and the commented-out
 *   objectives block for retired calculators were removed.
 */
export default function SupportScreen() {
  const { lang } = useLang();
  const bn = lang === 'bn';

  const openWhatsApp = () => {
    const msg = encodeURIComponent(bn
      ? 'আসসালামু আলাইকুম, এইচআর স্মার্ট সলিউশনস থেকে সাপোর্টের জন্য যোগাযোগ করছি।'
      : 'Hello, I am contacting for support regarding HR Smart Solutions.');
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) window.location.href = `whatsapp://send?phone=${WHATSAPP}&text=${msg}`;
    else window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };
  const callPhone = () => { window.location.href = 'tel:+8801732484884'; };

  const cardBase: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '12px 10px', textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 6,
    fontFamily: 'inherit', color: 'inherit',
  };

  const contacts = [
    { icon: <FaWhatsapp size={16} color="#128c7e" aria-hidden />, label: 'WhatsApp', val: '01732 484884', action: openWhatsApp },
    { icon: <FaMobileAlt size={16} color="#b8880a" aria-hidden />, label: bn ? 'ফোন' : 'Phone', val: '01732 484884', action: callPhone },
    { icon: <FaUser size={16} color="#8e44ad" aria-hidden />, label: bn ? 'ডেভেলপার' : 'Developer', val: 'Saiful Islam Sumir' },
    { icon: <FaShieldAlt size={16} color="#27ae60" aria-hidden />, label: bn ? 'সংস্করণ' : 'Version', val: 'v2.0.0' },
  ];

  const features: [React.ReactNode, string][] = [
    [<FaBalanceScale key="a" aria-hidden />, bn ? 'শ্রম আইন ভিত্তিক হিসাব' : 'Labour-law based'],
    [<FaSave key="b" aria-hidden />, bn ? 'ইতিহাস সংরক্ষণ' : 'History saved'],
    [<FaShareAlt key="c" aria-hidden />, bn ? 'WhatsApp শেয়ার' : 'WhatsApp share'],
    [<FaLanguage key="d" aria-hidden />, bn ? 'বাংলা ও ইংরেজি' : 'Bangla & English'],
    [<FaTabletAlt key="e" aria-hidden />, bn ? 'মোবাইল, ট্যাবলেট ও ডেস্কটপ' : 'Phone, tablet & desktop'],
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ width: '100%', maxWidth: 760, margin: '0 auto' }}>
        {/* Hero */}
        <div style={{
          background: 'var(--surface)', padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>
            {bn ? 'এইচআর স্মার্ট সলিউশনস' : 'HR Smart Solutions'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, margin: '0 0 16px', lineHeight: 1.5 }}>
            {bn ? 'মাতৃত্ব সুবিধা, চূড়ান্ত পাওনা, ওয়েজেস গ্রিড ও ফাইল পাঠানো — একটি অ্যাপেই'
                : 'Maternity benefit, final settlement, wages grid and file sharing — in one app'}
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '8px 14px',
          }}>
            <FaCode size={14} color="var(--text2)" aria-hidden />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: 0.5 }}>
                {bn ? 'ডেভেলপড বাই' : 'DEVELOPED BY'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 800 }}>SK BD TECHNOLOGY</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          <button onClick={openWhatsApp} style={{
            width: '100%', padding: '16px 20px', minHeight: 48,
            background: '#0b7a62', color: '#fff', border: 'none', borderRadius: 16,
            fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 6px 24px rgba(11,122,98,0.3)', marginBottom: 20,
          }}>
            <FaWhatsapp size={22} aria-hidden />
            {bn ? 'WhatsApp-এ সাপোর্ট নিন' : 'Get WhatsApp Support'}
          </button>

          <h2 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 12px' }}>
            {bn ? 'যোগাযোগ' : 'Contact'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 20 }}>
            {contacts.map(c => {
              const inner = (
                <>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.icon}
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{c.label}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.val}</span>
                </>
              );
              return c.action
                ? <button key={c.label} onClick={c.action} style={{ ...cardBase, cursor: 'pointer', minHeight: 44 }}>{inner}</button>
                : <div key={c.label} style={cardBase}>{inner}</div>;
            })}
          </div>

          <h2 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', letterSpacing: 0.8, textTransform: 'uppercase', margin: '0 0 12px' }}>
            {bn ? 'বৈশিষ্ট্যসমূহ' : 'Key Features'}
          </h2>
          <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
            {features.map(([icon, label]) => (
              <li key={label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: 'var(--text2)', fontWeight: 600,
              }}>
                <span style={{ fontSize: 15, display: 'flex' }}>{icon}</span>{label}
              </li>
            ))}
          </ul>

          <div style={{ textAlign: 'center', padding: '0 0 12px' }}>
            <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>SK BD TECHNOLOGY</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {bn ? 'সর্বস্বত্ব সংরক্ষিত © ২০২৬' : 'All Rights Reserved © 2026'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

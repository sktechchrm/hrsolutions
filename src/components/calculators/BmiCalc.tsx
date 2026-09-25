import { useState } from 'react';
import { FaAppleAlt, FaWalking, FaHospitalAlt, FaExclamationTriangle } from 'react-icons/fa';
import { FloatInput, ResultCard, StatGrid } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#f59e0b';
const CATS = [
  { max: 18.5, en: 'Underweight',    bn: 'ওজন কম',           c: '#38bdf8' },
  { max: 25,   en: 'Normal',         bn: 'স্বাভাবিক',         c: '#10b981' },
  { max: 30,   en: 'Overweight',     bn: 'অতিরিক্ত ওজন',      c: '#f97316' },
  { max: 35,   en: 'Obesity I',      bn: 'স্থূলতা (১ম)',       c: '#ef4444' },
  { max: 40,   en: 'Obesity II',     bn: 'স্থূলতা (২য়)',       c: '#dc2626' },
  { max: Infinity, en: 'Severe Obesity', bn: 'অতি গুরুতর',    c: '#9f1239' },
];
const OB_ADV = [
  { icon: FaAppleAlt,    c: '#10b981', en: 'Improve diet',   bn: 'খাদ্যাভ্যাস পরিবর্তন', en2: 'Eat more vegetables and protein. Reduce sugar.',  bn2: 'শাকসবজি ও প্রোটিন বেশি খান।' },
  { icon: FaWalking,     c: '#0ea5e9', en: 'Daily exercise', bn: 'নিয়মিত হাঁটুন',        en2: 'Walk 30-45 minutes daily.',                      bn2: 'প্রতিদিন ৩০-৪৫ মিনিট হাঁটুন।' },
  { icon: FaHospitalAlt, c: '#ef4444', en: 'See a doctor',   bn: 'ডাক্তার দেখান',         en2: 'BMI over 30 needs medical guidance.',             bn2: 'BMI ৩০+ হলে ডাক্তার দেখান।' },
];
const getCat = (bmi: number) => CATS.find(c => bmi < c.max)!;
const H_REF = [["5'0\"", '60'], ["5'2\"", '62'], ["5'4\"", '64'], ["5'6\"", '66'], ["5'8\"", '68'], ["6'0\"", '72']];

export default function BmiCalc({ history, onAdd, onClear }: CalcProps) {
  const { t, lang } = useLang();
  const b = t.bmi;
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<any>(null);

  const calc = () => {
    const w = parseFloat(weight), hIn = parseFloat(height);
    if (!w || !hIn) { setResult({ error: t.fillFields }); return; }
    const hCm = hIn * 2.54;
    const bmi = parseFloat((w / ((hCm / 100) ** 2)).toFixed(1));
    setResult({ bmi, cat: getCat(bmi), hCm: hCm.toFixed(0) });
    onAdd('bmi', `${w}kg, ${hIn}in → BMI ${bmi}`);
  };

  const pct = result && !result.error ? Math.min(Math.max(((result.bmi - 10) / 30) * 100, 0), 100) : 0;
  const isObese = result && !result.error && result.bmi >= 30;
  const share = result && !result.error
    ? buildShare('BMI', [`${b.weight}: ${weight}kg`, `${b.height}: ${height}in (${result.hCm}cm)`, `BMI: ${result.bmi}`, lang === 'bn' ? result.cat.bn : result.cat.en])
    : null;

  return (
    <CalcShell accent={A} onCalc={calc} calcLabel={t.calculate}
      hasResult={!!(result && !result.error)}
      onShare={() => share && shareWA(share)}
      history={history} onClear={() => onClear?.('bmi')}
      historyLabel={t.history} clearLabel={t.clearHistory}>

      <FloatInput label={b.weight} accent={A} type="number" placeholder="70" value={weight}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)} />
      <FloatInput label={b.height} accent={A} type="number" placeholder="66" value={height}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
        hint={lang === 'bn' ? 'ইঞ্চিতে। ৫ ফুট ৬ ইঞ্চি = ৬৬' : "In inches. 5'6\" = 66"} />

      <div style={{ background: 'var(--surface)', border: '1px solid #3d3010', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: A, marginBottom: 6 }}>{b.heightRef}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
          {H_REF.map(([f, i]) => (
            <button key={i} onClick={() => setHeight(i)}
              style={{ background: 'none', border: 'none', color: A, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', padding: '2px 0' }}>
              {f}={i}"
            </button>
          ))}
        </div>
      </div>

      {result && !result.error && (
        <>
          <ResultCard accent={result.cat.c}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 'clamp(40px,10vw,56px)', fontWeight: 900, color: result.cat.c, lineHeight: 1 }}>{result.bmi}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: result.cat.c, marginTop: 6 }}>{lang === 'bn' ? result.cat.bn : result.cat.en}</div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, height: 14, overflow: 'hidden', position: 'relative', display: 'flex', marginBottom: 6 }}>
              {[['#38bdf8', 25], ['#10b981', 18], ['#f97316', 14], ['#ef4444', 14], ['#dc2626', 14], ['#9f1239', 15]].map(([c, w]: any) => (
                <div key={c as string} style={{ width: (w as number) + '%', background: c as string }} />
              ))}
              <div style={{ position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translateX(-50%) translateY(-50%)', width: 18, height: 18, background: '#fff', border: `3px solid ${result.cat.c}`, borderRadius: '50%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text3)' }}>
              <span>{'<'}18.5</span><span>25</span><span>30</span><span>30+</span>
            </div>
            <StatGrid items={[[b.weight, `${weight}kg`, A], [b.height, `${height}" (${result.hCm}cm)`, A]]} cols={2} />
          </ResultCard>

          {isObese && (
            <div style={{ marginTop: 14, background: 'var(--surface)', border: '2px solid #7f1d1d', borderRadius: 16, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FaExclamationTriangle color="#ef4444" size={16} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5' }}>{b.obesityTitle}</span>
              </div>
              {OB_ADV.map(a2 => (
                <div key={a2.en} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                  <a2.icon size={16} color={a2.c} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: a2.c }}>{lang === 'bn' ? a2.bn : a2.en}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, lineHeight: 1.5 }}>{lang === 'bn' ? a2.bn2 : a2.en2}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {result?.error && <div style={{ color: '#ef4444', fontSize: 14, marginTop: 10, fontWeight: 600 }}>{result.error}</div>}
    </CalcShell>
  );
}

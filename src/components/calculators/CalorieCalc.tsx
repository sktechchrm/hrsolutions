import { useState } from 'react';
import { FloatInput, ToggleGroup, ResultCard, StatGrid } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#ef4444';
const ACTS = [
  { v: '1.2',   bn: 'নিষ্ক্রিয়',    en: 'Sedentary',   d2: 'প্রায় বসে থাকেন',   d2e: 'Little/no exercise' },
  { v: '1.375', bn: 'হালকা',          en: 'Light',       d2: 'সপ্তাহে ১-৩ দিন',   d2e: '1-3 days/week' },
  { v: '1.55',  bn: 'মাঝারি',         en: 'Moderate',    d2: 'সপ্তাহে ৩-৫ দিন',   d2e: '3-5 days/week' },
  { v: '1.725', bn: 'সক্রিয়',         en: 'Active',      d2: 'সপ্তাহে ৬-৭ দিন',   d2e: '6-7 days/week' },
  { v: '1.9',   bn: 'অতি সক্রিয়',    en: 'Very Active', d2: 'কঠোর পরিশ্রম',      d2e: 'Hard daily training' },
];

export default function CalorieCalc({ history, onAdd, onClear }: CalcProps) {
  const { t, lang } = useLang();
  const c = t.calorie;
  const [gender, setGender] = useState('male');
  const [age, setAge]       = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [act, setAct]       = useState('1.55');
  const [result, setResult] = useState<any>(null);

  const calc = () => {
    const a = parseFloat(age), w = parseFloat(weight), hIn = parseFloat(height);
    if (!a || !w || !hIn) { setResult({ error: t.fillFields }); return; }
    const h = hIn * 2.54;
    const bmr = gender === 'male'
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;
    const tdee = Math.round(bmr * parseFloat(act));
    setResult({ tdee, bmr: Math.round(bmr), loss: Math.round(tdee - 500), gain: Math.round(tdee + 500) });
    onAdd('calorie', `${gender === 'male' ? 'M' : 'F'}, ${a}yr, ${w}kg → ${tdee}kcal/day`);
  };

  const share = result && !result.error
    ? buildShare('Calorie', [`${c.maintenance}: ${result.tdee}kcal`, `${c.lose}: ${result.loss}`, `${c.gain}: ${result.gain}`])
    : null;

  return (
    <CalcShell accent={A} onCalc={calc} calcLabel={t.calculate}
      hasResult={!!(result && !result.error)}
      onShare={() => share && shareWA(share)}
      history={history} onClear={() => onClear?.('calorie')}
      historyLabel={t.history} clearLabel={t.clearHistory}>

      <ToggleGroup options={[['male', `${t.male}`], ['female', `${t.female}`]]} value={gender} onChange={setGender} accent={A} />
      <FloatInput label={c.age}    accent={A} type="number" placeholder="25" value={age}    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAge(e.target.value)} />
      <FloatInput label={c.weight} accent={A} type="number" placeholder="70" value={weight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeight(e.target.value)} />
      <FloatInput label={c.height} accent={A} type="number" placeholder="66" value={height} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
        hint={lang === 'bn' ? "ইঞ্চিতে। ৫'৬\" = ৬৬" : "In inches. 5'6\" = 66"} />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 8 }}>{c.activity}</div>
        {ACTS.map(l => (
          <button key={l.v} onClick={() => setAct(l.v)} style={{
            width: '100%', padding: '11px 14px', textAlign: 'left', marginBottom: 8,
            background: act === l.v ? `${A}15` : 'var(--surface)',
            border: `2px solid ${act === l.v ? A : 'var(--border)'}`,
            borderRadius: 12, cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: act === l.v ? A : 'var(--text2)' }}>{lang === 'bn' ? l.bn : l.en}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{lang === 'bn' ? l.d2 : l.d2e}</span>
          </button>
        ))}
      </div>

      {result && !result.error && (
        <ResultCard accent={A}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>{c.maintenance}</div>
            <div style={{ fontSize: 'clamp(34px,8vw,44px)', fontWeight: 900, color: A, lineHeight: 1.2 }}>{result.tdee}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>kcal / {lang === 'bn' ? 'দিন' : 'day'}</div>
          </div>
          <StatGrid items={[[c.lose, result.loss, '#0ea5e9'], [c.maintain, result.tdee, A], [c.gain, result.gain, '#10b981']]} cols={3} />
        </ResultCard>
      )}
      {result?.error && <div style={{ color: '#ef4444', fontSize: 14, marginTop: 10, fontWeight: 600 }}>{result.error}</div>}
    </CalcShell>
  );
}

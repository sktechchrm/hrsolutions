import { useState } from 'react';
import { FloatInput, ToggleGroup, ResultCard, StatGrid } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#f97316';

function getSizeFromChest(chest: number, gender: string) {
  const male:   [string, number][] = [['3XL', 47], ['2XL', 45], ['XL', 43], ['L', 40], ['M', 37], ['S', 34], ['XS', 0]];
  const female: [string, number][] = [['2XL', 42], ['XL', 40], ['L', 37], ['M', 35], ['S', 32], ['XS', 0]];
  const chart = gender === 'male' ? male : female;
  for (const [size, min] of chart) { if (chest > min) return size; }
  return 'XS';
}

export default function GarmentsCalc({ history, onAdd, onClear }: CalcProps) {
  const { t, lang } = useLang();
  const g = t.garments;
  const [gender,   setGender]   = useState('male');
  const [chest,    setChest]    = useState('');
  const [waist,    setWaist]    = useState('');
  const [hip,      setHip]      = useState('');
  const [shoulder, setShoulder] = useState('');
  const [sleeve,   setSleeve]   = useState('');
  const [height,   setHeight]   = useState('');
  const [result,   setResult]   = useState<any>(null);

  const calc = () => {
    const c = parseFloat(chest);
    if (!c || c <= 0) { setResult({ error: t.fillFields }); return; }
    const size = getSizeFromChest(c, gender);
    setResult({
      size,
      chestCm:  (c * 2.54).toFixed(1),
      waistCm:  waist    ? (parseFloat(waist)    * 2.54).toFixed(1) : null,
      hipCm:    hip      ? (parseFloat(hip)      * 2.54).toFixed(1) : null,
    });
    onAdd('garments', `${gender === 'male' ? 'M' : 'F'}, Chest:${c}" → ${size}`);
  };

  const share = result && !result.error
    ? buildShare('Garments', [`${lang === 'bn' ? 'লিঙ্গ' : 'Gender'}: ${gender}`, `${g.chest}: ${chest}" (${result.chestCm}cm)`, `${g.recommended}: ${result.size}`])
    : null;

  return (
    <CalcShell accent={A}
      info={lang === 'bn'
        ? `• বুকের মাপ ইঞ্চিতে দিন (আবশ্যক)\n• কোমর, হিপ, কাঁধ ঐচ্ছিক\n• হিসাব চাপুন`
        : `• Enter chest measurement in inches (required)\n• Waist, hip, shoulder are optional\n• Press Calculate`}
      onCalc={calc} calcLabel={t.calculate}
      hasResult={!!(result && !result.error)}
      onShare={() => share && shareWA(share)}
      history={history} onClear={() => onClear?.('garments')}
      historyLabel={t.history} clearLabel={t.clearHistory}>

      <ToggleGroup options={[['male', `👨 ${t.male}`], ['female', `👩 ${t.female}`]]} value={gender} onChange={setGender} accent={A} />
      <FloatInput label={`${g.chest} *`}  accent={A} type="number" placeholder="38" value={chest}    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChest(e.target.value)}    hint={lang === 'bn' ? '* আবশ্যক' : '* Required'} />
      <FloatInput label={g.waist}          accent={A} type="number" placeholder="32" value={waist}    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWaist(e.target.value)} />
      <FloatInput label={g.hip}            accent={A} type="number" placeholder="40" value={hip}      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHip(e.target.value)} />
      <FloatInput label={g.shoulder}       accent={A} type="number" placeholder="17" value={shoulder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShoulder(e.target.value)} />
      <FloatInput label={g.sleeve}         accent={A} type="number" placeholder="25" value={sleeve}   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSleeve(e.target.value)} />
      <FloatInput label={g.height}         accent={A} type="number" placeholder="66" value={height}   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)} />

      {result && !result.error && (
        <ResultCard accent={A}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>{g.recommended}</div>
            <div style={{ fontSize: 'clamp(48px,12vw,64px)', fontWeight: 900, color: A, lineHeight: 1 }}>{result.size}</div>
          </div>
          <StatGrid items={[
            [g.chest,    `${chest}" / ${result.chestCm}cm`,                          A],
            [g.waist,    waist    ? `${waist}" / ${result.waistCm}cm`    : '—',       A],
            [g.hip,      hip      ? `${hip}" / ${result.hipCm}cm`        : '—',       A],
            [g.shoulder, shoulder ? `${shoulder}"`                        : '—',       A],
          ]} cols={2} />
        </ResultCard>
      )}
      {result?.error && <div style={{ color: '#ef4444', fontSize: 14, marginTop: 10, fontWeight: 600 }}>⚠️ {result.error}</div>}
    </CalcShell>
  );
}

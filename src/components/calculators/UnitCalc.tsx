import { useState } from 'react';
import { FloatInput, FloatSelect, ResultCard } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#3b82f6';

const UNITS: Record<string, any> = {
  length:      { en: 'Length',      bn: 'দৈর্ঘ্য',    units: ['meter','kilometer','centimeter','millimeter','inch','foot','yard','mile'],             labels: { meter:'Meter (m)', kilometer:'Kilometer (km)', centimeter:'Centimeter (cm)', millimeter:'Millimeter (mm)', inch:'Inch (in)', foot:'Foot (ft)', yard:'Yard (yd)', mile:'Mile (mi)' },        toBase: { meter:1, kilometer:1000, centimeter:0.01, millimeter:0.001, inch:0.0254, foot:0.3048, yard:0.9144, mile:1609.344 } },
  weight:      { en: 'Weight',      bn: 'ওজন',        units: ['kilogram','gram','milligram','pound','ounce','ton','maund','seer'],                      labels: { kilogram:'Kilogram (kg)', gram:'Gram (g)', milligram:'Milligram (mg)', pound:'Pound (lb)', ounce:'Ounce (oz)', ton:'Metric Ton', maund:'Maund (মণ)', seer:'Seer (সের)' },               toBase: { kilogram:1, gram:0.001, milligram:0.000001, pound:0.453592, ounce:0.0283495, ton:1000, maund:37.3242, seer:0.933105 } },
  temperature: { en: 'Temperature', bn: 'তাপমাত্রা',  units: ['celsius','fahrenheit','kelvin'],                                                         labels: { celsius:'Celsius (°C)', fahrenheit:'Fahrenheit (°F)', kelvin:'Kelvin (K)' },                                                                           toBase: null },
  area:        { en: 'Area',        bn: 'ক্ষেত্রফল',  units: ['squaremeter','squarefoot','squareinch','acre','hectare','bigha','katha'],                labels: { squaremeter:'m²', squarefoot:'ft²', squareinch:'in²', acre:'Acre', hectare:'Hectare', bigha:'Bigha (বিঘা)', katha:'Katha (কাঠা)' },               toBase: { squaremeter:1, squarefoot:0.092903, squareinch:0.000645, acre:4046.86, hectare:10000, bigha:1338.46, katha:66.89 } },
  volume:      { en: 'Volume',      bn: 'আয়তন',       units: ['liter','milliliter','gallon','cup','tablespoon','teaspoon'],                             labels: { liter:'Liter (L)', milliliter:'mL', gallon:'Gallon (US)', cup:'Cup', tablespoon:'Tablespoon', teaspoon:'Teaspoon' },                               toBase: { liter:1, milliliter:0.001, gallon:3.78541, cup:0.236588, tablespoon:0.0147868, teaspoon:0.00492892 } },
  speed:       { en: 'Speed',       bn: 'গতি',         units: ['kph','mph','mps','knot'],                                                                labels: { kph:'km/h', mph:'mph', mps:'m/s', knot:'Knot' },                                                                                                   toBase: { kph:1, mph:1.60934, mps:3.6, knot:1.852 } },
};

const CATS = ['length', 'weight', 'temperature', 'area', 'volume', 'speed'];
const CAT_ICONS: Record<string, string> = { length:'📏', weight:'⚖️', temperature:'🌡️', area:'📐', volume:'🧊', speed:'💨' };

function convTemp(v: number, from: string, to: string) {
  const c = from === 'celsius' ? v : from === 'fahrenheit' ? (v - 32) * 5 / 9 : v - 273.15;
  return to === 'celsius' ? c : to === 'fahrenheit' ? c * 9 / 5 + 32 : c + 273.15;
}

export default function UnitCalc({ history, onAdd, onClear }: CalcProps) {
  const { t, lang } = useLang();
  const u = t.unit;
  const [cat,   setCat]   = useState('length');
  const [fromU, setFromU] = useState('meter');
  const [toU,   setToU]   = useState('kilometer');
  const [val,   setVal]   = useState('');
  const [result, setResult] = useState<any>(null);

  const data = UNITS[cat];

  const calc = () => {
    const v = parseFloat(val);
    if (isNaN(v)) { setResult({ error: t.fillFields }); return; }
    let res = cat === 'temperature'
      ? convTemp(v, fromU, toU)
      : (v * data.toBase[fromU]) / data.toBase[toU];
    const display = Math.abs(res) < 0.00001 || Math.abs(res) > 1e10
      ? res.toExponential(4)
      : parseFloat(res.toFixed(6));
    setResult(display);
    onAdd('unit', `${v} ${fromU} = ${display} ${toU}`);
  };

  const share = result !== null && !result?.error
    ? buildShare('Unit', [`${val} ${data.labels[fromU]} = ${result} ${data.labels[toU]}`])
    : null;

  const changeCategory = (c: string) => {
    setCat(c);
    setFromU(UNITS[c].units[0]);
    setToU(UNITS[c].units[1]);
    setResult(null);
    setVal('');
  };

  return (
    <CalcShell accent={A}
      info={lang === 'bn'
        ? `• বিভাগ বেছে নিন\n• মান দিন\n• একক বেছে নিন\n• হিসাব চাপুন`
        : `• Select category\n• Enter value\n• Select units\n• Press Calculate`}
      onCalc={calc} calcLabel={t.calculate}
      hasResult={result !== null && !result?.error}
      onShare={() => share && shareWA(share)}
      history={history} onClear={() => onClear?.('unit')}
      historyLabel={t.history} clearLabel={t.clearHistory}>

      {/* Category grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 16 }}>
        {CATS.map(c => (
          <button key={c} onClick={() => changeCategory(c)} style={{
            padding: '10px 6px',
            background: cat === c ? A : 'var(--surface)',
            color: cat === c ? '#fff' : 'var(--text3)',
            border: `2px solid ${cat === c ? A : 'var(--border)'}`,
            borderRadius: 10, fontSize: 12, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <span style={{ fontSize: 18 }}>{CAT_ICONS[c]}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {lang === 'bn' ? UNITS[c].bn : UNITS[c].en}
            </span>
          </button>
        ))}
      </div>

      <FloatInput label={u.value} accent={A} type="number" placeholder="1" value={val}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 1fr', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <FloatSelect label={u.from} accent={A} value={fromU} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFromU(e.target.value)}>
          {data.units.map((u2: string) => <option key={u2} value={u2}>{data.labels[u2]}</option>)}
        </FloatSelect>
        <div style={{ textAlign: 'center', color: A, fontSize: 20, fontWeight: 700, paddingTop: 8 }}>⇄</div>
        <FloatSelect label={u.to} accent={A} value={toU} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setToU(e.target.value)}>
          {data.units.map((u2: string) => <option key={u2} value={u2}>{data.labels[u2]}</option>)}
        </FloatSelect>
      </div>

      {result !== null && !result?.error && (
        <ResultCard accent={A}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>{val} {data.labels[fromU]}</div>
            <div style={{ fontSize: 'clamp(28px,7vw,38px)', fontWeight: 900, color: A, lineHeight: 1.2, wordBreak: 'break-word' }}>{result}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginTop: 4 }}>{data.labels[toU]}</div>
          </div>
        </ResultCard>
      )}
      {result?.error && <div style={{ color: '#ef4444', fontSize: 14, marginTop: 10, fontWeight: 600 }}>⚠️ {result.error}</div>}
    </CalcShell>
  );
}

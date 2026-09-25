import { useState } from 'react';
import { FloatInput, ResultCard } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#7c3aed';

interface WeightUnit { label: string; labelBn: string; toKg: number; }
const WEIGHT_UNITS: Record<string, WeightUnit> = {
  kg:      { label: 'Kilogram', labelBn: 'কেজি',   toKg: 1          },
  gram:    { label: 'Gram',     labelBn: 'গ্রাম',   toKg: 0.001      },
  maund:   { label: 'Maund',    labelBn: 'মণ',      toKg: 37.3242    },
  seer:    { label: 'Seer',     labelBn: 'সের',     toKg: 0.9331     },
  powa:    { label: 'Powa',     labelBn: 'পোয়া',   toKg: 0.2333     },
  chattak: { label: 'Chattak',  labelBn: 'ছটাক',    toKg: 0.05832    },
  pound:   { label: 'Pound',    labelBn: 'পাউন্ড',  toKg: 0.453592   },
};
const WEIGHT_ORDER = ['kg','gram','maund','seer','powa','chattak','pound'];

export default function BdWeightCalc({ history, onAdd, onClear }: CalcProps) {
  const { lang } = useLang();
  const bn = lang === 'bn';
  const [weightVal,  setWeightVal]  = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [rateVal,    setRateVal]    = useState('');
  const [result,     setResult]     = useState<any>(null);

  const calc = () => {
    const w = parseFloat(weightVal), r = parseFloat(rateVal);
    if (!w || w <= 0 || !r || r <= 0) {
      setResult({ error: bn ? 'ওজন ও মূল্য/কেজি সঠিকভাবে দিন।' : 'Enter weight and rate per kg.' });
      return;
    }
    const kg    = w * WEIGHT_UNITS[weightUnit].toKg;
    const total = kg * r;
    const unitLabel = bn ? WEIGHT_UNITS[weightUnit].labelBn : WEIGHT_UNITS[weightUnit].label;
    setResult({
      totalTaka:     total.toFixed(2),
      weightKg:      kg.toFixed(4),
      ratePerKg:     r.toFixed(2),
      displayWeight: `${w} ${unitLabel}`,
    });
    onAdd('bdweight', `${w} ${weightUnit} x ${r}/kg = ${total.toFixed(2)}`);
  };

  const res = result && !('error' in result) ? result : null;

  return (
    <CalcShell accent={A} onCalc={calc} calcLabel={bn ? 'হিসাব করুন' : 'Calculate'}
      hasResult={!!res}
      onShare={() => {
        if (res) shareWA(buildShare('Weight', [`${res.displayWeight} x ${res.ratePerKg}/kg`, `= ${res.totalTaka}`]));
      }}
      history={history} onClear={() => onClear?.('bdweight')}
      historyLabel={bn ? 'ইতিহাস' : 'History'} clearLabel={bn ? 'মুছুন' : 'Clear'}>

      <FloatInput
        label={bn ? 'ওজন / পরিমাণ' : 'Weight / Quantity'}
        accent={A} type="number" placeholder="1.03" value={weightVal}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightVal(e.target.value)}
      />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 8 }}>
          {bn ? 'ওজনের একক:' : 'Weight Unit:'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {WEIGHT_ORDER.map(u => (
            <button key={u} onClick={() => setWeightUnit(u)} style={{
              padding: '9px 4px', fontSize: 10, fontWeight: 700,
              background: weightUnit === u ? A : 'var(--surface)',
              color: weightUnit === u ? '#fff' : 'var(--text3)',
              border: `1.5px solid ${weightUnit === u ? A : 'var(--border)'}`,
              borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
            }}>
              {bn ? WEIGHT_UNITS[u].labelBn : WEIGHT_UNITS[u].label}
            </button>
          ))}
        </div>
      </div>

      <FloatInput
        label={bn ? 'মূল্য / কেজি (BDT)' : 'Rate per kg (BDT)'}
        accent={A} type="number" placeholder="120" value={rateVal}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRateVal(e.target.value)}
        hint={bn ? 'প্রতি কেজি দাম লিখুন' : 'Price per 1 kg in Taka'}
      />

      {res && (
        <ResultCard accent={A}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>
              {bn ? 'মোট মূল্য' : 'Total Price'}
            </div>
            <div style={{ fontSize: 'clamp(32px,8vw,44px)', fontWeight: 900, color: A, fontFamily: 'monospace' }}>
              {res.totalTaka}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>BDT</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              [bn ? 'ওজন'      : 'Weight',   res.displayWeight],
              [bn ? 'কেজিতে'  : 'In kg',    res.weightKg + ' kg'],
              [bn ? 'মূল্য/কেজি' : 'Rate/kg', res.ratePerKg],
            ].map(([l, v]) => (
              <div key={l} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: A, wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
            {res.weightKg} kg × {res.ratePerKg} = <strong style={{ color: A }}>{res.totalTaka}</strong>
          </div>
        </ResultCard>
      )}
      {result && 'error' in result && <div style={{ color: '#ef4444', fontSize: 14, marginTop: 10, fontWeight: 600 }}>{result.error}</div>}
    </CalcShell>
  );
}

import { useState } from 'react';
import { FloatInput, ResultCard } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#16a34a';

interface LandUnit { label: string; labelBn: string; toSqft: number; }
const LAND_UNITS: Record<string, LandUnit> = {
  sqft:    { label: 'Square Feet',   labelBn: 'বর্গফুট',        toSqft: 1        },
  sqm:     { label: 'Square Meter',  labelBn: 'বর্গমিটার',      toSqft: 10.7639  },
  sqyard:  { label: 'Square Yard',   labelBn: 'বর্গগজ',         toSqft: 9        },
  decimal: { label: 'Decimal',       labelBn: 'শতাংশ/ডেসিমেল', toSqft: 435.6    },
  katha:   { label: 'Katha',         labelBn: 'কাঠা',            toSqft: 720      },
  chattak: { label: 'Chattak',       labelBn: 'ছটাক',            toSqft: 45       },
  aana:    { label: 'Aana',          labelBn: 'আনা',             toSqft: 900      },
  ganda:   { label: 'Ganda',         labelBn: 'গণ্ডা',           toSqft: 3600     },
  bigha:   { label: 'Bigha',         labelBn: 'বিঘা',            toSqft: 14400    },
  kani:    { label: 'Kani',          labelBn: 'কানি',            toSqft: 43560    },
  acre:    { label: 'Acre',          labelBn: 'একর',             toSqft: 43560    },
  hectare: { label: 'Hectare',       labelBn: 'হেক্টর',          toSqft: 107639.1 },
};
const LAND_ORDER = ['sqft','sqm','sqyard','decimal','katha','chattak','aana','ganda','bigha','kani','acre','hectare'];

export default function BdLandCalc({ history, onAdd, onClear }: CalcProps) {
  const { lang } = useLang();
  const bn = lang === 'bn';
  const [value,    setValue]    = useState('');
  const [fromUnit, setFromUnit] = useState('katha');
  const [result,   setResult]   = useState<any>(null);

  const calc = () => {
    const v = parseFloat(value);
    if (!v || v <= 0) { setResult({ error: bn ? 'সঠিক মান দিন।' : 'Enter a valid value.' }); return; }
    const sqft = v * LAND_UNITS[fromUnit].toSqft;
    const conversions: Record<string, number> = {};
    LAND_ORDER.forEach(u => { conversions[u] = parseFloat((sqft / LAND_UNITS[u].toSqft).toFixed(6)); });
    setResult({ from: `${v} ${bn ? LAND_UNITS[fromUnit].labelBn : LAND_UNITS[fromUnit].label}`, conversions });
    onAdd('bdland', `${v} ${fromUnit} = ${conversions['katha']} katha = ${conversions['bigha']} bigha`);
  };

  const res = result && !('error' in result) ? result : null;

  return (
    <CalcShell accent={A} onCalc={calc} calcLabel={bn ? 'রূপান্তর করুন' : 'Convert'}
      hasResult={!!res}
      onShare={() => {
        if (res) shareWA(buildShare('Land', [
          `${res.from}`,
          `= ${res.conversions['decimal']} ${bn ? 'শতাংশ' : 'Decimal'}`,
          `= ${res.conversions['katha']} ${bn ? 'কাঠা' : 'Katha'}`,
          `= ${res.conversions['bigha']} ${bn ? 'বিঘা' : 'Bigha'}`,
          `= ${res.conversions['sqft']} sqft`,
        ]));
      }}
      history={history} onClear={() => onClear?.('bdland')}
      historyLabel={bn ? 'ইতিহাস' : 'History'} clearLabel={bn ? 'মুছুন' : 'Clear'}>

      <FloatInput label={bn ? 'পরিমাণ' : 'Value'} accent={A} type="number" placeholder="1" value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)} />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 8 }}>
          {bn ? 'কোন একক থেকে?' : 'Convert From:'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {LAND_ORDER.map(u => (
            <button key={u} onClick={() => setFromUnit(u)} style={{
              padding: '8px 4px', fontSize: 10, fontWeight: 700,
              background: fromUnit === u ? A : 'var(--surface)',
              color: fromUnit === u ? '#fff' : 'var(--text3)',
              border: `1.5px solid ${fromUnit === u ? A : 'var(--border)'}`,
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
            }}>
              {bn ? LAND_UNITS[u].labelBn : LAND_UNITS[u].label}
            </button>
          ))}
        </div>
      </div>

      {res && (
        <ResultCard accent={A}>
          <div style={{ fontSize: 12, fontWeight: 700, color: A, marginBottom: 10 }}>{res.from} =</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {LAND_ORDER.filter(u => u !== fromUnit).map(u => (
              <div key={u} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 2 }}>
                  {bn ? LAND_UNITS[u].labelBn : LAND_UNITS[u].label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: A }}>{res.conversions[u]}</div>
              </div>
            ))}
          </div>
        </ResultCard>
      )}
      {result && 'error' in result && <div style={{ color: '#ef4444', fontSize: 14, marginTop: 10, fontWeight: 600 }}>{result.error}</div>}
    </CalcShell>
  );
}

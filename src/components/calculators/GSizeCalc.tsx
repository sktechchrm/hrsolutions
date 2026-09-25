import { useState } from 'react';
import { ToggleGroup } from '../ui';
import { useLang } from '../../context/LangContext.tsx';
import { SIZE_DATA } from '../../data/garmentsSizes.ts';

const A = '#ec4899';

export default function GSizeCalc() {
  const { t, lang } = useLang();
  const g = t.gsize;
  const [cat,    setCat]    = useState('shirt');
  const [gender, setGender] = useState('male');

  const data    = (SIZE_DATA as any)[cat]?.[gender] || [];
  const isShoes = cat === 'shoes';
  const headers = isShoes
    ? ['BD', 'US', 'UK', 'EU', 'Asia']
    : ['Size', 'BD', 'US', 'UK', 'EU', 'Asia', lang === 'bn' ? 'রেফ' : 'Ref'];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Noto Serif Bengali','Outfit',sans-serif",
    }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px', scrollbarWidth: 'thin' } as React.CSSProperties}>

        <ToggleGroup
          options={[['male', `👨 ${t.male}`], ['female', `👩 ${t.female}`]]}
          value={gender} onChange={setGender} accent={A}
        />

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['shirt', g.shirt], ['pants', g.pants], ['shoes', g.shoes]].map(([v, l]) => (
            <button key={v} onClick={() => setCat(v)} style={{
              flex: 1, padding: '10px 6px',
              background: cat === v ? A : 'var(--surface)',
              color: cat === v ? '#fff' : 'var(--text3)',
              border: `2px solid ${cat === v ? A : 'var(--border)'}`,
              borderRadius: 10, fontSize: 12, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>

        {/* Size table */}
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 320 }}>
            <thead>
              <tr style={{ background: A }}>
                {headers.map((h: string) => (
                  <th key={h} style={{ padding: '10px 8px', color: '#fff', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, i: number) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                  {(isShoes
                    ? [row.bd, row.us, row.uk, row.eu, row.asia]
                    : [row.s, row.bd, row.us, row.uk, row.eu, row.asia, row.ref]
                  ).map((v: string, j: number) => (
                    <td key={j} style={{
                      padding: '10px 8px', textAlign: 'center',
                      fontWeight: j === 0 ? 800 : 500,
                      color: j === 0 ? A : 'var(--text2)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                    }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
          {lang === 'bn' ? '* সাইজ প্রস্তুতকারক ভেদে ভিন্ন হতে পারে।' : '* Sizes may vary between manufacturers.'}
        </div>
      </div>
    </div>
  );
}

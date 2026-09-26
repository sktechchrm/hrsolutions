import { useState } from 'react';
import {
  FaIndustry, FaCheckCircle, FaInfoCircle, FaChartBar,
  FaClipboardList, FaCoins, FaExclamationTriangle, FaPrint,
} from 'react-icons/fa';
import { FloatInput, ResultCard, StatGrid } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#b45309';

/* ──────────────────────────────────────────────────────────────
   Ported from an actual RMG factory's "Wages Grid 2021" workbook
   (4 tabs: Finishing Iron Man, Sewing Iron Man, Quality, Operator).
   Every threshold below is copied from that workbook's formulas —
   including a couple of inconsistencies in the source itself (see
   the note on Finishing/Quality's Level-vs-Quota bands, and the
   Sewing Efficiency table's undefined 45–255 gap). These are
   flagged rather than "corrected", since they're the factory's own
   real policy, not a bug in this port.
   ────────────────────────────────────────────────────────────── */
const FIXED_ALLOWANCE = 1850; // flat non-basic component the source sheet subtracts from gross
const FLOOR_PCT = 0.09; // guaranteed minimum increment rate — does NOT apply to new joiners

type FactorMode = 'score' | 'level';
type Band = [number, number]; // [minimum value (inclusive), result] — checked highest-first

interface FactorDef {
  key: string;
  label: { bn: string; en: string };
  mode: FactorMode;
  bands: Band[];        // score mode: score→level bands. level mode: level→score bands.
  maxHint?: number;      // for score-mode inputs, a sensible upper bound to hint at
}

interface CategoryDef {
  id: string;
  label: { bn: string; en: string };
  factors: FactorDef[];
  levelBands: Band[];
  gradeBands: Band[];
  quotaBands: Band[];
}

function lookup(value: number, bands: Band[]): number {
  for (const [min, result] of bands) {
    if (value >= min) return result;
  }
  return 0;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'finishing',
    label: { bn: 'ফিনিশিং আয়রন ম্যান', en: 'Finishing Iron Man' },
    factors: [
      { key: 'efficiency', label: { bn: 'দক্ষতা', en: 'Efficiency' }, mode: 'score', maxHint: 700,
        bands: [[608, 4], [532, 3], [456, 2], [380, 1], [0, 0]] },
      { key: 'experience', label: { bn: 'অভিজ্ঞতা', en: 'Experience' }, mode: 'level',
        bands: [[4, 40], [3, 30], [2, 20], [1, 10], [0, 0]] },
      { key: 'attendance', label: { bn: 'উপস্থিতি', en: 'Attendance' }, mode: 'level',
        bands: [[4, 50], [3, 40], [2, 30], [1, 20], [0, 0]] },
      { key: 'discipline', label: { bn: 'শৃঙ্খলা', en: 'Discipline' }, mode: 'level',
        bands: [[4, 50], [3, 40], [2, 30], [1, 20], [0, 0]] },
    ],
    // NOTE: the source workbook uses 576 for Level/Grade's third band but
    // 676 for Quota's third band — a 100-point gap where Level Ach. reads
    // "2" while Quota still reads the level-1 rate. Kept exactly as-is.
    levelBands: [[861, 4], [731, 3], [576, 2], [384, 1], [0, 0]],
    gradeBands: [[861, 3], [731, 4], [576, 5], [384, 6], [0, 0]],
    quotaBands: [[861, 0.0065], [731, 0.0074], [676, 0.0083], [384, 0.0096], [0, 0]],
  },
  {
    id: 'sewing',
    label: { bn: 'সুইং আয়রন ম্যান', en: 'Sewing Iron Man' },
    factors: [
      { key: 'efficiency', label: { bn: 'দক্ষতা', en: 'Efficiency' }, mode: 'score', maxHint: 500,
        bands: [[434, 4], [357, 3], [306, 2], [255, 1], [0, 0]] },
      { key: 'skill', label: { bn: 'দক্ষতা (Skill)', en: 'Skill' }, mode: 'score', maxHint: 300,
        bands: [[270, 4], [180, 3], [120, 2], [15, 1], [0, 0]] },
      { key: 'experience', label: { bn: 'অভিজ্ঞতা', en: 'Experience' }, mode: 'level',
        bands: [[4, 40], [3, 30], [2, 20], [1, 10], [0, 0]] },
      { key: 'attendance', label: { bn: 'উপস্থিতি', en: 'Attendance' }, mode: 'level',
        bands: [[4, 50], [3, 40], [2, 30], [1, 20], [0, 0]] },
      { key: 'discipline', label: { bn: 'শৃঙ্খলা', en: 'Discipline' }, mode: 'level',
        bands: [[4, 50], [3, 40], [2, 30], [1, 20], [0, 0]] },
    ],
    levelBands: [[884, 4], [659, 3], [504, 2], [384, 1], [0, 0]],
    gradeBands: [[884, 3], [659, 4], [504, 5], [384, 6], [0, 0]],
    quotaBands: [[884, 0.0065], [659, 0.0074], [504, 0.0099], [384, 0.0129], [0, 0]],
  },
  {
    id: 'quality',
    label: { bn: 'কোয়ালিটি', en: 'Quality' },
    factors: [
      { key: 'skill', label: { bn: 'দক্ষতা', en: 'Skill' }, mode: 'score', maxHint: 700,
        bands: [[608, 4], [532, 3], [456, 2], [380, 1], [0, 0]] },
      { key: 'education', label: { bn: 'শিক্ষাগত যোগ্যতা', en: 'Education' }, mode: 'level',
        bands: [[4, 100], [3, 75], [2, 50], [1, 25], [0, 0]] },
      { key: 'experience', label: { bn: 'অভিজ্ঞতা', en: 'Experience' }, mode: 'level',
        bands: [[4, 40], [3, 30], [2, 20], [1, 10], [0, 0]] },
      { key: 'attendance', label: { bn: 'উপস্থিতি', en: 'Attendance' }, mode: 'level',
        bands: [[4, 50], [3, 40], [2, 30], [1, 20], [0, 0]] },
      { key: 'discipline', label: { bn: 'শৃঙ্খলা', en: 'Discipline' }, mode: 'level',
        bands: [[4, 50], [3, 40], [2, 30], [1, 20], [0, 0]] },
    ],
    levelBands: [[861, 4], [731, 3], [576, 2], [384, 1], [0, 0]],
    gradeBands: [[861, 3], [731, 4], [576, 5], [384, 6], [0, 0]],
    quotaBands: [[861, 0.0065], [731, 0.0074], [676, 0.0083], [384, 0.0096], [0, 0]],
  },
  {
    id: 'operator',
    label: { bn: 'অপারেটর', en: 'Operator' },
    factors: [
      { key: 'efficiency', label: { bn: 'দক্ষতা', en: 'Efficiency' }, mode: 'score', maxHint: 300,
        bands: [[270, 4], [180, 3], [120, 2], [15, 1], [0, 0]] },
      { key: 'skill', label: { bn: 'দক্ষতা (Skill)', en: 'Skill' }, mode: 'score', maxHint: 300,
        bands: [[270, 4], [180, 3], [120, 2], [15, 1], [0, 0]] },
      { key: 'quality', label: { bn: 'মান (Quality)', en: 'Quality' }, mode: 'score', maxHint: 100,
        bands: [[100, 4], [75, 3], [50, 2], [25, 1], [0, 0]] },
      { key: 'experience', label: { bn: 'অভিজ্ঞতা', en: 'Experience' }, mode: 'level',
        bands: [[4, 40], [3, 30], [2, 20], [1, 10], [0, 0]] },
      { key: 'attendance', label: { bn: 'উপস্থিতি', en: 'Attendance' }, mode: 'level',
        bands: [[4, 50], [3, 40], [2, 30], [1, 20], [0, 0]] },
      { key: 'discipline', label: { bn: 'শৃঙ্খলা', en: 'Discipline' }, mode: 'level',
        bands: [[4, 50], [3, 40], [2, 30], [1, 20], [0, 0]] },
    ],
    levelBands: [[884, 4], [659, 3], [504, 2], [384, 1], [0, 0]],
    gradeBands: [[884, 3], [659, 4], [504, 5], [384, 6], [0, 0]],
    // NOTE: Operator's own quota table — different from Sewing's, even
    // though the level/grade bands (884/659/504/384) are identical.
    quotaBands: [[884, 0.0065], [659, 0.0074], [540, 0.0099], [384, 0.006], [0, 0]],
  },
];

interface Result {
  eligible: true;
  category: CategoryDef;
  factorResults: { factor: FactorDef; inputValue: number; level: number; score: number }[];
  total: number;
  levelAch: number;
  gradeAch: number;
  quota: number;
  achievedPct: number;
  existingGross: number;
  existingBasic: number;
  newBasic: number;
  newGross: number;
  achvTaka: number;
  floorTaka: number;
  additionalOutOfFloor: number;
  payable: number;
  usedFloor: boolean;
  isNewJoiner: boolean;
}
interface ErrorResult { eligible: false; error: string }

function SectionCard({ icon, title, children, accent = A }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <div style={{ marginTop: 14, background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ background: `${accent}18`, borderBottom: `1px solid ${accent}30`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontWeight: 800, fontSize: 13, color: accent }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function AmountRow({ label, value, note, color = 'var(--text)', last }: {
  label: string; value: string; note?: string; color?: string; last?: boolean;
}) {
  return (
    <div style={{ padding: '11px 14px', borderBottom: last ? 'none' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)' }}>{label}</div>
        {note && <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5, marginTop: 3 }}>{note}</div>}
      </div>
      <div style={{ fontWeight: 800, fontSize: 13.5, color, fontFamily: 'monospace', flexShrink: 0, whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

function LevelPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
      {['0', '1', '2', '3', '4'].map(v => {
        const on = value === v;
        return (
          <button
            key={v} onClick={() => onChange(v)}
            style={{
              padding: '9px 4px', textAlign: 'center',
              background: on ? A : 'var(--surface)', border: `1.5px solid ${on ? A : 'var(--border)'}`,
              borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 13,
              color: on ? '#fff' : 'var(--text2)', transition: 'all 0.15s',
            }}
          >{v}</button>
        );
      })}
    </div>
  );
}

export default function WagesGridCalc({ history, onAdd, onClear }: CalcProps) {
  const { lang } = useLang();
  const bn = lang === 'bn';

  const [tab, setTab] = useState<'input' | 'breakdown' | 'reference'>('input');
  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [existingGross, setExistingGross] = useState('');
  const [isNewJoiner, setIsNewJoiner] = useState(false);
  const [result, setResult] = useState<Result | ErrorResult | null>(null);

  const category = CATEGORIES.find(c => c.id === categoryId)!;

  const FN = (n: number) => {
    const s = Math.round(n).toLocaleString('en-BD');
    return '৳' + (bn ? s.replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[+d]) : s);
  };
  const PCT = (n: number) => `${(n * 100).toFixed(2)}%`;

  const setInput = (key: string, v: string) => setInputs(prev => ({ ...prev, [key]: v }));

  const calc = () => {
    const gross = parseFloat(existingGross);
    if (!gross || gross <= 0) {
      setResult({ eligible: false, error: bn ? 'বর্তমান মোট মজুরি সঠিকভাবে দিন।' : 'Enter a valid existing gross wage.' });
      return;
    }

    const factorResults: Result['factorResults'] = [];
    for (const f of category.factors) {
      const raw = parseFloat(inputs[f.key]);
      if (isNaN(raw) || raw < 0) {
        setResult({ eligible: false, error: bn ? `"${f.label.bn}"-এর মান সঠিকভাবে দিন।` : `Enter a valid value for "${f.label.en}".` });
        return;
      }
      if (f.mode === 'score') {
        const level = lookup(raw, f.bands);
        factorResults.push({ factor: f, inputValue: raw, level, score: raw });
      } else {
        const level = Math.round(raw);
        const score = lookup(level, f.bands);
        factorResults.push({ factor: f, inputValue: level, level, score });
      }
    }

    const total = factorResults.reduce((s, r) => s + r.score, 0);
    const levelAch = lookup(total, category.levelBands);
    const gradeAch = lookup(total, category.gradeBands);
    const quota = lookup(total, category.quotaBands);
    const achievedPct = (total * quota) / 100;

    const existingBasic = (gross - FIXED_ALLOWANCE) / 1.5;
    const newBasic = existingBasic * (1 + achievedPct);
    const newGross = newBasic * 1.5 + FIXED_ALLOWANCE;
    const achvTaka = (newBasic - existingBasic) * 1.5;
    const floorTaka = existingBasic * FLOOR_PCT * 1.5;
    const additionalOutOfFloor = Math.max(0, achvTaka - floorTaka);
    // New joiners don't get the guaranteed floor — only the performance-based amount.
    const usedFloor = !isNewJoiner && achievedPct <= FLOOR_PCT;
    const payable = usedFloor ? floorTaka : achvTaka;

    const r: Result = {
      eligible: true, category, factorResults, total, levelAch, gradeAch, quota, achievedPct,
      existingGross: gross, existingBasic, newBasic, newGross, achvTaka, floorTaka, additionalOutOfFloor, payable, usedFloor, isNewJoiner,
    };
    setResult(r);
    onAdd('wagesgrid', `${category.label[bn ? 'bn' : 'en']}: ${bn ? 'বৃদ্ধি' : 'increment'} ৳${payable.toFixed(0)}`);
  };

  const share = result?.eligible
    ? buildShare(bn ? 'ওয়েজেস গ্রিড হিসাব' : 'Wages Grid Result', [
        `${bn ? 'পদ' : 'Category'}: ${result.category.label[bn ? 'bn' : 'en']}`,
        `${bn ? 'মোট স্কোর' : 'Total score'}: ${result.total}`,
        `${bn ? 'অর্জিত %' : 'Achieved %'}: ${PCT(result.achievedPct)}`,
        `${bn ? 'মজুরি বৃদ্ধি (প্রদেয়)' : 'Wage increment (payable)'}: ${FN(result.payable)}`,
        `${bn ? 'নতুন মোট মজুরি' : 'New gross'}: ${FN(result.newGross)}`,
      ])
    : null;

  const TABS: { id: typeof tab; label: string; icon: React.ReactNode }[] = [
    { id: 'input',     label: bn ? 'ইনপুট'          : 'Input',      icon: <FaChartBar size={11} /> },
    { id: 'breakdown', label: bn ? 'বিস্তারিত হিসাব' : 'Breakdown',  icon: <FaCoins size={11} /> },
    { id: 'reference', label: bn ? 'রেফারেন্স'        : 'Reference',  icon: <FaClipboardList size={11} /> },
  ];

  return (
    <CalcShell
      accent={A}
      onCalc={calc}
      calcLabel={bn ? 'হিসাব করুন' : 'Calculate'}
      hasResult={!!(result?.eligible)}
      onShare={() => share && shareWA(share)}
      history={history}
      onClear={() => onClear?.('wagesgrid')}
      historyLabel={bn ? 'ইতিহাস' : 'History'}
      clearLabel={bn ? 'মুছুন' : 'Clear'}
    >
      <style>{'@media print { .wg-no-print { display: none !important; } }'}</style>
      <div className="wg-no-print" style={{ display: 'flex', gap: 4, padding: 4, marginBottom: 14, background: 'var(--surface2)', border: `1px solid var(--border)`, borderRadius: 12 }}>
        {TABS.map(t => {
          const on = tab === t.id;
          return (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, minWidth: 0, padding: '9px 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: on ? A : 'transparent', color: on ? '#fff' : 'var(--text2)',
                border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer', transition: 'all 0.15s', boxShadow: on ? `0 2px 8px ${A}40` : 'none',
              }}
            >
              {t.icon}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════ TAB 1 — INPUT ══════════════════ */}
      {tab === 'input' && (
        <>
          <div style={{ background: `${A}15`, border: `1px solid ${A}35`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <FaInfoCircle size={15} color={A} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: A, lineHeight: 1.55 }}>
              {bn
                ? 'পারফরম্যান্স স্কোরিং অনুযায়ী মজুরি বৃদ্ধির হিসাব — প্রতিটি পদের নিজস্ব মূল্যায়ন মানদণ্ড ও গ্রিড রয়েছে। ন্যূনতম ৫% বৃদ্ধি নিশ্চিত, তার বেশি অর্জিত হলে সেটাই প্রদেয়।'
                : 'Performance-scored wage increment — each job category has its own evaluation factors and grid. A minimum 5% increase is guaranteed; if the achieved amount exceeds that, the achieved amount is paid instead.'}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 8 }}>
              {bn ? 'পদের ধরন' : 'Job category'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CATEGORIES.map(c => {
                const on = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setCategoryId(c.id); setInputs({}); setResult(null); }}
                    style={{
                      padding: '11px 10px', textAlign: 'center',
                      background: on ? `${A}1f` : 'var(--surface)', border: `1.5px solid ${on ? A : 'var(--border)'}`,
                      borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800, fontSize: 12.5,
                      color: on ? A : 'var(--text2)', transition: 'all 0.15s',
                    }}
                  >{c.label[bn ? 'bn' : 'en']}</button>
                );
              })}
            </div>
          </div>

          {category.factors.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 8 }}>
                {f.label[bn ? 'bn' : 'en']} {f.mode === 'level' ? (bn ? '(লেভেল বেছে নিন ০-৪)' : '(select level 0-4)') : (bn ? '(স্কোর দিন)' : '(enter score)')}
              </div>
              {f.mode === 'level' ? (
                <LevelPills value={inputs[f.key] ?? ''} onChange={v => setInput(f.key, v)} />
              ) : (
                <FloatInput
                  label="" accent={A} type="number" placeholder={f.maxHint ? `0 - ${f.maxHint}` : '0'}
                  value={inputs[f.key] ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <FloatInput
            label={bn ? 'বর্তমান মোট মজুরি (৳)' : 'Existing gross wage (৳)'}
            accent={A} type="number" placeholder="10000"
            value={existingGross}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExistingGross(e.target.value)}
            hint={bn ? `মূল মজুরি = (মোট মজুরি − ৳${FIXED_ALLOWANCE}) ÷ ১.৫` : `Basic wage = (gross − ৳${FIXED_ALLOWANCE}) ÷ 1.5`}
          />

          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 8 }}>
              {bn ? 'নতুন যোগদানকারী?' : 'New joiner?'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([
                { v: false, t: bn ? 'না — পুরাতন কর্মী' : 'No — existing employee' },
                { v: true,  t: bn ? 'হ্যাঁ — নতুন যোগদান' : 'Yes — newly joined' },
              ]).map(o => {
                const on = isNewJoiner === o.v;
                return (
                  <button
                    key={String(o.v)} onClick={() => setIsNewJoiner(o.v)}
                    style={{
                      padding: '11px 8px', textAlign: 'center',
                      background: on ? `${A}1f` : 'var(--surface)', border: `1.5px solid ${on ? A : 'var(--border)'}`,
                      borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
                      color: on ? A : 'var(--text2)', transition: 'all 0.15s',
                    }}
                  >{o.t}</button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              {bn
                ? `* নতুন যোগদানকারীদের ন্যূনতম ${FLOOR_PCT * 100}% গ্যারান্টিড বৃদ্ধি প্রযোজ্য নয় — শুধুমাত্র পারফরম্যান্স-ভিত্তিক বৃদ্ধিই প্রদেয়।`
                : `* The guaranteed ${FLOOR_PCT * 100}% floor does not apply to new joiners — only the performance-based increment is payable.`}
            </div>
          </div>

          {result && !result.eligible && (
            <div style={{ color: '#ef4444', fontSize: 14, fontWeight: 600, marginTop: 12 }}>⚠️ {result.error}</div>
          )}

          {result?.eligible && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 14, background: '#0a2818', border: '2px solid #166534', borderRadius: 12, padding: '12px 16px' }}>
                <FaCheckCircle color="#4ade80" size={20} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>
                  {bn ? `${result.category.label.bn} — হিসাব সম্পন্ন ✓` : `${result.category.label.en} — calculated ✓`}
                </span>
              </div>

              <ResultCard accent={A}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>
                    {bn ? 'মজুরি বৃদ্ধি (প্রদেয়)' : 'Wage Increment (Payable)'}
                  </div>
                  <div style={{ fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: 900, color: A, lineHeight: 1.1 }}>
                    {FN(result.payable)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                    {result.isNewJoiner
                      ? (bn ? 'নতুন যোগদানকারী — শুধুমাত্র পারফরম্যান্স-ভিত্তিক বৃদ্ধি প্রযোজ্য (ন্যূনতম হার প্রযোজ্য নয়)' : 'New joiner — only the performance-based increment applies (no guaranteed floor)')
                      : result.usedFloor
                      ? (bn ? `ন্যূনতম ${FLOOR_PCT * 100}% হারে প্রদেয় (অর্জিত % ${FLOOR_PCT * 100}%-এর নিচে)` : `Paid at the guaranteed ${FLOOR_PCT * 100}% floor (achieved % was under ${FLOOR_PCT * 100}%)`)
                      : (bn ? 'পারফরম্যান্স-ভিত্তিক অর্জিত হারে প্রদেয়' : 'Paid at the performance-achieved rate')}
                  </div>
                </div>
                <StatGrid
                  items={[
                    [bn ? 'মোট স্কোর' : 'Total score', String(result.total), '#3b82f6'],
                    [bn ? 'অর্জিত লেভেল' : 'Level achieved', String(result.levelAch), '#a78bfa'],
                    [bn ? 'অর্জিত %' : 'Achieved %', PCT(result.achievedPct), '#10b981'],
                    [bn ? 'নতুন মোট মজুরি' : 'New gross', FN(result.newGross), A],
                  ]}
                  cols={2}
                />
              </ResultCard>

              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface2)', border: `1px solid var(--border)`, borderRadius: 12, fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
                {bn ? 'পূর্ণ হিসাব ও ফ্যাক্টর-ভিত্তিক বিবরণ "বিস্তারিত হিসাব" ট্যাবে দেখুন।' : 'See the full computation and per-factor breakdown on the Breakdown tab.'}
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════ TAB 2 — BREAKDOWN ══════════════════ */}
      {tab === 'breakdown' && (
        <>
          {!result?.eligible ? (
            <div style={{ background: 'var(--surface)', border: `1px dashed var(--border)`, borderRadius: 14, padding: '22px 16px', textAlign: 'center' }}>
              <FaCoins size={26} color={A} style={{ opacity: 0.55, marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>
                {bn ? 'আগে হিসাব করুন' : 'Calculate first'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
                {bn ? '"ইনপুট" ট্যাবে তথ্য দিয়ে হিসাব করলে এখানে সম্পূর্ণ বিবরণ দেখা যাবে।' : 'Fill in the Input tab, and the full breakdown will appear here.'}
              </div>
            </div>
          ) : (
            <>
              <div className="wg-no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    background: A, color: '#fff', border: 'none', borderRadius: 10,
                    fontFamily: 'inherit', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
                  }}
                >
                  <FaPrint size={12} />
                  {bn ? 'প্রিন্ট করুন' : 'Print'}
                </button>
              </div>

              <div id="wg-print-area">
              <SectionCard icon={<FaChartBar size={14} color={A} />} title={bn ? 'ফ্যাক্টর-ভিত্তিক স্কোর' : 'Per-Factor Score'}>
                {result.factorResults.map((fr, i) => (
                  <AmountRow
                    key={fr.factor.key}
                    label={fr.factor.label[bn ? 'bn' : 'en']}
                    value={String(fr.score)}
                    note={fr.factor.mode === 'score'
                      ? (bn ? `ইনপুট স্কোর ${fr.inputValue} → লেভেল ${fr.level}` : `Input score ${fr.inputValue} → Level ${fr.level}`)
                      : (bn ? `লেভেল ${fr.level} → স্কোর ${fr.score}` : `Level ${fr.level} → Score ${fr.score}`)}
                    color="#3b82f6"
                    last={i === result.factorResults.length - 1}
                  />
                ))}
              </SectionCard>

              <SectionCard icon={<FaClipboardList size={14} color={A} />} title={bn ? 'গ্রেড ও কোটা নির্ধারণ' : 'Grade & Quota Determination'}>
                <AmountRow label={bn ? 'মোট স্কোর' : 'Total score'} value={String(result.total)} color="#a78bfa" />
                <AmountRow label={bn ? 'অর্জিত লেভেল' : 'Level achieved'} value={String(result.levelAch)} color="#a78bfa" />
                <AmountRow label={bn ? 'অর্জিত গ্রেড' : 'Grade achieved'} value={String(result.gradeAch)} color="#a78bfa" />
                <AmountRow label={bn ? 'কোটা' : 'Quota'} value={result.quota.toFixed(4)} color="#a78bfa" last
                  note={bn ? 'অর্জিত % = মোট স্কোর × কোটা ÷ ১০০' : 'Achieved % = total score × quota ÷ 100'} />
              </SectionCard>

              <SectionCard icon={<FaCoins size={14} color={A} />} title={bn ? 'মজুরি হিসাব' : 'Wage Calculation'}>
                <AmountRow label={bn ? 'বর্তমান মোট মজুরি' : 'Existing gross'} value={FN(result.existingGross)} />
                <AmountRow label={bn ? 'বর্তমান মূল মজুরি' : 'Existing basic'} value={FN(result.existingBasic)}
                  note={bn ? `(মোট − ৳${FIXED_ALLOWANCE}) ÷ ১.৫` : `(gross − ৳${FIXED_ALLOWANCE}) ÷ 1.5`} />
                <AmountRow label={bn ? 'অর্জিত %' : 'Achieved %'} value={PCT(result.achievedPct)} color="#10b981" />
                <AmountRow label={bn ? 'নতুন মূল মজুরি' : 'New basic'} value={FN(result.newBasic)} color="#10b981"
                  note={bn ? 'বর্তমান মূল × (১ + অর্জিত %)' : 'existing basic × (1 + achieved %)'} />
                <AmountRow label={bn ? 'নতুন মোট মজুরি' : 'New gross'} value={FN(result.newGross)} color="#10b981"
                  note={bn ? `নতুন মূল × ১.৫ + ৳${FIXED_ALLOWANCE}` : `new basic × 1.5 + ৳${FIXED_ALLOWANCE}`} />
                <AmountRow label={bn ? 'পারফরম্যান্স-ভিত্তিক বৃদ্ধি' : 'Performance-based increment'} value={FN(result.achvTaka)}
                  note={bn ? '(নতুন মূল − বর্তমান মূল) × ১.৫' : '(new basic − existing basic) × 1.5'} />
                <AmountRow label={bn ? `ন্যূনতম ${FLOOR_PCT * 100}% বৃদ্ধি` : `Guaranteed ${FLOOR_PCT * 100}% floor`} value={FN(result.floorTaka)}
                  note={result.isNewJoiner
                    ? (bn ? 'নতুন যোগদানকারী হওয়ায় প্রযোজ্য নয় — শুধু তুলনার জন্য দেখানো হলো' : 'Does not apply — shown for reference only, since this is a new joiner')
                    : (bn ? `বর্তমান মূল × ${FLOOR_PCT * 100}% × ১.৫` : `existing basic × ${FLOOR_PCT * 100}% × 1.5`)} />
                <AmountRow label={bn ? `${FLOOR_PCT * 100}%-এর অতিরিক্ত অংশ` : `Additional beyond ${FLOOR_PCT * 100}%`} value={FN(result.additionalOutOfFloor)} />
                <div style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${A}10` }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: A }}>{bn ? 'প্রদেয় (যেটি প্রযোজ্য)' : 'Payable (whichever applies)'}</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: A, fontFamily: 'monospace' }}>{FN(result.payable)}</span>
                </div>
              </SectionCard>
              </div>

              <div className="wg-no-print" style={{ marginTop: 14, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--surface2)', border: `1px solid var(--border)`, borderRadius: 12 }}>
                <FaInfoCircle size={12} color={A} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
                  {bn
                    ? `নিয়ম: পুরাতন কর্মীদের ক্ষেত্রে অর্জিত % যদি ${FLOOR_PCT * 100}%-এর নিচে বা সমান হয়, তবে ন্যূনতম ${FLOOR_PCT * 100}% (গ্যারান্টিড) বৃদ্ধিই প্রদেয়; বেশি হলে প্রকৃত পারফরম্যান্স-ভিত্তিক বৃদ্ধি প্রদেয়। নতুন যোগদানকারীদের ক্ষেত্রে ন্যূনতম হার প্রযোজ্য নয় — সবসময় শুধু পারফরম্যান্স-ভিত্তিক বৃদ্ধিই প্রদেয়, তা যত কমই হোক না কেন।`
                    : `Rule: for existing employees, if the achieved % is ${FLOOR_PCT * 100}% or below, the guaranteed ${FLOOR_PCT * 100}% floor is paid instead; above that, the full performance-based amount is paid. For new joiners, the floor never applies — only the performance-based amount is paid, however small.`}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════ TAB 3 — REFERENCE ══════════════════ */}
      {tab === 'reference' && (
        <>
          <SectionCard icon={<FaIndustry size={14} color={A} />} title={`${category.label[bn ? 'bn' : 'en']} — ${bn ? 'মূল্যায়ন মানদণ্ড' : 'Evaluation Factors'}`}>
            {category.factors.map((f, i, arr) => (
              <div key={f.key} style={{ padding: '12px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                  {f.label[bn ? 'bn' : 'en']} — {f.mode === 'score' ? (bn ? 'স্কোর-ভিত্তিক' : 'score-based') : (bn ? 'লেভেল-ভিত্তিক' : 'level-based')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {f.bands.filter(([min]) => min > 0 || f.bands.length === 1).map(([min, result], bi) => (
                    <span key={bi} style={{
                      fontSize: 10.5, fontWeight: 700, color: A, background: `${A}15`,
                      border: `1px solid ${A}35`, borderRadius: 999, padding: '3px 9px',
                    }}>
                      {f.mode === 'score'
                        ? (bn ? `≥${min} → লেভেল ${result}` : `≥${min} → Level ${result}`)
                        : (bn ? `লেভেল ${min} → ${result}` : `Level ${min} → ${result}`)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard icon={<FaClipboardList size={14} color={A} />} title={bn ? 'মোট স্কোর অনুযায়ী লেভেল, গ্রেড ও কোটা' : 'Total-Score Bands: Level, Grade & Quota'}>
            <div style={{ padding: '12px 14px 6px', fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              {bn ? 'কোটা × মোট স্কোর ÷ ১০০ = অর্জিত মজুরি বৃদ্ধির হার (%)।' : 'Quota × total score ÷ 100 = the achieved wage increment rate (%).'}
            </div>
            {category.quotaBands.filter(([min]) => min > 0).map(([min, quota], i) => {
              const level = lookup(min, category.levelBands);
              const grade = lookup(min, category.gradeBands);
              return (
                <div key={i} style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{bn ? `স্কোর ≥ ${min}` : `Score ≥ ${min}`}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {bn ? `লেভেল ${level} · গ্রেড ${grade} · কোটা ${quota}` : `Level ${level} · Grade ${grade} · Quota ${quota}`}
                  </span>
                </div>
              );
            })}
          </SectionCard>

          <div style={{ marginTop: 14, background: '#2a1c05', border: '1px solid #92400e', borderRadius: 12, padding: '11px 13px', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <FaExclamationTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11.5, color: '#fde68a', lineHeight: 1.6 }}>
              {bn
                ? 'এই হিসাব একটি নির্দিষ্ট প্রতিষ্ঠানের "ওয়েজেস গ্রিড ২০২১" নীতিমালা থেকে হুবহু নেওয়া। ভিন্ন প্রতিষ্ঠান বা ভিন্ন বছরের গ্রিডে হার, ফ্যাক্টর ও থ্রেশহোল্ড আলাদা হতে পারে — বেতন পরিশোধের আগে নিজের প্রতিষ্ঠানের বর্তমান গ্রিডের সাথে যাচাই করে নিন।'
                : 'This calculation is copied directly from one factory\u2019s "Wages Grid 2021" policy. Rates, factors, and thresholds vary by company and by year — verify against your own current grid before running payroll.'}
            </div>
          </div>
          <div style={{ marginTop: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--surface2)', border: `1px solid var(--border)`, borderRadius: 12 }}>
            <FaInfoCircle size={12} color={A} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              {bn
                ? `ধ্রুবক ৳${FIXED_ALLOWANCE} মূল মজুরি থেকে বাদ দেওয়া ও যোগ করা একটি ফিক্সড ভাতার অংশ, যা উৎস গ্রিডে হার্ডকোড করা ছিল। ভিন্ন প্রতিষ্ঠানে এই সংখ্যা ভিন্ন হতে পারে।`
                : `The fixed ৳${FIXED_ALLOWANCE} subtracted/added around the basic-wage calculation was hardcoded in the source grid as a flat allowance component. This number may differ at other companies.`}
            </div>
          </div>
        </>
      )}
    </CalcShell>
  );
}
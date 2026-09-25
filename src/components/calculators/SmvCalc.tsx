import { useState } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { FloatInput, ResultCard, StatGrid } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#14b8a6';

export default function SmvCalc({ history, onAdd, onClear }: CalcProps) {
  const { t, lang } = useLang();
  const s = t.smv;
  const [shares, setShares] = useState('');
  const [buy, setBuy]       = useState('');
  const [cur, setCur]       = useState('');
  const [brok, setBrok]     = useState('0.5');
  const [result, setResult] = useState<any>(null);

  const calc = () => {
    const sh = parseFloat(shares), b = parseFloat(buy), c = parseFloat(cur), br = parseFloat(brok) || 0;
    if (!sh || !b || !c) { setResult({ error: t.fillFields }); return; }
    const inv = sh * b, val = sh * c, fee = (inv + val) * br / 100, pl = val - inv - fee;
    const pct = ((pl / inv) * 100).toFixed(2);
    setResult({ inv: inv.toFixed(2), val: val.toFixed(2), pl: Math.abs(pl).toFixed(2), pct, profit: pl >= 0, fee: fee.toFixed(2) });
    onAdd('smv', `${sh} shares @ ${b} → ${c} = ${pl >= 0 ? '+' : '-'}${Math.abs(pl).toFixed(2)} (${pct}%)`);
  };

  const rc = result && !result.error ? (result.profit ? '#10b981' : '#ef4444') : A;
  const share = result && !result.error
    ? buildShare('Stock', [`${s.shares}: ${shares}`, `${s.buyPrice}: ${buy}`, `${s.currentPrice}: ${cur}`, `${s.invested}: ${result.inv}`, `${result.profit ? s.netProfit : s.netLoss}: ${result.pl} (${result.pct}%)`])
    : null;

  return (
    <CalcShell accent={A} onCalc={calc} calcLabel={t.calculate}
      hasResult={!!(result && !result.error)}
      onShare={() => share && shareWA(share)}
      history={history} onClear={() => onClear?.('smv')}
      historyLabel={t.history} clearLabel={t.clearHistory}>

      <FloatInput label={s.shares}       accent={A} type="number" placeholder="100"   value={shares} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShares(e.target.value)} />
      <FloatInput label={s.buyPrice}     accent={A} type="number" placeholder="50.25" value={buy}    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuy(e.target.value)} />
      <FloatInput label={s.currentPrice} accent={A} type="number" placeholder="65.00" value={cur}    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCur(e.target.value)} />
      <FloatInput label={s.brokerage}    accent={A} type="number" placeholder="0.5"   value={brok}   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrok(e.target.value)} />

      {result && !result.error && (
        <ResultCard accent={rc}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
              {result.profit ? <FaArrowUp color="#10b981" size={18} /> : <FaArrowDown color="#ef4444" size={18} />}
              <span style={{ fontSize: 14, fontWeight: 700, color: rc }}>
                {result.profit ? (lang === 'bn' ? 'লাভ' : 'Profit') : (lang === 'bn' ? 'ক্ষতি' : 'Loss')}
              </span>
            </div>
            <div style={{ fontSize: 'clamp(28px,7vw,38px)', fontWeight: 900, color: rc, lineHeight: 1.2 }}>
              {result.profit ? '+' : '-'}{result.pl}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: rc }}>({result.pct}%)</div>
          </div>
          <StatGrid items={[
            [s.invested, result.inv, A],
            [lang === 'bn' ? 'বর্তমান মূল্য' : 'Current Value', result.val, A],
            [lang === 'bn' ? 'ব্রোকারেজ' : 'Brokerage', result.fee, '#f59e0b'],
            [result.profit ? s.netProfit : s.netLoss, result.pl, rc],
          ]} cols={2} />
        </ResultCard>
      )}
      {result?.error && <div style={{ color: '#ef4444', fontSize: 14, marginTop: 10, fontWeight: 600 }}>{result.error}</div>}
    </CalcShell>
  );
}

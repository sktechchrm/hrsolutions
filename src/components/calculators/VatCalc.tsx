import { useState } from 'react';
import { FloatInput, ToggleGroup, ResultCard, StatGrid, PresetPills } from '../ui';
import type { CalcProps } from '../../utils/constants.ts';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

const A = '#8b5cf6';
const BD_RATES  = [['15', 'Standard 15%'], ['10', 'Hotel/Rest 10%'], ['7.5', 'Construction 7.5%'], ['5', 'Agriculture 5%'], ['2', 'Special 2%'], ['0', 'VAT Free 0%']];
const INTL_RATES = [['20', 'UK 20%'], ['19', 'Germany 19%'], ['18', 'India 18%'], ['10', 'Australia 10%'], ['8', 'Switzerland 8%'], ['7', 'Singapore 7%']];

export default function VatCalc({ history, onAdd, onClear }: CalcProps) {
  const { t, lang } = useLang();
  const v = t.vat;
  const [mode, setMode]         = useState('bd');
  const [calcMode, setCalcMode] = useState('add');
  const [amount, setAmount]     = useState('');
  const [rate, setRate]         = useState('15');
  const [result, setResult]     = useState<any>(null);

  const calc = () => {
    const a = parseFloat(amount), r = parseFloat(rate);
    if (!a || a <= 0 || r < 0) { setResult({ error: t.fillFields }); return; }
    let net: number, vat: number, gross: number;
    if (calcMode === 'add') { net = a; vat = a * r / 100; gross = a + vat; }
    else { gross = a; net = a / (1 + r / 100); vat = gross - net; }
    setResult({ net: net.toFixed(2), vat: vat.toFixed(2), gross: gross.toFixed(2) });
    const cur = mode === 'bd' ? '' : '$';
    onAdd('vat', `${cur}${a} @ ${r}% → VAT ${cur}${vat.toFixed(2)}, Total ${cur}${gross.toFixed(2)}`);
  };

  const cur = mode === 'bd' ? '' : '$';
  const pct = result && !result.error ? Math.round(parseFloat(result.net) / parseFloat(result.gross) * 100) : 0;
  const share = result && !result.error
    ? buildShare('VAT', [`${v.amount}: ${cur}${amount}`, `${v.rate}: ${rate}%`, `${v.netPrice}: ${cur}${result.net}`, `${v.vatAmount}: ${cur}${result.vat}`, `${v.grossPrice}: ${cur}${result.gross}`])
    : null;

  return (
    <CalcShell accent={A} onCalc={calc} calcLabel={t.calculate}
      hasResult={!!(result && !result.error)}
      onShare={() => share && shareWA(share)}
      history={history} onClear={() => onClear?.('vat')}
      historyLabel={t.history} clearLabel={t.clearHistory}>

      <ToggleGroup options={[['bd', v.bdMode], ['intl', v.intlMode]]} value={mode}
        onChange={(nm: string) => { setMode(nm); setRate(nm === 'bd' ? '15' : '20'); setResult(null); }} accent={A} />
      <ToggleGroup options={[['add', v.addVat], ['remove', v.removeVat]]} value={calcMode} onChange={setCalcMode} accent={A} />
      <FloatInput label={`${v.amount} (${cur || 'BDT'})`} accent={A} type="number" placeholder="1000"
        value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 8 }}>{v.rate}</div>
        <PresetPills options={mode === 'bd' ? BD_RATES : INTL_RATES} active={rate} onSelect={setRate} accent={A} />
        <FloatInput label={lang === 'bn' ? 'কাস্টম হার (%)' : 'Custom Rate (%)'} accent={A} type="number" placeholder="%" value={rate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRate(e.target.value)} />
      </div>

      {result && !result.error && (
        <ResultCard accent={A}>
          <StatGrid items={[[v.netPrice, `${cur}${result.net}`, A], [v.vatAmount, `${cur}${result.vat}`, '#ef4444'], [v.grossPrice, `${cur}${result.gross}`, '#10b981']]} cols={3} />
          <div style={{ marginTop: 10, background: 'var(--surface2)', borderRadius: 8, height: 10, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: pct + '%', background: A, borderRadius: '8px 0 0 8px' }} />
            <div style={{ flex: 1, background: '#7f1d1d' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
            <span>{lang === 'bn' ? 'নেট' : 'Net'} {pct}%</span><span>VAT {100 - pct}%</span>
          </div>
        </ResultCard>
      )}
      {result?.error && <div style={{ color: '#ef4444', fontSize: 14, marginTop: 10, fontWeight: 600 }}>{result.error}</div>}
    </CalcShell>
  );
}

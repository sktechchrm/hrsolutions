import { useState } from 'react';
import { FaExclamationTriangle, FaRuler, FaCut } from 'react-icons/fa';
import { FloatInput } from '../ui';
import CalcShell from '../CalcShell';
import { useLang } from '../../context/LangContext.tsx';
import { shareWA, buildShare } from '../../utils/share.ts';

interface Measurements { [key: string]: string; }
interface CalcProps { history: string[]; onAdd: (id:string,entry:string)=>void; onClear?:(id:string)=>void; }

const MEN_TOPS     = [{id:'mshirt', label:'Formal Shirt',  labelBn:'ফর্মাল শার্ট',    color:'#d4a017'},{id:'mtshirt',label:'T-Shirt',        labelBn:'টি-শার্ট',        color:'#e67e22'},{id:'mpolo',  label:'Polo Shirt',    labelBn:'পোলো শার্ট',      color:'#8e44ad'},{id:'mkurta', label:'Kurta/Panjabi', labelBn:'কুর্তা/পাঞ্জাবি', color:'#c41e3a'}];
const WOMEN_TOPS   = [{id:'wblouse',label:'Blouse',         labelBn:'ব্লাউজ',          color:'#c41e3a'},{id:'wkameez',label:'Kameez',          labelBn:'কামিজ',           color:'#9b59b6'},{id:'wkurti', label:'Kurti',          labelBn:'কুর্তি',          color:'#e67e22'},{id:'wsaree', label:'Saree Blouse',  labelBn:'শাড়ি ব্লাউজ',   color:'#d4a017'}];
const MEN_BOTTOMS  = [{id:'mtrousers',label:'Trouser',      labelBn:'ট্রাউজার',        color:'#2c3e50'},{id:'msalwar',label:'Salwar',          labelBn:'সালোয়ার',        color:'#16a085'},{id:'mshorts',label:'Shorts',          labelBn:'শর্টস',           color:'#27ae60'},{id:'mpyjama',label:'Pyjama',          labelBn:'পায়জামা',         color:'#8e44ad'}];
const WOMEN_BOTTOMS= [{id:'wsalwar', label:'Salwar',         labelBn:'সালোয়ার',        color:'#c41e3a'},{id:'wpalazzo',label:'Palazzo',        labelBn:'পালাজো',          color:'#9b59b6'},{id:'wskirt', label:'A-line Skirt',   labelBn:'স্কার্ট',         color:'#e67e22'},{id:'wlegging',label:'Leggings',      labelBn:'লেগিংস',          color:'#d4a017'}];

const SECTIONS=[
  {id:'mt' as const, label:"Men's Tops",      labelBn:'পুরুষ টপ',   items:MEN_TOPS},
  {id:'wt' as const, label:"Women's Tops",    labelBn:'নারী টপ',    items:WOMEN_TOPS},
  {id:'mb' as const, label:"Men's Bottoms",   labelBn:'পুরুষ বটম',  items:MEN_BOTTOMS},
  {id:'wb' as const, label:"Women's Bottoms", labelBn:'নারী বটম',   items:WOMEN_BOTTOMS},
];

function cv(m:Measurements,k:string,def:number){return parseFloat(m[k])||def;}

function getPatternPoints(id:string,m:Measurements){
  const chest=cv(m,'chest',38),waist=cv(m,'waist',34),hip=cv(m,'hip',40);
  const shoulder=cv(m,'shoulder',17),sleeve=cv(m,'sleeve',25);
  const height=cv(m,'height',66),neck=cv(m,'neck',15);
  const inseam=cv(m,'inseam',30),outseam=cv(m,'outseam',41);
  const thigh=cv(m,'thigh',22),rise=cv(m,'rise',11);
  const bust=cv(m,'bust',36);
  const ease=id.startsWith('w')?2:4;
  const isTop=['mshirt','mtshirt','mpolo','mkurta','wblouse','wkameez','wkurti','wsaree'].includes(id);
  const isFemale=id.startsWith('w');
  if(isTop){
    const fc=(isFemale?bust:chest)+ease,fw=waist+(isFemale?1:2);
    const fl=id==='wsaree'?7:id==='mkurta'?height*0.58:id.includes('kameez')?height*0.52:id.includes('kurti')?height*0.45:height*(isFemale?0.38:0.43);
    const ah=(isFemale?bust:chest)/4+1,nw=neck/5+0.5,nd=neck/5+(isFemale?1.5:1);
    const sl=id==='mkurta'?sleeve+2:id.includes('blouse')||id==='wsaree'?sleeve*0.5:id.includes('polo')||id.includes('tshirt')||id.includes('kurti')?sleeve*0.6:sleeve;
    const fabric=Math.round(fl*2+sl+10);
    return{type:'top',fabric:`${fabric}" / ${Math.round(fabric*2.54)}cm`,
      front:{title:'FRONT PIECE',points:[{key:'A',label:'Neck Point',val:`${nw.toFixed(1)}"`,x:48,y:10},{key:'B',label:'Shoulder',val:`${shoulder.toFixed(1)}"`,x:72,y:8},{key:'C',label:'Chest Width',val:`${(fc/4+0.5).toFixed(1)}"`,x:80,y:38},{key:'D',label:'Waist Width',val:`${(fw/4+0.5).toFixed(1)}"`,x:80,y:62},{key:'E',label:'Side Length',val:`${fl.toFixed(1)}"`,x:80,y:88},{key:'F',label:'Armhole',val:`${ah.toFixed(1)}"`,x:50,y:38},{key:'G',label:'Sleeve Cap',val:`${(ah-1).toFixed(1)}"`,x:82,y:30},{key:'H',label:'Neck Depth',val:`${nd.toFixed(1)}"`,x:48,y:22}]},
      back:{title:'BACK PIECE',points:[{key:'P',label:'Neck Point',val:`${(nw-0.25).toFixed(1)}"`,x:38,y:10},{key:'Q',label:'Shoulder',val:`${shoulder.toFixed(1)}"`,x:72,y:8},{key:'R',label:'Neck Depth',val:'0.75"',x:55,y:14},{key:'S',label:'Chest Width',val:`${(fc/4).toFixed(1)}"`,x:80,y:38},{key:'T',label:'Waist Width',val:`${(fw/4).toFixed(1)}"`,x:80,y:62},{key:'U',label:'Side Length',val:`${fl.toFixed(1)}"`,x:80,y:88}]},
      sleeve:{title:'SLEEVE',points:[{key:'A',label:'Sleeve Length',val:`${sl.toFixed(1)}"`,x:50,y:10},{key:'B',label:'Cap Height',val:`${(ah-1).toFixed(1)}"`,x:50,y:28},{key:'C',label:'Bicep Width',val:`${((isFemale?bust:chest)/4+2).toFixed(1)}"`,x:80,y:55},{key:'D',label:'Cuff Width',val:`${(neck+2).toFixed(1)}"`,x:50,y:90}]},
      summary:{'Chest':fc.toFixed(1)+'"','Waist':fw.toFixed(1)+'"','Length':fl.toFixed(1)+'"','Sleeve':sl.toFixed(1)+'"'}};
  } else {
    const fw=waist+1.5,fh=hip+2,fr=id==='wskirt'?0:rise,len=outseam;
    const isSkirt=id==='wskirt',isPalazzo=id==='wpalazzo',fabric=Math.round((len+10)*2);
    return{type:'bottom',fabric:`${fabric}" / ${Math.round(fabric*2.54)}cm`,
      front:{title:'FRONT LEG',points:[{key:'A',label:'Waist Width',val:`${(fw/4+0.5).toFixed(1)}"`,x:50,y:8},{key:'B',label:'Hip Width',val:`${(fh/4+0.5).toFixed(1)}"`,x:80,y:28},{key:'C',label:'Rise Depth',val:`${(fr*0.55).toFixed(1)}"`,x:20,y:28},{key:'D',label:'Thigh Width',val:`${(thigh/2+1).toFixed(1)}"`,x:80,y:42},{key:'E',label:'Knee Width',val:`${(thigh/2-1).toFixed(1)}"`,x:80,y:65},{key:'F',label:'Hem Width',val:`${isSkirt||isPalazzo?((fh/4+5).toFixed(1)):'8.5'}"`,x:80,y:90},{key:'G',label:'Inseam',val:`${inseam.toFixed(1)}"`,x:45,y:90}]},
      back:{title:'BACK LEG',points:[{key:'P',label:'Waist Width',val:`${(fw/4+1).toFixed(1)}"`,x:50,y:8},{key:'Q',label:'Hip Width',val:`${(fh/4+1.5).toFixed(1)}"`,x:80,y:28},{key:'R',label:'Rise Depth',val:`${(fr*0.6).toFixed(1)}"`,x:20,y:28},{key:'S',label:'Crotch Curve',val:`${(fh/10).toFixed(1)}"`,x:12,y:42},{key:'T',label:'Thigh Width',val:`${(thigh/2+2).toFixed(1)}"`,x:80,y:42},{key:'U',label:'Knee Width',val:`${(thigh/2).toFixed(1)}"`,x:80,y:65}]},
      waistband:{title:'WAISTBAND',points:[{key:'A',label:'Length',val:`${(fw+1.5).toFixed(1)}"`,x:50,y:35},{key:'B',label:'Width',val:'1.5"',x:50,y:65}]},
      summary:{'Waist':fw.toFixed(1)+'"','Hip':fh.toFixed(1)+'"','Length':len+'"','Rise':fr.toFixed(1)+'"'}};
  }
}

function PatternPieceView({piece,type,color}:{piece:any;type:string;color:string}){
  const isBottom=type==='pant-back'||type==='skirt',isBand=type==='band',isSleeve=type==='sleeve';
  const points=piece.points||[];
  let shapePath='';
  if(isBand)         shapePath='M5,30 L95,30 L95,70 L5,70 Z';
  else if(isSleeve)  shapePath='M50,5 Q78,18 85,45 L78,95 L22,95 L15,45 Q22,18 50,5 Z';
  else if(isBottom)  shapePath='M15,5 L85,5 Q90,22 87,38 L80,95 L52,95 L50,58 L48,95 L20,95 L13,38 Q10,22 15,5 Z';
  else if(type==='front') shapePath='M18,8 Q44,8 50,22 Q56,8 82,8 L89,36 Q80,46 80,52 L78,94 L22,94 L20,52 Q20,46 11,36 Z';
  else shapePath='M18,10 Q50,16 82,10 L89,36 Q80,46 80,52 L78,94 L22,94 L20,52 Q20,46 11,36 Z';
  return(
    <div style={{background:'#111113',border:`1.5px solid ${color}35`,borderRadius:12,padding:'10px 8px 8px'}}>
      <div style={{fontSize:10,fontWeight:800,color,marginBottom:4,letterSpacing:0.5}}>{piece.title}</div>
      <svg viewBox="0 0 100 100" width="100%" style={{display:'block',overflow:'visible'}}>
        <path d={shapePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
        {!isBand&&(<>
          <line x1="50" y1="18" x2="50" y2="82" stroke={color} strokeWidth="0.6" opacity="0.4" strokeDasharray="2,3"/>
          <polygon points="50,16 48,21 52,21" fill={color} opacity="0.4"/>
          <polygon points="50,84 48,79 52,79" fill={color} opacity="0.4"/>
        </>)}
        <path d={shapePath} fill="none" stroke={color} strokeWidth="0.7" strokeDasharray="3,2.5" opacity="0.35" transform="translate(3,3) scale(0.94)"/>
        {points.map((pt:any)=>(
          <g key={pt.key}>
            <circle cx={pt.x>70?pt.x-5:pt.x<30?pt.x+5:pt.x} cy={pt.y} r="1.8" fill={color} opacity="0.9"/>
            <text x={pt.x>70?pt.x-8:pt.x<30?pt.x+8:pt.x} y={pt.y-3} textAnchor={pt.x>70?'end':pt.x<30?'start':'middle'} fontSize="6" fontWeight="800" fill={color} opacity="0.95" fontFamily="Inter,sans-serif">{pt.key}</text>
          </g>
        ))}
      </svg>
      <div style={{marginTop:4,display:'flex',flexDirection:'column',gap:2}}>
        {points.slice(0,5).map((pt:any)=>(
          <div key={pt.key} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,lineHeight:1.4}}>
            <span style={{fontWeight:800,color,minWidth:14,fontFamily:'monospace'}}>{pt.key}</span>
            <span style={{color:'var(--text3)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pt.label}</span>
            <span style={{fontWeight:700,color:'#e8e8e8',fontFamily:'monospace',fontSize:9}}>{pt.val}</span>
          </div>
        ))}
        {points.length>5&&<div style={{fontSize:9,color:'var(--text3)'}}>+{points.length-5} more</div>}
      </div>
    </div>
  );
}

function getFields(id:string,bn:boolean):[string,string,string][]{
  const isFemale=id.startsWith('w');
  const isBottom=['mtrousers','msalwar','mshorts','mpyjama','wsalwar','wpalazzo','wskirt','wlegging'].includes(id);
  if(isBottom) return[['waist',bn?'কোমর (ইঞ্চি)':'Waist (in)','32'],['hip',bn?'নিতম্ব (ইঞ্চি)':'Hip (in)','40'],['outseam',bn?'আউটসিম (ইঞ্চি)':'Outseam (in)','41'],['inseam',bn?'ইনসিম (ইঞ্চি)':'Inseam (in)','30'],['thigh',bn?'উরু (ইঞ্চি)':'Thigh (in)','22'],['rise',bn?'রাইজ (ইঞ্চি)':'Rise (in)','11']];
  return[[isFemale?'bust':'chest',isFemale?(bn?'বুক/বক্ষ (ইঞ্চি)':'Bust (in)'):(bn?'বুক (ইঞ্চি)':'Chest (in)'),'38'],['waist',bn?'কোমর (ইঞ্চি)':'Waist (in)','34'],['shoulder',bn?'কাঁধ (ইঞ্চি)':'Shoulder (in)','17'],['sleeve',bn?'হাতা (ইঞ্চি)':'Sleeve (in)','25'],['neck',bn?'গলা (ইঞ্চি)':'Neck (in)','15'],['height',bn?'উচ্চতা (ইঞ্চি)':'Height (in)','66'],...(isFemale?[['length',bn?'দৈর্ঘ্য (ইঞ্চি)':'Length (in)','24'] as [string,string,string]]:[])];
}

function PatternCalc({typeId,accent,history,onAdd,onClear}:{typeId:string;accent:string;history:string[];onAdd:(id:string,entry:string)=>void;onClear?:(id:string)=>void;}){
  const{lang}=useLang();const bn=lang==='bn';
  const[m,setM]=useState<Measurements>({});
  const[result,setResult]=useState<any>(null);
  const fields=getFields(typeId,bn);
  const isBottom=result?.type==='bottom';
  const share=result?buildShare('Pattern',[`Type: ${typeId}`,`Fabric: ${result.fabric}`]):null;

  const calc=()=>{
    const data=getPatternPoints(typeId,m);
    setResult(data);
    onAdd('gpattern',`${typeId} -> Fabric: ${data.fabric}`);
  };

  return(
    <CalcShell accent={accent} onCalc={calc}
      calcLabel={bn?'প্যাটার্ন তৈরি করুন':'Generate Pattern'}
      hasResult={!!result}
      onShare={()=>share&&shareWA(share)}
      history={history} onClear={()=>onClear?.('gpattern')}
      historyLabel={bn?'ইতিহাস':'History'} clearLabel={bn?'মুছুন':'Clear'}>

      {/* Input grid — 2 columns */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 10px'}}>
        {fields.map(([key,label,ph])=>(
          <FloatInput key={key} label={label} accent={accent} type="number" placeholder={ph}
            value={m[key]||''} onChange={(e:any)=>setM(p=>({...p,[key]:e.target.value}))}/>
        ))}
      </div>

      {result&&(<>
        {/* Summary */}
        <div style={{background:`${accent}14`,border:`1.5px solid ${accent}28`,borderRadius:12,padding:'12px',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
            <FaRuler size={13} color={accent}/>
            <span style={{fontSize:11,fontWeight:800,color:accent}}>{bn?'ফিনিশড মাপ':'Finished Measurements'}</span>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {Object.entries(result.summary||{}).map(([k,v])=>(
              <div key={k} style={{background:'var(--surface)',borderRadius:8,padding:'6px 10px',textAlign:'center'}}>
                <div style={{fontSize:9,color:'var(--text3)',fontWeight:600}}>{k}</div>
                <div style={{fontSize:14,fontWeight:800,color:accent}}>{v as string}</div>
              </div>
            ))}
            <div style={{background:'var(--surface)',borderRadius:8,padding:'6px 10px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'var(--text3)',fontWeight:600}}>{bn?'কাপড়':'Fabric'}</div>
              <div style={{fontSize:12,fontWeight:800,color:accent}}>{result.fabric}</div>
            </div>
          </div>
        </div>

        {/* Pattern pieces */}
        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8}}>
          <FaCut size={13} color={accent}/>
          <span style={{fontSize:11,fontWeight:800,color:accent}}>{bn?'প্যাটার্ন পিস':'Pattern Pieces'}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
          <PatternPieceView piece={result.front} type="front" color={accent}/>
          <PatternPieceView piece={result.back} type={isBottom?'pant-back':'back'} color="#d4a017"/>
          {result.sleeve&&<PatternPieceView piece={result.sleeve} type="sleeve" color="#27ae60"/>}
          {result.waistband&&<PatternPieceView piece={result.waistband} type="band" color="#9b59b6"/>}
        </div>

        {/* Symbol guide */}
        <div style={{background:'var(--surface)',border:'1px solid #2e2e38',borderRadius:10,padding:'10px 12px',marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:'#a8a4b8',marginBottom:6}}>{bn?'চিহ্নের অর্থ':'Symbol Guide'}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 10px',fontSize:10,color:'var(--text3)'}}>
            {([['A,B,C',bn?'মেজারমেন্ট পয়েন্ট':'Measurement point'],['--- ',bn?'সেলাই ভাতা':'Seam allowance'],['arrow',bn?'গ্রেইন লাইন':'Grain line'],['notch',bn?'মিলানো চিহ্ন':'Matching notch']] as [string,string][]).map(([sym,desc])=>(
              <div key={sym} style={{display:'flex',gap:4}}>
                <span style={{fontFamily:'monospace',color:accent,fontSize:9,minWidth:42}}>{sym}</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seam allowance warning */}
        <div style={{background:'#1a0a08',border:'1px solid #c41e3a44',borderRadius:10,padding:'9px 12px',display:'flex',alignItems:'flex-start',gap:8}}>
          <FaExclamationTriangle size={13} color="#ef4444" style={{flexShrink:0,marginTop:1}}/>
          <span style={{fontSize:11,color:'#e74c3c',lineHeight:1.5}}>{bn?'সেলাই ভাতা অন্তর্ভুক্ত নয়। সব দিকে ০.৫" ও হেমে ১" যোগ করুন।':'Seam allowance NOT included. Add 0.5" all edges, 1" at hem.'}</span>
        </div>
      </>)}
    </CalcShell>
  );
}

export default function GarmentsPattern({history,onAdd,onClear}:CalcProps){
  const{lang}=useLang();const bn=lang==='bn';
  const[section,setSection]=useState<'mt'|'wt'|'mb'|'wb'>('mt');
  const[typeId,setTypeId]=useState('mshirt');
  const currentSection=SECTIONS.find(s=>s.id===section)!;
  const activeType=currentSection.items.find(i=>i.id===typeId)||currentSection.items[0];
  const accent=activeType.color;
  const handleSection=(sid:typeof section)=>{setSection(sid);setTypeId(SECTIONS.find(s=>s.id===sid)!.items[0].id);};

  return(
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',background:'var(--bg)',fontFamily:"'Noto Serif Bengali','Outfit',sans-serif"}}>
      {/* Fixed header tabs */}
      <div style={{flexShrink:0,padding:'10px 14px 0',background:'var(--bg)',borderBottom:'1px solid #1e1e26'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:4,marginBottom:10,background:'var(--surface)',borderRadius:12,padding:4}}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>handleSection(s.id)} style={{padding:'8px 2px',fontSize:9,fontWeight:700,background:section===s.id?'var(--border)':'transparent',color:section===s.id?accent:'var(--text3)',border:'none',borderRadius:8,cursor:'pointer',fontFamily:'inherit',textAlign:'center',lineHeight:1.3,transition:'all 0.15s'}}>
              {bn?s.labelBn:s.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
          {currentSection.items.map(item=>(
            <button key={item.id} onClick={()=>setTypeId(item.id)} style={{padding:'7px 10px',fontSize:11,fontWeight:700,background:typeId===item.id?item.color:'var(--surface)',color:typeId===item.id?'#fff':'#a8a4b8',border:`1.5px solid ${typeId===item.id?item.color:'var(--border)'}`,borderRadius:20,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',whiteSpace:'nowrap'}}>
              {bn?item.labelBn:item.label}
            </button>
          ))}
        </div>
      </div>
      {/* CalcShell fills remaining height */}
      <div style={{flex:1,minHeight:0,overflow:'hidden'}}>
        <PatternCalc key={typeId} typeId={typeId} accent={accent} history={history} onAdd={onAdd} onClear={onClear}/>
      </div>
    </div>
  );
}
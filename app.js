const KEY="alphavalue_opportunities_v1";
let opportunities=JSON.parse(localStorage.getItem(KEY)||"[]");
let selected=null;

const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(opportunities));}
function num(id){const v=parseFloat($(id).value);return Number.isFinite(v)?v:null;}
function render(){
  const tbody=$("oppsTable").querySelector("tbody");
  tbody.innerHTML="";
  $("empty").style.display=opportunities.length?"none":"block";
  opportunities.forEach((o,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${esc(o.match)}</td><td>${esc(o.market)}</td><td>${o.odds??"—"}</td><td>${o.alphaEV??"—"}%</td><td>${o.score??"—"}</td><td><button onclick="selectOpp(${i})">Analizar</button></td>`;
    tbody.appendChild(tr);
  });
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function selectOpp(i){
  selected=opportunities[i];
  const o=selected;
  const marketProb=o.odds?100/o.odds:null;
  // V1: prior conservador que mezcla mercado y AlphaMetri fair odds.
  // Esto NO es un modelo estadístico final; se reemplazará al conectar datos.
  const alphaProb=o.fairOdds?100/o.fairOdds:null;
  const modelProb=(marketProb!=null&&alphaProb!=null)?(marketProb*0.35+alphaProb*0.65):alphaProb??marketProb;
  const fair=modelProb?100/modelProb:null;
  const ev=(modelProb!=null&&o.odds!=null)?(modelProb/100*o.odds-1)*100:null;
  let signal="NEUTRA";
  if(ev!=null){if(ev>=8)signal="🟢 VALUE";else if(ev>=3)signal="🟡 INTERESANTE";else signal="🔴 DESCARTAR";}
  $("analysis").classList.remove("empty");
  $("analysis").innerHTML=`<strong>${esc(o.match)}</strong><br>${esc(o.market)} ${o.line?`(${esc(o.line)})`:""}<br><br>
  AlphaMetri: EV ${o.alphaEV??"—"}%, Fair ${o.fairOdds??"—"}, Score ${o.score??"—"}, Match Edge ${o.matchEdge??"—"}.<br>
  <em>V1: la probabilidad propia es provisional. Todavía no usa StatsHub/APWin.</em>`;
  $("marketProb").textContent=marketProb?marketProb.toFixed(1)+"%":"—";
  $("modelProb").textContent=modelProb?modelProb.toFixed(1)+"%":"—";
  $("modelFair").textContent=fair?fair.toFixed(2):"—";
  $("modelEV").textContent=ev!=null?(ev>=0?"+":"")+ev.toFixed(1)+"%":"—";
  $("signal").textContent=signal;
  $("signal").className=ev>=8?"good":ev>=3?"warn":"bad";
}

function parseAlphaText(text){
  const t=text.replace(/\u00a0/g," ").replace(/\r/g,"\n");
  const lines=t.split("\n").map(x=>x.trim()).filter(Boolean);
  const joined=lines.join(" | ");
  const out={};

  // Common labels and flexible number formats
  const grab=(patterns)=>{
    for(const p of patterns){
      const m=t.match(p);
      if(m) return m[1].trim();
    }
    return "";
  };
  out.match=grab([/Partido\s*:?\s*([^\n|]+)/i,/Match\s*:?\s*([^\n|]+)/i]);
  out.competition=grab([/Competici[oó]n\s*:?\s*([^\n|]+)/i,/League\s*:?\s*([^\n|]+)/i]);
  out.market=grab([/Mercado\s*:?\s*([^\n|]+)/i,/Market\s*:?\s*([^\n|]+)/i]);
  out.line=grab([/L[ií]nea\s*:?\s*([^\n|]+)/i,/Line\s*:?\s*([^\n|]+)/i]);

  const getNum=(patterns)=>{
    const s=grab(patterns);
    if(!s) return null;
    const m=s.replace(",",".").match(/[-+]?\d+(?:\.\d+)?/);
    return m?parseFloat(m[0]):null;
  };
  out.odds=getNum([/Cuota\s*:?\s*([^\n|]+)/i,/Odds?\s*:?\s*([^\n|]+)/i]);
  out.fairOdds=getNum([/Fair\s*Odds?\s*:?\s*([^\n|]+)/i,/Cuota\s*justa\s*:?\s*([^\n|]+)/i]);
  out.alphaEV=getNum([/EV\s*:?\s*([^\n|]+)/i]);
  out.score=getNum([/Score\s*:?\s*([^\n|]+)/i]);
  out.matchEdge=getNum([/Match\s*Edge\s*:?\s*([^\n|]+)/i,/Edge\s*:?\s*([^\n|]+)/i]);

  // If labels are absent, infer obvious values from a pasted market row.
  if(!out.odds){
    const m=joined.match(/(?:@\s*|cuota\s+)(\d+[.,]\d{1,2})/i);
    if(m) out.odds=parseFloat(m[1].replace(",","."));
  }
  if(out.alphaEV==null){
    const m=joined.match(/([+-]\d+(?:[.,]\d+)?)\s*%/);
    if(m) out.alphaEV=parseFloat(m[1].replace(",","."));
  }
  if(!out.score){
    const m=joined.match(/(?:score|edge)[^\d]{0,10}(\d{1,3})/i);
    if(m) out.score=parseFloat(m[1]);
  }
  if(!out.match && lines.length){
    // Best-effort: find a line containing "vs", "v", or " - "
    const candidate=lines.find(x=>/\b(vs?|versus)\b|[–—-]/i.test(x) && x.length<120);
    if(candidate) out.match=candidate;
  }
  if(!out.market && lines.length){
    const candidate=lines.find(x=>/over|under|h[aá]ndicap|\+\d|\-\d|btts|both teams|corners|c[oó]rners|goals|goles|cards|tarjetas/i.test(x));
    if(candidate) out.market=candidate;
  }
  return out;
}

function fillForm(o){
  ["match","competition","market","line","odds","fairOdds","alphaEV","score","matchEdge"].forEach(id=>{
    if(o[id]!==undefined && o[id]!==null) $(id).value=o[id];
  });
}

$("parseAlpha").onclick=()=>{
  const text=$("alphaPaste").value.trim();
  if(!text){$("parseStatus").textContent="Pegá primero el texto de AlphaMetri.";return;}
  const o=parseAlphaText(text);
  fillForm(o);
  const missing=["match","market","odds"].filter(k=>!o[k]);
  $("parseStatus").textContent=missing.length
    ? "Interpretado. Revisá los campos marcados: faltan "+missing.join(", ")+"."
    : "✓ Interpretado. Revisá los campos y agregá la oportunidad.";
};
$("examplePaste").onclick=()=>{
  $("alphaPaste").value=`Partido: Unión Santa Fe vs Central Córdoba
Competición: Liga Profesional Argentina
Mercado: Central Córdoba +1.25
Línea: +1.25
Cuota: 1.65
Fair Odds: 1.33
EV: +24.3%
Score: 83
Match Edge: 90`;
  $("parseAlpha").click();
};

$("addOpportunity").onclick=()=>{
 const o={match:$("match").value.trim(),competition:$("competition").value.trim(),market:$("market").value.trim(),line:$("line").value.trim(),
 odds:num("odds"),fairOdds:num("fairOdds"),alphaEV:num("alphaEV"),score:num("score"),matchEdge:num("matchEdge"),created:new Date().toISOString()};
 if(!o.match||!o.market){alert("Completá al menos Partido y Mercado.");return;}
 opportunities.unshift(o);save();render();selectOpp(0);
 ["match","competition","market","line","odds","fairOdds","alphaEV","score","matchEdge"].forEach(id=>$(id).value="");
};
$("example").onclick=()=>{
 const vals={match:"Unión Santa Fe vs Central Córdoba",competition:"Liga Profesional Argentina",market:"Central Córdoba +1.25",line:"+1.25",odds:1.65,fairOdds:1.33,alphaEV:24.3,score:83,matchEdge:90};
 Object.entries(vals).forEach(([k,v])=>$(k).value=v);
};
$("clearAll").onclick=()=>{if(confirm("¿Borrar todas las oportunidades?")){opportunities=[];save();render();}};
render();
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
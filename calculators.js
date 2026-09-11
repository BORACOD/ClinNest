function fmt(n, d=2){ return Number(n).toLocaleString(undefined,{minimumFractionDigits:d, maximumFractionDigits:d}); }
function copyResult(text){ navigator.clipboard.writeText(text).catch(()=>{}); }

function addCopyBtn(containerId, text){
  const el = document.getElementById(containerId);
  const btn = document.createElement('button');
  btn.type='button';
  btn.className='copy-btn';
  btn.textContent='Copy for source note';
  btn.onclick=()=>copyResult(text);
  el.appendChild(btn);
}

/* ---- BMI ---- */
function calcBMI(){
  const wt = parseFloat(document.getElementById('bmi-wt').value);
  const ht = parseFloat(document.getElementById('bmi-ht').value)/100;
  const out = document.getElementById('bmi-result');
  if(!wt || !ht){ out.innerHTML='Enter weight and height.'; return; }
  const bmi = wt/(ht*ht);
  const text = `BMI: ${fmt(bmi,1)} kg/m²  (weight ${wt} kg, height ${ht*100} cm) — computed by CRC OS`;
  out.innerHTML = `<span class="headline">${fmt(bmi,1)} kg/m²</span><span class="formula">BMI = weight(kg) / height(m)²</span>`;
  addCopyBtn('bmi-result', text);
}

/* ---- BSA ---- */
function calcBSA(){
  const wt = parseFloat(document.getElementById('bsa-wt').value);
  const ht = parseFloat(document.getElementById('bsa-ht').value);
  const out = document.getElementById('bsa-result');
  if(!wt || !ht){ out.innerHTML='Enter weight and height.'; return; }
  const mosteller = Math.sqrt((wt*ht)/3600);
  const dubois = 0.007184*Math.pow(wt,0.425)*Math.pow(ht,0.725);
  const haycock = 0.024265*Math.pow(wt,0.5378)*Math.pow(ht,0.3964);
  const boyd = 0.0003207*Math.pow(wt,(0.7285-0.0188*Math.log10(wt)))*Math.pow(ht,0.3);
  out.innerHTML = `<span class="headline">Mosteller: ${fmt(mosteller,2)} m²</span>` +
    `<span class="formula">Du Bois: ${fmt(dubois,2)} m²  |  Haycock: ${fmt(haycock,2)} m²  |  Boyd: ${fmt(boyd,2)} m²</span>`;
  addCopyBtn('bsa-result', `BSA (Mosteller): ${fmt(mosteller,2)} m² | Du Bois: ${fmt(dubois,2)} m² | Haycock: ${fmt(haycock,2)} m² | Boyd: ${fmt(boyd,2)} m² — wt ${wt}kg, ht ${ht}cm — CRC OS`);
}

/* ---- Creatinine clearance / eGFR ---- */
function calcCrCl(){
  const age = parseFloat(document.getElementById('cr-age').value);
  const sex = document.getElementById('cr-sex').value;
  const wt = parseFloat(document.getElementById('cr-wt').value);
  const scr = parseFloat(document.getElementById('cr-scr').value);
  const out = document.getElementById('cr-result');
  if(!age || !wt || !scr){ out.innerHTML='Enter age, weight, and serum creatinine.'; return; }

  // Cockcroft-Gault
  let cg = ((140-age)*wt)/(72*scr);
  if(sex==='F') cg *= 0.85;

  // CKD-EPI 2021 (race-free)
  const kappa = sex==='F' ? 0.7 : 0.9;
  const alpha = sex==='F' ? -0.241 : -0.302;
  const scrK = scr/kappa;
  const minTerm = Math.pow(Math.min(scrK,1), alpha);
  const maxTerm = Math.pow(Math.max(scrK,1), -1.200);
  let egfr = 142 * minTerm * maxTerm * Math.pow(0.9938, age);
  if(sex==='F') egfr *= 1.012;

  out.innerHTML = `<span class="headline">Cockcroft-Gault: ${fmt(cg,1)} mL/min</span>` +
    `<span class="formula">CKD-EPI 2021 eGFR: ${fmt(egfr,1)} mL/min/1.73m²</span>` +
    `<span class="formula">CG = [(140-age)×weight(kg)] / (72×SCr) ${sex==='F'?'× 0.85':''}. CKD-EPI 2021 is race-free per NKF/ASN recommendation.</span>` +
    (Math.abs(cg-egfr) > 15 ? `<br><span class="flag-warn">⚠ Formulas diverge by >15 — check which one the protocol specifies for eligibility.</span>` : '');
  addCopyBtn('cr-result', `CrCl (Cockcroft-Gault): ${fmt(cg,1)} mL/min | eGFR (CKD-EPI 2021): ${fmt(egfr,1)} mL/min/1.73m² — age ${age}, ${sex}, wt ${wt}kg, SCr ${scr} — CRC OS`);
}

/* ---- Dose conversion ---- */
function calcDoseConv(){
  const dose = parseFloat(document.getElementById('dc-dose').value);
  const dir = document.getElementById('dc-dir').value;
  const wt = parseFloat(document.getElementById('dc-wt').value);
  const ht = parseFloat(document.getElementById('dc-ht').value);
  const out = document.getElementById('dc-result');
  if(!dose || !wt || !ht){ out.innerHTML='Enter dose, weight, and height.'; return; }
  const bsa = Math.sqrt((wt*ht)/3600); // Mosteller
  let result, label;
  if(dir==='k2m'){ result = dose*wt/bsa; label='mg/m²'; }
  else { result = dose*bsa/wt; label='mg/kg'; }
  out.innerHTML = `<span class="headline">${fmt(result,2)} ${label}</span><span class="formula">Using BSA (Mosteller) = ${fmt(bsa,2)} m²</span>`;
  addCopyBtn('dc-result', `Dose conversion: ${dose} → ${fmt(result,2)} ${label} (BSA Mosteller ${fmt(bsa,2)} m²) — CRC OS`);
}

/* ---- Infusion rate ---- */
function calcInfusion(){
  const vol = parseFloat(document.getElementById('ir-vol').value);
  const min = parseFloat(document.getElementById('ir-min').value);
  const drop = parseFloat(document.getElementById('ir-drop').value);
  const out = document.getElementById('ir-result');
  if(!vol || !min){ out.innerHTML='Enter volume and duration.'; return; }
  const mlhr = vol/(min/60);
  let extra = '';
  if(drop){
    const gttmin = (vol*drop)/min;
    extra = `<span class="formula">Drip rate: ${fmt(gttmin,0)} gtt/min (drop factor ${drop} gtt/mL)</span>`;
  }
  out.innerHTML = `<span class="headline">${fmt(mlhr,1)} mL/hr</span>${extra}`;
  addCopyBtn('ir-result', `Infusion rate: ${fmt(mlhr,1)} mL/hr for ${vol}mL over ${min}min — CRC OS`);
}

/* ---- Age / date ---- */
function calcAge(){
  const dob = new Date(document.getElementById('age-dob').value);
  const ref = new Date(document.getElementById('age-ref').value);
  const out = document.getElementById('age-result');
  if(isNaN(dob) || isNaN(ref)){ out.innerHTML='Enter both dates.'; return; }
  const days = Math.round((ref-dob)/86400000);
  let years = ref.getFullYear()-dob.getFullYear();
  const m = ref.getMonth()-dob.getMonth();
  if(m<0 || (m===0 && ref.getDate()<dob.getDate())) years--;
  out.innerHTML = `<span class="headline">${years} years old</span><span class="formula">${days} total days between dates</span>`;
  addCopyBtn('age-result', `Age at reference date: ${years} years (${days} days) — CRC OS`);
}

/* ---- Unit converter ---- */
function calcUnit(){
  const v = parseFloat(document.getElementById('uc-val').value);
  const type = document.getElementById('uc-type').value;
  const out = document.getElementById('uc-result');
  if(isNaN(v)){ out.innerHTML='Enter a value.'; return; }
  let r, label;
  switch(type){
    case 'lbkg': r=v*0.453592; label='kg'; break;
    case 'kglb': r=v/0.453592; label='lb'; break;
    case 'incm': r=v*2.54; label='cm'; break;
    case 'cmin': r=v/2.54; label='in'; break;
    case 'fc': r=(v-32)*5/9; label='°C'; break;
    case 'cf': r=(v*9/5)+32; label='°F'; break;
    case 'glucose_mgdl_mmol': r=v/18.0182; label='mmol/L'; break;
    case 'glucose_mmol_mgdl': r=v*18.0182; label='mg/dL'; break;
    case 'creat_mgdl_umol': r=v*88.42; label='µmol/L'; break;
    case 'creat_umol_mgdl': r=v/88.42; label='mg/dL'; break;
  }
  out.innerHTML = `<span class="headline">${fmt(r,3)} ${label}</span>`;
  addCopyBtn('uc-result', `${v} → ${fmt(r,3)} ${label} — CRC OS`);
}

/* ---- Visit window calculator ---- */
let visitRows = [];
function addVisitRow(){
  const raw = document.getElementById('vw-schedule').value.trim();
  if(!raw) return;
  const parts = raw.split(',').map(s=>s.trim());
  if(parts.length<3){ alert('Format: day, ± window days, label — e.g. 14,3,Week 2'); return; }
  visitRows.push({day:parseFloat(parts[0]), window:parseFloat(parts[1]), label:parts.slice(2).join(',')});
  document.getElementById('vw-schedule').value='';
  const listEl = document.getElementById('vw-list');
  listEl.style.display='block';
  listEl.innerHTML = visitRows.map(v=>`Day ${v.day} (±${v.window}) — ${v.label}`).join('\n');
}
function resetVisits(){
  visitRows=[];
  document.getElementById('vw-list').style.display='none';
  document.getElementById('vw-list').innerHTML='';
  document.getElementById('vw-result').innerHTML='';
}
function calcVisitWindows(){
  const day1val = document.getElementById('vw-day1').value;
  const out = document.getElementById('vw-result');
  if(!day1val){ out.innerHTML='<div class="result">Set Day 1 first.</div>'; return; }
  if(visitRows.length===0){ out.innerHTML='<div class="result">Add at least one visit.</div>'; return; }
  const day1 = new Date(day1val+'T00:00:00');
  let rows = visitRows.map(v=>{
    const target = new Date(day1); target.setDate(target.getDate()+v.day);
    const early = new Date(target); early.setDate(early.getDate()-v.window);
    const late = new Date(target); late.setDate(late.getDate()+v.window);
    const dow = target.toLocaleDateString(undefined,{weekday:'short'});
    const weekend = (target.getDay()===0 || target.getDay()===6);
    return {label:v.label, target, early, late, dow, weekend};
  });
  const dstr = d => d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
  let html = `<table class="visit-table"><thead><tr><th>Visit</th><th>Target date</th><th>Window opens</th><th>Window closes</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    html += `<tr class="${r.weekend?'oow':''}"><td>${r.label}</td><td>${dstr(r.target)} (${r.dow})${r.weekend?' ⚠ weekend':''}</td><td>${dstr(r.early)}</td><td>${dstr(r.late)}</td></tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('vw-result').innerHTML = `<div class="panel" style="border-left:3px solid var(--teal); margin-top:14px;">${html}
    <button class="copy-btn" onclick="copyVisitTable()">Copy for source note</button></div>`;
  window._vwRows = rows;
  window._vwDstr = dstr;
}
function copyVisitTable(){
  const rows = window._vwRows||[]; const dstr = window._vwDstr;
  const text = rows.map(r=>`${r.label}: target ${dstr(r.target)}, window ${dstr(r.early)}–${dstr(r.late)}${r.weekend?' (weekend)':''}`).join('\n');
  copyResult('Visit schedule — CRC OS\n'+text);
}

/* ---- QTc ---- */
function calcQTc(){
  const qt = parseFloat(document.getElementById('qtc-qt').value);
  const hr = parseFloat(document.getElementById('qtc-hr').value);
  const out = document.getElementById('qtc-result');
  if(!qt || !hr){ out.innerHTML='Enter QT and heart rate.'; return; }
  const rr = 60/hr; // seconds
  const qtSec = qt/1000;
  const bazett = (qtSec/Math.sqrt(rr))*1000;
  const fridericia = (qtSec/Math.cbrt(rr))*1000;
  const framingham = (qtSec + 0.154*(1-rr))*1000;
  out.innerHTML = `<span class="headline">Bazett: ${fmt(bazett,0)} ms</span>` +
    `<span class="formula">Fridericia: ${fmt(fridericia,0)} ms  |  Framingham: ${fmt(framingham,0)} ms  (RR ${fmt(rr,2)}s)</span>`;
  addCopyBtn('qtc-result', `QTc — Bazett ${fmt(bazett,0)}ms, Fridericia ${fmt(fridericia,0)}ms, Framingham ${fmt(framingham,0)}ms (QT ${qt}ms, HR ${hr}) — CRC OS`);
}

/* ---- IBW / Adjusted BW ---- */
function calcIBW(){
  const sex = document.getElementById('ibw-sex').value;
  const htCm = parseFloat(document.getElementById('ibw-ht').value);
  const wt = parseFloat(document.getElementById('ibw-wt').value);
  const out = document.getElementById('ibw-result');
  if(!htCm || !wt){ out.innerHTML='Enter height and weight.'; return; }
  const htIn = htCm/2.54;
  const base = sex==='F' ? 45.5 : 50;
  const ibw = base + 2.3*(htIn-60);
  let extra = '';
  let text = `IBW ${fmt(ibw,1)}kg`;
  if(wt > ibw*1.2){
    const adjbw = ibw + 0.4*(wt-ibw);
    extra = `<span class="formula">Actual weight exceeds ~120% of IBW — Adjusted BW: ${fmt(adjbw,1)} kg</span>`;
    text += `, AdjBW ${fmt(adjbw,1)}kg (actual wt ${wt}kg exceeds 120% IBW)`;
  }
  out.innerHTML = `<span class="headline">IBW: ${fmt(ibw,1)} kg</span>${extra}<span class="formula">Devine: ${sex==='F'?'45.5':'50'} + 2.3 × (height(in) − 60)</span>`;
  addCopyBtn('ibw-result', text+' — CRC OS');
}

/* ---- Study day ---- */
function calcStudyDay(){
  const day1val = document.getElementById('sd-day1').value;
  const n = parseInt(document.getElementById('sd-day').value);
  const out = document.getElementById('sd-result');
  if(!day1val || isNaN(n)){ out.innerHTML='Enter Day 1 and a study day.'; return; }
  const day1 = new Date(day1val+'T00:00:00');
  const offset = n>0 ? n-1 : n;
  const d = new Date(day1); d.setDate(d.getDate()+offset);
  const dstr = d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric', weekday:'short'});
  out.innerHTML = `<span class="headline">Day ${n} = ${dstr}</span><span class="formula">No Day 0 exists between Day -1 and Day 1</span>`;
  addCopyBtn('sd-result', `Study Day ${n} = ${dstr} (Day 1 = ${day1val}) — CRC OS`);
}

/* ---- Date add/subtract ---- */
function calcDateAdd(){
  const dateVal = document.getElementById('da-date').value;
  const days = parseInt(document.getElementById('da-days').value);
  const out = document.getElementById('da-result');
  if(!dateVal || isNaN(days)){ out.innerHTML='Enter a date and number of days.'; return; }
  const d = new Date(dateVal+'T00:00:00'); d.setDate(d.getDate()+days);
  const dstr = d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric', weekday:'short'});
  out.innerHTML = `<span class="headline">${dstr}</span>`;
  addCopyBtn('da-result', `${dateVal} ${days>=0?'+':''}${days} days = ${dstr} — CRC OS`);
}

/* ---- SAE timeline ---- */
function calcSAETimeline(){
  const val = document.getElementById('sae-aware').value;
  const out = document.getElementById('sae-result');
  if(!val){ out.innerHTML='Enter the date/time of awareness.'; return; }
  const t0 = new Date(val);
  const fmtDT = d => d.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const h24 = new Date(t0); h24.setHours(h24.getHours()+24);
  const d7 = new Date(t0); d7.setDate(d7.getDate()+7);
  const d15 = new Date(t0); d15.setDate(d15.getDate()+15);
  out.innerHTML = `<span class="headline">24-hr notification: ${fmtDT(h24)}</span>` +
    `<span class="formula">7-day report (fatal/life-threatening unexpected): ${fmtDT(d7)}</span>` +
    `<span class="formula">15-day report (other serious unexpected): ${fmtDT(d15)}</span>`;
  addCopyBtn('sae-result', `SAE aware ${fmtDT(t0)} → 24hr: ${fmtDT(h24)} | 7-day: ${fmtDT(d7)} | 15-day: ${fmtDT(d15)} — CRC OS`);
}

/* ---- Naranjo ---- */
const naranjoQ = [
  {q:"1. Are there previous conclusive reports on this reaction?", opts:{yes:1,no:0,unk:0}},
  {q:"2. Did the adverse event appear after the suspected drug was given?", opts:{yes:2,no:-1,unk:0}},
  {q:"3. Did the reaction improve when the drug was discontinued or a specific antagonist given?", opts:{yes:1,no:0,unk:0}},
  {q:"4. Did the reaction reappear when the drug was readministered?", opts:{yes:2,no:-1,unk:0}},
  {q:"5. Are there alternative causes that could have caused the reaction?", opts:{yes:-1,no:2,unk:0}},
  {q:"6. Did the reaction reappear when a placebo was given?", opts:{yes:-1,no:1,unk:0}},
  {q:"7. Was the drug detected in blood/fluids at known-toxic concentrations?", opts:{yes:1,no:0,unk:0}},
  {q:"8. Was the reaction more severe with dose increase, or less severe with dose decrease?", opts:{yes:1,no:0,unk:0}},
  {q:"9. Did the patient have a similar reaction to the same/similar drug previously?", opts:{yes:1,no:0,unk:0}},
  {q:"10. Was the adverse event confirmed by objective evidence?", opts:{yes:1,no:0,unk:0}}
];
(function buildNaranjo(){
  const el = document.getElementById('naranjo-form');
  if(!el) return;
  el.innerHTML = naranjoQ.map((item,i)=>`
    <div class="field-row">
      <div class="field" style="flex:3 1 300px;"><label for="nar-${i}">${item.q}</label></div>
      <div class="field" style="flex:1 1 140px;">
        <select id="nar-${i}"><option value="unk">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select>
      </div>
    </div>`).join('');
})();
function calcNaranjo(){
  let score = 0;
  naranjoQ.forEach((item,i)=>{
    const v = document.getElementById('nar-'+i).value;
    score += item.opts[v];
  });
  let cat = score>=9?'Definite':score>=5?'Probable':score>=1?'Possible':'Doubtful';
  const out = document.getElementById('naranjo-result');
  out.innerHTML = `<span class="headline">Score: ${score} — ${cat}</span>`;
  addCopyBtn('naranjo-result', `Naranjo score ${score} (${cat}) — CRC OS`);
}

/* ---- CTCAE quick reference ---- */
const ctcaeData = [
  ["Rash maculo-papular","<10% BSA","10-30% BSA, ±symptoms","30%+ BSA, or limiting self-care ADL","Life-threatening; skin sloughing"],
  ["Pruritus","Mild, topical intervention","Intense/widespread, oral intervention, limiting ADL","","-"],
  ["Fatigue","Relieved by rest","Not relieved by rest, limiting instrumental ADL","Not relieved by rest, limiting self-care ADL","-"],
  ["Headache","Mild","Moderate, limiting instrumental ADL","Severe, limiting self-care ADL","-"],
  ["Nausea","Loss of appetite, no eating change","Oral intake decreased, no weight loss","Inadequate oral intake, tube feeding/TPN indicated","-"],
  ["Diarrhea","<4 stools/day over baseline","4-6 stools/day over baseline, limiting instrumental ADL","7+ stools/day, incontinence, limiting self-care ADL","Life-threatening"],
  ["Injection site reaction","Tenderness with/without erythema","Pain, lipodystrophy, edema, phlebitis","Ulceration or necrosis; severe tissue damage","Life-threatening"],
  ["ALT increased","> ULN - 3.0×ULN","3.0 - 5.0×ULN","5.0 - 20.0×ULN","20.0×ULN"],
  ["AST increased","> ULN - 3.0×ULN","3.0 - 5.0×ULN","5.0 - 20.0×ULN","20.0×ULN"],
  ["Neutrophil count decreased","<LLN - 1500/mm³","<1500 - 1000/mm³","<1000 - 500/mm³","<500/mm³"],
  ["White blood cell decreased","<LLN - 3000/mm³","<3000 - 2000/mm³","<2000 - 1000/mm³","<1000/mm³"],
  ["Platelet count decreased","<LLN - 75,000/mm³","<75,000 - 50,000/mm³","<50,000 - 25,000/mm³","<25,000/mm³"],
  ["Hypertension","Prehypertension","Recurrent/persistent; medical intervention indicated","Severe; medical intervention indicated","Life-threatening crisis"],
  ["Upper respiratory infection","Mild, intervention not indicated","Moderate, medical intervention indicated","Severe, IV antibiotics indicated","Life-threatening"],
  ["Alopecia","<50% hair loss, not obvious","≥50% hair loss, obvious; psychosocial impact","-","-"],
  ["Dry skin","Covering <10% BSA, no erythema/pruritus","10-30% BSA, erythema/pruritus, limiting instrumental ADL","30%+ BSA, limiting self-care ADL","-"],
  ["Edema limbs","Trace, asymptomatic","Symptomatic, limiting instrumental ADL","Limiting self-care ADL","Life-threatening"],
  ["Weight gain","5-<10% baseline","10-<20% baseline","≥20% baseline","-"],
  ["Weight loss","5-<10% baseline, intervention not indicated","10-<20%, nutritional support indicated","≥20%, tube feeding/TPN indicated","Life-threatening"],
  ["Insomnia","Mild difficulty falling/staying asleep","Moderate; medication indicated, limiting instrumental ADL","Severe, limiting self-care ADL","-"]
];
(function buildCTCAE(){
  const body = document.getElementById('ctcae-body');
  if(!body) return;
  body.innerHTML = ctcaeData.map(r=>`<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('');
})();
function filterCTCAE(){
  const q = document.getElementById('ctcae-search').value.toLowerCase();
  document.querySelectorAll('#ctcae-body tr').forEach(tr=>{
    tr.classList.toggle('hidden', !tr.textContent.toLowerCase().includes(q));
  });
}

/* ---- Deviation classifier ---- */
function calcDeviation(){
  const safety = document.getElementById('dev-safety').value;
  const data = document.getElementById('dev-data').value;
  const scope = document.getElementById('dev-scope').value;
  const out = document.getElementById('dev-result');
  let cls, guidance;
  if(safety==='yes'){
    cls='Major'; guidance='Report to IRB per site SOP timeline; notify sponsor immediately; document corrective/preventive action (CAPA).';
  } else if(data==='yes' && scope==='systemic'){
    cls='Major'; guidance='Likely reportable — systemic process failures affecting data integrity typically require IRB notification and a CAPA plan.';
  } else if(data==='yes'){
    cls='Minor (verify)'; guidance="Document in deviation log; assess whether isolated data-integrity impact meets your IRB's reportable threshold.";
  } else {
    cls='Minor'; guidance='Document in the site deviation log per SOP; no IRB reporting typically required for isolated, non-safety, non-data-integrity deviations.';
  }
  out.innerHTML = `<span class="headline">${cls}</span><span class="formula">${guidance}</span>`;
  addCopyBtn('dev-result', `Deviation classification: ${cls} — ${guidance} — CRC OS`);
}

/* ---- Block randomization ---- */
function genRandomization(){
  const arms = document.getElementById('br-arms').value.split(',').map(s=>s.trim()).filter(Boolean);
  const blockSize = parseInt(document.getElementById('br-blocksize').value);
  const numBlocks = parseInt(document.getElementById('br-blocks').value);
  const out = document.getElementById('br-result');
  if(arms.length<2 || !blockSize || !numBlocks || blockSize % arms.length !== 0){
    out.innerHTML = 'Block size must be an even multiple of the number of arms.'; return;
  }
  const perArm = blockSize/arms.length;
  let sequence = [];
  for(let b=0; b<numBlocks; b++){
    let block = [];
    arms.forEach(a=>{ for(let i=0;i<perArm;i++) block.push(a); });
    for(let i=block.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [block[i],block[j]]=[block[j],block[i]]; }
    sequence.push(block);
  }
  const text = sequence.map((b,i)=>`Block ${i+1}: ${b.join(', ')}`).join('\n');
  out.innerHTML = `<div class="headline" style="font-size:15px;">Reference sequence generated</div><span class="formula">${text.replace(/\n/g,'<br>')}</span>`;
  addCopyBtn('br-result', `Randomization (reference only, not for production use):\n${text} — CRC OS`);
}

/* ---- IP compliance ---- */
function calcIPCompliance(){
  const exp = parseFloat(document.getElementById('ipc-expected').value);
  const disp = parseFloat(document.getElementById('ipc-dispensed').value);
  const ret = parseFloat(document.getElementById('ipc-returned').value);
  const out = document.getElementById('ipc-result');
  if(!exp){ out.innerHTML='Enter expected doses.'; return; }
  const taken = disp-ret;
  const pct = (taken/exp)*100;
  out.innerHTML = `<span class="headline">${fmt(pct,1)}% compliance</span><span class="formula">(${disp} dispensed − ${ret} returned = ${taken} taken) / ${exp} expected</span>` +
    (pct<80 || pct>120 ? `<br><span class="flag-warn">⚠ Outside typical 80-120% compliance range — review with PI.</span>` : '');
  addCopyBtn('ipc-result', `IP compliance: ${fmt(pct,1)}% (${taken}/${exp} expected) — CRC OS`);
}

/* ---- IP reconciliation ---- */
function calcIPRecon(){
  const rec = parseFloat(document.getElementById('ipr-received').value)||0;
  const disp = parseFloat(document.getElementById('ipr-dispensed').value)||0;
  const ret = parseFloat(document.getElementById('ipr-returned').value)||0;
  const dest = parseFloat(document.getElementById('ipr-destroyed').value)||0;
  const out = document.getElementById('ipr-result');
  const onsite = rec - disp;
  const discrepancy = rec - disp - dest;
  out.innerHTML = `<span class="headline">On-site inventory: ${fmt(onsite,0)} units</span>` +
    `<span class="formula">Received ${rec} − dispensed ${disp} − destroyed/lost ${dest} = ${fmt(discrepancy,0)}</span>` +
    (discrepancy!==0 ? `<br><span class="flag-warn">⚠ Discrepancy of ${fmt(discrepancy,0)} — investigate and document before next monitoring visit.</span>` : `<br>No discrepancy.`);
  addCopyBtn('ipr-result', `IP reconciliation: on-site ${onsite}, discrepancy ${discrepancy} — CRC OS`);
}

/* ---- VASI ---- */
const vasiRegions = ["Head/neck","Trunk","Arms","Legs","Hands","Feet"];
const vasiPcts = [0,10,25,50,75,90,100];
(function buildVASI(){
  const el = document.getElementById('vasi-form');
  if(!el) return;
  el.innerHTML = vasiRegions.map((r,i)=>`
    <div class="field-row">
      <div class="field"><label for="vasi-hu-${i}">${r} — hand units affected</label><input type="number" id="vasi-hu-${i}" min="0" step="0.5"></div>
      <div class="field"><label for="vasi-pct-${i}">${r} — % depigmentation</label>
        <select id="vasi-pct-${i}">${vasiPcts.map(p=>`<option value="${p}">${p}%</option>`).join('')}</select>
      </div>
    </div>`).join('');
})();
function calcVASI(){
  let total = 0;
  const breakdown = [];
  vasiRegions.forEach((r,i)=>{
    const hu = parseFloat(document.getElementById('vasi-hu-'+i).value)||0;
    const pct = parseFloat(document.getElementById('vasi-pct-'+i).value)||0;
    const val = hu*(pct/100);
    total += val;
    if(hu>0) breakdown.push(`${r}: ${hu}hu × ${pct}% = ${fmt(val,2)}`);
  });
  const out = document.getElementById('vasi-result');
  out.innerHTML = `<span class="headline">VASI: ${fmt(total,2)}</span><span class="formula">${breakdown.join(' | ')||'Enter hand units per region.'}</span>`;
  addCopyBtn('vasi-result', `VASI: ${fmt(total,2)} (${breakdown.join('; ')}) — CRC OS`);
}

/* ---- SALT ---- */
function calcSALT(){
  const w = {vertex:0.40, back:0.24, right:0.18, left:0.18};
  let total = 0;
  Object.keys(w).forEach(k=>{
    const v = parseFloat(document.getElementById('salt-'+k).value)||0;
    total += w[k]*v;
  });
  const out = document.getElementById('salt-result');
  out.innerHTML = `<span class="headline">SALT: ${fmt(total,1)}</span><span class="formula">Σ(region weight × % hair loss)</span>`;
  addCopyBtn('salt-result', `SALT score: ${fmt(total,1)} — CRC OS`);
}

/* ---- EASI ---- */
const easiRegions = [
  {key:'head', label:'Head/neck', mult:0.1},
  {key:'trunk', label:'Trunk', mult:0.3},
  {key:'upper', label:'Upper limbs', mult:0.2},
  {key:'lower', label:'Lower limbs', mult:0.4}
];
function easiAreaScore(pct){
  if(pct<=0) return 0;
  if(pct<10) return 1;
  if(pct<30) return 2;
  if(pct<50) return 3;
  if(pct<70) return 4;
  if(pct<90) return 5;
  return 6;
}
(function buildEASI(){
  const el = document.getElementById('easi-form');
  if(!el) return;
  el.innerHTML = easiRegions.map(r=>`
    <div class="region-grid">
      <div class="region-title" id="easi-${r.key}-title">${r.label} (×${r.mult})</div>
      <div class="field"><label for="easi-${r.key}-e">Erythema (0-3)</label><input type="number" id="easi-${r.key}-e" min="0" max="3" step="1" aria-describedby="easi-${r.key}-title"></div>
      <div class="field"><label for="easi-${r.key}-i">Induration/papulation (0-3)</label><input type="number" id="easi-${r.key}-i" min="0" max="3" step="1" aria-describedby="easi-${r.key}-title"></div>
      <div class="field"><label for="easi-${r.key}-x">Excoriation (0-3)</label><input type="number" id="easi-${r.key}-x" min="0" max="3" step="1" aria-describedby="easi-${r.key}-title"></div>
      <div class="field"><label for="easi-${r.key}-l">Lichenification (0-3)</label><input type="number" id="easi-${r.key}-l" min="0" max="3" step="1" aria-describedby="easi-${r.key}-title"></div>
      <div class="field"><label for="easi-${r.key}-a">% BSA affected in region</label><input type="number" id="easi-${r.key}-a" min="0" max="100" step="1" aria-describedby="easi-${r.key}-title"></div>
    </div>`).join('');
})();
function calcEASI(){
  let total = 0;
  const breakdown = [];
  easiRegions.forEach(r=>{
    const e = parseFloat(document.getElementById(`easi-${r.key}-e`).value)||0;
    const i = parseFloat(document.getElementById(`easi-${r.key}-i`).value)||0;
    const x = parseFloat(document.getElementById(`easi-${r.key}-x`).value)||0;
    const l = parseFloat(document.getElementById(`easi-${r.key}-l`).value)||0;
    const a = parseFloat(document.getElementById(`easi-${r.key}-a`).value)||0;
    const signs = e+i+x+l;
    const areaScore = easiAreaScore(a);
    const regionScore = signs*areaScore*r.mult;
    total += regionScore;
    if(signs>0 || a>0) breakdown.push(`${r.label}: ${fmt(regionScore,2)}`);
  });
  const out = document.getElementById('easi-result');
  out.innerHTML = `<span class="headline">EASI: ${fmt(total,1)} / 72</span><span class="formula">${breakdown.join(' | ')||'Enter sign scores per region.'}</span>`;
  addCopyBtn('easi-result', `EASI: ${fmt(total,1)}/72 (${breakdown.join('; ')}) — CRC OS`);
}

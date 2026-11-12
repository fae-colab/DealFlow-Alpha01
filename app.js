'use strict';
const STORAGE_KEY='dealflow-alpha-v1.3';
const LEGACY_STORAGE_KEYS=['dealflow-alpha-v1.2','dealflow-alpha-v1.1'];
const seed=[
{id:'DF-01',opportunityId:'DEAL-01',name:'Marina buyer — 2BR',action:'Confirm viewing and financing readiness',commission:24000,pWith:58,pWithout:38,effort:75,deadline:5,dependency:'',note:'Buyer requested a second viewing; timing is tight.'},
{id:'DF-02',opportunityId:'DEAL-02',name:'Downtown seller — 1BR',action:'Call seller with revised pricing evidence',commission:18000,pWith:52,pWithout:43,effort:45,deadline:12,dependency:'',note:'Recent comparable listings support a price adjustment.'},
{id:'DF-03',opportunityId:'DEAL-03',name:'Business Bay investor',action:'Prepare tailored unit shortlist',commission:32000,pWith:42,pWithout:24,effort:110,deadline:24,dependency:'',note:'Investor has shared budget and preferred yield range.'},
{id:'DF-04',opportunityId:'DEAL-04',name:'JVC family buyer',action:'Resolve mortgage pre-approval question',commission:21000,pWith:63,pWithout:57,effort:35,deadline:3,dependency:'',note:'A small blocker may prevent the next viewing.'},
{id:'DF-05',opportunityId:'DEAL-05',name:'Palm seller lead',action:'Verify ownership and selling authority',commission:45000,pWith:30,pWithout:18,effort:90,deadline:48,dependency:'',note:'High potential payout, but authority is not yet verified.'},
{id:'DF-06',opportunityId:'DEAL-06',name:'Creek Harbour buyer',action:'Send requested floor-plan comparison',commission:16000,pWith:55,pWithout:35,effort:30,deadline:8,dependency:'',note:'Client explicitly asked for a comparison today.'},
{id:'DF-07',opportunityId:'DEAL-07',name:'Arjan landlord',action:'Confirm rental price and listing mandate',commission:9000,pWith:48,pWithout:40,effort:40,deadline:36,dependency:'',note:'Potential listing; lower commission and moderate urgency.'},
{id:'DF-08',opportunityId:'DEAL-08',name:'Bluewaters buyer',action:'Coordinate second viewing with decision-makers',commission:38000,pWith:46,pWithout:29,effort:100,deadline:6,dependency:'',note:'Multiple decision-makers need to attend.'}
];
let state=loadState(),latestRun=null;
function normalizeAction(a){return DealFlowEvidence.normalizeAction(a);}
function ensureAuditState(s){
 if(!Array.isArray(s.outcomeEvents))s.outcomeEvents=DealFlowAudit.migrateLegacyOutcomes(s.outcomes||[],s.actions||[]);
 if(!Array.isArray(s.recommendationSnapshots))s.recommendationSnapshots=[];
 if(!Array.isArray(s.outcomes))s.outcomes=[];
 return s;
}
function loadState(){
 const keys=[STORAGE_KEY,...LEGACY_STORAGE_KEYS];
 for(const key of keys){try{const raw=localStorage.getItem(key);if(!raw)continue;return ensureAuditState(DealFlowEvidence.migrateState(JSON.parse(raw),seed));}catch(e){console.warn('DealFlow state migration skipped for '+key,e);}}
 return ensureAuditState(DealFlowEvidence.createInitialState(seed));
}
function save(){try{state.version='1.3';state.schemaVersion=DealFlowEvidence.SCHEMA_VERSION;ensureAuditState(state);localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){alert('This browser could not save local data. Your current changes may be lost when the page closes.');}}
function money(n){return new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n||0)+' AED';}
function pct(n){return Math.round(n)+'%';}
function inc(a){return DealFlowEngine.incremental(a);}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function runOptimization(){
 const raw=document.getElementById('capacity').value;const capacity=Number(raw);
 if(!Number.isFinite(capacity)||capacity<=0||capacity>24){alert('Available time must be greater than 0 and no more than 24 hours.');return;}
 const errors=DealFlowEngine.validatePortfolio(state.actions,capacity,[]);if(errors.length){alert('Please correct the portfolio first:\n\n'+errors.join('\n'));return;}
 const best=DealFlowEngine.optimize(state.actions,capacity,[]);
 const commission=DealFlowEngine.greedy(state.actions,capacity,a=>a.commission,[]);
 const hourly=DealFlowEngine.greedy(state.actions,capacity,a=>inc(a)/(a.effort/60),[]);
 latestRun={at:new Date().toISOString(),capacity,best,commission,hourly};
 const snapshot=DealFlowAudit.createRecommendationSnapshot({runId:'RUN-'+crypto.randomUUID(),createdAt:latestRun.at,capacityHours:capacity,actions:state.actions,evidence:state.evidence,result:best,schemaVersion:state.schemaVersion});
 if(DealFlowAudit.validateSnapshot(snapshot).length)throw new Error('Recommendation snapshot validation failed.');
 state.recommendationSnapshots=DealFlowAudit.appendRecommendationSnapshot(state.recommendationSnapshots,snapshot);
 state.history.unshift({at:latestRun.at,capacity,value:best.value,minutes:best.minutes,ids:best.items.map(x=>x.id)});
 save();render();
}
function metric(label,value,caption){return `<div class="metric"><span>${safe(label)}</span><strong>${safe(value)}</strong><small>${safe(caption)}</small></div>`;}
function render(){renderTable();renderOutcomeSelect();renderHistory();if(latestRun&&Number(document.getElementById('capacity').value)!==latestRun.capacity)latestRun=null;if(latestRun)renderResults();else{document.getElementById('summary').innerHTML=metric('Available time',document.getElementById('capacity').value+' hrs','Your current planning capacity')+metric('Candidate actions',state.actions.length,'Opportunity-action pairs')+metric('Recorded outcome events',(state.outcomeEvents||[]).length,'Append-only observations');document.getElementById('recommendations').innerHTML='<div class="empty-state">Run the optimizer to see recommendations for the current inputs.</div>';document.getElementById('comparison').innerHTML='';document.getElementById('resultFoot').textContent='';document.getElementById('runStatus').textContent='Not optimized for current inputs';}}
function renderResults(){const r=latestRun,b=r.best;document.getElementById('summary').innerHTML=metric('Expected incremental commission',money(b.value),'Assumption-based estimate')+metric('Time allocated',`${(b.minutes/60).toFixed(1)} / ${r.capacity} hrs`,'Remaining capacity: '+(r.capacity-b.minutes/60).toFixed(1)+' hrs')+metric('Actions selected',b.items.length,'From '+state.actions.length+' candidate actions');document.getElementById('runStatus').textContent='Optimized '+new Date(r.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
 document.getElementById('recommendations').innerHTML=b.items.length?b.items.map((a,i)=>`<div class="rec-card"><div class="rank">${i+1}</div><div class="rec-main"><strong>${safe(a.action)}</strong><p>${safe(a.name)} · ${a.effort} min · finish by hour ${a.deadline} · scheduled ${((a.scheduledStartMinutes||0)/60).toFixed(2)}–${((a.scheduledFinishMinutes||0)/60).toFixed(2)}h</p><div class="rec-reason">Incremental lift ${pct(a.pWith-a.pWithout)} · Evidence: ${safe(a.evidenceStatus||'unverified')} · Confidence: ${Number(a.confidence??50)}% · ${safe(a.evidenceNote||a.note||'Selected by the portfolio optimizer.')}</div></div><div class="rec-value"><strong>+${money(inc(a))}</strong><small>expected incremental</small></div></div>`).join(''):'<div class="empty-state">No positive-incremental actions fit the current capacity, deadline, dependency and unique-opportunity constraints.</div>';
 document.getElementById('resultFoot').textContent=`Portfolio total: ${money(b.value)} expected incremental agent commission. This is a model estimate, not realized income or proof of causation.`;
 document.getElementById('comparison').innerHTML=compareCard('DealFlow optimizer',b,true)+compareCard('Highest commission first',r.commission,false)+compareCard('Incremental AED per hour',r.hourly,false);
}
function compareCard(title,r,featured){return `<div class="compare-card ${featured?'featured':''}"><span>${title}</span><strong>${money(r.value)}</strong><p>${r.items.length} actions · ${(r.minutes/60).toFixed(1)} hours allocated</p></div>`;}
function renderTable(){document.getElementById('actionRows').innerHTML=state.actions.map(a=>`<tr><td><strong>${safe(a.name)}</strong><small>${safe(a.action)} · ID ${safe(a.id)} · Deal ${safe(a.opportunityId||a.id)}${a.dependency?' · Requires '+safe(a.dependency):''}</small></td><td>${money(a.commission)}</td><td>${a.pWith}% / ${a.pWithout}%</td><td class="${inc(a)>0?'positive':'negative'}">${inc(a)>=0?'+':''}${money(inc(a))}</td><td>${a.effort} min</td><td>${a.deadline} hrs</td><td><small>${safe(a.evidenceStatus||'unverified')} · ${Number(a.confidence??50)}%</small></td><td class="row-actions"><button onclick="editAction('${safe(a.id)}')">Edit</button><button class="delete" onclick="deleteAction('${safe(a.id)}')">Remove</button></td></tr>`).join('');}
function renderOutcomeSelect(){
 const s=document.getElementById('outcomeAction'),old=s.value;s.innerHTML=state.actions.map(a=>`<option value="${safe(a.id)}">${safe(a.id)} — ${safe(a.name)}</option>`).join('');if(state.actions.some(a=>a.id===old))s.value=old;
 const correction=document.getElementById('outcomeCorrection'),oldCorrection=correction.value;
 const current=DealFlowAudit.deriveCurrentOutcomes(state.outcomeEvents||[]);
 correction.innerHTML='<option value="">New outcome event (not a correction)</option>'+current.map(o=>`<option value="${safe(o.eventId)}">${safe(o.actionId)} · ${safe(o.eventId)} · ${safe(o.status||o.eventType)}</option>`).join('');
 if(current.some(o=>o.eventId===oldCorrection))correction.value=oldCorrection;
 const runSelect=document.getElementById('outcomeRun'),oldRun=runSelect.value;
 runSelect.innerHTML='<option value="">Not linked to a recommendation run</option>'+(state.recommendationSnapshots||[]).slice().reverse().map(x=>`<option value="${safe(x.runId)}">${safe(x.runId)} · ${new Date(x.createdAt).toLocaleString()}</option>`).join('');
 if((state.recommendationSnapshots||[]).some(x=>x.runId===oldRun))runSelect.value=oldRun;
}
function renderHistory(){
 const el=document.getElementById('outcomeHistory'),events=state.outcomeEvents||[],current=DealFlowAudit.deriveCurrentOutcomes(events);
 el.innerHTML=events.length?events.slice().reverse().map(o=>`<div class="history-item"><div><strong>${safe(o.actionId)}</strong> · ${safe(o.status||o.eventType)}<br><span>${safe(o.eventType)} · Recorded ${new Date(o.recordedAt).toLocaleString()} · ${o.actualMinutes??'—'} min · ${safe(o.verificationStatus)}</span></div><strong>${o.actualCommission===null?'Not recorded':money(o.actualCommission)}</strong></div>`).join(''):'<p class="muted">No outcome events recorded yet.</p>';
 const snapshots=state.recommendationSnapshots||[];
 document.getElementById('snapshotHistory').innerHTML=snapshots.length?snapshots.slice().reverse().map(s=>`<div class="history-item"><div><strong>${safe(s.runId)}</strong><br><span>${new Date(s.createdAt).toLocaleString()} · ${s.selectedActionIds.length} selected / ${s.candidateActions.length} candidates · ${s.capacityHours}h capacity</span></div><strong>${money(s.predictedIncrementalCommission)} predicted</strong></div>`).join(''):'<p class="muted">No recommendation snapshots yet. Run the optimizer to create an immutable record.</p>';
 const rows=DealFlowAudit.reconcile(snapshots,events);
 document.getElementById('reconciliationHistory').innerHTML=rows.length?rows.slice().reverse().map(r=>`<div class="history-item"><div><strong>${safe(r.opportunityId)}</strong><br><span>Run ${safe(r.runId)} · Predicted lift ${money(r.predictedLift)} · Actual commission: ${r.actualCommissionStatus==='observed'?money(r.actualCommissionObserved):safe(r.actualCommissionStatus)} · Attribution: ${safe(r.attributionStatus)}</span></div><strong>${r.actualIncrementalCommission===null?'Incremental impact unknown':money(r.actualIncrementalCommission)}</strong></div>`).join(''):'<p class="muted">Reconciliation appears after a recommendation snapshot and linked outcome events exist.</p>';
}
function editAction(id){const a=state.actions.find(x=>x.id===id);if(!a)return;const draft={...a};const textFields=[['Action ID','id'],['Opportunity / client name','name'],['Action description','action'],['Opportunity ID','opportunityId'],['Prerequisite action ID (blank if none)','dependency'],['Evidence source URL','evidenceUrl'],['Evidence updated date (YYYY-MM-DD)','evidenceUpdatedAt'],['Evidence note','evidenceNote']];for(const [label,key] of textFields){const v=prompt(label,draft[key]||'');if(v===null)return;draft[key]=v.trim();}if(!draft.id||!draft.name||!draft.action){alert('Action ID, opportunity name and action description are required.');return;}if(!draft.opportunityId)draft.opportunityId=draft.id;const numeric=[['Agent net commission (AED)','commission',0,1e9],['Probability WITH action (%)','pWith',0,100],['Probability WITHOUT action (%)','pWithout',0,100],['Effort (minutes)','effort',1,10080],['Deadline (hours)','deadline',0,8760],['Confidence (%)','confidence',0,100]];for(const [label,key,min,max] of numeric){const v=prompt(label,draft[key]??(key==='confidence'?50:0));if(v===null)return;const n=Number(v);if(v.trim()===''||!Number.isFinite(n)||n<min||n>max){alert(`${label} must be between ${min} and ${max}.`);return;}draft[key]=n;}const evidence=prompt('Evidence status: unverified, user_reported, documented, or verified',draft.evidenceStatus||'unverified');if(evidence===null)return;draft.evidenceStatus=evidence.trim();const updated=state.actions.map(x=>x.id===id?draft:{...x,dependency:x.dependency===id?draft.id:x.dependency});const errors=DealFlowEngine.validatePortfolio(updated,Number(document.getElementById('capacity').value),[]);if(errors.length){alert(errors.join('\n'));return;}if(draft.id!==id){
  const hasAudit=(state.outcomeEvents||[]).some(e=>e.actionId===id)||(state.recommendationSnapshots||[]).some(s=>s.candidateActions.some(x=>x.id===id));
  if(hasAudit){alert('Action ID cannot be changed after outcome or recommendation history exists.');return;}
  state.history.forEach(h=>{h.ids=(h.ids||[]).map(x=>x===id?draft.id:x);});
  state.evidence=(state.evidence||[]).map(e=>e.subjectType==='action'&&e.subjectId===id?{...e,subjectId:draft.id}:e);
 }
 DealFlowEvidence.syncActionClaims(draft,state.evidence);state.actions=updated;save();latestRun=null;render();}
function deleteAction(id){if(!confirm('Remove this candidate action?'))return;state.actions=state.actions.filter(x=>x.id!==id);save();latestRun=null;render();}
window.editAction=editAction;window.deleteAction=deleteAction;
document.getElementById('optimizeBtn').addEventListener('click',runOptimization);
document.getElementById('capacity').addEventListener('input',()=>{if(latestRun){latestRun=null;render();document.getElementById('runStatus').textContent='Capacity changed · re-optimize';}});
document.getElementById('addToggle').addEventListener('click',()=>document.getElementById('addFormWrap').classList.toggle('hidden'));
document.getElementById('closeAdd').addEventListener('click',()=>document.getElementById('addFormWrap').classList.add('hidden'));
document.getElementById('addForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);const name=String(f.get('name')||'').trim(),action=String(f.get('action')||'').trim();const a={id:'DF-'+crypto.randomUUID().slice(0,8),opportunityId:String(f.get('opportunityId')||'').trim()||name.toLowerCase().replace(/\s+/g,'-'),name,action,commission:Number(f.get('commission')),pWith:Number(f.get('pWith')),pWithout:Number(f.get('pWithout')),effort:Number(f.get('effort')),deadline:Number(f.get('deadline')),dependency:String(f.get('dependency')||'').trim(),confidence:Number(f.get('confidence')||50),evidenceStatus:String(f.get('evidenceStatus')||'unverified'),evidenceUrl:String(f.get('evidenceUrl')||'').trim(),evidenceUpdatedAt:String(f.get('evidenceUpdatedAt')||''),evidenceNote:String(f.get('evidenceNote')||'').trim(),note:'User-entered scenario.'};const trial=[...state.actions,a];const errors=DealFlowEngine.validatePortfolio(trial,Number(document.getElementById('capacity').value),[]);if(errors.length){alert('Action not added:\n\n'+errors.join('\n'));return;}state=DealFlowEvidence.migrateState({...state,actions:[...state.actions,a]},seed);save();e.target.reset();document.getElementById('addFormWrap').classList.add('hidden');latestRun=null;render();});
document.getElementById('outcomeForm').addEventListener('submit',e=>{
 e.preventDefault();
 const action=state.actions.find(x=>x.id===document.getElementById('outcomeAction').value);
 const actual=Number(document.getElementById('actualCommission').value),minutes=Number(document.getElementById('actualEffort').value);
 if(!action||!Number.isFinite(actual)||actual<0||!Number.isFinite(minutes)||minutes<0){alert('Select an action and enter valid non-negative commission and time.');return;}
 const now=new Date().toISOString(),correctionId=document.getElementById('outcomeCorrection').value;
 const prior=correctionId?(state.outcomeEvents||[]).find(x=>x.eventId===correctionId):null;
 if(correctionId&&(!prior||prior.actionId!==action.id)){alert('A correction must target a current event for the selected action.');return;}
 const selectedRun=document.getElementById('outcomeRun').value;
 if(prior&&selectedRun&&selectedRun!==(prior.recommendationRunId||'')){alert('A correction must retain the original recommendation-run link.');return;}
 if(!prior&&selectedRun){
  const snapshot=(state.recommendationSnapshots||[]).find(x=>x.runId===selectedRun);
  if(!snapshot||!snapshot.selectedActionIds.includes(action.id)){alert('The selected recommendation run did not recommend this action.');return;}
 }
 const rawIncremental=document.getElementById('actualIncrementalCommission').value.trim();
 const attributionMethod=document.getElementById('attributionMethod').value.trim();
 const incremental=rawIncremental===''?null:Number(rawIncremental);
 if(incremental!==null&&(!Number.isFinite(incremental)||incremental<0||!attributionMethod)){alert('Actual incremental commission requires a non-negative amount and a documented attribution method.');return;}
 const event={
  eventId:'OUT-'+crypto.randomUUID(),actionId:action.id,opportunityId:action.opportunityId||action.id,
  eventType:prior?'correction':'status_update',status:document.getElementById('outcomeStatus').value,
  actualCommission:actual,currency:'AED',actualMinutes:minutes,occurredAt:now,recordedAt:now,
  sourceType:'user_input',verificationStatus:'unverified',note:prior?'Correction entered by the user; original event is retained.':'Outcome entered by the user; not independently verified.',
  supersedesEventId:prior?prior.eventId:null,recommendationRunId:prior?(prior.recommendationRunId||null):(selectedRun||null),actualIncrementalCommission:incremental,attributionMethod:attributionMethod||null
 };
 try{state.outcomeEvents=DealFlowAudit.appendOutcomeEvent(state.outcomeEvents,event);save();renderHistory();render();}
 catch(err){alert('Outcome was not saved: '+err.message);}
});
document.getElementById('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='dealflow-alpha-01-3-backup.json';a.click();URL.revokeObjectURL(url);});
document.getElementById('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const incoming=JSON.parse(await file.text());if(!incoming||!Array.isArray(incoming.actions)||!Array.isArray(incoming.outcomes))throw new Error('Backup must contain actions and outcomes arrays.');const migrated=DealFlowEvidence.migrateState(incoming,seed);const actions=migrated.actions;const errors=DealFlowEngine.validatePortfolio(actions,Number(document.getElementById('capacity').value),[]);if(errors.length)throw new Error(errors.join('\\n'));state=ensureAuditState(migrated);save();latestRun=null;render();alert('Backup imported successfully.');}catch(err){alert('Import failed: '+err.message);}finally{e.target.value='';}});
document.getElementById('resetBtn').addEventListener('click',()=>{if(!confirm('Reset all actions and outcome records to the original synthetic demo?'))return;state=ensureAuditState(DealFlowEvidence.createInitialState(seed));state.outcomeEvents=[];state.recommendationSnapshots=[];latestRun=null;save();render();});
render();

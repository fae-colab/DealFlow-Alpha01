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
function migrateFullState(input){const e=DealFlowEvidence.migrateState(input,seed),o=DealFlowOutcomes.migrateState(e),r=DealFlowRecommendations.migrateState(o);return DealFlowReconciliation.migrateState(r,r.recommendationSnapshots,r.outcomeEvents);}
function loadState(){
 const keys=[STORAGE_KEY,...LEGACY_STORAGE_KEYS];
 for(const key of keys){try{const raw=localStorage.getItem(key);if(!raw)continue;return migrateFullState(JSON.parse(raw));}catch(e){console.warn('DealFlow state migration skipped for '+key,e);}}
 return migrateFullState(DealFlowEvidence.createInitialState(seed));
}
function save(){try{state.version='1.3';state.schemaVersion=DealFlowEvidence.SCHEMA_VERSION;state.outcomeSchemaVersion=1;localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){alert('This browser could not save local data. Your current changes may be lost when the page closes.');}}
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
 const snapshot=DealFlowRecommendations.captureSnapshot({createdAt:latestRun.at,sequence:(state.recommendationSnapshots||[]).length+1,capacityHours:capacity,actions:state.actions,best,commission,hourly,evidence:state.evidence,incremental:inc});
 state.recommendationSnapshots=DealFlowRecommendations.appendSnapshot(state.recommendationSnapshots||[],snapshot);
 state.history.unshift({at:latestRun.at,capacity,value:best.value,minutes:best.minutes,ids:best.items.map(x=>x.id)});state.history=state.history.slice(0,30);save();render();
}
function metric(label,value,caption){return `<div class="metric"><span>${safe(label)}</span><strong>${safe(value)}</strong><small>${safe(caption)}</small></div>`;}
function render(){renderTable();renderEvidenceControls();renderOutcomeSelect();renderHistory();renderSnapshotHistory();renderReconciliationInputs();renderReconciliationHistory();if(latestRun&&Number(document.getElementById('capacity').value)!==latestRun.capacity)latestRun=null;if(latestRun)renderResults();else{document.getElementById('summary').innerHTML=metric('Available time',document.getElementById('capacity').value+' hrs','Your current planning capacity')+metric('Candidate actions',state.actions.length,'Opportunity-action pairs')+metric('Recorded outcomes',state.outcomes.length,'Actual observations');document.getElementById('recommendations').innerHTML='<div class="empty-state">Run the optimizer to see recommendations for the current inputs.</div>';document.getElementById('comparison').innerHTML='';document.getElementById('resultFoot').textContent='';document.getElementById('runStatus').textContent='Not optimized for current inputs';}}
function renderResults(){
 const r=latestRun,b=r.best;
 document.getElementById('summary').innerHTML=metric('Expected incremental commission',money(b.value),'Assumption-based estimate')+metric('Time allocated',(b.minutes/60).toFixed(1)+' / '+r.capacity+' hrs','Remaining capacity: '+(r.capacity-b.minutes/60).toFixed(1)+' hrs')+metric('Actions selected',b.items.length,'From '+state.actions.length+' candidate actions');
 document.getElementById('runStatus').textContent='Optimized '+new Date(r.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
 document.getElementById('recommendations').innerHTML=b.items.length?b.items.map((a,i)=>{
   const evidenceSummary=DealFlowEvidence.summarizeActionEvidence(state.evidence,a.id);
   return '<div class="rec-card"><div class="rank">'+(i+1)+'</div><div class="rec-main"><strong>'+safe(a.action)+'</strong><p>'+safe(a.name)+' · '+a.effort+' min · finish by hour '+a.deadline+' · scheduled '+((a.scheduledStartMinutes||0)/60).toFixed(2)+'–'+((a.scheduledFinishMinutes||0)/60).toFixed(2)+'h</p><div class="rec-reason">Incremental lift '+pct(a.pWith-a.pWithout)+' · Confidence '+Number(a.confidence??50)+'% · Evidence quality '+safe(evidenceSummary.summary)+' ('+evidenceSummary.supportedCount+'/3 claims supported) · '+safe(a.note||'Selected by the portfolio optimizer.')+'</div></div><div class="rec-value"><strong>+'+money(inc(a))+'</strong><small>expected incremental</small></div></div>';
 }).join(''):'<div class="empty-state">No positive-incremental actions fit the current capacity, deadline, dependency and unique-opportunity constraints.</div>';
 document.getElementById('resultFoot').textContent='Portfolio total: '+money(b.value)+' expected incremental agent commission. This is a model estimate, not realized income or proof of causation.';
 document.getElementById('comparison').innerHTML=compareCard('DealFlow optimizer',b,true)+compareCard('Highest commission first',r.commission,false)+compareCard('Incremental AED per hour',r.hourly,false);
}
function compareCard(title,r,featured){return `<div class="compare-card ${featured?'featured':''}"><span>${title}</span><strong>${money(r.value)}</strong><p>${r.items.length} actions · ${(r.minutes/60).toFixed(1)} hours allocated</p></div>`;}
function renderTable(){
 document.getElementById('actionRows').innerHTML=state.actions.map(a=>{
   const evidenceSummary=DealFlowEvidence.summarizeActionEvidence(state.evidence,a.id);
   return '<tr><td><strong>'+safe(a.name)+'</strong><small>'+safe(a.action)+' · ID '+safe(a.id)+' · Deal '+safe(a.opportunityId||a.id)+(a.dependency?' · Requires '+safe(a.dependency):'')+'</small></td><td>'+money(a.commission)+'</td><td>'+a.pWith+'% / '+a.pWithout+'%</td><td class="'+(inc(a)>0?'positive':'negative')+'">'+(inc(a)>=0?'+':'')+money(inc(a))+'</td><td>'+a.effort+' min</td><td>'+a.deadline+' hrs</td><td><small>'+Number(a.confidence??50)+'%</small></td><td><small>'+safe(evidenceSummary.summary)+'</small></td><td class="row-actions"><button onclick="openEvidenceForAction(\''+safe(a.id)+'\')">Evidence</button><button onclick="editAction(\''+safe(a.id)+'\')">Edit</button><button class="delete" onclick="deleteAction(\''+safe(a.id)+'\')">Remove</button></td></tr>';
 }).join('');
}
function localDateTime(value){
 if(!value)return '';
 const date=new Date(value);
 if(Number.isNaN(date.getTime()))return '';
 return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
function isoDateTime(value){
 if(!value)return null;
 const date=new Date(value);
 if(Number.isNaN(date.getTime()))throw new Error('Date and time must be valid.');
 return date.toISOString();
}
function evidenceSourceHtml(record){
 if(!record.sourceRef)return 'Not recorded';
 if(/^https?:\/\//i.test(record.sourceRef))return '<a href="'+safe(record.sourceRef)+'" target="_blank" rel="noopener noreferrer">'+safe(record.sourceRef)+'</a>';
 return safe(record.sourceRef);
}
function evidenceRecordHtml(record,status){
 const legacy=record.legacyMetadata?'<p class="legacy-evidence-note">Legacy status retained: '+safe(record.legacyMetadata.evidenceStatus||'unknown')+'. It is not treated as verified evidence or a quality rating.</p>':'';
 const synthetic=record.isSynthetic?'<span class="tag synthetic-tag">Synthetic demo</span>':'';
 return '<article class="evidence-record"><div class="evidence-record-head"><strong>'+safe(String(record.kind).replace(/_/g,' '))+' · '+safe(record.quality)+' quality</strong><span class="tag">'+safe(status)+'</span>'+synthetic+'</div><div class="evidence-meta"><span>Claim: '+safe(record.claimKey)+'</span><span>Source type: '+safe(record.sourceType)+'</span><span>Source: '+evidenceSourceHtml(record)+'</span><span>Captured: '+safe(record.capturedAt||'Not recorded')+'</span><span>Observed: '+safe(record.observedAt||'Not recorded')+'</span><span>Verified: '+safe(record.verifiedAt||'Not recorded')+'</span><span>Verified by: '+safe(record.verifiedBy||'Not recorded')+'</span></div><p>'+safe(record.note||'No note recorded.')+'</p>'+legacy+'</article>';
}
function renderConfidenceForm(){
 const action=state.actions.find(item=>item.id===document.getElementById('confidenceAction').value);
 document.getElementById('confidenceValue').value=action?Number(action.confidence??50):50;
 document.getElementById('confidenceHelp').textContent=action?'Confidence is your subjective confidence in this estimate. It is not evidence quality and does not change the optimizer objective.':'Add an action to record confidence.';
}
function syncEvidenceRequirements(){
 const verified=document.getElementById('evidenceKind').value==='verified_fact';
 document.getElementById('evidenceSourceRef').required=verified;
 document.getElementById('evidenceVerifiedAt').required=verified;
 document.getElementById('evidenceVerifiedBy').required=verified;
}
function renderEvidenceForm(){
 const action=state.actions.find(item=>item.id===document.getElementById('evidenceAction').value);
 const claimKey=document.getElementById('evidenceClaim').value;
 if(!action){
   document.getElementById('evidenceCurrent').innerHTML='<p class="empty-state">Add an action before recording evidence.</p>';
   document.getElementById('evidenceHistory').innerHTML='';
   document.getElementById('legacyEvidenceHistory').innerHTML='';
   return;
 }
 const records=DealFlowEvidence.claimEvidenceHistory(state.evidence,action.id,claimKey);
 const current=DealFlowEvidence.currentClaimEvidence(state.evidence,action.id,claimKey);
 const superseded=new Set(records.map(record=>record.supersedesId).filter(Boolean));
 document.getElementById('evidenceCurrent').innerHTML=current?evidenceRecordHtml(current,'Current'):'<p class="empty-state">No current evidence record exists for this claim.</p>';
 document.getElementById('evidenceHistory').innerHTML=records.length?records.slice().reverse().map(record=>evidenceRecordHtml(record,superseded.has(record.id)?'Superseded':'Current')).join(''):'<p class="muted">No evidence history.</p>';
 const legacy=DealFlowEvidence.claimEvidenceHistory(state.evidence,action.id,'legacyEvidence');
 document.getElementById('legacyEvidenceHistory').innerHTML=legacy.length?legacy.slice().reverse().map(record=>evidenceRecordHtml(record,'Legacy · read only')).join(''):'<p class="muted">No imported legacy evidence fields for this action.</p>';
 const synthetic=action.isSynthetic===true;
 document.getElementById('evidenceKind').value=synthetic?'assumption':(current?current.kind:'assumption');
 document.getElementById('evidenceQuality').value=synthetic?'none':(current?current.quality:'none');
 const sourceType=document.getElementById('evidenceSourceType');
 Array.from(sourceType.options).forEach(option=>{option.hidden=option.value==='synthetic_demo'&&!synthetic;});
 sourceType.value=synthetic?'synthetic_demo':(current&&current.sourceType!=='synthetic_demo'?current.sourceType:'user_input');
 document.getElementById('evidenceSourceRef').value=current&&!synthetic?current.sourceRef||'':'';
 document.getElementById('evidenceObservedAt').value=current&&!synthetic?localDateTime(current.observedAt):'';
 document.getElementById('evidenceVerifiedAt').value=current&&!synthetic?localDateTime(current.verifiedAt):'';
 document.getElementById('evidenceVerifiedBy').value=current&&!synthetic?current.verifiedBy||'':'';
 document.getElementById('evidenceNote').value=current?current.note||'':'';
 for(const id of ['evidenceKind','evidenceQuality','evidenceSourceType','evidenceSourceRef','evidenceObservedAt','evidenceVerifiedAt','evidenceVerifiedBy'])
   document.getElementById(id).disabled=synthetic;
 document.getElementById('evidenceSyntheticNotice').classList.toggle('hidden',!synthetic);
 syncEvidenceRequirements();
}
function renderEvidenceControls(){
 const options=state.actions.map(action=>'<option value="'+safe(action.id)+'">'+safe(action.id)+' — '+safe(action.name)+'</option>').join('');
 const evidenceAction=document.getElementById('evidenceAction'),confidenceAction=document.getElementById('confidenceAction');
 const oldEvidence=evidenceAction.value,oldConfidence=confidenceAction.value;
 evidenceAction.innerHTML=options;confidenceAction.innerHTML=options;
 evidenceAction.value=state.actions.some(action=>action.id===oldEvidence)?oldEvidence:(state.actions[0]?.id||'');
 confidenceAction.value=state.actions.some(action=>action.id===oldConfidence)?oldConfidence:(state.actions[0]?.id||'');
 renderEvidenceForm();renderConfidenceForm();
}
function openEvidenceForAction(id){
 if(!state.actions.some(action=>action.id===id))return;
 document.getElementById('evidenceAction').value=id;
 document.getElementById('confidenceAction').value=id;
 renderEvidenceForm();renderConfidenceForm();
 document.getElementById('evidencePanel').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderOutcomeSelect(){const s=document.getElementById('outcomeAction'),old=s.value;s.innerHTML=state.actions.map(a=>`<option value="${safe(a.id)}">${safe(a.id)} — ${safe(a.name)}</option>`).join('');if(state.actions.some(a=>a.id===old))s.value=old;}
function renderSnapshotHistory(){const el=document.getElementById('recommendationHistory');const snapshots=(state.recommendationSnapshots||[]).slice().reverse();el.innerHTML=snapshots.length?snapshots.map(s=>'<div class="history-item"><div><strong>'+safe(s.snapshotId)+'</strong> · '+new Date(s.createdAt).toLocaleString()+'<br><span>'+s.selectedActionIds.length+' selected · '+s.portfolio.minutes+' min · Captured capacity '+s.capacityHours+' hrs</span><br><span>Actions: '+s.decisions.filter(d=>d.selected).map(d=>safe(d.action.name||d.actionId)).join(', ')+'</span></div><strong>'+money(s.portfolio.expectedIncrementalCommission)+' expected</strong></div>').join(''):'<p class="muted">No recommendation snapshots yet. Run the optimizer to create the first immutable record.</p>';}
function renderReconciliationInputs(){const snapshots=state.recommendationSnapshots||[],ss=document.getElementById('reconcileSnapshot'),old=ss.value;ss.innerHTML=snapshots.map(s=>'<option value="'+safe(s.snapshotId)+'">'+safe(s.snapshotId)+' · '+new Date(s.createdAt).toLocaleString()+'</option>').join('');if(snapshots.some(s=>s.snapshotId===old))ss.value=old;const snapshot=snapshots.find(s=>s.snapshotId===ss.value)||snapshots[snapshots.length-1];const as=document.getElementById('reconcileAction'),oldAction=as.value;const selected=snapshot?snapshot.decisions.filter(d=>d.selected):[];as.innerHTML=selected.map(d=>'<option value="'+safe(d.actionId)+'">'+safe(d.action.name||d.actionId)+'</option>').join('');if(selected.some(d=>d.actionId===oldAction))as.value=oldAction;const actionId=as.value;const current=DealFlowOutcomes.currentEvents(state.outcomeEvents||[]).filter(e=>e.actionId===actionId);const es=document.getElementById('reconcileOutcomeEvent'),oldEvent=es.value;es.innerHTML=current.map(e=>'<option value="'+safe(e.eventId)+'">'+safe(e.eventId)+' · '+safe(e.status)+' · '+(e.actualCommission===null?'commission unknown':money(e.actualCommission))+'</option>').join('');if(current.some(e=>e.eventId===oldEvent))es.value=oldEvent;const details=document.getElementById('incrementalAttributionFields');details.classList.toggle('hidden',document.getElementById('reconcileAttribution').value!=='incremental_supported');}
function renderHistory(){const el=document.getElementById('outcomeHistory');const events=(state.outcomeEvents||[]).slice().reverse();const superseded=new Set((state.outcomeEvents||[]).map(e=>e.supersedesEventId).filter(Boolean));el.innerHTML=events.length?events.map(e=>'<div class="history-item"><div><strong>'+safe(e.actionId)+'</strong> · '+safe(e.status)+' · '+(e.eventType==='outcome_corrected'?'Correction':'Recorded')+(superseded.has(e.eventId)?' · Superseded':'')+'<br><span>'+new Date(e.recordedAt).toLocaleString()+' · '+e.minutes+' min · Event '+safe(e.eventId)+'</span>'+(e.notes?'<br><span>'+safe(e.notes)+'</span>':'')+'</div><strong>'+(e.actualCommission===null?'Not recorded':money(e.actualCommission))+'</strong></div>').join(''):'<p class="muted">No outcomes recorded yet.</p>';}
function renderReconciliationHistory(){const el=document.getElementById('reconciliationHistory');const records=(state.reconciliations||[]).slice().reverse();const superseded=new Set((state.reconciliations||[]).map(r=>r.supersedesReconciliationId).filter(Boolean));el.innerHTML=records.length?records.map(r=>'<div class="history-item"><div><strong>'+safe(r.actionId)+'</strong> · '+safe(r.attributionStatus)+(superseded.has(r.reconciliationId)?' · Superseded':'')+'<br><span>Snapshot '+safe(r.snapshotId)+' · Outcome '+safe(r.outcomeEventId)+' · '+safe(r.outcomeStatus)+'</span><br><span>Actual commission: '+(r.actualCommission===null?'Unknown':money(r.actualCommission))+' · Standalone modeled estimate: '+money(r.predictedStandaloneEstimate)+'</span><br><span>Actual incremental: '+(r.actualIncrementalCommission===null?'Not established':money(r.actualIncrementalCommission))+(r.predictedActualDelta===null?'':' · Difference: '+money(r.predictedActualDelta))+'</span></div><strong>'+safe(r.attributionStatus)+'</strong></div>').join(''):'<p class="muted">No reconciliation records yet.</p>';}
function editAction(id){
 const a=state.actions.find(x=>x.id===id);if(!a)return;
 const draft={...a};
 const textFields=[['Action ID','id'],['Opportunity / client name','name'],['Action description','action'],['Opportunity ID','opportunityId'],['Prerequisite action ID (blank if none)','dependency']];
 for(const [label,key] of textFields){const v=prompt(label,draft[key]||'');if(v===null)return;draft[key]=v.trim();}
 if(!draft.id||!draft.name||!draft.action){alert('Action ID, opportunity name and action description are required.');return;}
 if(!draft.opportunityId)draft.opportunityId=draft.id;
 const numeric=[['Agent net commission (AED)','commission',0,1e9],['Probability WITH action (%)','pWith',0,100],['Probability WITHOUT action (%)','pWithout',0,100],['Effort (minutes)','effort',1,10080],['Deadline (hours)','deadline',0,8760]];
 for(const [label,key,min,max] of numeric){const v=prompt(label,draft[key]??0);if(v===null)return;const n=Number(v);if(v.trim()===''||!Number.isFinite(n)||n<min||n>max){alert(label+' must be between '+min+' and '+max+'.');return;}draft[key]=n;}
 const updated=state.actions.map(x=>x.id===id?draft:{...x,dependency:x.dependency===id?draft.id:x.dependency});
 const errors=DealFlowEngine.validatePortfolio(updated,Number(document.getElementById('capacity').value),[]);
 if(errors.length){alert(errors.join('\n'));return;}
 if(draft.id!==id){
   if((state.outcomeEvents||[]).some(e=>e.actionId===id)){alert('Action IDs cannot be changed after outcome events have been recorded.');return;}
   state.history.forEach(h=>{h.ids=(h.ids||[]).map(x=>x===id?draft.id:x);});
   state.evidence=(state.evidence||[]).map(e=>e.subjectType==='action'&&e.subjectId===id?{...e,subjectId:draft.id}:e);
 }
 DealFlowEvidence.syncActionClaims(draft,state.evidence);
 state.actions=updated;save();latestRun=null;render();
}
function deleteAction(id){if(!confirm('Remove this candidate action?'))return;state.actions=state.actions.filter(x=>x.id!==id);save();latestRun=null;render();}
window.editAction=editAction;window.deleteAction=deleteAction;window.openEvidenceForAction=openEvidenceForAction;
document.getElementById('optimizeBtn').addEventListener('click',runOptimization);
document.getElementById('capacity').addEventListener('input',()=>{if(latestRun){latestRun=null;render();document.getElementById('runStatus').textContent='Capacity changed · re-optimize';}});
document.getElementById('addToggle').addEventListener('click',()=>document.getElementById('addFormWrap').classList.toggle('hidden'));
document.getElementById('closeAdd').addEventListener('click',()=>document.getElementById('addFormWrap').classList.add('hidden'));
document.getElementById('addForm').addEventListener('submit',e=>{
 e.preventDefault();const f=new FormData(e.target);
 const confidence=Number(f.get('confidence')),confidenceError=DealFlowEvidence.validateConfidence(confidence);
 if(confidenceError){alert(confidenceError);return;}
 const name=String(f.get('name')||'').trim(),action=String(f.get('action')||'').trim();
 const a={id:'DF-'+crypto.randomUUID().slice(0,8),opportunityId:String(f.get('opportunityId')||'').trim()||name.toLowerCase().replace(/\s+/g,'-'),
 name,action,commission:Number(f.get('commission')),pWith:Number(f.get('pWith')),pWithout:Number(f.get('pWithout')),
 effort:Number(f.get('effort')),deadline:Number(f.get('deadline')),dependency:String(f.get('dependency')||'').trim(),
 confidence,note:'User-entered scenario.'};
 const trial=[...state.actions,a],errors=DealFlowEngine.validatePortfolio(trial,Number(document.getElementById('capacity').value),[]);
 if(errors.length){alert('Action not added:\n\n'+errors.join('\n'));return;}
 state=migrateFullState({...state,actions:[...state.actions,a]});save();e.target.reset();
 document.getElementById('addFormWrap').classList.add('hidden');latestRun=null;render();
});
document.getElementById('confidenceAction').addEventListener('change',renderConfidenceForm);
document.getElementById('confidenceForm').addEventListener('submit',e=>{
 e.preventDefault();const action=state.actions.find(item=>item.id===document.getElementById('confidenceAction').value);
 if(!action){alert('Select an action first.');return;}
 const confidence=Number(document.getElementById('confidenceValue').value),error=DealFlowEvidence.validateConfidence(confidence);
 if(error){alert(error);return;}
 action.confidence=confidence;save();latestRun=null;render();
});
document.getElementById('evidenceAction').addEventListener('change',renderEvidenceForm);
document.getElementById('evidenceClaim').addEventListener('change',renderEvidenceForm);
document.getElementById('evidenceKind').addEventListener('change',syncEvidenceRequirements);
document.getElementById('evidenceForm').addEventListener('submit',e=>{
 e.preventDefault();const action=state.actions.find(item=>item.id===document.getElementById('evidenceAction').value);
 if(!action){alert('Select an action first.');return;}
 try{
   state.evidence=DealFlowEvidence.reviseClaimEvidence(state.evidence,action,{
     claimKey:document.getElementById('evidenceClaim').value,
     kind:document.getElementById('evidenceKind').value,
     quality:document.getElementById('evidenceQuality').value,
     sourceType:document.getElementById('evidenceSourceType').value,
     sourceRef:document.getElementById('evidenceSourceRef').value.trim(),
     observedAt:isoDateTime(document.getElementById('evidenceObservedAt').value),
     verifiedAt:isoDateTime(document.getElementById('evidenceVerifiedAt').value),
     verifiedBy:document.getElementById('evidenceVerifiedBy').value.trim(),
     note:document.getElementById('evidenceNote').value.trim()
   });
   save();latestRun=null;render();
 }catch(error){alert('Evidence was not saved: '+error.message);}
});
document.getElementById('outcomeForm').addEventListener('submit',e=>{e.preventDefault();const raw=document.getElementById('actualCommission').value,actual=raw===''?null:Number(raw),minutes=Number(document.getElementById('actualEffort').value);if((actual!==null&&(!Number.isFinite(actual)||actual<0))||!Number.isFinite(minutes)||minutes<0){alert('Actual commission must be blank or non-negative, and time must be non-negative.');return;}const id=document.getElementById('outcomeAction').value,now=new Date().toISOString();try{state.outcomeEvents=DealFlowOutcomes.appendOutcomeEvent(state.outcomeEvents||[],{actionId:id,status:document.getElementById('outcomeStatus').value,actualCommission:actual,minutes,recordedAt:now,occurredAt:now,notes:document.getElementById('outcomeNotes').value.trim()});state.outcomes=DealFlowOutcomes.projectOutcomes(state.outcomeEvents);save();renderHistory();render();e.target.reset();}catch(err){alert('Outcome was not saved: '+err.message);}});
document.getElementById('reconcileForm').addEventListener('submit',e=>{e.preventDefault();const supported=document.getElementById('reconcileAttribution').value==='incremental_supported',actualRaw=document.getElementById('actualIncrementalCommission').value;const actual=supported?(actualRaw===''?NaN:Number(actualRaw)):null;if(supported&&!Number.isFinite(actual)){alert('Enter a numeric actual incremental commission.');return;}const input={snapshotId:document.getElementById('reconcileSnapshot').value,actionId:document.getElementById('reconcileAction').value,outcomeEventId:document.getElementById('reconcileOutcomeEvent').value,attributionStatus:supported?'incremental_supported':'associated_only',actualIncrementalCommission:actual,counterfactualMethod:document.getElementById('counterfactualMethod').value.trim(),evidenceRef:document.getElementById('attributionEvidenceRef').value.trim(),reviewedBy:document.getElementById('attributionReviewer').value.trim()};try{state.reconciliations=DealFlowReconciliation.appendReconciliation(state.reconciliations||[],input,state.recommendationSnapshots||[],state.outcomeEvents||[]);save();renderReconciliationHistory();e.target.reset();renderReconciliationInputs();}catch(err){alert('Reconciliation not saved: '+err.message);}});
document.getElementById('reconcileSnapshot').addEventListener('change',renderReconciliationInputs);document.getElementById('reconcileAction').addEventListener('change',renderReconciliationInputs);document.getElementById('reconcileAttribution').addEventListener('change',renderReconciliationInputs);
document.getElementById('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='dealflow-alpha-01-3-backup.json';a.click();URL.revokeObjectURL(url);});
document.getElementById('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const incoming=JSON.parse(await file.text());if(!incoming||!Array.isArray(incoming.actions)||!Array.isArray(incoming.outcomes))throw new Error('Backup must contain actions and outcomes arrays.');const migrated=migrateFullState(incoming);const actions=migrated.actions;const errors=DealFlowEngine.validatePortfolio(actions,Number(document.getElementById('capacity').value),[]);if(errors.length)throw new Error(errors.join('\n'));state=migrated;save();latestRun=null;render();alert('Backup imported successfully.');}catch(err){alert('Import failed: '+err.message);}finally{e.target.value='';}});
document.getElementById('resetBtn').addEventListener('click',()=>{if(!confirm('Reset all actions and outcome records to the original synthetic demo?'))return;state=migrateFullState(DealFlowEvidence.createInitialState(seed));latestRun=null;save();render();});
render();

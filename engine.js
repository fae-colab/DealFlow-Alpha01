/* DealFlow Alpha 01.2 deterministic decision engine. Probabilities are 0..100. */
(function (root) {
  'use strict';
  const MAX_ACTIONS = 20;
  const EVIDENCE_STATUSES = new Set(['unverified','user_reported','documented','verified']);
  function validatePortfolio(actions, capacityHours, completedIds = []) {
    const errors=[];
    if(!Array.isArray(actions)) return ['Actions must be an array.'];
    if(!Number.isFinite(capacityHours)||capacityHours<=0||capacityHours>24) errors.push('Capacity must be greater than 0 and no more than 24 hours.');
    if(actions.length>MAX_ACTIONS) errors.push(`At most ${MAX_ACTIONS} actions are supported.`);
    const ids=new Set();
    for(const a of actions){
      if(!a||typeof a!=='object'){errors.push('Every action must be an object.');continue;}
      if(typeof a.id!=='string'||!a.id.trim()) errors.push('Every action needs a non-empty ID.'); else if(ids.has(a.id)) errors.push(`Duplicate action ID: ${a.id}.`); else ids.add(a.id);
      if(typeof a.name!=='string'||!a.name.trim()) errors.push(`Action ${a.id||'?'} needs an opportunity name.`);
      if(typeof a.action!=='string'||!a.action.trim()) errors.push(`Action ${a.id||'?'} needs an action description.`);
      for(const [key,min,max] of [['commission',0,1e9],['pWith',0,100],['pWithout',0,100],['effort',1,10080],['deadline',0,8760],['confidence',0,100]]) if(!Number.isFinite(a[key]??(key==='confidence'?50:NaN))||(a[key]??(key==='confidence'?50:NaN))<min||(a[key]??(key==='confidence'?50:NaN))>max) errors.push(`${a.id||'Action'}: ${key} must be between ${min} and ${max}.`);
      if(a.dependency&&a.dependency===a.id) errors.push(`${a.id}: an action cannot depend on itself.`);
      if(a.evidenceStatus!==undefined&&!EVIDENCE_STATUSES.has(a.evidenceStatus)) errors.push(`${a.id}: invalid evidenceStatus.`);
      for(const k of ['evidenceUrl','evidenceUpdatedAt','evidenceNote']) if(a[k]!==undefined&&typeof a[k]!=='string') errors.push(`${a.id}: ${k} must be text.`);
    }
    const completed=new Set(completedIds);
    for(const a of actions) if(a&&a.dependency&&!ids.has(a.dependency)&&!completed.has(a.dependency)) errors.push(`${a.id}: prerequisite ${a.dependency} is neither in this portfolio nor marked completed.`);
    const byId=new Map(actions.filter(Boolean).map(a=>[a.id,a]));const visiting=new Set(),visited=new Set();
    function visit(id){if(visiting.has(id)){errors.push(`Dependency cycle detected at ${id}.`);return;}if(visited.has(id))return;visiting.add(id);const dep=byId.get(id)?.dependency;if(dep&&byId.has(dep))visit(dep);visiting.delete(id);visited.add(id);}
    for(const id of byId.keys())visit(id);
    return [...new Set(errors)];
  }
  function incremental(a){return a.commission*(a.pWith-a.pWithout)/100;}
  function portfolioValue(items){const positive=new Map();let negative=0;for(const a of items){const lift=incremental(a);if(lift<0)negative+=lift;else{const key=String(a.opportunityId||a.id).trim().toLowerCase();positive.set(key,Math.max(positive.get(key)||0,lift));}}return negative+[...positive.values()].reduce((s,x)=>s+x,0);}
  function schedule(items,completedIds=[]){
    const byId=new Map(items.map((a,i)=>[a.id,i])),external=new Set(completedIds),n=items.length,visited=new Set();
    for(const a of items)if(a.dependency&&!byId.has(a.dependency)&&!external.has(a.dependency))return null;
    function visit(mask,minutes,order){if(mask===(1<<n)-1)return{minutes,items:order.map(i=>({...items[i],scheduledStartMinutes:0,scheduledFinishMinutes:0}))};if(visited.has(mask))return null;visited.add(mask);const ready=[];
      for(let i=0;i<n;i++){if(mask&(1<<i))continue;const a=items[i],dep=byId.get(a.dependency);if(a.dependency&&!external.has(a.dependency)&&(dep===undefined||!(mask&(1<<dep))))continue;ready.push(i);}
      ready.sort((i,j)=>items[i].deadline-items[j].deadline||items[i].effort-items[j].effort||items[i].id.localeCompare(items[j].id));
      for(const i of ready){const a=items[i],finish=minutes+a.effort;if(finish>a.deadline*60+1e-9)continue;const result=visit(mask|(1<<i),finish,[...order,i]);if(result)return result;}return null;
    }
    const result=visit(0,0,[]);if(result){let t=0;result.items=result.items.map(a=>{const x={...a,scheduledStartMinutes:t};t+=x.effort;x.scheduledFinishMinutes=t;return x;});}return result;
  }
  function optimize(actions,capacityHours,completedIds=[]){
    const errors=validatePortfolio(actions,capacityHours,completedIds);if(errors.length)return{error:errors.join(' '),value:0,minutes:0,items:[]};
    const candidates=actions.filter(a=>a.effort<=capacityHours*60),n=candidates.length,external=new Set(completedIds),index=new Map(candidates.map((a,i)=>[a.id,i]));
    const deps=candidates.map(a=>index.has(a.dependency)?index.get(a.dependency):-1),visited=new Set();let best={value:0,minutes:0,items:[]};
    function visit(mask,minutes,order){if(visited.has(mask))return;visited.add(mask);const selected=candidates.filter((a,i)=>mask&(1<<i)),value=portfolioValue(selected);
      if(value>best.value+1e-9||(Math.abs(value-best.value)<=1e-9&&value>0&&(selected.length<best.items.length||(selected.length===best.items.length&&minutes<best.minutes)))){best={value,minutes,items:order.map(i=>({...candidates[i],scheduledStartMinutes:0,scheduledFinishMinutes:0}))};let t=0;best.items=order.map(i=>{const a={...candidates[i],scheduledStartMinutes:t};t+=a.effort;a.scheduledFinishMinutes=t;return a;});}
      for(let i=0;i<n;i++){const bit=1<<i;if(mask&bit)continue;const a=candidates[i],dep=deps[i];if(a.dependency&&!external.has(a.dependency)&&(dep<0||!(mask&(1<<dep))))continue;const finish=minutes+a.effort;if(finish>capacityHours*60+1e-9||finish>a.deadline*60+1e-9)continue;visit(mask|bit,finish,[...order,i]);}
    }
    visit(0,0,[]);return best;
  }
  function greedy(actions,capacityHours,scoreFn,completedIds=[]){const errors=validatePortfolio(actions,capacityHours,completedIds);if(errors.length)return{error:errors.join(' '),value:0,minutes:0,items:[]};const ordered=actions.filter(a=>incremental(a)>0).slice().sort((a,b)=>scoreFn(b)-scoreFn(a));let chosen=[];for(const a of ordered){const trial=[...chosen,a],r=optimize(trial,capacityHours,completedIds);if(!r.error&&r.items.length===trial.length)chosen=trial;}return optimize(chosen,capacityHours,completedIds);}
  const api={validatePortfolio,incremental,portfolioValue,schedule,optimize,greedy};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.DealFlowEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);

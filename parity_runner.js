const fs=require('node:fs');
const E=require('./engine.js');
const cases=JSON.parse(fs.readFileSync(0,'utf8'));
const out=cases.map(c=>{
  const actions=c.actions.map(a=>({...a}));
  const errors=E.validatePortfolio(actions,c.capacityHours,c.completedIds||[]);
  if(errors.length)return {valid:false,errors};
  const r=E.optimize(actions,c.capacityHours,c.completedIds||[]);
  return {valid:true,value:r.value,minutes:r.minutes,items:r.items.map(a=>a.id),schedule:r.items.map(a=>[a.id,a.scheduledStartMinutes,a.scheduledFinishMinutes])};
});
process.stdout.write(JSON.stringify(out));

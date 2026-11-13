const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const requiredIds=[
 'evidencePanel','confidenceForm','confidenceAction','confidenceValue','confidenceHelp',
 'evidenceForm','evidenceAction','evidenceClaim','evidenceKind','evidenceQuality',
 'evidenceSourceType','evidenceSourceRef','evidenceObservedAt','evidenceVerifiedAt',
 'evidenceVerifiedBy','evidenceNote','evidenceSyntheticNotice','evidenceCurrent',
 'evidenceHistory','legacyEvidenceHistory'
];
for(const id of requiredIds)assert.match(html,new RegExp('id="'+id+'"'),'missing evidence UI element '+id);
assert.match(html,/<th>Confidence<\/th><th>Evidence quality<\/th>/);
assert.match(html,/Confidence and evidence quality are separate/);
assert.match(html,/Imported legacy evidence \(read only\)/);
assert.doesNotMatch(html,/name="evidenceStatus"/,'new actions must not use the legacy evidence-status field');
assert.match(app,/DealFlowEvidence\.reviseClaimEvidence/);
assert.match(app,/DealFlowEvidence\.validateConfidence/);
assert.match(app,/DealFlowEvidence\.summarizeActionEvidence/);
assert.match(app,/window\.openEvidenceForAction/);
assert.match(app,/data-evidence-action/);
assert.match(app,/evidenceQuality'\)\.addEventListener\('change'/);
assert.match(app,/evidenceForm'\)\.addEventListener\('submit'/);
console.log('Evidence UI wiring and markup tests passed.');

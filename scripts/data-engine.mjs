import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import '../js/pet-detail-model.js';
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)??'undefined').digest('hex');
export const engineBranches={pets:'pets',petSpine:'spine.hero.pets',mounts:'mounts',research:'lean.researchSteps',forge:'forge',stats:'harcero',bonus:'bonus',limits:'limits',rewards:'reward',polish:'polish',stones:'stones'};
const at=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
// A contract is reviewed once, independently of candidates. Strings encode mechanics;
// only numeric leaves of an identical structure may change without review.
export function contractOf(v){
  if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Non-finite value');return {number:true,min:v<0?-1e12:0,max:1e12};}
  if(Array.isArray(v))return {array:v.map(contractOf)};
  if(v&&typeof v==='object')return {object:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,contractOf(x)]))};
  return {literal:v};
}
export function validateContract(value,contract,prefix=''){
  return globalThis.StonestormPetDetails.validateShape(value,contract,prefix);
}
export function validateRelations(branches,content){
  if(branches.pets){
    const p=branches.pets,c=globalThis.StonestormPetDetails.publicConfig(p);
    if(!c||c.types.some(t=>Object.keys(t.perLevel).length!==1||!c.traits[t.trait]||!c.growth[t.rarity]||t.signature&&!c.skills[t.signature]))throw Error('Invalid pet relationships');
    if(new Set(p.types.map(t=>t.id)).size!==p.types.length)throw Error('Duplicate pet ID');
    for(const t of p.types)if(t.map!=null&&!content.maps.some(m=>m.index===t.map))throw Error('Unknown pet map');
    if(c.forms.slots.some(v=>!Number.isInteger(v)||v<0||v>3))throw Error('Unknown skill slots');
    if(c.forms.slots.join(',')!=='0,1,2,3,3'||c.forms.passive.some(v=>v>100)||c.types.some(t=>Object.values(t.perLevel).some(v=>v>1)))throw Error('Unsupported pet rule bounds');
  }
  if(branches.mounts){if(new Set(branches.mounts.map(x=>x.id)).size!==branches.mounts.length||branches.mounts.some(x=>!(x.travelMult>0&&x.travelMult<=1)||!Number.isInteger(x.level)))throw Error('Invalid mounts');}
  if(branches.research)for(const r of Object.values(branches.research))if(!content.mobs.some(m=>m.id===r.sampleMobId)||!content.stackables.some(s=>s.id===r.sampleId))throw Error('Invalid research relationship');
  if(branches.stats){const h=branches.stats,r=h.rules,hero=h.combat.hero;for(const cap of [r.critCap,r.evadeCap,r.monsterEvadeCap,r.reductionCap,...Object.values(r.supportCaps)])if(!(cap>=0&&cap<=1))throw Error('Invalid combat cap');if(r.critCap!==hero.critCap||JSON.stringify(r.supportCaps)!==JSON.stringify(hero.supportCaps)||!(hero.critMult>=1&&hero.critMult<=10))throw Error('Conflicting combat rules');}
  if(branches.forge){const f=branches.forge;for(const row of [f.chances,...Object.values(f.chancesByTier)])if(row.some(v=>v<0||v>1))throw Error('Invalid forge chance');if(f.plusMult.some((v,i)=>v<=0||i&&v<=f.plusMult[i-1]))throw Error('Invalid upgrade multipliers');}
}
export function planEngine(content,state,contracts,{petProof=false}={}){
  if(state.schema!==2||contracts.schema!==2||Object.keys(state.branches).sort().join('|')!==Object.keys(engineBranches).sort().join('|'))throw Error('Invalid engine state');
  for(const [key,b] of Object.entries(state.branches)){if(hash(b.data)!==b.sha256)throw Error('Engine state hash mismatch: '+key);validateContract(b.data,contracts.branches[key],key);}
  const next=structuredClone(state),accepted=[],review=[];
  for(const [key,source] of Object.entries(engineBranches)){
    const candidate=at(content,source),prior=state.branches[key];
    if(hash(candidate)===hash(prior.data))continue;
    try{
      validateContract(candidate,contracts.branches[key],'/'+source.replaceAll('.','/'));
      validateRelations({[key]:candidate},content);
      if(['pets','petSpine'].includes(key)&&!petProof)throw Error('Fresh public client formula proof required');
      next.branches[key]={data:structuredClone(candidate),gameVersion:content.version,sourcePath:source,sha256:hash(candidate),status:'public-config'};
      accepted.push({path:'/'+source.replaceAll('.','/'),kind:'changed',engine:2});
    }catch(e){review.push({path:'/'+source.replaceAll('.','/'),reason:'Data Engine V2: '+e.message});}
  }
  next.gameVersion=content.version;return {state:next,accepted,review};
}
export function applyEngine(db,state,petModel){
  if(state.schema!==2)throw Error('Unknown Data Engine schema');
  for(const [key,branch] of Object.entries(state.branches))if(hash(branch.data)!==branch.sha256)throw Error('Engine hash mismatch: '+key);
  const b=Object.fromEntries(Object.entries(state.branches).map(([k,v])=>[k,v.data]));
  if(JSON.stringify(globalThis.StonestormPetDetails.publicConfig(b.pets))!==JSON.stringify(petModel.config))throw Error('Pet configuration differs from verified client model');
  const model={...petModel,gameVersion:state.branches.pets.gameVersion,config:globalThis.StonestormPetDetails.publicConfig(b.pets)};
  if(!model.config)throw Error('Invalid public pet model');
  db.petModel=model;
  const old=new Map(db.pets.map(p=>[p.id,p]));
  db.pets=b.pets.types.map(p=>({nameHu:old.get(p.id)?.nameHu,nameEn:null,...p,name:model.locale.types[p.id]?.name??old.get(p.id)?.name??p.id,
    rawCoefficient:{...p.perLevel},formula:'coefficient × (10 × passive[form−1] + rankBonusShare × effectiveRank)',
    bonusByForm:model.config.forms.passive.map((_,i)=>({form:i+1,rank:0,levelIndependent:true,value:globalThis.StonestormPetDetails.describe({petId:p.id,form:i+1,level:1,rank:0},model).bonusValue})),
    learnableSkills:[...new Set(Object.values(b.petSpine.book.pools).flatMap(pool=>Object.keys(pool)))].filter(id=>model.config.skills[id]),
    development:{rulesPath:'petSystem.v3',costsPath:'petSystem.v3.costs',evolutionPath:'petSystem.v3.forms.cost',status:'public-base-config; individual server overrides unknown'},
    acquisition:{map:p.map??null,dungeon:p.dungeon??null,sourcePath:'pets.types/'+p.id,status:'public-config; exact roll probabilities not inferred'},
    artId:p.id,provenance:{source:'https://stonestorm.gg/api/content',sourcePath:'pets.types/'+p.id,sha256:state.branches.pets.sha256,gameVersion:state.branches.pets.gameVersion,status:'derived',scope:'Public V3 client formula; activation and server aggregation are separate'}}));
  db.petTraits=b.pets.traits;db.petRules=b.pets.rules;db.petSkills=b.pets.v3.skills;db.petForms=b.pets.v3.forms;
  db.petSystem.v3=b.pets.v3;db.petSystem.spine=b.petSpine;db.petSystem.version=state.branches.pets.gameVersion;
  db.petSkillNames=model.locale.skills;db.petSystem.locale={...db.petSystem.locale,...model.locale};
  db.petSystem.checkedAt=model.evidence.checkedAt;
  db.petSystem.stages=db.petSystem.stages.map(s=>({...s,name:model.locale.forms[s.form],slots:b.pets.v3.forms.slots[s.form-1]}));
  const priorMounts=new Map(db.mounts.map(x=>[x.id,x]));
  db.mounts=b.mounts.map(x=>({...priorMounts.get(x.id),...x,name:priorMounts.get(x.id)?.name??x.id,timeReductionPctFromTravelMult:(1-x.travelMult)*100,provenance:provenance('mounts')}));
  const priorResearch=new Map(db.research.map(x=>[x.id,x]));db.research=Object.entries(b.research).map(([id,x])=>({...priorResearch.get(id),id,...x,name:priorResearch.get(id)?.name??id,provenance:provenance('research')}));
  db.forge={...db.forge,...b.forge,provenance:provenance('forge')};db.economy.limits=b.limits;
  db.dataEngine={schema:2,gameVersion:state.gameVersion,branches:Object.fromEntries(Object.entries(state.branches).map(([key,v])=>[key,{...v,data:undefined}])),publicRules:{stats:b.stats,bonus:b.bonus,rewards:b.rewards,polish:b.polish,stones:b.stones}};
  function provenance(key){return {source:'https://stonestorm.gg/api/content',sourcePath:engineBranches[key],sha256:state.branches[key].sha256,gameVersion:state.branches[key].gameVersion,status:'derived',scope:'Public configuration; server overrides may apply'};}
  return db;
}
export function coverage(db,catalog){return {
  schema:2,gameVersion:db.dataVersion,
  pets:{species:db.pets.length,publicModelComplete:db.pets.length,serverFinalResultsVerified:0,calculable:db.pets.filter(p=>p.bonusByForm.every(b=>Number.isFinite(b.value))).length,skills:Object.keys(db.petSkills).length,forms:5,observedReferences:db.dataEngine.observations.observations.length,identifiedImages:catalog?.entries.filter(x=>x.category==='pets'&&x.relations.some(r=>r.kind==='pet'&&r.status==='identified')).length??0,logicalFormBindings:db.pets.flatMap(p=>p.art.forms).length,missingArtProof:'Current state.petArt logical-key to hash-addressed public file registry; local historical files alone are insufficient',
    formula:'coefficient × (10 × forms.passive[form−1] + rankBonusShare × effectiveRank); independent of level',
    skillSources:Object.entries(db.petSkills).map(([id,s])=>({id,name:db.petSkillNames[id].name,kind:s.kind,levels:s.values.length,valuesSource:'pets.v3.skills.'+id,descriptionSource:'public hashed texts.hu module; pets.skills.'+id,formulaSource:'verified public GameApp Kr/fy/Gd functions; data/addon-pet-model.json',status:'client-derived; individual learned skills unknown'})),
    speciesCoverage:db.pets.map(p=>({id:p.id,name:p.name,coefficient:p.rawCoefficient,trait:p.trait,signature:p.signature??null,learnableSkills:p.learnableSkills,bonusByForm:p.bonusByForm,status:'public species model complete; owned state private'}))},
  automatic:{engineBranches:Object.keys(engineBranches),petGate:'Fresh public entrypoint + approved function hashes + unchanged reviewed schema; HTTP 403 blocks pet import',existingAdapters:['items','sets (spine.sets.full)','mobs','bosses','stackables','dungeon numeric rooms','validated Home/Arena fields'],configOnly:['bonus','rewards','polish','stones'],rule:'Known numeric leaves only; changed strings, identifiers, object keys or array sizes require review'},
  unknown:['Server final prices and reward rolls','Individual pet learned skills and private state','Unrecognized mechanics, new identifiers or changed array structures require review','Current entrypoint may return 403; no access-control bypass','Observed form caps 10/20/30/40/50 versus client 10/20/35/50/60 retained as conflict','New kalmarteve mount ramp is recorded as public configuration; not applied in Planner without client proof'],
  counts:{items:db.items.length,sets:db.sets.length,mounts:db.mounts.length,research:db.research.length,mobs:db.mobs.length,bosses:db.bosses.length,dungeons:db.dungeons.length}
};}

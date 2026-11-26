import {sha256} from './atlas-sync-model.mjs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {analyzeContent,categoryNames,API} from './future-content-analyzers.mjs';
import {clientCandidates,officialArticles} from './future-content-client.mjs';
import {linkImages,imageCollectorReferences} from './future-image-bridge.mjs';
export {officialArticles,imageCollectorReferences};
export const watcherStatuses=['prepared','announced','active','uncertain','removed'];
const baselineRow=row=>['graphics','translations','modules'].includes(row.category)&&!row.potential&&!row.upcoming&&!(row.history??[]).some(x=>x.kind!=='initial')&&!['active','announced','removed'].includes(row.status);
export function unpackWatcher(state){
  if(!state?.baselineArchive)return state;
  const archive=state.baselineArchive;if(archive.encoding!=='gzip-base64-json')throw Error('Unknown watcher archive encoding');
  const text=gunzipSync(Buffer.from(archive.data,'base64'),{maxOutputLength:128*1024*1024}).toString('utf8');if(sha256(text)!==archive.sha256)throw Error('Watcher baseline archive hash mismatch');
  const rows=JSON.parse(text);if(!Array.isArray(rows)||rows.length!==archive.count)throw Error('Invalid watcher baseline archive');
  const {baselineArchive,...rest}=state;return {...rest,observations:[...state.observations,...rows]};
}
export function packWatcher(state){
  const cold=state.observations.filter(baselineRow),text=JSON.stringify(cold);
  return {...state,observations:state.observations.filter(x=>!baselineRow(x)),baselineArchive:cold.length?{encoding:'gzip-base64-json',count:cold.length,sha256:sha256(text),data:gzipSync(text,{level:9}).toString('base64')}:null};
}
export function publicWatcherView(state){
  const cold=state.observations.filter(baselineRow),observations=state.observations.filter(x=>!baselineRow(x)),ids=new Set(observations.map(x=>x.id));return {...state,observations,events:state.events.filter(x=>ids.has(x.observationId)),baselineSummary:{count:cold.length,categories:cold.reduce((o,x)=>({...o,[x.category]:(o[x.category]??0)+1}),{})}};
}
const identity=(category,key)=>sha256(category+'\n'+key);
const tableLength=v=>Array.isArray(v)?v.length:v&&typeof v==='object'?Math.max(0,...Object.values(v).filter(Array.isArray).map(x=>x.length)):0;
const pointerValue=(root,p)=>p.slice(1).split('/').map(x=>x.replaceAll('~1','/').replaceAll('~0','~')).reduce((v,k)=>Array.isArray(v)&&!/^\d+$/.test(k)?v.find(x=>String(x?.id??x?.map)===k):v?.[k],root);
const activationFor=(candidate,evidence)=>evidence.find(x=>x.category===candidate.category&&x.key===candidate.key&&x.kind==='game-observation'&&x.verified===true&&typeof x.source==='string'&&x.source&&Number.isFinite(Date.parse(x.observedAt))&&typeof x.explanation==='string'&&x.explanation);
function eventKind(prior,candidate){
  if(!prior)return 'discovered';if(prior.status==='removed')return 'restored';
  if(candidate.category==='maxLevel')return candidate.value>prior.value?'limit-raised':'limit-changed';
  if(candidate.category==='features'&&candidate.value!==prior.value)return candidate.value?'activated-flag':'deactivated-flag';
  if(['xp','progression'].includes(candidate.category)&&tableLength(candidate.value)>tableLength(prior.value))return 'table-expanded';
  return candidate.status!==prior.status?'status-changed':'updated';
}
function importantEvent(kind,row,prior){
  if(kind==='initial'||kind==='migration')return false;
  if(['limit-raised','limit-changed','activated-flag'].includes(kind))return true;
  if(['announced','active'].includes(row.status)&&row.status!==prior?.status)return true;
  if(kind==='table-expanded')return row.category==='xp';
  if(['discovered','restored'].includes(kind))return row.importance==='high'||(row.category==='items'&&row.potential);
  return kind==='removed'&&row.potential&&row.importance==='high';
}
function presentation(state){
  const visible=state.observations.filter(x=>!x.legacy&&(x.potential||['announced','active','removed'].includes(x.status)));
  return {summary:state.summary,observations:visible.map(x=>({id:x.id,valueHash:x.valueHash,status:x.status,relatedImages:x.relatedImages})).sort((a,b)=>a.id.localeCompare(b.id))};
}
// V1 called configuration presence "active". V2 requires explicit game evidence.
// Changing that label during migration is not a newly observed gameplay change.
export function watchContent({content,previous=null,previousContent=null,resources={},now=new Date().toISOString(),sourceHash,official=[],knownActive={},labels={},catalog,activationEvidence=[],inspection={}}){
  previous=unpackWatcher(previous);
  const initialized=previous?.schema===2,legacy=previous?.schema===1;
  const baselineMax=previous?.baseline?.maxLevel??previous?.observations?.find(x=>x.category==='maxLevel')?.firstValue??previous?.observations?.find(x=>x.category==='maxLevel')?.value??content?.limits?.maxLevel;
  const analysis=analyzeContent(content,{labels,baselineMax,previousContent}),client=clientCandidates(resources),candidates=[...analysis.candidates,...client.candidates];
  sourceHash??=sha256(JSON.stringify(content));if(!Number.isFinite(Date.parse(now)))throw Error('Invalid watcher timestamp');
  for(const row of previous?.observations??[])if(row.category==='unknown'&&row.scope==='api'&&row.key.startsWith('/')&&!candidates.some(x=>x.category===row.category&&x.key===row.key)){const value=pointerValue(content,row.sourcePath);if(value!==undefined)candidates.push({...row,value});}
  for(const entry of official){const u=new URL(entry.source);if(u.origin!=='https://stonestorm.gg'||typeof entry.quote!=='string'||!entry.quote.trim()||!Number.isFinite(Date.parse(entry.publishedAt))||!entry.id)throw Error('Unverified official announcement');candidates.push({category:'official',key:entry.id,value:{title:entry.title,quote:entry.quote,publishedAt:entry.publishedAt},nameHu:entry.title,source:entry.source,sourcePath:entry.sourcePath??'official announcement',scope:'official',status:'announced',statusReason:'Dátumozott hivatalos közlemény.',potential:true,importance:'high',officialAnnouncement:entry});}
  const old=new Map((previous?.observations??[]).map(x=>[x.id,x])),rows=new Map(),events=structuredClone(previous?.events??[]),newIds=[],newEventIds=[];
  const baselineDomains=new Set(previous?.baseline?.domains??[]),domains=new Set(candidates.map(x=>x.scope)),clientInitialized=initialized?previous.clientInitialized===true:!!(legacy&&previous.clientInitialized&&previous.observations.some(x=>['graphics','translations'].includes(x.category)));
  const addEvent=(row,prior,kind,notify)=>{
    const revision=(prior?.revision??0)+1,id=sha256([row.id,revision,kind,row.valueHash,row.status]);if(events.some(x=>x.id===id))return;
    events.push({id,observationId:row.id,revision,kind,category:row.category,nameHu:row.nameHu,key:row.key,at:now,gameVersion:content.version,before:prior?.value??null,after:row.status==='removed'?null:row.value,beforeStatus:prior?.status??null,status:row.status,source:row.source,sourcePath:row.sourcePath,sourceHash:row.sourceHash,important:notify});
    newEventIds.push(id);row.revision=revision;row.lastEventId=id;row.previousValue=prior?.value??null;
  };
  for(const candidate of new Map(candidates.map(x=>[identity(x.category,x.key),x])).values()){
    const id=identity(candidate.category,candidate.key),prior=old.get(id),proof=activationFor(candidate,activationEvidence)??activationFor(candidate,prior?.activationEvidence?[prior.activationEvidence]:[]),valueHash=sha256(candidate.value);
    if(proof){candidate.status='active';candidate.statusReason=proof.explanation;candidate.activationEvidence=proof;}
    const scopeBaseline=initialized&&(candidate.scope==='api'||baselineDomains.has(candidate.scope)||candidate.scope==='official')&&(candidate.scope!=='client'||clientInitialized)&&(candidate.category!=='modules'||previous.coverage?.client==='complete');
    const sourceBaselineMigration=initialized&&(previous.analyzerVersion??1)<2&&((candidate.category==='translations'&&!baselineDomains.has(candidate.scope))||(candidate.category==='modules'&&previous.coverage?.client!=='complete'));
    const created=!prior,changed=prior&&(prior.valueHash!==valueHash||prior.status!==candidate.status),potential=candidate.potential||(!sourceBaselineMigration&&(prior?.potential||prior?.upcoming))||(created&&scopeBaseline);
    const row={...prior,...candidate,id,valueHash,sourceHash:candidate.sourceHash??(candidate.source===API?sourceHash:null),firstSeenAt:prior?.firstSeenAt??now,firstValue:prior?.firstValue??prior?.value??candidate.value,firstSourceHash:prior?.firstSourceHash??candidate.sourceHash??sourceHash,firstGameVersion:prior?.firstGameVersion??prior?.gameVersion??content.version,lastSeenAt:now,lastCheckedAt:now,gameVersion:content.version,seenThisCheck:true,potential:!!potential,upcoming:!!potential,legacy:false,clientVersionConfirmed:candidate.scope==='api'?true:inspection.entrypointConfirmed===true,revision:prior?.revision??0};
    row.relatedImages=linkImages(row,catalog);
    if(sourceBaselineMigration){row.discoveryBaseline=true;for(const event of events)if(event.observationId===id&&event.kind==='discovered'){event.originalKind=event.kind;event.kind='initial';event.important=false;event.reason='Az újonnan elérhető forrás első leltára; nem bizonyított játékváltozás.';}}
    if(legacy&&prior?.status==='active'&&!proof)row.classificationMigration={from:'active',to:row.status,reason:'A korábbi verzió csak konfigurációs jelenlétet igazolt.'};
    if((created||changed)&&scopeBaseline){const kind=eventKind(prior,row);addEvent(row,prior,kind,importantEvent(kind,row,prior));if(row.potential||['limit-raised','limit-changed','activated-flag','table-expanded'].includes(kind))newIds.push(id);}
    else if(!initialized&&row.potential)addEvent(row,prior,'initial',false);
    row.history=events.filter(x=>x.observationId===id);if(prior?.history?.length&&legacy)row.legacyHistory=prior.history;
    rows.set(id,row);
  }
  for(const [id,prior] of old)if(!rows.has(id)){
    const row={...prior,lastCheckedAt:now,seenThisCheck:false};
    if(legacy){row.legacy=true;row.status=prior.status==='active'?'uncertain':prior.status;row.statusReason='Korábbi, összevont megfigyelés; az új elemző részletes bejegyzései megőrzik a tartalmat.';}
    const complete=initialized&&(row.scope==='api'||(row.scope==='client'&&inspection.complete===true)||(row.scope?.startsWith('locale:')&&inspection.complete===true&&client.locales.includes(row.scope.split(':')[1])));
    if(complete&&prior.status!=='removed'){row.status='removed';row.statusReason='A teljes, sikeresen ellenőrzött saját forráságban már nem szerepel. Ez nem hozzáférési hiba.';row.removedAt=now;row.potential=true;row.upcoming=true;row.value=null;row.valueHash=sha256(null);row.sourceHash=row.scope==='api'?sourceHash:row.sourceHash;row.gameVersion=content.version;row.removalEvidence={checkedAt:now,sourceHash:row.sourceHash,kind:'complete-source-absence'};addEvent(row,prior,'removed',importantEvent('removed',row,prior));newIds.push(id);}
    row.history=events.filter(x=>x.observationId===id);rows.set(id,row);
  }
  const currentResources=Object.values(resources).filter(r=>r.status!=='stale'&&r.observedThisCheck!==false);
  const state={schema:2,analyzerVersion:2,categoryNames,checkedAt:now,gameVersion:content.version,sourceHash,initialized:true,clientInitialized:clientInitialized||client.freshSources>0,baselineCreated:!initialized,migratedFrom:legacy?1:previous?.migratedFrom??null,baseline:{maxLevel:baselineMax,domains:[...new Set([...baselineDomains,...domains])].sort()},summary:analysis.summary,observations:[...rows.values()],events,newIds:[...new Set(newIds)],newEventIds,coverage:{api:'checked',client:inspection.complete?'complete':currentResources.length?'partial; current entrypoint may be unconfirmed':'unavailable',entrypointConfirmed:inspection.entrypointConfirmed===true,locales:{hu:client.locales.includes('hu')?'checked':'unavailable',en:client.locales.includes('en')?'checked':'unavailable'},official:'Only accessible, dated official evidence is announced; unavailable sources are not a negative finding.',warnings:inspection.warnings??[],activation:'Active status requires explicit game-observation evidence; API presence and true flags alone are insufficient.'}};
  state.presentationHash=sha256(presentation(state));state.changed=initialized?previous.presentationHash!==state.presentationHash:!!previous;
  state.notificationEvents=events.filter(x=>newEventIds.includes(x.id)&&x.important);return state;
}
export function watcherBootstrap(state){return '/* Public evidence only; configuration is not activation proof. */\nglobalThis.STONESTORM_FUTURE_CONTENT = '+JSON.stringify(publicWatcherView(state)).replaceAll('<','\\u003c')+';\n';}
export function watcherReport(state){
  const candidates=state.observations.filter(x=>!x.legacy&&x.potential&&x.status!=='removed');
  return {schema:1,checkedAt:state.checkedAt,gameVersion:state.gameVersion,summary:state.summary,coverage:state.coverage,potentialContent:candidates.map(x=>({id:x.id,category:categoryNames[x.category]??x.category,nameHu:x.nameHu,key:x.key,status:x.status,reason:x.statusReason,firstSeenAt:x.firstSeenAt,lastCheckedAt:x.lastCheckedAt,source:x.source,sourcePath:x.sourcePath,sourceHash:x.sourceHash,relatedImages:x.relatedImages})),counts:{observations:state.observations.length,potential:candidates.length,announced:candidates.filter(x=>x.status==='announced').length,removed:state.observations.filter(x=>x.status==='removed').length,newEvents:state.newEventIds.length,importantEvents:state.notificationEvents.length}};
}

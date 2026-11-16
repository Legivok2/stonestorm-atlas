import {isDeepStrictEqual} from 'node:util';
import '../addons/stonestorm-statcap-overlay/research-sanitizer.js';

const endpoints=new Set(['/api/home/rooms','/api/sinks']);
const unique=(rows,key)=>{if(rows&&new Set(rows.map(r=>r[key])).size!==rows.length)throw Error('Duplicate observation: '+key);};
export function normalizeHomeExport(value,sourceHash){
  if(value?.schema!==1||value.source!=='user-initiated-anonymized-observation'||!/^\d+\.\d+\.\d+$/.test(value.addonVersion??'')||!Array.isArray(value.samples)||!value.samples.length||value.samples.length>2||!/^[a-f0-9]{64}$/.test(sourceHash))throw Error('Invalid anonymous Home export');
  const samples=value.samples.map(sample=>{
    if(sample.schema!==1||!endpoints.has(sample.endpoint)||sample.observedOnly!==true)throw Error('Unsupported observation endpoint');
    const clean=globalThis.StonestormResearch.sanitize(sample.endpoint,sample.data);if(!clean)throw Error('Empty or invalid Home observation');
    if(!isDeepStrictEqual(clean.data,sample.data))throw Error('Unknown or invalid fields in Home observation');
    unique(clean.data.rooms,'id');unique(clean.data.themes?.list,'id');unique(clean.data.home?.tiers,'tier');unique(clean.data.home?.offers,'id');unique(clean.data.home?.luxury,'id');
    for(const r of clean.data.rooms??[]){if(r.maxLevel!==undefined&&(!Number.isInteger(r.maxLevel)||r.maxLevel<1))throw Error('Invalid observed room maximum');const q=r.observedNextQuote;if(q&&(!Number.isInteger(q.targetLevel)||q.targetLevel<1||r.maxLevel&&q.targetLevel>r.maxLevel))throw Error('Invalid conditional room quote');}
    for(const t of clean.data.home?.tiers??[])if(!Number.isInteger(t.tier)||t.tier<1||t.tier>8)throw Error('Invalid observed tier');
    return clean;
  });
  unique(samples,'endpoint');
  return {schema:1,provenance:{source:'user-provided-anonymized-export',sourceHash,addonVersion:value.addonVersion,observedAt:null,status:'observed',scope:'One anonymous server view. Prices and next-upgrade quotes may depend on player state; no global formula or currency inferred.'},samples};
}
export function validateHomeObservations(value){
  if(value?.schema!==1||value.provenance?.status!=='observed'||value.provenance.observedAt!==null)throw Error('Invalid Home observation evidence');
  const normalized=normalizeHomeExport({schema:1,source:'user-initiated-anonymized-observation',addonVersion:value.provenance.addonVersion,samples:value.samples},value.provenance.sourceHash);
  if(!isDeepStrictEqual(value,normalized))throw Error('Unexpected fields in public Home observations');
  return normalized;
}

import {imageURL} from './future-content-client.mjs';
export function linkImages(observation,catalog={entries:[]}){
  const result=[],add=image=>{if(!result.some(x=>x.url===image.url))result.push(image);};
  for(const im of catalog?.entries??[]){
    const kind={maps:'map',items:'item',families:'set',sets:'set',dungeons:'dungeon',mobs:'mob',bosses:'boss',pets:'pet',mounts:'mount',classes:'class'}[observation.category];
    if((observation.imageReference&&im.sourceUrl===observation.imageReference)||(observation.artLogicalKey&&im.id===observation.artLogicalKey)||(kind&&im.relations?.some(r=>r.kind===kind&&r.id===(observation.entityId??observation.key)&&r.status==='identified'))){add({url:im.sourceUrl,localFile:im.thumbnail??im.file,imageId:im.id,sha256:im.sha256,status:'catalog',label:im.title??observation.nameHu});}
  }
  if(observation.imageReference&&imageURL(observation.imageReference))add({url:observation.imageReference,status:'public-reference',label:'Nyilvános képhivatkozás; tartalomazonosítás nélkül'});
  // Exact public URL fields only: no guessed filenames or automatic mappings.
  const walk=(value)=>{if(typeof value==='string'&&imageURL(value))add({url:value,status:'public-reference',label:'A konfigurációban szereplő kép'});else if(value&&typeof value==='object')for(const [key,v] of Object.entries(value))if(/art|image|icon|portrait|background|url/i.test(key))walk(v);};walk(observation.value);
  return result;
}
export function imageCollectorReferences(state){
  const images=new Map();
  for(const row of state.observations)for(const image of row.relatedImages??[])if(imageURL(image.url)){
    if(!images.has(image.url))images.set(image.url,{url:image.url,sources:[],observationIds:[]});
    const entry=images.get(image.url);if(!entry.sources.some(x=>x.url===row.source&&x.path===row.sourcePath))entry.sources.push({url:row.source,path:row.sourcePath,sha256:row.sourceHash,gameVersion:row.gameVersion});entry.observationIds.push(row.id);
  }
  return {schema:1,kind:'atlas-future-image-references',checkedAt:state.checkedAt,gameVersion:state.gameVersion,images:[...images.values()],policy:'References only. Image Collector V2 retains its download, review and mapping gates.'};
}

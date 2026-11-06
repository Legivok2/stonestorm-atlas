/* Közös képelérés a Wiki, a Képtár, az összehasonlító és a Planner számára. */
(() => {
  const catalog=globalThis.STONESTORM_IMAGES;
  if(!catalog)return;
  const entries=new Map(catalog.entries.map(e=>[e.id,e]));
  const relations=new Map();
  for(const image of catalog.entries)for(const r of image.relations){const key=r.kind+':'+r.id;if(!relations.has(key))relations.set(key,[]);relations.get(key).push(image);}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const related=(kind,id)=>relations.get(kind+':'+id)??[];
  function forRecord(kind,id){
    const expected={item:['icons','weapons'],pet:['pets'],mount:['mounts'],map:['scenes','spots','portals'],mob:['mobs','scenes'],building:['guild'],material:['icons'],research:['research'],class:['body','portraits']}[kind]??[];
    return [...related(kind,id)].filter(x=>expected.includes(x.category)&&!x.isSprite).sort((a,b)=>{
      const rank=x=>(x.relations.some(r=>r.kind===kind&&r.id===id&&r.status==='identified')?0:100)+expected.indexOf(x.category)*10+(x.category==='pets'&&!x.name.endsWith('_1')?5:0);
      return rank(a)-rank(b)||a.name.localeCompare(b.name);
    })[0]??null;
  }
  function render(image,{className='',alt='',eager=false,thumbnail=false}={}){
    if(!image)return '<span class="atlas-image-missing" role="img" aria-label="Nincs elérhető kép">Nincs kép</span>';
    return `<img class="${esc(className)}" data-catalog-image="${esc(image.id)}" src="${esc(thumbnail?image.thumbnail:image.file)}" alt="${esc(alt||image.title||image.name)}" width="${image.width}" height="${image.height}" loading="${eager?'eager':'lazy'}" decoding="async" />`;
  }
  function character(classId,gender,armor,look=1){
    const base=classId+'_'+gender,prefix=base+(look>1?'_v'+look:'');
    const target=armor?.portrait;
    if(target?.startsWith('set_')){
      const exact=entries.get('body/'+prefix+'_'+target);if(exact)return exact;
      const fallback={set_m3:'l39',set_m4:'l39',set_m5:'l50',set_m6:'l50'}[target];
      if(fallback)for(const p of [prefix,base]){const im=entries.get('body/'+p+'_'+fallback);if(im)return im;}
    }else if(target){for(const p of [prefix,base]){const im=entries.get('body/'+p+'_'+target);if(im)return im;}}
    for(const p of [prefix,base])for(let tier=Math.min(armor?.portraitTier??0,5);tier>=0;tier--){const im=entries.get('body/'+p+'_t'+tier);if(im)return im;}
    return null;
  }
  globalThis.AtlasImages=Object.freeze({catalog,entries,related,forRecord,render,character,get:(category,name)=>entries.get(category+'/'+name)??null});
  document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement&&e.target.dataset.catalogImage){const p=document.createElement('span');p.className='atlas-image-missing';p.setAttribute('role','img');p.setAttribute('aria-label','A kép nem tölthető be');p.textContent='A kép nem érhető el';e.target.replaceWith(p);}},true);
})();

/* Run manually on the game page. No requests, state, credentials or account IDs. */
(() => {
  const urls=new Set(),accept=value=>{try{const u=new URL(value,location.href);if(u.origin!=='https://stonestorm.gg'||u.username||u.password||u.hash||value.includes('%')||!/^\/(?:art|assets)\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|gif|avif)$/i.test(u.pathname))return;for(const [k,v] of u.searchParams)if(k!=='v'||!/^[a-zA-Z0-9_.-]{1,80}$/.test(v))return;urls.add(u.href);}catch{}};
  for(const image of document.images)accept(image.currentSrc||image.src);
  for(const resource of performance.getEntriesByType('resource'))accept(resource.name);
  const data={schema:1,source:'user-initiated-sanitized-image-references',images:[...urls].sort().map(url=>({url}))};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='stonestorm-image-references.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
})();

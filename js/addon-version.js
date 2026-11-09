/* Verzió- és kiadási adatok tiszta ellenőrzése; nincs kapcsolat a játék statképleteivel. */
(() => {
  const version=value=>typeof value==='string'&&/^(?:0|[1-9]\d{0,4})(?:\.(?:0|[1-9]\d{0,4})){0,3}$/.test(value)&&value.split('.').every(n=>Number(n)<=65535)&&value.split('.').some(n=>Number(n)>0);
  function compare(a,b){
    if(!version(a)||!version(b))return null;
    const left=a.split('.').map(Number),right=b.split('.').map(Number);
    for(let i=0;i<4;i++){const delta=(left[i]??0)-(right[i]??0);if(delta)return Math.sign(delta);}return 0;
  }
  function release(data){
    if(!data||data.schema!==1||data.name!=='Stonestorm Stat Cap Overlay'||data.beta!==true||!version(data.version)||data.zip!=='downloads/stonestorm-statcap-overlay.zip'||!Number.isSafeInteger(data.bytes)||data.bytes<1||data.bytes>5*1024*1024||typeof data.sha256!=='string'||!/^[a-f0-9]{64}$/.test(data.sha256))return null;
    return Object.freeze({schema:1,name:data.name,version:data.version,beta:true,zip:data.zip,bytes:data.bytes,sha256:data.sha256});
  }
  globalThis.StonestormAddonVersion=Object.freeze({version,compare,release});
})();

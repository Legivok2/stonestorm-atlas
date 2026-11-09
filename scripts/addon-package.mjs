import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import '../js/addon-version.js';
export const addonDirectory='addons/stonestorm-statcap-overlay';
export const addonZip='downloads/stonestorm-statcap-overlay.zip';
export const addonMetadata='downloads/stat-addon.json';
export const addonRuntime=['manifest.json','capture.js','content.js','icons/icon-16.png','icons/icon-32.png','icons/icon-48.png','icons/icon-128.png'];
export const addonSource=[...addonRuntime,'README.md','PRIVACY.md','PUBLISH.md','package.json','import.json','tests/capture-refresh.test.js'].map(file=>addonDirectory+'/'+file);
export const addonArtifacts=[addonZip,addonMetadata,'js/addon-release.js'];
export const sha256=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(buffer){let crc=0xffffffff;for(const byte of buffer)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
// ZIP store módban, rögzített dátummal: nem függ operációs rendszertől vagy tömörítőprogramtól.
export function createZip(entries){
  const local=[],central=[],seen=new Set();let offset=0;
  for(const [name,bytes] of entries){
    if(!/^[a-zA-Z0-9_./-]+$/.test(name)||name.startsWith('/')||name.split('/').some(p=>!p||p==='.'||p==='..')||seen.has(name)||!Buffer.isBuffer(bytes)||bytes.length>5*1024*1024)throw Error('Nem biztonságos addon ZIP-bejegyzés.');
    seen.add(name);const filename=Buffer.from(name),crc=crc32(bytes),header=Buffer.alloc(30),directory=Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(bytes.length,18);header.writeUInt32LE(bytes.length,22);header.writeUInt16LE(filename.length,26);
    directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(33,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(bytes.length,20);directory.writeUInt32LE(bytes.length,24);directory.writeUInt16LE(filename.length,28);directory.writeUInt32LE(offset,42);
    local.push(header,filename,bytes);central.push(directory,filename);offset+=header.length+filename.length+bytes.length;
  }
  const listing=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(listing.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,listing,end]);
}
export function expectedAddon(root){
  const read=file=>{const target=path.join(root,addonDirectory,file);if(fs.lstatSync(target).isSymbolicLink())throw Error('Szimbolikus link nem kerülhet az addonba.');return fs.readFileSync(target);};
  const manifest=JSON.parse(read('manifest.json'));
  assert.equal(manifest.manifest_version,3);assert(globalThis.StonestormAddonVersion.version(manifest.version));assert.equal(manifest.name,'Stonestorm Stat Cap Overlay');
  for(const ref of [...Object.values(manifest.icons),...manifest.content_scripts.flatMap(s=>s.js)])assert(addonRuntime.includes(ref),'Hiányzik az addon tételes csomaglistájából: '+ref);
  const original=JSON.parse(read('import.json'));
  if(manifest.version===original.version)for(const file of addonRuntime)assert.equal(sha256(read(file)),original.runtimeSha256[file],'Az átvett addon futásidejű fájlja változott verzióemelés nélkül: '+file);
  const zip=createZip([...addonRuntime,'README.md','PRIVACY.md'].sort().map(file=>[file,read(file)]));
  const metadata={schema:1,name:manifest.name,version:manifest.version,beta:true,zip:addonZip,bytes:zip.length,sha256:sha256(zip)};
  assert(globalThis.StonestormAddonVersion.release(metadata),'Az addon kiadási adata érvénytelen vagy a csomag túl nagy.');
  const json=JSON.stringify(metadata,null,2)+'\n',bootstrap='/* Generált kiadási tartalékadat; npm run build:addon. */\nglobalThis.STONESTORM_ADDON_RELEASE = '+JSON.stringify(metadata)+';\n';
  return {zip,json,bootstrap,metadata};
}
export function buildAddon(root){
  const result=expectedAddon(root);fs.mkdirSync(path.join(root,'downloads'),{recursive:true});
  for(const [file,bytes] of [[addonZip,result.zip],[addonMetadata,result.json],['js/addon-release.js',result.bootstrap]])fs.writeFileSync(path.join(root,file),bytes);
  return result.metadata;
}
export function assertAddonPackage(root){
  const result=expectedAddon(root);
  for(const [file,bytes] of [[addonZip,result.zip],[addonMetadata,result.json],['js/addon-release.js',result.bootstrap]])assert(fs.readFileSync(path.join(root,file)).equals(Buffer.from(bytes)),'Eltérő vagy elavult addonkiadás; futtasd: npm run build:addon. Fájl: '+file);
  return result.metadata;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),result=process.argv.includes('--check')?assertAddonPackage(root):buildAddon(root);
  console.log(`Addon BÉTA ${result.version}: ${result.bytes} bájt, ellenőrzött ZIP és verzióadat.`);
}

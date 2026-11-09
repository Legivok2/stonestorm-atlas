import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,runtimeFiles,sourceFiles,assertSafeRelative} from '../scripts/publication-plan.mjs';
import {addonDirectory,addonZip,addonRuntime,addonSource,assertAddonPackage,expectedAddon,createZip,crc32,sha256} from '../scripts/addon-package.mjs';
const versions=globalThis.StonestormAddonVersion;

test('Addonverziók: numerikus összehasonlítás, negyedik komponens és érvénytelen értékek',()=>{
  for(const [left,right,result] of [['0.9.10','0.9.3',1],['0.10.0','0.9.99',1],['1.0','0.99.99',1],['0.9.3','0.9.3.0',0],['0.9.3.1','0.9.3',1],['0.9.2','0.9.3',-1]])assert.equal(versions.compare(left,right),result);
  for(const value of ['','v0.9.3','0.9.3-beta','01.2.3','0.0.0','65536.1','0.1.2.3.4',null,{},'1<script>']){assert(!versions.version(value));assert.equal(versions.compare(value,'0.9.3'),null);}
});

test('A kiadási JSON nem adhat külső vagy könyvtárbejáró letöltési címet, hibás verziót vagy hash-t',()=>{
  const release=assertAddonPackage(root);assert(versions.release(release));
  for(const patch of [{schema:2},{beta:false},{zip:'https://example.com/fake.zip'},{zip:'downloads/../secret.zip'},{version:'0.9.x'},{bytes:-1},{bytes:Infinity},{sha256:'invalid'},{name:'<script>'}])assert.equal(versions.release({...release,...patch}),null);
});

test('Az importált 0.9.3-as manifest, statisztikai szkriptek és ikonok bájtra egyeznek az eredeti lenyomatokkal',()=>{
  const original=JSON.parse(fs.readFileSync(path.join(root,addonDirectory,'import.json')));
  assert.equal(original.version,'0.9.3');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,addonDirectory,'manifest.json')));
  if(manifest.version===original.version)for(const file of addonRuntime)assert.equal(sha256(fs.readFileSync(path.join(root,addonDirectory,file))),original.runtimeSha256[file],file);
  else assert.equal(versions.compare(manifest.version,original.version),1,'Új forrás csak emelt verzióval adható ki; az eredeti importjegyzék megmarad.');
});

test('A letölthető ZIP determinisztikus, gyökérszintű manifestet és csak a kilenc kijelölt fájlt tartalmazza',()=>{
  const expected=expectedAddon(root),archive=fs.readFileSync(path.join(root,addonZip));assert(archive.equals(expected.zip));
  assert.equal(sha256(archive),expected.metadata.sha256);assert.equal(archive.length,expected.metadata.bytes);
  const names=[];let offset=0;
  while(archive.readUInt32LE(offset)===0x04034b50){
    assert.equal(archive.readUInt16LE(offset+8),0);const length=archive.readUInt32LE(offset+18),n=archive.readUInt16LE(offset+26),extra=archive.readUInt16LE(offset+28);
    const name=archive.subarray(offset+30,offset+30+n).toString(),start=offset+30+n+extra,bytes=archive.subarray(start,start+length);
    assert.equal(crc32(bytes),archive.readUInt32LE(offset+14));assert(bytes.equals(fs.readFileSync(path.join(root,addonDirectory,name))),name);names.push(name);offset=start+length;
  }
  assert.deepEqual(names,[...addonRuntime,'README.md','PRIVACY.md'].sort());assert.equal(archive.readUInt32LE(offset),0x02014b50);
  assert.equal(archive.readUInt32LE(archive.length-22),0x06054b50);assert.equal(archive.readUInt16LE(archive.length-12),9);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'downloads/stat-addon.json'))).version,expected.metadata.version);
});

test('ZIP-készítés: ismert CRC, azonos eredmény és tiltott vagy ismételt fájlnevek',()=>{
  assert.equal(crc32(Buffer.from('123456789')),0xcbf43926);
  const entries=[['manifest.json',Buffer.from('{}')]];assert(createZip(entries).equals(createZip(entries)));
  for(const name of ['../secret','/secret','icons/../../secret','icons\\secret','./manifest.json','icons//x'])assert.throws(()=>createZip([[name,Buffer.from('x')]]));
  assert.throws(()=>createZip([...entries,...entries]));
});

test('Pages-csomag: az addon forrása csak GitHubra kerül, a jóváhagyott ZIP és verzióadat az oldalra is',()=>{
  const runtime=runtimeFiles(),source=sourceFiles();
  assert(runtime.includes(addonZip));assert(runtime.includes('downloads/stat-addon.json'));assert(!runtime.some(p=>p.startsWith('addons/')));
  for(const file of addonSource)assert(source.includes(file),file);
  assert.doesNotThrow(()=>assertSafeRelative(addonZip));assert.throws(()=>assertSafeRelative('downloads/other.zip'));
});

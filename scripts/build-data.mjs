import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = fs.readdirSync(path.join(root, 'source-data')).filter(x => x.endsWith('.json')).sort();
const raw = files.map(file => JSON.parse(fs.readFileSync(path.join(root, 'source-data', file), 'utf8')));
const [registry, gear, forge, pets, mounts, classes, world, hunt, economy, home, achievements, guild, config, locale] = raw;
const provenance = (n, status='verified') => ({source:files[n], checkedAt:'2026-11-06', status, scope:'Mentett kliensadat; nem élő szerverellenőrzés'});
const records = (rows, n, map=x=>x) => rows.map(x => ({...map(x), provenance:provenance(n)}));
const unique = (rows, key='id') => {
  const seen = new Map();
  for (const x of rows) {
    if (seen.has(x[key]) && JSON.stringify(seen.get(x[key])) !== JSON.stringify(x)) throw Error(`Eltérő duplikátum: ${x[key]}`);
    seen.set(x[key], x);
  }
  return [...seen.values()];
};
const db = {
  version:2, updated:'2026-11-06', dataVersion:config.version,
  items:unique(records(gear.items,1,x=>({...x,name:x.nameHu,nameEn:null}))),
  sets:unique(records(gear.collectionFamilies.families,1,x=>({...x.set,familyId:x.id,mapIndex:x.mapIndex,itemLevel:x.itemLevel,bossId:x.bossId,unique:x.unique,loot:x.loot,name:`${world.maps.find(m=>m.index===x.mapIndex)?.nameHu ?? x.id} · szettcsalád`,nameIsEditorial:true}))),
  pets:unique(records(pets.types,3,x=>({...x,name:x.nameHu,nameEn:null}))),
  petTraits:pets.traits, petSkills:pets.v3.skills, petSkillNames:pets.locale.skills,
  petForms:pets.v3.forms, petRules:pets.rules,
  mounts:unique(records(mounts.mounts,4,x=>({...x,name:x.nameHu,nameEn:null}))),
  classes:records(classes.classes,5,x=>({...x,name:classes.locale.classes[x.id]?.name ?? classes.locale.classes[x.id] ?? x.id})),
  kingdoms:classes.kingdoms, kingdomNames:classes.locale.kingdoms,
  maps:records(world.maps,6,x=>({...x,name:x.nameHu})),
  mobs:records(world.mobs,6,x=>({...x,name:x.nameHu})),
  bosses:records(world.bosses,6,x=>({...x,name:world.mobs.find(m=>m.id===x.mobId)?.nameHu ?? x.nameHu ?? x.id})),
  dungeons:records(world.dungeons,6,x=>({...x,name:world.locale.dungeon.names[x.id]??x.id,description:world.locale.dungeon.lore[x.id]??null})),
  dungeonCreatures:world.locale.dungeon.creatures ?? {},
  guild:{...guild,provenance:provenance(11,'derived')},
  guildRoles:guild.locale.roles,
  economy:{limits:economy.limits,stackables:records(economy.stackables,8,x=>({...x,name:x.nameHu})),stackKindNames:economy.locale.stackKinds},
  forge:{chances:forge.forge.chances,chancesByTier:forge.forge.chancesByTier,plusMult:forge.forge.plusMult,provenance:provenance(2)},
  hunting:{expedition:hunt.expedition,patrol:hunt.patrol,idle:hunt.idle,energy:hunt.spine.energy,provenance:provenance(7)},
  home:{data:home.dataHome,caution:home.caution,provenance:provenance(9)},
  research:records(Object.entries(home.lean.researchSteps).map(([id,x])=>({id,...x})),9,x=>({...x,name:home.locale.research.steps[x.id]?.title??x.id,description:home.locale.research.steps[x.id]?.story??null})),
  achievements:records(achievements.achievementSets,10),
  labels:{slots:gear.locale.slots,stats:locale.base.item},
  sources:files.map((file,n)=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'source-data',file))).digest('hex'),metadata:raw[n].metadata??null})),
  originalHashes:registry.sourceHashes,
  conflicts:[
    {id:'energy-refill',status:'observed',title:'Kétféle energiafeltöltési ár',sources:[files[7]],description:'expedition.refill: 25 energia / 3 VÉ; spine.energy.refill: 10 VÉ-től induló, növekvő ársor. A két konfiguráció alkalmazási köre nem igazolt. Egyiket sem tekintjük általános élő árnak.'},
    {id:'guild-skip',status:'derived',title:'A céhes gyorsítás két konfigurációja',sources:[files[8],files[11],'ATLAS_VSCODE_KEZIKONYV.md'],description:'A céhes gomb ellenőrzött képlete 20 / 50 / 100 VÉ megkezdett óránként. A skip.guild_building (120 perc / 1 VÉ) ettől eltérő beállítás; a kalkulátor a dokumentált gombképletet használja.'},
    {id:'home-name',status:'unknown',title:'A dataHome nem bizonyít házbónuszt',sources:[files[9]],description:'A dataHome technikai kulcs feloldási szinteket és kovácsbeállításokat tartalmaz. Házépítést, bútorokat vagy XP-bónuszt ebből nem vezetünk le.'},
    {id:'pet-versions',status:'observed',title:'Eltérő kísérő-skálázások',sources:[files[3]],description:'A rules.traitLevelScale és a v3.forms.traitLevelScale külön verziójú értékeket ad. A felület a fajbónuszt, a közös trait-fokozatokat és a v3 formákat külön mutatja; nem számít belőlük nem igazolt összbónuszt.'}
  ]
};
// A ZIP képei azonosak a meglévő mentéssel: egyetlen példányra hivatkozunk.
const usedGame = ['btn_character','btn_hunt','btn_guild','btn_city','btn_tower','btn_help','btn_arena','btn_premium','bld_hq','bld_forge','bld_dojo','bld_warehouse','bld_banner','guildyard_base','m4_boss','energy','nyang_small','coin_dragon','luck_ore','emblem_storm'];
const images = usedGame.map(id=>{
  const file=`Stonestorm_files/${id}.webp`;
  if(!fs.existsSync(path.join(root,file))) throw Error(`Hiányzó kép: ${file}`);
  return {id,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),source:`Felhasználói játékmentés; ZIP: dist/assets/game/${id}.webp`,permission:'unverified-public-reuse',usage:id.startsWith('bld_')?'Azonosított céhes épület':id==='m4_boss'?'Csak a 4. pálya bossához':'Kategóriaikon / azonosított rendszerillusztráció'};
});
db.images=images;
fs.mkdirSync(path.join(root,'data'),{recursive:true});
fs.writeFileSync(path.join(root,'data/atlas.json'),JSON.stringify(db));
fs.writeFileSync(path.join(root,'js/atlas-data.js'),`/* Generált fájl; npm run build:data. */\nwindow.STONESTORM_ATLAS = ${JSON.stringify(db).replaceAll('<','\\u003c')};\n`);
fs.writeFileSync(path.join(root,'data/image-manifest.json'),JSON.stringify(images,null,2)+'\n');
console.log(`Atlas: ${db.items.length} tárgy, ${db.sets.length} szett, ${db.pets.length} kísérő, ${db.mounts.length} hátas, ${db.mobs.length} ellenfél; ${images.length} játékmentési kép.`);

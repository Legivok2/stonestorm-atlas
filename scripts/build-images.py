"""Build a local-only catalog; validate image bytes and retain provenance. No downloads."""
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / 'stonestorm_image_tools'
db = json.loads((ROOT / 'data/atlas.json').read_text(encoding='utf-8'))
manifest = json.loads((TOOLS / 'manifest.json').read_text(encoding='utf-8-sig'))
results = list(csv.DictReader((TOOLS / 'results.csv').open(encoding='utf-8-sig', newline='')))
result_index = {(r['category'], r['name']): r for r in results}
labels = {'weapons':'Fegyverek','icons':'Felszerelések és tárgyikonok','pets':'Kísérők','mounts':'Hátasok','mobs':'Szörnyek','body':'Karakterek · teljes alak','portraits':'Karakterportrék','guild':'Céhek és épületek','furniture':'Bútorok','scenes':'Világok és hátterek','spots':'Helyszínek','portals':'Portálok','stones':'Kövek','uikit':'Kezelőfelület · ikonok','ui':'Jelvények és kezelőelemek','achv':'Teljesítmények','arena':'Arénarangok','offers':'Ajánlatgrafikák','events':'Eseménygrafikák','research':'Kutatások','city':'Városi szereplők','city-rim':'Városi peremgrafikák','bleed':'Átmeneti hátterek','patches':'Zászlók','play':'Portyagrafikák','npcs':'NPC-k','video':'Videók (nincs WebP)'}
classes = {c['id']:c['name'] for c in db['classes']}
entities = {kind:{x['id']:x for x in db[key]} for kind,key in [('item','items'),('pet','pets'),('mount','mounts'),('mob','mobs'),('map','maps'),('set','sets'),('dungeon','dungeons'),('class','classes'),('research','research')]}
entities['material'] = {x['id']:x for x in db['economy']['stackables']}
canonical = {}
for old in db['images']:
    canonical[old['sha256']] = old['file']
entries, missing, invalid = [], [], []
hash_groups = defaultdict(list)
for category,names in manifest.items():
    if not isinstance(names,list):
        continue
    if not re.fullmatch(r'[A-Za-z0-9_-]+',category):
        raise ValueError('Invalid manifest category: '+str(category))
    for name in names:
        if not re.fullmatch(r'[A-Za-z0-9_-]+',name):
            raise ValueError('Invalid manifest name: '+str(name))
        key = category+'/'+name
        relative = f'stonestorm_image_tools/downloaded/{key}.webp'
        path = ROOT / relative
        result = result_index.get((category,name),{})
        if not path.is_file():
            missing.append({'id':key,'downloadStatus':result.get('status','not-recorded')})
            continue
        try:
            with Image.open(path) as im:
                im.verify()
            with Image.open(path) as im:
                width,height = im.size
                fmt=im.format
            if fmt!='WEBP':
                raise ValueError('Not WebP')
        except Exception as exc:
            invalid.append({'id':key,'error':str(exc)})
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        hash_groups[digest].append(key)
        canonical.setdefault(digest,relative)
        thumbnail=canonical[digest]
        if width>320 or height>240:
            thumbnail='assets/catalog-thumbs/'+digest[:20]+'.webp'
            thumbpath=ROOT/thumbnail
            if not thumbpath.exists():
                thumbpath.parent.mkdir(parents=True,exist_ok=True)
                with Image.open(path) as im:
                    im=im.convert('RGBA')
                    im.thumbnail((320,240))
                    im.save(thumbpath,'WEBP',quality=76,method=3)
        relations=[]
        def relate(kind,entity_id,status,evidence):
            if kind in entities and entity_id not in entities[kind]:
                return
            relation={'kind':kind,'id':entity_id,'status':status,'evidence':evidence}
            if not any(r['kind']==kind and r['id']==entity_id for r in relations):
                relations.append(relation)
        if category in ('icons','weapons'):
            for item in db['items']:
                expected='weapons' if item['slot']=='weapon' else 'icons'
                # The explicit art field overrides ID coincidence.
                if category==expected and name==(item.get('art') or item['id']):
                    relate('item',item['id'],'identified','Forrás: items[].art vagy azonos kategóriájú pontos item.id')
                elif category==expected and name==item['id']:
                    relate('item',item['id'],'partial','Pontos tárgy-ID, de a forrás art mezője más elsődleges grafikát jelöl')
            for item in db['economy']['stackables']:
                if name==item['id']:
                    relate('material',item['id'],'identified','Pontos stackable.id')
        if category=='mounts' and name in entities['mount']:
            relate('mount',name,'identified','Pontos mount.id')
        if category=='mobs':
            if name in entities['mob']:
                relate('mob',name,'identified','Pontos mob.id')
            for dungeon in db['dungeons']:
                if any(r['creatureId']==name for r in dungeon['rooms']+dungeon.get('heroic',{}).get('rooms',[])):
                    relate('dungeon',dungeon['id'],'identified','Pontos rooms[].creatureId; a kapcsolódó kazamata adatlapja')
        if category=='pets':
            for pet in db['pets']:
                if name==pet['id'] or re.fullmatch(re.escape(pet['id'])+r'(?:_[1-5])?(?:_sprite)?',name):
                    relate('pet',pet['id'],'partial','Faj-ID + grafikai változat; a sorszám és fejlődési fok kapcsolata nincs igazolva')
        character=None
        match=re.fullmatch(r'(warrior|ninja|shaman|mage_blade)_(male|female)(?:_v(\d+))?_(t\d+|l\d+|set_m\d+)',name)
        if category in ('body','portraits') and match:
            cls,gender,look,appearance=match.groups()
            character={'classId':cls,'gender':gender,'look':int(look or 1),'appearance':appearance,'imageType':'full-character' if category=='body' else 'portrait'}
            relate('class',cls,'identified','Mentett kliens MD/o1/i1: class_gender[_vN] + portrait vagy t{portraitTier}')
            for item in db['items']:
                if item['slot']=='armor' and cls in (item.get('classes') or []):
                    code=item.get('portrait') or 't'+str(item.get('portraitTier',0))
                    if code==appearance:
                        relate('item',item['id'],'identified','items[].portrait/portraitTier + a mentett kliens MD/o1/i1 szabálya')
        if category in ('scenes','portals'):
            for map_data in db['maps']:
                if name in ('map_'+map_data['id'],'portal_'+map_data['id']):
                    relate('map',map_data['id'],'partial','Kategória + pontos pályaazonosító; a képkiválasztás kliensszabálya nem igazolt')
            for boss in db['bosses']:
                if name==boss['id']:
                    relate('mob',boss['mobId'],'partial','Bossazonosítóval egyező jelenetnév')
            for dungeon in db['dungeons']:
                if name in ('dungeon_'+dungeon['id'],'boss_d_'+dungeon['id']):
                    relate('dungeon',dungeon['id'],'partial','Kazamataazonosítóval egyező jelenetnév')
        if category=='spots':
            for map_data in db['maps']:
                if any(s['id']==name for s in map_data['spots']):
                    relate('map',map_data['id'],'identified','Pontos maps[].spots[].id')
        if category in ('guild','scenes'):
            for b in db['guild']['buildings']:
                if name=='bld_'+b['kind']:
                    relations.append({'kind':'building','id':b['kind'],'status':'identified','evidence':'Dokumentált bld_{kind} épületgrafika'})
                elif re.fullmatch(r'guildyard_'+b['kind']+r'_(?:t[1-3]|lot)',name):
                    relations.append({'kind':'building','id':b['kind'],'status':'partial','evidence':'Épület-ID és udvarváltozat; t1–t3 nem 1–15. épületszint'})
        if category=='research' and name.startswith('disc_') and name[5:] in entities['research']:
            relate('research',name[5:],'identified','Pontos kutatási lépés-ID disc_ előtaggal')
        status='identified' if any(r['status']=='identified' for r in relations) else 'partial' if relations else 'unknown'
        primary=next((r for r in relations if r['status']=='identified' and r['kind']!='class'),next(iter(relations),None))
        title=entities.get(primary['kind'],{}).get(primary['id'],{}).get('name') if primary else None
        if character:
            title=f"{classes[character['classId']]} · {'férfi' if character['gender']=='male' else 'nő'} · {character['appearance']} · {character['look']}. változat"
        if primary and primary['kind']=='building':
            title=next(b['nameHu'] for b in db['guild']['buildings'] if b['kind']==primary['id'])
        entries.append({'id':key,'name':name,'filename':name+'.webp','category':category,'file':canonical[digest],'thumbnail':thumbnail,'originalFile':relative,'width':width,'height':height,'bytes':path.stat().st_size,'sha256':digest,'status':status,'title':title,'relations':relations,'character':character,'isSprite':name.endswith('_sprite'),'downloadStatus':result.get('status','not-recorded'),'sourceUrl':result.get('url',f'https://stonestorm.gg/art/{key}.webp'),'permission':'unverified-public-reuse'})

categories=[{'id':c,'name':labels.get(c,c),'count':sum(e['category']==c for e in entries)} for c,v in manifest.items() if isinstance(v,list) and any(e['category']==c for e in entries)]
counts=Counter(e['status'] for e in entries)
catalog={'version':1,'source':'stonestorm_image_tools/manifest.json + results.csv + ellenőrzött helyi fájlok','categories':categories,'entries':entries,'stats':{'manifestEntries':sum(len(v) for v in manifest.values() if isinstance(v,list)),'available':len(entries),'missing':len(missing),'invalid':len(invalid),'uniqueContent':len(hash_groups),'duplicateGroups':sum(len(v)>1 for v in hash_groups.values()),'categories':len(categories),**dict(counts)}}
text=json.dumps(catalog,ensure_ascii=False,separators=(',',':'))
(ROOT/'data/image-catalog.json').write_text(text,encoding='utf-8')
(ROOT/'js/image-data.js').write_text('/* Generált: npm run build:images. */\nwindow.STONESTORM_IMAGES='+text.replace('<','\\u003c')+';\n',encoding='utf-8')
audit={'stats':catalog['stats'],'missing':missing,'invalid':invalid,'duplicates':[{'sha256':h,'images':v} for h,v in hash_groups.items() if len(v)>1],'csvStatuses':dict(Counter(r['status'] for r in results)),'unlistedLocalFiles':[p.relative_to(ROOT).as_posix() for p in (TOOLS/'downloaded').rglob('*') if p.is_file() and p.relative_to(TOOLS/'downloaded').with_suffix('').as_posix() not in {e['id'] for e in entries}]}
(ROOT/'data/image-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(catalog['stats'],ensure_ascii=False))

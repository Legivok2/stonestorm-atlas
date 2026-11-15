import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const src=JSON.parse(fs.readFileSync(new URL('source-data/01_felszerelesek_es_szettek.json',root),'utf8'));
const atlas=JSON.parse(fs.readFileSync(new URL('data/atlas.json',root),'utf8'));
const evidence=JSON.parse(fs.readFileSync(new URL('data/set-bonus-evidence.json',root),'utf8'));
const expected={
  "m1": [
    {
      "pieces": 2,
      "stats": [
        {
          "stat": "maxHp",
          "value": 100
        }
      ]
    },
    {
      "pieces": 4,
      "stats": [
        {
          "stat": "attack",
          "value": 10
        },
        {
          "stat": "vsBoss",
          "value": 0.08
        }
      ]
    },
    {
      "pieces": 6,
      "stats": [
        {
          "stat": "potionHeal",
          "value": 0.08
        }
      ]
    }
  ],
  "m2": [
    {
      "pieces": 2,
      "stats": [
        {
          "stat": "attack",
          "value": 27
        }
      ]
    },
    {
      "pieces": 4,
      "stats": [
        {
          "stat": "maxHp",
          "value": 288
        },
        {
          "stat": "vsBoss",
          "value": 0.082
        }
      ]
    },
    {
      "pieces": 6,
      "stats": [
        {
          "stat": "skillDamage",
          "value": 0.179
        }
      ]
    }
  ],
  "m3": [
    {
      "pieces": 2,
      "stats": [
        {
          "stat": "maxHp",
          "value": 467
        }
      ]
    },
    {
      "pieces": 4,
      "stats": [
        {
          "stat": "attack",
          "value": 42
        },
        {
          "stat": "vsBoss",
          "value": 0.082
        }
      ]
    },
    {
      "pieces": 6,
      "stats": [
        {
          "stat": "critDamage",
          "value": 0.297
        }
      ]
    }
  ],
  "m4": [
    {
      "pieces": 2,
      "stats": [
        {
          "stat": "attack",
          "value": 56
        }
      ]
    },
    {
      "pieces": 4,
      "stats": [
        {
          "stat": "maxHp",
          "value": 638
        },
        {
          "stat": "vsBoss",
          "value": 0.083
        }
      ]
    },
    {
      "pieces": 6,
      "stats": [
        {
          "stat": "lifesteal",
          "value": 0.035
        }
      ]
    }
  ],
  "m5": [
    {
      "pieces": 2,
      "stats": [
        {
          "stat": "maxHp",
          "value": 805
        }
      ]
    },
    {
      "pieces": 4,
      "stats": [
        {
          "stat": "attack",
          "value": 70
        },
        {
          "stat": "vsBoss",
          "value": 0.084
        }
      ]
    },
    {
      "pieces": 6,
      "stats": [
        {
          "stat": "damageTaken",
          "value": 0.084
        }
      ]
    }
  ],
  "m6": [
    {
      "pieces": 2,
      "stats": [
        {
          "stat": "attack",
          "value": 81
        }
      ]
    },
    {
      "pieces": 4,
      "stats": [
        {
          "stat": "maxHp",
          "value": 940
        },
        {
          "stat": "vsBoss",
          "value": 0.084
        }
      ]
    },
    {
      "pieces": 6,
      "stats": [
        {
          "stat": "critDamage",
          "value": 0.448
        }
      ]
    }
  ]
};
test('Mind a hat szett teljes 2/4/6 bónuszsora egyezik a visszafejtett FULL szabállyal',()=>{
  assert.equal(atlas.sets.length,6);
  for(const [family,bonuses] of Object.entries(expected)){
    assert.deepEqual(src.collectionFamilies.families.find(x=>x.id===family).set.bonuses,bonuses);
    const s=atlas.sets.find(x=>x.familyId===family);
    assert(s,'missing '+family);
    assert.deepEqual(s.bonuses,bonuses,family);
    assert.equal(s.provenance.status,family==='m4'?'verified':'derived');
  }
});
test('Romőr M4 teljesen egyezik a játék képernyőképével',()=>{
  assert.deepEqual(atlas.sets.find(x=>x.familyId==='m4').bonuses,[{"pieces":2,"stats":[{"stat":"attack","value":56}]},{"pieces":4,"stats":[{"stat":"maxHp","value":638},{"stat":"vsBoss","value":0.083}]},{"pieces":6,"stats":[{"stat":"lifesteal","value":0.035}]}]);
  assert.deepEqual(evidence.directlyConfirmedInGame,['m4']);
});
test('A böngészős atlas-data.js is ugyanazokat a szettbónuszokat tartalmazza',()=>{
  const code=fs.readFileSync(new URL('js/atlas-data.js',root),'utf8');
  const prefix='window.STONESTORM_ATLAS = ';
  const start=code.indexOf(prefix);
  assert(start>=0);
  const end=code.lastIndexOf(';');
  const data=JSON.parse(code.slice(start+prefix.length,end));
  for(const s of data.sets)assert.deepEqual(s.bonuses,expected[s.familyId]);
});

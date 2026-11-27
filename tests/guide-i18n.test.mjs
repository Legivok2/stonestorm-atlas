import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={window:{}};
for(const file of ['js/content.js','js/guide-en.js']){
  vm.runInNewContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),context,{filename:file});
}
const hu=context.window.STONESTORM_CONTENT;
const en=context.window.STONESTORM_GUIDE_EN;

test('every guide article and FAQ has a complete English counterpart',()=>{
  assert.equal(hu.articles.length,26);
  assert.equal(Object.keys(en.articles).length,hu.articles.length);
  const missing=[];
  const translated=(value,original,location)=>{
    if(typeof value!=='string'||!value.trim()||value===original)missing.push(location);
  };
  for(const article of hu.articles){
    const copy=en.articles[article.id];
    if(!copy){missing.push(article.id);continue;}
    translated(copy.title,article.title,article.id+'.title');
    translated(copy.intro,article.intro,article.id+'.intro');
    if(copy.sections.length!==article.sections.length)missing.push(article.id+'.sections');
    for(const [index,section] of article.sections.entries()){
      const target=copy.sections[index];
      if(!target){missing.push(article.id+'.section'+index);continue;}
      if(section.heading&&!(typeof target.heading==='string'&&target.heading.trim()))missing.push(article.id+'.heading'+index);
      if(target.items.length!==section.items.length)missing.push(article.id+'.items'+index);
      section.items.forEach((text,i)=>translated(target.items[i],text,article.id+'.items'+index+'.'+i));
    }
    if(article.tip)translated(copy.tip,article.tip,article.id+'.tip');
  }
  assert.equal(hu.faq.length,10);
  assert.equal(en.faq.length,hu.faq.length);
  hu.faq.forEach((faq,index)=>{
    translated(en.faq[index]?.question,faq.question,'faq'+index+'.question');
    translated(en.faq[index]?.answer,faq.answer,'faq'+index+'.answer');
  });
  assert.deepEqual(missing,[],'Missing or unchanged translations: '+missing.join(', '));
  assert.equal(en.classes && Object.keys(en.classes).length,hu.classes.length);
  assert.equal(en.daily.length,hu.daily.length);
  hu.classes.forEach((entry)=>{
    const translation=en.classes[entry.id];
    assert(translation?.description?.trim(),entry.id+' class description');
    assert.notEqual(translation.description,entry.description,entry.id+' class was not translated');
  });
  hu.daily.forEach((entry,index)=>{
    assert(en.daily[index]?.title?.trim(),'daily title '+entry.id);
    assert(en.daily[index]?.description?.trim(),'daily description '+entry.id);
    assert.notEqual(en.daily[index].title,entry.title,'daily title '+entry.id);
    assert.notEqual(en.daily[index].description,entry.description,'daily description '+entry.id);
  });
});

test('all static guide translation attributes resolve in the shared Atlas dictionaries',()=>{
  const i18nContext={localStorage:{getItem:()=>null,setItem:()=>{}},console:{warn:()=>{}}};
  vm.runInNewContext(fs.readFileSync(new URL('../js/atlas-i18n.js',import.meta.url),'utf8'),i18nContext);
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const keys=[...html.matchAll(/data-atlas-i18n(?:-label)?="(guide\.static\.[^"]+)"/g)].map(match=>match[1]);
  const unique=[...new Set(keys)];
  const missing=unique.filter(key=>!i18nContext.AtlasI18n.dictionaries.en[key]?.trim());
  assert.deepEqual(missing,[]);
  assert(unique.length>=100,'Expected translations across all static guide sections');
});

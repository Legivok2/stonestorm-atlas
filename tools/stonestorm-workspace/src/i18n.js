(() => {
  'use strict';
  let dictionaries={hu:{},en:{}},entries=[];const roots=new Set(),originalText=new WeakMap(),originalAttributes=new WeakMap(),lastText=new WeakMap(),lastAttributes=new WeakMap();let locale='hu';
  const attrs=['title','aria-label'];
  const translate=value=>{if(locale==='hu')return value;for(const [source,key] of entries)if(source===value)return dictionaries.en[key]??value;return value;};
  function text(node){const current=node.nodeValue??'',last=lastText.get(node);if(last===undefined||current!==last)originalText.set(node,current);const original=originalText.get(node)??current,match=original.match(/^(\s*)([\s\S]*?)(\s*)$/),next=match[2]?match[1]+translate(match[2])+match[3]:original;if(next!==current)node.nodeValue=next;lastText.set(node,next);}
  function element(node){for(const name of attrs){if(!node.hasAttribute?.(name))continue;let originals=originalAttributes.get(node);if(!originals){originals={};originalAttributes.set(node,originals);}let applied=lastAttributes.get(node);if(!applied){applied={};lastAttributes.set(node,applied);}const current=node.getAttribute(name);if(applied[name]===undefined||current!==applied[name])originals[name]=current;const next=translate(originals[name]??current);if(next!==current)node.setAttribute(name,next);applied[name]=next;}}
  function apply(root=document.documentElement){element(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))node.nodeType===Node.TEXT_NODE?text(node):element(node);document.documentElement.lang=locale;}
  function observe(root=document.documentElement){if(roots.has(root))return;roots.add(root);apply(root);new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')text(record.target);else if(record.type==='attributes')element(record.target);else for(const node of record.addedNodes)node.nodeType===Node.TEXT_NODE?text(node):apply(node);}}).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});}
  function setLocale(value){locale=value==='en'?'en':'hu';for(const root of roots)apply(root);return locale;}
  function setDictionaries(value){if(value?.hu&&value?.en){dictionaries=value;entries=Object.keys(dictionaries.hu).map(key=>[dictionaries.hu[key],key]).sort((a,b)=>b[0].length-a[0].length);for(const root of roots)apply(root);}}
  globalThis.WorkspaceI18n=Object.freeze({observe,setLocale,setDictionaries,getLocale:()=>locale});observe();
})();

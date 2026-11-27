(() => {
  'use strict';
  const i18n=globalThis.AtlasI18n;
  const selector='[data-atlas-i18n],[data-atlas-i18n-placeholder],[data-atlas-i18n-label],[data-atlas-i18n-content],[data-atlas-i18n-alt],[data-atlas-i18n-title]';
  function applyElement(element){
    const params={...element.dataset};
    const text=element.dataset.atlasI18n;
    if(text){
      const value=i18n.t(text,params);
      if(element.textContent!==value)element.textContent=value;
    }
    for(const [data,attribute] of [['atlasI18nPlaceholder','placeholder'],['atlasI18nLabel','aria-label'],['atlasI18nContent','content'],['atlasI18nAlt','alt'],['atlasI18nTitle','title']]){
      const key=element.dataset[data];
      if(key){
        const value=i18n.t(key,params);
        if(element.getAttribute(attribute)!==value)element.setAttribute(attribute,value);
      }
    }
  }
  function apply(root){
    if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
    if(root.matches?.(selector))applyElement(root);
    root.querySelectorAll(selector).forEach(applyElement);
  }
  function applyLanguage(){
    const locale=i18n.getLocale();
    document.documentElement.lang=locale;
    const ogLocale=document.querySelector('meta[property="og:locale"]');
    if(ogLocale)ogLocale.content=locale==='en'?'en_US':'hu_HU';
    document.querySelectorAll('[data-atlas-language]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.atlasLanguage===locale));
    });
    apply(document);
  }
  const headerLanguage=document.querySelector('#atlas-language'),dialog=document.querySelector('#atlas-detail');
  if(headerLanguage&&dialog){
    const dialogLanguage=headerLanguage.cloneNode(true);
    dialogLanguage.removeAttribute('id');
    dialogLanguage.classList.add('atlas-detail-language');
    dialog.insertBefore(dialogLanguage,document.querySelector('#atlas-detail-body'));
  }
  document.querySelectorAll('[data-atlas-language]').forEach(button=>{
    button.addEventListener('click',()=>i18n.setLocale(button.dataset.atlasLanguage));
  });
  i18n.onChange(applyLanguage);
  applyLanguage();
  const observer=new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes)apply(node);
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();

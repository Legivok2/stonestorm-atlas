/* Reviewed public DOM contracts. No API, item data or gameplay commands. */
(() => {
  'use strict';
  const tabs=(keys,names)=>keys.map((key,i)=>({key,name:names[i]}));
  const profiles=[
    {id:'community',name:'Közösség',kind:'community',selector:'.modal__dialog.panel.friends-modal'},
    {id:'home',name:'Otthon',kind:'home',selector:'.npc-modal__dialog.home-modal[data-tut-screen="home"]',legacy:'ssaHomeExpanded'},
    {id:'mining',name:'Tárnák',kind:'mining',path:'/mining',selector:'.mine-stage .stage-safe.mine-safe',window:'.stage-window.mine-window',panel:'.mine-window__body[role="tabpanel"]',tablist:'.mine-tabs',tabAttribute:'data-mine-tab',legacy:'ssaMiningMultiPanel',tabs:tabs(['mine','smelt','craft','master'],['Tárna','Olvasztó','Műhely','Gwangsu'])},
    {id:'alchemist',name:'Alkimista',kind:'hybrid',selector:'.npc-modal__dialog.alch[data-tut-screen="alchemist"],.npc-modal__dialog.alch[data-tut-screen="soul"]',tabs:tabs(['potions','recipes','soul'],['Főzetek','Receptek','Viharszív']),tablist:'.alch-tabs',panel:':scope > [role="tabpanel"]',cards:'.alch-bottle,.recipe-card,.ny-recipe,.soul-card'},
    {id:'seal',name:'Hármas Pecsét',kind:'hybrid',selector:'.npc-modal__dialog.auction.market-dialog[data-tut-screen="house"]',tabs:tabs(['buy','sell','reserve'],['Vásárlás','Eladás','Előjegyzés']),tablist:'.auction__tabs',tabAttribute:'data-house-tab',panel:':scope > [role="tabpanel"]',cards:'.auc-card,.mkt-block'},
    {id:'stable',name:'Istálló',kind:'stable',selector:'.npc-modal__dialog.stable[data-tut-screen="stable"]'},
    {id:'shop',name:'Bolt',kind:'hybrid',selector:'.npc-modal__dialog.shop[data-tut-screen="shop"]',tabs:tabs(['buy','daily','sell','wardrobe'],['Vásárlás','Napi kínálat','Eladás','Selyemszabó']),tablist:'.shop__tabs',panel:':scope > [role="tabpanel"]',cards:'.shop-row,.daily-card,.wardrobe-card'},
    {id:'fishing',name:'Horgászat',kind:'fishing',path:'/fishing',selector:'.fish-stage .stage-safe.fish-safe',window:'.stage-window.fish-window',panel:'.fish-window__body',tablist:'.fish-tabs',tabs:tabs(['pond','creel','log','gear','cup'],['Stég','Vödör','Halásznapló','Felszerelés','Verseny'])}
  ];
  function columns(width,count){return count===4?(width>=1500?4:width>=850?2:1):width>=1100?3:width>=750?2:1;}
  function clean(value){const screens={};for(const p of profiles)screens[p.id]=value?.screens?.[p.id]===true;return {schema:2,screens,fishing:{wide:value?.fishing?.wide===true,collapsed:value?.fishing?.collapsed===true}};}
  globalThis.StonestormEnhancedConfig=Object.freeze({profiles:Object.freeze(profiles),columns,clean,key:'ssaEnhancedUI.v2'});
})();

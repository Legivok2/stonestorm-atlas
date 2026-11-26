'use strict';

// Owns game-instance lifetime. Presentation and navigation remain in workspace.cjs.
// Repeated requests coalesce; a later request during a transition wins.
class WorkspaceModeManager {
  constructor({panels,initialMode='GAME',captureReturn,enterMining,leaveMining,createPanel,destroyPanel,onChange}) {
    this.panels=panels;
    this.mode=initialMode;
    this.desired=initialMode;
    this.previousGamePage=null;
    this.transitioning=false;
    this.disposed=false;
    this.epoch=0;
    this.transitions=0;
    this.retiring=new Set();
    this.hooks={captureReturn,enterMining,leaveMining,createPanel,destroyPanel,onChange};
    this.pending=null;
  }
  get primary(){return this.panels[0];}
  setMode(target) {
    if(!['GAME','MINING'].includes(target)||this.disposed)return Promise.resolve(false);
    this.desired=target;
    if(this.pending)return this.pending;
    this.pending=Promise.resolve().then(async()=>{
      while(!this.disposed&&this.mode!==this.desired) {
        const next=this.desired;
        this.transitioning=true;
        this.epoch++;
        this.hooks.onChange();
        try {
          if(next==='MINING') {
            this.previousGamePage=await this.hooks.captureReturn(this.primary);
            if(this.disposed)break;
            await this.hooks.enterMining(this.primary);
            if(this.disposed)break;
            while(this.panels.length<4)this.hooks.createPanel();
          } else {
            await this.closeSecondary();
            if(this.disposed)break;
            await this.hooks.leaveMining(this.primary,this.previousGamePage);
          }
          if(!this.disposed){this.mode=next;this.transitions++;}
        } catch(error) {
          // Failed expansion cannot strand hidden games or compact CSS in GAME.
          if(!this.disposed){await this.closeSecondary();await this.hooks.leaveMining(this.primary,null);this.mode=this.desired='GAME';}
          throw error;
        } finally {
          this.transitioning=false;
          if(!this.disposed)this.hooks.onChange();
        }
      }
      return !this.disposed;
    }).finally(()=>{this.pending=null;});
    return this.pending;
  }
  async closeSecondary() {
    const removed=this.panels.splice(1);
    await Promise.all(removed.map(async panel=>{
      this.retiring.add(panel);
      try{await this.hooks.destroyPanel(panel);}finally{this.retiring.delete(panel);}
    }));
  }
  dispose(){this.disposed=true;this.epoch++;}
}
module.exports={WorkspaceModeManager};

'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('workspace',Object.freeze({
  action:(action,index,value)=>ipcRenderer.invoke('workspace:action',{action,index,value}),
  subscribe:callback=>{ipcRenderer.on('workspace:state',(_event,state)=>callback(state));ipcRenderer.send('workspace:ready');}
}));

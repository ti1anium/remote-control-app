const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateData: (callback) => {
    ipcRenderer.on('update-devices', (event, ...args) => callback(...args));
  },
  createPair: (MAC) => {
    ipcRenderer.send("create-pair", MAC)
  },
  breakPair: (MAC) => {
    ipcRenderer.send("break-pair", MAC)
  },
  doAction: (MAC, action) => {
    ipcRenderer.send("do-action", MAC, action)
  }
});

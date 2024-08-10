const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dbOp', {
    createDb: async () => ipcRenderer.invoke('createDb'),
    selectAll: async () => ipcRenderer.invoke('selectAll'),
    insertData: async (memoText) => ipcRenderer.invoke('insertData', memoText),
    updateData: async (id, memoText) => ipcRenderer.invoke('updateData', id, memoText),
    deleteData: async (id) => ipcRenderer.invoke('deleteData', id),
});
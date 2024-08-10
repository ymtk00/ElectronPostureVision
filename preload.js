const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dbOp', {
    createDb: async () => ipcRenderer.invoke('createDb'),
    selectAll: async () => ipcRenderer.invoke('selectAll'),
    insertData: async (memoText, imageData) => ipcRenderer.invoke('insertData', memoText, imageData),
    updateData: async (id, memoText, imageData) => ipcRenderer.invoke('updateData', id, memoText, imageData),
    deleteData: async (id) => ipcRenderer.invoke('deleteData', id),
});
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  execCommand: (command) => ipcRenderer.invoke("exec:run", command),
});

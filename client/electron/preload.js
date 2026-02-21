const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  execCommand: (command) => ipcRenderer.invoke("exec:run", command),
  toggleOverlay: () => ipcRenderer.invoke("overlay:toggle"),
  resizeOverlay: (height) => ipcRenderer.invoke("overlay:resize", height),
});

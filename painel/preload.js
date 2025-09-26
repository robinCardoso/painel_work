const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // retorna { apiKey: string | null, source: string | null }
  getFirebaseConfig: async () => {
    return await ipcRenderer.invoke('get-firebase-config');
  },
  // backward-compat (opcional): retorna apenas a chave
  getFirebaseApiKey: async () => {
    const cfg = await ipcRenderer.invoke('get-firebase-config');
    return cfg?.apiKey ?? null;
  }
});

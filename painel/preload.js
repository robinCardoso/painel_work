const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // retorna { apiKey: string | null, projectId: string | null, source: string | null }
  getFirebaseConfig: async () => {
    return await ipcRenderer.invoke('get-firebase-config');
  },
  // backward-compat (opcional)
  getFirebaseApiKey: async () => {
    const cfg = await ipcRenderer.invoke('get-firebase-config');
    return cfg?.apiKey ?? null;
  },
  // novo: enviar log para o main process
  log: (level, message, meta) => {
    try {
      ipcRenderer.send('renderer-log', level, message, meta ?? null);
    } catch (e) {
      // ignore
    }
  },
  // novo: ler log completo (string)
  getDebugLog: async () => {
    try {
      return await ipcRenderer.invoke('get-debug-log');
    } catch (e) {
      return '';
    }
  }
});

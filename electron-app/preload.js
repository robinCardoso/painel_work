const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// Expõe um objeto 'api' seguro para a página web (renderer process).
// Este objeto NÃO tem acesso direto a 'fs' ou 'path'.
contextBridge.exposeInMainWorld('api', {
  // A única função exposta é 'getAssetPath'.
  // Ela envia uma mensagem ('get-asset-path') para o processo principal (main.js)
  // e retorna a resposta que ele enviar.
  getAssetPath: (assetName) => ipcRenderer.invoke('get-asset-path', assetName),

  getLocalAssetPath: (name) => {
    try {
      const p = path.join(__dirname, 'assets', name);
      if (fs.existsSync(p)) {
        // converte barras windows para forward-slash e prefixa file://
        const normalized = p.replace(/\\/g, '/');
        // garante três barras após file: em Windows (file:///C:/...)
        return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
});

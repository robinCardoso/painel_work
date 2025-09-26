const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// IPC handler para ler config de forma segura e retornar apiKey + source
ipcMain.handle('get-firebase-config', async () => {
	// raiz do app (mesmo diretório de main.js)
	const root = path.resolve(__dirname);
	const candidates = [
		{ file: path.join(root, 'credentials.json'), type: 'json' },
		{ file: path.join(root, 'config.tx'), type: 'text' },
		{ file: path.join(root, 'config.txt'), type: 'text' },
	];

	for (const c of candidates) {
		try {
			if (!fs.existsSync(c.file)) continue;
			const content = fs.readFileSync(c.file, 'utf8');
			let key = null;
			if (c.type === 'json') {
				try {
					const j = JSON.parse(content);
					key = j.apiKey || j.client_api_key || j.clientId || null;
				} catch (e) {
					console.warn('JSON parse error', c.file, e?.message);
				}
			} else {
				const m = content.match(/apiKey\s*[:=]\s*["']?([^"'\s]+)["']?/i);
				if (m && m[1]) key = m[1];
			}
			if (key) {
				console.info('Firebase apiKey lida de:', c.file);
				return { apiKey: key, source: path.basename(c.file) };
			} else {
				console.info('Arquivo encontrado sem apiKey válida:', c.file);
			}
		} catch (err) {
			console.warn('Erro ao processar arquivo', c.file, err?.message);
		}
	}

	// nada encontrado
	return { apiKey: null, source: null };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // garante preload
    }
  });

  // Carrega o build do Vite
  win.loadFile(path.resolve(__dirname, 'dist', 'index.html'));

  // DevTools opcional (remover para produção)
  win.webContents.openDevTools();

  // Limpa o cache apenas uma vez
  win.webContents.session.clearCache();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

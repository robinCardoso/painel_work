const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function sanitizeValue(v) {
  if (typeof v !== 'string') return v;
  return v.trim().replace(/^["']|["']$/g, '').replace(/[,\s;]+$/g, '');
}

function readApiKeyFromJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const j = JSON.parse(raw);
    // procura apiKey em várias chaves possíveis
    const candidates = [
      j.apiKey,
      j.client_api_key,
      j.clientId,
      j.web && j.web.apiKey,
      j.firebaseConfig && j.firebaseConfig.apiKey
    ];
    for (const c of candidates) {
      if (c) return sanitizeValue(c);
    }
    return null;
  } catch (err) {
    console.debug('readApiKeyFromJsonFile error for', path.basename(filePath), err?.message);
    return null;
  }
}

function readProjectIdFromJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const j = JSON.parse(raw);
    const candidates = [
      j.projectId,
      j.project_id,
      j.web && j.web.projectId,
      j.firebaseConfig && j.firebaseConfig.projectId
    ];
    for (const c of candidates) {
      if (c) return sanitizeValue(c);
    }
    return null;
  } catch (err) {
    console.debug('readProjectIdFromJsonFile error for', path.basename(filePath), err?.message);
    return null;
  }
}

// IPC handler: retorna a configuração do Firebase (prioriza credentials.json)
ipcMain.handle('get-firebase-config', async () => {
  const root = path.resolve(__dirname);
  const candidates = [
    { file: path.join(root, 'credentials.json'), type: 'json' },
    { file: path.join(root, 'config.tx'), type: 'text' },
    { file: path.join(root, 'config.txt'), type: 'text' },
  ];

  for (const c of candidates) {
    try {
      if (!fs.existsSync(c.file)) continue;
      const basename = path.basename(c.file);

      if (c.type === 'json') {
        const apiKey = readApiKeyFromJsonFile(c.file);
        const projectId = readProjectIdFromJsonFile(c.file);
        if (apiKey) {
          console.info('Firebase apiKey lida de:', basename);
          return { apiKey, projectId: projectId ?? null, source: basename };
        } else {
          // se arquivo JSON existe mas não contém apiKey válida, continue para próximos candidatos
          console.debug('Arquivo JSON sem apiKey válida:', basename);
          continue;
        }
      } else {
        const content = fs.readFileSync(c.file, 'utf8');
        const m = content.match(/apiKey\s*[:=]\s*["']?([^"'\r\n]+?)["']?(?:\s*,)?/i);
        const p = content.match(/projectId\s*[:=]\s*["']?([^"'\r\n]+?)["']?(?:\s*,)?/i);
        const apiKey = m && m[1] ? sanitizeValue(m[1]) : null;
        const projectId = p && p[1] ? sanitizeValue(p[1]) : null;
        if (apiKey) {
          console.info('Firebase apiKey lida de:', basename);
          return { apiKey, projectId: projectId ?? null, source: basename };
        } else {
          console.debug('Arquivo texto sem apiKey válida:', basename);
        }
      }
    } catch (err) {
      console.debug('Erro ao processar arquivo', path.basename(c.file), err?.message);
    }
  }

  console.info('Nenhuma apiKey encontrada entre os arquivos candidatos.');
  return { apiKey: null, projectId: null, source: null };
});

// novo: recebe logs do renderer e grava em debug.log no userData
ipcMain.on('renderer-log', (event, level = 'info', message = '', meta = null) => {
  try {
    const now = new Date().toISOString();
    const line = JSON.stringify({ t: now, level, message, meta }) + '\n';
    const file = path.join(app.getPath('userData'), 'debug.log');
    fs.appendFileSync(file, line, 'utf8');
    // também loga no console do main
    if (level === 'error') console.error('[renderer]', message, meta);
    else console.log('[renderer]', message, meta);
  } catch (e) {
    console.warn('renderer-log write error', e?.message);
  }
});

// permite ler o log completo (renderer chama via invoke)
ipcMain.handle('get-debug-log', async () => {
  try {
    const file = path.join(app.getPath('userData'), 'debug.log');
    if (!fs.existsSync(file)) return '';
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.warn('get-debug-log error', e?.message);
    return '';
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.resolve(__dirname, 'dist', 'index.html'));

  // DevTools pode ficar ligado em desenvolvimento; remova em produção
  // win.webContents.openDevTools();

  // Limpa o cache apenas uma vez
  win.webContents.session.clearCache();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

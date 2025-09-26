const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Adiciona um handler para resolver o caminho de um asset
ipcMain.handle('get-asset-path', (event, assetName) => {
  // Define o caminho base dependendo se o app está empacotado ou não
  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets') // Produção: dentro da pasta de recursos
    : path.join(__dirname, 'assets');             // Desenvolvimento: na pasta do projeto

  const assetPath = path.join(basePath, assetName);

  if (fs.existsSync(assetPath)) {
    return `file://${assetPath.replace(/\\/g, '/')}`;
  }
  return null;
});

function createWindow() {
	// obtém tamanho da área de trabalho disponível (exclui taskbar/dock)
	const workArea = screen.getPrimaryDisplay().workArea || { x: 0, y: 0, width: 1024, height: 768 };
	const { x, y, width, height } = workArea;

	// Cria a janela do navegador usando o tamanho disponível
	const win = new BrowserWindow({
		x: x,
		y: y,
		width: width,
		height: height,
		fullscreen: false,
		fullscreenable: true,
		resizable: true,
		autoHideMenuBar: false, // <-- ALTERADO: Mostra a barra de menu/título
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js') // <-- adiciona preload
		}
	});

	// garante que a janela ocupe toda a área disponível
	win.maximize();

	// Carrega o arquivo HTML principal.
	win.loadFile(path.join(__dirname, 'index.html'));
	// win.webContents.openDevTools(); // descomente para depuração
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

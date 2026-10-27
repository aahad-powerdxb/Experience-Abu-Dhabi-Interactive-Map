const { app, BrowserWindow, session } = require('electron');
const fs = require('fs');
const path = require('path');

// Read files once at startup to keep the main process fast
const cssContent = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, 'inject.js'), 'utf8');

function createWindow() {
  // 1. Block accessiBe
  session.defaultSession.webRequest.onBeforeRequest({
    urls: [
      '*://*.accessibe.com/*',
      '*://*.acsbap.com/*',
      '*://*.acsbapp.com/*'
    ]
  }, (details, callback) => {
    callback({ cancel: true }); 
  });

  const win = new BrowserWindow({
    fullscreen: true,
    kiosk: true, 
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true
    }
  });

  win.loadURL('https://visitabudhabi.ae/en/abu-dhabi-islands-watersports');
  
  win.webContents.on('did-finish-load', () => {
    // 2. THE VISUALLY PERFECT CSS
    win.webContents.insertCSS(cssContent);
    
    // 3. THE JS ENFORCER & PROXY
    win.webContents.executeJavaScript(jsContent);

    // OPEN DEVTOOLS IN A FLOATING WINDOW
    // win.webContents.openDevTools({ mode: 'detach' });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
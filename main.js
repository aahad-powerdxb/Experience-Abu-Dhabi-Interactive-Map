const { app, BrowserWindow, session } = require('electron');

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
  
  // OPEN DEVTOOLS
  win.webContents.openDevTools(); 

  win.webContents.on('did-finish-load', () => {
    
    // 2. THE VISUALLY PERFECT CSS
    win.webContents.insertCSS(`
      /* Eradicate clutter */
      header, footer, nav, video,
      [class*="header"], [class*="footer"], 
      .cookie-banner, .breadcrumb,
      [class*="chat"], iframe[src*="chat"] {
        display: none !important;
      }

      /* Lock body scroll */
      body, html {
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }

      /* Anchor the main React UI container */
      body div#marine-map-mapbox-container {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 999999 !important;
        background: transparent !important;
      }

      /* Force Map to stretch to bottom of monitor */
      body div#marine-map-mapbox-container div.mapboxgl-map {
        position: fixed !important; 
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important; 
        max-height: none !important;
        z-index: -1 !important; 
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* Shrink the Sidebar AND its dynamic Material-UI parent wrappers. */
      div:has(> .tabContentWrapper),
      div:has(> div > .tabContentWrapper) {
        max-height: 780px !important; 
        height: fit-content !important; 
        pointer-events: none !important; 
      }

      /* Style the actual visible sidebar */
      .tabContentWrapper {
        max-height: 780px !important; 
        height: fit-content !important; 
        overflow-y: auto !important; 
        border-radius: 16px !important; 
        box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important; 
        pointer-events: auto !important; 
      }

      /* VIP SAFE LIST: Re-arm popovers explicitly in CSS */
      .MuiPopover-paper, .MuiPopover-paper * {
        pointer-events: auto !important;
      }
      
      /* Clean scrollbar for kiosk aesthetic */
      .tabContentWrapper::-webkit-scrollbar {
        width: 6px;
      }
      .tabContentWrapper::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.2);
        border-radius: 10px;
      }
    `);

    // 3. THE JS ENFORCER
    win.webContents.executeJavaScript(`
      setInterval(() => {
        // --- A. MAPBOX RESIZE FIX ---
        const map = document.querySelector('.mapboxgl-map');
        if (map) {
          map.style.setProperty('min-height', '100vh', 'important');
          map.style.setProperty('height', '100vh', 'important');
          map.style.setProperty('position', 'fixed', 'important');
          window.dispatchEvent(new Event('resize'));
        }

        // --- B. THE PROVEN SHIELD DROP ---
        document.querySelectorAll('div').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width >= window.innerWidth * 0.95 && rect.height >= window.innerHeight * 0.95) {
            
            if (el.className && typeof el.className === 'string') {
              const cls = el.className;
              
              // Define what we MUST protect
              const isMapbox = cls.includes('mapbox');
              const isProtectedId = el.id === 'marine-map-mapbox-container' || el.id === 'root';
              
              // NEW: Protect MUI Backdrops so menus can close!
              const isMuiBackdrop = cls.includes('MuiPopover-root') || cls.includes('MuiBackdrop-root') || cls.includes('MuiModal-root');

              // If it's a rogue shield, disable it
              if (!isMapbox && !isProtectedId && !isMuiBackdrop) {
                el.style.setProperty('pointer-events', 'none', 'important');
              }
            }
          }
        });
        
        // --- C. ARM THE PANELS AND BACKDROPS ---
        // Explicitly re-arm the Popover backdrops so they catch the "Close" clicks
        document.querySelectorAll('.MuiPopover-root, .MuiBackdrop-root').forEach(backdrop => {
           backdrop.style.setProperty('pointer-events', 'auto', 'important');
           backdrop.style.setProperty('z-index', '9999', 'important');
        });

        // Ensure the location sidebar and popover menus are fully armed
        document.querySelectorAll('.detailPanelUpd, .MuiPopover-paper').forEach(panel => {
          panel.style.setProperty('pointer-events', 'auto', 'important');
          panel.style.setProperty('z-index', '99999', 'important');
          panel.querySelectorAll('*').forEach(c => {
            c.style.setProperty('pointer-events', 'auto', 'important');
          });
        });

      }, 500); // Runs continuously twice a second
    `);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
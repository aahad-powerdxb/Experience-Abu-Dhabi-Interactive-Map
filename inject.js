// --- A. THE MAPBOX TOUCH PROXY (Runs once immediately) ---
(function delayedInitiationProxy() {
  console.log("=== ⏳ DELAYED INITIATION PROXY (Zero Snap) ===");

  const style = document.createElement('style');
  style.innerHTML = '.mapboxgl-cooperative-gesture-screen { display: none !important; opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }';
  document.head.appendChild(style);

  const GHOST_ID = 8675309;
  const THRESHOLD = 5;
  const OFFSET = 10; 

  let state = 'IDLE'; 
  let startX = 0, startY = 0;
  let lastX = 0, lastY = 0;
  let pId = null;
  let tId = null;
  let realCount = 0;
  
  function getCanvas() { return document.querySelector('.mapboxgl-canvas'); }
  function isCanvas(e) { return e.target && e.target.classList && e.target.classList.contains('mapboxgl-canvas'); }

  const opts = { capture: true, passive: false };

  function firePointer(type, id, x, y, isPrimary) {
    const c = getCanvas(); if (!c) return;
    let ev = new PointerEvent(type, {
        bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch',
        clientX: x, clientY: y, screenX: x, screenY: y, isPrimary: isPrimary,
        button: 0, buttons: type.includes('up') ? 0 : 1
    });
    ev._isSynth = true; c.dispatchEvent(ev);
  }

  function fireTouch(type, touchesArr) {
    const c = getCanvas(); if (!c) return;
    const ts = touchesArr.map(t => new Touch({
        identifier: t.id, target: c, clientX: t.x, clientY: t.y, screenX: t.x, screenY: t.y, radiusX: 5, radiusY: 5, force: 1
    }));
    let ev = new TouchEvent(type, {
        bubbles: true, cancelable: true, 
        touches: type === 'touchend' ? [] : ts,
        targetTouches: type === 'touchend' ? [] : ts, 
        changedTouches: ts
    });
    ev._isSynth = true; c.dispatchEvent(ev);
  }

  window.addEventListener('pointerdown', e => {
    if (e._isSynth || !isCanvas(e) || e.pointerType !== 'touch') return;
    realCount++;
    
    if (realCount === 1) {
        state = 'PENDING_TAP';
        startX = e.clientX; startY = e.clientY; 
        lastX = startX; lastY = startY;
        pId = e.pointerId;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    } 
    else if (state === 'PENDING_TAP') {
        state = 'MULTI';
        firePointer('pointerdown', pId, startX, startY, true); 
        if (tId !== null) fireTouch('touchstart', [{id: tId, x: startX, y: startY}]);
    } 
    else if (state === 'DRAGGING') {
        state = 'MULTI';
        firePointer('pointerup', GHOST_ID, lastX + OFFSET, lastY + OFFSET, false);
        if (tId !== null) fireTouch('touchend', [{id: GHOST_ID, x: lastX + OFFSET, y: lastY + OFFSET}]);
    }
  }, opts);

  window.addEventListener('pointermove', e => {
    if (e._isSynth || !isCanvas(e) || e.pointerType !== 'touch') return;
    if (state === 'MULTI') return; 

    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    lastX = e.clientX; lastY = e.clientY;

    if (state === 'PENDING_TAP') {
        let dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (dist > THRESHOLD) {
          state = 'DRAGGING';
          firePointer('pointerdown', pId, e.clientX, e.clientY, true);
          firePointer('pointerdown', GHOST_ID, e.clientX + OFFSET, e.clientY + OFFSET, false);
          
          if (tId !== null) {
              fireTouch('touchstart', [
                {id: tId, x: e.clientX, y: e.clientY},
                {id: GHOST_ID, x: e.clientX + OFFSET, y: e.clientY + OFFSET}
              ]);
          }
        }
    } 
    
    if (state === 'DRAGGING') {
        firePointer('pointermove', pId, e.clientX, e.clientY, true);
        firePointer('pointermove', GHOST_ID, e.clientX + OFFSET, e.clientY + OFFSET, false);
    }
  }, opts);

  function handlePointerUp(e) {
    if (e._isSynth || !isCanvas(e) || e.pointerType !== 'touch') return;
    realCount--;
    
    if (state === 'PENDING_TAP') {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        firePointer('pointerdown', pId, startX, startY, true);
        firePointer('pointerup', pId, e.clientX, e.clientY, true);
        state = 'IDLE';
    } 
    else if (state === 'DRAGGING') {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        firePointer('pointerup', pId, e.clientX, e.clientY, true);
        firePointer('pointerup', GHOST_ID, e.clientX + OFFSET, e.clientY + OFFSET, false);
        state = 'IDLE';
    }
    
    if (realCount <= 0) {
        realCount = 0;
        state = 'IDLE';
    }
  }
  window.addEventListener('pointerup', handlePointerUp, opts);
  window.addEventListener('pointercancel', handlePointerUp, opts);

  window.addEventListener('touchstart', e => {
    if (e._isSynth || !isCanvas(e)) return;
    if (state === 'PENDING_TAP') {
        tId = e.touches[0].identifier; 
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }
  }, opts);

  window.addEventListener('touchmove', e => {
    if (e._isSynth || !isCanvas(e) || state === 'MULTI') return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    
    if (state === 'DRAGGING') {
        let curX = e.touches[0].clientX, curY = e.touches[0].clientY;
        fireTouch('touchmove', [
          {id: tId, x: curX, y: curY},
          {id: GHOST_ID, x: curX + OFFSET, y: curY + OFFSET}
        ]);
    }
  }, opts);

  function handleTouchEnd(e) {
    if (e._isSynth || !isCanvas(e)) return;
    if (state === 'PENDING_TAP') {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        fireTouch('touchstart', [{id: tId, x: startX, y: startY}]);
        fireTouch('touchend', [{id: tId, x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY}]);
    } else if (state === 'DRAGGING') {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        let curX = e.changedTouches[0].clientX, curY = e.changedTouches[0].clientY;
        fireTouch('touchend', [
            {id: tId, x: curX, y: curY},
            {id: GHOST_ID, x: curX + OFFSET, y: curY + OFFSET}
        ]);
    }
  }
  window.addEventListener('touchend', handleTouchEnd, opts);
  window.addEventListener('touchcancel', handleTouchEnd, opts);
})();

// --- B. THE JS ENFORCER (Runs continuously) ---
setInterval(() => {
  // --- MAPBOX RESIZE FIX ---
  const map = document.querySelector('.mapboxgl-map');
  if (map) {
    map.style.setProperty('min-height', '100vh', 'important');
    map.style.setProperty('height', '100vh', 'important');
    map.style.setProperty('position', 'fixed', 'important');
    window.dispatchEvent(new Event('resize'));
  }

  // --- THE PROVEN SHIELD DROP ---
  document.querySelectorAll('div').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width >= window.innerWidth * 0.95 && rect.height >= window.innerHeight * 0.95) {
      if (el.className && typeof el.className === 'string') {
        const cls = el.className;
        const isMapbox = cls.includes('mapbox');
        const isProtectedId = el.id === 'marine-map-mapbox-container' || el.id === 'root';
        const isMuiBackdrop = cls.includes('MuiPopover-root') || cls.includes('MuiBackdrop-root') || cls.includes('MuiModal-root');

        if (!isMapbox && !isProtectedId && !isMuiBackdrop) {
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      }
    }
  });
  
  // --- ARM THE PANELS AND BACKDROPS ---
  document.querySelectorAll('.MuiPopover-root, .MuiBackdrop-root').forEach(backdrop => {
      backdrop.style.setProperty('pointer-events', 'auto', 'important');
      backdrop.style.setProperty('z-index', '9999', 'important');
  });

  document.querySelectorAll('.detailPanelUpd, .MuiPopover-paper').forEach(panel => {
    panel.style.setProperty('pointer-events', 'auto', 'important');
    panel.style.setProperty('z-index', '99999', 'important');
    panel.querySelectorAll('*').forEach(c => {
      c.style.setProperty('pointer-events', 'auto', 'important');
    });
  });

}, 500);
// ========================================
// TypeBot – Floating Panel (Content Script)
// Draggable, stealth-capable in-page panel.
// Injected programmatically by popup.
// ========================================

(() => {
  // Prevent double-injection
  if (document.querySelector('#typebot-root')) return;

  // -------------------------------------------------------
  // Create Shadow DOM container (isolates styles)
  // -------------------------------------------------------
  const host = document.createElement('div');
  host.id = 'typebot-root';
  host.style.cssText = 'all:initial; position:fixed; z-index:2147483647; top:20px; right:20px; font-family:system-ui,sans-serif;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // -------------------------------------------------------
  // Panel HTML
  // -------------------------------------------------------
  const panel = document.createElement('div');
  panel.className = 'tb-panel';
  panel.innerHTML = `
    <div class="tb-header" id="tbHeader">
      <div class="tb-logo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
        </svg>
        <span>TypeBot</span>
      </div>
      <div class="tb-header-btns">
        <button class="tb-icon-btn" id="tbStealth" title="Stealth Mode (Alt+Shift+H)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <button class="tb-icon-btn" id="tbMinimize" title="Minimize">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="tb-icon-btn tb-close-btn" id="tbClose" title="Exit / Remove Panel" style="color: #fc5c65;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <div class="tb-body" id="tbBody">
      <div class="tb-status">
        <div class="tb-dot" id="tbDot"></div>
        <span id="tbStatus">Ready</span>
      </div>

      <div class="tb-field">
        <label>WPM</label>
        <input type="number" id="tbWpm" min="1" max="500" value="60" />
      </div>

      <div class="tb-field">
        <label>Platform</label>
        <select id="tbPlatform">
          <option value="generic" selected>Generic / Custom</option>
          <option value="monkeytype">MonkeyType</option>
          <option value="typeracer">TypeRacer</option>
          <option value="10fastfingers">10FastFingers</option>
          <option value="keybr">Keybr</option>
          <option value="nitrotype">NitroType</option>
        </select>
      </div>

      <div class="tb-field" id="tbGenericTextContainer" style="display:flex; flex-direction:column; align-items:stretch; gap:4px;">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <label style="margin:0;">Text to Type (Copy-Paste here)</label>
          <button id="tbDetectBtn" style="background:rgba(99,179,237,0.1); border:none; color:#63b3ed; font-size:10px; cursor:pointer; padding:2px 6px; border-radius:4px; font-family:inherit; transition:background 0.15s;">🪄 Auto-Detect</button>
        </div>
        <textarea id="tbCustomText" placeholder="Paste target passage here or click Auto-Detect..." style="width:100%; height:60px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#e8ecf4; font-size:11px; padding:6px; outline:none; resize:none; font-family:inherit;"></textarea>
      </div>

      <div class="tb-controls" id="tbControlContainer" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
        <button class="tb-btn tb-btn-start" id="tbStart">▶ Start</button>
        <button class="tb-btn tb-btn-stop" id="tbStop" disabled>■ Stop</button>
        <button class="tb-btn tb-btn-reset" id="tbReset" style="display: none;">⏹ End</button>
      </div>

      <div class="tb-stats">
        <div class="tb-stat"><span class="tb-stat-num" id="tbChars">0</span><span class="tb-stat-lbl">chars</span></div>
        <div class="tb-stat"><span class="tb-stat-num" id="tbWords">0</span><span class="tb-stat-lbl">words</span></div>
        <div class="tb-stat"><span class="tb-stat-num" id="tbTime">0s</span><span class="tb-stat-lbl">time</span></div>
      </div>

      <div class="tb-hint">Alt+Shift+H to toggle stealth</div>
    </div>
  `;
  shadow.appendChild(panel);

  const restoreTrigger = document.createElement('div');
  restoreTrigger.className = 'tb-restore-trigger';
  restoreTrigger.id = 'tbRestore';
  restoreTrigger.title = 'Show TypeBot (Alt+Shift+H)';
  shadow.appendChild(restoreTrigger);

  // -------------------------------------------------------
  // Styles (inside shadow DOM)
  // -------------------------------------------------------
  const style = document.createElement('style');
  style.textContent = `
    * { margin:0; padding:0; box-sizing:border-box; }

    .tb-panel {
      width: 220px;
      background: rgba(13,15,20,0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      color: #e8ecf4;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 13px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
      overflow: hidden;
      user-select: none;
      transition: opacity 0.2s, transform 0.2s;
    }

    .tb-panel.minimized .tb-body { display: none; }
    .tb-panel.minimized { width: auto; border-radius: 10px; }

    .tb-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      cursor: grab;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .tb-header:active { cursor: grabbing; }

    .tb-logo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 13px;
      color: #63b3ed;
    }

    .tb-header-btns {
      display: flex;
      gap: 4px;
    }

    .tb-icon-btn {
      width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      color: #8b95a8;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tb-icon-btn:hover { background: rgba(255,255,255,0.1); color: #e8ecf4; }
    .tb-icon-btn.active { color: #63b3ed; background: rgba(99,179,237,0.12); border-color: rgba(99,179,237,0.3); }
    .tb-close-btn:hover { background: rgba(252,92,101,0.15) !important; color: #fc5c65 !important; border-color: rgba(252,92,101,0.3) !important; }

    .tb-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

    .tb-status {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 10px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      font-size: 12px; color: #8b95a8;
    }

    .tb-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #5a6478;
      transition: all 0.2s;
    }
    .tb-dot.running {
      background: #26de81;
      box-shadow: 0 0 6px rgba(38,222,129,0.5);
      animation: tb-pulse 1.5s ease-in-out infinite;
    }
    .tb-dot.error { background: #fc5c65; box-shadow: 0 0 6px rgba(252,92,101,0.5); }

    @keyframes tb-pulse {
      0%,100% { opacity:1; } 50% { opacity:0.5; }
    }

    .tb-field {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .tb-field label {
      font-size: 11px; font-weight: 600; color: #8b95a8;
      text-transform: uppercase; letter-spacing: 0.5px;
      flex-shrink: 0;
    }
    .tb-field input, .tb-field select {
      flex: 1;
      padding: 6px 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      color: #e8ecf4; font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s;
      -webkit-appearance: none;
    }
    .tb-field input:focus, .tb-field select:focus {
      border-color: rgba(99,179,237,0.4);
    }
    .tb-field input { width: 60px; text-align: center; font-weight: 600; }
    .tb-field select { cursor: pointer; }
    .tb-field select option { background: #161921; }
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }
    input[type=number] { -moz-appearance: textfield; }

    .tb-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

    .tb-btn {
      padding: 8px; border: none; border-radius: 7px;
      font-size: 12px; font-weight: 600; font-family: inherit;
      cursor: pointer; transition: all 0.15s;
    }
    .tb-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .tb-btn:active:not(:disabled) { transform: scale(0.96); }

    .tb-btn-start {
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff;
    }
    .tb-btn-start:hover:not(:disabled) { box-shadow: 0 2px 12px rgba(37,99,235,0.4); }

    .tb-btn-stop {
      background: rgba(252,92,101,0.1);
      color: #fc5c65;
      border: 1px solid rgba(252,92,101,0.2);
    }
    .tb-btn-stop:hover:not(:disabled) { background: rgba(252,92,101,0.18); }

    .tb-btn-reset {
      background: rgba(252,92,101,0.1);
      color: #fc5c65;
      border: 1px solid rgba(252,92,101,0.2);
    }
    .tb-btn-reset:hover:not(:disabled) { background: rgba(252,92,101,0.18); }

    .tb-stats {
      display: flex; justify-content: space-around;
      padding: 8px 0;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .tb-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .tb-stat-num { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .tb-stat-lbl { font-size: 9px; color: #5a6478; text-transform: uppercase; letter-spacing: 0.5px; }

    .tb-hint {
      text-align: center;
      font-size: 10px;
      color: #3a4050;
      letter-spacing: 0.3px;
    }

    .tb-restore-trigger {
      position: fixed;
      top: 0;
      right: 0;
      width: 8px;
      height: 8px;
      background: #63b3ed;
      border-bottom-left-radius: 100%;
      opacity: 0.05;
      cursor: pointer;
      z-index: 2147483647;
      transition: opacity 0.2s, width 0.2s, height 0.2s;
      display: none;
      pointer-events: auto;
    }
    .tb-restore-trigger:hover {
      opacity: 0.8;
      width: 24px;
      height: 24px;
      box-shadow: 0 0 10px rgba(99, 179, 237, 0.5);
    }
    #tbDetectBtn:hover {
      background: rgba(99,179,237,0.2) !important;
    }
  `;
  shadow.appendChild(style);

  // -------------------------------------------------------
  // DOM references (inside shadow)
  // -------------------------------------------------------
  const $ = (sel) => shadow.querySelector(sel);
  const header    = $('#tbHeader');
  const body      = $('#tbBody');
  const dot       = $('#tbDot');
  const statusEl  = $('#tbStatus');
  const wpmInput  = $('#tbWpm');
  const platform  = $('#tbPlatform');
  const startBtn  = $('#tbStart');
  const stopBtn   = $('#tbStop');
  const charsEl   = $('#tbChars');
  const wordsEl   = $('#tbWords');
  const timeEl    = $('#tbTime');
  const stealthBtn = $('#tbStealth');
  const minimizeBtn = $('#tbMinimize');
  const closeBtn    = $('#tbClose');
  const genericTextContainer = $('#tbGenericTextContainer');
  const customTextarea = $('#tbCustomText');
  const detectBtn      = $('#tbDetectBtn');
  const controlContainer = $('#tbControlContainer');
  const resetBtn        = $('#tbReset');

  let isRunning = false;
  let startTime = null;
  let accumulatedTime = 0;
  let statsInterval = null;
  let stealthMode = false;
  let lastFocusedInput = null;

  // Track user's cursor focus on the page
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      // Skip if the user is focusing the panel's own textarea
      if (el === customTextarea) return;
      lastFocusedInput = el;
    }
  }, true);

  document.addEventListener('mousedown', (e) => {
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
      if (el === customTextarea) return;
      lastFocusedInput = el;
    }
  }, true);

  function autoDetectText() {
    const selectors = [
      '.typing-text', '.passage-text', '#passage', '#source-text', 
      '.text-to-type', '.text-display', '#text-display', '.test-text',
      '#words', '.word', '#row1', '.TextInput-textLine', '.dash-letter',
      '.inputPanel .lead', '.desc', 'p', 'article'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 30) {
        if (el.querySelectorAll('.word').length > 0) {
          return Array.from(el.querySelectorAll('.word'))
            .map(w => {
              const letters = w.querySelectorAll('letter');
              if (letters.length > 0) {
                return Array.from(letters).map(l => l.textContent).join('');
              }
              return w.textContent.trim();
            })
            .join(' ');
        }
        if (el.querySelectorAll('letter').length > 0) {
          return Array.from(el.querySelectorAll('letter')).map(l => l.textContent).join('');
        }
        return el.textContent.trim().replace(/\s+/g, ' ');
      }
    }
    
    const candidates = [];
    const elements = Array.from(document.querySelectorAll('p, div, span, pre, td, article'));
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'nav', 'footer', 'header', 'button', 'input', 'textarea', 'select'].includes(tag)) {
        continue;
      }

      // Direct text nodes matching (excludes nested markup text)
      let directText = '';
      for (const child of el.childNodes) {
        if (child.nodeType === 3) { // TEXT_NODE
          directText += child.textContent;
        }
      }
      directText = directText.trim().replace(/\s+/g, ' ');

      if (directText.length > 40 && directText.length < 2000) {
        candidates.push({ text: directText, score: directText.length });
      } else {
        const inner = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
        if (inner.length > 50 && inner.length < 2000) {
          const childCount = el.querySelectorAll('*').length;
          if (childCount < 6) { // Penalize deep nesting
            candidates.push({ text: inner, score: inner.length - (childCount * 50) });
          }
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].text;
    }
    return '';
  }

  // -------------------------------------------------------
  // Dragging
  // -------------------------------------------------------
  let isDragging = false;
  let dragOffsetX = 0, dragOffsetY = 0;

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('.tb-icon-btn')) return;
    isDragging = true;
    const rect = host.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffsetX));
    const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffsetY));
    host.style.left = x + 'px';
    host.style.top = y + 'px';
    host.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  // -------------------------------------------------------
  // Minimize
  // -------------------------------------------------------
  minimizeBtn.addEventListener('click', () => {
    panel.classList.toggle('minimized');
  });

  // -------------------------------------------------------
  // Close / Exit Panel
  // -------------------------------------------------------
  closeBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stop' }, () => {
      stopStatsPolling();
      restoreTrigger.remove();
      host.remove();
    });
  });

  // -------------------------------------------------------
  // Stealth Mode — hides entire panel
  // -------------------------------------------------------
  function toggleStealth() {
    stealthMode = !stealthMode;
    if (stealthMode) {
      panel.style.opacity = '0';
      panel.style.pointerEvents = 'none';
      restoreTrigger.style.display = 'block';
      stealthBtn.classList.add('active');
    } else {
      panel.style.opacity = '1';
      panel.style.pointerEvents = 'auto';
      restoreTrigger.style.display = 'none';
      stealthBtn.classList.remove('active');
    }
  }

  stealthBtn.addEventListener('click', toggleStealth);
  restoreTrigger.addEventListener('click', toggleStealth);

  // Global keyboard shortcut: Alt+Shift+H
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.code === 'KeyH') {
      e.preventDefault();
      e.stopPropagation();
      toggleStealth();
    }
  }, true);

  // Prevent keyboard events inside the panel from bubbling up to the main page
  // (This stops sites like Monkeytype from intercepting inputs typed in the panel)
  panel.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.code === 'KeyH') return;
    e.stopPropagation();
  }, { capture: true });

  panel.addEventListener('keyup', (e) => {
    if (e.altKey && e.shiftKey && e.code === 'KeyH') return;
    e.stopPropagation();
  }, { capture: true });

  panel.addEventListener('keypress', (e) => {
    e.stopPropagation();
  }, { capture: true });

  // -------------------------------------------------------
  // Controls
  // -------------------------------------------------------
  function setRunning(running) {
    isRunning = running;

    if (running) {
      startBtn.disabled = true;
      startBtn.textContent = '▶ Resume';
      stopBtn.disabled = false;
      stopBtn.textContent = '■ Stop';
      wpmInput.disabled = true;
      platform.disabled = true;
      dot.className = 'tb-dot running';
      statusEl.textContent = 'Typing…';
      startTime = Date.now();
      startStatsPolling();
    } else {
      wpmInput.disabled = false;
      platform.disabled = false;
      dot.className = 'tb-dot';
      if (startTime) {
        accumulatedTime += Math.floor((Date.now() - startTime) / 1000);
        startTime = null;
      }
      
      // Determine if there is progress to resume
      const hasProgress = charsEl.textContent !== '0' && statusEl.textContent !== 'Ready';
      if (hasProgress) {
        startBtn.textContent = '▶ Resume';
        startBtn.disabled = false;
        stopBtn.textContent = '↺ Restart';
        stopBtn.disabled = false;
      } else {
        startBtn.textContent = '▶ Start';
        startBtn.disabled = false;
        stopBtn.textContent = '■ Stop';
        stopBtn.disabled = true;
      }
      
      stopStatsPolling();
    }
  }

  function startStatsPolling() {
    stopStatsPolling();
    statsInterval = setInterval(() => {
      if (startTime) {
        const secs = accumulatedTime + Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(secs / 60);
        timeEl.textContent = mins > 0 ? `${mins}m${secs % 60}s` : `${secs}s`;
      }
      chrome.runtime.sendMessage({ action: 'getStats' }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        charsEl.textContent = res.stats.chars;
        wordsEl.textContent = Math.round(res.stats.chars / 5);
        if (res.stats.done || !res.isRunning) {
          if (res.stats.done) {
            accumulatedTime = 0; // Reset accumulated timer on completion
          }
          setRunning(false);
          statusEl.textContent = res.stats.done
            ? `Done – ${Math.round(res.stats.chars / 5)} words`
            : 'Stopped';
        }
      });
    }, 1000);
  }

  function stopStatsPolling() {
    if (statsInterval) { clearInterval(statsInterval); statsInterval = null; }
  }

  // Handle Platform Change
  platform.addEventListener('change', () => {
    if (platform.value !== 'monkeytype') {
      genericTextContainer.style.display = 'flex';
    } else {
      genericTextContainer.style.display = 'none';
    }
  });

  // Manual Auto-Detect button listener
  detectBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const detected = autoDetectText();
    if (detected) {
      customTextarea.value = detected;
      statusEl.textContent = 'Auto-detected text!';
    } else {
      statusEl.textContent = 'No text detected';
    }
  });

  startBtn.addEventListener('click', () => {
    const wpm = parseInt(wpmInput.value, 10) || 60;
    
    const isResuming = startBtn.textContent === '▶ Resume';
    if (!isResuming) {
      charsEl.textContent = '0';
      wordsEl.textContent = '0';
      timeEl.textContent = '0s';
      accumulatedTime = 0;
    }

    // Tag the user's selected input so background script knows where they placed the cursor
    if (lastFocusedInput) {
      lastFocusedInput.setAttribute('data-typebot-target', 'true');
    }

    chrome.runtime.sendMessage({
      action: 'start',
      wpm,
      platform: platform.value,
      customText: platform.value !== 'monkeytype' ? customTextarea.value : undefined,
      tabId: undefined, // background will use sender tab
    }, (res) => {
      if (chrome.runtime.lastError) {
        dot.className = 'tb-dot error';
        statusEl.textContent = 'Error';
        return;
      }
      if (res?.success) setRunning(true);
      else {
        dot.className = 'tb-dot error';
        statusEl.textContent = res?.error || 'Failed';
      }
    });
  });

  stopBtn.addEventListener('click', () => {
    if (stopBtn.textContent === '↺ Restart') {
      // Clear metrics for a fresh start
      charsEl.textContent = '0';
      wordsEl.textContent = '0';
      timeEl.textContent = '0s';
      accumulatedTime = 0;

      if (lastFocusedInput) {
        lastFocusedInput.setAttribute('data-typebot-target', 'true');
      }

      const wpm = parseInt(wpmInput.value, 10) || 60;
      chrome.runtime.sendMessage({
        action: 'start',
        wpm,
        platform: platform.value,
        customText: platform.value !== 'monkeytype' ? customTextarea.value : undefined,
        tabId: undefined,
        forceNewSession: true, // Bypass resume check in background
      }, (res) => {
        if (chrome.runtime.lastError) return;
        if (res?.success) setRunning(true);
      });
    } else {
      chrome.runtime.sendMessage({ action: 'stop' }, () => {
        setRunning(false);
        statusEl.textContent = 'Stopped';
      });
    }
  });

  resetBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'resetSession' }, () => {
      charsEl.textContent = '0';
      wordsEl.textContent = '0';
      timeEl.textContent = '0s';
      accumulatedTime = 0;
      statusEl.textContent = 'Ready';
      setRunning(false);
    });
  });

  // Listen for state updates from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'stateUpdate') {
      charsEl.textContent = msg.stats.chars;
      wordsEl.textContent = msg.stats.words;
      if (msg.stats.done || !msg.isRunning) {
        setRunning(false);
        statusEl.textContent = msg.stats.done
          ? `Done – ${msg.stats.words} words`
          : 'Stopped';
      }
    }
  });

  // Check if already running
  chrome.runtime.sendMessage({ action: 'getStats' }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    if (res.isRunning) setRunning(true);
  });

  console.log('[TypeBot] Floating panel injected ✓');
})();

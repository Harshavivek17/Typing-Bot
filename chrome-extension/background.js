// ========================================
// TypeBot – Background Service Worker
// Uses Chrome DevTools Protocol (CDP) to
// send TRUSTED key events.
// ========================================

let state = {
  isRunning: false,
  tabId: null,
  debuggerAttached: false,
  currentIndex: 0,
  currentRunId: null,
  stats: { chars: 0, words: 0, done: false },
  config: { wpm: 60, delay: 200, platform: 'monkeytype' },
};

// -------------------------------------------------------
// CDP Key Dispatch
// -------------------------------------------------------
function getKeyInfo(char) {
  const info = { key: char, code: '', keyCode: char.charCodeAt(0) };

  if (char === ' ') {
    info.code = 'Space'; info.keyCode = 32;
  } else if (char >= 'a' && char <= 'z') {
    info.code = 'Key' + char.toUpperCase();
    info.keyCode = char.toUpperCase().charCodeAt(0);
  } else if (char >= 'A' && char <= 'Z') {
    info.code = 'Key' + char.toUpperCase();
    info.keyCode = char.charCodeAt(0);
  } else if (char >= '0' && char <= '9') {
    info.code = 'Digit' + char;
    info.keyCode = char.charCodeAt(0);
  } else {
    const specialMap = {
      '.': { code: 'Period', keyCode: 190 },
      ',': { code: 'Comma', keyCode: 188 },
      '/': { code: 'Slash', keyCode: 191 },
      ';': { code: 'Semicolon', keyCode: 186 },
      "'": { code: 'Quote', keyCode: 222 },
      '-': { code: 'Minus', keyCode: 189 },
      '=': { code: 'Equal', keyCode: 187 },
      '`': { code: 'Backquote', keyCode: 192 },
      '[': { code: 'BracketLeft', keyCode: 219 },
      ']': { code: 'BracketRight', keyCode: 221 },
      '\\': { code: 'Backslash', keyCode: 220 },
      '!': { code: 'Digit1', keyCode: 49 },
      '@': { code: 'Digit2', keyCode: 50 },
      '#': { code: 'Digit3', keyCode: 51 },
      '$': { code: 'Digit4', keyCode: 52 },
      '%': { code: 'Digit5', keyCode: 53 },
      '^': { code: 'Digit6', keyCode: 54 },
      '&': { code: 'Digit7', keyCode: 55 },
      '*': { code: 'Digit8', keyCode: 56 },
      '(': { code: 'Digit9', keyCode: 57 },
      ')': { code: 'Digit0', keyCode: 48 },
      '_': { code: 'Minus', keyCode: 189 },
      '+': { code: 'Equal', keyCode: 187 },
      '{': { code: 'BracketLeft', keyCode: 219 },
      '}': { code: 'BracketRight', keyCode: 221 },
      '|': { code: 'Backslash', keyCode: 220 },
      ':': { code: 'Semicolon', keyCode: 186 },
      '"': { code: 'Quote', keyCode: 222 },
      '<': { code: 'Comma', keyCode: 188 },
      '>': { code: 'Period', keyCode: 190 },
      '?': { code: 'Slash', keyCode: 191 },
      '~': { code: 'Backquote', keyCode: 192 },
    };
    const mapped = specialMap[char];
    if (mapped) { info.code = mapped.code; info.keyCode = mapped.keyCode; }
    else { info.code = ''; info.keyCode = char.charCodeAt(0); }
  }
  return info;
}

async function sendKey(tabId, char) {
  // Handle Backspace specially
  if (char === 'Backspace') {
    try {
      await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
        type: 'rawKeyDown', key: 'Backspace', code: 'Backspace',
        windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8,
      });
      await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
        type: 'keyUp', key: 'Backspace', code: 'Backspace',
        windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8,
      });
    } catch (err) { console.error('[TypeBot] Backspace error:', err); }
    return;
  }

  const info = getKeyInfo(char);
  const needsShift = (char >= 'A' && char <= 'Z') || '~!@#$%^&*()_+{}|:"<>?'.includes(char);
  const modifiers = needsShift ? 8 : 0;

  try {
    // rawKeyDown — does NOT produce text input (prevents double-typing)
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: info.key, code: info.code,
      windowsVirtualKeyCode: info.keyCode, nativeVirtualKeyCode: info.keyCode,
      modifiers,
    });

    // char — ONLY event that produces text input
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
      type: 'char',
      text: char, unmodifiedText: char,
      windowsVirtualKeyCode: info.keyCode, nativeVirtualKeyCode: info.keyCode,
      modifiers,
    });

    // keyUp
    await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: info.key, code: info.code,
      windowsVirtualKeyCode: info.keyCode, nativeVirtualKeyCode: info.keyCode,
      modifiers,
    });
  } catch (err) {
    console.error('[TypeBot] sendKey error:', err);
  }
}

// -------------------------------------------------------
// DOM readers
// -------------------------------------------------------
async function readActiveWord(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const activeWord = document.querySelector('#words .word.active');
        if (!activeWord) return null;
        const letters = Array.from(activeWord.querySelectorAll('letter'));
        const allChars = letters.map(l => l.textContent);
        let typedCount = 0;
        for (const letter of letters) {
          if (letter.classList.contains('correct')) typedCount++;
          else break;
        }
        return {
          fullWord: allChars.join(''),
          allChars,
          typedCount,
          totalLetters: letters.length,
          remainingChars: allChars.slice(typedCount),
        };
      },
    });
    return results?.[0]?.result || null;
  } catch (err) { return null; }
}

async function waitForWordChange(tabId, previousWord, maxWaitMs = 1000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const current = await readActiveWord(tabId);
    if (current && current.fullWord !== previousWord) return current;
    if (await isTestFinished(tabId)) return null;
    await sleep(30);
  }
  return await readActiveWord(tabId);
}

async function isTestFinished(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const result = document.querySelector('#result');
        if (!result) return false;
        const style = window.getComputedStyle(result);
        return style.display !== 'none' && result.getBoundingClientRect().height > 0;
      },
    });
    return results?.[0]?.result || false;
  } catch { return false; }
}

// Robust focus — clicks multiple elements and verifies focus
async function focusTypingArea(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Click the words area to dismiss any overlay
        const words = document.querySelector('#words');
        if (words) words.click();

        // Click the typing test container
        const typingTest = document.querySelector('#typingTest');
        if (typingTest) typingTest.click();

        // Focus the hidden input
        const wordsInput = document.querySelector('#wordsInput');
        if (wordsInput) {
          wordsInput.focus();
          wordsInput.click();
          wordsInput.focus();
        }
      },
    });
  } catch (err) { console.error('[TypeBot] focusTypingArea error:', err); }
}

// Verify focus is on the input and words aren't blurred
async function verifyFocus(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const wordsInput = document.querySelector('#wordsInput');
        const words = document.querySelector('#words');
        const isFocused = document.activeElement === wordsInput;
        const isBlurred = words ? words.classList.contains('blurred') : true;
        return { isFocused, isBlurred };
      },
    });
    return results?.[0]?.result || { isFocused: false, isBlurred: true };
  } catch { return { isFocused: false, isBlurred: true }; }
}

async function verifyLetterState(tabId, letterIndex) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (idx) => {
        const activeWord = document.querySelector('#words .word.active');
        if (!activeWord) return { wordGone: true };
        const letters = Array.from(activeWord.querySelectorAll('letter'));
        if (idx >= letters.length) return { outOfBounds: true };
        const letter = letters[idx];
        return {
          text: letter.textContent,
          isCorrect: letter.classList.contains('correct'),
          isIncorrect: letter.classList.contains('incorrect'),
          className: letter.getAttribute('class') || '',
        };
      },
      args: [letterIndex],
    });
    return results?.[0]?.result || null;
  } catch { return null; }
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
function humanize(baseDelay) {
  const jitter = baseDelay * 0.12;
  return Math.max(20, baseDelay + (Math.random() * 2 - 1) * jitter);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Broadcast state to floating panel (throttled to prevent message flooding)
let _lastBroadcast = 0;
function broadcastState(force = false) {
  if (!state.tabId) return;
  const now = Date.now();
  if (!force && now - _lastBroadcast < 500) return;
  _lastBroadcast = now;
  try {
    chrome.tabs.sendMessage(state.tabId, {
      action: 'stateUpdate',
      stats: state.stats,
      isRunning: state.isRunning,
    }).catch(() => {});
  } catch {}
}

// -------------------------------------------------------
// Generic typing loop (works for any textarea/input-based platform)
// -------------------------------------------------------
async function typingLoopGeneric(runId) {
  const { tabId, config } = state;
  const { delay, customText } = config;

  // 1. Focus the input/textarea on the page
  await focusGenericInput(tabId);
  if (runId !== state.currentRunId || !state.isRunning) {
    if (runId === state.currentRunId) await detachDebugger();
    return;
  }
  await sleep(400);
  if (runId !== state.currentRunId || !state.isRunning) {
    if (runId === state.currentRunId) await detachDebugger();
    return;
  }

  // 2. Get the text to type
  let text = customText || '';
  if (!text) {
    text = await scrapePageText(tabId);
    state.config.customText = text;
  }
  if (runId !== state.currentRunId || !state.isRunning) {
    if (runId === state.currentRunId) await detachDebugger();
    return;
  }

  if (!text) {
    console.error('[TypeBot] No text to type found');
    state.stats.done = true;
    state.isRunning = false;
    broadcastState(true);
    if (runId === state.currentRunId) await detachDebugger();
    return;
  }

  const startIndex = state.currentIndex || 0;
  console.log(`[TypeBot] Generic typing started/resumed at index ${startIndex}. Text length: ${text.length}`);

  const typingStartTime = Date.now();
  const initialChars = state.stats.chars;

  for (let i = startIndex; i < text.length; i++) {
    // Check stop ONLY at the boundary of the loop iteration (before starting the transaction)
    if (runId !== state.currentRunId || !state.isRunning) {
      if (runId === state.currentRunId) await detachDebugger();
      return;
    }

    const char = text[i];
    await sendKey(tabId, char);
    if (runId !== state.currentRunId || !state.isRunning) {
      if (runId === state.currentRunId) await detachDebugger();
      return;
    }

    state.stats.chars++;
    state.currentIndex = i + 1; // Synchronously mark character as typed!

    if (char === ' ') {
      state.stats.words++;
    }
    broadcastState(); // throttled — only fires every 500ms

    // Self-correcting rate limiter sleep
    const sessionCharsTyped = state.stats.chars - initialChars;
    const nextTime = typingStartTime + sessionCharsTyped * delay;
    const sleepTime = nextTime - Date.now();
    if (sleepTime > 0) {
      await sleep(humanize(sleepTime));
    }
  }

  // Done typing the text
  state.stats.words++; // last word
  state.stats.done = true;
  state.currentIndex = 0; // Reset index since we finished
  state.isRunning = false;
  broadcastState(true); // force on completion
  if (runId === state.currentRunId) await detachDebugger();
}

async function focusGenericInput(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Try the user's cursor-tagged element first
        const tagged = document.querySelector('[data-typebot-target="true"]');
        if (tagged) {
          tagged.removeAttribute('data-typebot-target');
          tagged.focus();
          tagged.click();
          tagged.focus();
          return;
        }

        // Try currently focused element if it's an input/textarea
        let el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
          el.focus();
          return;
        }

        // Try to find common input fields
        const selectors = [
          'textarea:not([readonly])',
          'input[type="text"]:not([readonly])',
          '#wordsInput',
          '.txtInput',
          '#inputfield',
          'input:not([type="hidden"]):not([readonly])'
        ];
        for (const sel of selectors) {
          const target = document.querySelector(sel);
          if (target && target.getBoundingClientRect().height > 0) {
            target.focus();
            target.click();
            target.focus();
            return;
          }
        }
      }
    });
  } catch (err) {
    console.error('[TypeBot] focusGenericInput error:', err);
  }
}

async function scrapePageText(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Common containers for typing sites
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
        
        // Fallback: Find the best clean text paragraph/block on the page
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
    });
    return results?.[0]?.result || '';
  } catch (err) {
    return '';
  }
}

// -------------------------------------------------------
// Main typing loop
// -------------------------------------------------------
async function typingLoop(runId) {
  const { tabId, config } = state;
  const { delay } = config;

  // Step 1: Robust focus — retry up to 5 times until confirmed
  for (let attempt = 0; attempt < 5; attempt++) {
    await focusTypingArea(tabId);
    if (runId !== state.currentRunId || !state.isRunning) {
      if (runId === state.currentRunId) await detachDebugger();
      return;
    }
    await sleep(300);
    if (runId !== state.currentRunId || !state.isRunning) {
      if (runId === state.currentRunId) await detachDebugger();
      return;
    }
    const focus = await verifyFocus(tabId);
    if (focus.isFocused && !focus.isBlurred) {
      console.log(`[TypeBot] Focus confirmed on attempt ${attempt + 1}`);
      break;
    }
    console.warn(`[TypeBot] Focus attempt ${attempt + 1} failed, retrying...`);
    await sleep(200);
    if (runId !== state.currentRunId || !state.isRunning) {
      if (runId === state.currentRunId) await detachDebugger();
      return;
    }
  }

  // Extra settle time after focus is confirmed
  await sleep(400);
  if (runId !== state.currentRunId || !state.isRunning) {
    if (runId === state.currentRunId) await detachDebugger();
    return;
  }

  let consecutiveFailures = 0;
  const typingStartTime = Date.now();
  let charsTyped = 0;

  while (state.isRunning && runId === state.currentRunId) {
    // Check if test finished
    if (await isTestFinished(tabId)) {
      state.stats.done = true;
      state.isRunning = false;
      broadcastState(true);
      if (runId === state.currentRunId) await detachDebugger();
      break;
    }

    // Read the current active word
    const wordData = await readActiveWord(tabId);
    if (runId !== state.currentRunId || !state.isRunning) {
      if (runId === state.currentRunId) await detachDebugger();
      return;
    }

    if (!wordData) {
      consecutiveFailures++;
      if (consecutiveFailures > 30) {
        state.stats.done = true;
        state.isRunning = false;
        broadcastState(true);
        if (runId === state.currentRunId) await detachDebugger();
        break;
      }
      await sleep(100);
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }
      continue;
    }

    consecutiveFailures = 0;
    const { fullWord, remainingChars, typedCount } = wordData;

    if (remainingChars.length === 0) {
      await sendKey(tabId, ' ');
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }
      state.stats.chars++;
      state.stats.words++;
      charsTyped++;
      broadcastState();
      
      await sleep(Math.min(50, delay * 0.25));
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }
      await waitForWordChange(tabId, fullWord);
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }

      // Self-correcting sleep after word/space transition
      const nextTime = typingStartTime + charsTyped * delay;
      const sleepTime = nextTime - Date.now();
      if (sleepTime > 0) {
        await sleep(humanize(sleepTime));
        if (runId !== state.currentRunId || !state.isRunning) {
          if (runId === state.currentRunId) await detachDebugger();
          return;
        }
      }
      continue;
    }

    // Type each remaining letter ONE AT A TIME
    for (let i = 0; i < remainingChars.length; i++) {
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }

      const char = remainingChars[i];
      const letterIndex = typedCount + i;

      await sendKey(tabId, char);
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }
      state.stats.chars++;
      charsTyped++;

      // Wait for DOM to register
      await sleep(Math.min(40, delay * 0.2));
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }

      // Verify the letter was accepted correctly
      const verification = await verifyLetterState(tabId, letterIndex);
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }
      if (verification && verification.isIncorrect) {
        console.warn(`[TypeBot] Incorrect at index ${letterIndex}, backspacing...`);
        await sendKey(tabId, 'Backspace');
        if (runId !== state.currentRunId || !state.isRunning) {
          if (runId === state.currentRunId) await detachDebugger();
          return;
        }
        charsTyped++;
        await sleep(40);
        if (runId !== state.currentRunId || !state.isRunning) {
          if (runId === state.currentRunId) await detachDebugger();
          return;
        }
        await sendKey(tabId, char);
        if (runId !== state.currentRunId || !state.isRunning) {
          if (runId === state.currentRunId) await detachDebugger();
          return;
        }
        charsTyped++;
        await sleep(40);
        if (runId !== state.currentRunId || !state.isRunning) {
          if (runId === state.currentRunId) await detachDebugger();
          return;
        }
      }

      broadcastState();

      // Self-correcting sleep
      const nextTime = typingStartTime + charsTyped * delay;
      const sleepTime = nextTime - Date.now();
      if (sleepTime > 0) {
        await sleep(humanize(sleepTime));
        if (runId !== state.currentRunId || !state.isRunning) {
          if (runId === state.currentRunId) await detachDebugger();
          return;
        }
      }
    }

    // Press space to advance to next word
    if (state.isRunning && runId === state.currentRunId) {
      const wordBeforeSpace = fullWord;
      await sendKey(tabId, ' ');
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }
      state.stats.chars++;
      state.stats.words++;
      charsTyped++;
      broadcastState();

      await sleep(Math.min(50, delay * 0.25));
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }
      await waitForWordChange(tabId, wordBeforeSpace, 500);
      if (runId !== state.currentRunId || !state.isRunning) {
        if (runId === state.currentRunId) await detachDebugger();
        return;
      }

      // Self-correcting sleep after space
      const nextTime = typingStartTime + charsTyped * delay;
      const sleepTime = nextTime - Date.now();
      if (sleepTime > 0) {
        await sleep(humanize(sleepTime));
        if (runId !== state.currentRunId || !state.isRunning) {
          if (runId === state.currentRunId) await detachDebugger();
          return;
        }
      }
    }
  }
  if (runId === state.currentRunId) await detachDebugger();
}

// -------------------------------------------------------
// Debugger management
// -------------------------------------------------------
async function attachDebugger(tabId) {
  // Detach any existing debugger first to prevent "already attached" errors
  if (state.debuggerAttached) {
    try { await chrome.debugger.detach({ tabId: state.tabId || tabId }); } catch (e) {}
    state.debuggerAttached = false;
  }
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    state.debuggerAttached = true;
    return true;
  } catch (err) {
    // If it's already attached to THIS tab, that's fine — reuse it
    if (err.message && err.message.includes('already attached')) {
      state.debuggerAttached = true;
      return true;
    }
    console.error('[TypeBot] Failed to attach debugger:', err);
    return false;
  }
}

async function detachDebugger() {
  if (state.debuggerAttached && state.tabId) {
    try { await chrome.debugger.detach({ tabId: state.tabId }); } catch (e) {}
    state.debuggerAttached = false;
  }
}

chrome.debugger.onDetach.addListener((source, reason) => {
  if (source.tabId === state.tabId) {
    state.isRunning = false;
    state.debuggerAttached = false;
    broadcastState();
  }
});

// -------------------------------------------------------
// Message handler (from popup AND floating panel)
// -------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Get tabId from sender (content script) or from msg (popup)
  const tabId = sender?.tab?.id || msg.tabId;

  if (msg.action === 'start') {
    msg.tabId = tabId; // ensure tabId is set
    handleStart(msg).then((res) => sendResponse(res));
    return true;
  }
  if (msg.action === 'stop') {
    handleStop().then((res) => sendResponse(res));
    return true;
  }
  if (msg.action === 'getStats') {
    sendResponse({ stats: state.stats, isRunning: state.isRunning });
    return false;
  }
  if (msg.action === 'resetSession') {
    state.isRunning = false;
    state.currentRunId = null;
    state.currentIndex = 0;
    state.stats = { chars: 0, words: 0, done: false };
    detachDebugger();
    broadcastState(true);
    sendResponse({ success: true });
    return true;
  }
  if (msg.action === 'injectPanel') {
    injectPanel(tabId).then((res) => sendResponse(res));
    return true;
  }
});

async function injectPanel(tabId) {
  try {
    // Inject the floating panel CSS and JS
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['panel.css'] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['panel.js'] });
    return { success: true };
  } catch (err) {
    console.error('[TypeBot] Panel injection error:', err);
    return { success: false, error: err.message };
  }
}

async function handleStart(msg) {
  if (state.isRunning) return { success: false, error: 'Already running' };

  const { wpm, platform, tabId, customText } = msg;
  const delay = Math.round(60000 / (wpm * 5));

  const cleanPrev = (state.config?.customText || '').trim().replace(/\r/g, '').replace(/\s+/g, ' ');
  const cleanNew = (customText || '').trim().replace(/\r/g, '').replace(/\s+/g, ' ');

  // Determine if this is a resume request
  const isResuming = 
    !msg.forceNewSession &&
    state.tabId === tabId &&
    state.config?.platform === platform &&
    (!customText || !state.config?.customText || cleanPrev === cleanNew) &&
    !state.stats.done;

  state.tabId = tabId;
  state.isRunning = true;
  state.currentRunId = Math.random();
  const runId = state.currentRunId;

  if (isResuming) {
    state.config.wpm = wpm;
    state.config.delay = delay;
    console.log(`[TypeBot] Resuming session at index ${state.currentIndex} (Run ID: ${runId})`);
  } else {
    state.stats = { chars: 0, words: 0, done: false };
    state.currentIndex = 0;
    state.config = { wpm, delay, platform, customText };
    console.log(`[TypeBot] Starting new session (Run ID: ${runId})`);
  }

  const attached = await attachDebugger(tabId);
  if (!attached) {
    state.isRunning = false;
    state.currentRunId = null;
    return { success: false, error: 'Failed to attach debugger.' };
  }

  const loop = platform === 'monkeytype' ? typingLoop : typingLoopGeneric;

  loop(runId).catch((err) => {
    console.error('[TypeBot] Typing loop error:', err);
    state.isRunning = false;
    state.currentRunId = null;
    detachDebugger();
  });

  return { success: true };
}

async function handleStop() {
  state.isRunning = false;
  state.currentRunId = null;
  broadcastState(true);
  return { success: true, stats: state.stats };
}

console.log('[TypeBot] Background service worker loaded ✓');

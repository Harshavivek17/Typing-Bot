const btn = document.getElementById('injectBtn');
const status = document.getElementById('status');

btn.addEventListener('click', async () => {
  btn.disabled = true;
  status.textContent = 'Injecting…';
  status.className = 'status';

  try {
    let tab;
    const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTabs && currentTabs[0] && currentTabs[0].id) {
      tab = currentTabs[0];
    } else {
      const focusedTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (focusedTabs && focusedTabs[0] && focusedTabs[0].id) {
        tab = focusedTabs[0];
      }
    }

    if (!tab || !tab.id) {
      status.textContent = 'No active tab found. Try clicking the page first.';
      status.className = 'status error';
      btn.disabled = false;
      return;
    }

    if (tab.url && (tab.url.startsWith('chrome:') || tab.url.startsWith('edge:') || tab.url.startsWith('about:'))) {
      status.textContent = 'Cannot run on system pages. Open a typing site first.';
      status.className = 'status error';
      btn.disabled = false;
      return;
    }

    chrome.runtime.sendMessage({ action: 'injectPanel', tabId: tab.id }, (res) => {
      if (chrome.runtime.lastError) {
        status.textContent = 'Extension error';
        status.className = 'status error';
        btn.disabled = false;
        return;
      }
      if (res?.success) {
        status.textContent = '✓ Panel injected! You can close this popup.';
        status.className = 'status success';
      } else {
        status.textContent = res?.error || 'Failed to inject';
        status.className = 'status error';
        btn.disabled = false;
      }
    });
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
    status.className = 'status error';
    btn.disabled = false;
  }
});

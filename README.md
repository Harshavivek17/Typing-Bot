# ⚡ TypeBot — Auto-Typer Chrome Extension

TypeBot is a highly customizable, premium auto-typing browser extension specifically designed to assist with typing tests. It bypasses aggressive keyboard interceptors, auto-detects passages, and simulates natural key strokes at a rate defined by your target WPM speed.

The repository also features a modern Vite + Tailwind CSS landing page that is deployed live on Vercel, allowing users to download the extension ZIP directly with one-click setup.

- **Live Landing Page**: [https://typing-bot.vercel.app](https://typing-bot.vercel.app)
- **GitHub Repository**: [https://github.com/Harshavivek17/Typing-Bot.git](https://github.com/Harshavivek17/Typing-Bot.git)

---

## ✨ Features

- **Custom WPM Speed Selector**: Type at any speed from 1 WPM up to 500+ WPM.
- **Flawless Pause & Resume**: Stop the bot halfway, change WPM, and resume typing from the exact character where you paused without leaving duplicate characters or typos.
- **🪄 Intelligent Auto-Detect**: One-click scraping to automatically detect the passage text with correct word-spacing on Monkeytype or generic custom tests.
- **Isolated Event Dispatch (No Page Hijack)**: Stops event bubbling within the panel so sites like Monkeytype can't capture or block your inputs when you type inside the WPM box.
- **Anti-Cheat Safe Exit**: Includes an **"⏹ End"** button to completely reset progress index, detach the debugger, and restore the default state, as well as a red **"×"** button to cleanly unmount the DOM elements.
- **Stealth Mode**: Press <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>H</kbd> (or click the stealth toggle) to hide the floating panel from meeting viewers or screen-share streams instantly. Hover over the top-right corner or press the shortcut again to restore it.

---

## 🛠 Project Structure

- **`/chrome-extension`**: The actual Chrome Extension source directory.
  - `background.js`: Chrome service worker using the **Chrome DevTools Protocol (CDP)** to inject trusted, native raw key down/up sequences. Handles throttled updates and safely manages debugger attachments.
  - `panel.js` / `panel.css`: Frontend interface of the floating panel injected securely using a Shadow DOM wrapper.
  - `popup.html` / `popup.js`: Simple popup fallback to launch the floating panel.
- **`/src`**, **`index.html`**, **`vite.config.ts`**: The web landing page code for product showcase.
- **`public/extension.zip`**: The pre-built, ready-to-load extension archive available for direct download.

---

## 🚀 How to Install and Use

### Option 1: Install from Deployed Site (Recommended)
1. Go to the live site at [https://typing-bot.vercel.app](https://typing-bot.vercel.app).
2. Click the **"Download Extension (.zip)"** button to download the pre-packaged archive.
3. Follow the simple step-by-step developer installation guide listed on the homepage.

### Option 2: Load directly from GitHub Repository
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/Harshavivek17/Typing-Bot.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle the **"Developer mode"** switch in the top-right corner to **ON**.
4. Click the **"Load unpacked"** button in the top-left corner.
5. Select the `/chrome-extension` directory from the cloned repository.
6. Open any typing page (like Monkeytype), select the extension, and start typing!

---

## 🧑‍💻 Development

Run the landing page locally:
```bash
npm install
npm run dev
```

Build the landing page and package the extension:
```bash
# Package extension files
Compress-Archive -Path chrome-extension\* -DestinationPath public\extension.zip -Force

# Build static app
npm run build
```

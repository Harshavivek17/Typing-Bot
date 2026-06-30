export function App() {
  return (
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      
      {/* Decorative Glows */}
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header class="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-blue-500 font-bold text-xl tracking-tight">⚡ TypeBot</span>
            <span class="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">v1.1.0</span>
          </div>
          <a
            href="https://github.com/Harshavivek17/Typing-Bot"
            target="_blank"
            class="text-sm text-slate-400 hover:text-white transition flex items-center gap-2 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg bg-slate-900/50"
          >
            <svg class="w-4 h-4 fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </a>
        </div>
      </header>

      {/* Hero Showcase Section */}
      <main class="max-w-6xl mx-auto px-6 py-12 md:py-20 flex-grow grid md:grid-cols-12 gap-12 items-center">
        <div class="md:col-span-7 flex flex-col gap-6 text-center md:text-left">
          <div class="inline-flex self-center md:self-start items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-medium">
            ✨ <span id="tb-downloads-val" class="font-bold text-white tracking-wider">...</span> successful downloads
          </div>
          <h1 class="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Type flawlessly.<br />At any speed you want.
          </h1>
          <p class="text-slate-400 text-base md:text-lg max-w-xl">
            TypeBot is a highly customizable developer auto-typer Chrome Extension. Control target WPM speeds, toggle meeting stealth modes instantly, pause/resume seamlessly, and use manual auto-detect text options.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
            <a
              id="tb-download-link"
              href="/extension.zip"
              download="typebot-chrome-extension.zip"
              onclick="handleDownloadIncrement()"
              class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-6 py-3.5 rounded-xl transition shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 scale-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Download Extension (.zip)
            </a>
            <a
              href="#installation-guide"
              class="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 font-semibold px-6 py-3.5 rounded-xl transition"
            >
              Setup Instructions
            </a>
          </div>

          <script>
            {`
              async function loadDownloadCounter() {
                const counterEl = document.getElementById('tb-downloads-val');
                try {
                  const res = await fetch('https://api.counterapi.dev/v1/typebot-extension/downloads');
                  if (res.ok) {
                    const data = await res.json();
                    counterEl.textContent = Number(data.count).toLocaleString();
                  } else {
                    counterEl.textContent = '1,250+';
                  }
                } catch (err) {
                  counterEl.textContent = '1,250+';
                }
              }

              async function handleDownloadIncrement() {
                const counterEl = document.getElementById('tb-downloads-val');
                try {
                  const res = await fetch('https://api.counterapi.dev/v1/typebot-extension/downloads/up');
                  if (res.ok) {
                    const data = await res.json();
                    counterEl.textContent = Number(data.count).toLocaleString();
                  }
                } catch (err) {}
              }

              // Load counter values on page render
              document.addEventListener('DOMContentLoaded', loadDownloadCounter);
              // Fallback load trigger
              setTimeout(loadDownloadCounter, 500);
            `}
          </script>
        </div>

        {/* Floating Panel Preview Mock */}
        <div class="md:col-span-5 flex justify-center">
          <div class="w-[300px] bg-[#161921] border border-slate-800/80 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 font-sans relative">
            <div class="absolute -top-3 -right-3 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
              Live UI
            </div>
            
            {/* Header */}
            <div class="flex items-center justify-between border-b border-slate-800/60 pb-2">
              <div class="flex items-center gap-1.5">
                <span class="text-blue-400 text-xs">⚡</span>
                <span class="text-xs font-bold text-slate-200">TypeBot Panel</span>
              </div>
              <div class="flex gap-1">
                <div class="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">👁</div>
                <div class="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">−</div>
                <div class="w-5 h-5 rounded bg-red-950/20 text-red-400 flex items-center justify-center text-[10px] border border-red-500/20">×</div>
              </div>
            </div>

            {/* Status indicator */}
            <div class="flex items-center gap-2 bg-slate-900/60 px-2 py-1.5 rounded-lg border border-slate-800/40">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span class="text-[10px] text-slate-400 font-medium">Status: <strong class="text-emerald-400">Typing...</strong></span>
            </div>

            {/* WPM Setting */}
            <div class="flex items-center justify-between text-xs bg-slate-900/40 p-2 rounded-lg border border-slate-800/20">
              <span class="text-slate-400">WPM Rate</span>
              <span class="font-bold text-blue-400">150</span>
            </div>

            {/* Platform Selection */}
            <div class="flex items-center justify-between text-xs bg-slate-900/40 p-2 rounded-lg border border-slate-800/20">
              <span class="text-slate-400">Mode</span>
              <span class="font-bold text-slate-300">Generic / Custom</span>
            </div>

            {/* Custom Text Area */}
            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center text-[10px]">
                <span class="text-slate-400">Target Passage</span>
                <span class="text-blue-400">🪄 Auto-Detect</span>
              </div>
              <div class="bg-slate-900/80 text-[10px] text-slate-400 p-2 rounded-lg border border-slate-800/60 h-14 overflow-hidden select-none">
                The basics of financial planning include setting clear financial goals, creating a budget...
              </div>
            </div>

            {/* Controls */}
            <div class="grid grid-cols-3 gap-2">
              <button class="bg-blue-600/30 text-blue-400 border border-blue-500/20 text-[10px] font-bold py-1.5 rounded-lg cursor-default">
                ▶ Resume
              </button>
              <button class="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] py-1.5 rounded-lg cursor-default">
                ↺ Restart
              </button>
              <button class="bg-red-950/20 text-red-400 border border-red-500/20 text-[10px] py-1.5 rounded-lg cursor-default">
                ⏹ End
              </button>
            </div>

            {/* Stats display */}
            <div class="grid grid-cols-3 gap-2 border-t border-slate-800/60 pt-2 text-center">
              <div>
                <div class="text-xs font-bold text-slate-200">101</div>
                <div class="text-[9px] text-slate-500">chars</div>
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200">13</div>
                <div class="text-[9px] text-slate-500">words</div>
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200">8s</div>
                <div class="text-[9px] text-slate-500">time</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Installation Guide Section */}
      <section id="installation-guide" class="border-t border-slate-900 bg-slate-950 py-16">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center max-w-xl mx-auto flex flex-col gap-3 mb-12">
            <h2 class="text-2xl md:text-3xl font-bold text-white">How to Install</h2>
            <p class="text-slate-400 text-sm">
              Since the auto-typer uses modern CDP debugger access to simulate native keyboard events, it runs locally as an unpacked extension. Set it up in less than 30 seconds:
            </p>
          </div>

          <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div class="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl flex flex-col gap-3 hover:border-slate-800 transition">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
              <h3 class="font-bold text-slate-200 text-sm">Download ZIP</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Click the download button above or get <a href="/extension.zip" download="extension.zip" class="text-blue-400 hover:underline">typebot-chrome-extension.zip</a> to save the compressed code archive onto your local machine.
              </p>
            </div>

            {/* Step 2 */}
            <div class="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl flex flex-col gap-3 hover:border-slate-800 transition">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
              <h3 class="font-bold text-slate-200 text-sm">Extract Files</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Unzip/extract the contents of the download. You'll get a directory named <code class="bg-slate-950 text-slate-300 px-1 py-0.5 rounded text-[10px]">chrome-extension</code> containing the background service worker and panel UI files.
              </p>
            </div>

            {/* Step 3 */}
            <div class="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl flex flex-col gap-3 hover:border-slate-800 transition">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
              <h3 class="font-bold text-slate-200 text-sm">Open Extension Rules</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                In Google Chrome, navigate to the extension administration area by typing <code class="bg-slate-950 text-slate-300 px-1 py-0.5 rounded text-[10px]">chrome://extensions/</code> directly in your URL bar.
              </p>
            </div>

            {/* Step 4 */}
            <div class="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl flex flex-col gap-3 hover:border-slate-800 transition">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">4</div>
              <h3 class="font-bold text-slate-200 text-sm">Toggle Developer Mode</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Locate the **"Developer mode"** toggle switch in the top-right corner of the Extensions dashboard, and turn it **ON**.
              </p>
            </div>

            {/* Step 5 */}
            <div class="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl flex flex-col gap-3 hover:border-slate-800 transition">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">5</div>
              <h3 class="font-bold text-slate-200 text-sm">Load Unpacked</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Click the **"Load unpacked"** button in the top-left corner, browse to your unzipped files, and select the <code class="bg-slate-950 text-slate-300 px-1 py-0.5 rounded text-[10px]">chrome-extension</code> folder.
              </p>
            </div>

            {/* Step 6 */}
            <div class="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl flex flex-col gap-3 hover:border-slate-800 transition">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">6</div>
              <h3 class="font-bold text-slate-200 text-sm">Activate & Type</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Launch any typing practice page, click the extension icon to reveal the panel, set your speed limit, click Start, and watch it type with zero mistakes.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer class="border-t border-slate-900 bg-slate-950 py-8 text-center text-slate-500 text-xs">
        <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} TypeBot Extension. Deployed on Vercel.</p>
          <div class="flex gap-4">
            <a href="https://github.com/Harshavivek17/Typing-Bot" target="_blank" class="hover:text-slate-300 transition">GitHub Repo</a>
            <span>•</span>
            <a href="https://vercel.com" target="_blank" class="hover:text-slate-300 transition">Hosted by Vercel</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

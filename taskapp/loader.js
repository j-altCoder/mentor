// ─── LOADER ───────────────────────────────────────────────────────────────────
// Reads MANIFEST.moduleCount and loads all data + filetree files in the correct
// order before starting app.js. Each script is injected only after the previous
// one has fully executed — preserving the synchronous global dependency chain.
//
// Load order:
//   1. data/modules.js          — declares MODULES[] and STEPS[]
//   2. data/mod0..modN.js       — each pushes its steps into STEPS[]
//   3. filetree/order.js        — declares FILE_SNAPSHOTS{} and FILE_TREE_ORDER[]
//   4. filetree/mod0..modN.js   — each merges snapshots via Object.assign()
//   5. app.js                   — reads all globals and starts the app
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  const n = MANIFEST.moduleCount;

  // Build the ordered file list from the manifest
  const files = [
    'data/modules.js',
    ...Array.from({ length: n }, (_, i) => `data/mod${i}.js`),
    'filetree/order.js',
    ...Array.from({ length: n }, (_, i) => `filetree/mod${i}.js`),
    'app.js',
  ];

  // Inject scripts one at a time. Each script's onload triggers the next.
  // This guarantees execution order regardless of browser parallelism.
  function loadNext(index) {
    if (index >= files.length) return;

    const script  = document.createElement('script');
    script.src    = files[index];
    script.async  = false;

    script.onload = () => loadNext(index + 1);

    script.onerror = () => {
      console.error(`[loader] failed to load: ${files[index]}`);
      // Surface a visible error so the blank screen isn't silent
      document.body.innerHTML = `
        <div style="font-family:monospace;padding:40px;color:#f85149;background:#0d1117;height:100vh;box-sizing:border-box">
          <div style="font-size:14px;font-weight:700;margin-bottom:8px">failed to load module file</div>
          <div style="font-size:12px;color:#8b949e">${files[index]}</div>
          <div style="font-size:11px;color:#484f58;margin-top:16px">
            check that the file exists and that MANIFEST.moduleCount matches the number of mod files.
          </div>
        </div>`;
    };

    document.head.appendChild(script);
  }

  loadNext(0);
})();

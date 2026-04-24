// ─── LOADER ───────────────────────────────────────────────────────────────────
// Reads MANIFEST.moduleCount and loads all data files in the correct order
// before starting app.js. Each script is injected only after the previous one
// has fully executed — preserving the synchronous global dependency chain.
//
// Load order:
//   1. data/modules.js      — declares MODULES[] and STEPS[] as var globals
//   2. data/mod0..modN.js   — each pushes its steps into STEPS[]
//   3. app.js               — reads all globals and starts the app
//
// IMPORTANT: app.js wraps its entire init in a DOMContentLoaded listener.
// Because this loader injects app.js dynamically via createElement('script'),
// that event has already fired by the time app.js executes — so the listener
// would never run. After all files load we dispatch a synthetic
// DOMContentLoaded event to trigger app.js init correctly.
//
// FILE TREE: filetree files are not loaded. The file tree panel is hidden via
// CSS. To reintroduce, add filetree loading back here and unhide in styles.css.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  var n    = MANIFEST.moduleCount;
  var bust = '?v=' + MANIFEST.moduleCount + '_' + (MANIFEST.bust || '1');

  var files = ['data/modules.js'];

  for (var i = 0; i < n; i++) {
    files.push('data/mod' + i + '.js');
  }

  files.push('app.js');

  function loadNext(index) {
    if (index >= files.length) {
      // All files loaded. app.js registered a DOMContentLoaded listener but
      // that event already fired before this loader ran. Dispatch a synthetic
      // one now so app.js init executes with all globals already populated.
      var evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: false });
      document.dispatchEvent(evt);
      return;
    }

    var script   = document.createElement('script');
    script.src   = files[index] + bust;
    script.async = false;

    script.onload = function () { loadNext(index + 1); };

    script.onerror = function () {
      console.error('[loader] failed to load: ' + files[index]);
      document.body.innerHTML =
        '<div style="font-family:monospace;padding:40px;color:#f85149;background:#0d1117;height:100vh;box-sizing:border-box">' +
        '<div style="font-size:14px;font-weight:700;margin-bottom:8px">failed to load module file</div>' +
        '<div style="font-size:12px;color:#8b949e">' + files[index] + '</div>' +
        '<div style="font-size:11px;color:#484f58;margin-top:16px">' +
        'check the file exists and that MANIFEST.moduleCount matches the number of mod files.' +
        '</div></div>';
    };

    document.head.appendChild(script);
  }

  loadNext(0);
})();

// ─── MANIFEST ─────────────────────────────────────────────────────────────────
// The only file you touch when adding a new module.
// Bump moduleCount by 1, then create:
//   data/mod{N}.js
// That's it. loader.js handles the rest.
// ─────────────────────────────────────────────────────────────────────────────

var MANIFEST = {
  moduleCount: 5,   // ← bump this by 1 each time you add a new module.
  bust: '1',        // ← change this string to force-refresh cached module files.
};

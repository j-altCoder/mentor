// ─── MODULES ──────────────────────────────────────────────────────────────────
// One entry per module. Label is shown in the sidebar and chat dividers.
// Add a new entry here when you add a new mod{N}.js file.
// ─────────────────────────────────────────────────────────────────────────────
var MODULES = [
  { label: 'project foundation'         },  // mod 0
  { label: 'code quality & git hygiene' },  // mod 1
  { label: 'express server setup'       },  // mod 2
  { label: 'mongodb + mongoose'         },  // mod 3
  { label: 'user model'                 },  // mod 4
  // add future modules here ↓
];

// ─── STEPS ────────────────────────────────────────────────────────────────────
// Declared here as an empty array. Each mod{N}.js file pushes its steps in.
// app.js reads this as a single flat array — order of <script> tags matters.
// ─────────────────────────────────────────────────────────────────────────────
var STEPS = [];

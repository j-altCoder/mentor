// ─── FILE TREE GLOBALS ────────────────────────────────────────────────────────
// FILE_SNAPSHOTS: declared here as empty object.
//   Each filetree/mod{N}.js merges its entries in via Object.assign().
//
// FILE_TREE_ORDER: the canonical display order for the file tree panel.
//   Files not listed here appear at the bottom, alphabetically.
//   Add new paths here as you build out modules.
// ─────────────────────────────────────────────────────────────────────────────
var FILE_SNAPSHOTS = {};

var FILE_TREE_ORDER = [
  // ── root config ─────────────────────────────────────────────────────────────
  'package.json',
  '.env.example',
  '.gitignore',
  '.nvmrc',
  '.npmrc',
  '.editorconfig',
  '.prettierrc',
  '.prettierignore',
  '.eslintrc.json',
  'commitlint.config.js',
  'LICENSE',
  'README.md',

  // ── husky hooks ─────────────────────────────────────────────────────────────
  '.husky/pre-commit',
  '.husky/commit-msg',

  // ── vs code workspace ────────────────────────────────────────────────────────
  '.vscode/settings.json',
  '.vscode/extensions.json',

  // ── server ───────────────────────────────────────────────────────────────────
  'server/package.json',
  'server/.env',
  'server/index.js',
  'server/config/db.js',
  'server/config/validateEnv.js',
  'server/middleware/auth.js',
  'server/middleware/validate.js',
  'server/middleware/errorHandler.js',
  'server/models/User.js',
  'server/models/Task.js',
  'server/routes/auth.js',
  'server/routes/tasks.js',
  'server/controllers/authController.js',
  'server/controllers/taskController.js',

  // ── client ───────────────────────────────────────────────────────────────────
  'client/package.json',
  'client/index.html',
  'client/vite.config.js',
  'client/src/main.jsx',
  'client/src/App.jsx',
  'client/src/store/authStore.js',
  'client/src/store/taskStore.js',

  // ── ci / deployment ──────────────────────────────────────────────────────────
  '.github/workflows/ci.yml',
  'railway.json',
];

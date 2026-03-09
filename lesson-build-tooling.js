// ─────────────────────────────────────────────────────────────────
//  LESSON: Build Tooling
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_BUILD_TOOLING = {
  category: "Language & Framework Fundamentals",
  tag: "Build Tooling",
  title: "Why Your Code Doesn't Ship the Way You Write It",
  intro: "Raj opens a fresh terminal and types one command: <code>ls node_modules | wc -l</code>. The number comes back: 847. He turns the screen toward you. 'The user downloads zero of those,' he says. 'Your bundle is maybe four files. Walk me through how that transformation happens.'",
  scenes: [

    // ── Why bundlers exist ──
    {
      speaker: "raj",
      text: `"Before we get into how — why does a build step need to exist at all? What can't the browser just do itself?"`
    },
    {
      speaker: "you",
      text: `"Browsers can't run TypeScript or JSX natively."`
    },
    {
      speaker: "raj",
      text: `"That's one reason. What else?"`
    },
    {
      speaker: "you",
      text: `"All the import statements — the browser doesn't know how to resolve 'import React from react'."`
    },
    {
      speaker: "raj",
      text: `"Right. 'react' isn't a URL. The browser can only fetch things by URL. node_modules is a directory convention that only Node.js understands. And there's a third reason that's less obvious: before HTTP/2, every file was a separate TCP round trip. An app with 200 modules made 200 serial network requests before anything rendered. Bundlers exist to solve all three: compile non-standard syntax, resolve module paths to actual code, and reduce the number of network requests. The build output isn't your source code. It's a transformed, optimised version of it — written for machines to execute fast, not for humans to read."`
    },
    {
      type: "analogy",
      text: "A bundler is a factory floor. Raw materials come in — your JSX, TypeScript, CSS modules, SVGs. They get melted down, reshaped, impurities removed. What ships to the user isn't the raw material. It's a finished product built for one purpose: load fast and run. You write for developer experience. The bundler produces for user experience."
    },

    // ── Webpack ──
    {
      speaker: "raj",
      text: `"Webpack. What's the core concept behind how it works?"`
    },
    {
      speaker: "you",
      text: `"It starts at an entry file and follows every import to build a graph of all the modules."`
    },
    {
      speaker: "raj",
      text: `"The dependency graph — yes. And what does it do with that graph?"`
    },
    {
      speaker: "you",
      text: `"Serialises it into a bundle — one file with all the modules concatenated."`
    },
    {
      speaker: "raj",
      text: `"With a runtime wrapping it that emulates the module system. The output isn't just raw concatenation — it's wrapped in a small Webpack bootstrap that lets modules require each other the way they did in source. Now: there are two extension points in Webpack. Loaders and plugins. What's the difference?"`
    },
    {
      speaker: "you",
      text: `"Loaders transform individual files? And plugins do... broader things?"`
    },
    {
      speaker: "raj",
      text: `"Loaders transform individual modules as they enter the graph — babel-loader takes a JSX file and returns plain JavaScript, css-loader takes a CSS import and makes it a JavaScript module. Plugins operate on the whole compilation — HtmlWebpackPlugin injects script tags into your HTML, MiniCssExtractPlugin pulls all the CSS modules back out into a separate file. One other thing about loaders: they run right to left in the use array. If you have postcss-loader, css-loader, MiniCssExtractPlugin in that order — postcss runs first, then css-loader, then the extract plugin. That order trips people up constantly."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// WEBPACK — DEPENDENCY GRAPH + CONFIG
// ─────────────────────────────────────────────────────

// webpack.config.js
const path                 = require('path');
const HtmlWebpackPlugin    = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  // ── Entry: where the graph starts ──
  entry: './src/index.js',

  // ── Output: what gets written to disk ──
  output: {
    path:     path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',  // contenthash: only changes when content does
    clean:    true,
  },

  // ── Loaders: transform individual files ──
  // Rules: if file matches 'test', pipe through 'use' — RIGHT TO LEFT
  module: {
    rules: [
      {
        test:    /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use:     'babel-loader',          // JSX + TS → plain JS
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,    // 3rd: pull CSS into a .css file
          'css-loader',                   // 2nd: resolve @import and url()
          'postcss-loader',               // 1st: autoprefixer, Tailwind
        ],
        // Runs: postcss → css-loader → extract  (right to left)
      },
      {
        test: /\.(png|jpg|svg)$/,
        type: 'asset/resource',           // webpack 5: copy file, return URL
      },
    ],
  },

  // ── Plugins: operate on the whole compilation ──
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' }),
  ],

  mode: 'production',
  // production: minification, tree shaking, scope hoisting — all on by default
  // development: readable output, no minification, faster rebuilds

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
};`
    },

    // ── Vite ──
    {
      speaker: "raj",
      text: `"Vite. You'd choose it for a new project. Why?"`
    },
    {
      speaker: "you",
      text: `"It's much faster to start up in development."`
    },
    {
      speaker: "raj",
      text: `"Why is it faster? What's Webpack doing that Vite doesn't?"`
    },
    {
      speaker: "you",
      text: `"Webpack bundles everything before the dev server starts. Vite skips that?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. Webpack dev server has to build the full dependency graph and produce a bundle before it can serve a single request. On a large app that's 30–60 seconds of staring at a terminal on every cold start. Vite starts immediately — no bundling. It serves your source files directly via native ES modules, and the browser itself resolves the imports. When you request a file, Vite transforms just that file on demand using esbuild, which is written in Go and is 10 to 100 times faster than Babel. The dev server goes from startup-then-serve to serve-immediately-transform-on-request."`
    },
    {
      speaker: "you",
      text: `"What about production — Vite still bundles for that?"`
    },
    {
      speaker: "raj",
      text: `"Yes, production uses Rollup. Which is the odd thing about Vite: the dev experience and the production build use completely different tools — esbuild for dev, Rollup for prod. That means it's theoretically possible to see behaviour in development that doesn't appear in production. It's a pragmatic tradeoff — esbuild is fast enough for dev transforms but Rollup's tree shaking and output optimisation is better for what gets shipped. In practice this rarely bites you, but it's worth knowing when something weird happens only in prod."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// VITE — DEV VS PRODUCTION
// ─────────────────────────────────────────────────────

// vite.config.js
import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],   // JSX transform, Fast Refresh

  // ── Dev mode (vite dev) ──
  // No bundling. Browser fetches files via native ESM.
  // esbuild transforms JSX/TS per-file on request — Go-based, very fast
  // HMR: only the changed module invalidated and pushed via WebSocket
  // Cold start: ~300ms regardless of project size
  //             (Webpack on a large app: 30–60 seconds)

  // ── Production (vite build) — uses Rollup ──
  build: {
    outDir:    'dist',
    sourcemap: 'hidden',   // generate maps, don't expose publicly
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],   // React in its own long-lived chunk
          router: ['react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // warn if any chunk > 500kb
  },

  resolve: {
    alias: { '@': '/src' },
  },

  // Vite pre-bundles node_modules with esbuild on first start
  // Converts CommonJS packages to ESM so browser can import them
  // Cache lives in node_modules/.vite — clear with: vite --force
  optimizeDeps: {
    include: ['lodash-es'],
  },
});

// ── When to use which ──
// Vite:    new projects, React/Vue/Svelte SPAs, when dev speed matters
// Webpack: existing projects with complex config, Module Federation, legacy ecosystems`
    },

    // ── Tree shaking ──
    {
      speaker: "raj",
      text: `"Tree shaking. You import a library. Only half of it ends up in the bundle. How?"`
    },
    {
      speaker: "you",
      text: `"The bundler figures out which exports are actually used and removes the rest."`
    },
    {
      speaker: "raj",
      text: `"How does it figure that out — what does it need from the module format to do that analysis?"`
    },
    {
      speaker: "you",
      text: `"It needs imports to be static? So it can analyse them at build time without running the code."`
    },
    {
      speaker: "raj",
      text: `"Exactly. ES module imports are static declarations at the top of the file. The bundler can read them without executing anything. CommonJS require() is a function call — you can call it inside an if statement, pass a variable to it, call it conditionally at runtime. The bundler can't know at build time what's imported. This is the entire reason lodash-es exists alongside lodash. lodash is CommonJS — you import the whole 70kb thing and all of it ships. lodash-es is the same library as ES modules — you import debounce and only debounce ships, maybe 2kb. Same functionality, completely different bundle impact, purely because of the module format."`
    },
    {
      type: "analogy",
      text: "Tree shaking is packing for a trip by shaking your whole wardrobe over a suitcase. The clothes you actually chose for your outfits fall in. Everything else stays hanging. ES modules let the bundler know exactly which outfits you picked — the clothes are tagged. CommonJS is an untagged pile in the dark. You can't shake what you can't see, so it all goes in."
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// TREE SHAKING — WHAT WORKS AND WHAT DOESN'T
// ─────────────────────────────────────────────────────

// ── ES modules — tree-shakeable ✓ ──
// utils.js
export const add      = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export const multiply = (a, b) => a * b;

// app.js
import { add } from './utils';
// → subtract and multiply never referenced → removed from bundle

// ── CommonJS — NOT tree-shakeable ✗ ──
const utils = require('./utils'); // dynamic — evaluated at runtime
utils.add(1, 2);
// → bundler can't know subtract/multiply aren't used → entire module ships

// ── Real impact: lodash ──
import _ from 'lodash';               // ✗ entire 70kb — CommonJS
import { debounce } from 'lodash';    // ✗ still 70kb — still CommonJS
import { debounce } from 'lodash-es'; // ✓ ~2kb — ES module, tree-shakeable

// ── The sideEffects gotcha ──
// Tree shaker won't remove imports it thinks might have side effects
// (a side effect = code that does something when imported, not just exports values)

// package.json: "sideEffects": false
// → "every file in this package is pure — nothing happens on import"
// → bundler can safely remove unused imports

// package.json: "sideEffects": ["*.css", "src/polyfills.js"]
// → these specific files have side effects, everything else is safe

// Example side effect (must NOT be tree-shaken):
// polyfills.js
Array.prototype.at = function() { ... }; // mutates a global — side effect

// ── Writing tree-shakeable code ──
// Named exports > single default object
export const formatDate = (d) => ...;   // ✓ each function tree-shakeable
export const parseDate  = (s) => ...;

export default { formatDate, parseDate }; // ✗ object = one unit = nothing shaken out

// Barrel files (index.js re-exporting everything) can confuse tree shaking
// export * from './formatDate';  export * from './parseDate';
// Some bundlers handle this fine, some don't — check with a bundle analyser`
    },

    // ── Code splitting ──
    {
      speaker: "raj",
      text: `"You build the app. Tree shaking runs. You still have a 2mb bundle. What now?"`
    },
    {
      speaker: "you",
      text: `"Split it. Code splitting — break it into smaller chunks that load on demand."`
    },
    {
      speaker: "raj",
      text: `"What's the actual problem that splitting solves? Why does the size matter so much at load time specifically?"`
    },
    {
      speaker: "you",
      text: `"The user has to download and parse the entire bundle before anything renders."`
    },
    {
      speaker: "raj",
      text: `"Parse is the part people forget. On a low-end Android, parsing and executing 2mb of JavaScript can block the main thread for several seconds. The user sees a blank screen the whole time. Code splitting means the critical path — the code needed to render the current page — downloads first. The admin dashboard code, the data export wizard, the settings panel — none of that needs to exist until someone navigates there. Dynamic import() is the primitive: it tells the bundler 'split this into a separate file and only load it when this line runs.' React.lazy is just a wrapper around that for components."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CODE SPLITTING — DYNAMIC IMPORTS
// ─────────────────────────────────────────────────────

// ── Static import: always in the main bundle ──
import HeavyChart from './HeavyChart'; // user downloads this on every page

// ── Dynamic import: separate chunk, downloaded on demand ──
const { default: HeavyChart } = await import('./HeavyChart'); // only when called

// ── React.lazy + Suspense — route-level splitting ──
import { lazy, Suspense } from 'react';
import { Routes, Route }  from 'react-router-dom';

const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Settings   = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// User visits /dashboard:
//   → Downloads Dashboard chunk (maybe 40kb)
//   → Never downloads Settings or AdminPanel (maybe 200kb combined)
// Without splitting:
//   → Downloads all 3 upfront (every page load, every user, every time)

function App() {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />}  />
        <Route path="/settings"  element={<Settings />}   />
        <Route path="/admin"     element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}

// ── Prefetch vs Preload ──
// prefetch: "I'll probably need this soon" — fetches during idle time
const Settings = lazy(() => import(
  /* webpackPrefetch: true */ './pages/Settings'
));
// → <link rel="prefetch"> — low priority, runs after critical resources

// preload: "I need this right now, in parallel" — fetches immediately
const CriticalModal = lazy(() => import(
  /* webpackPreload: true */ './CriticalModal'
));
// → <link rel="preload"> — high priority, browser fetches in parallel

// ── Vite: manual chunk grouping ──
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react-vendor';
          if (id.includes('node_modules/recharts')) return 'charts';
          if (id.includes('node_modules/')) return 'vendor';
        },
      },
    },
  },
};

// ── Find what's large ──
// npx vite-bundle-visualizer   → treemap of Vite bundle
// npx webpack-bundle-analyzer  → treemap of Webpack bundle
// Look for: duplicate packages, large libraries with tiny usage`
    },

    // ── Source maps ──
    {
      speaker: "raj",
      text: `"Production error. Stack trace says: TypeError at bundle.4f2a91c3.js:1:83421. What do you do with that?"`
    },
    {
      speaker: "you",
      text: `"Nothing — that line number is useless in minified code."`
    },
    {
      speaker: "raj",
      text: `"Unless you have source maps. What are they?"`
    },
    {
      speaker: "you",
      text: `"They map positions in the minified bundle back to the original source file and line number."`
    },
    {
      speaker: "raj",
      text: `"Right. The map file says: position 83421 in the bundle corresponds to line 47 of src/components/Checkout.jsx, the variable was called cartTotal. DevTools downloads the map and shows you your original source as if the bundle doesn't exist. The question every team has to answer: do you ship the map file publicly alongside the bundle?"`
    },
    {
      speaker: "you",
      text: `"Publicly means users can read your source code."`
    },
    {
      speaker: "raj",
      text: `"Some companies are fine with that. Most aren't. The better pattern: hidden-source-map. Webpack generates the .map file but doesn't add the sourceMappingURL comment that tells browsers where to find it. Users can't find the map. But you upload the map to Sentry or Datadog during your CI deploy step. When an error comes in, Sentry has the map and shows you the original source — you get the full debugging benefit with none of the exposure."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SOURCE MAPS
// ─────────────────────────────────────────────────────

// webpack.config.js — different strategies per environment
module.exports = {
  devtool: process.env.NODE_ENV === 'production'
    ? 'hidden-source-map'           // generate .map file, no public reference
    : 'eval-cheap-module-source-map', // fast rebuilds, good quality for dev
};

// vite.config.js
export default {
  build: { sourcemap: 'hidden' }, // same idea
};

// ── The sourceMappingURL comment — what hidden removes ──
// Normal source-map adds this to end of bundle.js:
// //# sourceMappingURL=bundle.js.map  ← browser auto-fetches the map
//
// hidden-source-map: generates bundle.js.map but omits that comment
// → browsers never find it; your error tool can still use it

// ── Uploading to Sentry during CI ──
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
module.exports = {
  plugins: [
    sentryWebpackPlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org:       'your-org',
      project:   'your-app',
      release:   process.env.GIT_SHA,
      // Uploads .map files to Sentry and optionally deletes them from dist
    }),
  ],
};
// Result: errors in Sentry show original file, line, variable names
// Users hit your CDN and get only the minified .js — no map visible`
    },

    // ── HMR ──
    {
      speaker: "raj",
      text: `"You're building a multi-step form. Step three. You tweak the colour of a button. The browser full-reloads. You're back at step one. What's the tool that prevents that?"`
    },
    {
      speaker: "you",
      text: `"Hot Module Replacement."`
    },
    {
      speaker: "raj",
      text: `"What actually happens under the hood when you save that file?"`
    },
    {
      speaker: "you",
      text: `"The dev server detects the change, recompiles just that module, and sends it to the browser somehow."`
    },
    {
      speaker: "raj",
      text: `"Via WebSocket. The dev server has a persistent WebSocket connection to the browser. When you save, it sends a message: 'here's a new version of this module, hash abc123.' The browser's HMR runtime fetches the new chunk and swaps it in without reloading the page. Your form state lives in React state — it never got destroyed. React Fast Refresh, which is what you're actually using in a React app, goes one step further: it knows which component owns which state, so editing a child component doesn't reset the parent's state either. The only time HMR gives up and falls back to a full reload: when you change the entry point, when you change the config file, or when a module's export shape changes in a way the runtime can't reconcile."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// HOT MODULE REPLACEMENT
// ─────────────────────────────────────────────────────

// ── What happens on file save ──
// 1. You save src/Button.jsx
// 2. Dev server detects change via fs.watch
// 3. esbuild/babel recompiles only Button.jsx
// 4. WebSocket message to browser: { type: 'update', id: './src/Button.jsx' }
// 5. Browser fetches the new chunk
// 6. HMR runtime calls module.hot.accept() — swaps old module for new
// 7. React Fast Refresh re-renders affected components, state intact

// ── Webpack: manual HMR API (frameworks abstract this for you) ──
if (module.hot) {
  module.hot.accept('./store/userSlice', () => {
    // Redux hot reload: replace reducer without losing store state
    const next = require('./store/userSlice');
    store.replaceReducer(next.default);
  });
  module.hot.dispose((data) => {
    data.savedState = currentState; // pass state to incoming version
  });
}

// ── Vite HMR API ──
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => { /* patch running state */ });
  import.meta.hot.dispose((data) => { data.saved = someValue; });
  import.meta.hot.invalidate(); // force full reload for this module
}

// ── When HMR gives up (full reload) ──
// • Entry point changed (index.js / main.jsx)
// • Config file changed (vite.config.js / webpack.config.js)
// • Export shape changed (added/removed named exports)
// • No accept() handler found up the module chain
// • CSS-in-JS where styles depend on runtime values`
    },

    // ── Content hashing ──
    {
      speaker: "raj",
      text: `"You deploy. The file is called bundle.a3f9c2d1.js. Why the hash? Why not just bundle.js?"`
    },
    {
      speaker: "you",
      text: `"Cache busting — if the filename is always bundle.js, browsers serve the old cached version even after you deploy."`
    },
    {
      speaker: "raj",
      text: `"And the flip side of that — what do you gain when the hash doesn't change?"`
    },
    {
      speaker: "you",
      text: `"If the file hasn't changed, the URL is the same, so the browser never re-downloads it."`
    },
    {
      speaker: "raj",
      text: `"Which means you can set Cache-Control: immutable on those files. 'This URL will never change content — cache it forever.' No conditional requests, no revalidation overhead. The content hash is the URL's identity. Now here's where it matters: you have two types of code — your app code, which changes every deploy, and your vendor code — React, ReactDOM — which might not change for months. If you bundle them together, deploying any app change generates a new hash for the vendor code too. Users re-download 300kb of React they already had. Split them: vendor gets its own chunk with its own hash. App changes generate a new app hash. Vendor hash stays stable. Users only re-download what actually changed."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CONTENT HASHING + CACHE STRATEGY
// ─────────────────────────────────────────────────────

// ── contenthash vs chunkhash ──
// contenthash: changes only when THIS file's content changes
// chunkhash:   changes when ANY module in the chunk changes
// → Always use contenthash in production — chunkhash invalidates too aggressively

module.exports = {
  output: {
    filename:      '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  optimization: {
    // Vendor split: node_modules in their own stable-hash chunk
    splitChunks: {
      cacheGroups: {
        vendor: {
          test:   /[\\/]node_modules[\\/]/,
          name:   'vendor',
          chunks: 'all',
          // vendor.a1b2c3d4.js — hash only changes if React version changes
        },
      },
    },
    // runtimeChunk: Webpack runtime in its own tiny file
    // Without this, module ID changes can ripple into vendor hash even if vendor didn't change
    runtimeChunk: 'single',
  },
};

// ── Server: two different caching policies ──
// Hashed assets: immutable — cache forever, URL will never change content
// index.html:    no-cache  — must always be fresh (it contains the current hash filenames)

// Express:
app.use('/assets', express.static('dist/assets', {
  maxAge:    '1y',
  immutable: true,     // Cache-Control: max-age=31536000, immutable
}));

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');  // always check for new index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── What happens on deploy without this split ──
// Before: vendor.a1b2c3.js  app.x9k2m1.js
// Deploy: vendor.a1b2c3.js  app.3f9c2d.js  ← only app hash changed
//         ↑ browser already has this cached  ↑ browser fetches only this
//
// Without vendor split:
// Before: bundle.a1b2c3.js
// Deploy: bundle.3f9c2d.js  ← hash changed even though React didn't
//         ↑ browser re-downloads everything including React`
    },

    {
      type: "summary",
      points: [
        "Bundlers exist because browsers can't run JSX/TypeScript, can't resolve node_modules paths to URLs, and before HTTP/2 every file was a separate network round trip.",
        "Webpack builds a dependency graph from the entry point, following every import recursively. Loaders transform individual files (right to left). Plugins operate on the whole compilation.",
        "Vite doesn't bundle in dev mode — it serves source files via native ES modules and transforms per-request with esbuild (Go, 10–100x faster than Babel). Cold start is ~300ms regardless of project size. Production uses Rollup.",
        "Tree shaking only works on ES modules — static declarations let the bundler analyse usage at build time without executing anything. CommonJS require() is dynamic so the full module ships. This is why lodash-es exists.",
        "Code splitting breaks the bundle into async chunks loaded on demand. React.lazy() + dynamic import() creates a separate file per route. Users download code for pages they actually visit, not the entire app.",
        "Prefetch (probably need soon, load during idle) vs Preload (need now, load in parallel with current chunk). Prefetch = link rel prefetch. Preload = link rel preload.",
        "hidden-source-map generates the .map file without the sourceMappingURL comment. Browsers can't find the map; Sentry can. Full debugging, no source code exposure.",
        "HMR patches changed modules in the running browser via WebSocket — no page reload, no state loss. React Fast Refresh preserves component state even when editing child components. Falls back to full reload when the entry point or config changes.",
        "Content hashing gives each file a permanent URL (bundle.a3f9c2d1.js). Set immutable on hashed assets. Never cache index.html. Split vendor from app code so deploying app changes doesn't invalidate the user's cached React."
      ]
    }
  ]
};

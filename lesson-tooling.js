// ─────────────────────────────────────────────────────────────────
//  LESSON: Development Tooling
//  Category: Code Quality & Debugging
// ─────────────────────────────────────────────────────────────────

const LESSON_TOOLING = {
  category: "Code Quality & Debugging",
  tag: "Development Tooling",
  title: "The Tools Running Silently Behind Every Good Codebase",
  intro: "It's your second week. You open a PR and within 30 seconds a bot floods it with 15 lint errors. You stare at the screen wondering what you did wrong. Raj rolls over.",
  scenes: [

    // ── ESLint — what it actually is ──
    {
      speaker: "raj",
      text: `"Don't panic. That's ESLint doing exactly what it's supposed to do. What do you think ESLint is?"`
    },
    {
      speaker: "you",
      text: `"A style checker? Like it complains about spaces and semicolons?"`
    },
    {
      speaker: "raj",
      text: `"That's what most people think — and that's wrong. ESLint is a <em>static code analyser</em>. It parses your code into an AST — an Abstract Syntax Tree — and runs rule functions against every node in that tree. It catches real bugs: using a variable before declaring it, calling an async function without await, unreachable code after a return, comparing with == instead of ===. The style enforcement is secondary. Think of ESLint as a bug finder that also happens to care about formatting."`
    },
    {
      type: "analogy",
      text: "ESLint = a spell checker AND grammar checker for code. Spell check catches typos. Grammar check catches things that are grammatically valid but logically wrong — like 'I seen him' passing spell check but failing grammar. ESLint catches both."
    },
    {
      type: "code",
      text: `// .eslintrc.js — typical project config
module.exports = {
  env: { browser: true, node: true, es2021: true },
  extends: [
    'eslint:recommended',              // ESLint's built-in bug-catching rules
    'plugin:react/recommended',        // React-specific rules
    'plugin:react-hooks/recommended'   // warns about missing useEffect deps
  ],
  rules: {
    'no-unused-vars':              'error',  // unused vars = blocks CI
    'no-console':                  'warn',   // console.log = warning only
    'eqeqeq':                      'error',  // force === over ==
    'no-var':                      'error',  // disallow var
    'react-hooks/exhaustive-deps': 'warn'    // missing useEffect dependencies
  }
};

// Running ESLint
// npx eslint src/          — find all problems
// npx eslint src/ --fix    — auto-fix what it can`
      }
    },

    // ── Prettier ──
    {
      speaker: "you",
      text: `"We also have Prettier in the project. What's the difference? Isn't there overlap with ESLint's style rules?"`
    },
    {
      speaker: "raj",
      text: `"Yes there's overlap, and that's why you need to configure them to not fight each other. Prettier is a <em>pure formatter</em> — it takes your code, throws away all the whitespace, and reprints it from scratch according to its own rules. It's intentionally opinionated and gives you very few options. The point is you never debate tabs vs spaces or trailing commas in code reviews again — Prettier just decides and everyone moves on. ESLint handles logic and best practices. Prettier handles formatting. You use both, but you tell ESLint to turn off its own formatting rules so they don't conflict."`
    },
    {
      speaker: "you",
      text: `"How do you stop them conflicting?"`
    },
    {
      speaker: "raj",
      text: `"Install <em>eslint-config-prettier</em> and add 'prettier' as the last item in your ESLint extends array. Last means it wins — it turns off any ESLint rule that Prettier already handles. Then in VSCode, set Prettier as the default formatter and turn on formatOnSave. Every save — Prettier formats, ESLint flags bugs. Clean separation."`
    },
    {
      type: "code",
      text: `// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}

// .eslintrc.js — add 'prettier' LAST to disable conflicting rules
extends: [
  'eslint:recommended',
  'plugin:react/recommended',
  'prettier'            // ← last, disables ESLint's formatting rules
]

// .vscode/settings.json — commit this so whole team has same setup
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true  // ESLint auto-fix on save too
  }
}`
    },

    // ── Husky ──
    {
      speaker: "you",
      text: `"But what if someone on the team doesn't have the VSCode extension? They could still commit bad code."`
    },
    {
      speaker: "raj",
      text: `"That's exactly the problem Husky solves. Husky hooks into Git itself. You define scripts that run at specific Git events — before a commit, before a push. If the script fails, the Git operation is blocked. So even if someone has no extensions and uses Notepad, they literally cannot commit code that fails the lint check. The pre-commit hook is the most common — run the linter, if it fails, block the commit."`
    },
    {
      type: "analogy",
      text: "Husky = a security guard at the door. You cannot leave the building (commit) without being checked. Doesn't matter if you're wearing a suit or pajamas — everyone gets checked, no exceptions."
    },
    {
      speaker: "you",
      text: `"But linting the whole codebase on every commit sounds slow."`
    },
    {
      speaker: "raj",
      text: `"That's where <em>lint-staged</em> comes in. It runs the linter only on the files you've actually staged for this commit — not the whole project. You changed three files, it lints three files. The full project could have 10,000 files and your commit is still fast. Husky fires the hook. lint-staged figures out what's staged. ESLint and Prettier run on just those files."`
    },
    {
      type: "code",
      text: `// Install Husky
npm install --save-dev husky lint-staged
npx husky init   // creates .husky/ folder

// .husky/pre-commit — runs before every git commit
#!/bin/sh
npx lint-staged

// .husky/pre-push — runs before git push
#!/bin/sh
npm test   // full test suite must pass before pushing

// package.json — lint-staged config (what to run on which files)
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",       // fix what it can, fail if it can't
      "prettier --write"    // format it
    ],
    "*.{json,md,css}": [
      "prettier --write"    // just format non-JS files
    ]
  }
}`
    },

    // ── commitlint ──
    {
      speaker: "you",
      text: `"What about commit messages? Our git log is full of things like 'fix stuff' and 'wip' — it's useless."`
    },
    {
      speaker: "raj",
      text: `"That's exactly why <em>commitlint</em> exists. It runs in the commit-msg Git hook and validates your commit message against a convention. The most popular is <em>Conventional Commits</em> — every message must follow the pattern type(scope): description. Types are feat, fix, docs, chore, refactor, test, style, perf. If you don't follow the pattern, the commit is blocked. The payoff: from conventional commits you can auto-generate changelogs, automatically determine whether a version bump is a patch, minor, or major, and make git log actually tell a story."`
    },
    {
      speaker: "you",
      text: `"So 'fixed stuff' would get blocked?"`
    },
    {
      speaker: "raj",
      text: `"Blocked immediately. You'd have to write something like 'fix(auth): handle expired refresh token on concurrent requests'. Compare that to 'fixed stuff' — which one helps future-you at 2am debugging a production issue?"`
    },
    {
      type: "code",
      text: `// .husky/commit-msg
#!/bin/sh
npx --no -- commitlint --edit $1

// commitlint.config.js
module.exports = { extends: ['@commitlint/config-conventional'] };

// ✅ Valid commit messages
// feat(auth): add Google OAuth login
// fix(api): handle null response from payment gateway
// docs(readme): update local setup instructions
// refactor(db): extract query builder to separate module
// test(users): add unit tests for password validation
// chore(deps): upgrade express to 4.19

// ❌ Blocked by commitlint
// "fixed bug"         ← no type prefix
// "FEAT: add login"   ← type must be lowercase
// "wip"               ← doesn't follow pattern`
    },

    // ── nodemon ──
    {
      speaker: "you",
      text: `"nodemon — I use it but I don't really know how it works. It just... restarts things?"`
    },
    {
      speaker: "raj",
      text: `"Right, and understanding <em>how</em> matters for debugging it. nodemon uses OS-level file system events — inotify on Linux, FSEvents on Mac — not polling. When a file in your watched folders changes, the OS notifies nodemon instantly. It waits a short debounce period in case you save multiple files rapidly, then kills the Node process and restarts it. Important: nodemon is <em>dev only</em>. In production you use PM2 — it handles restarts on crash, clustering across multiple CPU cores, log management, and zero-downtime reloads."`
    },
    {
      speaker: "you",
      text: `"What if I only want it to restart when certain files change?"`
    },
    {
      speaker: "raj",
      text: `"That's what nodemon.json is for. You specify exactly which folders to watch, which extensions trigger a restart, and which to ignore. Useful for not restarting when test files change, for example."`
    },
    {
      type: "code",
      text: `// package.json scripts
{
  "scripts": {
    "dev":   "nodemon src/index.js",           // dev: auto-restart
    "start": "node src/index.js",              // production: plain node
    "debug": "nodemon --inspect src/index.js"  // dev with debugger port open
  }
}

// nodemon.json — fine-grained control
{
  "watch":  ["src"],                  // only watch src/ folder
  "ext":    "js,json,env",            // file types that trigger restart
  "ignore": ["src/**/*.test.js"],     // don't restart on test changes
  "delay":  500                       // wait 500ms after change before restarting
}

// nodemon vs PM2 in production
// nodemon — dev only, watches files, no clustering
// pm2 start src/index.js --name api -i max  (max = number of CPU cores)`
    },

    // ── dotenv ──
    {
      speaker: "you",
      text: `"dotenv — I just require it at the top and use process.env. Is there anything I'm missing?"`
    },
    {
      speaker: "raj",
      text: `"Probably. What does dotenv actually do?"`
    },
    {
      speaker: "you",
      text: `"Loads environment variables... from the .env file?"`
    },
    {
      speaker: "raj",
      text: `"Correct — but how? It reads the .env file, parses each line as KEY=VALUE, and calls process.env.KEY = VALUE for each one. That's literally it — a file parser. Now here's what most developers get wrong. One: the .env file must be in .gitignore. Always, no exceptions. If it gets committed, those secrets are in git history permanently — deleting the file doesn't remove them from history. Two: dotenv is for development only. Production servers inject environment variables directly through the platform — Heroku config vars, AWS Parameter Store, Docker secrets. There should never be a .env file on a production server. Three: always validate required variables at startup so you fail loudly with a clear message instead of mysterious crashes later."`
    },
    {
      type: "code",
      text: `// .env — NEVER commit this file
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=dev-secret-change-in-prod
GOOGLE_CLIENT_ID=123456.apps.googleusercontent.com
PORT=5000

// .env.example — DO commit this (template for teammates)
DATABASE_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
PORT=5000

// .gitignore — non-negotiable
.env
.env.local
.env.*.local

// src/index.js — call dotenv FIRST, before anything else
require('dotenv').config(); // must run before any import that reads process.env
const express = require('express');
const db      = require('./db'); // uses process.env.DATABASE_URL

// Validate required vars at startup — fail fast with a clear message
const required = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
for (const key of required) {
  if (!process.env[key]) throw new Error('Missing required env variable: ' + key);
}`
    },

    // ── package.json deep dive ──
    {
      speaker: "you",
      text: `"What's the actual difference between dependencies and devDependencies? Does it really matter?"`
    },
    {
      speaker: "raj",
      text: `"It matters in production. When you run <em>npm install --production</em> — which is what most deployment pipelines do — it only installs dependencies, not devDependencies. Express, Mongoose, jsonwebtoken — those go in dependencies because your app needs them to run. ESLint, Prettier, Husky, Jest, nodemon — those go in devDependencies because they're only needed on developer machines and in CI. Leaner production bundle, smaller attack surface. A miscategorized package either bloats your production install or breaks it."`
    },
    {
      speaker: "you",
      text: `"What about peerDependencies? I see those in some packages."`
    },
    {
      speaker: "raj",
      text: `"peerDependencies are for library authors. If you're writing a React plugin, you don't bundle your own copy of React — you say 'this plugin expects React to already be installed in the project.' The app using your plugin provides React. As an app developer, you rarely deal with peerDependencies directly — npm just warns you if they're not met."`
    },
    {
      type: "code",
      text: `// package.json — what goes where
{
  "dependencies": {             // needed at RUNTIME in production
    "express":      "^4.19.2",
    "mongoose":     "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt":       "^5.1.0",
    "dotenv":       "^16.4.0"
  },
  "devDependencies": {          // dev and CI only — skipped in production
    "nodemon":       "^3.0.0",
    "eslint":        "^8.57.0",
    "prettier":      "^3.2.0",
    "husky":         "^9.0.0",
    "lint-staged":   "^15.2.0",
    "jest":          "^29.0.0"
  }
}

// Install correctly
npm install express            // goes to dependencies
npm install --save-dev eslint  // goes to devDependencies`
    },

    // ── Semver ──
    {
      speaker: "you",
      text: `"What do the ^ and ~ symbols mean before version numbers? I always just ignore them."`
    },
    {
      speaker: "raj",
      text: `"They control what gets updated when someone runs npm install — this matters more than people realise. Semantic versioning is MAJOR.MINOR.PATCH. Patch is a bug fix, no new features. Minor is new features, backwards compatible. Major is breaking changes. The <em>caret ^</em> means accept any newer version as long as the major number stays the same — so ^4.19.2 can install 4.20.0 but never 5.0.0. The <em>tilde ~</em> is more conservative — only accept patch updates, lock the minor — so ~4.19.2 can install 4.19.9 but not 4.20.0. No symbol means exact version, nothing else."`
    },
    {
      speaker: "you",
      text: `"And package-lock.json — should I commit that?"`
    },
    {
      speaker: "raj",
      text: `"Always commit package-lock.json. It locks the exact version of every installed package including transitive dependencies — dependencies of your dependencies. Without it, two developers running npm install on the same day could get different versions if a patch was released in between. With it, everyone gets identical installs. And in CI pipelines, use <em>npm ci</em> instead of npm install — it reads only the lock file, is faster, and fails if the lock file doesn't match package.json. Never surprises."`
    },
    {
      type: "code",
      text: `// Semver: MAJOR.MINOR.PATCH — e.g. "express": "4.19.2"

"express": "^4.19.2"   // accepts 4.19.3, 4.20.0 — NOT 5.0.0  (caret: lock major)
"express": "~4.19.2"   // accepts 4.19.3, 4.19.9 — NOT 4.20.0 (tilde: lock minor)
"express": "4.19.2"    // exactly 4.19.2, nothing else

// npm install vs npm ci
// npm install — reads package.json, may update lock file
// npm ci      — reads ONLY lock file, fails if mismatch — use in CI/CD

// Check for outdated packages
npx npm-check-updates   // shows what can be updated
npx npm-check-updates -u && npm install  // upgrade everything`
    },

    // ── npm scripts ──
    {
      speaker: "you",
      text: `"I only ever use npm start and npm test. What else can you do with npm scripts?"`
    },
    {
      speaker: "raj",
      text: `"A lot. You can chain scripts with && so they run sequentially — if one fails, the rest don't run. You can define <em>pre</em> and <em>post</em> hooks — if you have a script called 'build', npm automatically runs 'prebuild' before it and 'postbuild' after it. You can run multiple scripts in parallel with the <em>concurrently</em> package — useful for starting your API and your React dev server together with one command. You can pass arguments to the underlying tool with -- double dash."`
    },
    {
      type: "code",
      text: `{
  "scripts": {
    // Pre/post hooks — npm runs these automatically
    "prebuild":  "npm run lint && npm test",    // runs before 'build'
    "build":     "node scripts/build.js",
    "postbuild": "echo Build complete",          // runs after 'build'

    // Sequential — stops on first failure
    "validate":  "npm run lint && npm test && npm run build",

    // Parallel — start API + React dev server together
    "dev":       "concurrently \"nodemon src/\" \"npm run client\"",

    // Pass args through to jest with --
    // Usage: npm run test -- --watch
    "test":      "jest",

    // Cross-platform environment variables (cross-env package)
    "test:ci":   "cross-env NODE_ENV=test jest --coverage --ci"
  }
}`
    },

    // ── CommonJS vs ESM ──
    {
      speaker: "you",
      text: `"I keep getting 'require is not defined' errors in some projects and 'Cannot use import' in others. What's going on?"`
    },
    {
      speaker: "raj",
      text: `"You're hitting the CommonJS vs ES Modules clash. Node originally used CommonJS — require() and module.exports — synchronous, loads at runtime. ES Modules — import and export — is the JavaScript standard, supported by browsers and modern Node. It's static, meaning imports are resolved before the code runs, which enables tree-shaking. In package.json, if you set <em>\"type\": \"module\"</em> all .js files use ESM. Without it, they default to CommonJS. The 'require is not defined' error means you're in an ESM context using CommonJS syntax. The 'Cannot use import' error means the opposite."`
    },
    {
      speaker: "you",
      text: `"Which one should I use for a new Node project?"`
    },
    {
      speaker: "raj",
      text: `"ESM for new projects — it's the standard. But be aware that Jest historically has poor ESM support without extra config, and some older packages are CommonJS-only. The .mjs extension forces ESM on any file regardless of package.json. The .cjs extension forces CommonJS. Use those to override when you need to mix."`
    },
    {
      type: "code",
      text: `// CommonJS — Node's original
const express   = require('express');
const { Router} = require('express');
module.exports  = router;

// ES Modules — JavaScript standard
import express      from 'express';
import { Router }   from 'express';
export default router;
export { fn1, fn2 };

// package.json — controls default for .js files
{ "type": "module" }    // .js files = ESM
{ "type": "commonjs" }  // .js files = CommonJS (default if omitted)

// File extension override — always wins over package.json:
// .mjs → always ESM
// .cjs → always CommonJS

// Why it matters:
// - Tree shaking only works with ESM (static imports)
// - Jest needs extra config for ESM projects
// - Some packages are now ESM-only → causes ERR_REQUIRE_ESM`
    },

    // ── Debugging Node.js ──
    {
      speaker: "you",
      text: `"When something's broken I just add console.logs everywhere. Is that wrong?"`
    },
    {
      speaker: "raj",
      text: `"It works but it's slow. Node has a proper debugger built in. Start your app with <em>node --inspect</em> and open chrome://inspect in Chrome. You get full DevTools — set breakpoints, step through code line by line, inspect the call stack, watch variables. It's the same DevTools you use for frontend, just pointed at your Node process. In VS Code you can do it without Chrome at all — create a launch.json and you get a fully integrated debugger with breakpoints right in your editor."`
    },
    {
      speaker: "you",
      text: `"What about that DEBUG environment variable I've seen in some error logs?"`
    },
    {
      speaker: "raj",
      text: `"That's a gem. Many Node libraries — Express, Mongoose, Sequelize — have verbose internal logging built in that's hidden by default. Set the <em>DEBUG</em> env var to match the library's namespace and all that internal logging appears. Set DEBUG=express:* and you see every routing decision Express makes. Set DEBUG=mongoose:* and you see every query. Incredibly useful when you can't figure out why something behaves unexpectedly."`
    },
    {
      type: "code",
      text: `// Start Node with inspector
node --inspect src/index.js          // open debugger on port 9229
node --inspect-brk src/index.js      // pause on first line, wait for debugger
nodemon --inspect src/index.js       // auto-restart + debugger

// Then open chrome://inspect → click "inspect" under Remote Target

// VS Code — .vscode/launch.json
{
  "configurations": [
    {
      "type":    "node",
      "request": "attach",
      "name":    "Attach to nodemon",
      "port":    9229,
      "restart": true   // re-attach automatically after nodemon restart
    }
  ]
}

// DEBUG env var — verbose internal logging
DEBUG=express:*            nodemon src/  // all Express internal decisions
DEBUG=mongoose:*           nodemon src/  // all Mongoose queries + operations
DEBUG=express:*,mongoose   nodemon src/  // both at once

// Your own debug logging with the 'debug' package
const debug = require('debug')('myapp:auth');
debug('Validating token for userId %s', userId);
// Only shows when: DEBUG=myapp:auth node src/`
    },

    // ── Source maps ──
    {
      speaker: "you",
      text: `"What are source maps? I've seen them mentioned but never really understood why they exist."`
    },
    {
      speaker: "raj",
      text: `"When your code gets compiled by TypeScript or bundled by webpack, the file that actually runs is nothing like what you wrote. If an error happens on line 1, column 4839 of bundle.js that's completely useless for debugging. Source maps are files that map positions in the compiled output back to positions in your original source. They're how error tracking tools like Sentry show you 'error in auth/token.ts line 43' instead of 'error in bundle.min.js line 1'. Enable them in TypeScript with sourceMap: true in tsconfig. In production, upload them to Sentry but don't serve them publicly — they expose your original source code."`
    },
    {
      type: "code",
      text: `// tsconfig.json — enable source maps
{
  "compilerOptions": {
    "sourceMap":     true,   // generates .js.map files
    "inlineSources": true    // embeds original source in map (for Sentry)
  }
}

// webpack.config.js — source map strategy per environment
module.exports = {
  devtool: process.env.NODE_ENV === 'production'
    ? 'source-map'        // full separate .map file — for error tracking
    : 'eval-source-map'   // fast rebuilds in dev — slightly less accurate
};

// Vite — source maps built in for dev, opt-in for production
// vite.config.js
export default { build: { sourcemap: true } };

// The .map file tells your debugger/Sentry:
// "bundle.min.js line 1 col 2847 → src/auth/token.ts line 43"`
    },

    {
      type: "summary",
      points: [
        "ESLint = static code analyser, not just a style checker. Parses AST and finds real bugs.",
        "Prettier = opinionated formatter. Reprints code from scratch. Ends all formatting debates.",
        "Use both: ESLint for logic, Prettier for formatting. Add eslint-config-prettier to stop conflicts.",
        "Husky = Git hooks. pre-commit blocks bad commits regardless of editor or extensions.",
        "lint-staged = runs linters only on staged files. Keeps commits fast on large codebases.",
        "commitlint = enforces conventional commit format. Enables auto-changelogs and semantic versioning.",
        "nodemon = file watcher using OS events, not polling. Restarts Node on file changes. Dev only.",
        "Production = PM2 for process management, clustering, and crash recovery. Not nodemon.",
        "dotenv = file parser that loads .env into process.env. Never commit .env. Validate required vars at startup.",
        "dependencies = runtime. devDependencies = dev/CI only. npm install --production skips devDeps.",
        "^ = accept newer minor/patch. ~ = patch only. No symbol = exact. Always commit package-lock.json.",
        "npm ci = installs from lock file exactly, faster, deterministic. Use this in CI/CD pipelines.",
        "npm scripts = pre/post hooks, sequential with &&, parallel with concurrently.",
        "CommonJS = require/module.exports. ESM = import/export, enables tree-shaking. Don't mix accidentally.",
        "node --inspect = full Chrome DevTools for Node. Set breakpoints, step through, inspect call stack.",
        "DEBUG=library:* = verbose internal logging from Express, Mongoose etc. Invaluable for debugging.",
        "Source maps = map compiled code back to original source. Essential for readable production error tracking."
      ]
    }
  ]
};

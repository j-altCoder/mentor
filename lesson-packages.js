// ─────────────────────────────────────────────────────────────────
//  LESSON: Package & Dependency Management
//  Category: Code Quality & Debugging
// ─────────────────────────────────────────────────────────────────

const LESSON_PACKAGES = {
  category: "Code Quality & Debugging",
  tag: "Package & Dependency Management",
  title: "Everything That Happens When You Run npm install",
  intro: "You run npm install on the new repo. It takes 3 minutes, installs 847 packages, and you didn't write a single one of them. Raj watches you stare at the terminal.",
  scenes: [

    // ── What npm install actually does ──
    {
      speaker: "raj",
      text: `"847 packages. You only have 12 in your package.json. Where did the rest come from?"`
    },
    {
      speaker: "you",
      text: `"Dependencies of dependencies?"`
    },
    {
      speaker: "raj",
      text: `"Exactly — <em>transitive dependencies</em>. Express depends on 5 packages. Each of those depends on more. By the time it resolves the whole tree, you can easily have hundreds of packages from a handful of direct ones. npm builds a <em>dependency tree</em>, resolves version conflicts, downloads everything into node_modules, and records the exact versions of everything — including transitive deps — into package-lock.json. That lock file is what guarantees two developers on different machines get identical installs."`
    },
    {
      type: "analogy",
      text: "npm install = ordering a burger. You ordered 1 item. But the kitchen needs buns from the bakery supplier, lettuce from the farm, sauce from the condiment factory... 847 trucks show up to make your burger."
    },

    // ── npm vs yarn vs pnpm ──
    {
      speaker: "you",
      text: `"Some projects use yarn, some use npm, some use pnpm. Does it actually matter which one?"`
    },
    {
      speaker: "raj",
      text: `"It matters more than people think — and mixing them on the same project causes real problems. They each have their own lock file format. npm uses package-lock.json. yarn uses yarn.lock. pnpm uses pnpm-lock.yaml. If one developer commits a yarn.lock and another runs npm install, you get two lock files that can disagree about versions. Pick one per project and commit the corresponding lock file. The lock file IS the source of truth."`
    },
    {
      speaker: "you",
      text: `"What's actually different between them technically?"`
    },
    {
      speaker: "raj",
      text: `"npm is the default — comes with Node, biggest ecosystem. yarn was created by Facebook to fix npm's early speed and consistency problems — it introduced the lock file concept before npm had it. Today npm v7+ has caught up significantly. <em>pnpm</em> is the interesting one. Instead of copying packages into every project's node_modules, it stores them once in a global content-addressable store and creates hard links. Two projects using the same version of Express share the same files on disk. Dramatically faster installs, far less disk space. The node_modules structure is also stricter — you can't accidentally use a package you didn't declare."`
    },
    {
      type: "code",
      text: `// Lock files — each package manager's format
npm   →  package-lock.json   (npm install)
yarn  →  yarn.lock            (yarn install)
pnpm  →  pnpm-lock.yaml       (pnpm install)

// Never commit multiple lock files — pick one and stick to it
// .gitignore if you're enforcing a specific manager:
yarn.lock      // if you're using npm
package-lock.json  // if you're using yarn

// Enforce a package manager across the team via package.json
{
  "engines": {
    "node": ">=18.0.0",
    "npm":  ">=9.0.0"
  },
  "packageManager": "pnpm@8.15.0"  // used by corepack to enforce pnpm
}

// pnpm — why it's different
// npm/yarn:  project-A/node_modules/express/  (full copy)
//            project-B/node_modules/express/  (another full copy)
//
// pnpm:      ~/.pnpm-store/express@4.19.2/    (stored once globally)
//            project-A/node_modules/express → hard link to store
//            project-B/node_modules/express → same hard link`
    },

    // ── package-lock.json deep dive ──
    {
      speaker: "you",
      text: `"I've heard people say you should always commit package-lock.json. But I've also seen projects where it's in .gitignore. Which is right?"`
    },
    {
      speaker: "raj",
      text: `"Commit it — always, for applications. Not committing the lock file means every developer who clones the repo could install slightly different versions of transitive dependencies. npm install respects the ranges in package.json like ^4.19.2, so it can install 4.19.2 on your machine today and 4.20.1 on a colleague's machine next month. The lock file freezes everything. The only time you'd exclude it is when building a <em>library</em> that other projects depend on — you don't want to force your transitive dep versions onto consumers of your library."`
    },
    {
      speaker: "you",
      text: `"What's actually inside package-lock.json? I've never opened it properly."`
    },
    {
      speaker: "raj",
      text: `"It's a flat map of every single installed package — direct and transitive — with its exact resolved version, the download URL, and a <em>hash of the package contents</em>. That hash is critical. When npm installs a package it downloads it and checks the hash matches what's in the lock file. If someone tampered with the package on the registry, the hash won't match and the install fails. It's supply chain security built into the install process."`
    },
    {
      type: "code",
      text: `// package-lock.json — what's actually in it
{
  "name": "my-app",
  "lockfileVersion": 3,
  "packages": {
    "node_modules/express": {
      "version":  "4.19.2",                         // exact resolved version
      "resolved": "https://registry.npmjs.org/express/-/express-4.19.2.tgz",
      "integrity": "sha512-mj5Xe...",               // ← SHA hash of package contents
      "dependencies": {                              // express's own dependencies
        "accepts": "~1.3.8",
        "body-parser": "1.20.2"
        // ...
      }
    },
    "node_modules/accepts": {                        // transitive dep — also locked
      "version": "1.3.8",
      "resolved": "...",
      "integrity": "sha512-..."
    }
  }
}

// npm install vs npm ci — the critical difference
// npm install  — reads package.json ranges, may update lock file
// npm ci       — reads ONLY lock file, fails if package.json and lock file disagree
//             — faster (skips resolution step), deterministic, never updates lock file
//             — always use npm ci in CI/CD pipelines`
      
    },

    // ── npm ci vs npm install ──
    {
      speaker: "you",
      text: `"When would I ever use npm ci over npm install in my daily work?"`
    },
    {
      speaker: "raj",
      text: `"In your daily work, npm install is fine — you want it to update the lock file when you add packages. npm ci is for <em>automated environments</em> — CI/CD pipelines, Docker builds, production deploys. It's faster because it skips the dependency resolution step entirely. It always deletes node_modules before installing. And it fails loudly if package.json and package-lock.json disagree — which catches 'I forgot to commit the lock file' early rather than shipping unexpected dependency versions to production."`
    },
    {
      type: "code",
      text: `// When to use each
// Local development
npm install                    // adds/updates packages, updates lock file
npm install express            // adds new package, updates lock file
npm install --save-dev jest    // adds to devDependencies

// CI/CD pipeline — Dockerfile, GitHub Actions, etc.
npm ci                         // fast, deterministic, never touches lock file

// Dockerfile example
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production   // install only production deps, from lock file exactly
COPY . .
CMD ["node", "src/index.js"]

// GitHub Actions
- name: Install dependencies
  run: npm ci   // not npm install`
      
    },

    // ── Peer dependencies ──
    {
      speaker: "you",
      text: `"I keep getting 'peer dependency' warnings when I install certain packages. What are they and should I care?"`
    },
    {
      speaker: "raj",
      text: `"peerDependencies are a contract from a library to its users. It's the library saying: 'I need React to work, but I'm not going to bundle my own copy — I expect you to have it installed.' If you install a React component library, it has React as a peerDependency. The component library expects to share your app's version of React. If you don't have it, or have an incompatible version, npm warns you. The reason this exists is to prevent two different versions of React loading in the same app — which causes subtle bugs or outright crashes. You should always care about peer dependency warnings — they're telling you something in your dependency tree is incompatible."`
    },
    {
      type: "code",
      text: `// A React component library's package.json
{
  "name": "my-component-library",
  "peerDependencies": {
    "react":     ">=17.0.0",   // requires React 17+ — but YOU provide it
    "react-dom": ">=17.0.0"
  },
  "devDependencies": {
    "react":     "^18.0.0",    // used internally for testing the library
    "react-dom": "^18.0.0"
  }
  // Notice: react is NOT in dependencies — it won't bundle its own copy
}

// As an app developer — you provide React:
{
  "dependencies": {
    "react":               "^18.0.0",   // you own this
    "my-component-library": "^2.0.0"   // this uses YOUR react
  }
}

// npm v7+ auto-installs peer deps
// npm v6 and yarn — you install them manually, only warnings otherwise

// Check what peers are needed
npm info some-package peerDependencies`
      
    },

    // ── Dependency resolution conflicts ──
    {
      speaker: "you",
      text: `"What happens when two packages need different versions of the same dependency? Like package A needs lodash 3 and package B needs lodash 4?"`
    },
    {
      speaker: "raj",
      text: `"npm and yarn handle this differently. npm v3+ uses a <em>flat node_modules structure</em>. It tries to hoist one version to the top level — usually whichever is declared first or most commonly needed — and nests conflicting versions inside the package that needs them. So you might have lodash@4 at node_modules/lodash and lodash@3 tucked inside node_modules/package-A/node_modules/lodash. Both work, but you're shipping two copies of lodash in your bundle — that's bloat. pnpm handles this more strictly and makes conflicts more visible, which is actually a feature because it forces you to resolve them rather than silently duplicating."`
    },
    {
      type: "code",
      text: `// Dependency hoisting — npm's flat structure
node_modules/
  lodash/                     ← lodash@4 hoisted to top (most common version)
  package-a/
    node_modules/
      lodash/                 ← lodash@3 nested (can't use the hoisted v4)
  package-b/                  ← uses hoisted lodash@4 ✓

// Checking for duplicate packages in your bundle
npx npm-dedupe               // npm tries to flatten duplicates
npx depcheck                 // finds unused and missing dependencies

// Visualise your dependency tree
npm ls                       // show full dependency tree
npm ls lodash                // show where lodash comes from and what version
npm ls --depth=1             // direct dependencies only

// Find why a package is installed (who depends on it)
npm why lodash               // shows the chain: your-app → package-a → lodash`
      
    },

    // ── Security — audit ──
    {
      speaker: "you",
      text: `"I ran npm audit once and got 43 vulnerabilities. I panicked and closed the terminal. What should I actually do with that?"`
    },
    {
      speaker: "raj",
      text: `"Ha — don't panic, but don't ignore it either. npm audit checks every package in your tree against a database of known vulnerabilities. Each finding has a severity: critical, high, moderate, low. First, run <em>npm audit --fix</em> — it automatically upgrades packages to patched versions where it can do so without breaking your semver ranges. For the rest, look at the severity and whether the vulnerable code path is actually reachable in your app. A critical vulnerability in a package you use only in dev scripts is less urgent than a moderate one in your auth middleware."`
    },
    {
      speaker: "you",
      text: `"What if npm audit --fix breaks something?"`
    },
    {
      speaker: "raj",
      text: `"Use <em>npm audit --fix --dry-run</em> first — it shows you what it would change without actually doing it. If a fix requires a major version bump, npm won't do it automatically because it might have breaking changes. You have to handle that manually — read the changelog, test thoroughly. The broader lesson: <em>keep dependencies up to date regularly</em>, in small batches. Letting months of updates pile up and then trying to fix 43 vulnerabilities at once is what causes panic. Run audits in your CI pipeline so every PR gets checked."`
    },
    {
      type: "code",
      text: `// npm audit workflow
npm audit                      // show all vulnerabilities with details
npm audit --json               // machine-readable output for CI
npm audit fix                  // auto-fix what's safe to fix
npm audit fix --force          // also fix things that need major version bumps (careful!)
npm audit fix --dry-run        // preview changes before applying

// In CI — fail the build if high/critical vulnerabilities exist
npm audit --audit-level=high   // exits with error code if high+ vulns found

// .github/workflows/security.yml
- name: Security audit
  run: npm audit --audit-level=moderate

// Snyk — more powerful alternative to npm audit
npx snyk test                  // checks against Snyk's larger vuln database
npx snyk monitor               // continuously monitors your project

// Check a specific package for known issues
npx is-my-node-vulnerable      // checks your Node version
npm view express dist-tags      // see all available versions`
      
    },

    // ── Publishing vs using packages ──
    {
      speaker: "you",
      text: `"What does the 'private': true in package.json actually do?"`
    },
    {
      speaker: "raj",
      text: `"It prevents you from accidentally running npm publish and pushing your app to the public npm registry. Without it, if someone on the team runs npm publish thinking they're releasing an internal package, it could expose your source code publicly. Always set <em>'private': true</em> in application code. Only library packages that are meant to be published should omit it. Related — the <em>files</em> field in package.json controls which files get included when you do publish a package. Without it, everything gets published including tests, configs, and source maps."`
    },
    {
      type: "code",
      text: `// package.json — private prevents accidental publishing
{
  "name": "my-app",
  "private": true,           // ← npm publish will fail with an error
  "version": "1.0.0"
}

// For a library you DO want to publish:
{
  "name": "my-component-lib",
  "version": "1.2.3",
  "main":    "dist/index.js",   // CommonJS entry point
  "module":  "dist/index.mjs",  // ESM entry point
  "types":   "dist/index.d.ts", // TypeScript types
  "files": [                    // ONLY these files/folders get published
    "dist/",
    "README.md"
  ]
  // Everything else — src/, tests/, .eslintrc — stays off npm
}`
      
    },

    // ── npx ──
    {
      speaker: "you",
      text: `"What's the difference between npm and npx? I use npx a lot but I'm not sure what it's doing."`
    },
    {
      speaker: "raj",
      text: `"npm is for managing packages — installing, updating, publishing. npx is for <em>running</em> packages without permanently installing them. When you run npx create-react-app, it downloads the latest version of create-react-app, runs it, and then discards it. No global install cluttering your machine. If the package is already installed locally in your project's node_modules, npx runs that version — so npx eslint runs your project's specific version of ESLint, not some globally installed one that might be a different version. That's why npx is preferred over global installs for most tools."`
    },
    {
      type: "code",
      text: `// npm — manages packages
npm install express            // install into project
npm install -g nodemon         // global install (avoid for most tools)
npm uninstall express
npm update                     // update all packages within semver ranges

// npx — runs packages
npx create-react-app my-app    // download, run, discard (no permanent install)
npx prisma migrate dev         // run project's local prisma
npx eslint src/                // run project's local eslint (not global)

// Why npx over global installs:
// Global:  npm install -g eslint  → one version for all projects, can conflict
// npx:     uses project's local version  → each project uses its own version

// npx --yes flag — skip the "install this?" prompt in scripts
npx --yes some-package

// Running a specific version
npx eslint@8 src/              // temporarily run eslint version 8
npx node@18 script.js          // run script with a specific node version`
      
    },

    // ── Monorepos ──
    {
      speaker: "you",
      text: `"I keep hearing about monorepos. What problem do they solve and how does the dependency management work?"`
    },
    {
      speaker: "raj",
      text: `"A <em>monorepo</em> keeps multiple related packages or apps in a single repository. Think of a company that has a React frontend, a Node API, and a shared utility library — instead of three repos, one repo with three packages. The big benefit: when you change the shared library, you can test all packages that depend on it in the same PR, atomically. The dependency management challenge: you don't want each package to have its own copy of React. npm <em>workspaces</em>, yarn workspaces, and pnpm workspaces solve this — they hoist shared dependencies to the root node_modules so all packages share them, saving disk space and ensuring they all use the same version."`
    },
    {
      type: "code",
      text: `// npm workspaces — monorepo setup
// Root package.json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",    // all folders under packages/
    "apps/*"         // all folders under apps/
  ]
}

// Folder structure
my-monorepo/
  package.json         ← root (workspaces config)
  node_modules/        ← shared deps hoisted here
  packages/
    shared-utils/
      package.json     ← { "name": "@myco/utils" }
      src/
    shared-types/
      package.json     ← { "name": "@myco/types" }
  apps/
    api/
      package.json     ← depends on "@myco/utils"
    web/
      package.json     ← depends on "@myco/utils", "@myco/types"

// Install a dep in a specific workspace
npm install express --workspace=apps/api

// Run a script in all workspaces
npm run build --workspaces

// Reference a local package as a dependency
// apps/api/package.json
{ "dependencies": { "@myco/utils": "*" } }  // * = use whatever version is in the repo`
      
    },

    // ── Dependency security supply chain ──
    {
      speaker: "you",
      text: `"I heard about that incident where a popular npm package was hijacked and started stealing crypto. How does that even happen?"`
    },
    {
      speaker: "raj",
      text: `"<em>Supply chain attacks</em>. You trust a package, the package maintainer's account gets compromised, attacker publishes a malicious version, everyone who runs npm install gets the malware. There have been several high-profile ones — event-stream in 2018 was the famous one. There are a few defences. One — lock your versions exactly in the lock file and use npm ci so you never silently pull a new version. Two — run npm audit regularly. Three — use <em>Socket.dev</em> or similar tools that analyse packages for suspicious behaviour before install. Four — be selective about what you install. Adding a package for a 3-line utility function means you now trust that maintainer's security practices forever."`
    },
    {
      speaker: "raj",
      text: `"There's a famous quote in the Node community: 'left-pad'. In 2016, a developer unpublished a tiny 11-line package from npm that padded strings. Hundreds of projects — including React and Babel — broke instantly because they depended on it transitively. The lesson: be thoughtful about your dependency tree. A deep tree of tiny packages means many single points of failure. For trivial utilities, ask yourself — is this really worth a dependency?"`
    },
    {
      type: "code",
      text: `// Strategies to reduce dependency risk

// 1. Check a package before installing
npx npm-check        // interactive outdated/unused package checker
npx cost-of-modules  // shows download size of each package

// 2. Check bundle impact before adding
npx bundlephobia some-package   // shows bundle size impact

// 3. Lock exact versions for critical security packages
{
  "dependencies": {
    "jsonwebtoken": "9.0.2"   // exact, no ^ or ~ for auth-critical packages
  }
}

// 4. Use npm pack to inspect what a package actually contains before trusting it
npm pack some-package          // downloads and tarballs it without installing
tar -tzf some-package-1.0.0.tgz  // list what's inside

// 5. overrides — force a specific version of a transitive dep
// Useful when a transitive dep has a vulnerability and the parent hasn't updated yet
{
  "overrides": {
    "some-vulnerable-transitive-dep": "2.1.0"  // force this version for everyone
  }
}`
      
    },

    // ── Cleaning up ──
    {
      speaker: "you",
      text: `"Our package.json has grown over time and I'm pretty sure we have packages nobody uses anymore. How do you clean that up?"`
    },
    {
      speaker: "raj",
      text: `"<em>depcheck</em> is the tool for this. It scans your code and reports packages in package.json that are never imported anywhere, and packages being imported that aren't declared. Run it, review the output — don't blindly delete everything it flags because some packages are used in config files or scripts, not in source code, which depcheck might miss. After removing packages, always run your full test suite and build to confirm nothing broke. Also useful: <em>npm ls</em> to visualise the full tree and understand why a package is installed at all."`
    },
    {
      type: "code",
      text: `// Find and remove unused dependencies
npx depcheck                   // lists unused deps and missing ones

// Output example:
// Unused dependencies
//   * lodash                  ← in package.json but never imported
//   * moment                  ← replaced by date-fns but not removed
// Missing dependencies
//   * uuid                    ← imported in code but not in package.json

// After removing from package.json, clean install
rm -rf node_modules
npm install                    // fresh install without the removed packages

// Or just prune what's not in package.json anymore
npm prune                      // removes packages not listed in package.json

// Visualise full dep tree
npm ls                         // full tree (can be huge)
npm ls --depth=0               // direct dependencies only — much cleaner
npm ls some-package            // find where a specific package comes from`
      
    },

    {
      type: "summary",
      points: [
        "847 packages from 12 deps = transitive dependencies. npm resolves the whole tree and records it in the lock file.",
        "npm = default. yarn = faster, lockfile pioneer. pnpm = global content store, hard links, strictest — least disk space.",
        "Each package manager has its own lock file format. Pick one per project, commit its lock file, never mix.",
        "package-lock.json locks exact versions + SHA hashes of every package. Hash mismatch = install fails — supply chain protection.",
        "npm install = resolves + may update lock. npm ci = reads lock file only, deterministic, faster. Use npm ci in CI/CD.",
        "peerDependencies = library says 'you provide this'. Prevents duplicate versions of React etc. Always fix peer dep warnings.",
        "npm's flat node_modules hoists common versions, nests conflicts. Duplicate packages = bundle bloat.",
        "npm audit finds known CVEs. Run --fix for auto-patches. Run in CI with --audit-level=high to fail builds.",
        "private:true prevents accidental npm publish. files field controls what gets included in a published package.",
        "npx runs packages without installing globally. Uses project-local version if it exists — prefer over global installs.",
        "Workspaces = monorepo support. Shared deps hoisted to root. Packages reference each other with local paths.",
        "Supply chain attacks = compromised maintainer account → malicious publish. Defences: lock files, audit, selective deps.",
        "depcheck = finds unused and undeclared dependencies. npm prune = removes what's not in package.json."
      ]
    }
  ]
};

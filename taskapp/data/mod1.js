// ─── MODULE 1: code quality & git hygiene ────────────────────────────────────
STEPS.push(

  { /* step 23 — intro */
    mod: 1,
    alex: [
      "welcome to module 1. foundation is solid — now let's add the layer that keeps it that way automatically.",
      "here's the problem we're solving: on a team, code quality degrades slowly. one developer skips a semicolon, another uses double quotes instead of single, someone writes a commit message that's just 'fix stuff'. none of it is catastrophic individually, but over time the codebase becomes inconsistent and the git history becomes unreadable.",
      "the tools we're setting up today enforce standards automatically — no relying on people to remember, no discussions in code review about formatting. the pipeline catches it before it ever gets committed.",
    ],
    nextOn: 'ok',
    after: "type 'ok' to see what we're setting up.",
  },

  { /* step 24 — module outline */
    mod: 1,
    alex: [
      "here's everything we're wiring up. each tool has a specific job — they don't overlap, they complement each other.",
    ],
    callout: {
      type: 'info',
      label: "module 1 covers",
      items: [
        "Prettier — opinionated code formatter, ends all style debates",
        "ESLint — catches bugs, enforces patterns, finds problems Prettier ignores",
        "ESLint + Prettier integration — configured so they never conflict",
        "Husky — runs scripts at specific points in the git workflow",
        "lint-staged — runs linters only on files being committed, not the whole project",
        "Commitlint — validates every commit message follows conventional commits",
        ".npmrc — project-level npm config to pin versions and enforce engines",
      ],
    },
    nextOn: 'lets go',
    after: "type 'lets go' to start.",
  },

  { /* step 25 — prettier vs eslint quiz */
    mod: 1,
    alex: [
      "before installing anything, let's get clear on what each tool actually does. people often conflate Prettier and ESLint because both 'fix code', but they operate at completely different levels.",
      "Prettier is purely about how the code looks — whitespace, quotes, semicolons, line length, bracket placement. it doesn't care if your variable is unused or if you're importing something you don't use. ESLint is about what the code does — it catches bugs, finds unused variables, enforces import ordering, and can catch patterns that will cause bugs at runtime.",
    ],
    after: "check your understanding.",
    task: {
      type: 'quiz',
      question: "which tool would catch an unused variable that's defined but never referenced anywhere?",
      multi: false,
      options: [
        "Prettier — it reformats the file and removes dead code",
        "ESLint — the no-unused-vars rule flags variables that are declared but never used",
        "both — they both analyse code for problems",
        "neither — that's a TypeScript concern, not a linting concern",
      ],
      correct: [1],
      explanation: "Prettier never changes the logic of your code — it only changes formatting. ESLint's no-unused-vars rule specifically catches declared variables that are never referenced. this is why we need both: Prettier handles style (and wins all arguments about it), ESLint handles code quality. they do different jobs.",
      hint: "think about which tool actually reads and understands the meaning of your code vs which one just reformats it.",
    },
  },

  { /* step 26 — install prettier */
    mod: 1,
    alex: [
      "let's install Prettier first. it goes in devDependencies because it only runs locally and in CI — never in production. your Express server doesn't need to know how to format code.",
      "one thing worth knowing: Prettier is intentionally opinionated. it makes decisions for you and gives you very few options to change them. that's the point — it ends debates. you don't get to argue about single vs double quotes forever; Prettier decides and everyone moves on.",
    ],
    after: "install prettier as a dev dependency.",
    task: {
      type: 'cmd',
      hint: "npm install with --save-dev (or -D) and the package name 'prettier'",
      answer: "npm install --save-dev prettier",
      check(input) {
        const ok = input.includes('prettier') && (input.includes('--save-dev') || input.includes('-D'));
        return {
          ok,
          msg: ok ? "prettier installed." : "install prettier as a dev dependency: npm install --save-dev prettier",
        };
      },
    },
  },

  { /* step 27 — .prettierrc */
    mod: 1,
    alex: [
      "now create the Prettier config. a few things to know about these options: 'singleQuote: true' means strings use single quotes — this is the Node.js convention. 'semi: true' keeps semicolons — some people remove them, but explicit is clearer. 'trailingComma: es5' adds trailing commas in arrays and objects where ES5 allows it — this makes git diffs cleaner because adding a new item doesn't change the previous line.",
      "'printWidth: 100' is the line length target. 80 is the old terminal width standard, but modern screens are wider and 100 gives you more room without making lines unreadable. Prettier will try to fit things on one line under this length, and wrap when it exceeds it.",
      "these settings are opinionated choices — the specifics matter less than having them set consistently. once Prettier is configured, every file in the project will conform to these rules.",
    ],
    after: "create .prettierrc at the project root.",
    task: {
      type: 'code',
      file: '.prettierrc',
      lang: 'json',
      hint: "a JSON object with: singleQuote: true, semi: true, tabWidth: 2, trailingComma: 'es5', printWidth: 100, bracketSpacing: true, arrowParens: 'always'",
      answer:
`{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`,
      check(input) {
        const ok =
          input.includes('singleQuote') &&
          input.includes('semi') &&
          input.includes('tabWidth');
        return {
          ok,
          msg: ok ? "prettier config created." : "include at least singleQuote, semi, and tabWidth in the config object.",
        };
      },
    },
  },

  { /* step 28 — .prettierignore */
    mod: 1,
    alex: [
      "Prettier also needs a .prettierignore — same concept as .gitignore. there are certain things you never want Prettier to touch: build output (it's generated, reformatting it is pointless and would break things), node_modules (obvious), and lock files like package-lock.json (these are machine-generated and Prettier will make a mess of them).",
    ],
    after: "create .prettierignore at the project root.",
    task: {
      type: 'code',
      file: '.prettierignore',
      lang: 'properties',
      hint: "ignore node_modules, dist, build, coverage, .next, *.lock files, package-lock.json, and minified files (*.min.js, *.min.css)",
      answer:
`node_modules
dist
build
coverage
.next
*.lock
package-lock.json
*.min.js
*.min.css`,
      check(input) {
        const ok = input.includes('node_modules') && input.includes('dist');
        return {
          ok,
          msg: ok ? "prettierignore created." : "ignore at least node_modules and dist/build output.",
        };
      },
    },
  },

  { /* step 29 — install eslint */
    mod: 1,
    alex: [
      "now ESLint. we're installing three packages together. 'eslint' is the core linter. 'eslint-config-prettier' is a config that disables all ESLint rules that would conflict with Prettier's formatting — without this, you'd get ESLint errors about formatting that Prettier just overrides anyway. 'eslint-plugin-import' gives us rules for keeping imports clean and ordered.",
      "the reason eslint-config-prettier is necessary: both ESLint and Prettier can have opinions about things like semicolons and quotes. if they disagree, you get a loop — ESLint flags it, Prettier fixes it, ESLint flags it again. eslint-config-prettier ends that loop by turning off ESLint's formatting-related rules so Prettier owns that territory completely.",
    ],
    after: "install all three ESLint packages as dev dependencies.",
    task: {
      type: 'cmd',
      hint: "npm install -D eslint eslint-config-prettier eslint-plugin-import",
      answer: "npm install --save-dev eslint eslint-config-prettier eslint-plugin-import",
      check(input) {
        const ok =
          input.includes('eslint') &&
          input.includes('eslint-config-prettier') &&
          (input.includes('--save-dev') || input.includes('-D'));
        return {
          ok,
          msg: ok ? "eslint and plugins installed." : "install eslint, eslint-config-prettier, and eslint-plugin-import together as dev dependencies.",
        };
      },
    },
  },

  { /* step 30 — .eslintrc.json */
    mod: 1,
    alex: [
      "now the ESLint config. the 'extends' array is the key part — order matters here. 'eslint:recommended' enables a core set of rules that catch common bugs. 'plugin:import/recommended' adds import-related rules. 'prettier' must be last — it disables any rules that conflict with Prettier's formatting. if prettier isn't last, another config could re-enable those conflicting rules.",
      "the rules block has a few important ones. 'no-console: warn' means console.log() triggers a warning — not an error, because it's useful in dev, but you'll see a warning so you don't forget to remove it before committing. 'no-unused-vars' is an error for any variable you declare but never use — with an exception for variables prefixed with _ (that convention signals intentionally unused, like function parameters you have to declare but don't need).",
      "import/order enforces a consistent import structure: Node built-ins first (like 'path', 'fs'), then external packages (like 'express'), then internal project files. it makes the top of every file predictably structured.",
    ],
    after: "create .eslintrc.json at the project root.",
    task: {
      type: 'code',
      file: '.eslintrc.json',
      lang: 'json',
      hint: "set env for node, es2022, and browser. extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'] — prettier MUST be last. plugins: ['import']. parserOptions with ecmaVersion: 'latest' and sourceType: 'module'. rules: no-console warn, no-unused-vars error with argsIgnorePattern ^_, import/order error with group ordering.",
      answer:
`{
  "env": {
    "node": true,
    "es2022": true,
    "browser": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:import/recommended",
    "prettier"
  ],
  "plugins": ["import"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal"],
        "newlines-between": "always"
      }
    ],
    "import/no-unresolved": "off"
  }
}`,
      check(input) {
        const ok =
          input.includes('eslint:recommended') &&
          input.includes('prettier') &&
          input.includes('"rules"');
        return {
          ok,
          msg: ok ? "eslint configured correctly." : "make sure 'prettier' is last in extends, and include a rules block.",
        };
      },
    },
  },

  { /* step 31 — prettier last quiz */
    mod: 1,
    alex: [
      "you extended 'prettier' last in the ESLint config. i want to make sure you really understand what would break if you put it somewhere else — because this is a common mistake.",
    ],
    after: "answer this.",
    task: {
      type: 'quiz',
      question: "what would happen if you put 'prettier' first in the extends array instead of last?",
      multi: false,
      options: [
        "nothing — the order of extends doesn't affect the final rules",
        "prettier would run before eslint, causing a speed improvement",
        "configs that come after prettier could re-enable formatting rules that conflict with it — causing lint errors on code that prettier already formatted correctly",
        "eslint would refuse to run and throw a config error",
      ],
      correct: [2],
      explanation: "extends arrays are processed in order, and later configs override earlier ones. if prettier comes first, then eslint:recommended comes after it and re-enables all the formatting rules that prettier disabled. you'd end up with ESLint flagging perfectly formatted code. by putting prettier last, nothing can override its disabling of the formatting rules.",
      hint: "think about how array order affects what overrides what.",
    },
  },

  { /* step 32 — husky intro */
    mod: 1,
    alex: [
      "now the automation layer — this is where things get interesting. Husky is a tool that lets you run scripts at specific points in the git workflow. these points are called git hooks.",
      "git has hooks for all kinds of events: before a commit is created (pre-commit), after a commit message is written (commit-msg), before a push (pre-push), and more. normally, git hooks are shell scripts that you'd put manually in .git/hooks/ — but that folder isn't tracked by git, so hooks don't get shared with the team. Husky solves that by storing hooks in .husky/ (which is tracked) and telling git to look there.",
      "we'll use two hooks: pre-commit (to run lint-staged before any commit goes through) and commit-msg (to validate the commit message format). if either hook fails, the commit is aborted.",
    ],
    after: "install husky as a dev dependency.",
    task: {
      type: 'cmd',
      hint: "npm install -D husky",
      answer: "npm install --save-dev husky",
      check(input) {
        const ok = input.includes('husky') && (input.includes('--save-dev') || input.includes('-D'));
        return {
          ok,
          msg: ok ? "husky installed." : "install husky as a dev dependency.",
        };
      },
    },
  },

  { /* step 33 — husky init */
    mod: 1,
    alex: [
      "initialise Husky. this command does two things: creates the .husky/ directory where your hook scripts will live, and adds a 'prepare' script to your package.json.",
      "the prepare script is important — it runs automatically when anyone does npm install on the project. that means a new developer clones the repo, runs npm install, and Husky is set up automatically. they don't have to do anything special. the hooks are just there.",
      "after running this, you'll see a .husky/ folder in your project root with a default pre-commit file. we'll replace its contents in a moment.",
    ],
    after: "run the husky init command.",
    task: {
      type: 'cmd',
      hint: "npx husky init",
      answer: "npx husky init",
      check(input) {
        const ok = input.includes('husky') && input.includes('init');
        return {
          ok,
          msg: ok ? "husky initialised — .husky/ directory created." : "run npx husky init to set up the .husky directory and prepare script.",
        };
      },
    },
  },

  { /* step 34 — git hooks quiz */
    mod: 1,
    alex: [
      "let's make sure the git hooks mental model is clear before we wire everything up.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "you write some code, run 'git commit -m \"feat: add login\"'. in what order do these events happen?",
      multi: false,
      options: [
        "commit is created → pre-commit hook runs → commit-msg hook runs",
        "pre-commit hook runs → commit is created → commit-msg hook runs",
        "pre-commit hook runs → commit-msg hook runs → commit is created",
        "commit-msg hook runs → pre-commit hook runs → commit is created",
      ],
      correct: [2],
      explanation: "pre-commit fires first — before git creates the commit object or writes the message. this is where we run linting. if it fails, the commit never happens. if it passes, git creates the commit object and fires commit-msg, where we validate the message format. if that also passes, the commit is finalised. both hooks must pass for any commit to succeed.",
      hint: "think about what makes logical sense: you'd want to check the code before writing the commit, and check the message before finalising it.",
    },
  },

  { /* step 35 — install lint-staged */
    mod: 1,
    alex: [
      "here's a practical problem: if we run ESLint on the entire project before every commit, it gets slower and slower as the project grows. on a large codebase that could be 30+ seconds for every single commit. nobody will tolerate that.",
      "lint-staged is the solution. instead of linting everything, it only lints the files that are currently staged for the commit — the files you actually changed. on most commits that's 1-5 files. the feedback is instant.",
      "it also handles the write-back automatically. if Prettier reformats a file, lint-staged stages the reformatted version for you. you don't have to manually re-add it.",
    ],
    after: "install lint-staged as a dev dependency.",
    task: {
      type: 'cmd',
      hint: "npm install -D lint-staged",
      answer: "npm install --save-dev lint-staged",
      check(input) {
        const ok = input.includes('lint-staged') && (input.includes('--save-dev') || input.includes('-D'));
        return {
          ok,
          msg: ok ? "lint-staged installed." : "install lint-staged as a dev dependency.",
        };
      },
    },
  },

  { /* step 36 — lint-staged config */
    mod: 1,
    alex: [
      "configure lint-staged in package.json. the config is a map: file patterns on the left, arrays of commands to run on matching files on the right.",
      "for JS and TS files we run 'eslint --fix' first (which auto-fixes everything fixable and errors on the rest), then 'prettier --write' to format. for JSON, markdown, and CSS files we only run Prettier — ESLint doesn't apply to those.",
      "the reason we run eslint before prettier: ESLint's auto-fix might change some things (like removing unused imports), and we want Prettier to have the final word on formatting after those changes. order matters.",
    ],
    after: "add the lint-staged configuration to package.json.",
    task: {
      type: 'code',
      file: 'package.json',
      lang: 'json',
      context:
`{
  "name": "mern-tasks",
  "version": "1.0.0",
  "description": "A production-grade MERN stack task management app",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "concurrently \\"npm run dev --workspace=server\\" \\"npm run dev --workspace=client\\"",
    "build": "npm run build --workspace=client",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "echo \\"no tests yet\\"",
    "prepare": "husky"
  },
  "keywords": [],
  "author": "",
  "license": "MIT"
}`,
      hint: "add a top-level 'lint-staged' key. map '*.{js,jsx,ts,tsx}' to ['eslint --fix', 'prettier --write'], and '*.{json,md,css,scss,html}' to ['prettier --write']",
      answer:
`{
  "name": "mern-tasks",
  "version": "1.0.0",
  "description": "A production-grade MERN stack task management app",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "concurrently \\"npm run dev --workspace=server\\" \\"npm run dev --workspace=client\\"",
    "build": "npm run build --workspace=client",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "echo \\"no tests yet\\"",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css,scss,html}": [
      "prettier --write"
    ]
  },
  "keywords": [],
  "author": "",
  "license": "MIT"
}`,
      check(input) {
        const ok =
          input.includes('lint-staged') &&
          input.includes('eslint --fix') &&
          input.includes('prettier --write');
        return {
          ok,
          msg: ok ? "lint-staged config added to package.json." : "add a 'lint-staged' key at the top level that maps file globs to arrays of commands.",
        };
      },
    },
  },

  { /* step 37 — pre-commit hook */
    mod: 1,
    alex: [
      "now wire lint-staged into the pre-commit hook. the .husky/pre-commit file is a shell script — git executes it verbatim before creating a commit. if it exits with a non-zero code (i.e. if any command in it fails), the commit is aborted.",
      "the entire file is just one line: 'npx lint-staged'. when git runs this hook, lint-staged kicks in, finds all the staged files, runs the appropriate commands on them, and either passes (commit proceeds) or fails (commit is aborted with an error message telling you what to fix).",
    ],
    after: "update .husky/pre-commit to run lint-staged.",
    task: {
      type: 'code',
      file: '.husky/pre-commit',
      lang: 'bash',
      hint: "the file should contain one line: npx lint-staged",
      answer: `npx lint-staged`,
      check(input) {
        const ok = input.includes('lint-staged');
        return {
          ok,
          msg: ok ? "pre-commit hook wired to lint-staged." : "the pre-commit file should just contain: npx lint-staged",
        };
      },
    },
  },

  { /* step 38 — commitlint intro */
    mod: 1,
    alex: [
      "last piece: commitlint. this validates every commit message against a format called conventional commits. you've already seen this format — 'chore: initial project setup' was a conventional commit.",
      "the format is: type(optional-scope): short description. valid types are feat (new feature), fix (bug fix), chore (maintenance), docs (documentation changes), style (formatting only), refactor (code restructure without behaviour change), test (adding tests), build (build system changes), ci (CI config changes). lowercase, present tense, no period at the end.",
      "why does this matter? two big reasons: first, your git log becomes a readable changelog — you can scan it and immediately understand what changed. second, automated tools (like release-please or semantic-release) can read conventional commits and automatically generate changelogs and version bumps. we'll use this later in deployment.",
    ],
    after: "install the commitlint CLI and the conventional config package.",
    task: {
      type: 'cmd',
      hint: "npm install -D @commitlint/cli @commitlint/config-conventional",
      answer: "npm install --save-dev @commitlint/cli @commitlint/config-conventional",
      check(input) {
        const ok =
          input.includes('@commitlint/cli') &&
          input.includes('@commitlint/config-conventional') &&
          (input.includes('--save-dev') || input.includes('-D'));
        return {
          ok,
          msg: ok ? "commitlint installed." : "install both @commitlint/cli and @commitlint/config-conventional as dev dependencies.",
        };
      },
    },
  },

  { /* step 39 — commitlint config */
    mod: 1,
    alex: [
      "create the commitlint config. it extends @commitlint/config-conventional, which defines all the rules for the conventional commits standard — valid types, required format, max line length, etc.",
      "we're using ES module syntax (export default) because we set 'type: module' in package.json. if your project uses CommonJS, it'd be module.exports instead. just one line of actual config — the entire conventional commits ruleset comes from the extended config.",
    ],
    after: "create commitlint.config.js at the root.",
    task: {
      type: 'code',
      file: 'commitlint.config.js',
      lang: 'javascript',
      hint: "export default an object with extends: ['@commitlint/config-conventional']",
      answer:
`export default {
  extends: ['@commitlint/config-conventional'],
};`,
      check(input) {
        const ok =
          (input.includes('export default') || input.includes('module.exports')) &&
          input.includes('@commitlint/config-conventional');
        return {
          ok,
          msg: ok ? "commitlint config created." : "export a config object that extends '@commitlint/config-conventional'.",
        };
      },
    },
  },

  { /* step 40 — commit-msg hook */
    mod: 1,
    alex: [
      "wire commitlint to the commit-msg hook. this hook is different from pre-commit — git passes it a single argument: the path to a temporary file that contains the commit message the developer wrote.",
      "the '$1' in the command is that file path argument. commitlint reads that file, parses the message, and validates it against the conventional commits rules. if the message is 'fix stuff' or 'wip' — rejected. if it's 'fix(auth): handle expired JWT token' — passes.",
      "the '--no --' part tells npx not to install the package if it's missing (it should already be installed), and '--' separates npx arguments from commitlint arguments. it's a bit verbose but it's the recommended pattern to avoid issues.",
    ],
    after: "create .husky/commit-msg with the commitlint validation command.",
    task: {
      type: 'code',
      file: '.husky/commit-msg',
      lang: 'bash',
      hint: "npx --no -- commitlint --edit followed by $1 (the file path argument git passes to this hook)",
      answer: `npx --no -- commitlint --edit $1`,
      check(input) {
        const ok = input.includes('commitlint') && input.includes('--edit');
        return {
          ok,
          msg: ok ? "commit-msg hook configured." : "the commit-msg hook should run: npx --no -- commitlint --edit $1",
        };
      },
    },
  },

  { /* step 41 — conventional commits quiz */
    mod: 1,
    alex: [
      "let's test your conventional commits recognition. this will be rejected by commitlint — you need to be able to spot the difference at a glance because you'll be writing these for every commit from now on.",
    ],
    after: "identify the valid conventional commit messages.",
    task: {
      type: 'quiz',
      question: "which of these commit messages would commitlint accept? (select all that apply)",
      multi: true,
      options: [
        "feat: add user authentication endpoint",
        "Added login feature and updated the navbar",
        "fix(auth): handle case where JWT token is expired",
        "WIP - still working on the task model",
      ],
      correct: [0, 2],
      explanation: "valid conventional commits follow 'type(scope): description' — lowercase type, optional scope in parentheses, colon and space, then the description. 'feat: add user authentication endpoint' and 'fix(auth): handle case where JWT token is expired' are both valid. the other two have no type prefix and would be rejected immediately by commitlint.",
      hint: "look for the 'type: description' pattern — lowercase type, colon, space, description.",
    },
  },

  { /* step 42 — .npmrc */
    mod: 1,
    alex: [
      "one final config file. .npmrc lets you set npm behaviour at the project level — these settings apply to anyone who runs npm commands in this project, regardless of their global npm config.",
      "'save-exact=true' is the important one. by default, npm install saves packages with a caret prefix like '^1.2.3', which means 'any version >=1.2.3 and <2.0.0'. that sounds fine until a patch release introduces a bug and suddenly your app is broken and you don't know why — you didn't change anything, but npm pulled in a new version. save-exact=true pins to the exact version: '1.2.3'. no surprises.",
      "'engine-strict=true' turns the engines field we set in package.json from a warning into a hard error. now if someone tries npm install on Node 16, it fails loudly with a clear message instead of silently proceeding.",
    ],
    after: "create .npmrc at the project root.",
    task: {
      type: 'code',
      file: '.npmrc',
      lang: 'properties',
      hint: "two settings: save-exact=true to pin dependency versions exactly, and engine-strict=true to enforce the engines field in package.json",
      answer:
`save-exact=true
engine-strict=true`,
      check(input) {
        const ok = input.includes('save-exact=true');
        return {
          ok,
          msg: ok ? ".npmrc configured." : "add save-exact=true to .npmrc — that's the critical one.",
        };
      },
    },
  },

  { /* step 43 — save-exact quiz */
    mod: 1,
    alex: [
      "make sure the save-exact concept is clear — it's a subtle difference with real consequences.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "your package.json has 'express': '^4.18.2'. a new developer joins and runs npm install. what version of Express do they get?",
      multi: false,
      options: [
        "exactly 4.18.2 — the caret locks to the exact version",
        "the latest 4.x.x version available at the time they install — could be 4.19.0 or higher",
        "the latest version of Express, including major versions",
        "it depends on their local npm cache",
      ],
      correct: [1],
      explanation: "the caret (^) means 'compatible with this version' — npm will install the highest version that doesn't change the major version number. so ^4.18.2 could install 4.19.0, 4.20.0, etc. with save-exact=true, the saved entry would be '4.18.2' with no caret, and everyone gets exactly that version. this is why package-lock.json exists too — but having exact versions in package.json is a cleaner first line of defence.",
      hint: "the caret ^ doesn't mean 'exactly this version' — it means something more flexible.",
    },
  },

  { /* step 44 — final commit */
    mod: 1,
    alex: [
      "everything is wired up. let's make a commit — and this time the full pipeline will run. lint-staged will check your staged files, and commitlint will validate your message.",
      "your commit message must follow the conventional commits format. use 'chore:' as the type — this is a tooling/maintenance change, not a new feature. if you write 'added eslint and stuff', commitlint will reject it and tell you why.",
      "this is the first time you're experiencing the pipeline running on a real commit. it might feel like friction right now, but imagine this running on every commit from a team of five people for a year — the consistency it enforces is worth it.",
    ],
    after: "stage all files and commit with a valid conventional commit message.",
    task: {
      type: 'cmd',
      hint: "git add . then git commit -m 'chore: add prettier, eslint, husky, lint-staged, and commitlint'",
      answer: "git add . && git commit -m 'chore: add prettier, eslint, husky, lint-staged, and commitlint'",
      check(input) {
        const hasAdd = input.includes('git add');
        const hasCommit = input.includes('git commit') && input.includes('-m');
        const hasConventional = /['"]?(feat|fix|chore|docs|style|refactor|test|build|ci)(\(.+\))?:/.test(input);
        const ok = hasAdd && hasCommit && hasConventional;
        return {
          ok,
          msg: ok ? "committed. pipeline ran successfully." : "make sure your commit message starts with a conventional type — e.g. 'chore: add prettier, eslint...'",
        };
      },
    },
  },

  { /* step 45 — wrap up */
    mod: 1,
    alex: [
      "that's the full code quality layer done. from this commit forward: every file you touch gets auto-formatted on save, every staged file gets linted and prettified before committing, and every commit message that doesn't follow the convention gets rejected before it's created.",
      "no more arguing about tabs vs spaces. no more 'fix stuff' in the git log. no more surprise version bumps breaking things. the automation handles all of it.",
      "up next is where the actual app starts — we're setting up the Express server. folder structure for the API, environment config loaded at startup, the first working route, and error handling middleware. the foundation we just built is about to start paying off.",
    ],
  },

);

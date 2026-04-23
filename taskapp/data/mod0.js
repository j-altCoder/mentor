// ─── MODULE 0: project foundation ────────────────────────────────────────────
STEPS.push(

  { /* step 0 — intro */
    mod: 0,
    alex: [
      "hey {name}! i'm Alex. we're going to build a production-grade MERN task management app together — the kind of thing you'd actually put on your resume and not be embarrassed about.",
      "i've seen a lot of devs jump straight into writing features and then spend weeks cleaning up a mess that was created in the first hour. we're not going to do that. we're going to set this up the right way from the start.",
      "fair warning: this first part is going to feel slow. no Express, no React, no MongoDB yet. just setup. but trust me — every decision we make here will save you hours of pain later.",
    ],
    nextOn: 'ok',
    after: "type 'ok' when you're ready and i'll show you what we're building.",
  },

  { /* step 1 — what we'll build */
    mod: 0,
    alex: [
      "so here's the full picture. by the time we're done with this entire course, you'll have a fully working task management app — think a simplified Jira or Trello.",
      "it'll have user auth, task CRUD, file attachments, real-time updates, and it'll be deployed. not a toy. an actual app with an actual URL you can share.",
      "but right now, this module is just about the project foundation. think of it like laying the concrete before building a house — boring to watch, but everything sits on top of it.",
    ],
    callout: {
      type: 'info',
      label: "what we're building in this module",
      items: [
        "folder structure — client/, server/, root config files",
        "git repo with a proper .gitignore set up before the first commit",
        "node version pinned with .nvmrc — no more version mismatch debugging",
        "root package.json with engines field and orchestration scripts",
        "environment variable setup with .env.example as the committed template",
        "EditorConfig + VS Code workspace settings for editor consistency",
        "README and LICENSE — the things that make a project look professional",
      ],
    },
    nextOn: 'lets go',
    after: "type 'lets go' when you're ready to start.",
  },

  { /* step 2 — prerequisites quiz */
    mod: 0,
    alex: [
      "before we touch anything, let's make sure your machine is ready. there are three things you absolutely need installed: Node.js, npm, and Git.",
      "Node is the runtime that runs JavaScript outside the browser — your Express server runs on it. npm is the package manager that comes bundled with Node — we use it to install everything. Git is for version control — and we're using it from the very first file, not as an afterthought.",
      "you might be wondering about MongoDB — we don't need it installed locally right now. we'll connect to a cloud instance later when we get to the database module.",
    ],
    after: "select everything that needs to be installed before we can start.",
    task: {
      type: 'quiz',
      question: "which tools need to be installed on your machine before we begin? (select all that apply)",
      multi: true,
      options: [
        "Node.js (v18+)",
        "npm (comes bundled with Node)",
        "Git",
        "MongoDB Compass",
      ],
      correct: [0, 1, 2],
      explanation: "Node.js and npm are required from step one — we need them to run scripts and install packages. Git is non-negotiable; we're initialising a repo before we write a single line of app code. MongoDB Compass is a nice GUI tool but it's optional — we'll connect to MongoDB via a URI string later, no local install needed.",
      hint: "think about what you'd need just to create a project, track it in git, and install packages.",
    },
  },

  { /* step 3 — node version quiz */
    mod: 0,
    alex: [
      "here's a problem that trips up a lot of teams: node version mismatches. you build a feature on Node 20, push it, your teammate pulls it on Node 16. some APIs behave differently, some error messages are different, some packages won't even install. debugging that is a nightmare when you don't know that's the cause.",
      "the fix is to pin the node version at the project level. there are a few tools that let you do this — nvm (node version manager) is the classic one, fnm is a faster modern alternative. both of them read a single config file from your project root and automatically switch to the right node version when you cd into the folder.",
    ],
    after: "what's the standard file for pinning a node version that tools like nvm and fnm read?",
    task: {
      type: 'quiz',
      question: "how do you ensure every developer on your team uses the same Node.js version?",
      multi: false,
      options: [
        "write the version in the README and trust people to read it",
        "create a .nvmrc file with the version — nvm and fnm read it automatically on cd",
        "set the engines field in package.json — that's sufficient on its own",
        "install the exact node version on CI and hope local devs match it",
      ],
      correct: [1],
      explanation: ".nvmrc is read automatically by nvm and fnm when you enter the project directory. the engines field in package.json is also important — it warns (or errors) when the wrong version is used at npm install time. we'll add both. together they give you automatic switching plus an enforcement layer.",
      hint: "think about a file that version managers can detect and act on automatically.",
    },
  },

  { /* step 4 — create root folder */
    mod: 0,
    alex: [
      "alright, enough theory. let's actually build something. first thing: create the root project folder and move into it.",
      "we're calling it 'mern-tasks'. this name shows up in your package.json, your git history, and eventually your deployment config — so pick something deliberate. you can use a different name if you want, just stay consistent with it throughout.",
    ],
    after: "create the project folder and cd into it.",
    task: {
      type: 'cmd',
      hint: "mkdir to create the folder, then cd to move into it — chain them with &&",
      answer: "mkdir mern-tasks && cd mern-tasks",
      check(input) {
        const ok = input.includes('mkdir') && input.includes('mern-tasks') && input.includes('cd');
        return {
          ok,
          msg: ok ? "project folder created. you're in." : "use mkdir to create the folder, then cd into it. you can chain them: mkdir mern-tasks && cd mern-tasks",
        };
      },
    },
  },

  { /* step 5 — create folder structure */
    mod: 0,
    alex: [
      "now create the two main subdirectories. this is going to be a monorepo-style layout — one git repository, but two completely separate apps living inside it.",
      "client/ will hold the entire React frontend — its own package.json, its own node_modules, its own build process. server/ is the same deal for the Express API. they share a git history but nothing else.",
      "the reason for this separation: they can be deployed independently, scaled independently, and they don't pollute each other's dependency trees. a lot of beginners mix frontend and backend in one flat structure and regret it when things get complicated. we're not doing that.",
    ],
    after: "create both the client and server directories inside the project root.",
    task: {
      type: 'cmd',
      hint: "mkdir accepts multiple folder names separated by spaces",
      answer: "mkdir client server",
      check(input) {
        const ok = input.includes('mkdir') && input.includes('client') && input.includes('server');
        return {
          ok,
          msg: ok ? "client/ and server/ created." : "run mkdir with both names at once: mkdir client server",
        };
      },
    },
  },

  { /* step 6 — git init */
    mod: 0,
    alex: [
      "version control from the very first file. not 'i'll add git once i have some real code'. right now. before anything else.",
      "your git history is a record of how you built the thing. if you init git after a week of work, you've permanently lost that story. you've also lost the ability to roll back to any earlier point, can't use pre-commit hooks, can't collaborate properly.",
      "git init creates a hidden .git folder in the current directory. that folder is everything — it tracks every change, every branch, every commit from this moment forward. don't manually touch it.",
    ],
    after: "initialise a git repository in the project root.",
    task: {
      type: 'cmd',
      hint: "it's just two words",
      answer: "git init",
      check(input) {
        const ok = input.includes('git init');
        return {
          ok,
          msg: ok ? "git repo initialised." : "run git init in the mern-tasks directory.",
        };
      },
    },
  },

  { /* step 7 — gitignore importance */
    mod: 0,
    alex: [
      "before we make a single commit, we need to tell git what to ignore. this cannot wait — if you commit the wrong things and then push, you've already made a mistake you can't fully undo.",
      "three things you absolutely never commit: node_modules/ (can be hundreds of megabytes and is entirely reproducible from package.json — committing it would be insane), .env files (contain real secrets like database passwords and API keys — more on this in a minute), and build output like dist/ or build/ (generated files that would just create noise in your diffs).",
      "a real-world horror story: a dev accidentally committed a .env file containing AWS credentials to a public GitHub repo. within minutes, bots had scraped the credentials and spun up hundreds of EC2 instances. the company got a $50,000 AWS bill overnight. .gitignore before the first commit. always.",
    ],
    nextOn: 'got it',
    after: "type 'got it' and we'll write the .gitignore.",
  },

  { /* step 8 — .gitignore */
    mod: 0,
    alex: [
      "create the .gitignore now. i've organised it into sections — dependencies, environment files, build output, logs, OS-generated junk, and coverage reports. commented sections make it easy to find and add to later.",
      "the .DS_Store and Thumbs.db entries are for macOS and Windows respectively — these files get created automatically by the operating system and are completely meaningless to anyone else. without this, your commits would be full of 'added .DS_Store' noise.",
    ],
    after: "create .gitignore at the project root.",
    task: {
      type: 'code',
      file: '.gitignore',
      lang: 'properties',
      hint: "organise into sections with comments: dependencies (node_modules), env files (.env, .env.local, .env.*.local), build output (dist/, build/, .next/), logs (*.log), OS files (.DS_Store, Thumbs.db), and coverage/",
      answer:
`# dependencies
node_modules/
.pnp
.pnp.js

# environment variables
.env
.env.local
.env.*.local

# build output
dist/
build/
.next/

# logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# coverage
coverage/

# editor
.vscode/extensions.json`,
      check(input) {
        const ok =
          input.includes('node_modules') &&
          input.includes('.env') &&
          (input.includes('dist') || input.includes('build'));
        return {
          ok,
          msg: ok ? ".gitignore is set up correctly." : "make sure you're ignoring node_modules, .env files, and build output at minimum.",
        };
      },
    },
  },

  { /* step 9 — .nvmrc */
    mod: 0,
    alex: [
      "remember the .nvmrc we talked about? let's create it now. it's the simplest file in this entire project — just a version number.",
      "we're using Node 20, the current LTS release. LTS stands for Long Term Support — these versions get security and maintenance updates for years. odd-numbered versions (19, 21) are cutting-edge releases that lose support quickly. for anything you're shipping to real users, you always use LTS.",
      "once this file exists, any developer with nvm installed just runs 'nvm use' in the project root and they're on the right version. if they have fnm, it switches automatically on cd. no instructions, no guessing.",
    ],
    after: "create .nvmrc with the Node version.",
    task: {
      type: 'code',
      file: '.nvmrc',
      lang: 'properties',
      hint: "just the version number on its own line — '20' is fine, or 'v20.11.0' if you want to be specific about the patch version",
      answer: `20`,
      check(input) {
        const ok = input.trim().startsWith('20') || input.trim().startsWith('v20');
        return {
          ok,
          msg: ok ? "node version pinned to 20." : "the .nvmrc file should contain just the version number — '20' or 'v20.x.x'.",
        };
      },
    },
  },

  { /* step 10 — root package.json init */
    mod: 0,
    alex: [
      "now let's initialise the root package.json. to be clear: this is not the client's package.json or the server's. those will live in their own subdirectories and we'll create them later. this one is at the root level.",
      "the root package.json is the project-level coordinator. it'll hold shared dev dependencies (ESLint, Prettier, Husky), the scripts that run both apps together, and project metadata. think of it as the conductor — it doesn't play any instruments itself, but it tells everything else when to start.",
      "use the -y flag to skip the interactive wizard and accept all defaults. we're going to replace most of it anyway.",
    ],
    after: "initialise the root package.json.",
    task: {
      type: 'cmd',
      hint: "npm init with a flag to skip all the prompts",
      answer: "npm init -y",
      check(input) {
        const ok = input.includes('npm init') && input.includes('-y');
        return {
          ok,
          msg: ok ? "package.json generated." : "run npm init -y — the -y flag skips all the interactive prompts.",
        };
      },
    },
  },

  { /* step 11 — update package.json */
    mod: 0,
    alex: [
      "the generated file is pretty minimal. let's rewrite it with a few important additions.",
      "'private: true' is critical — it prevents this monorepo root from ever being accidentally published to the npm registry. the 'engines' field declares the minimum supported Node and npm versions — right now it just warns, but we'll pair it with an .npmrc config later to make it a hard error. the scripts block sets up the commands we'll be using constantly.",
      "you'll notice the dev script references 'concurrently' — that's a package that lets you run multiple npm scripts in parallel (so client and server start up at the same time). we don't have it installed yet, but declaring the script shape now means we won't need to touch this file again when we install it.",
    ],
    after: "replace package.json with the full version below.",
    task: {
      type: 'code',
      file: 'package.json',
      lang: 'json',
      hint: "add private: true so this can't be accidentally published, engines with node >=20.0.0 and npm >=10.0.0, and scripts for dev (concurrently running both workspaces), build, lint, format, and test",
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
    "test": "echo \\"no tests yet\\""
  },
  "keywords": [],
  "author": "",
  "license": "MIT"
}`,
      check(input) {
        const ok =
          input.includes('"private": true') &&
          input.includes('"engines"') &&
          input.includes('"scripts"') &&
          input.includes('lint') &&
          input.includes('format');
        return {
          ok,
          msg: ok ? "package.json looks great." : "make sure you have private: true, an engines block with node and npm versions, and a scripts block with lint and format at minimum.",
        };
      },
    },
  },

  { /* step 12 — engines quiz */
    mod: 0,
    alex: [
      "you just added an engines field. i want to make sure you understand what it actually does — because it's easy to assume it's more powerful than it is by default.",
    ],
    after: "what does the engines field do during npm install?",
    task: {
      type: 'quiz',
      question: "what happens when someone runs 'npm install' on a machine with Node 16, and your package.json has engines: { node: '>=20.0.0' }?",
      multi: false,
      options: [
        "npm automatically downloads and installs Node 20",
        "npm prints a warning but continues the install",
        "npm fails with an error and aborts the install",
        "nothing — npm ignores the engines field entirely",
      ],
      correct: [1],
      explanation: "by default, engines is advisory — npm warns you but doesn't block the install. to turn it into a hard error, you add engine-strict=true to your .npmrc file (we'll do that in the next module). so the full picture is: .nvmrc for automatic switching, engines for declaration, engine-strict for enforcement. each layer adds protection.",
      hint: "there's a difference between a warning and a hard failure — engines is one of these by default.",
    },
  },

  { /* step 13 — env vars explanation */
    mod: 0,
    alex: [
      "let's talk about environment variables before we create the files. this is one of the most important concepts in backend development and it's worth really understanding.",
      "environment variables are values that live outside your code in the environment where the app is running. things like your database URI, API keys, JWT secrets, and port numbers. the core reason they're external: these values are different in every environment. local dev uses a local database, staging uses a staging database, production uses the real one. you can't hardcode any of this.",
      "the 12-factor app methodology — the gold standard for building properly deployable applications — has one rule specifically for this: 'store config in the environment'. hardcoding config values, even non-sensitive ones, is considered an anti-pattern. environment variables are the solution.",
    ],
    nextOn: 'makes sense',
    after: "type 'makes sense' and we'll set this up.",
  },

  { /* step 14 — .env.example */
    mod: 0,
    alex: [
      "the convention is two files: .env and .env.example. the .env file holds your real local values — database password, actual secrets. it's gitignored and never committed. the .env.example file is the committed template — it shows what variables exist, with placeholder values instead of real ones.",
      "when a new developer joins the team, they run 'cp .env.example .env' and then fill in their own values. it's the standard onboarding step for any serious project. if you look at React, Express, or basically any major open source project on GitHub, you'll find an .env.example in the root.",
      "we're declaring all the variables the entire app will eventually need — some won't be used until much later modules, but having them documented from day one means nobody is ever surprised by a missing variable in production.",
    ],
    after: "create .env.example at the project root.",
    task: {
      type: 'code',
      file: '.env.example',
      lang: 'properties',
      hint: "list all the variables the app needs with example (not real) values. group them by concern: app config (NODE_ENV, PORT), database (MONGO_URI), auth (JWT_SECRET, JWT_EXPIRES_IN), and client (VITE_API_URL)",
      answer:
`# App
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/mern-tasks

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Client
VITE_API_URL=http://localhost:5000/api`,
      check(input) {
        const ok =
          input.includes('MONGO_URI') &&
          input.includes('JWT_SECRET') &&
          input.includes('PORT');
        return {
          ok,
          msg: ok ? ".env.example created — all the key variables are documented." : "include at least PORT, MONGO_URI, and JWT_SECRET in your .env.example.",
        };
      },
    },
  },

  { /* step 15 — .env quiz */
    mod: 0,
    alex: [
      "this one's important. i want to make sure you really understand the consequences of committing secrets — because it's an irreversible mistake if you don't catch it in time.",
    ],
    after: "think carefully before you answer.",
    task: {
      type: 'quiz',
      question: "a teammate accidentally commits their real .env file with a MongoDB Atlas password to a public GitHub repo. they immediately delete the file and push a new commit. are the credentials now safe?",
      multi: false,
      options: [
        "yes — the file is deleted, so anyone visiting the repo won't see it",
        "yes — as long as they deleted it quickly, bots won't have indexed it yet",
        "no — the credentials exist in the git history and must be treated as permanently compromised",
        "it depends — only unsafe if the repo was starred or forked before the delete",
      ],
      correct: [2],
      explanation: "git history is permanent. deleting a file creates a new commit — but the old commit with the credentials still exists and is still accessible. the only safe response is to immediately rotate every exposed credential: change the database password, revoke the API key, generate a new JWT secret. assume they're compromised from the moment of exposure. this is exactly why .env goes in .gitignore before the very first commit.",
      hint: "a deleted file in git doesn't erase the commit where it was added.",
    },
  },

  { /* step 16 — editorconfig */
    mod: 0,
    alex: [
      "here's a subtle but real problem on real teams: different editors have different defaults. VS Code might use 2-space indentation, WebStorm 4-space, someone on Vim might have tabs configured. every time two developers touch the same file, git sees a diff full of whitespace noise. code reviews become unreadable.",
      "EditorConfig solves this at the editor level — before any code is even saved. it's a file that most editors support natively or via a free plugin. it tells every editor: use these line endings, this indentation style, this charset. it's the baseline that everything else builds on.",
      "note: this is different from Prettier, which we'll add in the next module. EditorConfig controls how your editor behaves as you type. Prettier reformats code when you save. they work at different layers and complement each other — EditorConfig first, then Prettier.",
    ],
    after: "create .editorconfig at the project root.",
    task: {
      type: 'code',
      file: '.editorconfig',
      lang: 'properties',
      hint: "start with root=true to stop editors searching for parent configs. [*] applies to all files: charset utf-8, end_of_line lf, insert_final_newline true, trim_trailing_whitespace true. [*.{js,jsx,...}] with indent_style space and indent_size 2. [*.md] with trim_trailing_whitespace false — markdown uses trailing spaces for line breaks.",
      answer:
`root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,jsx,ts,tsx,json,css,scss,html}]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab`,
      check(input) {
        const ok =
          input.includes('root = true') &&
          input.includes('indent_size = 2') &&
          input.includes('end_of_line = lf');
        return {
          ok,
          msg: ok ? "editorconfig looks correct." : "make sure root=true is at the top, indent_size=2 is set for js/ts files, and end_of_line=lf.",
        };
      },
    },
  },

  { /* step 17 — vscode settings */
    mod: 0,
    alex: [
      "most teams use VS Code, so let's make the experience seamless for anyone who opens this project. .vscode/settings.json sets workspace-level settings that apply to this project specifically — they override personal user settings without permanently changing them.",
      "the two settings that will save the most time: editor.formatOnSave automatically runs Prettier every time you hit Ctrl+S, so you never have to think about formatting again. editor.codeActionsOnSave with fixAll.eslint automatically fixes ESLint errors that are auto-fixable — unused imports, simple style violations, that kind of thing.",
      "a developer with the right extensions installed will open this project and it'll just work — consistent formatting, lint errors fixed on save, everything.",
    ],
    after: "create .vscode/settings.json.",
    task: {
      type: 'code',
      file: '.vscode/settings.json',
      lang: 'json',
      hint: "set editor.defaultFormatter to 'esbenp.prettier-vscode', editor.formatOnSave to true, editor.codeActionsOnSave with 'source.fixAll.eslint' set to 'explicit'. also set tabSize 2 and files.eol to LF (\\n).",
      answer:
`{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.tabSize": 2,
  "files.eol": "\\n",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}`,
      check(input) {
        const ok =
          input.includes('formatOnSave') &&
          input.includes('prettier') &&
          input.includes('eslint');
        return {
          ok,
          msg: ok ? "vs code workspace settings configured." : "include formatOnSave: true, the prettier extension as default formatter, and eslint fix on save.",
        };
      },
    },
  },

  { /* step 18 — vscode extensions */
    mod: 0,
    alex: [
      "one more VS Code file. .vscode/extensions.json tells VS Code which extensions to recommend. when someone opens the project, VS Code shows a notification: 'this workspace has extension recommendations — install them?'",
      "they click yes, they get the Prettier formatter, the ESLint linter, GitLens for git history, path intellisense for import autocompletion, and a dotenv highlighter. all the right tools, zero manual hunting around the marketplace.",
      "this is one of those small things that makes a huge difference to a new team member's first day on the project.",
    ],
    after: "create .vscode/extensions.json.",
    task: {
      type: 'code',
      file: '.vscode/extensions.json',
      lang: 'json',
      hint: "a recommendations array with extension IDs. the must-haves are esbenp.prettier-vscode and dbaeumer.vscode-eslint. add gitlens, path-intellisense, and dotenv support as bonuses.",
      answer:
`{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "eamodio.gitlens",
    "PKief.material-icon-theme",
    "christian-kohler.path-intellisense",
    "mikestead.dotenv"
  ]
}`,
      check(input) {
        const ok =
          input.includes('prettier-vscode') &&
          input.includes('vscode-eslint') &&
          input.includes('recommendations');
        return {
          ok,
          msg: ok ? "extension recommendations added." : "include a recommendations array with at least prettier-vscode and vscode-eslint.",
        };
      },
    },
  },

  { /* step 19 — readme */
    mod: 0,
    alex: [
      "README time. i know it feels like busywork, but a README is the first thing anyone sees when they open your repo — on GitHub, on a portfolio, when a potential employer is looking at your work. a blank README signals an unfinished project. a good README signals someone who knows what they're doing.",
      "keep it practical. a README needs to answer three questions: what is this? how do i run it locally? what commands do i use? that's it. you don't need essays. we'll expand it as the project grows.",
      "i want you to also include a scripts table — a quick reference for every npm script in the project. developers open the README specifically looking for this when they can't remember the exact command name.",
    ],
    after: "create README.md at the root.",
    task: {
      type: 'code',
      file: 'README.md',
      lang: 'html',
      hint: "structure: title + one-line description, tech stack list, prerequisites, numbered getting started steps (clone → install → copy .env.example → npm run dev), scripts table, license section",
      answer:
`# MERN Tasks

A production-grade task management application built with MongoDB, Express, React, and Node.js.

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Auth**: JWT

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB (local or Atlas URI)
- Git

## Getting Started

1. Clone the repo
   \`\`\`bash
   git clone <repo-url>
   cd mern-tasks
   \`\`\`

2. Install dependencies
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables
   \`\`\`bash
   cp .env.example .env
   # edit .env with your values
   \`\`\`

4. Start development servers
   \`\`\`bash
   npm run dev
   \`\`\`

## Scripts

| Script | Description |
|--------|-------------|
| \`npm run dev\` | Start both client and server in dev mode |
| \`npm run build\` | Build the client for production |
| \`npm run lint\` | Run ESLint across the project |
| \`npm run format\` | Run Prettier across the project |

## License

MIT`,
      check(input) {
        const ok =
          input.includes('## Prerequisites') &&
          input.includes('## Getting Started') &&
          (input.includes('npm install') || input.includes('npm run'));
        return {
          ok,
          msg: ok ? "readme looks solid." : "include at least a Prerequisites section and a step-by-step Getting Started section.",
        };
      },
    },
  },

  { /* step 20 — LICENSE */
    mod: 0,
    alex: [
      "add a LICENSE file. here's something a lot of developers don't know: if you publish code without a license, it's legally 'all rights reserved' by default. nobody can legally use it, copy it, or contribute to it — even if it's publicly visible on GitHub. that's probably not your intent.",
      "MIT is the standard choice for open projects. it's maximally permissive — anyone can use your code for anything, commercially or otherwise, as long as they preserve the copyright notice. React uses it. Express uses it. It's the npm ecosystem's default.",
      "just update the copyright year and name. that's literally the only change needed from the standard template.",
    ],
    after: "create a LICENSE file with the MIT license.",
    task: {
      type: 'code',
      file: 'LICENSE',
      lang: 'properties',
      hint: "the full MIT license text — starts with 'MIT License', then a copyright line with year and name, then the permission grant paragraph, the condition that the notice must be preserved, and the warranty disclaimer",
      answer:
`MIT License

Copyright (c) 2024 mern-tasks contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
      check(input) {
        const ok =
          input.includes('MIT License') &&
          input.includes('Permission is hereby granted') &&
          input.includes('Copyright');
        return {
          ok,
          msg: ok ? "mit license added." : "use the standard MIT license text — it starts with 'MIT License', has a Copyright line, and the 'Permission is hereby granted' paragraph.",
        };
      },
    },
  },

  { /* step 21 — first commit */
    mod: 0,
    alex: [
      "everything's in place. time for the first commit. this is the baseline snapshot of the entire project — every future change will be measured against it.",
      "we're going to use conventional commits format throughout this project — it's a standard that makes git history readable and enables automated changelogs. the format is 'type: description'. for setup and maintenance work that doesn't add features or fix bugs, the type is 'chore'. so our message is 'chore: initial project setup'.",
      "after this commit, run 'git log' and you'll see one clean entry. that's your starting point. everything we build from here gets added on top of it.",
    ],
    after: "stage all files and create the first commit with a conventional commit message.",
    task: {
      type: 'cmd',
      hint: "git add . to stage everything in the current directory, then git commit -m 'chore: initial project setup'",
      answer: "git add . && git commit -m 'chore: initial project setup'",
      check(input) {
        const hasAdd = input.includes('git add');
        const hasCommit = input.includes('git commit') && input.includes('-m');
        const ok = hasAdd && hasCommit;
        return {
          ok,
          msg: ok ? "first commit created. project is officially tracked." : "stage everything with git add . and commit with git commit -m 'message'.",
        };
      },
    },
  },

  { /* step 22 — wrap up */
    mod: 0,
    alex: [
      "module 0 done. i know it felt like a lot of config files and no 'real' code — but look at what you actually have: a git repo with a clean first commit, node version pinned and documented, environment variables properly handled, editor consistency set up for the whole team, and a README that makes this look like a professional project.",
      "this is the difference between a junior project and a senior one. tutorials skip all of this. you didn't.",
      "next module: the code quality layer. Prettier, ESLint, Husky hooks, lint-staged, and commitlint. by the end of it, bad code and bad commit messages will be automatically rejected before they ever reach the repo.",
    ],
  },

);

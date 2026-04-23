// ─── MODULE 1: code quality & git hygiene — file snapshots ───────────────────

// Helper: full file tree state carried forward from end of mod0
const _mod0Base = {
  '.gitignore':
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
  '.nvmrc': `20`,
  'package.json':
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
  '.env.example':
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
  '.editorconfig':
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
  '.vscode/settings.json':
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
  '.vscode/extensions.json':
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
  'README.md':
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
  'LICENSE':
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
};

Object.assign(FILE_SNAPSHOTS, {

  // step 27 — .prettierrc created
  27: {
    ..._mod0Base,
    '.prettierrc':
`{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`,
  },

  // step 28 — .prettierignore created
  28: {
    ..._mod0Base,
    '.prettierrc':
`{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`,
    '.prettierignore':
`node_modules
dist
build
coverage
.next
*.lock
package-lock.json
*.min.js
*.min.css`,
  },

  // step 30 — .eslintrc.json created
  30: {
    ..._mod0Base,
    '.prettierrc':
`{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`,
    '.prettierignore':
`node_modules
dist
build
coverage
.next
*.lock
package-lock.json
*.min.js
*.min.css`,
    '.eslintrc.json':
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
  },

  // step 36 — package.json updated with lint-staged, .husky/pre-commit created
  36: {
    ..._mod0Base,
    'package.json':
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
  "license": "MIT",
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-import": "^2.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0"
  }
}`,
    '.prettierrc':
`{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`,
    '.prettierignore':
`node_modules
dist
build
coverage
.next
*.lock
package-lock.json
*.min.js
*.min.css`,
    '.eslintrc.json':
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
    '.husky/pre-commit': `npx lint-staged`,
  },

  // step 39 — commitlint.config.js created
  39: {
    ..._mod0Base,
    'package.json':
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
  "license": "MIT",
  "devDependencies": {
    "@commitlint/cli": "^18.0.0",
    "@commitlint/config-conventional": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-import": "^2.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0"
  }
}`,
    '.prettierrc':
`{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`,
    '.prettierignore':
`node_modules
dist
build
coverage
.next
*.lock
package-lock.json
*.min.js
*.min.css`,
    '.eslintrc.json':
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
    '.husky/pre-commit': `npx lint-staged`,
    'commitlint.config.js':
`export default {
  extends: ['@commitlint/config-conventional'],
};`,
  },

  // step 40 — .husky/commit-msg created
  40: {
    ..._mod0Base,
    'package.json':
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
  "license": "MIT",
  "devDependencies": {
    "@commitlint/cli": "^18.0.0",
    "@commitlint/config-conventional": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-import": "^2.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0"
  }
}`,
    '.prettierrc':
`{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`,
    '.prettierignore':
`node_modules
dist
build
coverage
.next
*.lock
package-lock.json
*.min.js
*.min.css`,
    '.eslintrc.json':
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
    '.husky/pre-commit': `npx lint-staged`,
    '.husky/commit-msg': `npx --no -- commitlint --edit $1`,
    'commitlint.config.js':
`export default {
  extends: ['@commitlint/config-conventional'],
};`,
  },

  // step 42 — .npmrc created (final state of mod1)
  42: {
    ..._mod0Base,
    'package.json':
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
  "license": "MIT",
  "devDependencies": {
    "@commitlint/cli": "^18.0.0",
    "@commitlint/config-conventional": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-import": "^2.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0"
  }
}`,
    '.prettierrc':
`{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`,
    '.prettierignore':
`node_modules
dist
build
coverage
.next
*.lock
package-lock.json
*.min.js
*.min.css`,
    '.eslintrc.json':
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
    '.husky/pre-commit': `npx lint-staged`,
    '.husky/commit-msg': `npx --no -- commitlint --edit $1`,
    'commitlint.config.js':
`export default {
  extends: ['@commitlint/config-conventional'],
};`,
    '.npmrc':
`save-exact=true
engine-strict=true`,
  },

});

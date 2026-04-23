// ─── MODULE 4: user model — file snapshots ───────────────────────────────────

// Helper: complete server state from end of mod3
const _mod3ServerState = {
  'server/package.json':
`{
  "name": "mern-tasks-server",
  "version": "1.0.0",
  "description": "Express API for MERN Tasks",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "NODE_ENV=production node index.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "helmet": "^7.0.0",
    "mongoose": "^8.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`,
  'server/.env':
`NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mern-tasks?retryWrites=true&w=majority
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d`,
  'server/config/validateEnv.js':
`const requiredEnvVars = ['NODE_ENV','PORT','MONGO_URI','JWT_SECRET'];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(\`   - \${key}\`));
    process.exit(1);
  }
};`,
  'server/config/db.js':
`import mongoose from 'mongoose';

export const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });
  console.log(\`✅ MongoDB connected: \${conn.connection.host}\`);
};

mongoose.connection.on('connected', () => { console.log('📦 Mongoose connection established.'); });
mongoose.connection.on('error', (err) => { console.error(\`❌ Mongoose connection error: \${err.message}\`); });
mongoose.connection.on('disconnected', () => { console.warn('⚠️  Mongoose disconnected from MongoDB.'); });`,
  'server/middleware/errorHandler.js':
`export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};`,
  'server/index.js':
`import 'dotenv/config';

import { validateEnv } from './config/validateEnv.js';

validateEnv();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});

app.use((_req, res) => { res.status(404).json({ success: false, message: 'Route not found' }); });
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(\`🚀 Server running on port \${PORT} in \${process.env.NODE_ENV} mode\`);
    });
    const shutdown = (signal) => {
      console.log(\`\\n\${signal} received. Shutting down gracefully...\`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('HTTP server and DB connection closed.');
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();`,
};

const _rootBase = {
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
  "engines": { "node": ">=20.0.0", "npm": ">=10.0.0" },
  "scripts": {
    "dev": "concurrently \\"npm run dev --workspace=server\\" \\"npm run dev --workspace=client\\"",
    "build": "npm run build --workspace=client",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "echo \\"no tests yet\\"",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,scss,html}": ["prettier --write"]
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
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "editor.tabSize": 2,
  "files.eol": "\\n"
}`,
  '.vscode/extensions.json':
`{ "recommendations": ["esbenp.prettier-vscode","dbaeumer.vscode-eslint","eamodio.gitlens","christian-kohler.path-intellisense","mikestead.dotenv"] }`,
  'README.md': `# MERN Tasks\n\nA production-grade task management application.\n\n## License\n\nMIT`,
  'LICENSE': `MIT License\n\nCopyright (c) 2024 mern-tasks contributors`,
  '.prettierrc': `{\n  "singleQuote": true,\n  "semi": true,\n  "tabWidth": 2,\n  "trailingComma": "es5",\n  "printWidth": 100\n}`,
  '.prettierignore': `node_modules\ndist\nbuild\ncoverage\n*.lock\npackage-lock.json`,
  '.eslintrc.json': `{\n  "env": { "node": true, "es2022": true, "browser": true },\n  "extends": ["eslint:recommended","plugin:import/recommended","prettier"],\n  "plugins": ["import"],\n  "parserOptions": { "ecmaVersion": "latest", "sourceType": "module" },\n  "rules": { "no-console": "warn", "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }] }\n}`,
  '.husky/pre-commit': `npx lint-staged`,
  '.husky/commit-msg': `npx --no -- commitlint --edit $1`,
  'commitlint.config.js': `export default { extends: ['@commitlint/config-conventional'] };`,
  '.npmrc': `save-exact=true\nengine-strict=true`,
};

Object.assign(FILE_SNAPSHOTS, {

  // step 84 — User.js scaffold: name + email fields
  84: {
    ..._rootBase,
    ..._mod3ServerState,
    'server/package.json':
`{
  "name": "mern-tasks-server",
  "version": "1.0.0",
  "description": "Express API for MERN Tasks",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "NODE_ENV=production node index.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "helmet": "^7.0.0",
    "mongoose": "^8.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`,
    'server/models/User.js':
`import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
  },
  { timestamps: true }
);`,
  },

  // step 86 — User.js with all fields: password, role, avatar
  86: {
    ..._rootBase,
    ..._mod3ServerState,
    'server/package.json':
`{
  "name": "mern-tasks-server",
  "version": "1.0.0",
  "description": "Express API for MERN Tasks",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "NODE_ENV=production node index.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "helmet": "^7.0.0",
    "mongoose": "^8.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`,
    'server/models/User.js':
`import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);`,
  },

  // step 88 — User.js with pre-save hook
  88: {
    ..._rootBase,
    ..._mod3ServerState,
    'server/package.json':
`{
  "name": "mern-tasks-server",
  "version": "1.0.0",
  "description": "Express API for MERN Tasks",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "NODE_ENV=production node index.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "helmet": "^7.0.0",
    "mongoose": "^8.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`,
    'server/models/User.js':
`import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ── hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});`,
  },

  // step 92 — complete User.js: all fields + hooks + methods + toJSON + export
  92: {
    ..._rootBase,
    ..._mod3ServerState,
    'server/package.json':
`{
  "name": "mern-tasks-server",
  "version": "1.0.0",
  "description": "Express API for MERN Tasks",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "NODE_ENV=production node index.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "helmet": "^7.0.0",
    "mongoose": "^8.0.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}`,
    'server/models/User.js':
`import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ── instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;`,
  },

});

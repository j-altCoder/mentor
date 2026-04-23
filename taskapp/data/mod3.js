// ─── MODULE 3: mongodb + mongoose connection ──────────────────────────────────
STEPS.push(

  { /* step 65 — intro */
    mod: 3,
    alex: [
      "the server is up. now let's give it something to talk to. this module is about connecting to MongoDB — setting up a free cloud database on Atlas, writing the connection module, and making the server only start once the database is confirmed ready.",
      "this sounds simple but there are real production patterns here that matter: graceful shutdown that closes both the HTTP server and the database connection, handling connection drops, and making sure a missing or wrong database URI fails loudly at startup rather than silently at query time.",
    ],
    nextOn: 'ok',
    after: "type 'ok' to continue.",
  },

  { /* step 66 — mongoose vs driver quiz */
    mod: 3,
    alex: [
      "we're using Mongoose as our interface to MongoDB. but MongoDB has its own official Node.js driver — so why add Mongoose on top? this is worth understanding before we install it, because 'just use Mongoose' is often said without explanation.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "what does Mongoose give you that the raw MongoDB Node.js driver doesn't? (select all that apply)",
      multi: true,
      options: [
        "schemas — define the shape and types of your documents at the application level",
        "built-in validators — required fields, string length, enum values, custom validators",
        "middleware hooks — run logic before/after save, find, delete operations",
        "faster queries — Mongoose optimises MongoDB queries automatically",
      ],
      correct: [0, 1, 2],
      explanation: "Mongoose adds a schema layer, validators, and middleware hooks on top of the raw driver. the raw driver lets you insert anything into any collection — no structure enforced. Mongoose gives you a contract: this is what a User document looks like, these fields are required, this function runs before every save. it doesn't make queries faster — if anything there's a tiny overhead — but the developer experience and data safety are significantly better.",
      hint: "think about what problems arise when you can insert any shape of data into a database with no rules.",
    },
  },

  { /* step 67 — mongodb atlas intro */
    mod: 3,
    alex: [
      "we're using MongoDB Atlas for the database — it's MongoDB's own cloud hosting service. free tier gives you 512MB of storage which is more than enough for development.",
      "why cloud instead of local MongoDB? three reasons. first, it mirrors production — your app will connect to a remote database in prod, so you should develop against the same setup. second, you don't have to install and manage MongoDB on your machine. third, it's easier to share the database with teammates or between machines.",
      "if you don't have an Atlas account yet, go to cloud.mongodb.com and create a free account. once you're in, create a new project and then a free M0 cluster. i'll wait.",
    ],
    nextOn: 'done',
    after: "type 'done' once you have an Atlas account and a free cluster created.",
  },

  { /* step 68 — atlas ip whitelist */
    mod: 3,
    alex: [
      "before you can connect to your cluster, you need to whitelist your IP address. Atlas blocks all connections by default — you have to explicitly allow which IPs can connect.",
      "in your Atlas dashboard: go to Network Access → Add IP Address. for development, you can click 'Allow Access from Anywhere' (0.0.0.0/0). this is fine for dev but you'll restrict this to specific IPs in production.",
      "this is the step people forget most often. the symptom is a connection timeout with no helpful error message — your app just hangs trying to connect. if you ever see that, check the IP whitelist first.",
    ],
    nextOn: 'done',
    after: "type 'done' once your IP is whitelisted in Atlas Network Access.",
  },

  { /* step 69 — atlas db user */
    mod: 3,
    alex: [
      "you also need a database user — Atlas requires username/password authentication. this is separate from your Atlas account login.",
      "in Atlas: go to Database Access → Add New Database User. set authentication to Password. create a username and a strong password. give it the 'Atlas admin' role for now — we'll tighten permissions later.",
      "write down the username and password — you'll need them in your connection string in a moment.",
    ],
    nextOn: 'done',
    after: "type 'done' once you've created a database user.",
  },

  { /* step 70 — connection string */
    mod: 3,
    alex: [
      "now get your connection string. in Atlas: go to your cluster → Connect → Drivers → Node.js. copy the connection string — it looks like this:",
      "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority",
      "replace 'username' and 'password' with the database user credentials you just created. also add your database name after the host — before the '?': mongodb+srv://user:pass@cluster.mongodb.net/mern-tasks?retryWrites=true&w=majority. the database name in the URI is what MongoDB will use (or create) as your database.",
    ],
    after: "answer this quiz on connection string anatomy before we paste it in.",
    task: {
      type: 'quiz',
      question: "in the connection string 'mongodb+srv://alice:secret@cluster0.abc.mongodb.net/mern-tasks?retryWrites=true', what does the '/mern-tasks' part specify?",
      multi: false,
      options: [
        "the name of the Atlas project",
        "the name of the database to connect to (or create if it doesn't exist)",
        "the name of the collection to use as default",
        "the username's access scope",
      ],
      correct: [1],
      explanation: "the path after the host in a MongoDB URI is the database name. if it doesn't exist, MongoDB creates it automatically on first write. if you omit it, Mongoose connects to the 'test' database by default — which is almost never what you want. always specify the database name explicitly in your URI.",
      hint: "think about what comes after the host in a typical URL and what it usually means.",
    },
  },

  { /* step 71 — update .env with real URI */
    mod: 3,
    alex: [
      "update your server/.env with the real Atlas connection string. replace the localhost placeholder we put in earlier.",
      "a few things to double-check: the username and password in the URI are the database user credentials, not your Atlas account login. the database name is in the URI (mern-tasks). the string uses mongodb+srv:// not mongodb:// — the +srv version uses DNS-based service discovery which is what Atlas requires.",
    ],
    after: "update the MONGO_URI in server/.env with your real Atlas connection string.",
    task: {
      type: 'code',
      file: 'server/.env',
      lang: 'properties',
      hint: "replace the localhost MONGO_URI with your Atlas connection string — mongodb+srv://username:password@cluster.mongodb.net/mern-tasks?retryWrites=true&w=majority",
      answer:
`NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mern-tasks?retryWrites=true&w=majority
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d`,
      check(input) {
        const ok =
          input.includes('MONGO_URI') &&
          (input.includes('mongodb+srv://') || input.includes('mongodb://')) &&
          input.includes('JWT_SECRET');
        return {
          ok,
          msg: ok ? ".env updated with the Atlas URI." : "update MONGO_URI with your actual Atlas connection string starting with mongodb+srv://",
        };
      },
    },
  },

  { /* step 72 — install mongoose */
    mod: 3,
    alex: [
      "install Mongoose in the server workspace. make sure you're inside the server/ directory when you run this.",
    ],
    after: "install mongoose in the server workspace.",
    task: {
      type: 'cmd',
      hint: "npm install mongoose",
      answer: "npm install mongoose",
      check(input) {
        const ok = input.includes('mongoose') && input.includes('install');
        return {
          ok,
          msg: ok ? "mongoose installed." : "run npm install mongoose from inside the server/ directory.",
        };
      },
    },
  },

  { /* step 73 — db.js */
    mod: 3,
    alex: [
      "create the database connection module. this lives in server/config/db.js — config/ is exactly where this belongs, it's initialisation code, not business logic.",
      "the module exports a single async function — connectDB(). it calls mongoose.connect() with the URI from process.env and some options. the options we're setting: autoIndex is true in development (Mongoose builds indexes automatically) and false in production (you manage indexes manually, at controlled times, not on every app restart).",
      "why disable autoIndex in production? building an index locks the collection for the duration. on a large collection in production, that could cause query timeouts for your users. you instead build indexes during a maintenance window or using a migration script.",
    ],
    after: "create server/config/db.js.",
    task: {
      type: 'code',
      file: 'server/config/db.js',
      lang: 'javascript',
      hint: "import mongoose. export an async function connectDB that calls mongoose.connect(process.env.MONGO_URI) with { autoIndex: process.env.NODE_ENV !== 'production' }. throw the error if connection fails so the caller can handle it.",
      answer:
`import mongoose from 'mongoose';

export const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  console.log(\`✅ MongoDB connected: \${conn.connection.host}\`);
};`,
      check(input) {
        const ok =
          input.includes('mongoose.connect') &&
          input.includes('MONGO_URI') &&
          (input.includes('async') || input.includes('Promise'));
        return {
          ok,
          msg: ok ? "db.js connection module created." : "export an async connectDB function that calls mongoose.connect() with process.env.MONGO_URI.",
        };
      },
    },
  },

  { /* step 74 — connection events */
    mod: 3,
    alex: [
      "add connection event listeners to db.js. Mongoose's connection object emits events when the connection state changes — connected, error, disconnected. logging these gives you visibility into what the database is doing without having to add debug logging everywhere.",
      "the 'disconnected' event is particularly useful — if you see it in your logs, you know the DB dropped the connection. in production, Mongoose will automatically try to reconnect, but you want to know it happened.",
    ],
    after: "update server/config/db.js to add connection event listeners.",
    task: {
      type: 'code',
      file: 'server/config/db.js',
      lang: 'javascript',
      context:
`import mongoose from 'mongoose';

export const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  console.log(\`✅ MongoDB connected: \${conn.connection.host}\`);
};`,
      hint: "after the connectDB function, add mongoose.connection.on() listeners for 'connected', 'error', and 'disconnected' events — each logging an appropriate message",
      answer:
`import mongoose from 'mongoose';

export const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  console.log(\`✅ MongoDB connected: \${conn.connection.host}\`);
};

mongoose.connection.on('connected', () => {
  console.log('📦 Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  console.error(\`❌ Mongoose connection error: \${err.message}\`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected from MongoDB.');
});`,
      check(input) {
        const ok =
          input.includes("'connected'") &&
          input.includes("'error'") &&
          input.includes("'disconnected'");
        return {
          ok,
          msg: ok ? "connection event listeners added." : "add mongoose.connection.on() listeners for 'connected', 'error', and 'disconnected'.",
        };
      },
    },
  },

  { /* step 75 — wire db into index.js */
    mod: 3,
    alex: [
      "now wire the database connection into server/index.js. there's an important pattern here: the server should only start listening for HTTP requests after the database connection is confirmed.",
      "the reason: if your server starts before the DB is ready, a request could hit a route that queries the database and fail immediately with a confusing error. by connecting first and listening second, you guarantee that when the server is accepting traffic, the database is ready.",
      "wrap everything in a startup function — connectDB() first, then app.listen(). if connectDB throws (wrong URI, network error, IP not whitelisted), the catch block logs the error and exits with a non-zero code so your process manager knows something went wrong.",
    ],
    after: "update server/index.js to connect to the DB before starting the server.",
    task: {
      type: 'code',
      file: 'server/index.js',
      lang: 'javascript',
      context:
`import 'dotenv/config';

import { validateEnv } from './config/validateEnv.js';

validateEnv();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);`,
      hint: "import connectDB from './config/db.js'. wrap app.listen() in an async startServer function that awaits connectDB() first, then starts listening. catch errors, log them, and process.exit(1). call startServer() at the bottom.",
      answer:
`import 'dotenv/config';

import { validateEnv } from './config/validateEnv.js';

validateEnv();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── start ─────────────────────────────────────────────────────────────────────
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
      check(input) {
        const ok =
          input.includes('connectDB') &&
          input.includes('await') &&
          input.includes('startServer') &&
          input.includes('process.exit(1)');
        return {
          ok,
          msg: ok ? "server now waits for DB before starting." : "wrap app.listen in an async startServer function that awaits connectDB() first, with a catch that calls process.exit(1).",
        };
      },
    },
  },

  { /* step 76 — start-after-connect quiz */
    mod: 3,
    alex: [
      "let's make sure you understand why the order matters here — it's not just convention.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "your server starts listening before connectDB() resolves. a request comes in 200ms later, hits a route that queries MongoDB, and fails. what's the most likely error?",
      multi: false,
      options: [
        "a CORS error — the request is rejected before reaching the route",
        "a Mongoose 'not connected' error or a timeout — the query runs but there's no active connection",
        "a 404 — routes aren't registered until the DB connects",
        "Express throws a startup error and the server crashes before accepting any requests",
      ],
      correct: [1],
      explanation: "Express registers routes immediately — they're ready before connectDB() even starts. but when a route tries to run a Mongoose query before the connection is established, Mongoose will either throw 'not connected to MongoDB' or buffer the operation and eventually time out. the request appears to hang or returns a 500 with a confusing error. by awaiting connectDB() before listen(), you guarantee no request can be processed until the DB is ready.",
      hint: "Express and Mongoose are independent — routes are registered immediately, but Mongoose queries need an active connection.",
    },
  },

  { /* step 77 — graceful shutdown update */
    mod: 3,
    alex: [
      "notice the shutdown function in the updated index.js now also closes the Mongoose connection — 'await mongoose.connection.close()'. we need to import mongoose to access the connection.",
      "why close the DB connection on shutdown? a clean Mongoose disconnect allows any in-flight queries to complete and flushes any buffered writes. an abrupt process kill can leave transactions incomplete. on platforms like Railway that do rolling deployments, this is how you ensure zero data loss during deploys.",
    ],
    after: "add the mongoose import to server/index.js for the shutdown handler.",
    task: {
      type: 'code',
      file: 'server/index.js',
      lang: 'javascript',
      context:
`import 'dotenv/config';

import { validateEnv } from './config/validateEnv.js';

validateEnv();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';`,
      hint: "add import mongoose from 'mongoose' alongside the other imports — it's already installed as part of Mongoose",
      answer:
`import 'dotenv/config';

import { validateEnv } from './config/validateEnv.js';

validateEnv();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';`,
      check(input) {
        const ok = input.includes("import mongoose from 'mongoose'");
        return {
          ok,
          msg: ok ? "mongoose imported." : "add import mongoose from 'mongoose' to the imports section.",
        };
      },
    },
  },

  { /* step 78 — verify connection */
    mod: 3,
    alex: [
      "let's test it. start the server. if everything is configured correctly you'll see the MongoDB connected log followed by the server startup log. if you see a connection error, the most common causes are: wrong username or password in the URI, IP address not whitelisted in Atlas, or a typo in the cluster hostname.",
      "once it's running, hit GET /api/health — the response won't mention the DB connection yet, but the server being up means the connection worked, because we only reach app.listen after connectDB() succeeds.",
    ],
    after: "start the server and confirm the DB connection log appears.",
    task: {
      type: 'cmd',
      hint: "npm run dev from inside server/",
      answer: "npm run dev",
      check(input) {
        const ok = input.includes('npm run dev') || input.includes('npm start');
        return {
          ok,
          msg: ok ? "server started. check the terminal for the MongoDB connected log." : "run npm run dev from inside server/ to start with nodemon.",
        };
      },
    },
  },

  { /* step 79 — commit */
    mod: 3,
    alex: [
      "DB is connected, server starts cleanly, graceful shutdown handles both HTTP and DB. commit from the project root.",
    ],
    after: "stage everything and commit.",
    task: {
      type: 'cmd',
      hint: "git add . && git commit -m 'feat: add mongoose connection with graceful shutdown'",
      answer: "git add . && git commit -m 'feat: add mongoose connection with graceful shutdown'",
      check(input) {
        const hasAdd = input.includes('git add');
        const hasCommit = input.includes('git commit') && input.includes('-m');
        const hasConventional = /['"]?(feat|fix|chore|docs|style|refactor|test|build|ci)(\(.+\))?:/.test(input);
        const ok = hasAdd && hasCommit && hasConventional;
        return {
          ok,
          msg: ok ? "committed." : "use a conventional commit message — 'feat: add mongoose connection...'",
        };
      },
    },
  },

  { /* step 80 — wrap up */
    mod: 3,
    alex: [
      "database connected. the full server + DB stack is running. we have a structured server, security middleware, request logging, a health check, centralised error handling, and now a live MongoDB connection with graceful shutdown.",
      "next module: we define data. starting with the User model — schema design, field validators, password hashing with bcrypt as a pre-save hook, the toJSON transform to strip sensitive fields. by the end, we'll have a User model you can actually use to create and authenticate users.",
    ],
  },

);

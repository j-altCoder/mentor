// ─────────────────────────────────────────────────────────────────
//  LESSON: MERN Environments & Debugging
//  Category: DevOps & Engineering Practice
// ─────────────────────────────────────────────────────────────────

const LESSON_DEBUGGING_2 = {
  category: "Code Quality & Debugging",
  tag: "DEBUGGING 2",
  title: "It Works on My Machine",
  intro: "You've been debugging the same bug for two hours. It doesn't exist on your laptop. It definitely exists in production. Raj is refilling his coffee and he has that look — the one where he already knows what's wrong.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "raj",
      text: `"Walk me through what's different between your machine and production."`
    },
    {
      speaker: "you",
      text: `"I mean — production has the real data. My machine has whatever I seeded. Maybe the data format is slightly different?"`
    },
    {
      speaker: "raj",
      text: `"Maybe. What else?"`
    },
    {
      speaker: "you",
      text: `"Node version? I haven't checked. Production might be running something older."`
    },
    {
      speaker: "raj",
      text: `"Keep going."`
    },
    {
      speaker: "you",
      text: `"Env variables. My .env has localhost:27017 for Mongo, production has the real URI. Probably different API keys. JWT secret is different."`
    },
    {
      speaker: "raj",
      text: `"That's already four categories of difference. Data, runtime, configuration, secrets. Every 'works on my machine' bug lives in one of those four. Before you touch any code, you figure out which one. Two hours of debugging without doing that is just guessing."`
    },

    // ── What environments actually are ──
    {
      speaker: "you",
      text: `"So how many environments should I have? I've just been running local and pushing to production when something works."`
    },
    {
      speaker: "raj",
      text: `"How many times have you pushed to production and immediately broken something that worked locally?"`
    },
    {
      speaker: "you",
      text: `"More than I'd like to admit."`
    },
    {
      speaker: "raj",
      text: `"That's a staging environment telling you it wants to exist. The purpose of each environment is different. Local is for <em>development</em> — fast feedback, hot reload, you break things freely. Staging is for <em>validation</em> — it mirrors production as closely as possible, real infrastructure, real data shape, no real users. Production is for <em>users</em> — nothing ships here that hasn't run in staging first. The further a bug gets before you catch it, the more expensive it is. Local catches it cheapest. Production catches it most expensively."`
    },
    {
      speaker: "you",
      text: `"Staging feels like extra maintenance though. Another deployment to manage."`
    },
    {
      speaker: "raj",
      text: `"It is. You're trading that maintenance cost against the cost of production incidents. If you've ever had a production outage, you know which one is more expensive. Most teams also add a <em>test</em> environment — isolated, controlled, spun up and torn down by CI. No human ever deploys there. Automated tests run against it on every pull request. Your pipeline looks like: local → test (automated) → staging (manual QA) → production. You only move forward when the previous environment passes."`
    },
    {
      type: "analogy",
      text: "Environments are blast radius control. A bug in local affects one developer for twenty minutes. A bug in test fails a CI pipeline and blocks a PR. A bug in staging embarrasses you in front of a product manager. A bug in production embarrasses you in front of your users, gets filed as an incident, and shows up in a postmortem. You want to catch everything as early — and as cheaply — as possible. Each environment is a filter. The better your filters, the less reaches production."
    },
    {
      type: "code",
      text: `// ── Environment map for a MERN app ──
//
//  local       → NODE_ENV=development
//              → MongoDB: localhost:27017
//              → Seeded with fake data (faker.js or a seed script)
//              → Nodemon: restarts on every save
//              → Vite / CRA dev server: hot module replacement
//              → No minification, source maps enabled
//              → Console.log freely, verbose error messages
//
//  test        → NODE_ENV=test
//              → MongoDB: mongodb-memory-server (in-process, no external dependency)
//              → Spun up by Jest/Vitest before each suite, torn down after
//              → No running server — supertest calls app directly
//              → Deterministic seed per test, no shared state between tests
//
//  staging     → NODE_ENV=production   ← same as production, not its own value
//              → MongoDB Atlas: separate cluster, same tier as production
//              → Real environment variables from secrets manager
//              → Deployed via the same pipeline and Dockerfile as production
//              → Accessible to team only (VPN, basic auth, or IP allowlist)
//              → Real third-party sandboxes: Stripe test mode, SendGrid sandbox
//
//  production  → NODE_ENV=production
//              → MongoDB Atlas: production cluster
//              → Real secrets, real third-party keys, real users
//              → APM, error tracking, structured logs
//              → No debug output, no verbose errors to client

// The rule: staging should be indistinguishable from production
// except for the data it holds and the keys it uses.
// If it's not, it's not staging — it's just another dev environment.`
    },

    // ── .env files ──
    {
      speaker: "you",
      text: `"My .env setup right now is just one .env file at the root that I swap out manually when I need to. I've committed it to git once by accident."`
    },
    {
      speaker: "raj",
      text: `"Everyone does that once. Let's make sure it's only once. What's in your .gitignore?"`
    },
    {
      speaker: "you",
      text: `"node_modules, .env — yeah it's there. I just forgot to add the file before committing."`
    },
    {
      speaker: "raj",
      text: `"One rule: <em>nothing real ever goes in a committed file</em>. The pattern that prevents accidents is .env files by environment — .env.development, .env.test, .env.production — all in .gitignore. Then one <em>.env.example</em> that is committed. It has every variable name your app needs, with fake or placeholder values. New developer clones the repo, copies .env.example to .env.development, fills in real values. They know exactly what the app needs because the example tells them. No hunting through the codebase wondering why PORT is undefined."`
    },
    {
      speaker: "you",
      text: `"And production secrets?"`
    },
    {
      speaker: "raj",
      text: `"Never in a file at all. Environment variables injected at runtime by whatever is running your container — Railway, Render, Heroku config vars, AWS Secrets Manager, Doppler. The server reads process.env and that's it. The value never touches disk, never touches version control. When a key rotates, you update it in the secrets manager, redeploy. No code change needed."`
    },
    {
      type: "code",
      text: `// ── .env file structure ──
//
// .gitignore — these are NEVER committed
//   .env
//   .env.local
//   .env.development
//   .env.test
//   .env.production
//
// .env.example — THIS IS committed, it's the contract
//   PORT=5000
//   MONGO_URI=mongodb://localhost:27017/myapp_dev
//   JWT_SECRET=replace_with_a_long_random_string
//   JWT_EXPIRY=15m
//   CORS_ORIGIN=http://localhost:5173
//   NODE_ENV=development
//   # Stripe — use test keys locally
//   STRIPE_SECRET_KEY=sk_test_replace_me
//   STRIPE_WEBHOOK_SECRET=whsec_replace_me
//   # Email — use Mailtrap or Resend sandbox locally
//   SMTP_HOST=sandbox.smtp.mailtrap.io
//   SMTP_USER=replace_me
//   SMTP_PASS=replace_me

// ── Loading the right .env in your app ──
// server/index.js or server/config/env.js — run before anything else
import 'dotenv/config';
// dotenv reads .env by default — set DOTENV_CONFIG_PATH in your npm script
// to target the right file per environment

// package.json scripts
{
  "scripts": {
    "dev":   "DOTENV_CONFIG_PATH=.env.development nodemon src/index.js",
    "test":  "NODE_ENV=test jest --forceExit",
    "start": "node src/index.js"  // production reads from process.env directly, no file
  }
}

// ── Validating env vars at startup — fail fast ──
// src/config/validateEnv.js
const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'CORS_ORIGIN',
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);  // crash loudly on startup — not silently at runtime
}

export const config = {
  port:       parseInt(process.env.PORT) || 5000,
  mongoUri:   process.env.MONGO_URI,
  jwtSecret:  process.env.JWT_SECRET,
  jwtExpiry:  process.env.JWT_EXPIRY   || '15m',
  corsOrigin: process.env.CORS_ORIGIN,
  nodeEnv:    process.env.NODE_ENV     || 'development',
  isDev:      process.env.NODE_ENV !== 'production',
};

// ── Why validate at startup ──
// Without validation: JWT_SECRET is undefined → every token is signed with
// 'undefined' as the secret → auth silently broken → discovered at 2am
// With validation: server refuses to start → you fix it before it ships`
    },

    // ── MongoDB across environments ──
    {
      speaker: "you",
      text: `"Mongo is where I trip up the most. Locally I just run mongod, but half the time I forget to start it and the app crashes with a connection error that takes me a minute to recognise. In production I'm using Atlas. They feel like completely different things to manage."`
    },
    {
      speaker: "raj",
      text: `"Stop running mongod locally. Run it in Docker. One command, same version every time, starts automatically with your stack, gone completely when you stop it. No 'did I start Mongo' as a step in your mental checklist."`
    },
    {
      speaker: "you",
      text: `"I've heard Docker thrown around a lot but I've been avoiding it."`
    },
    {
      speaker: "raj",
      text: `"For local development you only need one file — a docker-compose.yml — and one command. You don't need to understand containers deeply to get Mongo running reliably. The other thing it solves: your machine, your colleague's machine, and CI all run the exact same Mongo version. 'Works on my machine' disappears for an entire category of bugs."`
    },
    {
      speaker: "you",
      text: `"And for tests — I've seen people use a test database, but then tests leave data around and affect each other."`
    },
    {
      speaker: "raj",
      text: `"<em>mongodb-memory-server</em>. It runs an actual MongoDB instance entirely in memory, no connection to anything external. Each test suite gets a clean database. It starts up in your Jest setup file, tears down after. Your tests run the same anywhere — local, CI, someone else's laptop — because they carry their own database with them. No 'tests pass locally but fail in CI because the test database has stale data' problems."`
    },
    {
      type: "code",
      text: `// ── docker-compose.yml — local dev stack ──
// docker compose up   → starts MongoDB (and anything else you add)
// docker compose down → stops and removes containers
// docker compose down -v → also wipes the volume (fresh database)

version: '3.9'
services:
  mongo:
    image: mongo:7.0               // pin the version — don't use 'latest'
    container_name: myapp_mongo
    restart: unless-stopped
    ports:
      - "27017:27017"              // host:container — accessible at localhost:27017
    volumes:
      - mongo_data:/data/db        // persist data across restarts
    environment:
      MONGO_INITDB_DATABASE: myapp_dev

volumes:
  mongo_data:

// ── Mongoose connection with proper error handling ──
// src/config/db.js
import mongoose from 'mongoose';
import { config } from './validateEnv.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,   // fail fast — don't hang 30s on bad URI
    });
    console.log(\`MongoDB connected: \${conn.connection.host}\`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);   // crash on startup — not silently mid-request
  }
};

// Handle connection drops after initial connect
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected — attempting reconnect...');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

// ── mongodb-memory-server for tests ──
// src/test/setup.js (Jest globalSetup / beforeAll)
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Wipe all collections between tests — no state leaks
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ── Atlas connection string — what changes per environment ──
// local:    MONGO_URI=mongodb://localhost:27017/myapp_dev
// staging:  MONGO_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/myapp_staging
// prod:     MONGO_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/myapp_prod
//
// The connection code is identical in all three.
// Only the URI changes — that's the entire point of environment variables.`
    },

    // ── CORS ──
    {
      speaker: "you",
      text: `"CORS is the one that gets me every single time. I fix it locally, push to staging, it breaks again. I just end up throwing a wildcard origin at it to make it stop."`
    },
    {
      speaker: "raj",
      text: `"And in production?"`
    },
    {
      speaker: "you",
      text: `"...also a wildcard, yeah."`
    },
    {
      speaker: "raj",
      text: `"Wildcard in production means any website on the internet can make authenticated requests to your API with your users' credentials. That's not CORS being annoying — that's CORS trying to stop a real attack. The fix isn't to silence it. The fix is to drive the allowed origin from an environment variable so local, staging, and production each allow exactly their own frontend."`
    },
    {
      speaker: "you",
      text: `"What about during development when I want to call the API from Postman, or from a different port?"`
    },
    {
      speaker: "raj",
      text: `"CORS is a <em>browser</em> constraint. Postman ignores it entirely — it's not a browser. Your React dev server on port 5173 talking to your Express on port 5000 is the local case, and that's exactly what <em>CORS_ORIGIN=http://localhost:5173</em> handles. Staging gets its Render URL. Production gets your real domain. Never a wildcard once users exist."`
    },
    {
      type: "code",
      text: `// ── CORS configuration — environment-aware ──
// server/src/app.js
import cors from 'cors';
import { config } from './config/validateEnv.js';

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowed = config.corsOrigin.split(',').map(o => o.trim());

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(\`CORS: origin \${origin} not allowed\`));
    }
  },
  credentials: true,          // required for cookies / Authorization header
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// ── .env per environment ──
// .env.development  → CORS_ORIGIN=http://localhost:5173
// .env.staging      → CORS_ORIGIN=https://myapp-staging.onrender.com
// .env.production   → CORS_ORIGIN=https://myapp.com,https://www.myapp.com

// ── Multiple origins (www + non-www) ──
// Comma-separated in the env variable, split above
// CORS_ORIGIN=https://myapp.com,https://www.myapp.com

// ── Common CORS mistakes ──
// ✗ origin: '*'                          — wildcard allows any site, breaks credentials
// ✗ origin: '*' with credentials: true  — browsers reject this combination entirely
// ✗ hardcoding 'http://localhost:5173'  — breaks in staging and production
// ✗ not handling OPTIONS preflight      — complex requests (PUT, custom headers) fail silently

// ── Why it 'breaks on staging' every time ──
// Your dev .env has CORS_ORIGIN=http://localhost:5173
// Staging has no CORS_ORIGIN set → process.env.CORS_ORIGIN is undefined
// Your app either crashes (if you validate on startup) or silently allows nothing
// Fix: set CORS_ORIGIN in your staging environment variables before every deploy`
    },

    // ── Express error handling across environments ──
    {
      speaker: "you",
      text: `"Error messages are another one. Locally I want to see the full stack trace when something crashes. In production I definitely don't want to send that to the client."`
    },
    {
      speaker: "raj",
      text: `"What are you sending to the client right now in production?"`
    },
    {
      speaker: "you",
      text: `"Probably the full error object. I just pass err to res.json."`
    },
    {
      speaker: "raj",
      text: `"So if your MongoDB query fails, the client sees your connection string. If your JWT verification throws, they see your algorithm name and whatever else Mongoose or jsonwebtoken puts in the error. That's information an attacker uses to understand your stack. The rule is: <em>log everything internally, send nothing useful externally in production</em>. One error handler, gated by NODE_ENV."`
    },
    {
      speaker: "you",
      text: `"I have try-catch blocks scattered everywhere. Is there a better pattern?"`
    },
    {
      speaker: "raj",
      text: `"Express has a centralised error handler — one function with four parameters at the very bottom of your middleware stack. Every async route catches errors and calls next(err). They all flow to one place. You log the real error there, then decide what to send the client based on the environment. Your routes stay clean. Your error logic is in one file."`
    },
    {
      type: "code",
      text: `// ── Async handler wrapper — eliminates try-catch in every route ──
// src/utils/asyncHandler.js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
  // Unhandled promise rejection → caught → passed to error handler
};

// ── Custom error class — carry a status code through the stack ──
// src/utils/AppError.js
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;   // expected errors: 404, 401, 422
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Routes — no try-catch, no repeated error logic ──
// src/routes/orders.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  res.json(order);
}));

// ── Central error handler — bottom of app.js, after all routes ──
// src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Always log the real error internally
  console.error({
    message: err.message,
    stack:   err.stack,
    url:     req.originalUrl,
    method:  req.method,
    userId:  req.userId ?? 'unauthenticated',
  });
  // In production: send to Sentry / Datadog / whatever you use
  // if (!isDev) Sentry.captureException(err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(422).json({ status: 'fail', errors });
  }

  // Mongoose cast error — invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID format' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  return res.status(401).json({ status: 'fail', message: 'Invalid token' });
  if (err.name === 'TokenExpiredError')  return res.status(401).json({ status: 'fail', message: 'Token expired' });

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ status: 'fail', message: \`\${field} already exists\` });
  }

  // Operational errors (AppError) — safe to send the message
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.statusCode < 500 ? 'fail' : 'error',
      message: err.message,
    });
  }

  // Unexpected errors — send nothing useful in production
  res.status(500).json({
    status: 'error',
    message: isDev ? err.message : 'Something went wrong',
    ...(isDev && { stack: err.stack }),  // stack trace only in development
  });
};

// app.js
app.use(errorHandler);  // must be last — after all routes and other middleware`
    },

    // ── Logging ──
    {
      speaker: "you",
      text: `"My logging is console.log everywhere. I know that's not ideal but I haven't had a reason to change it yet."`
    },
    {
      speaker: "raj",
      text: `"It works until you have a production bug and you're trying to find it in a wall of unstructured text. What were you searching for the last time that happened?"`
    },
    {
      speaker: "you",
      text: `"I was grepping for a user ID. It was somewhere in a log line but the format wasn't consistent so I kept getting partial matches."`
    },
    {
      speaker: "raj",
      text: `"Structured logging solves that. Instead of a string, every log line is JSON. User ID is always under the same key. You grep for a key-value pair, not a string that might appear anywhere. Tools like Datadog, Papertrail, or even just <em>jq</em> on the command line can filter and search structured logs in seconds. The other thing: log levels. console.log mixes debug noise with actual errors. If you can't turn off debug output in production without commenting out half your code, your logging isn't usable. With a proper logger — pino, winston — you set the level in an env variable. debug in development, warn in production. The library handles the rest."`
    },
    {
      type: "code",
      text: `// ── Structured logging with pino ──
// npm install pino pino-pretty

// src/config/logger.js
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
  // In development: pretty-print for human readability
  // In production: raw JSON for log aggregation tools
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  // Always include these fields on every log line
  base: {
    env: process.env.NODE_ENV,
    pid: process.pid,
  },
  // Redact sensitive fields — they'll show as [Redacted]
  redact: ['req.headers.authorization', 'body.password', 'body.token'],
});

// ── Usage — structured, searchable ──
// Instead of: console.log('Order created for user', userId)
logger.info({ userId, orderId, total }, 'order.created');

// Instead of: console.error('Payment failed', err)
logger.error({ userId, orderId, err }, 'payment.failed');

// ── Log levels — when to use each ──
// logger.debug  → verbose dev detail: every DB query, every middleware step
// logger.info   → meaningful events: order created, user authenticated, job completed
// logger.warn   → unexpected but handled: retry attempt, deprecated API call, slow query
// logger.error  → something failed and was caught: payment error, third-party timeout
// logger.fatal  → something failed and we're about to crash: DB connection lost

// ── HTTP request logging with pino-http ──
import pinoHttp from 'pino-http';

app.use(pinoHttp({
  logger,
  // Auto-logs every request with method, url, statusCode, responseTime
  // In production — don't log health check spam
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  customLogLevel: (req, res) => res.statusCode >= 500 ? 'error' : 'info',
}));

// ── What good production logs look like ──
// {
//   "level": "info",
//   "time": "2025-04-12T14:22:01.123Z",
//   "env": "production",
//   "pid": 1,
//   "req": { "id": "abc123", "method": "POST", "url": "/api/orders" },
//   "userId": "507f1f77bcf86cd799439011",
//   "orderId": "507f1f77bcf86cd799439099",
//   "total": 149.99,
//   "msg": "order.created"
// }
//
// grep userId=507f1f77... → every log line for that user, in order
// grep "order.created"    → every order ever created, with timing
// grep level=error        → every error, nothing else`
    },

    // ── Debugging in practice ──
    {
      speaker: "you",
      text: `"Okay, let's say I have a bug that only happens in staging. Not in local, not in production yet — just staging. How do I actually go about debugging it?"`
    },
    {
      speaker: "raj",
      text: `"Same four categories. Start with environment variables — are they all set? Are they the right values? Half of 'staging-only bugs' are a missing or wrong environment variable. Check the startup logs, see if validateEnv caught anything."`
    },
    {
      speaker: "you",
      text: `"Let's say all that's fine."`
    },
    {
      speaker: "raj",
      text: `"Node version. Check what's running on staging — node -e 'console.log(process.version)' if you can exec into the container — and compare to what's in your .nvmrc or package.json engines field. A minor version difference can change how something in your dependency tree behaves."`
    },
    {
      speaker: "you",
      text: `"Still fine."`
    },
    {
      speaker: "raj",
      text: `"Then it's the data. The shape of data in staging is closer to production than your local seed. Is there a user, an order, a document in staging that has a field your local data doesn't? Null where you expect a string. An empty array where you expect at least one item. Your code works fine on clean local data and breaks on realistic production-shaped data. That's the most common staging bug I see."`
    },
    {
      speaker: "you",
      text: `"How do I actually get that data to look at? I can't exactly connect to staging's Atlas from my machine casually."`
    },
    {
      speaker: "raj",
      text: `"You can, actually — Atlas has IP allowlisting but you can add your IP temporarily. But before you do that: look at your logs. If you have structured logging and the request that failed logged its inputs, you have the data right there. That's the real argument for logging request context. You're not debugging blind — you're reading a timeline of what happened."`
    },
    {
      type: "code",
      text: `// ── Debugging toolkit — steps in order ──
//
// 1. CHECK ENVIRONMENT VARIABLES FIRST
//    In staging terminal or deployment logs:
//    node -e "console.log(JSON.stringify(process.env, null, 2))" | grep -i 'mongo\|jwt\|cors\|stripe'
//    Or add a /health endpoint that confirms vars are loaded (never expose values, just booleans)

// src/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env:    process.env.NODE_ENV,
    db:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    // Confirm keys exist — never expose the values
    config: {
      jwtSecret:   !!process.env.JWT_SECRET,
      mongoUri:    !!process.env.MONGO_URI,
      corsOrigin:  process.env.CORS_ORIGIN,   // safe to expose — it's not a secret
      stripeKey:   !!process.env.STRIPE_SECRET_KEY,
    },
  });
});

// 2. CHECK NODE VERSION PARITY
// .nvmrc at project root — pins the version
// echo "20.11.0" > .nvmrc
// nvm use   ← reads .nvmrc, switches automatically

// package.json — CI and deployment platforms respect this
{
  "engines": { "node": ">=20.11.0 <21" }
}

// 3. LOG INPUTS ON ENTRY — see exactly what the server received
router.post('/orders', authMiddleware, asyncHandler(async (req, res) => {
  logger.debug({
    userId:  req.userId,
    body:    req.body,           // what did the client actually send?
    headers: {
      contentType: req.headers['content-type'],
    },
  }, 'order.create.received');

  // ... rest of handler
}));

// 4. NARROW THE SCOPE WITH A MINIMAL REPRODUCTION
// If staging data causes the bug:
//   a. Identify the document (from logs)
//   b. Copy it to local seed data
//   c. Reproduce locally
//   d. Fix locally, verify in staging

// 5. NODE DEBUGGER — attach to a running process
// package.json
{
  "scripts": {
    "dev:debug": "nodemon --inspect src/index.js"
  }
}
// Chrome: open chrome://inspect → Remote Target → inspect
// VS Code: launch.json

// .vscode/launch.json
{
  "configurations": [
    {
      "type":    "node",
      "request": "attach",
      "name":    "Attach to nodemon",
      "port":    9229,
      "restart": true  // re-attaches when nodemon restarts
    }
  ]
}
// Set breakpoints, inspect req.body, step through the exact line that fails
// Far more precise than adding console.log and restarting repeatedly

// 6. MONGOOSE QUERY DEBUGGING — see what queries are actually running
mongoose.set('debug', process.env.NODE_ENV === 'development');
// Logs every query: Mongoose: orders.find({ userId: '...' }) { ... }
// Shows you if an index is being hit or if a query is doing a full collection scan`
    },

    // ── Debugging React in each environment ──
    {
      speaker: "you",
      text: `"What about the React side? I focus a lot on the server but I've had bugs that were entirely in the frontend — wrong API URL being called, environment variable not loading in Vite."`
    },
    {
      speaker: "raj",
      text: `"Vite's env variable rules trip everyone up once. What prefix were you using?"`
    },
    {
      speaker: "you",
      text: `"I was using REACT_APP_ because that's what Create React App uses. Took me an embarrassingly long time to figure out Vite wanted VITE_."`
    },
    {
      speaker: "raj",
      text: `"And if you use the wrong prefix, it's not an error — it's just undefined. Silently undefined. Your API URL becomes undefined, your fetch goes to <em>undefined/api/orders</em>, you get a 404 you can't explain. The prefix rule exists for a reason: Vite bundles everything in your .env file into the client-side JavaScript unless you put the variable name behind the prefix. Anything without VITE_ stays server-only. You don't want your Stripe secret key compiled into your React bundle."`
    },
    {
      speaker: "you",
      text: `"Source maps are another one — in production the error says something like 'at n (main.abc123.js:1:48291)' and I have no idea what that refers to."`
    },
    {
      speaker: "raj",
      text: `"That's the minified bundle. Source maps translate that back to your original file and line number. You have two options: generate source maps and <em>upload them to your error tracker</em> — Sentry, for example, maps minified stack traces back to source automatically. Or host the source maps privately, behind auth, and point your error tracker at them. What you don't want: public source maps on production. That's your entire application source code, readable by anyone."`
    },
    {
      type: "code",
      text: `// ── Vite environment variables — the rules ──
// client/.env.development
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=MyApp

// client/.env.production
VITE_API_URL=https://api.myapp.com/api
VITE_APP_NAME=MyApp

// NEVER do this in client .env — it will be bundled into your JS
// STRIPE_SECRET_KEY=sk_live_...   ← compiled into public bundle
// MONGO_URI=mongodb+srv://...     ← same
// JWT_SECRET=...                  ← same

// In your React code
const API_URL = import.meta.env.VITE_API_URL;

// Safety check — catch missing vars before they cause silent failures
if (!import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL is not set');  // crashes in development, visible immediately
}

// ── API service — single source of truth for the base URL ──
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout:         10000,
});

// Request interceptor — attach token, attach trace ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  config.headers['x-client-trace-id'] = crypto.randomUUID();
  return config;
});

// Response interceptor — centralised error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Source maps — Vite production config ──
// vite.config.js
export default defineConfig({
  build: {
    // Option 1: hidden source maps — not publicly served, only for your error tracker
    sourcemap: 'hidden',
    // 'hidden' generates .map files but removes the sourceMappingURL comment from bundles
    // Upload them to Sentry/Datadog, then delete from deploy — never publicly hosted
  },
});

// ── React DevTools in production ──
// DevTools are disabled in production builds automatically
// To debug a production issue locally: build and serve the production bundle
// "build:local": "VITE_API_URL=http://localhost:5000/api vite build && vite preview"
// You get the production bundle + source maps + local API — closest to production you can get locally`
    },

    // ── Seeding and realistic data ──
    {
      speaker: "you",
      text: `"The data thing keeps coming up. My local seed is basically three users and five orders, all perfectly shaped. I miss bugs that only appear with messy real-world data."`
    },
    {
      speaker: "raj",
      text: `"What does 'messy real-world data' look like for your app?"`
    },
    {
      speaker: "you",
      text: `"Users with no profile picture. Orders with items that have since been deleted. Addresses with unicode characters. That kind of thing."`
    },
    {
      speaker: "raj",
      text: `"So your seed should include all of those. Use Faker to generate realistic values, then manually add a few edge-case documents — the ones that would actually trip up your code. Null fields. Empty arrays. Very long strings. Deleted references. A seed script isn't there to make your local dev pretty, it's there to surface bugs before staging does."`
    },
    {
      speaker: "you",
      text: `"And if there's a bug I can only reproduce with production data — can I copy production data to local?"`
    },
    {
      speaker: "raj",
      text: `"Only if you can <em>anonymise it first</em>. Never copy real user emails, real addresses, real payment info to your local machine. Atlas has a mechanism to export and import, but run every document through an anonymisation script before it touches a non-production environment. Replace real emails with user_1@example.com, names with 'User One', addresses with fake ones from Faker. The shape and relationships are preserved. The real data isn't."`
    },
    {
      type: "code",
      text: `// ── Seed script with realistic edge cases ──
// scripts/seed.js  —  run with: node scripts/seed.js

import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();  // always start fresh

  // ── Happy path users ──
  const users = await User.insertMany(
    Array.from({ length: 20 }, () => ({
      email:     faker.internet.email(),
      name:      faker.person.fullName(),
      avatar:    faker.image.avatar(),
      createdAt: faker.date.past({ years: 2 }),
    }))
  );

  // ── Edge cases — the ones that break things ──
  await User.insertMany([
    { email: 'no-avatar@example.com',   name: 'No Avatar User',  avatar: null },
    { email: 'unicode@example.com',     name: 'Ünïcödé Ñämé',   avatar: null },
    { email: 'very-long@example.com',   name: 'A'.repeat(100),   avatar: null },
    { email: 'deleted-ref@example.com', name: 'Has Orphan Data', avatar: null },
  ]);

  // ── Orders — including deleted product references ──
  const deletedProductId = new mongoose.Types.ObjectId();  // won't exist in products

  await Order.insertMany([
    // Normal orders
    ...Array.from({ length: 50 }, () => ({
      userId:   faker.helpers.arrayElement(users)._id,
      items:    Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        productId: new mongoose.Types.ObjectId(),
        name:      faker.commerce.productName(),
        price:     parseFloat(faker.commerce.price()),
        qty:       faker.number.int({ min: 1, max: 10 }),
      })),
      status:   faker.helpers.arrayElement(['pending', 'confirmed', 'shipped', 'delivered']),
      total:    parseFloat(faker.commerce.price({ min: 20, max: 500 })),
    })),
    // Edge case: order with a reference to a product that no longer exists
    {
      userId:   users[0]._id,
      items:    [{ productId: deletedProductId, name: '[deleted product]', price: 29.99, qty: 1 }],
      status:   'confirmed',
      total:    29.99,
    },
    // Edge case: order with zero items (shouldn't exist, but does in prod data)
    {
      userId:   users[1]._id,
      items:    [],
      status:   'pending',
      total:    0,
    },
  ]);

  console.log('Seed complete');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });

// ── Anonymising production data for local debugging ──
// scripts/anonymise.js — run against an export before importing locally
const anonymise = (doc) => ({
  ...doc,
  email:          \`user_\${doc._id}@example.com\`,
  name:           faker.person.fullName(),
  phone:          faker.phone.number(),
  shippingAddress: {
    street: faker.location.streetAddress(),
    city:   faker.location.city(),
    zip:    faker.location.zipCode(),
  },
  // Preserve: _id, createdAt, status, items, total — shape matters
  // Replace: anything that identifies a real person
});`
    },

    // ── CI and pre-deploy checks ──
    {
      speaker: "you",
      text: `"I don't have CI set up yet. I just push to main and deploy manually. I keep telling myself I'll add it."`
    },
    {
      speaker: "raj",
      text: `"What would have caught the last three bugs before they reached staging?"`
    },
    {
      speaker: "you",
      text: `"One was a test that didn't exist. One was a lint error I ignored locally. One was the CORS thing — the env variable wasn't set."`
    },
    {
      speaker: "raj",
      text: `"Three different checks, all automated, ten minutes of setup. A GitHub Action that runs on every push to main: lint, test, and a startup check that verifies all required env variables are present. If any of those fail, the deploy doesn't happen. You don't get to merge a PR that breaks the test suite."`
    },
    {
      speaker: "you",
      text: `"What about the env variable check — you can't run the actual server in CI without all the secrets."`
    },
    {
      speaker: "raj",
      text: `"You don't run the server in CI. You run the validateEnv check in isolation — a separate script that imports your config module and exits zero if everything's present, non-zero if not. CI has fake values for secrets — enough to pass the presence check without needing real credentials. Tests use mongodb-memory-server so there's no real database either. The pipeline is self-contained."`
    },
    {
      type: "code",
      text: `// ── GitHub Actions CI pipeline ──
// .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'  # reads your .nvmrc — consistent versions
          cache: 'npm'

      - name: Install dependencies
        run: npm ci  # ci instead of install — uses lockfile exactly, fails on drift

      # ── Fake env vars for CI — presence only, not real secrets ──
      - name: Create test env
        run: |
          echo "NODE_ENV=test"                        >> .env.test
          echo "PORT=5001"                            >> .env.test
          echo "MONGO_URI=mongodb://localhost/test"   >> .env.test
          echo "JWT_SECRET=ci_fake_secret_do_not_use" >> .env.test
          echo "CORS_ORIGIN=http://localhost:5173"    >> .env.test

      - name: Lint
        run: npm run lint

      - name: Type check  # if using TypeScript
        run: npm run typecheck

      - name: Validate env config
        run: node -e "import('./src/config/validateEnv.js').then(() => console.log('env ok'))"
        env:
          NODE_ENV: test
          MONGO_URI: mongodb://localhost/test
          JWT_SECRET: ci_fake_secret
          CORS_ORIGIN: http://localhost:5173

      - name: Run tests
        run: npm test -- --coverage --forceExit
        # mongodb-memory-server handles its own database — no external Mongo needed

      - name: Build (catch compile errors)
        run: npm run build

// ── scripts/check-env.js — validate env in isolation ──
// Can be run standalone: node scripts/check-env.js
import { config } from '../src/config/validateEnv.js';
// validateEnv calls process.exit(1) on missing vars — CI step fails if this does
console.log('Environment config valid:', Object.keys(config).join(', '));

// ── The pre-deploy checklist that CI automates ──
// Without CI, you manually remember to:
// □ npm test
// □ npm run lint
// □ check all env vars are set in target environment
// □ verify Node version matches production
// □ run the build to catch type errors
//
// With CI: forgetting any of these is impossible.
// The deploy doesn't happen if the pipeline doesn't pass.`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"You came in here because a bug existed in production that didn't exist on your machine. Walk me back through why that happens."`
    },
    {
      speaker: "you",
      text: `"The environments weren't actually equivalent. Different data, possibly different Node version, definitely different env variables — CORS origin wasn't set, probably other things. And I had no automated check to catch any of it before it shipped."`
    },
    {
      speaker: "raj",
      text: `"And now?"`
    },
    {
      speaker: "you",
      text: `"Validate env variables at startup so the server refuses to start with a missing config. Consistent Node version via .nvmrc. Realistic seed data with edge cases so local catches what staging would. CI runs lint, tests, and env validation on every push. Structured logs so when something does go wrong in staging, I can read what actually happened instead of guessing."`
    },
    {
      speaker: "raj",
      text: `"'It works on my machine' is almost always an environment problem, not a code problem. Once you treat your environments like infrastructure — versioned, validated, automated — it stops being a debugging problem and becomes a boring Tuesday."`
    },

    {
      type: "summary",
      points: [
        "Every 'works on my machine' bug lives in one of four categories: data, runtime, configuration, or secrets. Before touching any code, identify which one. Two hours of debugging without doing this is guessing. The environments map: local for fast development feedback, test for automated CI runs, staging as a production mirror for validation, production for users. You only move forward when the previous environment passes.",
        "Never commit .env files. The committed file is .env.example — every variable name with placeholder values, serving as the contract for the project. Actual .env files are in .gitignore. Production secrets live in a secrets manager (Railway, AWS Secrets Manager, Doppler) and are injected at runtime as environment variables. They never touch disk. Validate all required variables at server startup and call process.exit(1) if anything is missing — crash loudly on startup rather than silently at runtime.",
        "Run MongoDB locally in Docker via docker-compose.yml — same version every time, no 'did I start Mongo' mental overhead. Pin the image version, never use 'latest'. For tests, use mongodb-memory-server: an in-process MongoDB instance that starts before each suite and tears down after. Tests are fully self-contained, run identically on any machine, and never leave state that bleeds between test runs.",
        "CORS origin must be driven by an environment variable, never hardcoded. CORS_ORIGIN=http://localhost:5173 locally, the real domain in production. Wildcard in production is not a fix — it disables a browser security mechanism that exists to prevent real attacks. CORS is a browser constraint only; Postman and server-to-server calls are unaffected by it. Most 'breaks in staging' CORS bugs are a missing environment variable in the staging deployment config.",
        "One central error handler in Express with four parameters at the bottom of the middleware stack. All async routes use asyncHandler to funnel unhandled rejections to it. The handler logs the real error internally every time, then gates what it sends to the client on NODE_ENV: full stack trace in development, generic message in production. A custom AppError class carries a status code so operational errors (404, 401, 422) are distinguishable from unexpected ones (500). Never send internal error details to clients in production.",
        "Replace console.log with a structured logger (pino or winston). Every log line is JSON with consistent keys. Log level is controlled by an environment variable — debug in development, warn in production. The most useful habit: log the inputs at the entry point of every request handler. When a staging bug appears, your logs show exactly what the server received, which user triggered it, and what happened at every step. Debugging a staging issue without structured logs is archaeology.",
        "Debugging a staging-only bug: start with environment variables (are they all set and correct?), then Node version parity (.nvmrc), then data shape (is there a document in staging with a null field or missing relationship that your local seed doesn't cover?). Attach the VS Code debugger to a running nodemon process for breakpoint-level precision. Enable Mongoose query debug logging in development to see exactly what queries are running and whether indexes are being used.",
        "Vite requires the VITE_ prefix for any environment variable the client needs. Wrong prefix means silently undefined — no error, your API URL becomes 'undefined/api/endpoint', you get a confusing 404. Create a single api.js service file that reads the base URL once from import.meta.env.VITE_API_URL and throws on startup if it's missing. All fetch calls go through this service — one place to update the URL, one place to add auth headers and error interceptors. Never scatter raw fetch calls across components.",
        "Seed data should include edge cases, not just happy-path fixtures: null optional fields, empty arrays, unicode in string fields, references to deleted documents, zero-item collections. The seed's job is to surface bugs before staging does. When you need production data shapes locally, anonymise it first — preserve _id, timestamps, and relationships, replace all PII with Faker-generated values. Never copy real user data to a non-production environment.",
        "A GitHub Actions pipeline running on every push to main should: install with npm ci (not npm install — lockfile must match exactly), run lint, run tests (mongodb-memory-server, no external database needed), validate that all required environment variables are present using your validateEnv module with fake CI values, and run a production build to catch compile-time errors. If the pipeline fails, the deploy does not happen. Three lines of CI config prevent more bugs than three days of manual testing."
      ]
    }
  ]
};

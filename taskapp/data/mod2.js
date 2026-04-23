// ─── MODULE 2: express server setup ──────────────────────────────────────────
STEPS.push(

  { /* step 46 — intro */
    mod: 2,
    alex: [
      "alright {name}, this is where the app actually starts. we've got git, linting, formatting, commit hooks — all the scaffolding. now let's build the server.",
      "by the end of this module you'll have a real Express server running locally — with proper middleware, a health check route, centralised error handling, and graceful shutdown. something you could actually deploy right now.",
      "we're going to build this the way a senior dev would: structure first, then dependencies, then code. no jumping straight into index.js and figuring it out as we go.",
    ],
    nextOn: 'ok',
    after: "type 'ok' to see what we're building.",
  },

  { /* step 47 — module outline */
    mod: 2,
    alex: [
      "here's the full scope for this module.",
    ],
    callout: {
      type: 'info',
      label: "module 2 covers",
      items: [
        "server/ folder structure — config/, controllers/, middleware/, routes/, models/",
        "server/package.json — the server's own workspace config",
        "installing Express and all core middleware packages",
        "server/index.js — entry point, env loading, app initialisation",
        "env var validation — fail loudly at startup if config is missing",
        "middleware stack — cors, helmet, morgan, express.json in the right order",
        "health check route — GET /api/health",
        "centralised error handler middleware",
        "graceful shutdown — SIGTERM and SIGINT handling",
      ],
    },
    nextOn: 'lets go',
    after: "type 'lets go' to start.",
  },

  { /* step 48 — folder structure explanation */
    mod: 2,
    alex: [
      "before we write a single line of code, let's set up the server's folder structure. this matters more than most people realise.",
      "a flat server/ folder with everything dumped in the root is a maintainability disaster once you have 10+ route files. the structure we're creating is a standard MVC-adjacent pattern used in production Express apps: routes define the URL endpoints, controllers contain the business logic, models define the data shape, middleware contains reusable request processors, and config holds initialisation code.",
      "creating the structure first — even before the files that go in them — means every file you create from this point has an obvious home.",
    ],
    after: "create the server subdirectories.",
    task: {
      type: 'cmd',
      hint: "cd into server/ first, then mkdir with all folder names at once: config, controllers, middleware, models, routes",
      answer: "cd server && mkdir config controllers middleware models routes",
      check(input) {
        const ok =
          input.includes('mkdir') &&
          input.includes('config') &&
          input.includes('controllers') &&
          input.includes('middleware') &&
          input.includes('routes');
        return {
          ok,
          msg: ok ? "server structure created." : "create all five folders: config, controllers, middleware, models, routes.",
        };
      },
    },
  },

  { /* step 49 — server package.json */
    mod: 2,
    alex: [
      "the server is its own independent Node app — it gets its own package.json. this is how npm workspaces work: each workspace has its own dependencies, its own scripts, its own metadata.",
      "one important decision here: we're using ES modules ('type': 'module'). that means import/export syntax throughout the server code — no require(). this is the modern standard, it's what we set up ESLint to expect, and it's consistent with how the React frontend works.",
      "run npm init from inside the server/ directory. if you're still in the root, cd into server first.",
    ],
    after: "initialise package.json inside the server/ directory.",
    task: {
      type: 'cmd',
      hint: "make sure you're inside server/, then npm init -y",
      answer: "npm init -y",
      check(input) {
        const ok = input.includes('npm init') && input.includes('-y');
        return {
          ok,
          msg: ok ? "server package.json created." : "run npm init -y inside the server/ directory.",
        };
      },
    },
  },

  { /* step 50 — update server package.json */
    mod: 2,
    alex: [
      "now update the server's package.json. the critical addition here is 'type': 'module' — without this, Node treats .js files as CommonJS and your import statements will fail with a syntax error.",
      "the scripts block: 'dev' uses nodemon (which we'll install in a moment) to auto-restart on file changes. 'start' uses plain node for production — no nodemon in prod, ever. the NODE_ENV=production prefix on start ensures the app knows it's running in production mode.",
    ],
    after: "replace server/package.json with the full version.",
    task: {
      type: 'code',
      file: 'server/package.json',
      lang: 'json',
      hint: "set name to 'mern-tasks-server', type to 'module', add scripts with dev (nodemon index.js) and start (node index.js), set main to index.js",
      answer:
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
  "license": "MIT"
}`,
      check(input) {
        const ok =
          input.includes('"type": "module"') &&
          input.includes('nodemon') &&
          input.includes('"start"');
        return {
          ok,
          msg: ok ? "server package.json configured." : "make sure you have type: module, a dev script with nodemon, and a start script with node.",
        };
      },
    },
  },

  { /* step 51 — install core dependencies */
    mod: 2,
    alex: [
      "now install the core dependencies. let me walk you through what each one does so you're not just copying a command blindly.",
      "'express' is the web framework — it handles routing, middleware, request/response. 'dotenv' loads environment variables from .env into process.env at startup. 'cors' handles Cross-Origin Resource Sharing — without it, your React frontend on localhost:5173 can't talk to your API on localhost:5000. 'helmet' sets security-related HTTP headers automatically — things like Content-Security-Policy, X-Frame-Options. 'morgan' is an HTTP request logger — logs every request with method, URL, status code, and response time.",
      "make sure you're inside server/ when you run this.",
    ],
    after: "install all five core packages in the server workspace.",
    task: {
      type: 'cmd',
      hint: "npm install express dotenv cors helmet morgan",
      answer: "npm install express dotenv cors helmet morgan",
      check(input) {
        const ok =
          input.includes('express') &&
          input.includes('dotenv') &&
          input.includes('cors') &&
          input.includes('helmet') &&
          input.includes('morgan');
        return {
          ok,
          msg: ok ? "core dependencies installed." : "install all five: express, dotenv, cors, helmet, and morgan.",
        };
      },
    },
  },

  { /* step 52 — install dev dependencies */
    mod: 2,
    alex: [
      "now install nodemon as a dev dependency. nodemon watches your files and automatically restarts the Node process when it detects changes — so you don't have to manually stop and restart the server every time you edit a file.",
      "it goes in devDependencies because it's a development convenience, not something your production server needs. when you deploy, you use 'node index.js' directly — not nodemon.",
    ],
    after: "install nodemon as a dev dependency in the server workspace.",
    task: {
      type: 'cmd',
      hint: "npm install --save-dev nodemon",
      answer: "npm install --save-dev nodemon",
      check(input) {
        const ok = input.includes('nodemon') && (input.includes('--save-dev') || input.includes('-D'));
        return {
          ok,
          msg: ok ? "nodemon installed as dev dependency." : "install nodemon with --save-dev so it goes into devDependencies.",
        };
      },
    },
  },

  { /* step 53 — helmet quiz */
    mod: 2,
    alex: [
      "you just installed helmet but i want to make sure you actually understand what it does — because 'security headers' is a vague term that a lot of people nod at without knowing what it means.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "helmet sets HTTP response headers automatically. which of these is a real security risk that helmet helps mitigate?",
      multi: false,
      options: [
        "SQL injection attacks via malformed query parameters",
        "clickjacking — where an attacker embeds your site in an iframe to trick users into clicking things",
        "brute force login attacks by rate-limiting requests",
        "XSS attacks by sanitising user input before it hits your database",
      ],
      correct: [1],
      explanation: "helmet sets the X-Frame-Options header to DENY by default, which prevents your app from being embedded in an iframe — this stops clickjacking. it also sets Content-Security-Policy to control what resources can load, X-Content-Type-Options to prevent MIME sniffing, and several others. it doesn't do rate limiting (that's express-rate-limit) or input sanitisation (that's your validation middleware).",
      hint: "think about what HTTP headers can actually control — they're about the browser's behaviour, not the server's logic.",
    },
  },

  { /* step 54 — server .env */
    mod: 2,
    alex: [
      "create the server's .env file. this is the actual file with real values — not the .env.example template. it's gitignored so it stays on your machine only.",
      "we're putting it inside server/ rather than the root because these are server-specific variables. the client will have its own environment config later. keeping them separate means you always know which variables belong to which app.",
      "for now, MONGO_URI is a placeholder — we'll fill in the real Atlas URI in the next module. PORT and NODE_ENV are ready to go.",
    ],
    after: "create server/.env with the development values.",
    task: {
      type: 'code',
      file: 'server/.env',
      lang: 'properties',
      hint: "set NODE_ENV=development, PORT=5000, MONGO_URI as a placeholder for localhost mongodb, and JWT_SECRET as a placeholder string",
      answer:
`NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/mern-tasks
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d`,
      check(input) {
        const ok =
          input.includes('NODE_ENV') &&
          input.includes('PORT') &&
          input.includes('MONGO_URI');
        return {
          ok,
          msg: ok ? "server .env created." : "include at least NODE_ENV, PORT, and MONGO_URI in server/.env.",
        };
      },
    },
  },

  { /* step 55 — env validation module */
    mod: 2,
    alex: [
      "here's a pattern that most tutorials skip but that matters enormously in production: validate your environment variables at startup before the server does anything else.",
      "imagine your server starts, connects to the DB, registers all routes — and then 3 minutes later, when a user tries to log in, it crashes because JWT_SECRET is undefined. that's a terrible experience and a hard bug to diagnose.",
      "instead: check for all required variables the moment the process starts. if anything is missing, print a clear error message listing exactly what's missing and exit immediately. fail fast, fail loudly. the server should never reach a half-working state.",
    ],
    after: "create server/config/validateEnv.js.",
    task: {
      type: 'code',
      file: 'server/config/validateEnv.js',
      lang: 'javascript',
      hint: "export a function that checks an array of required variable names against process.env. if any are missing, log which ones are missing and call process.exit(1)",
      answer:
`const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
];

export const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(\`   - \${key}\`));
    console.error('Check your .env file and try again.');
    process.exit(1);
  }
};`,
      check(input) {
        const ok =
          input.includes('process.exit') &&
          input.includes('process.env') &&
          (input.includes('missing') || input.includes('filter'));
        return {
          ok,
          msg: ok ? "env validation module created." : "the function should check for missing variables and call process.exit(1) if any are absent.",
        };
      },
    },
  },

  { /* step 56 — server/index.js */
    mod: 2,
    alex: [
      "now the entry point. server/index.js is the first file Node runs — it's responsible for loading env vars, validating them, setting up Express, registering middleware, and starting the server.",
      "the import order matters: dotenv.config() must be the very first thing that runs, before any other imports that might read from process.env. if you import your db config before dotenv loads, process.env.MONGO_URI will be undefined.",
      "we're not connecting to the database yet — that's the next module. for now, we're building the HTTP layer and making sure it starts cleanly.",
    ],
    after: "create server/index.js — the server entry point.",
    task: {
      type: 'code',
      file: 'server/index.js',
      lang: 'javascript',
      hint: "import dotenv first and call dotenv.config(). then import validateEnv and call it. import express, cors, helmet, morgan. create the app, register middleware, add a placeholder for routes, add a placeholder for error handler, then app.listen() on process.env.PORT || 5000 with a startup log.",
      answer:
`import 'dotenv/config';

import { validateEnv } from './config/validateEnv.js';

validateEnv();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

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
// routes will be registered here in future modules

// ── error handler ─────────────────────────────────────────────────────────────
// error handler will be registered here after routes

// ── start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT} in \${process.env.NODE_ENV} mode\`);
});

// ── graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(\`\\n\${signal} received. Shutting down gracefully...\`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));`,
      check(input) {
        const ok =
          (input.includes("import 'dotenv/config'") || input.includes('dotenv')) &&
          input.includes('app.use(helmet())') &&
          input.includes('app.listen') &&
          input.includes('SIGTERM');
        return {
          ok,
          msg: ok ? "server entry point created." : "make sure dotenv loads first, helmet/cors/morgan are registered, server listens on PORT, and SIGTERM/SIGINT are handled.",
        };
      },
    },
  },

  { /* step 57 — middleware order quiz */
    mod: 2,
    alex: [
      "you registered middleware in a specific order in index.js. this is not arbitrary — Express processes middleware in the order it's registered, and getting it wrong causes real bugs.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "you register express.json() after your route handlers. what happens when a POST request with a JSON body hits one of those routes?",
      multi: false,
      options: [
        "it works fine — Express processes all middleware before routes regardless of order",
        "req.body will be undefined — the body parser hasn't run yet when the route handler executes",
        "Express throws an error and the request is rejected",
        "the JSON is parsed but any validation middleware will miss it",
      ],
      correct: [1],
      explanation: "Express middleware runs in registration order. if express.json() comes after your route, req.body is undefined when your route handler runs — the body hasn't been parsed yet. your route tries to read req.body.email and gets undefined. no error is thrown, the code just silently uses undefined values. this is a class of bug that's hard to diagnose if you don't understand middleware order.",
      hint: "think about what 'in order' means — if the body parser hasn't run yet, what state is req.body in?",
    },
  },

  { /* step 58 — health check route */
    mod: 2,
    alex: [
      "add a health check route. this is a standard pattern for any deployed API — a simple endpoint that returns basic server status information. deployment platforms like Railway and Render use it to verify your app is alive. monitoring tools ping it on a schedule.",
      "it should return: whether the server is up, the current environment, uptime in seconds, and a timestamp. nothing sensitive, just enough to confirm the server is running and healthy.",
      "we're putting this directly in index.js for now since it's a single route. once we have more routes, they'll move to their own files in routes/.",
    ],
    after: "add the health check route to server/index.js, above the error handler comment.",
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
// routes will be registered here in future modules

// ── error handler ─────────────────────────────────────────────────────────────
// error handler will be registered here after routes`,
      hint: "add app.get('/api/health', ...) that returns a JSON object with status: 'ok', environment from process.env.NODE_ENV, uptime from process.uptime(), and a timestamp",
      answer:
`import 'dotenv/config';

import { validateEnv } from './config/validateEnv.js';

validateEnv();

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

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

// ── error handler ─────────────────────────────────────────────────────────────
// error handler will be registered here after routes`,
      check(input) {
        const ok =
          input.includes('/api/health') &&
          input.includes('status') &&
          input.includes('uptime') &&
          input.includes('res.json');
        return {
          ok,
          msg: ok ? "health check route added." : "add a GET /api/health route that returns status, environment, uptime, and timestamp.",
        };
      },
    },
  },

  { /* step 59 — error handler middleware */
    mod: 2,
    alex: [
      "now the centralised error handler. here's why this matters: without it, every route has to handle its own errors. you end up with try/catch blocks everywhere, inconsistent error response shapes, and no single place to add logging.",
      "Express has a special middleware signature for error handlers — it takes four arguments: (err, req, res, next). the fourth argument is what tells Express 'this is an error handler'. it must be registered after all routes, because it only fires when a route calls next(err) or throws an unhandled error.",
      "the response shape we're using — { success: false, message, stack (dev only) } — is consistent. every error from every route will look the same to the frontend. that makes error handling on the client side much simpler.",
    ],
    after: "create server/middleware/errorHandler.js.",
    task: {
      type: 'code',
      file: 'server/middleware/errorHandler.js',
      lang: 'javascript',
      hint: "export a function with signature (err, req, res, next). read err.statusCode or default to 500. read err.message or default to 'Server Error'. respond with json containing success: false, message, and stack only in development.",
      answer:
`export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};`,
      check(input) {
        const ok =
          input.includes('err, req, res, next') &&
          input.includes('statusCode') &&
          input.includes('success: false');
        return {
          ok,
          msg: ok ? "error handler middleware created." : "the error handler needs four parameters (err, req, res, next), a statusCode, and a consistent JSON response shape with success: false.",
        };
      },
    },
  },

  { /* step 60 — wire error handler */
    mod: 2,
    alex: [
      "wire the error handler into index.js. two things to know: first, it must be imported and registered after all your routes — Express only invokes it when a route calls next(err), so routes need to exist first. second, the four-parameter signature is not optional. if you accidentally write a three-parameter error handler, Express treats it as regular middleware and your errors will never reach it.",
      "also add a 404 handler just before the error handler — for any route that doesn't match, return a clean 'not found' response rather than Express's default HTML error page.",
    ],
    after: "update server/index.js to import and wire the error handler and add a 404 handler.",
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

// ── error handler ─────────────────────────────────────────────────────────────
// error handler will be registered here after routes`,
      hint: "import errorHandler from ./middleware/errorHandler.js. add a 404 catch-all route: app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' })). then register app.use(errorHandler) as the very last middleware.",
      answer:
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
app.use(errorHandler);

// ── start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT} in \${process.env.NODE_ENV} mode\`);
});

// ── graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(\`\\n\${signal} received. Shutting down gracefully...\`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));`,
      check(input) {
        const ok =
          input.includes('errorHandler') &&
          input.includes('404') &&
          input.includes('app.use(errorHandler)');
        return {
          ok,
          msg: ok ? "error handler and 404 handler wired up." : "import errorHandler, add a 404 catch-all, then register app.use(errorHandler) as the last middleware.",
        };
      },
    },
  },

  { /* step 61 — error handler quiz */
    mod: 2,
    alex: [
      "the error handler has a very specific requirement that catches people out. let's make sure you've got it.",
    ],
    after: "answer below.",
    task: {
      type: 'quiz',
      question: "why does Express error-handling middleware require exactly four parameters — (err, req, res, next) — even if you don't use 'next'?",
      multi: false,
      options: [
        "it's just a convention — the parameter count doesn't affect behaviour",
        "Express uses the function's .length property to detect error handlers — three parameters means regular middleware, four means error handler",
        "the 'err' parameter only gets populated if the function signature has four parameters",
        "you always need next in error handlers to pass the error to the next handler",
      ],
      correct: [1],
      explanation: "Express literally checks function.length — the number of declared parameters. if it's 4, Express treats it as an error handler and only invokes it when next(err) is called. if it's 3, it's treated as regular middleware that runs on every request. this is why you see (_err, _req, res, _next) patterns — the underscores signal intentionally unused params while keeping the count at 4.",
      hint: "Express has to distinguish error handlers from regular middleware somehow — how might it do that programmatically?",
    },
  },

  { /* step 62 — test the server */
    mod: 2,
    alex: [
      "let's actually run it. start the server in dev mode and you should see the startup log. then hit the health route to confirm everything is wired up correctly.",
      "if you see '🚀 Server running on port 5000 in development mode' in the terminal, the server started. then in another terminal (or Postman), hit GET http://localhost:5000/api/health. you should get back a JSON response with status 'ok'.",
      "if you see an error about missing env vars — that's the validateEnv() function working correctly. check your server/.env file.",
    ],
    after: "start the server in development mode.",
    task: {
      type: 'cmd',
      hint: "npm run dev from inside the server/ directory",
      answer: "npm run dev",
      check(input) {
        const ok = input.includes('npm run dev') || input.includes('npm start');
        return {
          ok,
          msg: ok ? "server started. check the terminal for the startup log and hit /api/health to confirm." : "run npm run dev from inside server/ to start with nodemon.",
        };
      },
    },
  },

  { /* step 63 — commit */
    mod: 2,
    alex: [
      "server is running, health check works, error handling is in place. time to commit.",
      "stop the dev server first (Ctrl+C), then commit from the project root so we capture all the new server files together.",
    ],
    after: "stage everything and commit with a conventional commit message.",
    task: {
      type: 'cmd',
      hint: "cd back to the root first, then git add . and git commit -m 'feat: add express server with middleware and health route'",
      answer: "git add . && git commit -m 'feat: add express server with middleware and health route'",
      check(input) {
        const hasAdd = input.includes('git add');
        const hasCommit = input.includes('git commit') && input.includes('-m');
        const hasConventional = /['"]?(feat|fix|chore|docs|style|refactor|test|build|ci)(\(.+\))?:/.test(input);
        const ok = hasAdd && hasCommit && hasConventional;
        return {
          ok,
          msg: ok ? "committed." : "stage with git add . and use a conventional commit message — e.g. 'feat: add express server...'",
        };
      },
    },
  },

  { /* step 64 — wrap up */
    mod: 2,
    alex: [
      "module 2 done. you have a real Express server — not a hello world, but a production-shaped one. security headers, request logging, CORS configured, body parsing, centralised error handling, graceful shutdown, a health check route.",
      "that structure you set up — config/, middleware/, routes/, controllers/, models/ — every file we write from here will slot into one of those folders. it'll feel natural in about two modules.",
      "next: we connect MongoDB. we'll set up a free Atlas cluster, wire up Mongoose, write the connection module, handle connection events, and make sure the server only starts once the database is ready.",
    ],
  },

);

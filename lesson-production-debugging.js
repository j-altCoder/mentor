// ─────────────────────────────────────────────────────────────────
//  LESSON: Production Debugging in a MERN App
//  Category: Backend Engineering
// ─────────────────────────────────────────────────────────────────

const LESSON_PRODUCTION_DEBUGGING = {
  category: "Code Quality & Debugging",
  tag: "Production Debugging",
  title: "The App Is Broken and You Don't Know Why",
  intro: "Everything worked on your machine. You pushed to production at 3pm on a Friday. By 3:15, Slack is lighting up. The app is slow, some requests are erroring, and you have no idea where to start. Raj opens his laptop.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"Something's wrong in prod. Users are getting errors on checkout. I've been staring at the code for 20 minutes and I can't reproduce it locally."`
    },
    {
      speaker: "raj",
      text: `"What's the error?"`
    },
    {
      speaker: "you",
      text: `"I don't know. Users are just saying it's broken. I added a console.log in a few places and deployed again but nothing's showing up."`
    },
    {
      speaker: "raj",
      text: `"Okay. First thing: console.log is not a production debugging tool. It's a development tool. In production you have no console — you have logs that get written somewhere, and only if you've set up logging properly. What do your logs look like right now?"`
    },
    {
      speaker: "you",
      text: `"I'm using console.log everywhere. I can see them in the Heroku log stream but it's just a wall of text with no structure."`
    },
    {
      speaker: "raj",
      text: `"That's the first thing we're fixing. A wall of text isn't logs — it's noise. Real logging is <em>structured</em>: every log line is a JSON object with a timestamp, a severity level, a message, and context. You can query it, filter it, set alerts on it. 'Something is broken' becomes 'show me every log line where level is error, from the past 30 minutes, on the /checkout route.' That's how you find what's actually wrong."`
    },

    // ── Setting up structured logging ──
    {
      speaker: "you",
      text: `"So I need a logging library? What's wrong with console.log exactly?"`
    },
    {
      speaker: "raj",
      text: `"console.log gives you a flat string. You can't attach metadata. You can't filter by severity — every console.log is the same level as every other. You can't add a request ID so you can trace one user's journey through your logs. And in Node it's synchronous by default, which means if you're logging heavily under load you're blocking the event loop. Use <em>pino</em> or <em>winston</em>. Pino is faster — it uses a worker thread for I/O and serialises objects asynchronously. For a MERN app pino is the right default."`
    },
    {
      speaker: "you",
      text: `"What should I actually log? I don't want to log everything."`
    },
    {
      speaker: "raj",
      text: `"Think in levels. <em>error</em>: something broke and requires attention — an unhandled exception, a failed database write, a call to an external API that 500'd. <em>warn</em>: something unexpected happened but we recovered — a retry that eventually succeeded, a deprecated code path being hit. <em>info</em>: routine events you want a record of — a user signed up, an order was placed, a cron job ran. <em>debug</em>: verbose detail you only want in development or when actively investigating — query parameters, full request bodies. The rule: in production, run at info level. When something breaks and you need more detail, temporarily drop to debug without redeploying."`
    },
    {
      type: "code",
      text: `// ── Before: console.log everywhere ──
app.post('/checkout', async (req, res) => {
  console.log('checkout hit');
  const order = await createOrder(req.body);
  console.log('order created', order);
  res.json(order);
});
// In production this gives you:
// checkout hit
// order created [object Object]
// No timestamp. No severity. No request ID. No way to query.

// ── After: structured logging with pino ──
// npm install pino pino-http

// logger.js
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',  // override to 'debug' via env without redeploy
  formatters: {
    level: (label) => ({ level: label }),  // write level as string, not number
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'body.password', 'body.cardNumber'],  // never log secrets
});

module.exports = logger;

// server.js
const pinoHttp = require('pino-http');
app.use(pinoHttp({
  logger,
  // Assign a unique ID to every request — use this to trace a single user's journey
  genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400)        return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => \`\${req.method} \${req.url} \${res.statusCode}\`,
}));

// In your route handlers — req.log is the request-scoped logger (has requestId)
app.post('/checkout', async (req, res) => {
  req.log.info({ userId: req.userId, itemCount: req.body.items.length }, 'checkout.started');

  try {
    const order = await createOrder(req.body);
    req.log.info({ orderId: order._id, total: order.total }, 'checkout.completed');
    res.json(order);
  } catch (err) {
    req.log.error({ err, userId: req.userId }, 'checkout.failed');
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// What a log line looks like now:
// {"level":"info","time":"2024-03-15T14:32:01.123Z","requestId":"a3f9...","userId":"u_123","orderId":"ord_456","total":89.99,"msg":"checkout.completed"}
// You can now query: level=error AND msg=checkout.failed AND time>14:00
// That's the difference between debugging and guessing.`
    },

    // ── Error handling ──
    {
      speaker: "you",
      text: `"Right now if something throws inside a route, Express just hangs the request or sends back an HTML error page. I've seen users screenshot the stack trace."`
    },
    {
      speaker: "raj",
      text: `"Stack traces in the browser is one of the worst things you can ship to production. You're handing an attacker a map of your codebase — file paths, library versions, internal function names. And beyond the security problem: a hanging request means the user gets nothing. No error message, no way to retry, just a spinner that eventually times out. You need two things: a global error handler in Express, and something that catches unhandled promise rejections before they crash the process."`
    },
    {
      speaker: "you",
      text: `"I thought Express handles errors automatically?"`
    },
    {
      speaker: "raj",
      text: `"It handles synchronous errors if you call next(err). It does not handle async errors unless you call next(err) explicitly in your catch block, or you're on Express 5 which catches async errors automatically. Express 4 — which most apps still run — silently swallows a rejected promise in a route handler. The request hangs. You see nothing in the logs. The user sees nothing. They just sit there. Always wrap async route handlers, or use a wrapper that does it for you. And always define a final error-handling middleware at the bottom — four parameters, that's how Express knows it's an error handler."`
    },
    {
      type: "code",
      text: `// ── The problem: unhandled async errors in Express 4 ──
app.get('/orders', async (req, res) => {
  const orders = await Order.find({ userId: req.userId });  // throws → request hangs
  res.json(orders);
  // No try/catch. Promise rejection is swallowed. Request never resolves.
});

// ── Fix 1: asyncHandler wrapper — wrap every async route ──
// npm install express-async-errors  (patches Express to handle async automatically)
require('express-async-errors');  // add this before any routes — that's all you need

// Or a manual wrapper if you prefer explicit
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);  // any rejection → next(err)
};

app.get('/orders', asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.userId });
  res.json(orders);
}));

// ── Fix 2: global error-handling middleware ──
// Must be defined LAST, after all routes. Four params = error handler.
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isOperational = err.isOperational === true;  // expected errors vs unexpected bugs

  // Log everything — but differently based on severity
  if (status >= 500) {
    req.log.error({ err, requestId: req.id }, 'unhandled error');
  } else {
    req.log.warn({ err, requestId: req.id }, 'client error');
  }

  // Never expose internals to the client
  res.status(status).json({
    error:     isOperational ? err.message : 'Something went wrong',
    requestId: req.id,  // give the user this ID — they can paste it in a support ticket
    // No stack trace. No file paths. No library versions.
  });
});

// ── Custom error class for operational errors ──
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode   = statusCode;
    this.isOperational = true;  // expected — don't page anyone, just log and respond
  }
}

// Usage in routes
app.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);  // controlled, non-alarming
  if (order.userId !== req.userId) throw new AppError('Forbidden', 403);
  res.json(order);
}));

// ── Catch what Express doesn't see ──
// Unhandled promise rejection outside route handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'unhandledRejection — investigate immediately');
  // Don't crash silently. If this is a critical error, let the process restart cleanly.
  process.exit(1);  // let your process manager (PM2, container orchestrator) restart it
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException — process is in undefined state');
  process.exit(1);
});`
    },

    // ── Can't reproduce locally ──
    {
      speaker: "you",
      text: `"The issue I hit most often is: error is happening in prod, I can't reproduce it locally. Local has different data, different env vars, no traffic. Where do you even start?"`
    },
    {
      speaker: "raj",
      text: `"You start with the logs, not the code. This is the discipline shift that separates people who can debug production from people who can't. Your instinct is to look at the code and reason about what might be wrong. But you're reasoning about what could happen — the logs tell you what actually happened. Get the log lines from around the time of the error. What does the request look like? What data came in? What was the last log line before it blew up?"`
    },
    {
      speaker: "you",
      text: `"But my logs are still pretty sparse. I log errors but not much else."`
    },
    {
      speaker: "raj",
      text: `"That's the investment you make before the incident, not during it. Once things are on fire you're operating with whatever you instrumented beforehand. Three things that carry enormous diagnostic value and almost nobody adds until it's too late. One: log at the start and end of every significant operation — database queries, external API calls, queue messages. Two: include the duration. 'Checkout completed in 4200ms' tells you immediately that a database call is probably hanging. Three: include the request ID on every single log line in a request's lifecycle, including inside helper functions. When you have that, you pull up all lines with requestId=abc123 and you see the exact story of that one failing request."`
    },
    {
      type: "analogy",
      text: "Debugging production without logs is like trying to reconstruct a car accident from the dent. You can guess — maybe it hit a wall, maybe another car, maybe it was going fast. But a dashcam gives you exactly what happened, in sequence, with timestamps. Structured logs are the dashcam. You don't put the dashcam in after the crash."
    },
    {
      type: "code",
      text: `// ── The diagnostic information that actually matters ──

// Timing wrapper — wrap any async operation to get duration
const timed = async (label, fn, log) => {
  const start = Date.now();
  try {
    const result = await fn();
    log.debug({ label, durationMs: Date.now() - start }, \`\${label}.ok\`);
    return result;
  } catch (err) {
    log.error({ label, durationMs: Date.now() - start, err }, \`\${label}.failed\`);
    throw err;
  }
};

// ── In practice: every external call is timed and logged ──
app.post('/checkout', asyncHandler(async (req, res) => {
  req.log.info({ userId: req.userId, items: req.body.items.length }, 'checkout.start');

  // Every operation timed — you'll see exactly which one is slow
  const user = await timed('db.user.findById', () =>
    User.findById(req.userId).lean(), req.log
  );

  const payment = await timed('stripe.charge', () =>
    stripe.charges.create({ amount: req.body.total, source: req.body.token }), req.log
  );

  const order = await timed('db.order.create', () =>
    Order.create({ userId: req.userId, items: req.body.items, paymentId: payment.id }), req.log
  );

  req.log.info({
    orderId:    order._id,
    total:      req.body.total,
    durationMs: Date.now() - req.startTime,
  }, 'checkout.complete');

  res.json(order);
}));

// Log output for a slow checkout:
// {"level":"debug","msg":"db.user.findById.ok",     "durationMs":12,   "requestId":"a3f9"}
// {"level":"debug","msg":"stripe.charge.ok",         "durationMs":4200, "requestId":"a3f9"}  ← here it is
// {"level":"info", "msg":"checkout.complete",        "durationMs":4251, "requestId":"a3f9"}
// Stripe took 4200ms. Not your code. Not MongoDB. Now you know.

// ── Mongoose query logging — know what queries are running and how long they take ──
mongoose.set('debug', (collectionName, method, query, doc) => {
  logger.debug({
    db:         collectionName,
    op:         method,
    query:      JSON.stringify(query),
    // Don't log doc contents in production — could contain PII
  }, 'mongoose.query');
});

// For timing individual queries in production without the full debug noise:
const queryWithTiming = async (label, queryFn, log) => {
  const start = Date.now();
  const result = await queryFn();
  const ms = Date.now() - start;
  if (ms > 200) log.warn({ label, durationMs: ms }, 'slow.query');  // alert on slow queries
  return result;
};`
    },

    // ── Environment parity ──
    {
      speaker: "you",
      text: `"A lot of these bugs only show up because production has real data. Locally I'm working with seed data I made up. Is there a better way?"`
    },
    {
      speaker: "raj",
      text: `"Two things. First, your environments should be as close as possible — <em>environment parity</em>. Same Node version, same MongoDB version, same env vars except credentials. If production runs Node 20 and you're running Node 18 locally, you're not testing the same thing. Use a .nvmrc file in your repo so everyone runs the same version automatically. And use docker-compose locally so MongoDB is the same version as production, not whatever happened to be in your Homebrew."`
    },
    {
      speaker: "you",
      text: `"And for the data?"`
    },
    {
      speaker: "raj",
      text: `"Two options. A staging environment that runs against a copy of production data — scrubbed for PII of course. You take a production dump on a schedule, anonymise the sensitive fields, restore it to staging. Now you're testing against realistic data volume and shape. The second option is better feature flags — you ship the code off by default, then turn it on for 5% of users first. You catch the edge cases on real data before it hits everyone. The combination is hard to beat: staging catches the obvious failures, feature flags catch the subtle ones that only appear at scale."`
    },
    {
      type: "code",
      text: `// ── Environment parity checklist ──

// .nvmrc — everyone on the same Node version
// echo "20.11.0" > .nvmrc
// nvm use  ← reads .nvmrc automatically

// docker-compose.yml — local environment mirrors production
// version: '3.8'
// services:
//   mongo:
//     image: mongo:7.0          ← same major version as production Atlas
//     ports: ['27017:27017']
//     volumes: ['mongo_data:/data/db']
//   redis:
//     image: redis:7.2-alpine   ← same version as production Elasticache
//     ports: ['6379:6379']

// ── .env handling — never hardcode, never commit credentials ──
// .env.example — committed, shows shape of env vars, no real values
// DB_URI=
// STRIPE_SECRET_KEY=
// JWT_SECRET=
// LOG_LEVEL=debug
// PORT=5000

// .env.local — not committed, your real local values
// .env.production — not committed, injected by deployment platform

// Validate env vars on startup — fail fast if something is missing
const requiredEnvVars = ['DB_URI', 'STRIPE_SECRET_KEY', 'JWT_SECRET'];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    logger.fatal({ key }, 'missing required env var — refusing to start');
    process.exit(1);
  }
}
// Much better than: TypeError: Cannot read properties of undefined reading 'split')
// ...somewhere deep in a request handler 20 minutes after startup

// ── Anonymising a production data dump for staging ──
// Run this against a copy — never against production directly
db.users.updateMany({}, [{
  $set: {
    email:     { $concat: ['user_', { $toString: '$_id' }, '@example.com'] },
    firstName: 'Test',
    lastName:  'User',
    phone:     '000-000-0000',
    // Keep: createdAt, plan, orderCount, flags — needed for realistic testing
    // Wipe: anything that identifies a real person
  }
}]);

db.orders.updateMany({}, [{
  $set: {
    'shippingAddress.name':   'Test User',
    'shippingAddress.line1':  '123 Test St',
    'shippingAddress.phone':  '000-000-0000',
  }
}]);`
    },

    // ── MongoDB performance ──
    {
      speaker: "you",
      text: `"One thing that keeps happening: app is fine, then we get a traffic spike and MongoDB queries suddenly take seconds. But locally they're fine."`
    },
    {
      speaker: "raj",
      text: `"Missing indexes. Locally your users collection has 50 documents. MongoDB scans all 50 in milliseconds even without an index. Production has 200,000 documents. Without an index on the field you're querying, MongoDB reads every single document. That's a collection scan. Add traffic and you have multiple collection scans happening simultaneously. The database falls over. The queries that were instant on your machine are now timing out."`
    },
    {
      speaker: "you",
      text: `"How do I know which queries need indexes?"`
    },
    {
      speaker: "raj",
      text: `"MongoDB's <em>explain()</em>. Run your slow query with .explain('executionStats') appended and look at two fields. executionStats.totalDocsExamined — how many documents did it read. executionStats.nReturned — how many did it actually return. If those two numbers are very different — you examined 200,000 to return 12 — that's a collection scan and you need an index. The winning stage in the queryPlanner output tells you the same story: COLLSCAN means no index was used. IXSCAN means an index was used."`
    },
    {
      speaker: "you",
      text: `"Are there other MongoDB mistakes that only show up at scale?"`
    },
    {
      speaker: "raj",
      text: `"A few that are very common in MERN apps. Fetching entire documents when you only need two fields — use <em>projection</em> to select only what you need. Fetching thousands of documents in a loop — use aggregation instead and do the work in the database. Not limiting results — any query that could theoretically return the entire collection should have a <em>.limit()</em> on it. And unbounded arrays in documents — if you're pushing items into an array field without removing them, documents grow forever. MongoDB has a 16MB document size limit and you'll hit it long before that with query performance degrading. Arrays that grow indefinitely belong in a separate collection."`
    },
    {
      type: "code",
      text: `// ── Diagnosing slow queries ──

// In MongoDB shell or Compass — see exactly what the query engine is doing
db.orders.find({ userId: "u_123", status: "pending" }).explain('executionStats');
// Look for:
//   queryPlanner.winningPlan.stage: "COLLSCAN"  ← bad, reading everything
//   queryPlanner.winningPlan.stage: "IXSCAN"    ← good, using an index
//   executionStats.totalDocsExamined: 195432    ← scanned nearly 200k docs
//   executionStats.nReturned: 3                 ← to find 3 results
//   executionStats.executionTimeMillis: 2340    ← 2.3 seconds

// Add the index — immediately
db.orders.createIndex({ userId: 1, status: 1 });
// Re-run explain() — totalDocsExamined should now equal nReturned

// In Mongoose — define indexes in schema so they're version controlled
const orderSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  status:    { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered'] },
  createdAt: { type: Date,   default: Date.now },
  items:     [itemSchema],
  total:     Number,
});

// Compound index for the common query pattern: user's orders sorted by date
orderSchema.index({ userId: 1, createdAt: -1 });
// Compound index for admin dashboard: all orders by status and date
orderSchema.index({ status: 1, createdAt: -1 });

// ── Common MERN query mistakes ──

// ✗ Fetching full documents when you need two fields
const orders = await Order.find({ userId });
// Loads items[], shippingAddress, paymentId, everything — just to show a list

// ✓ Projection — only fetch what you're using
const orders = await Order.find({ userId })
  .select('_id status total createdAt')  // tell MongoDB to skip the rest
  .lean();                               // .lean() returns plain objects, not Mongoose docs — 3x faster for reads

// ✗ N+1 query — calling the database inside a loop
const orders = await Order.find({ userId });
for (const order of orders) {
  order.product = await Product.findById(order.productId);  // one query per order
}
// 50 orders = 51 database round trips

// ✓ Populate or aggregation — one round trip
const orders = await Order.find({ userId })
  .populate('productId', 'name price image')  // one query to products collection, joined in Mongoose
  .lean();

// ✓ Or aggregation for complex joins
const orders = await Order.aggregate([
  { $match:  { userId: new mongoose.Types.ObjectId(userId) } },
  { $lookup: {
    from:         'products',
    localField:   'productId',
    foreignField: '_id',
    as:           'product',
    pipeline: [{ $project: { name: 1, price: 1, image: 1 } }],  // project inside lookup
  }},
  { $limit: 20 },  // always limit
]);

// ✗ Unbounded array growth
await User.findByIdAndUpdate(userId, {
  $push: { activityLog: { action: 'login', at: new Date() } }
});
// activityLog grows forever. Document hits 16MB. Queries slow to a crawl.

// ✓ Activity log belongs in its own collection
await ActivityLog.create({ userId, action: 'login', at: new Date() });
// Now you can index, paginate, archive, and delete old records independently.`
    },

    // ── React frontend errors ──
    {
      speaker: "you",
      text: `"So far we've been talking about the backend. But errors happen in the React frontend too — and those I really can't see at all in production."`
    },
    {
      speaker: "raj",
      text: `"Frontend errors are invisible by default unless you're collecting them. If a component throws a JavaScript error in production, the user just sees a blank screen. No error message, no fallback, no indication of what happened. You need two things on the frontend. An <em>error boundary</em> — a React class component that catches errors during rendering and shows a fallback UI instead of a white screen. And a <em>frontend error monitoring service</em> that captures the error, the stack trace, the browser, the user's ID, and sends it to a dashboard you can look at."`
    },
    {
      speaker: "you",
      text: `"What service do you use for that?"`
    },
    {
      speaker: "raj",
      text: `"Sentry is the standard. It has a free tier, a React SDK that integrates in about ten minutes, and it captures everything useful automatically — the error, the component stack, which user hit it, which browser, the sequence of actions they took before it broke. The alternative is Datadog or New Relic if your company already has those. The specific choice matters less than having something. Going without frontend monitoring in production is flying blind."`
    },
    {
      type: "code",
      text: `// ── Error Boundaries — catch React rendering errors ──
// Class component — hooks can't catch render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Send to Sentry with component stack context
    const errorId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
      tags:  { boundary: this.props.name || 'unknown' },
    });
    this.setState({ errorId });
    logger.error({ errorId, message: error.message }, 'react.render.error');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          {this.state.errorId && (
            <p>Error ID: <code>{this.state.errorId}</code></p>
            // User can paste this in a support ticket — same pattern as the backend requestId
          )}
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap sections of your app — not just the root
// Wrapping only the root means any error anywhere = blank page
<ErrorBoundary name="checkout">
  <CheckoutFlow />
</ErrorBoundary>
<ErrorBoundary name="order-history">
  <OrderHistory />
</ErrorBoundary>
// Now a crash in checkout doesn't blank out the rest of the page.

// ── Sentry setup in a React + Express MERN app ──
// Frontend: npm install @sentry/react
// Backend:  npm install @sentry/node

// React (index.jsx — before anything else)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn:         process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.REACT_APP_ENV,       // 'production' vs 'staging'
  release:     process.env.REACT_APP_VERSION,   // tie errors to a deploy
  // Sample 100% of errors, only 10% of normal transactions (performance monitoring)
  tracesSampleRate: 0.1,
  // Don't capture errors from browser extensions or third-party scripts
  denyUrls: [/extensions\//i, /^chrome:\/\//i],
});

// Identify the logged-in user — now each error shows you exactly who hit it
export const identifyUser = (user) => {
  Sentry.setUser({ id: user._id, email: user.email });
};

// Express (app.js — Sentry must be first import)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn:         process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release:     process.env.APP_VERSION,
  tracesSampleRate: 0.1,
});

// Sentry request handler — must be first middleware
app.use(Sentry.Handlers.requestHandler());

// ... all your routes ...

// Sentry error handler — must be before your custom error handler
app.use(Sentry.Handlers.errorHandler());

// Your custom error handler comes after
app.use((err, req, res, next) => { /* ... */ });`
    },

    // ── Performance: finding slowness ──
    {
      speaker: "you",
      text: `"We've covered crashes and errors. What about performance issues? The app is just slow — no errors, nothing obvious in logs."`
    },
    {
      speaker: "raj",
      text: `"Slowness without an error is harder to track down because there's no signal to grep for. You're looking for time spent somewhere. The first question: is it slow for everyone, or slow for specific routes, or slow under load? Those are three different problems. Slow for everyone on a specific route: probably a database query missing an index, or a synchronous computation blocking the event loop. Slow under load: probably connection pool exhaustion — your MongoDB or Redis connection pool fills up and new requests wait. Slow for everyone across the board: could be the server itself, could be a memory leak causing excessive garbage collection."`
    },
    {
      speaker: "you",
      text: `"How do I tell which one it is?"`
    },
    {
      speaker: "raj",
      text: `"Start with your metrics. You should be tracking response time per route, and memory usage over time. Response time tells you which route is slow. Memory graph tells you if there's a leak — it'll trend steadily upward instead of staying flat. If you don't have metrics yet, add them today. It's one middleware line and it's the fastest way to answer 'is this slow or am I imagining it?' For event loop blocking — a CPU-intensive operation running on the main thread — you'll see it in <em>event loop lag</em>. Node has a way to measure that. If lag spikes correlate with slowness, you've found a blocking operation that needs to move to a worker thread."`
    },
    {
      type: "code",
      text: `// ── Response time metrics — know which routes are slow ──
// npm install response-time

const responseTime = require('response-time');
app.use(responseTime((req, res, time) => {
  const route  = req.route?.path || req.path;
  const method = req.method;
  const status = res.statusCode;

  // Log every response with its timing
  req.log.info({ method, route, status, durationMs: Math.round(time) }, 'http.response');

  // Alert on anything over your SLA
  if (time > 2000) {
    req.log.warn({ method, route, durationMs: Math.round(time) }, 'slow.response');
    // If you have a metrics service: metrics.histogram('http.response_time', time, { route, method });
  }
}));

// ── Memory leak detection ──
// Log memory usage periodically — a steadily climbing rss or heapUsed is a leak
setInterval(() => {
  const mem = process.memoryUsage();
  logger.info({
    heapUsedMb:  Math.round(mem.heapUsed  / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    rssMb:       Math.round(mem.rss       / 1024 / 1024),
    externalMb:  Math.round(mem.external  / 1024 / 1024),
  }, 'process.memory');
}, 30_000);

// What to look for in the logs:
// Healthy:  heapUsedMb fluctuates between 80-120, rss stable
// Leak:     heapUsedMb climbs from 80 → 120 → 160 → 200 over hours, never comes down

// ── Event loop lag — detecting blocking operations ──
let lastCheck = Date.now();
setInterval(() => {
  const now = Date.now();
  const lag  = now - lastCheck - 1000;  // 1000ms is the expected interval
  if (lag > 100) {
    logger.warn({ lagMs: lag }, 'event-loop.lag');
    // If you see this correlating with slow responses:
    // something on the main thread is taking too long
    // candidates: JSON.parse on large payloads, crypto operations, tight loops
  }
  lastCheck = now;
}, 1000);

// ── Common causes of event loop blocking in MERN apps ──

// ✗ Synchronous JSON parsing of large payloads (bodyParser does this synchronously)
// Fix: set a size limit on bodyParser
app.use(express.json({ limit: '100kb' }));  // reject payloads over 100kb

// ✗ bcrypt with too high a salt round — blocking crypto
const hash = bcrypt.hashSync(password, 14);  // runs on main thread, blocks for ~1s

// ✓ Always use the async version
const hash = await bcrypt.hash(password, 12);  // runs in libuv thread pool

// ✗ Array operations on large datasets in a route handler
app.get('/report', async (req, res) => {
  const allOrders = await Order.find({});     // 50,000 documents into memory
  const total = allOrders.reduce((sum, o) => sum + o.total, 0);  // blocking the event loop
  res.json({ total });
});

// ✓ Aggregate in the database — never bring large datasets into Node
app.get('/report', async (req, res) => {
  const [result] = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);
  res.json({ total: result?.total ?? 0 });
});`
    },

    // ── Health checks and graceful shutdown ──
    {
      speaker: "you",
      text: `"When I deploy, sometimes there's a period where requests are failing during the switchover. Old process is dying, new one isn't ready yet."`
    },
    {
      speaker: "raj",
      text: `"Two things fix that. Health checks and graceful shutdown. A <em>health check</em> endpoint tells your load balancer or container orchestrator whether this instance is ready to receive traffic. If your app starts but MongoDB hasn't connected yet, the health check returns unhealthy and the orchestrator doesn't send traffic to it. Users hit the old instance until the new one is ready. No failed requests during deploy."`
    },
    {
      speaker: "you",
      text: `"And graceful shutdown?"`
    },
    {
      speaker: "raj",
      text: `"When your process receives a SIGTERM — which is what Kubernetes or Heroku sends when they want it to stop — the default behaviour is to die immediately. Any in-flight requests just get dropped. Graceful shutdown means: stop accepting new connections, let the in-flight requests finish, close the database connection cleanly, then exit. Users in the middle of a checkout don't get a 502. The trick is the drain time — you give in-flight requests up to 30 seconds to finish before you force-exit. Anything still running after that threshold is probably stuck and you kill it anyway."`
    },
    {
      type: "code",
      text: `// ── Health check endpoint ──
// Separate from your main router — fast, no auth, no business logic
app.get('/health', async (req, res) => {
  const checks = {};

  // Check MongoDB
  try {
    await mongoose.connection.db.admin().ping();
    checks.mongo = 'ok';
  } catch {
    checks.mongo = 'error';
  }

  // Check Redis (if you use it)
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const allHealthy = Object.values(checks).every(v => v === 'ok');
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
  // Kubernetes: readinessProbe hits /health — only sends traffic when 200
  // If MongoDB is down: returns 503 → orchestrator stops routing to this pod
});

// ── Graceful shutdown ──
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'server.started');
});

let isShuttingDown = false;

// Tell new requests to go away once shutdown starts
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    return res.status(503).json({ error: 'Server is shutting down' });
  }
  next();
});

const shutdown = async (signal) => {
  logger.info({ signal }, 'shutdown.initiated');
  isShuttingDown = true;

  // Stop accepting new connections — existing ones can finish
  server.close(async () => {
    logger.info('http.server.closed');

    try {
      await mongoose.connection.close();
      logger.info('mongodb.connection.closed');

      await redis.quit();
      logger.info('redis.connection.closed');

      logger.info('shutdown.complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'shutdown.error');
      process.exit(1);
    }
  });

  // Force exit if graceful shutdown takes too long — a stuck request shouldn't hold a deploy
  setTimeout(() => {
    logger.warn('shutdown.timeout — forcing exit');
    process.exit(1);
  }, 30_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));  // Kubernetes, Heroku, Docker
process.on('SIGINT',  () => shutdown('SIGINT'));   // Ctrl-C in development`
    },

    // ── Debugging a live issue ──
    {
      speaker: "you",
      text: `"Okay, let's go back to where we started. Something is wrong right now, in production, and I'm getting paged. What's the actual sequence of steps?"`
    },
    {
      speaker: "raj",
      text: `"You work from signal to cause. First: establish what's broken and how widely. Check your health endpoint. Check response time metrics — is it one route or all of them? Check your error rate — is it 100% of requests failing or a small percentage? If it's 100%, something fundamental is down — database, environment variable, out of memory. If it's partial, it's a logic error or a data edge case hitting some subset of users."`
    },
    {
      speaker: "you",
      text: `"Then what?"`
    },
    {
      speaker: "raj",
      text: `"Find a specific failing request. Get its request ID. Pull every log line with that ID. Read them in sequence and find the last successful line before the error. That tells you which operation failed. Then look at the error itself — the full stack trace, the error message, the data that was being operated on. At that point you usually know what's wrong. If it's an edge case in the data, you look at that document in MongoDB. If it's a timeout, you look at the timed operations to see which step was slow. Most production bugs aren't mysterious once you have the logs to read."`
    },
    {
      speaker: "raj",
      text: `"The second question after 'what broke' is 'when did this start.' Check your deployment history. If the error rate spiked at 3:15pm and you deployed at 3:00pm, the deploy is the cause until proven otherwise. Roll back first, investigate second. Your users can't wait while you trace through code."`
    },
    {
      type: "code",
      text: `// ── The production incident checklist ──

// 1. SCOPE — how bad is it?
//    GET /health                    → is the server reachable?
//    Error rate: X% of requests?   → partial or total outage?
//    Which routes?                  → one endpoint or everything?
//    Since when?                    → correlates with a deploy?

// 2. FIND A FAILING REQUEST ID
//    Filter logs: level=error, last 10 minutes
//    Grab a requestId from one of those lines

// 3. TRACE THAT REQUEST
//    Filter logs: requestId=<the id you grabbed>
//    Read the sequence from start to end
//    Last successful log line before the error tells you which step broke

// 4. READ THE ERROR
//    err.message — what went wrong
//    err.stack   — where in the code
//    context     — what data was it operating on

// ── Quick log queries (if using a log aggregation tool like Datadog/Logtail/Papertrail) ──

// Show all errors in the last hour
// level:error AND @timestamp:[now-1h TO now]

// Trace a single request
// requestId:"a3f9-bc12-..."

// Find which route is slow
// level:info AND durationMs:>1000 | stats avg(durationMs) by route

// Find which users are hitting errors
// level:error AND msg:"checkout.failed" | stats count by userId

// ── Roll back a bad deploy ──
// Heroku
// heroku releases                        → list deploys with timestamps
// heroku rollback v47                    → instantly swap back to the previous build

// Railway / Render
// Deployments tab → click previous deploy → Redeploy

// Docker / Kubernetes
// kubectl set image deployment/api api=myapp:v1.2.3  → previous image tag
// kubectl rollout undo deployment/api                 → undo last rollout

// ── After the incident: the post-mortem ──
// Don't skip this — it's how you stop the same incident happening again
// Five questions:
//   1. What broke, and what was the user impact?
//   2. How was it detected, and how long before detection?
//   3. What was the root cause? (Not 'missing index' — why was the index missing? Skipped in review?)
//   4. What slowed down the investigation? (No logs? No metrics? No runbook?)
//   5. What concrete changes prevent this specific issue and the class of issue?
// Blameless: the system failed. Improve the system.`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Go back to Friday at 3:15. Users reporting errors, you console.logging blindly, can't reproduce it. What's different now?"`
    },
    {
      speaker: "you",
      text: `"I'd have structured logs with request IDs. I could pull every log line from a failing request and read the sequence. I'd have error monitoring catching the stack trace and the affected users. I'd check whether the error spike lines up with the 3pm deploy before I even start looking at code."`
    },
    {
      speaker: "raj",
      text: `"And if you couldn't figure it out immediately?"`
    },
    {
      speaker: "you",
      text: `"Roll back the deploy. Users unblocked. Then investigate on a copy of production data without the pressure."`
    },
    {
      speaker: "raj",
      text: `"Most production debugging isn't about being clever. It's about having instrumented your system well enough that when something breaks, it tells you exactly where. You build that before the incident, not during it."`
    },

    {
      type: "summary",
      points: [
        "console.log is not a production logging tool. Use pino or winston for structured logging — every log line is a JSON object with a timestamp, severity level, message, and context fields. Structured logs can be queried, filtered, and alerted on. A wall of text strings cannot. In production run at info level; drop to debug via an environment variable when actively investigating, without redeploying.",
        "Assign a unique request ID to every incoming request and attach it to every log line written during that request's lifecycle, including inside helper functions and database calls. When something breaks, you filter by requestId and read the exact sequence of events for that one request. Without request IDs, logs from concurrent requests are interleaved and unreadable.",
        "Express 4 silently swallows rejected promises in async route handlers — the request hangs, the user sees a spinner, you see nothing in the logs. Wrap every async handler, or use express-async-errors to patch this globally. Define a four-parameter error-handling middleware at the bottom of your app. Never send stack traces to the client — they expose file paths and library versions. Send the requestId instead; the user can paste it in a support ticket.",
        "Log the duration of every external operation — database queries, API calls, queue operations. A line that says 'checkout completed in 4200ms' tells you immediately that one step is slow without further investigation. If you're measuring nothing, slowness is invisible until users complain. Log a warning on any operation exceeding your threshold.",
        "Missing database indexes are the most common cause of performance that's fine locally and broken in production. Locally you have 50 documents; production has 200,000. Use .explain('executionStats') on slow queries — COLLSCAN means no index, totalDocsExamined far exceeding nReturned means an index is needed. Always use .lean() for read-only queries in Mongoose. Always use .limit(). Always prefer aggregation over fetching documents into Node for computation.",
        "Frontend errors are invisible without active collection. A React component throwing during render shows users a white screen and logs nothing on your server. Wrap sections of your app in Error Boundaries that catch rendering errors and show fallback UI. Use Sentry or equivalent to capture the error, stack trace, component stack, browser, and user identity and send it to a dashboard. Tie the frontend error ID to a support contact path the same way you use requestId on the backend.",
        "Environment parity closes the gap between 'works on my machine' and production failures. Pin Node version with .nvmrc. Run MongoDB and Redis locally via Docker at the same major version as production. Validate required environment variables on startup and exit immediately if any are missing — a clean crash at startup with a clear message is far better than a cryptic failure inside a request handler.",
        "Graceful shutdown prevents in-flight requests from being dropped during a deploy. When the process receives SIGTERM, stop accepting new connections, let current requests finish up to a timeout, close database connections cleanly, then exit. A health check endpoint lets your load balancer or orchestrator know when the new instance is ready to receive traffic and when the old one has drained. Together these eliminate the broken-request window during every deploy.",
        "When an incident is happening, work from signal to cause. Check the health endpoint. Check error rate and which routes are affected. Find a failing request ID. Read its full log sequence. Identify the last successful operation before the error. Then check deployment history — if the error spike correlates with a recent deploy, roll back first and investigate second. User impact ends immediately; root cause can wait fifteen minutes.",
        "The post-mortem is not optional. After the incident: document what broke and the user impact, how long it took to detect and why, the root cause traced to its origin (not just the symptom), what slowed down the investigation, and what specific changes prevent this class of failure. Run it blameless — the system failed, improve the system. The goal is that the next incident is shorter, less severe, and easier to debug because of the work you do after this one."
      ]
    }
  ]
};

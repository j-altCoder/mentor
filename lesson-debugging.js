// ─────────────────────────────────────────────────────────────────
//  LESSON: Debugging & Root Cause Analysis
//  Category: Code Quality & Debugging
// ─────────────────────────────────────────────────────────────────

const LESSON_DEBUGGING = {
  category: "Code Quality & Debugging",
  tag: "Debugging & Root Cause Analysis",
  title: "The Art of Finding What You Can't See",
  intro: "The Slack message arrives at 4pm on a Thursday. 'Something's wrong with the API.' No details. No error message. Just vibes and a screenshot of a spinner. Raj sets down his coffee.",
  scenes: [

    // ── The debugging mindset ──
    {
      speaker: "raj",
      text: `"Before you touch anything — what's your process when something breaks in production?"`
    },
    {
      speaker: "you",
      text: `"Check the logs? Try to reproduce it locally?"`
    },
    {
      speaker: "raj",
      text: `"Close — but order matters. The first thing you do is understand the blast radius. How many users are affected? Is it all users or a subset? All endpoints or one specific one? Started suddenly or gradually? That context determines urgency and narrows the search space before you look at a single log line. Then you ask: do you have a hypothesis? Debugging without a hypothesis is archaeology — you're just digging and hoping. Form a theory, gather evidence to confirm or refute it, update the theory, repeat. That's the scientific method applied to broken software."`
    },
    {
      type: "analogy",
      text: "Debugging = a doctor diagnosing a patient. You don't run every test immediately — you take a history first. When did it start? Does anything make it better or worse? Constant or intermittent? That history narrows you to a short list of likely causes. Then you run targeted tests to confirm. Random tests without a hypothesis are expensive and often misleading."
    },

    // ── Scenario 1: Sudden slowdown ──
    {
      speaker: "raj",
      text: `"First scenario. An endpoint that returned responses in 50ms for months suddenly returns them in 3 seconds. Walk me through your investigation."`
    },
    {
      speaker: "you",
      text: `"Check the logs for slow queries? See if a recent deployment changed something?"`
    },
    {
      speaker: "raj",
      text: `"Good instincts — but let's be systematic. Step one: establish the timeline. Did this correlate with a deployment? A traffic spike? A specific time of day? Check your metrics dashboards. If there was a deployment 20 minutes before this started, that's your prime suspect. Step two: is it the whole endpoint or one path through it? Only certain user IDs? Certain query parameters? Step three: look at distributed traces for a slow request. The waterfall tells you where the 3 seconds went. Is it database time? A downstream service call? Time before the handler even starts — which suggests it's queuing behind other slow requests?"`
    },
    {
      speaker: "you",
      text: `"What if there's no trace and no obvious deployment change?"`
    },
    {
      speaker: "raj",
      text: `"Then you look at external factors. Did the database get slower independently? Did traffic volume increase — more concurrent requests means more queuing. Did a dependency slow down? Did data volume increase — a query that was fast on 10,000 rows might crawl on 1,000,000 rows with no index. Did someone add a query inside a loop in a recent commit that only shows up slowly at scale? Check the git log around the time the slowdown started."`
    },
    {
      type: "code",
      text: `// Systematic slowdown investigation — in order

// 1. Timeline: when exactly did it start?
// Cross-reference inflection point in metrics with deployment timestamps
// git log --oneline --since="2024-03-10 14:00" --until="2024-03-10 16:00"

// 2. Narrow the scope: add temporary timing logs
app.get('/api/orders', asyncHandler(async (req, res) => {
  const t0 = Date.now();

  const t1 = Date.now();
  const user = await User.findById(req.user.userId).lean();
  logger.info('user fetch', { ms: Date.now() - t1 });

  const t2 = Date.now();
  const orders = await Order.find({ userId: req.user.userId }).lean();
  logger.info('orders fetch', { ms: Date.now() - t2, count: orders.length });

  const t3 = Date.now();
  const enriched = await enrichOrders(orders); // suspicious?
  logger.info('enrich', { ms: Date.now() - t3 });

  logger.info('total', { ms: Date.now() - t0 });
  res.json(enriched);
}));

// 3. Check for N+1 that appeared at scale
// Enable Mongoose debug logging temporarily
mongoose.set('debug', (coll, method, query) => {
  logger.info({ coll, method, query: JSON.stringify(query) });
});
// If you see the same query repeated hundreds of times — you found it

// 4. MongoDB: capture slow queries directly
db.setProfilingLevel(1, { slowms: 100 }); // log queries > 100ms
db.system.profile.find().sort({ ts: -1 }).limit(10);
// Look for: COLLSCAN, high docsExamined vs nReturned ratio

// 5. Event loop lag — is something synchronous blocking?
const { monitorEventLoopDelay } = require('perf_hooks');
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();
setInterval(() => {
  if (h.mean > 50e6) { // mean lag > 50ms
    logger.warn('Event loop lag', { meanMs: h.mean / 1e6, maxMs: h.max / 1e6 });
  }
}, 5000);`
    },

    // ── Scenario 2: Memory leak ──
    {
      speaker: "raj",
      text: `"Second scenario. Memory usage increases continuously — 200MB on restart, climbing to 1.2GB over 6 hours before the process crashes. Find the leak."`
    },
    {
      speaker: "you",
      text: `"Something is being allocated and never freed — but I don't know how to find what."`
    },
    {
      speaker: "raj",
      text: `"First — confirm it's actually a leak and not normal V8 behaviour. Node's garbage collector allocates young generation heap, promotes long-lived objects, and collects lazily. Some memory growth is healthy. A leak grows monotonically and never comes down even after traffic drops. Log <em>process.memoryUsage().heapUsed</em> every 30 seconds. If it climbs steadily through quiet periods with no traffic — you have a leak. If it grows with traffic and recovers when traffic drops — it's heap pressure, not a leak."`
    },
    {
      speaker: "you",
      text: `"Once I've confirmed it's a leak — how do I find what's leaking?"`
    },
    {
      speaker: "raj",
      text: `"<em>Heap snapshots</em>. Start the server, warm it up, take snapshot 1. Trigger the suspected operation — make requests, run the job. Take snapshot 2. Compare them in Chrome DevTools — 'Objects allocated between snapshots'. The type that dominates is almost always where you start. Common culprits: event listeners attached on every request and never removed, global Maps or arrays that accumulate entries without eviction, closures that capture references to large objects, timers that are never cleared."`
    },
    {
      type: "code",
      text: `// Memory leak investigation toolkit

// 1. Confirm it's a real leak — log memory over time
setInterval(() => {
  const mem = process.memoryUsage();
  logger.info({
    event:      'memory_snapshot',
    heapUsedMB:  +(mem.heapUsed  / 1024 / 1024).toFixed(1),
    heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(1),
    rssMB:       +(mem.rss       / 1024 / 1024).toFixed(1)
  });
}, 30_000);
// Plot heapUsed over time — monotonic climb = leak, sawtooth = healthy GC

// 2. Heap snapshot via --inspect
// node --inspect src/index.js
// chrome://inspect → Memory tab → Take heap snapshot
// After suspected leak: take another snapshot
// Compare → "Objects allocated between snapshots" → sort by count

// 3. Programmatic heap dump (trigger via HTTP for live debugging)
const v8 = require('v8');
app.get('/debug/heap-dump', (req, res) => {
  if (req.ip !== '127.0.0.1') return res.status(403).end(); // never expose publicly
  const file = v8.writeHeapSnapshot('/tmp/heap-' + Date.now() + '.heapsnapshot');
  res.json({ file });
  // scp to local machine, open in Chrome DevTools → Memory
});

// 4. Common leak patterns — recognise them on sight

// ❌ Event listener added on every request
app.use((req, res, next) => {
  process.on('uncaughtException', handleError); // new listener per request — grows unbounded
  next();
});
// ✅ Add listeners once at startup
process.on('uncaughtException', handleError);

// ❌ Unbounded accumulator
const requestLog = [];
app.use((req, res, next) => {
  requestLog.push({ url: req.url, time: Date.now() }); // grows forever
  next();
});
// ✅ Bounded LRU cache
const LRU = require('lru-cache');
const recentRequests = new LRU({ max: 1000 }); // evicts oldest

// ❌ Timer never cleared — keeps closure and its captured scope alive
const startPolling = (userId) => {
  const interval = setInterval(() => fetchUserData(userId), 5000);
  // interval never cleared — user's data stays in memory forever
};
// ✅ Return cleanup function and call it when done
const startPolling = (userId) => {
  const interval = setInterval(() => fetchUserData(userId), 5000);
  return () => clearInterval(interval); // caller responsible for cleanup
};

// 5. Clinic.js — automated analysis
// npx clinic doctor -- node src/index.js
// Run traffic, Ctrl+C — generates HTML report flagging likely leak locations`
    },

    // ── Scenario 3: Intermittent 500s ──
    {
      speaker: "raj",
      text: `"Third scenario. A production endpoint returns 500 — but only sometimes. Not reproducible locally. How do you approach it?"`
    },
    {
      speaker: "you",
      text: `"That sounds like the hardest one. There's nothing consistent to grab onto."`
    },
    {
      speaker: "raj",
      text: `"It's the most common kind of production bug. The key is <em>finding the pattern in the randomness</em>. Is it only during peak traffic hours — suggests concurrency or resource exhaustion. Only for certain users — look at what's different about them: account age, subscription tier, data volume, locale. Only on certain servers — suggests environment divergence, a bad deployment on one node, or state that accumulated on one server. Only after the server has been running a few hours — suggests a resource that accumulates over time: memory, connections, file descriptors. Each pattern points to a completely different fix."`
    },
    {
      speaker: "you",
      text: `"What if I genuinely can't find the pattern yet?"`
    },
    {
      speaker: "raj",
      text: `"Add more instrumentation and wait. Log the server instance ID, heap usage, and uptime alongside every 500 error. Check Sentry — all the intermittent 500s might share the same stack trace even if they look random. Temporarily lower your log level to capture more context around the failure. And load test — what's not reproducible with one request at a time often surfaces immediately with 100 concurrent ones. Race conditions in particular only appear under concurrency."`
    },
    {
      type: "code",
      text: `// Intermittent 500 investigation strategy

// 1. Log everything relevant on every 500 — find the pattern
app.use((err, req, res, next) => {
  logger.error({
    event:         'unhandled_error',
    error:         err.message,
    stack:         err.stack,
    userId:        req.user?.userId,
    path:          req.path,
    method:        req.method,
    body:          sanitize(req.body),
    instanceId:    process.env.INSTANCE_ID,   // which server?
    heapUsedMB:    +(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
    uptimeSeconds: Math.floor(process.uptime()),
    correlationId: req.headers['x-correlation-id']
  });
  // Analyse these logs: does instanceId cluster? Does uptimeSeconds correlate?
  // Does heapUsedMB spike before errors? Does a specific userId always appear?
  res.status(500).json({ error: 'Something went wrong' });
});

// 2. Load test to surface race conditions
// autocannon -c 100 -d 30 http://localhost:3000/api/orders
// 100 concurrent connections, 30 seconds — race conditions appear quickly

// k6 for more complex scenarios
// export default function() {
//   http.post('http://localhost:3000/api/checkout', JSON.stringify(payload));
//   sleep(1);
// }
// k6 run --vus 100 --duration 2m k6-script.js

// 3. Race condition pattern — check-then-act without atomicity
// ❌ Two concurrent requests both read usedCount=9, both pass, both increment
app.post('/claim-coupon', asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.body.couponId);
  if (coupon.usedCount >= coupon.maxUses)
    return res.status(400).json({ error: 'Coupon exhausted' });
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
  // Race: two concurrent requests both pass the check and both increment
}));

// ✅ Atomic find-and-update with condition eliminates the race
app.post('/claim-coupon', asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: req.body.couponId, usedCount: { $lt: maxUses } }, // condition + action atomic
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  if (!coupon) return res.status(400).json({ error: 'Coupon exhausted' });
  res.json({ success: true });
}));

// 4. Git bisect — binary search through commits for the offending change
// git bisect start
// git bisect bad HEAD          (currently broken)
// git bisect good v2.1.0       (last known good version)
// git bisect run npm test      (automatically tests each commit)
// Git finds the exact commit that introduced the bug in O(log n) steps`
    },

    // ── CPU profiling ──
    {
      speaker: "you",
      text: `"How do you find what's using CPU? We had a server spiking to 100% with no obvious cause."`
    },
    {
      speaker: "raj",
      text: `"CPU profiling with flame graphs. Start your app with <em>--prof</em>, run some traffic, kill the process — Node writes a V8 log. Process it with <em>node --prof-process</em> to get a flat CPU profile. But the easier and more visual tool is <em>clinic.js flame</em> — it generates an interactive HTML flame graph where the x-axis is CPU time and each bar is a function call. The widest bars at the bottom are your bottlenecks. Three things cause most Node CPU spikes: synchronous operations on large data in the hot path, accidentally O(n²) algorithms, and regex catastrophic backtracking — a specific class of input that causes exponential backtracking in a poorly written regex, which can hang the event loop completely."`
    },
    {
      type: "code",
      text: `// CPU profiling — finding what's burning cycles

// Method 1: clinic.js flame (easiest, best output)
// npx clinic flame -- node src/index.js
// Run traffic, Ctrl+C → opens interactive flame graph in browser
// Widest blocks at bottom = most CPU time → that's your target

// Method 2: built-in V8 profiler
// node --prof src/index.js
// ... run traffic ...
// node --prof-process isolate-*.log > profile.txt
// "Bottom up (heavy) profile" section — highest % = hottest paths

// What CPU spikes usually turn out to be:

// ❌ Synchronous JSON on large objects in hot path — blocks event loop
app.post('/process', (req, res) => {
  const parsed = JSON.parse(req.body.data);   // 2MB JSON, sync, all requests queue
  res.json(transform(parsed));
});
// ✅ Offload to Worker Thread for CPU-intensive parsing
const { Worker } = require('worker_threads');

// ❌ Accidentally O(n²) — looks innocent, deadly at scale
const findDuplicates = (items) => {
  const dupes = [];
  for (const item of items) {
    for (const other of items) {   // nested loop = O(n²)
      if (item !== other && item.id === other.id) dupes.push(item);
    }
  }
  return dupes;
};
// ✅ O(n) with a Set
const findDuplicates = (items) => {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.id)) return true;
    seen.add(item.id);
    return false;
  });
};

// ❌ Regex catastrophic backtracking — specific inputs hang the process
const dangerousRegex = /^([a-zA-Z0-9]+\.)*[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/;
// Input: 'aaaaaaaaaaaaaaaa@' → exponential backtracking → CPU spike
// ✅ Use a well-tested validator library
const { isEmail } = require('validator');
if (!isEmail(input)) return res.status(400).json({ error: 'Invalid email' });

// Measure specific operations to find slow code paths
const { performance } = require('perf_hooks');
const start = performance.now();
await doSomethingExpensive();
logger.info('operation timing', { ms: (performance.now() - start).toFixed(2) });`
    },

    // ── Reproducing production bugs ──
    {
      speaker: "you",
      text: `"How do you reproduce production bugs locally when you can't connect to the production database?"`
    },
    {
      speaker: "raj",
      text: `"Three techniques. <em>Anonymised data dumps</em> — export a sample of production data, replace PII with generated values, import to local DB. Many bugs only manifest with real data shapes and volumes you don't have locally. <em>Load testing</em> — k6 or autocannon against your local stack. Race conditions and resource exhaustion bugs that never appear with one request surface immediately at 100 concurrent. <em>Git bisect</em> — if you know the bug wasn't there two weeks ago, binary search through commits to find the exact one that introduced it. Git does the O(log n) search automatically with <em>git bisect run</em>."`
    },
    {
      type: "code",
      text: `// Reproducing production bugs — three practical techniques

// 1. Anonymised production data dump
const anonymiseForLocal = (users) => users.map(user => ({
  ...user,
  email:   faker.internet.email(),
  name:    faker.person.fullName(),
  phone:   faker.phone.number(),
  // Preserve: _id, role, createdAt, subscriptionTier — needed for reproduction
  // Strip:    real contact info, payment details, addresses
}));
// mongoexport collection → anonymise → mongoimport to local dev DB
// Bug that only happens for Enterprise-tier accounts? Now you have their data shape locally.

// 2. Load test — surfaces race conditions and resource exhaustion
// npm install -g autocannon
// autocannon -c 100 -d 30 http://localhost:3000/api/checkout
// A bug that happens 1-in-1000 requests appears immediately at 100 concurrent

// 3. Git bisect — binary search for the offending commit
// git bisect start
// git bisect bad HEAD              # current state is broken
// git bisect good v2.3.0           # this version was fine
// git bisect run npm test          # automated test that fails on the bug
// Git checks out commits in binary search order, runs your test each time
// Result: "abc1234 is the first bad commit" — in O(log n) steps
// Then: git show abc1234 — see exactly what changed

// 4. Feature flags for production-only reproduction
// Deploy the suspected fix behind a flag
// Enable for 1% of traffic in production
// Monitor error rate — does it drop for flag-enabled users?
// Confirm → roll out to 100%
// This is safer than a full deploy when you can't reproduce locally

// 5. Sentry for production-only bugs
// Sentry captures: full stack trace, local variable values at crash time,
// exact request payload and headers, breadcrumbs (trail of events before crash)
// Use "similar issues" to check if many different-looking errors share the same root stack frame`
    },

    // ── Postmortem ──
    {
      speaker: "raj",
      text: `"Once you've fixed the bug — what comes next?"`
    },
    {
      speaker: "you",
      text: `"Document what happened and how we fixed it?"`
    },
    {
      speaker: "raj",
      text: `"A <em>blameless postmortem</em>. Not 'who caused it' — 'what systems allowed this to happen and how do we make them better'. Timeline of events including detection gap — if the incident started at 14:23 and you were paged at 15:08, that 45-minute gap is itself a finding. Root cause analysis that goes deeper than the proximate cause. If the root cause is 'a developer made a mistake' you haven't gone deep enough — why did the mistake reach production? Missing test? Inadequate review? No alerting? Fix the system, not the person. Then action items with owners and deadlines — test that would have caught it, alert that would have detected it faster, review checklist addition. Each incident makes the system slightly better."`
    },
    {
      type: "code",
      text: `// Postmortem structure — blameless, action-oriented
/*
# Incident: Checkout Double-Charge (INC-2024-047)
# Severity: P1 | Duration: 47 minutes | Users affected: ~320

## Timeline
14:23 — Deploy v2.4.1 completed
14:51 — First customer reports double charge (28-MINUTE DETECTION GAP)
15:08 — On-call engineer paged via PagerDuty
15:14 — Root cause identified: retry logic missing idempotency key
15:22 — Fix deployed, confirmed no further double charges

## Root Cause
Proximate: payment retry logic executed twice for the same transaction.
Root: new retry middleware added in v2.4.1 did not propagate the idempotency
     key to the Stripe API call. Network timeout triggered a retry.
     Stripe processed both as separate charges.

Why did it reach production?
  — No integration test covering payment retries with idempotency
  — Reviewer unfamiliar with Stripe's idempotency key requirement
  — No business metric alert for "charges per order > 1"

## Impact
320 customers double-charged | $14,280 total | All refunded within 2 hours

## Action Items
[Alice, due Mar 15] Integration test: payment retry preserves idempotency key
[Bob,   due Mar 12] Alert: charges_per_order > 1 triggers P1 immediately
[Carol, due Mar 11] Add idempotency key requirement to payment service README
[Carol, due Mar 11] Add to code review checklist: Stripe calls need idempotency key

## What Went Well
— Fix deployed within 14 minutes of diagnosis
— Finance team monitoring caught it independently of engineering alerts
— Refund process was fast, zero chargebacks
*/`
    },

    // ── What interviewers are really testing ──
    {
      speaker: "raj",
      text: `"Last thing — when an interviewer gives you a debugging scenario, what are they actually testing?"`
    },
    {
      speaker: "you",
      text: `"Whether I know the right tools?"`
    },
    {
      speaker: "raj",
      text: `"Tools are secondary. They're testing your <em>thinking process</em>. Do you establish scope before diving in? Do you form hypotheses and test them systematically rather than randomly trying things? Do you narrow the problem space — is it all users or some, all servers or one, constant or intermittent? Do you think about second-order effects — could fixing this break something else? Do you verify the fix actually worked? The engineer who says 'let me check the traces, then the DB profiler, then whether it correlates with a deploy' demonstrates systematic thinking that transfers to every problem. That's what gets hired — not knowing a specific tool."`
    },

    {
      type: "summary",
      points: [
        "Before touching anything: establish blast radius and timeline. How many users? Which endpoints? Started when? Correlates with a deploy?",
        "Form a hypothesis, gather evidence to confirm or refute, update and repeat. Debugging without a hypothesis is archaeology.",
        "Sudden slowdown: traces first (where did the time go?), then DB profiler, then Mongoose debug logging for N+1, then event loop lag monitoring.",
        "Memory leak: confirm heapUsed climbs through quiet/no-traffic periods. Heap snapshots before/after suspected operation, compared in Chrome DevTools.",
        "Common leak patterns: event listeners added per-request, unbounded arrays/Maps, closures capturing large objects, timers never cleared.",
        "Intermittent 500s: find the pattern. Time of day? Specific users? Specific server instance? After long uptime? Each pattern points to a different cause.",
        "Check-then-act without atomicity is a race condition. Use atomic DB operations ($findOneAndUpdate with conditions) instead of separate read + write.",
        "CPU spikes: clinic.js flame graphs. Common causes: synchronous JSON on large payloads, O(n²) algorithms, regex catastrophic backtracking.",
        "Reproduce intermittent bugs: anonymised data dumps for data-shape issues, load testing for race conditions, git bisect for the offending commit.",
        "Blameless postmortem: timeline, detection gap, root cause (not just proximate), why it reached production, action items with owners and deadlines.",
        "Interviewers test thinking process, not tool knowledge. Systematic narrowing, clear hypotheses, verifying fixes — that's what gets hired."
      ]
    }
  ]
};

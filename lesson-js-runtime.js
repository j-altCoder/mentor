// ─────────────────────────────────────────────────────────────────
//  LESSON: JavaScript Runtime & Async Behavior
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_JS_RUNTIME = {
  category: "Language & Framework Fundamentals",
  tag: "JavaScript Runtime & Async",
  title: "Why Your Code Doesn't Run in the Order You Wrote It",
  intro: "Raj writes four lines on the whiteboard:\n\n<code>console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');</code>\n\n'What prints, and in what order?' You look at it. B has a zero delay. Surely it runs immediately. You open your mouth.",
  scenes: [

    // ── Event loop ──
    {
      speaker: "raj",
      text: `"Take your time. What's your answer?"`
    },
    {
      speaker: "you",
      text: `"A, D... then B because setTimeout is async... then C?"`
    },
    {
      speaker: "raj",
      text: `"A and D are right. But B and C are swapped. The output is A, D, C, B. And the reason is the most important thing to understand about JavaScript's runtime: not all async callbacks are equal. There are two queues. The <em>microtask queue</em> — where Promise callbacks go. And the <em>macrotask queue</em> — where setTimeout, setInterval, and I/O callbacks go. After every piece of synchronous code finishes, the event loop drains the entire microtask queue before it takes even one macrotask. C is a Promise callback — it goes in the microtask queue. B is a setTimeout — it goes in the macrotask queue. Doesn't matter that B had a zero millisecond delay. Zero milliseconds still means 'put it in the macrotask queue.' C always runs first."`
    },
    {
      type: "analogy",
      text: "The event loop is a chef. Synchronous code is the dish being cooked right now — the chef doesn't stop mid-dish for anything. Microtasks are the sous chef tapping their shoulder the moment the dish is plated — handled before the chef looks at any new orders. Macrotasks are the new orders on the ticket rail. The chef finishes the dish, handles every shoulder-tap, then and only then picks up the next ticket."
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// THE EVENT LOOP — MICROTASKS VS MACROTASKS
// ─────────────────────────────────────────────────────

console.log('A');                           // synchronous — runs now
setTimeout(() => console.log('B'), 0);      // macrotask   — queued for later
Promise.resolve().then(() => console.log('C')); // microtask — queued for after sync
console.log('D');                           // synchronous — runs now

// Output: A  D  C  B
//
// Why:
// 1. Synchronous code runs first: A, D
// 2. Microtask queue drains completely before any macrotask: C
// 3. Macrotask queue — one task picked up: B

// ── Macrotasks (queued in the macrotask queue) ──
// setTimeout(fn, delay)   — delay is minimum, not exact
// setInterval(fn, delay)
// setImmediate(fn)        — Node.js only, runs after I/O callbacks
// I/O callbacks           — file reads, network responses

// ── Microtasks (queued in the microtask queue) ──
// Promise.then / .catch / .finally
// queueMicrotask(fn)
// MutationObserver callbacks (browser)

// ── Key rule: microtask queue drains completely before next macrotask ──
// This means you can starve the macrotask queue:
const loop = () => Promise.resolve().then(loop); // ← infinite microtask loop
loop(); // setTimeout callbacks will NEVER run — microtask queue never empties

// ── A harder question — what does this print? ──
Promise.resolve()
  .then(() => {
    console.log('micro 1');
    setTimeout(() => console.log('macro inside micro'), 0);
  })
  .then(() => console.log('micro 2'));

setTimeout(() => console.log('macro 1'), 0);

// Output: micro 1, micro 2, macro 1, macro inside micro
// Why: the setTimeout inside the microtask is added to macrotask queue
//      AFTER macro 1 was already queued, so it runs after it`
    },

    // ── Promises ──
    {
      speaker: "raj",
      text: `"Promises. Not the syntax — the mechanics. What are the three states?"`
    },
    {
      speaker: "you",
      text: `"Pending, fulfilled, rejected."`
    },
    {
      speaker: "raj",
      text: `"And once a Promise moves from pending — what happens?"`
    },
    {
      speaker: "you",
      text: `"It's settled. Can't change state again."`
    },
    {
      speaker: "raj",
      text: `"Right. Immutable once settled. Now — a Promise rejects and there's no .catch handler anywhere. What happens in Node.js?"`
    },
    {
      speaker: "you",
      text: `"An unhandledRejection event? The process might crash?"`
    },
    {
      speaker: "raj",
      text: `"In modern Node — version 15 and above — it crashes the process by default. Before that it just printed a warning and kept running, which was worse because you had silent failures. The unhandledRejection event fires first, so you can log it, report to Sentry, do whatever cleanup you need before exit. In an Express app the classic mistake is an async route handler that throws — if you don't wrap it, the error goes unhandled and the process either crashes or hangs the request forever. That's why every async route needs either a try/catch or a wrapper that catches and calls next(err)."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// PROMISES — MECHANICS AND REJECTION HANDLING
// ─────────────────────────────────────────────────────

// ── Three states ──
// pending   → neither fulfilled nor rejected yet
// fulfilled → resolved with a value (immutable)
// rejected  → failed with a reason  (immutable)

// ── Unhandled rejection — crashes Node 15+ ──
async function riskyOperation() {
  throw new Error('something went wrong');
}

riskyOperation(); // ← no await, no .catch — rejection is unhandled

// Process-level safety net (log before crash, don't suppress the crash)
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ event: 'unhandled_rejection', reason });
  // Don't call process.exit() here — let Node 15+ crash naturally
  // Suppressing the crash hides bugs
});

// ── The async Express trap ──
// ✗ Unhandled rejection — error disappears or hangs the request
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id); // throws if DB is down
  res.json(user);
});

// ✓ Option 1: try/catch
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err); // passes to Express error handler
  }
});

// ✓ Option 2: wrapper (keeps handlers clean)
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user); // if this throws, asyncHandler catches and calls next(err)
}));

// ── Promise chaining — .then returns a new Promise ──
fetchUser(id)
  .then(user  => fetchOrders(user.id))   // returning a Promise — chained
  .then(orders => res.json(orders))
  .catch(err  => next(err));             // one catch handles any rejection in the chain

// ── .finally — runs regardless of outcome ──
const conn = await db.connect();
try {
  await doWork(conn);
} finally {
  await conn.release(); // always runs — connection always returned to pool
}`
    },

    // ── Promise.all and friends ──
    {
      speaker: "raj",
      text: `"Promise.all. I need to fetch a user, their orders, and their preferences — all independent. What do I write?"`
    },
    {
      speaker: "you",
      text: `"Promise.all with all three fetch calls in the array — they run in parallel."`
    },
    {
      speaker: "raj",
      text: `"Good. What happens if one of the three rejects?"`
    },
    {
      speaker: "you",
      text: `"The whole Promise.all rejects?"`
    },
    {
      speaker: "raj",
      text: `"Immediately. The moment any Promise in the array rejects, Promise.all rejects with that reason. The other two Promises are still running — they're not cancelled, JavaScript doesn't have cancellation — but their results are discarded. You never know if they succeeded or failed. If you need all three to succeed or none of them to matter, that's fine — fail fast. But if you want to fetch all three and handle failures individually — show what you have, degrade gracefully — Promise.all is the wrong tool. That's Promise.allSettled."`
    },
    {
      speaker: "you",
      text: `"What's the difference between allSettled and Promise.all?"`
    },
    {
      speaker: "raj",
      text: `"allSettled waits for every Promise regardless of outcome. Instead of the values, you get an array of result objects — each with a status field, either 'fulfilled' with the value or 'rejected' with the reason. You decide what to do with each. Then there's Promise.race — first one to settle wins, whether fulfilled or rejected. And Promise.any — first one to fulfill wins, ignores rejections unless they all reject. Knowing which tool to reach for is what interviewers are testing. Promise.all is not always the right answer."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// PROMISE.ALL, ALLSETTLED, RACE, ANY
// ─────────────────────────────────────────────────────

// ── Promise.all — parallel, fail-fast ──
// All succeed → array of values in input order
// Any rejects → immediately rejects with that reason
const [user, orders, prefs] = await Promise.all([
  fetchUser(userId),
  fetchOrders(userId),
  fetchPreferences(userId),
]);
// ✓ Use when: all results required, any failure = whole operation fails
// ✗ Avoid when: you want to show partial results on failure

// ── Promise.allSettled — parallel, waits for all outcomes ──
const results = await Promise.allSettled([
  fetchUser(userId),
  fetchOrders(userId),
  fetchPreferences(userId),
]);

const user  = results[0].status === 'fulfilled' ? results[0].value : null;
const orders = results[1].status === 'fulfilled' ? results[1].value : [];
const prefs  = results[2].status === 'fulfilled' ? results[2].value : defaults;
// ✓ Use when: degrade gracefully — show what you have, handle failures individually

// ── Promise.race — first to settle (fulfilled OR rejected) wins ──
const result = await Promise.race([
  fetchData(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 5000)
  )
]);
// ✓ Classic use: adding a timeout to any operation

// ── Promise.any — first to FULFILL wins (ignores rejections) ──
// Rejects only if ALL reject (AggregateError)
const fastest = await Promise.any([
  fetchFromRegion('us-east'),
  fetchFromRegion('eu-west'),
  fetchFromRegion('ap-south'),
]);
// ✓ Use when: redundant sources, want the fastest that succeeds

// ── The concurrency mistake — sequential when parallel is possible ──
// ✗ Sequential — each waits for the previous (3× slower)
const user   = await fetchUser(id);
const orders = await fetchOrders(id);   // waits for user — why?
const prefs  = await fetchPreferences(id); // waits for orders — why?

// ✓ Parallel — all start at once
const [user, orders, prefs] = await Promise.all([
  fetchUser(id),
  fetchOrders(id),
  fetchPreferences(id),
]);`
    },

    // ── async/await in loops ──
    {
      speaker: "raj",
      text: `"I have an array of 50 user IDs. I want to fetch each one. What's wrong with this?"`
    },
    {
      speaker: "you",
      text: `"What does the code look like?"`
    },
    {
      speaker: "raj",
      text: `"forEach with async/await inside."`
    },
    {
      speaker: "you",
      text: `"forEach doesn't await the callbacks — they all fire and you lose the results."`
    },
    {
      speaker: "raj",
      text: `"Right. forEach doesn't know or care that its callback returns a Promise. The async function returns a Promise, forEach ignores it, moves to the next iteration immediately. All 50 fetches are kicked off in parallel — which might actually be what you want, but you have no way to await all of them completing, no way to catch errors centrally, and if any rejects it's an unhandled rejection. Now — say you want them all in parallel but with proper error handling. Then say you want them sequential, one after another. Both are common interview questions."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// ASYNC/AWAIT IN LOOPS
// ─────────────────────────────────────────────────────

const userIds = [1, 2, 3, /* ...50 ids */];

// ── ✗ forEach — loses all Promises, errors silently ──
userIds.forEach(async (id) => {
  const user = await fetchUser(id);   // Promise returned, forEach ignores it
  process(user);
});
// Code after this runs immediately — none of the fetches are awaited
// Rejections are unhandled

// ── ✓ Parallel: Promise.all + .map ──
// All 50 fetches start simultaneously
const users = await Promise.all(userIds.map(id => fetchUser(id)));
// One .catch handles any failure; results arrive when all complete

// ── ✓ Sequential: for...of with await ──
// Each fetch starts only after the previous one completes
for (const id of userIds) {
  const user = await fetchUser(id);
  await process(user);
}
// Use when: order matters, downstream rate limits, or operations must not overlap

// ── ✓ Parallel with concurrency limit (common production need) ──
// 50 parallel requests to a database or external API is often too many
// Concurrency limit: run N at a time, slide the window as each completes

async function batchProcess(ids, batchSize = 5) {
  const results = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(id => fetchUser(id)));
    results.push(...batchResults);
  }
  return results;
}

// Or with p-limit (cleaner sliding window — doesn't wait for whole batch):
import pLimit from 'p-limit';
const limit = pLimit(5); // max 5 concurrent

const users = await Promise.all(
  userIds.map(id => limit(() => fetchUser(id)))
);

// ── The for...of vs for...in trap ──
// for...of iterates values:  for (const id of userIds)   ← correct for arrays
// for...in iterates keys:    for (const i in userIds)     ← iterates '0','1','2'...
//                                                            also picks up prototype keys
// Never use for...in on arrays. Use for...of or a regular for loop.`
    },

    // ── Promise rejection inside loops ──
    {
      speaker: "raj",
      text: `"You're using Promise.all to process 50 items. Item 23 throws. What do you actually get back?"`
    },
    {
      speaker: "you",
      text: `"Promise.all rejects with item 23's error. The other 49 results are gone."`
    },
    {
      speaker: "raj",
      text: `"Gone as far as Promise.all is concerned — the other Promises are still running, just discarded. Now the interviewer follow-up: you actually want to process all 50, collect whatever succeeded, and log whatever failed. What do you do?"`
    },
    {
      speaker: "you",
      text: `"Promise.allSettled?"`
    },
    {
      speaker: "raj",
      text: `"Or wrap each individual Promise in a try/catch inside the .map so failures become values. Both work. The more subtle version: you want the successes to continue but you want to re-throw if more than 20% fail — a failure rate threshold. That's where you need allSettled, count the rejections, and decide after. This pattern comes up constantly in data processing pipelines: import 1000 records, tolerate 5 failures, bail if it's more than that."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// PROMISE REJECTION INSIDE LOOPS — PATTERNS
// ─────────────────────────────────────────────────────

const ids = [1, 2, 3, 4, 5]; // imagine 50

// ── Problem: Promise.all — one failure loses everything ──
try {
  const results = await Promise.all(ids.map(id => riskyFetch(id)));
} catch (err) {
  // err is the FIRST rejection — you know nothing about the rest
  // items that succeeded: silently discarded
}

// ── Option A: allSettled + partition ──
const outcomes = await Promise.allSettled(ids.map(id => riskyFetch(id)));

const successes = outcomes
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

const failures = outcomes
  .filter(r => r.status === 'rejected')
  .map(r => r.reason);

logger.info({ processed: successes.length, failed: failures.length });

// ── Option B: wrap each in try/catch inside the map ──
const results = await Promise.all(ids.map(async (id) => {
  try {
    return { ok: true, value: await riskyFetch(id) };
  } catch (err) {
    return { ok: false, id, error: err.message };
  }
}));

const successes = results.filter(r => r.ok).map(r => r.value);
const failures  = results.filter(r => !r.ok);

// ── Option C: failure rate threshold ──
const outcomes = await Promise.allSettled(ids.map(id => riskyFetch(id)));
const failureRate = outcomes.filter(r => r.status === 'rejected').length / ids.length;

if (failureRate > 0.2) {
  throw new Error(\`Too many failures: \${Math.round(failureRate * 100)}% failed\`);
}

const results = outcomes
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);`
    },

    // ── Async/await gotchas ──
    {
      speaker: "raj",
      text: `"One more. What does 'await' actually do to execution?"`
    },
    {
      speaker: "you",
      text: `"Pauses the function until the Promise resolves."`
    },
    {
      speaker: "raj",
      text: `"Pauses the function — but not the thread. While that function is paused, what happens?"`
    },
    {
      speaker: "you",
      text: `"Other code can run. Other requests can be handled."`
    },
    {
      speaker: "raj",
      text: `"Right. await is syntactic sugar for .then — it suspends the current async function, hands control back to the event loop, and resumes when the Promise settles. The thread is never blocked. The misconception is that async/await looks synchronous so it must behave synchronously — but the gaps at every await boundary are exactly where the event loop runs other work. That's both the power of it and the source of every race condition we talked about in the concurrency lesson. One final trap: what happens if you forget the await keyword on a Promise?"`
    },
    {
      speaker: "you",
      text: `"You get the Promise object instead of the resolved value."`
    },
    {
      speaker: "raj",
      text: `"And the function continues immediately — synchronously — with a Promise object where you expected a value. No error thrown. TypeScript catches this if you configure it right. In plain JavaScript it fails silently, possibly much later, when you try to use the value and get undefined or [object Promise] where you expected a number. It's one of the most common bugs in async JavaScript code — and one of the easiest to miss in a code review."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// ASYNC/AWAIT — MECHANICS AND GOTCHAS
// ─────────────────────────────────────────────────────

// ── await = .then, not blocking ──
// These two are equivalent:
async function getUser(id) {
  const user = await fetchUser(id); // suspends here, event loop runs other work
  return user;
}

function getUser(id) {
  return fetchUser(id).then(user => user);
}

// While getUser is suspended at the await, Node handles other requests.
// This is cooperative concurrency — you yield at await, resume when ready.

// ── The missing await — silent failure ──
async function processOrder(orderId) {
  const order = getOrder(orderId); // ← forgot await
  console.log(order.status);       // TypeError: cannot read 'status' of Promise {}
}

// TypeScript catches this with: "noFloatingPromises": true in tsconfig
// ESLint catches it with: "@typescript-eslint/no-floating-promises"

// ── await in try/catch — what gets caught ──
async function example() {
  try {
    const result = await mightFail();  // rejection becomes a thrown error — caught ✓
    const sync   = mightThrow();       // synchronous throw — caught ✓
  } catch (err) {
    // both land here
  }
}

// ── Parallel with await vs sequential ──
// Sequential (total time = A + B + C):
const a = await fetchA();
const b = await fetchB();
const c = await fetchC();

// Parallel (total time = max(A, B, C)):
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);

// ── async IIFE — when you need top-level await without ESM ──
(async () => {
  const config = await loadConfig();
  startServer(config);
})();

// ── Async constructor pattern — constructors can't be async ──
class Database {
  static async create() {
    const db = new Database();
    db.connection = await connect();  // await inside a static factory method
    return db;
  }
}
const db = await Database.create(); // not: new Database()`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Back to the four lines on the whiteboard. You said B before C. Now you know why you were wrong — walk me through it."`
    },
    {
      speaker: "you",
      text: `"B was a setTimeout — goes in the macrotask queue. C was a Promise.resolve().then — goes in the microtask queue. After the synchronous code runs, the event loop drains all microtasks before it picks up any macrotask. So C runs before B even though B had zero delay."`
    },
    {
      speaker: "raj",
      text: `"Zero milliseconds means 'minimum zero milliseconds' — not 'right now'. It means: put this in the macrotask queue, and the event loop will get to it when it gets to it, which is after all microtasks are gone. The whole point of this question isn't to memorise the output. It's to know why — which means knowing the two queues, knowing which callbacks go where, and knowing the drain rule. That understanding is what prevents bugs in production async code. Memorising the answer to this specific puzzle does nothing."`
    },

    {
      type: "summary",
      points: [
        "Two queues, not one. Microtask queue (Promises, queueMicrotask) and macrotask queue (setTimeout, setInterval, I/O). After every synchronous block, the event loop drains the entire microtask queue before it picks up a single macrotask.",
        "setTimeout(fn, 0) does not mean 'run immediately'. It means 'put in the macrotask queue after at least 0ms'. A resolved Promise callback will always run before it.",
        "Unhandled Promise rejections crash the process in Node 15+. Every async route handler needs either a try/catch + next(err) or an asyncHandler wrapper. The asyncHandler pattern is the clean solution.",
        "Promise.all: parallel, fail-fast — one rejection discards all results. Promise.allSettled: parallel, waits for all — each result has a status field. Promise.race: first to settle wins. Promise.any: first to fulfill wins.",
        "forEach does not await async callbacks. It fires them all and moves on. The Promises are ignored and rejections go unhandled. Use Promise.all + .map for parallel, for...of + await for sequential.",
        "Sequential awaits in a loop (one after another) are often a performance bug. If the operations are independent, Promise.all runs them in parallel and takes max(all durations) instead of sum(all durations).",
        "Concurrency limits matter in production. 50 simultaneous DB queries or API calls can overload the downstream service. Use batching or p-limit to cap how many run at once.",
        "await is .then in disguise. It suspends the function and returns control to the event loop — not the thread. Other requests are handled while a function is awaiting. This is the source of every async race condition.",
        "Missing await is a silent bug. The function continues with a Promise object where a value was expected. TypeScript's noFloatingPromises and ESLint's no-floating-promises rules catch it at compile time."
      ]
    }
  ]
};

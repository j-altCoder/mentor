// ─────────────────────────────────────────────────────────────────
//  LESSON: Node.js Backend Behavior
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_NODEJS_BACKEND = {
  category: "Language & Framework Fundamentals",
  tag: "Node.js Backend Behavior",
  title: "One Thread, Ten Thousand Requests",
  intro: "Raj pulls up a graph. It's a latency chart from a production API. For most of the day it's flat — p99 around 80ms. Then at 14:23, everything spikes to 12 seconds. Then flat again. 'One request caused that,' he says. 'Tell me how a single request can stall every other request on the server.'",
  scenes: [

    // ── The event loop and blocking ──
    {
      speaker: "raj",
      text: `"Before you answer — remind me how Node handles concurrent requests. It's single-threaded. How does it serve ten thousand connections at once?"`
    },
    {
      speaker: "you",
      text: `"The event loop. It handles requests asynchronously — while one request is waiting for a database response, others run."`
    },
    {
      speaker: "raj",
      text: `"Right. Node is single-threaded for JavaScript execution, but I/O is non-blocking. When you await a database query, Node hands that off to the OS and moves on to the next request. The thread is never sitting idle waiting. This is what makes Node excellent for I/O-heavy workloads. Now — what breaks that model?"`
    },
    {
      speaker: "you",
      text: `"Synchronous operations that take a long time?"`
    },
    {
      speaker: "raj",
      text: `"Any synchronous CPU work that takes too long. The event loop is a single thread. While it's executing your JavaScript, it cannot process any other request — not a health check, not a logout, nothing. A JSON.parse on a 50mb payload, a synchronous crypto operation, a poorly written sorting algorithm on a large dataset, a nested loop iterating millions of items — any of these can block the event loop for hundreds of milliseconds to seconds. Every other request queues up and waits. That's your 12-second spike. One request came in with a giant payload, the handler did synchronous work on it, and the entire server froze for everyone else until it finished."`
    },
    {
      type: "analogy",
      text: "The event loop is one very fast cashier at a supermarket. They handle thousands of customers per hour because most customers just need to put items on the belt and wait — the cashier can serve others while the conveyor moves. But if one customer hands the cashier a jigsaw puzzle and says 'assemble this first,' everyone behind them stands still until the puzzle is done. The cashier isn't slow. The puzzle is just synchronous work that nobody else can make progress on while it's happening."
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// BLOCKING THE EVENT LOOP
// ─────────────────────────────────────────────────────

// ✗ These block the event loop — every other request waits
app.post('/process', (req, res) => {

  // Large synchronous JSON parse
  const data = JSON.parse(req.body.payload); // 50mb string → blocks for ~800ms

  // Synchronous crypto (legacy)
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512'); // blocks

  // CPU-intensive loop
  let result = 0;
  for (let i = 0; i < 1_000_000_000; i++) result += i; // blocks for seconds

  // Synchronous file read
  const config = fs.readFileSync('./config.json'); // blocks

  res.json({ result });
});

// ✓ async I/O never blocks — hands off to OS, event loop serves others
app.get('/data', async (req, res) => {
  const data = await fs.promises.readFile('./data.json'); // non-blocking
  const rows = await db.query('SELECT * FROM items');     // non-blocking
  res.json(rows);
});

// ✓ CPU work → Worker Threads (Node 12+)
const { Worker } = require('worker_threads');

app.post('/process', (req, res) => {
  const worker = new Worker('./heavy-computation.js', {
    workerData: req.body.payload
  });
  worker.on('message', result => res.json({ result }));
  worker.on('error',   err    => res.status(500).json({ error: err.message }));
});
// Worker runs on a separate OS thread — event loop stays free

// ✓ Async crypto — don't use *Sync variants in a server
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, hash) => {
  // callback runs when done — event loop was free the whole time
});
// Or promisified:
const hash = await crypto.promises.pbkdf2(password, salt, 100000, 64, 'sha512');

// ── Detecting event loop lag ──
const { monitorEventLoopDelay } = require('perf_hooks');
const histogram = monitorEventLoopDelay({ resolution: 10 });
histogram.enable();

setInterval(() => {
  const lagMs = histogram.mean / 1e6;
  if (lagMs > 100) {
    logger.warn({ event: 'event_loop_lag', lagMs });
    metrics.gauge('node.event_loop_lag_ms', lagMs);
  }
  histogram.reset();
}, 5000);`
    },

    // ── Async middleware errors ──
    {
      speaker: "raj",
      text: `"Your Express server has been running for three days. Occasionally a request just... hangs forever. Never responds. No error logged. What's likely happening?"`
    },
    {
      speaker: "you",
      text: `"An async error that wasn't caught? The middleware threw but nobody called next."`
    },
    {
      speaker: "raj",
      text: `"Exactly. Express was designed before async/await existed. Its error handling expects you to call next(err) with the error — it doesn't know about Promises. If you have an async middleware function and it throws, Express doesn't catch it. The Promise rejects. If there's no unhandledRejection handler, Node logs a warning. But the request — it just hangs. No response was ever sent, the connection is open, the client is waiting. In a browser that looks like a spinning tab. In an API it causes a timeout on the caller's end. The fix is either a try/catch calling next(err), or a wrapper that does it for you."`
    },
    {
      speaker: "you",
      text: `"What about Express 5? I've heard it handles async automatically."`
    },
    {
      speaker: "raj",
      text: `"Express 5 — still in beta for a long time but now stable — does catch rejected Promises from route handlers automatically. But most production codebases are on Express 4, and the pattern of wrapping async handlers is so ingrained that you'll write it anyway. Know both. The other async middleware trap: error handlers themselves. Express error handlers have the signature (err, req, res, next) — four arguments. If you write an async error handler and it throws, you're in the same problem. Error handlers need the same try/catch discipline."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// ASYNC MIDDLEWARE ERRORS IN EXPRESS
// ─────────────────────────────────────────────────────

// ✗ Async error disappears — request hangs forever
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id); // throws if DB is down
  res.json(user);
  // Promise rejects → unhandledRejection → request never gets a response
});

// ✓ try/catch + next(err)
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err); // passes to Express error handler
  }
});

// ✓ asyncHandler wrapper — wraps once, use everywhere
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
}));

// ── Express error handler — must have exactly 4 params ──
// If signature has 3 params, Express won't recognise it as an error handler
app.use((err, req, res, next) => {  // ← 4 params required
  logger.error({ err, path: req.path });
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
  });
});

// ── Middleware order matters ──
// Routes first, error handler LAST — always
app.use(express.json());       // body parser
app.use(authMiddleware);       // auth
app.use('/api', router);       // routes
app.use(notFoundHandler);      // 404 — after all routes
app.use(errorHandler);         // error handler — very last

// ── Request timeout — prevent forever-hanging requests ──
const timeout = require('connect-timeout');
app.use(timeout('30s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});`
    },

    // ── Cluster vs single process ──
    {
      speaker: "raj",
      text: `"Your Node app is on a server with 8 CPU cores. You start it with node server.js. How many cores are you using?"`
    },
    {
      speaker: "you",
      text: `"One."`
    },
    {
      speaker: "raj",
      text: `"One. Seven cores sitting completely idle. Node is single-threaded — one process uses one core. To use the rest you either run multiple processes or use the cluster module. What does cluster do?"`
    },
    {
      speaker: "you",
      text: `"Forks the process into multiple workers — one per CPU — and they share the same port."`
    },
    {
      speaker: "raj",
      text: `"Right. The master process listens on the port and distributes incoming connections to worker processes using a round-robin approach. Each worker is a full Node.js process with its own memory, its own event loop, its own V8 instance. A crash in one worker doesn't take down the others. The master detects it and can fork a replacement. In practice most teams reach for PM2 instead of writing cluster code manually — it manages the workers, restarts on crash, logs, and has a cluster mode flag. But you should understand what it's doing under the hood."`
    },
    {
      speaker: "you",
      text: `"What about worker threads? How are they different from cluster?"`
    },
    {
      speaker: "raj",
      text: `"Different problem. Cluster is for scaling request throughput — more cores handling more concurrent connections. Worker threads are for CPU-intensive work inside a single request — you don't want to block the event loop, so you offload to a thread. Workers share memory with the main thread via SharedArrayBuffer and communicate via message passing. Cluster workers are separate processes — no shared memory, higher overhead, but more isolation. The two aren't alternatives — you'd use both: cluster for multi-core utilisation, worker threads for heavy per-request computation."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CLUSTER VS WORKER THREADS
// ─────────────────────────────────────────────────────

// ── Cluster — use all CPU cores for request throughput ──
const cluster = require('cluster');
const os      = require('os');

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length; // e.g. 8

  // Fork one worker per CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart crashed workers
  cluster.on('exit', (worker, code) => {
    logger.warn({ event: 'worker_died', pid: worker.process.pid, code });
    cluster.fork(); // replace the dead worker
  });

} else {
  // Each worker runs the full Express app independently
  const app = require('./app');
  app.listen(3000, () => {
    console.log(\`Worker \${process.pid} listening\`);
  });
}

// PM2 equivalent (what teams actually use):
// pm2 start server.js -i max   → cluster mode, one worker per CPU
// pm2 start server.js -i 4     → exactly 4 workers

// ── Worker threads — CPU work without blocking event loop ──
// heavy-computation.js (worker file)
const { workerData, parentPort } = require('worker_threads');
const result = expensiveComputation(workerData);
parentPort.postMessage(result);

// Main thread
const { Worker } = require('worker_threads');

app.post('/analyse', asyncHandler(async (req, res) => {
  const result = await new Promise((resolve, reject) => {
    const worker = new Worker('./heavy-computation.js', {
      workerData: req.body.data
    });
    worker.on('message', resolve);
    worker.on('error',   reject);
  });
  res.json({ result });
  // Event loop was free the entire time the worker computed
}));

// ── Worker thread pool (avoid spawning per request) ──
// Spawning a Worker per request is expensive (~100ms startup)
// Use a pool: create N workers upfront, reuse them
const Piscina = require('piscina'); // worker thread pool library
const pool = new Piscina({ filename: './heavy-computation.js', maxThreads: 4 });

app.post('/analyse', asyncHandler(async (req, res) => {
  const result = await pool.run(req.body.data);
  res.json({ result });
}));`
    },

    // ── Concurrent requests ──
    {
      speaker: "raj",
      text: `"How does Node actually handle 10,000 concurrent connections? Walk me through what happens when request number 5,000 comes in while 4,999 are all awaiting database responses."`
    },
    {
      speaker: "you",
      text: `"The event loop picks up the new connection immediately — the 4,999 awaiting requests aren't using the thread, they're just waiting for callbacks from the OS."`
    },
    {
      speaker: "raj",
      text: `"Exactly. When you await a database query, Node registers a callback with libuv — the C library underneath Node that handles I/O. libuv talks to the OS, which manages the actual network connections using kernel-level async I/O — epoll on Linux, kqueue on macOS. The Node thread is completely free. All those open connections are just file descriptors in the OS, essentially free. The only real constraint is memory: each concurrent request holds some state — headers, body, whatever your handler put in scope. If you have 10,000 concurrent connections each holding 50kb of data, that's 500mb. Memory, not CPU, is usually what limits concurrency in Node."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CONCURRENT REQUESTS — WHAT'S ACTUALLY HAPPENING
// ─────────────────────────────────────────────────────

// Node's concurrency stack (bottom to top):
// OS kernel    → epoll/kqueue: manages open file descriptors (connections)
// libuv        → thread pool for fs, crypto, DNS + event loop
// V8 + Node    → executes JavaScript callbacks when I/O completes
// Your code    → async handlers, awaits, callbacks

// ── Connection limits ──
// Default max open file descriptors on Linux: 1024 (ulimit -n)
// Increase for high-traffic servers:
// /etc/security/limits.conf:  * soft nofile 65536
//                             * hard nofile 65536

// ── Memory per connection — the real limit ──
// A basic Express request handler with no body: ~5-10kb per concurrent req
// With 1mb body in memory: 1mb per concurrent req
// 10,000 concurrent × 1mb = 10gb RAM

// Stream large bodies instead of buffering:
app.post('/upload', (req, res) => {
  // ✗ Buffers entire body in memory — dangerous for large uploads
  // app.use(express.json({ limit: '50mb' }))

  // ✓ Stream directly to storage — constant memory regardless of file size
  const writeStream = fs.createWriteStream('./upload.tmp');
  req.pipe(writeStream);
  writeStream.on('finish', () => res.json({ ok: true }));
});

// ── libuv thread pool — the hidden bottleneck ──
// Not all Node async operations use kernel async I/O
// fs, crypto, DNS lookups use libuv's thread pool: 4 threads by default
// If you have 100 concurrent file reads, only 4 happen at once
// The rest queue waiting for a pool thread

// Increase for I/O-heavy workloads:
// UV_THREADPOOL_SIZE=16 node server.js   (max 128)
// Or in code (must be set before any async work):
process.env.UV_THREADPOOL_SIZE = '16';`
    },

    // ── Memory leaks ──
    {
      speaker: "raj",
      text: `"Memory leak. Your Node process starts at 80mb RSS. After three days it's at 2.4gb. Then it crashes. No single request is large. What are the usual culprits?"`
    },
    {
      speaker: "you",
      text: `"Event listeners that aren't removed? Caches that grow unbounded?"`
    },
    {
      speaker: "raj",
      text: `"Those are the two most common. Event listeners: you attach a listener in a function, the function is called per request, nobody removes the listener — they accumulate. Node even warns you: 'MaxListenersExceededWarning: 11 listeners added — possible EventEmitter memory leak.' That warning is always worth investigating. Caches: you build an in-process cache, you add entries, you never evict. Every unique request parameter becomes a permanent entry. After a million unique userIds, you have a million cache entries in memory that never go away. The fix is a bounded cache — LRU or TTL-based — that evicts old entries."`
    },
    {
      speaker: "you",
      text: `"How do you actually find where the leak is?"`
    },
    {
      speaker: "raj",
      text: `"Take heap snapshots. Node has a built-in --inspect flag that opens a Chrome DevTools connection. You take a snapshot, do some work, take another, compare them. The objects that grew between snapshots are the leak — look at what's holding references to them. For production where you can't connect DevTools, there's clinic.js and the v8.writeHeapSnapshot() function which writes a snapshot to disk that you can analyse later. The key is catching it early — set up a memory usage alert at 80% of your container limit. By the time the process is at 2.4gb and about to crash, you've already lost hours of request logs in the dump."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// MEMORY LEAKS — COMMON CAUSES AND DETECTION
// ─────────────────────────────────────────────────────

// ── Leak 1: Event listener accumulation ──
// ✗ Adds a new listener every time the function is called
function setupHandler(emitter) {
  emitter.on('data', (chunk) => processChunk(chunk)); // never removed
}
// Called 1000× → 1000 listeners, all active, all holding closure references

// ✓ Remove listener when done, or use .once() for single-fire
emitter.once('data', handler);           // auto-removes after first fire
emitter.on('data', handler);
emitter.off('data', handler);            // explicit removal when done
// Or use AbortSignal to remove on cleanup

// ── Leak 2: Unbounded in-memory cache ──
// ✗ Grows forever — every userId is a unique key
const cache = {};
app.get('/user/:id', async (req, res) => {
  if (!cache[req.params.id]) {
    cache[req.params.id] = await User.findById(req.params.id);
  }
  res.json(cache[req.params.id]);
});

// ✓ Bounded LRU cache — evicts least-recently-used when full
const LRU = require('lru-cache');
const cache = new LRU({ max: 1000, ttl: 1000 * 60 * 5 }); // 1000 entries, 5min TTL

// ── Leak 3: Closures holding large objects ──
app.get('/report', asyncHandler(async (req, res) => {
  const hugeDataset = await fetchMillionRows(); // 200mb in memory
  const summary = summarise(hugeDataset);
  res.json(summary);
  // hugeDataset stays in memory until GC — if anything holds a ref, it never frees
}));
// Stream the response instead of buffering, or process in chunks

// ── Leak 4: Timers not cleared ──
// ✗ Timer created per request, never cleared
app.post('/poll', (req, res) => {
  const interval = setInterval(() => checkStatus(req.id), 1000);
  // interval is never cleared if the request ends unexpectedly
});

// ✓ Always clear timers on cleanup
req.on('close', () => clearInterval(interval)); // clear when client disconnects

// ── Finding leaks ──
// 1. node --inspect server.js
//    → Open Chrome: chrome://inspect
//    → Memory tab → Take Heap Snapshot
//    → Do work → Take another snapshot
//    → Comparison view: what grew?

// 2. Production: scheduled heap snapshot
const v8 = require('v8');
setInterval(() => {
  const filename = \`heap-\${Date.now()}.heapsnapshot\`;
  v8.writeHeapSnapshot(filename);
  // Download and open in Chrome DevTools Memory tab
}, 1000 * 60 * 60); // hourly

// 3. Memory alert before crash
setInterval(() => {
  const used = process.memoryUsage();
  const heapMB = used.heapUsed / 1024 / 1024;
  metrics.gauge('node.heap_mb', heapMB);
  if (heapMB > 512) {
    logger.error({ event: 'high_memory', heapMB });
    // alert before the process OOM-crashes
  }
}, 30_000);`
    },

    // ── Graceful shutdown ──
    {
      speaker: "raj",
      text: `"Last one. You deploy a new version. Kubernetes sends SIGTERM to the old pod. What should your Node process do?"`
    },
    {
      speaker: "you",
      text: `"Stop accepting new requests and finish the ones in flight before exiting."`
    },
    {
      speaker: "raj",
      text: `"And if you don't handle SIGTERM?"`
    },
    {
      speaker: "you",
      text: `"The process exits immediately. Any in-flight requests get cut off mid-response."`
    },
    {
      speaker: "raj",
      text: `"Clients get connection reset errors. If it's a payment or a database write mid-transaction, you might corrupt state. Graceful shutdown is not optional for production Node services. The pattern: receive SIGTERM, stop the HTTP server from accepting new connections, wait for existing connections to drain, close database pools and message queue connections, then exit. Give it a timeout — if after 30 seconds things haven't drained, force exit anyway. Kubernetes has a terminationGracePeriodSeconds setting — make sure your app's timeout is shorter than Kubernetes's so the process exits cleanly before Kubernetes kills it forcefully."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────

const server = app.listen(3000);

const shutdown = async (signal) => {
  logger.info({ event: 'shutdown_start', signal });

  // 1. Stop accepting new connections
  server.close(async () => {
    logger.info({ event: 'http_server_closed' });

    try {
      // 2. Close dependencies — database pools, queues, caches
      await mongoose.connection.close();
      await redisClient.quit();
      await messageQueue.close();

      logger.info({ event: 'shutdown_complete' });
      process.exit(0);

    } catch (err) {
      logger.error({ event: 'shutdown_error', err });
      process.exit(1);
    }
  });

  // 3. Force exit if graceful drain takes too long
  //    Must be shorter than Kubernetes terminationGracePeriodSeconds (default 30s)
  setTimeout(() => {
    logger.error({ event: 'shutdown_timeout_forced' });
    process.exit(1);
  }, 25_000).unref(); // .unref() — don't prevent Node from exiting if nothing else is running
};

process.on('SIGTERM', () => shutdown('SIGTERM')); // Kubernetes, Docker stop
process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl+C in development

// ── Keep-alive connections and server.close() ──
// server.close() stops NEW connections but keeps existing ones open
// HTTP keep-alive connections stay open — they prevent full drain
// Fix: set Connection: close header on responses during shutdown

let isShuttingDown = false;
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close'); // tell client to not reuse connection
  }
  next();
});

process.on('SIGTERM', () => {
  isShuttingDown = true;
  shutdown('SIGTERM');
});`
    },

    {
      type: "summary",
      points: [
        "Node is single-threaded for JavaScript execution but non-blocking for I/O. A single synchronous CPU operation — a large JSON.parse, a nested loop, a crypto.pbkdf2Sync — blocks every other request until it finishes. Use worker_threads for CPU-heavy work.",
        "Event loop lag is the metric to watch, not CPU%. A blocked event loop shows as lag before CPU even spikes. monitorEventLoopDelay from perf_hooks gives you the measurement.",
        "Express 4 doesn't catch rejected Promises from async route handlers. An unhandled rejection leaves the request hanging forever with no response. Wrap every async handler with try/catch + next(err), or use an asyncHandler wrapper.",
        "Express error handlers must have exactly four parameters — (err, req, res, next). Three parameters and Express won't treat it as an error handler, errors pass silently.",
        "A Node process uses one CPU core. Cluster mode forks one worker per core, each with its own event loop. PM2 -i max handles this in production. Worker threads are for CPU work inside a single request — different problem from cluster.",
        "libuv's thread pool has only 4 threads by default. fs, crypto, and DNS operations share this pool. Under heavy concurrent file I/O, operations queue waiting for a thread. Set UV_THREADPOOL_SIZE to increase it.",
        "Memory leaks in Node: event listeners never removed (watch for MaxListenersExceededWarning), unbounded in-process caches, closures holding large objects, intervals never cleared. Use bounded LRU caches and always clean up listeners.",
        "Finding leaks: node --inspect connects Chrome DevTools. Take two heap snapshots, compare — the objects that grew are the leak. In production, v8.writeHeapSnapshot() writes a snapshot file to analyse later.",
        "Graceful shutdown on SIGTERM: stop accepting new connections, drain existing ones, close DB pools and queues, exit. Timeout must be shorter than Kubernetes's terminationGracePeriodSeconds. Without this, in-flight requests get connection reset errors on every deploy."
      ]
    }
  ]
};

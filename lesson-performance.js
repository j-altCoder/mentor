// ─────────────────────────────────────────────────────────────────
//  LESSON: Performance Optimization
//  Category: Scalability & Performance
// ─────────────────────────────────────────────────────────────────

const LESSON_PERFORMANCE = {
  category: "Scalability & Performance",
  tag: "Performance Optimization",
  title: "Why Is This So Slow — and How Do We Fix It?",
  intro: "Code review. You've submitted a feature that works perfectly in dev. Raj opens the PR, scrolls for a few seconds, then says four words that ruin your afternoon.",
  scenes: [

    // ── N+1 problem ──
    {
      speaker: "raj",
      text: `"This will destroy production. Can you see it?"`
    },
    {
      speaker: "you",
      text: `"It works in dev... what am I missing?"`
    },
    {
      speaker: "raj",
      text: `"You're hitting the database inside a loop. That's the <em>N+1 problem</em>. You fetch a list of 100 posts — that's 1 query. Then for each post you fetch the author — that's 100 more queries. 101 database round-trips to display one page. In dev with 5 posts it feels fine. In production with 10,000 concurrent users, each making 101 queries, you've just brought down the database."`
    },
    {
      speaker: "you",
      text: `"How do I fix it?"`
    },
    {
      speaker: "raj",
      text: `"Fetch everything you need in as few queries as possible. In Mongoose that's <em>populate()</em> — it joins authors to posts in a second query, not 100. In SQL that's a <em>JOIN</em>. Or you batch the IDs — collect all authorIds from the first query, then do one <em>findMany</em> with all of them. The rule: <em>never query inside a loop</em>."`
    },
    {
      type: "code",
      text: `// ❌ N+1 — 1 query for posts + 1 per author = 101 queries
const posts = await Post.find({});
for (const post of posts) {
  post.author = await User.findById(post.authorId); // query inside loop
}

// ✅ Fix 1 — Mongoose populate() — 2 queries total
const posts = await Post.find({}).populate('authorId', 'name avatar');

// ✅ Fix 2 — Batch fetch (works in any DB)
const posts      = await Post.find({});
const authorIds  = [...new Set(posts.map(p => p.authorId.toString()))];
const authors    = await User.find({ _id: { $in: authorIds } });
const authorMap  = Object.fromEntries(authors.map(a => [a._id.toString(), a]));
const result     = posts.map(p => ({ ...p.toObject(), author: authorMap[p.authorId.toString()] }));

// ✅ Fix 3 — SQL JOIN (one query)
SELECT posts.*, users.name, users.avatar
FROM posts
JOIN users ON posts.author_id = users.id
WHERE posts.status = 'published';

// How to spot N+1 in production
// Mongoose — enable query logging
mongoose.set('debug', true); // logs every query — look for repeated patterns

// Or use a query counter middleware
let queryCount = 0;
mongoose.plugin(schema => {
  schema.pre(/^find/, () => queryCount++);
});`
    },

    // ── API Pagination ──
    {
      speaker: "you",
      text: `"Our /api/orders endpoint returns all orders at once. We have 500,000 orders in the DB. Is that a problem?"`
    },
    {
      speaker: "raj",
      text: `"Yes — you're loading half a million rows into memory, serialising them to JSON, and sending potentially hundreds of megabytes over the wire on every request. The server runs out of memory. The client waits forever. And you pay for all that bandwidth. <em>Pagination</em> solves this — only fetch and return a page of results at a time. Two approaches: <em>offset pagination</em> — skip N rows, take M. Simple to implement and understand. <em>Cursor pagination</em> — return a pointer to the last item, next request starts from there. Faster on large datasets and stable when new data is being inserted."`
    },
    {
      speaker: "you",
      text: `"Why is cursor pagination faster than offset?"`
    },
    {
      speaker: "raj",
      text: `"With offset, the database has to scan and discard all the rows before your offset before it can return your page. Asking for page 500 with 20 items per page means the DB scans through 10,000 rows and throws them away. With cursor pagination you query directly from a known point — 'give me 20 items where the ID is greater than this cursor.' The database uses the index to jump straight there. On a table with millions of rows the difference between offset and cursor on late pages is the difference between milliseconds and seconds."`
    },
    {
      type: "code",
      text: `// Offset pagination — simple, gets slow on high page numbers
app.get('/orders', asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments()
  ]);

  res.json({
    data: orders,
    pagination: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNext:    page < Math.ceil(total / limit),
      hasPrev:    page > 1
    }
  });
}));

// Cursor pagination — fast at any depth, stable under insertion
app.get('/orders', asyncHandler(async (req, res) => {
  const limit  = parseInt(req.query.limit) || 20;
  const cursor = req.query.cursor; // _id of last item from previous page

  const query = cursor
    ? { _id: { $lt: cursor } }  // items before cursor (descending order)
    : {};

  const orders = await Order.find(query)
    .sort({ _id: -1 })  // newest first (ObjectId contains timestamp)
    .limit(limit + 1);  // fetch one extra to check if there's a next page

  const hasNext    = orders.length > limit;
  const data       = hasNext ? orders.slice(0, limit) : orders;
  const nextCursor = hasNext ? data[data.length - 1]._id : null;

  res.json({
    data,
    pagination: { hasNext, nextCursor }
    // client passes nextCursor as ?cursor= on next request
  });
}));`
    },

    // ── Batching async operations ──
    {
      speaker: "you",
      text: `"I have a function that does 10 async things in a row. Should I just await them one by one?"`
    },
    {
      speaker: "raj",
      text: `"Show me the code first."`
    },
    {
      speaker: "you",
      text: `"Something like: await fetchUser, then await fetchOrders, then await fetchPreferences, then await fetchNotifications..."`
    },
    {
      speaker: "raj",
      text: `"That's sequential — each one waits for the previous to finish. If each takes 200ms, that's 800ms total. But those four calls are completely independent — none of them need the result of another to start. Run them in <em>parallel</em> with Promise.all and your total time is the slowest one — probably still 200ms. That's a 4x speedup for free. The rule: if async operations don't depend on each other, run them in parallel."`
    },
    {
      speaker: "you",
      text: `"What if one fails — does Promise.all cancel everything?"`
    },
    {
      speaker: "raj",
      text: `"Promise.all <em>fails fast</em> — the moment one promise rejects, the whole thing rejects. The other promises keep running in the background but you don't get their results. If you need the results even when some fail — like loading a dashboard where each widget is independent — use <em>Promise.allSettled</em>. It always resolves with an array of outcomes, each telling you whether it fulfilled or rejected. Page still loads, failing widgets show an error, the rest show data."`
    },
    {
      type: "code",
      text: `// ❌ Sequential — total time = sum of all operations
const user          = await fetchUser(userId);       // 200ms
const orders        = await fetchOrders(userId);     // 200ms
const preferences   = await fetchPreferences(userId);// 150ms
const notifications = await fetchNotifications(userId); // 180ms
// Total: ~730ms

// ✅ Parallel — total time = slowest single operation
const [user, orders, preferences, notifications] = await Promise.all([
  fetchUser(userId),          // ─┐
  fetchOrders(userId),        //  │ all start at same time
  fetchPreferences(userId),   //  │
  fetchNotifications(userId)  // ─┘
]);
// Total: ~200ms (slowest one)

// ✅ Promise.allSettled — use when partial failure is acceptable
const results = await Promise.allSettled([
  fetchFeed(userId),
  fetchRecommendations(userId), // might be down
  fetchAds(userId)              // might be slow
]);

const [feed, recs, ads] = results;
res.json({
  feed:            feed.status === 'fulfilled'    ? feed.value    : [],
  recommendations: recs.status === 'fulfilled'    ? recs.value    : [],
  ads:             ads.status  === 'fulfilled'    ? ads.value     : []
  // Page renders even if 2 of 3 services are down
});

// Controlled concurrency — don't run 10,000 things at once
// Run 5 at a time using a chunk approach
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size));

const results = [];
for (const batch of chunk(userIds, 5)) {
  const batchResults = await Promise.all(batch.map(id => processUser(id)));
  results.push(...batchResults);
}
// Processes 5 users at a time — not all at once (avoids overwhelming DB)`
    },

    // ── Memoization ──
    {
      speaker: "you",
      text: `"What's memoization? Is it the same as caching?"`
    },
    {
      speaker: "raj",
      text: `"Related but different scope. Caching is external — Redis, a CDN, a database query cache. <em>Memoization</em> is in-process — storing the result of a function call in memory, keyed by its arguments, so if the same function is called again with the same arguments you return the stored result instantly without recomputing. It's for pure functions — functions that always return the same output for the same input and have no side effects. Computing a complex price calculation, processing a static config, parsing a schema — these are good candidates. The limitation: memoization only lives for the lifespan of the process. It doesn't survive restarts and doesn't share across multiple server instances."`
    },
    {
      type: "code",
      text: `// Manual memoization
const memo = new Map();

const expensiveCalc = (input) => {
  if (memo.has(input)) return memo.get(input); // cache hit
  const result = doHeavyComputation(input);
  memo.set(input, result);
  return result;
};

// Generic memoize wrapper
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const getPricingRules = memoize((planType, region) => {
  return computeComplexPricing(planType, region); // only computed once per unique combo
});

// Async memoization — memoize the promise itself
const asyncMemo = (fn) => {
  const cache = new Map();
  return async (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const promise = fn(...args);       // store the promise, not the result
    cache.set(key, promise);           // concurrent callers get the same promise
    try {
      return await promise;
    } catch (err) {
      cache.delete(key);               // don't cache failures
      throw err;
    }
  };
};

// With TTL — clear cache entry after a time window
const memoizeWithTTL = (fn, ttlMs) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < ttlMs) return hit.value;
    const value = fn(...args);
    cache.set(key, { value, ts: Date.now() });
    return value;
  };
};`
    },

    // ── Debounce vs Throttle ──
    {
      speaker: "you",
      text: `"Debounce and throttle — I always mix them up. What's the actual difference?"`
    },
    {
      speaker: "raj",
      text: `"Different tools for different problems. <em>Debounce</em>: wait until the action has stopped for a set period, then fire once. A user typing in a search box — you don't want to hit the API on every keystroke. Debounce waits until they stop typing for 300ms, then sends one request. If they keep typing, the timer resets. <em>Throttle</em>: fire at most once every N milliseconds regardless of how many times the event fires. A scroll handler or resize event — it fires hundreds of times per second. Throttle ensures your handler runs at most once every 100ms, no matter how fast the events come in."`
    },
    {
      type: "analogy",
      text: "Debounce = an elevator that waits until no one has pressed a button for 30 seconds before it closes the doors. Throttle = an elevator that closes the doors every 30 seconds regardless — it leaves on schedule even if people are still boarding."
    },
    {
      type: "code",
      text: `// Debounce — fires AFTER the event stream stops
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);                  // cancel previous timer on every call
    timer = setTimeout(() => fn(...args), delay); // only fire if no call for 'delay' ms
  };
};

// Search — only hits API when user pauses typing
const searchAPI = debounce(async (query) => {
  const results = await fetch('/api/search?q=' + query);
  renderResults(await results.json());
}, 300);

input.addEventListener('input', e => searchAPI(e.target.value));

// Throttle — fires at most once per interval
const throttle = (fn, interval) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
};

// Scroll handler — runs at most once every 100ms even on fast scrolling
const handleScroll = throttle(() => {
  updateScrollProgress();
  checkInfiniteScrollTrigger();
}, 100);

window.addEventListener('scroll', handleScroll);

// Server-side: throttle expensive operations per user
const userRequestTimes = new Map();
const throttlePerUser = (userId, limitMs) => {
  const last = userRequestTimes.get(userId) || 0;
  if (Date.now() - last < limitMs) throw new AppError('Too many requests', 429);
  userRequestTimes.set(userId, Date.now());
};`
    },

    // ── Database query optimization ──
    {
      speaker: "you",
      text: `"Beyond N+1, what other database performance mistakes do people make that you see in code reviews?"`
    },
    {
      speaker: "raj",
      text: `"Several. <em>Fetching more columns than you need</em> — SELECT * when you only need name and email. Every extra column is extra memory, extra serialisation, extra bytes over the wire. Always project only what you need. <em>Missing compound indexes</em> — you might index userId and you might index createdAt separately, but if you always query WHERE userId = X ORDER BY createdAt, you need a compound index on both together. The order matters — put equality fields before range fields. <em>Not using EXPLAIN</em> — if a query feels slow, run EXPLAIN and look for full scans. And <em>unbounded queries</em> — never query without a limit. Even if you expect few results, a data anomaly could return millions."`
    },
    {
      type: "code",
      text: `// ❌ Fetching everything — wasteful
const users = await User.find({});
const orders = await Order.find({ userId }).select('-__v'); // still too much

// ✅ Project only what you need
const users = await User.find({}).select('name email avatar createdAt');
// SQL equivalent: SELECT name, email, avatar, created_at FROM users

// ❌ Separate indexes — inefficient for compound queries
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ createdAt: -1 });
// Query: { userId, sort by createdAt } — uses only one index, scans the rest

// ✅ Compound index — covers the full query pattern
db.orders.createIndex({ userId: 1, createdAt: -1 });
// Equality fields (userId) first, then range/sort fields (createdAt)

// Diagnose slow queries with EXPLAIN
db.orders.find({ userId: 'abc' }).sort({ createdAt: -1 }).explain('executionStats');
// Look for:
// winningPlan.stage: 'IXSCAN' ✓ (using index)
// winningPlan.stage: 'COLLSCAN' ✗ (full table scan — add an index)
// totalDocsExamined vs nReturned — if examined >> returned, index isn't selective enough

// ❌ Unbounded query — ticking time bomb
const allLogs = await Log.find({ level: 'error' });

// ✅ Always limit, even when you expect few results
const recentErrors = await Log.find({ level: 'error' })
  .sort({ createdAt: -1 })
  .limit(100);

// Lean queries — skip Mongoose document instantiation (30-40% faster for reads)
const users = await User.find({}).select('name email').lean();
// Returns plain JS objects, not Mongoose documents — can't call .save(), but fast`
    },

    // ── Memory management and leaks ──
    {
      speaker: "you",
      text: `"Our Node server slows down over hours and eventually needs a restart. What causes that?"`
    },
    {
      speaker: "raj",
      text: `"Classic <em>memory leak</em>. Node's V8 engine has a garbage collector that frees memory automatically — but only when there are no more references to an object. A memory leak is when your code keeps references to things longer than necessary, so the GC can never reclaim them. The most common causes in Node: <em>event listeners that are never removed</em>, <em>closures that capture large objects</em>, <em>global caches that grow without bounds</em>, and <em>timers or intervals that are never cleared</em>. As memory climbs, V8 spends more time garbage collecting and less time running your code — that's why performance degrades gradually."`
    },
    {
      speaker: "you",
      text: `"How do you find a memory leak?"`
    },
    {
      speaker: "raj",
      text: `"Monitor memory usage over time with process.memoryUsage(). If heapUsed grows steadily and never comes back down, you have a leak. To find where — take heap snapshots in Chrome DevTools by connecting with node --inspect, trigger some operations, take another snapshot, compare them. The objects accumulating between snapshots are your leak. Or use the <em>clinic.js</em> suite — clinic doctor analyses your app and identifies specific problem patterns including memory leaks automatically."`
    },
    {
      type: "code",
      text: `// Common memory leaks and fixes

// ❌ Leak 1 — event listener never removed
class DataProcessor extends EventEmitter {
  start() {
    process.on('data', this.handleData); // adds a listener every time start() is called
  }
}
// ✅ Fix — remove listener when done, or use once()
class DataProcessor extends EventEmitter {
  start() {
    this.boundHandler = this.handleData.bind(this);
    process.on('data', this.boundHandler);
  }
  stop() {
    process.removeListener('data', this.boundHandler);
  }
}

// ❌ Leak 2 — unbounded in-memory cache
const cache = {};
app.get('/data/:id', (req, res) => {
  cache[req.params.id] = fetchData(req.params.id); // grows forever
});

// ✅ Fix — use a bounded cache with LRU eviction
const LRU = require('lru-cache');
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 }); // max 500 items, 5min TTL

// ❌ Leak 3 — interval never cleared
setInterval(() => cleanupOldSessions(), 60000);  // lives forever, even if module reloads

// ✅ Fix — store reference and clear on shutdown
const interval = setInterval(() => cleanupOldSessions(), 60000);
process.on('SIGTERM', () => clearInterval(interval));

// Monitor memory usage in production
setInterval(() => {
  const mem = process.memoryUsage();
  logger.info('Memory usage', {
    heapUsed:  Math.round(mem.heapUsed  / 1024 / 1024) + 'MB',
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
    rss:       Math.round(mem.rss       / 1024 / 1024) + 'MB'
  });
}, 30000); // log every 30 seconds`
    },

    // ── Streaming ──
    {
      speaker: "you",
      text: `"We need to export all orders as a CSV. Right now we load everything into memory, build the CSV string, then send it. The endpoint crashes when there are more than 50,000 rows."`
    },
    {
      speaker: "raj",
      text: `"You're loading the entire dataset into memory at once. With 50,000 rows at maybe 1KB each, that's 50MB per request. With 100 concurrent export requests, that's 5GB of memory. The fix is <em>streaming</em>. Instead of loading everything then sending, you read from the database as a stream, pipe each chunk through a CSV transformer, and pipe that directly to the response. Data flows through your server like water through a pipe — at any given moment you only hold a small buffer in memory, not the whole dataset. The client starts receiving data immediately and your memory usage stays flat no matter how many rows there are."`
    },
    {
      type: "code",
      text: `const { Transform } = require('stream');
const { stringify }  = require('csv-stringify');

// ❌ Load everything into memory — crashes at scale
app.get('/export/orders', async (req, res) => {
  const orders = await Order.find({}); // loads ALL orders into RAM
  const csv    = orders.map(o => [o.id, o.total, o.status].join(',')).join('\n');
  res.send(csv); // sends when fully built
});

// ✅ Stream from DB → transform → response
app.get('/export/orders', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');

  // Mongoose cursor — reads one batch at a time, doesn't load all into memory
  const cursor = Order.find({})
    .select('orderId total status createdAt')
    .lean()
    .cursor({ batchSize: 500 }); // read 500 docs at a time from MongoDB

  // CSV stringifier transform stream
  const csvStream = stringify({
    header: true,
    columns: { orderId: 'Order ID', total: 'Total', status: 'Status', createdAt: 'Date' }
  });

  cursor
    .pipe(csvStream)  // transform docs to CSV rows
    .pipe(res)        // pipe directly to HTTP response
    .on('error', err => {
      logger.error('Export failed', err);
      if (!res.headersSent) res.status(500).json({ error: 'Export failed' });
    });
});

// Same pattern for reading large files
const fs = require('fs');
app.get('/download/:file', (req, res) => {
  const stream = fs.createReadStream('/uploads/' + req.params.file);
  stream.pipe(res); // file data flows to client without loading into memory
});`
    },

    // ── Connection pooling ──
    {
      speaker: "you",
      text: `"I know connection pooling exists but I've never had to configure it. What's actually happening under the hood?"`
    },
    {
      speaker: "raj",
      text: `"Opening a database connection is expensive — TCP handshake, authentication, setting session variables. If you opened a new connection on every API request and closed it after, you'd be spending more time on connection overhead than on the actual query. A <em>connection pool</em> maintains a set of open connections that get reused. Request comes in, borrows a connection from the pool, runs the query, returns the connection to the pool. The next request picks it up immediately — no handshake, no auth. The pool manages the lifecycle. You configure min size — connections always kept warm — and max size — the ceiling. When all connections are in use, new requests wait in a queue until one is returned."`
    },
    {
      speaker: "you",
      text: `"What happens if I set the pool size too high?"`
    },
    {
      speaker: "raj",
      text: `"The database starts struggling. Every database server has a maximum connections limit. If you have 10 Node instances each with a pool of 100 connections, that's 1,000 connections to your PostgreSQL server which might have a limit of 100. The connections get rejected. Rule of thumb: total connections across all app instances should be well below the database's max_connections setting — leave room for admin connections and monitoring tools."`
    },
    {
      type: "code",
      text: `// MongoDB — Mongoose manages pool automatically
mongoose.connect(process.env.DATABASE_URL, {
  maxPoolSize:      10,   // max 10 connections per Node instance
  minPoolSize:       2,   // keep 2 connections always open (warm)
  maxIdleTimeMS: 30000,   // close idle connections after 30s
  socketTimeoutMS: 45000, // timeout if no response in 45s
});
// With 3 Node instances: 3 × 10 = 30 total connections to MongoDB

// PostgreSQL — pg pool
const { Pool } = require('pg');
const pool = new Pool({
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  max:      10,    // max connections
  min:       2,    // min connections kept warm
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 2000, // fail fast if can't get connection in 2s
});

// Monitor pool health
setInterval(() => {
  logger.info('DB pool stats', {
    total:   pool.totalCount,   // connections open
    idle:    pool.idleCount,    // available connections
    waiting: pool.waitingCount  // requests waiting for a connection
  });
}, 60000);
// If waitingCount is consistently > 0, increase pool size or scale your app`
    },

    // ── HTTP response optimization ──
    {
      speaker: "you",
      text: `"Beyond gzip, what else can you do to make API responses faster to transfer?"`
    },
    {
      speaker: "raj",
      text: `"A few things. <em>Response shaping</em> — only send the fields the client actually needs. An admin dashboard might need all 40 fields on a user object. The mobile app might only need 5. Either version your API responses or implement a fields query parameter. <em>ETags and conditional requests</em> — the server generates a hash of the response. The client caches it and sends the ETag back on the next request in an If-None-Match header. If the data hasn't changed, the server responds with 304 Not Modified — no body, tiny response. <em>HTTP/2</em> — allows multiple requests over one TCP connection simultaneously, binary protocol, header compression. If your Nginx supports it and your clients do too, enable it — it's a free improvement."`
    },
    {
      type: "code",
      text: `// ETag — conditional caching (server sends no body if unchanged)
const crypto = require('crypto');

app.get('/api/config', asyncHandler(async (req, res) => {
  const config  = await Config.findOne({});
  const etag    = '"' + crypto.createHash('md5').update(JSON.stringify(config)).digest('hex') + '"';

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'private, must-revalidate');

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // data unchanged — send no body
  }

  res.json(config); // data changed — send full response
}));

// Field selection — only return what the client needs
app.get('/api/users', asyncHandler(async (req, res) => {
  const fields  = req.query.fields?.split(',') || null;
  let query     = User.find({ active: true });

  if (fields) {
    query = query.select(fields.join(' ')); // project only requested fields
  }

  const users = await query.lean();
  res.json(users);
  // GET /api/users?fields=name,email,avatar → only those 3 fields returned
}));

// HTTP/2 in Nginx — just two lines
server {
  listen 443 ssl http2;   // ← enable http2 here
  ...
}
# Benefits: multiplexing (many requests on one connection),
#           header compression (HPACK), server push (optional)`
    },

    // ── Event loop blocking ──
    {
      speaker: "raj",
      text: `"One more — the most dangerous performance mistake specific to Node. What happens if you run a CPU-intensive operation synchronously in a request handler?"`
    },
    {
      speaker: "you",
      text: `"It... takes longer?"`
    },
    {
      speaker: "raj",
      text: `"It <em>blocks every other request</em>. Node is single-threaded. The event loop handles all requests. If you do something CPU-intensive synchronously — parsing a huge JSON file, computing a cryptographic hash with a high iteration count, running a complex sort on 100,000 items — the event loop is blocked for the duration. No other request can be processed until it's done. In a busy API that could be catastrophic. The fixes: move CPU-heavy work to a <em>Worker Thread</em> — a separate thread that doesn't block the event loop. Or offload it to a <em>background job</em>. Or use async versions of operations — crypto.pbkdf2 instead of crypto.pbkdf2Sync."`
    },
    {
      type: "code",
      text: `// ❌ Blocking the event loop — freezes all requests
app.post('/process', (req, res) => {
  const result = JSON.parse(hugeJsonString);       // synchronous — blocks
  const hash   = crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha512'); // blocks for ~200ms
  res.json(result);
});

// ✅ Use async alternatives
app.post('/hash', asyncHandler(async (req, res) => {
  // Async — hands off to thread pool, event loop stays free
  const hash = await new Promise((resolve, reject) =>
    crypto.pbkdf2(req.body.password, salt, 100000, 64, 'sha512', (err, key) =>
      err ? reject(err) : resolve(key.toString('hex'))
    )
  );
  res.json({ hash });
}));

// ✅ Worker threads — CPU work on a separate thread
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// worker.js — runs on separate thread
if (!isMainThread) {
  const result = heavyCPUWork(workerData.input);
  parentPort.postMessage(result);
}

// main thread — offload to worker
app.post('/process', asyncHandler(async (req, res) => {
  const result = await new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: { input: req.body } });
    worker.on('message', resolve);
    worker.on('error',   reject);
  });
  res.json(result);
  // event loop was free the entire time — other requests processed normally
}));

// Measure event loop lag — if > 100ms you have a blocking problem
const { monitorEventLoopDelay } = require('perf_hooks');
const monitor = monitorEventLoopDelay({ resolution: 20 });
monitor.enable();
setInterval(() => {
  logger.info('Event loop lag', {
    mean: Math.round(monitor.mean / 1e6) + 'ms', // nanoseconds → ms
    max:  Math.round(monitor.max  / 1e6) + 'ms'
  });
}, 10000);`
    },

    {
      type: "summary",
      points: [
        "N+1 problem = querying inside a loop. Fix with populate(), JOIN, or batch fetch by IDs. Never query inside a loop.",
        "Offset pagination gets slow on late pages — DB scans skipped rows. Cursor pagination jumps directly to index position. Always paginate.",
        "Promise.all = parallel execution, fails fast on first rejection. Promise.allSettled = all settle, get results + errors. Use allSettled for independent operations.",
        "Controlled concurrency = chunk large arrays and process N at a time to avoid overwhelming downstream services.",
        "Memoization = in-process function result cache keyed by arguments. For pure functions. Doesn't survive restarts or cross instances.",
        "Debounce = fire once after event stream stops. Throttle = fire at most once per interval. Different tools, different problems.",
        "DB: project only needed fields, compound indexes for compound queries (equality first), always use EXPLAIN, always add LIMIT.",
        "lean() in Mongoose = skip document instantiation, 30-40% faster for read-only queries.",
        "Memory leaks: remove event listeners, bound caches with LRU eviction, clear intervals on shutdown.",
        "Streaming = pipe DB cursor → transform → response. Memory stays flat regardless of dataset size. Essential for exports.",
        "Connection pool: reuses expensive DB connections. Total connections across all instances must stay under DB max_connections.",
        "ETags = hash of response. Client sends If-None-Match. Server returns 304 with no body if unchanged. Massive bandwidth saving.",
        "Field selection = only return fields the client needs. Reduces payload size and DB query cost simultaneously.",
        "Blocking the event loop = one CPU-heavy sync operation freezes ALL requests. Use Worker Threads or async alternatives.",
        "Monitor event loop lag — consistently over 50ms means something is blocking. Use perf_hooks monitorEventLoopDelay."
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────
//  LESSON: System Design / Scaling Questions
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_SCALING = {
  category: "Architecture & System Design",
  tag: "System Design & Scaling",
  title: "What Happens When a Million Users Show Up",
  intro: "The product just got featured on a major news site. Traffic is 50x normal. The site is crawling. Your phone is blowing up. Raj is already at his desk with a coffee, completely calm.",
  scenes: [

    // ── Vertical vs Horizontal scaling ──
    {
      speaker: "raj",
      text: `"First thing — what's your instinct when the server is struggling under load?"`
    },
    {
      speaker: "you",
      text: `"Get a bigger server? More RAM, more CPU?"`
    },
    {
      speaker: "raj",
      text: `"That's <em>vertical scaling</em> — scaling up. Buy a more powerful machine. It's the fastest solution and sometimes the right one. But it has a hard ceiling. The biggest single server in AWS costs thousands per hour and there's no bigger one. And if that one server goes down, everything goes down. <em>Horizontal scaling</em> — scaling out — means adding more servers and spreading traffic between them. No ceiling. If one server dies, others keep running. The catch: your app must be <em>stateless</em>. If Server A handles your login and stores your session in memory, Server B knows nothing about you. That's why we use Redis for sessions and JWTs for auth — any server can handle any request."`
    },
    {
      type: "analogy",
      text: "Vertical scaling = replacing your one cashier with a superhuman who works 10x faster. Has a limit — even superhumans tire. Horizontal scaling = opening 10 checkout lanes. One closes, nine keep going. As long as each cashier has the same rulebook (stateless), any lane can serve any customer."
    },
    {
      type: "code",
      text: `// Vertical scaling — just upgrade the instance
// t3.micro → t3.xlarge → m5.4xlarge
// Fast to do, but limited ceiling and single point of failure

// Horizontal scaling — stateless app requirement checklist:
// ✓ No in-memory session storage (use Redis)
// ✓ No local file storage (use S3)
// ✓ No server-side WebSocket state without pub/sub (use Redis pub/sub)
// ✓ Auth via JWT (any server can verify with shared public key)
// ✓ Config via environment variables (not hardcoded paths)

// Node.js cluster module — use all CPU cores on ONE machine
// (horizontal within a single server)
const cluster = require('cluster');
const os      = require('os');

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;  // e.g. 8 cores
  console.log('Starting ' + cpuCount + ' workers');
  for (let i = 0; i < cpuCount; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    console.log('Worker ' + worker.id + ' died, restarting...');
    cluster.fork(); // auto-restart dead workers
  });
} else {
  require('./app'); // each worker runs your Express app
}

// In production — PM2 handles this automatically
// pm2 start app.js -i max   (max = number of CPU cores)`
      }
    },

    // ── Load balancing ──
    {
      speaker: "you",
      text: `"So we have multiple servers. How does traffic get split between them?"`
    },
    {
      speaker: "raj",
      text: `"That's the <em>load balancer's</em> job. It sits in front of all your servers and distributes incoming requests. The most common strategy is <em>round-robin</em> — send request 1 to server A, request 2 to server B, request 3 to server C, then back to A. Simple and effective when all servers are identical. <em>Least connections</em> sends each new request to whichever server currently has the fewest active connections — better when requests vary in how long they take. <em>IP hash</em> always routes the same client IP to the same server — useful if you need sticky sessions, but breaks horizontal scaling's stateless benefit so use it sparingly."`
    },
    {
      speaker: "you",
      text: `"How does the load balancer know if a server is down?"`
    },
    {
      speaker: "raj",
      text: `"<em>Health checks</em>. The load balancer pings each server's health endpoint — usually GET /health — every few seconds. If a server fails to respond or returns an error, the load balancer removes it from the pool and stops sending it traffic. When it recovers, it gets added back. Your /health endpoint should check not just if the process is running but if it can actually do its job — can it reach the database, can it reach Redis? A server that's up but can't reach the DB should fail its health check."`
    },
    {
      type: "code",
      text: `// Nginx as load balancer — nginx.conf
upstream api_servers {
  least_conn;  # strategy: least connections

  server api-1:3000 weight=1;
  server api-2:3000 weight=1;
  server api-3:3000 weight=2;  # this server gets 2x the traffic (more powerful)

  keepalive 32;  # keep connections to upstream servers alive (reduces overhead)
}

server {
  listen 80;
  location / {
    proxy_pass         http://api_servers;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;         # forward real client IP
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}

// Health check endpoint in Express
app.get('/health', asyncHandler(async (req, res) => {
  // Don't just return 200 — check actual dependencies
  await mongoose.connection.db.admin().ping(); // DB reachable?
  await redis.ping();                          // Redis reachable?
  res.json({
    status: 'ok',
    uptime:  process.uptime(),
    memory:  process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
}));
// If DB or Redis throws → unhandled error → asyncHandler → next(err) → 500
// Load balancer sees 500 → removes server from pool`
      }
    },

    // ── Caching strategy ──
    {
      speaker: "you",
      text: `"Caching keeps coming up as the answer to everything. But when is it actually appropriate and when does it cause problems?"`
    },
    {
      speaker: "raj",
      text: `"Caching is appropriate when data is <em>read far more often than it's written</em>, and when serving slightly stale data is acceptable. Product listings, user profiles, config data, leaderboards — perfect for caching. A user's bank balance or inventory count — probably not, you need fresh data every time. The problems caching causes: <em>stale data</em> — a user updates their name but the cache serves the old name for 5 minutes. <em>Cache stampede</em> — the cache expires, 10,000 simultaneous requests all miss and hit the database at once, bringing it down. <em>Cache invalidation</em> — knowing when to bust the cache is genuinely one of the hardest problems in computer science."`
    },
    {
      speaker: "you",
      text: `"How do you prevent a cache stampede?"`
    },
    {
      speaker: "raj",
      text: `"A few strategies. <em>Staggered TTLs</em> — add random jitter to expiry times so not everything expires at once. <em>Cache locking</em> — when a cache miss happens, one request sets a lock, fetches from the DB and populates the cache, other concurrent requests wait for the lock and then read from cache. <em>Background refresh</em> — before the cache expires, a background job refreshes it so it never actually goes cold. And always <em>cache-aside pattern</em> — try cache first, on miss go to DB and populate cache, never write to cache and DB simultaneously or you create consistency nightmares."`
    },
    {
      type: "code",
      text: `const redis = require('ioredis');
const client = new redis(process.env.REDIS_URL);

// Cache-aside pattern — the standard approach
const getUser = async (userId) => {
  const cacheKey = 'user:' + userId;

  // 1. Try cache first
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss — fetch from DB
  const user = await User.findById(userId);
  if (!user) return null;

  // 3. Populate cache with TTL
  await client.setex(cacheKey, 300, JSON.stringify(user)); // 5 min TTL
  return user;
};

// Cache invalidation — bust cache when data changes
const updateUser = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(userId, updates, { new: true });
  await client.del('user:' + userId);  // bust the cache immediately
  return user;
};

// Staggered TTLs — prevent stampede on popular keys
const TTL_BASE    = 300;
const TTL_JITTER  = Math.floor(Math.random() * 60); // 0-60s random
await client.setex(cacheKey, TTL_BASE + TTL_JITTER, data);

// Cache locking — one request populates, others wait
const getWithLock = async (key, fetchFn) => {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey = 'lock:' + key;
  const locked  = await client.set(lockKey, '1', 'NX', 'EX', 10); // set if not exists, 10s TTL

  if (locked) {
    const data = await fetchFn();
    await client.setex(key, 300, JSON.stringify(data));
    await client.del(lockKey);
    return data;
  } else {
    // Another request is fetching — wait and retry
    await new Promise(r => setTimeout(r, 100));
    return getWithLock(key, fetchFn); // retry
  }
};`
      }
    },

    // ── Redis data structures ──
    {
      speaker: "you",
      text: `"We use Redis just as a key-value store. Is that all it's good for?"`
    },
    {
      speaker: "raj",
      text: `"You're using about 20% of Redis. It has rich data structures that solve specific problems elegantly. <em>Lists</em> for queues and activity feeds — push to one end, pop from the other. <em>Sets</em> for unique collections — who's online right now, what tags does this post have. <em>Sorted Sets</em> for leaderboards — store score with member, automatically sorted, range queries in O(log n). <em>Hashes</em> for structured objects — store a user's fields individually so you can update one field without deserialising and reserialising the whole object. <em>HyperLogLog</em> for approximate counts — count unique visitors with fixed 12KB memory regardless of how many visitors there are."`
    },
    {
      type: "code",
      text: `// Redis data structures — beyond simple key-value

// Sorted Set — leaderboard
await client.zadd('leaderboard', 1500, 'user:alice');
await client.zadd('leaderboard', 2300, 'user:bob');
await client.zadd('leaderboard', 1800, 'user:carol');

const top10 = await client.zrevrange('leaderboard', 0, 9, 'WITHSCORES');
const rank  = await client.zrevrank('leaderboard', 'user:alice'); // 0-indexed rank

// Set — who's online right now
await client.sadd('online_users', userId);            // user comes online
await client.srem('online_users', userId);            // user goes offline
const onlineCount = await client.scard('online_users');
const isOnline    = await client.sismember('online_users', userId);

// Hash — user session (update one field without touching others)
await client.hset('session:' + sessionId, {
  userId: user._id.toString(),
  role:   user.role,
  ip:     req.ip,
  loginAt: Date.now()
});
const role   = await client.hget('session:' + sessionId, 'role'); // get one field
const session = await client.hgetall('session:' + sessionId);     // get all fields

// List — job queue (simple)
await client.rpush('email_queue', JSON.stringify(emailJob)); // add to tail
const job = await client.blpop('email_queue', 0);            // blocking pop from head

// HyperLogLog — count unique visitors (approximate, ~0.81% error, fixed 12KB)
await client.pfadd('unique_visitors:2024-03-10', userId);
const uniqueCount = await client.pfcount('unique_visitors:2024-03-10');`
      }
    },

    // ── CDN ──
    {
      speaker: "you",
      text: `"How does a CDN actually work? I know it makes things faster but I couldn't explain the mechanism."`
    },
    {
      speaker: "raj",
      text: `"A CDN — Content Delivery Network — is a globally distributed network of servers called <em>edge nodes</em> or <em>Points of Presence</em>. When a user requests a file, they're routed to the nearest edge node — based on DNS routing and latency measurements — not to your origin server. The first time a file is requested at an edge, the edge fetches it from your origin and caches it. Every subsequent request for that file from users near that edge is served instantly from cache. A user in Mumbai gets files from the Mumbai edge, not from your server in Ohio."`
    },
    {
      speaker: "you",
      text: `"What types of content can you put on a CDN?"`
    },
    {
      speaker: "raj",
      text: `"Traditionally static assets — images, videos, JS bundles, CSS, fonts. Anything that doesn't change per-user. But modern CDNs like Cloudflare and AWS CloudFront can also cache <em>API responses</em> with the right Cache-Control headers. Even dynamic HTML can be edge-cached if you set short TTLs. Some CDNs now run <em>edge functions</em> — small JavaScript functions that execute at the edge node itself, so even personalisation logic runs close to the user. The key header the CDN respects is <em>Cache-Control</em> — it tells the CDN how long to cache and whether to cache at all."`
    },
    {
      type: "code",
      text: `// Cache-Control headers — how you control CDN behaviour

// Cache aggressively — content-addressed files (hash in filename)
// /static/bundle.a3f9d2.js — filename changes when content changes
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
// max-age=31536000 = 1 year. immutable = don't even check for updates

// Cache with revalidation — content that changes occasionally
res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
// max-age=300 = serve from cache for 5 min
// stale-while-revalidate=60 = after 5 min, serve stale while fetching fresh in background

// Never cache — user-specific or real-time data
res.setHeader('Cache-Control', 'private, no-store');

// API response caching via CDN
app.get('/api/products', (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  // s-maxage = CDN cache duration (60s). max-age = browser cache duration
  res.json(products);
});

// Invalidating CDN cache when content changes
// AWS CloudFront — create an invalidation
const cf = new CloudFrontClient({});
await cf.send(new CreateInvalidationCommand({
  DistributionId: 'EDFDVBD6EXAMPLE',
  InvalidationBatch: {
    Paths: { Quantity: 1, Items: ['/api/products'] },
    CallerReference: Date.now().toString()
  }
}));`
      }
    },

    // ── Database scaling ──
    {
      speaker: "you",
      text: `"Our database is the bottleneck now. Every API call hits it. What are the options?"`
    },
    {
      speaker: "raj",
      text: `"Step through this in order — don't jump to sharding when an index would solve it. First: <em>indexes</em>. If your queries are slow, add indexes on the fields you filter and sort by. A missing index on a field you query frequently is the most common cause of slow databases. Second: <em>query optimisation</em> — use EXPLAIN to see what the DB is actually doing. Are you doing full table scans? Are you fetching columns you don't need? Third: <em>connection pooling</em> — don't open a new DB connection on every request. A pool of persistent connections is dramatically faster. Fourth: <em>read replicas</em> — add replica databases that stay in sync with the primary. Route all read queries to replicas, only writes go to primary. Most apps are 80-90% reads — this alone can multiply your capacity several times over."`
    },
    {
      speaker: "you",
      text: `"What if read replicas aren't enough?"`
    },
    {
      speaker: "raj",
      text: `"Then you look at <em>sharding</em> — splitting the data itself horizontally across multiple databases. You choose a <em>shard key</em> — usually userId or region — and partition rows based on it. Users A-M on shard 1, N-Z on shard 2. Each shard is a separate database. The application routes queries to the right shard based on the key. The downsides are real though — cross-shard queries become painful, transactions across shards are complex, and re-sharding as you grow requires careful planning. Most applications reach tens of millions of records before sharding becomes necessary. Exhaust all other options first."`
    },
    {
      type: "code",
      text: `// Step 1 — Add indexes (most impactful, easiest win)
// MongoDB
db.orders.createIndex({ userId: 1, createdAt: -1 }); // compound index
db.orders.createIndex({ status: 1 }, { partialFilter: { status: 'pending' } }); // partial

// MySQL
CREATE INDEX idx_orders_user_date ON orders (user_id, created_at DESC);

// Check if index is being used
db.orders.find({ userId: 'abc' }).explain('executionStats');
// Look for: COLLSCAN (bad) vs IXSCAN (good)

// Step 2 — Connection pooling (Mongoose does this by default)
mongoose.connect(process.env.DATABASE_URL, {
  maxPoolSize:     10,  // max 10 simultaneous connections
  minPoolSize:      2,  // keep at least 2 open
  socketTimeoutMS: 45000
});

// Step 3 — Read replicas (route reads away from primary)
// Mongoose — connect to replica set
mongoose.connect('mongodb://primary:27017,replica1:27017,replica2:27017/mydb?replicaSet=rs0');

// Route reads to secondary replicas
const users = await User.find({ active: true }).read('secondary');

// MySQL with separate read replica pool
const writePool = mysql.createPool({ host: 'primary-db',  ... });
const readPool  = mysql.createPool({ host: 'replica-db',  ... });

// Step 4 — Sharding concept
// Shard key: userId
// Shard 1: userId hash % 3 === 0
// Shard 2: userId hash % 3 === 1
// Shard 3: userId hash % 3 === 2
const getShardForUser = (userId) => {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  return parseInt(hash.slice(0, 8), 16) % NUM_SHARDS;
};
const db = shardConnections[getShardForUser(userId)];`
      }
    },

    // ── Message queues ──
    {
      speaker: "you",
      text: `"When should I use a message queue? I keep hearing about Bull and RabbitMQ but I'm not sure when they're actually needed."`
    },
    {
      speaker: "raj",
      text: `"Use a queue when you have work that's too slow to do synchronously in an HTTP request. Sending an email, resizing an image, generating a PDF, sending a push notification — none of these need to happen before you return a response to the user. Without a queue: user hits POST /checkout, your server synchronously sends confirmation email, charges card, updates inventory, generates invoice PDF — request takes 8 seconds or times out. With a queue: POST /checkout returns 201 in 50ms, you've queued background jobs for email, PDF, and inventory. Worker processes pick them up and handle them. User gets instant feedback and the work happens behind the scenes."`
    },
    {
      speaker: "you",
      text: `"What's the difference between Bull and RabbitMQ?"`
    },
    {
      speaker: "raj",
      text: `"<em>Bull</em> — now BullMQ — is a Node.js job queue backed by Redis. Simple to set up, great for a single-language stack, built-in dashboard, supports priorities, delays, retries, and concurrency. Use it when your producers and consumers are both Node apps. <em>RabbitMQ</em> is a dedicated message broker — a separate infrastructure service. It supports multiple protocols, complex routing, pub/sub patterns, and consumers in any language. Use it when you need multi-language consumers, complex routing rules, or guaranteed delivery with acknowledgements across distributed systems."`
    },
    {
      type: "code",
      text: `// BullMQ — Node job queue backed by Redis
const { Queue, Worker } = require('bullmq');
const connection = { host: 'localhost', port: 6379 };

// Producer — add jobs to queue
const emailQueue = new Queue('emails', { connection });

app.post('/checkout', asyncHandler(async (req, res) => {
  const order = await Order.create(req.body);

  // Queue background jobs — don't wait for them
  await emailQueue.add('confirmation', {
    to:      req.user.email,
    orderId: order._id,
  }, {
    attempts: 3,          // retry up to 3 times on failure
    backoff: { type: 'exponential', delay: 2000 }, // wait 2s, 4s, 8s between retries
    delay: 0              // start immediately
  });

  res.status(201).json({ orderId: order._id }); // returns instantly — job runs in background
}));

// Consumer — separate process or file
const emailWorker = new Worker('emails', async (job) => {
  if (job.name === 'confirmation') {
    await sendEmail({
      to:      job.data.to,
      subject: 'Order confirmed',
      body:    renderTemplate('confirmation', job.data)
    });
  }
}, {
  connection,
  concurrency: 5  // process up to 5 jobs simultaneously
});

emailWorker.on('failed', (job, err) => {
  logger.error('Email job failed', { jobId: job.id, error: err.message });
});

// Scheduled/delayed jobs
await emailQueue.add('reminder', data, { delay: 24 * 60 * 60 * 1000 }); // 24 hours later
await emailQueue.add('digest',   data, { repeat: { cron: '0 9 * * *' } }); // every day 9am`
      }
    },

    // ── Reverse proxy and Nginx ──
    {
      speaker: "you",
      text: `"What's Nginx actually doing in a production setup? Is it just routing traffic?"`
    },
    {
      speaker: "raj",
      text: `"Nginx does a lot more than routing. Think of it as the front door to your entire infrastructure. It handles <em>SSL termination</em> — HTTPS ends at Nginx, your Node app receives plain HTTP internally, no TLS overhead on every Node process. It does <em>static file serving</em> — images, JS bundles, CSS are served directly by Nginx without touching Node at all, and Nginx is far faster at this than Node. It <em>load balances</em> across your Node instances. It <em>rate limits</em> at the network level, before requests reach your app. It handles <em>gzip compression</em> of responses. And it provides <em>request buffering</em> — it absorbs slow client connections so your Node process isn't held open waiting for a slow mobile client to finish uploading."`
    },
    {
      type: "code",
      text: `# nginx.conf — production setup

# Rate limiting zone — defined at the top level
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
  listen 443 ssl http2;
  server_name api.myapp.com;

  # SSL termination — HTTPS ends here, Node gets plain HTTP
  ssl_certificate     /etc/letsencrypt/live/api.myapp.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.myapp.com/privkey.pem;
  ssl_protocols       TLSv1.2 TLSv1.3;

  # Security headers (in addition to helmet in Node)
  add_header Strict-Transport-Security "max-age=31536000" always;

  # Gzip compression — handled at network layer
  gzip on;
  gzip_types text/plain application/json application/javascript text/css;
  gzip_min_length 1024;

  # Serve static files directly — never hits Node
  location /static/ {
    root /var/www/myapp;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Proxy API requests to Node cluster
  location /api/ {
    limit_req zone=api burst=20 nodelay;  # rate limit: 10 req/s, burst of 20
    proxy_pass         http://api_servers;
    proxy_set_header   X-Forwarded-For $remote_addr;
    proxy_read_timeout 30s;
    proxy_connect_timeout 5s;
  }
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  return 301 https://$host$request_uri;
}`
      }
    },

    // ── WebSockets at scale ──
    {
      speaker: "you",
      text: `"We're adding real-time features. WebSockets with multiple servers — how does that work? If two users connected to different servers send messages to each other, how does that happen?"`
    },
    {
      speaker: "raj",
      text: `"This is the <em>cross-server WebSocket problem</em>. User A connects to Server 1. User B connects to Server 2. User A sends a message to User B. Server 1 has no idea where User B's socket is. The solution is a <em>pub/sub broker</em> — typically Redis. When User A sends a message, Server 1 publishes it to a Redis channel. All servers are subscribed to that channel. Server 2 receives the message from Redis and finds User B's socket connection. Socket.io has a Redis adapter that handles this for you automatically."`
    },
    {
      type: "code",
      text: `// Socket.io with Redis adapter — scales across servers
const { createServer } = require('http');
const { Server }       = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient }  = require('redis');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'https://myapp.com', credentials: true }
});

// Redis pub/sub — syncs events across all server instances
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));

// Now events are synced across all servers automatically
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;

  socket.join('user:' + userId); // join a room for this user

  socket.on('send_message', async ({ toUserId, content }) => {
    const message = await Message.create({ from: userId, to: toUserId, content });

    // This works even if toUserId is on a different server
    // Redis adapter broadcasts to all servers, the right one delivers it
    io.to('user:' + toUserId).emit('new_message', message);
  });
});`
      }
    },

    // ── Eventual consistency ──
    {
      speaker: "you",
      text: `"What's eventual consistency? I hear this term but I'm not confident explaining it."`
    },
    {
      speaker: "raj",
      text: `"<em>Strong consistency</em> means every read immediately sees the most recent write. You write a value, anyone who reads it instantly gets that new value. A single SQL database on one server is strongly consistent. <em>Eventual consistency</em> means after a write, the system will <em>eventually</em> propagate it everywhere — but for a short window, different nodes might return different values. MongoDB replica sets, DynamoDB, and most distributed databases use eventual consistency by default for performance reasons. The data will be the same on all nodes — eventually. The window might be milliseconds or seconds depending on network conditions."`
    },
    {
      speaker: "you",
      text: `"When is eventual consistency actually a problem?"`
    },
    {
      speaker: "raj",
      text: `"When the user updates something and immediately reads it back. They change their profile picture, the write goes to the primary, they refresh, the read goes to a replica that hasn't caught up yet — they see the old picture. That's a jarring experience. The fix for user-facing updates: <em>read your own writes</em> — route reads to the primary immediately after a write, or use a sticky session to always read from the same node. For things like a like count or view counter, being off by 1-2 for a few milliseconds is completely fine — use eventual consistency freely there."`
    },
    {
      type: "code",
      text: `// Strong consistency — single DB, every read is up to date
await User.findByIdAndUpdate(userId, { avatar: newUrl }); // primary write
const user = await User.findById(userId); // same server, sees new value immediately

// Eventual consistency — replica set, reads may lag behind writes
// Mongoose — force read from primary after a write (read-your-own-writes)
await User.findByIdAndUpdate(userId, { avatar: newUrl }); // write to primary
const user = await User.findById(userId).read('primary'); // force primary read

// Or use write concern + read preference together
await User.findByIdAndUpdate(userId, updates, {
  writeConcern: { w: 'majority' } // wait for majority of replicas to confirm
});

// For counters — eventual consistency is fine, use atomic increments
await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });
// Even if replica is 100ms behind, a like count being off briefly = acceptable

// The CAP theorem tradeoff in plain terms:
// In a distributed system, during a network partition, you choose:
// Consistency  → return error if can't guarantee latest data (banks)
// Availability → return possibly stale data rather than an error (social feeds)`
      }
    },

    // ── Graceful degradation ──
    {
      speaker: "raj",
      text: `"One more concept before we wrap — <em>graceful degradation</em>. When one part of your system is slow or down, the whole app shouldn't crash. Use <em>circuit breakers</em> — if calls to a downstream service fail too many times in a row, stop calling it and return a cached fallback or a default response. Use <em>timeouts</em> on every external call — if the payment service takes more than 5 seconds, fail fast and show an error rather than holding the connection open for 30 seconds. And design your UI to degrade — if recommendations fail to load, show the main content without them. Partial functionality is far better than a blank page."`
    },
    {
      speaker: "you",
      text: `"How do you implement a circuit breaker?"`
    },
    {
      speaker: "raj",
      text: `"You can use a library like <em>opossum</em>. It wraps your external calls and tracks failure rate. Three states: <em>Closed</em> — normal operation, requests pass through. <em>Open</em> — too many failures, requests immediately return a fallback without hitting the service. <em>Half-open</em> — after a timeout, let one test request through to see if the service recovered."`
    },
    {
      type: "code",
      text: `// Circuit breaker with opossum
const CircuitBreaker = require('opossum');

const fetchRecommendations = async (userId) => {
  return axios.get('https://recommendations-service/users/' + userId);
};

const breaker = new CircuitBreaker(fetchRecommendations, {
  timeout:              3000,  // fail if takes longer than 3s
  errorThresholdPercentage: 50,  // open circuit if >50% of requests fail
  resetTimeout:         30000,  // try again after 30s
});

breaker.fallback(() => ({ recommendations: [] })); // return empty array on failure

breaker.on('open',     () => logger.warn('Recommendations circuit OPEN'));
breaker.on('halfOpen', () => logger.info('Recommendations circuit testing...'));
breaker.on('close',    () => logger.info('Recommendations circuit CLOSED'));

app.get('/home', asyncHandler(async (req, res) => {
  const [feed, recommendations] = await Promise.allSettled([
    getFeed(req.user.userId),
    breaker.fire(req.user.userId)   // won't even try if circuit is open
  ]);

  res.json({
    feed:            feed.status === 'fulfilled' ? feed.value : [],
    recommendations: recommendations.status === 'fulfilled' ? recommendations.value : []
    // page still loads even if recommendations service is completely down
  });
}));`
      }
    },

    {
      type: "summary",
      points: [
        "Vertical scaling = bigger server, fast but has a ceiling. Horizontal scaling = more servers, no ceiling but app must be stateless.",
        "Stateless = no in-memory sessions, no local file storage, JWT auth. Any server can handle any request.",
        "Node cluster module = use all CPU cores on one machine. PM2 manages this automatically with -i max.",
        "Load balancer strategies: round-robin (equal servers), least-connections (variable request times), IP hash (sticky sessions).",
        "Health checks = load balancer pings /health. Check DB and Redis reachability, not just process liveness.",
        "Cache-aside pattern: try cache → miss → fetch DB → populate cache. Bust cache on write. Staggered TTLs prevent stampede.",
        "Redis data structures: Sorted Sets for leaderboards, Sets for presence, Hashes for sessions, Lists for queues.",
        "CDN = globally distributed edge nodes. Static assets served from nearest edge. Cache-Control headers control CDN behaviour.",
        "DB scaling order: indexes first → query optimisation → connection pooling → read replicas → sharding (last resort).",
        "Message queues = offload slow background work. BullMQ for Node/Redis. RabbitMQ for multi-language distributed systems.",
        "Nginx = SSL termination, static file serving, load balancing, rate limiting, gzip — in front of Node.",
        "WebSockets at scale = Redis pub/sub adapter. Events published to Redis, all servers subscribe and route to right socket.",
        "Strong consistency = every read sees latest write. Eventual = replicas lag briefly. Use read-from-primary after writes for user-facing data.",
        "Circuit breaker = Closed (normal) → Open (failing, use fallback) → Half-open (test recovery). Never block your whole app for one slow service.",
        "Graceful degradation = timeouts on all external calls, fallbacks for each service, partial content beats blank pages."
      ]
    }
  ]
};

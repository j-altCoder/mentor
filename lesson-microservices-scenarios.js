// ─────────────────────────────────────────────────────────────────
//  LESSON: Microservices Scenarios
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_MICROSERVICES_SCENARIOS = {
  category: "Architecture & System Design",
  tag: "Microservices",
  title: "When the Monolith Stops Being Enough",
  intro: "You've always shipped one app. One repo, one deploy, one database. It works. Then you join a team with six repos, six deploy pipelines, and a Slack channel called #incidents. Raj is drawing boxes on a whiteboard.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"So microservices are just... splitting your app into smaller apps, right? Each one handles a different feature."`
    },
    {
      speaker: "raj",
      text: `"That's the shape. Not the reason. What problem does splitting solve?"`
    },
    {
      speaker: "you",
      text: `"Easier to understand each piece? Less code in one place?"`
    },
    {
      speaker: "raj",
      text: `"If that were the reason, every app would split at a hundred lines. The real problem is <em>organisational</em>. When three teams share one codebase, they're blocked by each other constantly — merge conflicts, one team's broken deploy takes down everyone else, you need sign-offs from two other teams to change a button. Microservices let each team own their domain end to end and ship without coordinating with anyone else. <em>Independent deployability</em> is the goal. Everything else is a consequence of that."`
    },

    // ── Should I split? ──
    {
      speaker: "you",
      text: `"So should I split my app into microservices now? It's getting pretty big."`
    },
    {
      speaker: "raj",
      text: `"How many teams?"`
    },
    {
      speaker: "you",
      text: `"Just me and two others."`
    },
    {
      speaker: "raj",
      text: `"Then no. A monolith is almost always the right answer for a single team. Three engineers sharing one codebase don't block each other — they talk. The costs of microservices are real: N deployment pipelines, N health checks, N monitoring setups, network calls instead of function calls, no distributed transactions. You pay all of that before you see any benefit. The question isn't 'is our codebase big?' — it's 'are multiple teams shipping slower because they're stepping on each other?' If yes, split. If not, you're adding complexity to solve a problem you don't have."`
    },
    {
      type: "analogy",
      text: "A monolith is one restaurant kitchen. One team, everything in one space, fast to coordinate. Microservices splits it into specialist kitchens — pastry, grill, prep. Each kitchen runs independently, no more fighting over space. But now you need a routing system for orders between kitchens, a way for them to communicate when one needs something from another, and a plan for when the dessert kitchen goes dark on a Saturday night. The coordination problem is solved. You've created an operational problem in its place."
    },
    {
      type: "code",
      text: `// ── When to stay on the monolith ──
// Single team, shared codebase, one deploy
// Function calls instead of network hops
// One database transaction for everything
// One place to add a log line and trace a bug

// ── Signs you might actually need to split ──
// Different parts of your app need to scale independently
//   → Checkout gets 10x traffic at Black Friday, user profiles don't
// Teams are blocking each other's deploys
//   → Team A can't ship because Team B has a broken test on main
// A single failure takes down unrelated features
//   → Notification Service crashes → entire app goes down
// Regulatory isolation required
//   → Payment processing must be PCI-isolated from everything else

// ── What you're agreeing to ──
// Monolith:        1 pipeline, 1 deploy, 1 DB, function calls, 1 transaction
// Microservices:   N pipelines, N deploys, N DBs, network calls, no shared transactions
// Never split to make code "smaller" — split when team coordination is the bottleneck`
    },

    // ── Where to draw the boundary ──
    {
      speaker: "you",
      text: `"Okay, say the team grows and we decide to split. How do we know where to cut? I'd probably split by feature — Orders, Users, Products."`
    },
    {
      speaker: "raj",
      text: `"That's where most people start, and it's where most distributed monoliths come from. Tell me about your Order Service — what does it need to process an order?"`
    },
    {
      speaker: "you",
      text: `"The user's shipping address from User Service, the product name and price from Product Service, then it calls Payment Service to charge."`
    },
    {
      speaker: "raj",
      text: `"So Order Service can't do anything without calling three other services first. User Service is slow — orders are slow. User Service is deploying — orders are broken. You've turned function calls into network dependencies and called it independence. That's a <em>distributed monolith</em>. The boundary test: could this service do its core job if every other service was unreachable for an hour? If no, the boundary is wrong."`
    },
    {
      speaker: "you",
      text: `"But it genuinely needs the shipping address and the product price. I can't make that up."`
    },
    {
      speaker: "raj",
      text: `"You don't make it up — you <em>snapshot it at the time the order is created</em>. The shipping address when the user placed the order, the product price at that moment. Copy it into the order record. From that point, Order Service owns that data. It never calls User Service or Product Service at runtime. If a user changes their address tomorrow, it doesn't affect yesterday's order. That's not a bug — that's correct historical behaviour. Each service stores its own narrow slice of shared concepts. 'User' in Order Service is just userId and a shipping address. 'User' in Auth Service is email and a password hash. Same word, completely different models, and that's intentional."`
    },
    {
      type: "code",
      text: `// ✗ Distributed monolith — runtime call chain
const placeOrder = async (userId, items) => {
  const user    = await fetch(\`http://user-service/users/\${userId}\`);     // network
  const products = await Promise.all(items.map(i =>
    fetch(\`http://product-service/products/\${i.productId}\`)               // network
  ));
  const payment = await fetch('http://payment-service/charge', { ... });  // network
  // User Service slow → orders slow
  // Product Service deploying → orders broken
  // Three points of failure before a single order row is written
};

// ✓ Snapshot at creation — Order Service owns its data
const placeOrder = async (userId, cartItems) => {
  // 1. Charge synchronously — must succeed before confirming
  const payment = await chargeCard({ userId, amount: cartItems.total });

  // 2. Snapshot everything needed — no runtime dependency after this
  const order = await db.orders.create({
    userId,
    // Shipping address copied from what the user submitted in this request
    shippingAddress: cartItems.shippingAddress,
    items: cartItems.items.map(i => ({
      productId: i.productId,
      name:      i.name,       // snapshotted — historical accuracy
      price:     i.price,      // the price they saw when they added to cart
      qty:       i.qty,
    })),
    total:   cartItems.total,
    status: 'confirmed',
  });

  return order;
  // User Service can be down. Product Service can be deploying.
  // This order is complete and self-contained.
};

// ── Each service owns a narrow slice of shared concepts ──
// "User" in Order Service:    { userId, shippingAddress }
// "User" in Auth Service:     { userId, email, passwordHash }
// "User" in Billing Service:  { userId, billingAddress, savedCards }
// Same word. Different model. Different database. Never shared.`
    },

    // ── Database per service ──
    {
      speaker: "you",
      text: `"Different databases per service — I've heard that, but it feels extreme. Can't they just use separate tables in the same database?"`
    },
    {
      speaker: "raj",
      text: `"Shared database, shared schema — that's the coupling you were trying to escape. The Order team adds a column to the users table because it's convenient. The Auth team's query breaks because the index changed. You can't deploy Order Service independently anymore because the migration has to coordinate with Auth Service. The database is what makes services dependent on each other, not the code. <em>Database-per-service</em> isn't about having separate machines — it's about enforcing that the only way to access another service's data is through its API. The database is private implementation detail."`
    },
    {
      speaker: "you",
      text: `"What if Order Service genuinely needs to query user data for a report? JOIN across two databases isn't possible."`
    },
    {
      speaker: "raj",
      text: `"Right — and that's the trade you're making. You lose the JOIN. In exchange you get true independence. The way you handle cross-service queries is either <em>API composition</em> — fetch from both services in your application layer and combine — or <em>data replication</em>, where Order Service subscribes to user change events and keeps a local read copy of the fields it needs. The JOIN becomes a query on your own data. The trade-off on replication is eventual consistency — your copy might be thirty seconds stale. For a report, that's almost always fine."`
    },
    {
      type: "code",
      text: `// ── Database-per-service: the rule ──
// order-service   → its own MongoDB:   orders, order-items
// auth-service    → its own PostgreSQL: users, sessions, tokens
// product-service → its own MongoDB:   catalogue, pricing
// payment-service → its own PostgreSQL: charges, refunds  (PCI scope isolated here)
//
// No service touches another service's database directly. Ever.
// The only access is through the service's own API or event stream.

// ── When you need cross-service data: API composition ──
// BFF (Backend for Frontend) or an aggregation layer fetches from both:
const getOrderWithUserDetails = async (orderId, userId) => {
  const [order, user] = await Promise.all([
    fetch(\`http://order-service/orders/\${orderId}\`).then(r => r.json()),
    fetch(\`http://user-service/users/\${userId}\`).then(r => r.json()),
  ]);
  return { ...order, customerName: user.name, customerEmail: user.email };
};

// ── When you need frequent reads: data replication ──
// Order Service subscribes to user change events, stores what it needs locally
messageQueue.subscribe('user.updated', async (event) => {
  await db.userCache.upsert(
    { userId: event.userId },
    { name: event.name, email: event.email, cachedAt: new Date() }
  );
});

// Now Order Service reads from its own store — no network call to User Service
const order = await db.orders.findOne({ orderId });
const user  = await db.userCache.findOne({ userId: order.userId });
// User Service can be down. Order Service doesn't care.
// Trade-off: user.name might be 30 seconds stale. For most reads, acceptable.`
    },

    // ── Sync vs async communication ──
    {
      speaker: "you",
      text: `"When services do need to talk to each other — I'd just call their APIs directly, like I would any external service. POST to their endpoint, get a response."`
    },
    {
      speaker: "raj",
      text: `"That works. It's called <em>synchronous communication</em> and it's right for some things. But think about what happens when an order is confirmed. You need to send a confirmation email, decrement stock, update analytics. Are you calling all three services before you return 200 to the user?"`
    },
    {
      speaker: "you",
      text: `"I guess I would, yeah."`
    },
    {
      speaker: "raj",
      text: `"So if your email provider is having an outage, the user's order fails to confirm? The email is a side effect — the user doesn't need to wait for it. The rule: use <em>synchronous</em> communication when the caller genuinely needs the answer to continue. Payment must succeed before you confirm — synchronous. Everything else that happens as a consequence of an order being placed: <em>publish an event and return</em>. Each consumer processes it at its own pace. Notification Service down for ten minutes — it catches up when it recovers. Order Service never knew there was a problem."`
    },
    {
      speaker: "you",
      text: `"So what's actually doing the routing? Some kind of central message broker?"`
    },
    {
      speaker: "raj",
      text: `"A <em>message queue</em> — RabbitMQ, SQS, Kafka depending on your scale. Order Service publishes an event with what happened. Notification Service, Inventory Service, Analytics — each independently subscribe to that event and process it. They don't know about each other. Order Service doesn't know they exist. You can add a new consumer without touching Order Service at all. That's the loose coupling you actually wanted."`
    },
    {
      type: "code",
      text: `// ── Synchronous: caller needs the answer to continue ──
app.post('/orders', asyncHandler(async (req, res) => {

  // Payment MUST succeed before we confirm — synchronous, wait for response
  const payment = await fetch('http://payment-service/charge', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-trace-id': req.traceId },
    body:    JSON.stringify({ userId: req.userId, amount: req.body.total }),
    signal:  AbortSignal.timeout(8000),  // always set a timeout
  });
  if (!payment.ok) return res.status(402).json({ error: 'Payment declined' });

  const order = await db.orders.create({ ...req.body, status: 'confirmed' });

  // ── Async: publish and return — don't wait for any of these ──
  await messageQueue.publish('order.confirmed', {
    orderId:   order._id,
    userId:    order.userId,
    items:     order.items,
    total:     order.total,
    userEmail: req.body.email,  // included so consumers don't need to fetch it
    confirmedAt: new Date(),
  });

  res.json({ orderId: order._id, status: 'confirmed' });
  // 200 is back to the user. Email not sent yet. Stock not decremented yet.
  // Both will happen. Order Service is done.
}));

// ── Each consumer is independent ──
// Notification Service
messageQueue.subscribe('order.confirmed', async (event) => {
  await email.send({ to: event.userEmail, template: 'order-confirmed', data: event });
});

// Inventory Service
messageQueue.subscribe('order.confirmed', async (event) => {
  for (const item of event.items) {
    await db.inventory.decrement(item.productId, item.qty);
  }
});

// Analytics Service
messageQueue.subscribe('order.confirmed', async (event) => {
  await analytics.track('order_placed', { orderId: event.orderId, total: event.total });
});

// Email provider goes down for 10 minutes:
// → Only Notification Service is affected
// → Orders still confirm, stock still decrements, analytics still records
// → Notification Service retries when it recovers
// → Order Service never knew`
    },

    // ── Cascading failure ──
    {
      speaker: "you",
      text: `"For the synchronous calls — what happens when Payment Service starts responding slowly? Like 8 seconds instead of 200ms?"`
    },
    {
      speaker: "raj",
      text: `"Every order request now holds a connection open for 8 seconds. Your connection pool fills up. New requests queue. Order Service stops responding to everything — even requests that have nothing to do with payments. One slow dependency takes down an unrelated service. That's called <em>cascading failure</em>. A timeout helps — fail in 5 seconds not 8, at least you fail faster. But the requests still pile up during those 5 seconds. A <em>circuit breaker</em> goes further."`
    },
    {
      speaker: "you",
      text: `"What does a circuit breaker actually do?"`
    },
    {
      speaker: "raj",
      text: `"It watches the failure rate on calls to Payment Service. When enough calls are failing — say 50% over a rolling window — it <em>opens</em>. Open circuit: subsequent calls fail immediately in milliseconds, no network touch at all. After a timeout it <em>half-opens</em> and lets one test call through. That call succeeds — the circuit closes and traffic resumes. It fails — circuit opens again. Your Order Service can now catch a payment failure in milliseconds and show the user a useful message, instead of silently holding their connection for 8 seconds before timing out."`
    },
    {
      type: "code",
      text: `const CircuitBreaker = require('opossum');

// The function that makes the network call
const chargeCard = async ({ orderId, amount, idempotencyKey }) => {
  const res = await fetch('http://payment-service/charge', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'Idempotency-Key': idempotencyKey,       // safe to retry — server deduplicates
      'x-trace-id':      getTraceId(),
    },
    body:   JSON.stringify({ orderId, amount }),
    signal: AbortSignal.timeout(5000),          // hard timeout — never wait more than 5s
  });
  if (!res.ok) throw Object.assign(new Error('charge failed'), { status: res.status });
  return res.json();
};

// Wrap it in a circuit breaker
const paymentBreaker = new CircuitBreaker(chargeCard, {
  timeout:                  5000,  // counts as failure if it takes longer than 5s
  errorThresholdPercentage: 50,    // open after 50%+ failure rate in the window
  resetTimeout:             15000, // try again after 15s
  volumeThreshold:          5,     // need at least 5 calls before tripping
});

paymentBreaker.fallback(() => {
  throw new Error('Payment service temporarily unavailable');
});

// Circuit state events — log and alert on these
paymentBreaker.on('open',     () => logger.warn('payment circuit OPEN'));
paymentBreaker.on('halfOpen', () => logger.info('payment circuit HALF-OPEN — testing'));
paymentBreaker.on('close',    () => logger.info('payment circuit CLOSED — recovered'));

// ── Idempotency keys — safe retries ──
// Without idempotency key: retry on timeout = double charge
// With idempotency key: server sees duplicate key = returns original result, no double charge
const charge = (orderId, amount) =>
  paymentBreaker.fire({
    orderId,
    amount,
    idempotencyKey: \`order-\${orderId\}\`,  // deterministic per order — same key on retry
  });

// ── The rule on retries ──
// GET requests:              always safe to retry
// POST with idempotency key: safe — server deduplicates
// POST without key:          NEVER retry — you may double-charge, double-create`
    },

    // ── Auth across services ──
    {
      speaker: "you",
      text: `"Auth is something I haven't thought through. In my monolith I just check req.user in a middleware. How does that work when requests are hitting multiple services?"`
    },
    {
      speaker: "raj",
      text: `"In a monolith, auth middleware runs once and req.user is in memory for the rest of the request. In microservices, each service is a separate process. You have two options. Every service validates the token itself, or one thing validates it once and the rest trust that result. What are the problems with option one?"`
    },
    {
      speaker: "you",
      text: `"Every service needs the JWT secret. And every service has to implement validation — that's a lot of duplicated middleware."`
    },
    {
      speaker: "raj",
      text: `"And if Order Service has the JWT secret, it can also <em>create</em> tokens. Every service you give the secret to is a service that can forge any user's identity. You want one place that does auth, and everything else trusts the result. That's an <em>API Gateway</em>. The gateway sits in front of all your services. It validates the JWT, strips it out, and injects simple headers — x-user-id, x-user-roles. Your internal services read those headers and trust them. They never see the original token. They never need the secret."`
    },
    {
      speaker: "you",
      text: `"What stops someone from just sending a fake x-user-id header directly to Order Service, bypassing the gateway?"`
    },
    {
      speaker: "raj",
      text: `"Network isolation. Internal services aren't reachable from the outside — they're on a private network, behind the gateway. Only the gateway is public. You can add service-to-service authentication on top: each service call carries a <em>shared API key</em> that only the gateway and internal services know. If Order Service sees a request without a valid service key, it rejects it regardless of whatever user headers are present."`
    },
    {
      type: "code",
      text: `// ── The auth flow in microservices ──
//
//  Client
//    │
//    ├── POST /auth/login ─────────────► Auth Service
//    │   { email, password }                  │ validate credentials
//    │◄── { accessToken } ────────────────────┘  (JWT signed with RS256 private key)
//    │
//    ├── GET /api/orders ──────────────► API Gateway
//    │   Authorization: Bearer <token>        │ jwt.verify(token, PUBLIC_KEY)
//    │                                        │ strips Authorization header
//    │                                        │ injects: x-user-id, x-user-roles
//    │                                        │ injects: x-service-key (internal secret)
//    │                                   Order Service
//    │                                        │ reads x-user-id — trusted
//    │                                        │ checks x-service-key — rejects if missing
//    │◄── { orders } ─────────────────────────┘

// ── API Gateway (Express example — or use Kong, AWS API Gateway, Traefik) ──
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });

    // Strip original token, inject trusted identity headers
    delete req.headers.authorization;
    req.headers['x-user-id']      = decoded.userId;
    req.headers['x-user-roles']   = decoded.roles.join(',');
    req.headers['x-service-key']  = process.env.INTERNAL_SERVICE_KEY;

    // Forward to the appropriate service
    proxyRequest(req, res, getServiceUrl(req.path));
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ── Order Service — reads trusted headers, never sees the JWT ──
app.use((req, res, next) => {
  // Reject any request not coming through the gateway
  if (req.headers['x-service-key'] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId    = req.headers['x-user-id'];
  req.userRoles = req.headers['x-user-roles']?.split(',') ?? [];
  next();
});

// ── Why RS256, not HS256 ──
// HS256: one shared secret — any service holding it can also FORGE tokens
// RS256: Auth Service signs with PRIVATE key (secret, kept only in Auth Service)
//        Gateway verifies with PUBLIC key (safe to distribute anywhere)
//        A compromised Order Service cannot forge an admin token`
    },

    // ── JWT across services deep-dive ──
    {
      speaker: "you",
      text: `"In my monolith I just store userId in the token. Are there other things I should be putting in it for microservices?"`
    },
    {
      speaker: "raj",
      text: `"A few things that become important once you have multiple services. <em>roles</em> — so services can authorise without calling back to Auth Service. <em>jti</em> — a unique token ID so you can revoke a specific token by blacklisting it in Redis. <em>iss</em> — the issuer, so services can reject tokens that weren't issued by your Auth Service. And keep it small. The token goes in every request header — every field you add is transmitted on every single call across your entire system."`
    },
    {
      speaker: "you",
      text: `"I was going to put the user's full profile in there so services don't have to look it up."`
    },
    {
      speaker: "raj",
      text: `"Don't. JWTs are base64 encoded, not encrypted — anyone with the token can read the payload. No PII, no sensitive fields. And there's a subtlety: once a JWT is issued, it's valid until it expires. If you put the user's role in the token and then change their role, the old token still claims the old role. Either keep access tokens short-lived — 15 minutes — so the window is small, or for critical role changes immediately blacklist the token by its jti."`
    },
    {
      type: "code",
      text: `// ── What to put in a JWT for microservices ──
const token = jwt.sign(
  {
    // Identity
    sub:    user._id.toString(),     // subject — standard JWT claim
    userId: user._id.toString(),     // explicit alias for readability

    // Authorization — so services can check without calling Auth Service
    roles:  user.roles,              // ['customer'] or ['admin', 'support']

    // Revocation
    jti: uuidv4(),                   // unique token ID — blacklist this to revoke

    // Issuer validation
    iss: 'https://auth.myapp.com',   // services reject tokens from unknown issuers

    // Standard timing claims (jwt.sign handles iat automatically)
    exp: Math.floor(Date.now() / 1000) + 15 * 60,  // 15 minutes
  },
  PRIVATE_KEY,
  { algorithm: 'RS256' }
);

// ── What NOT to put in the token ──
// ✗ email, name, phone    — PII, readable by anyone with the token
// ✗ passwordHash          — obvious
// ✗ full user object      — token bloat, gets transmitted on every request
// ✗ permissions list      — use roles + authorise per-service, or keep it lean

// ── Role change: the stale token problem ──
// User is downgraded from admin → customer
// Their existing JWT still says roles: ['admin'] for up to 15 minutes
//
// Option 1: accept the 15-minute window (usually fine)
// Option 2: blacklist the token immediately
app.post('/admin/users/:id/downgrade', adminOnly, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { roles: ['customer'] });

  // Invalidate active tokens for this user
  const activeSessions = await Session.find({ userId: req.params.id });
  for (const session of activeSessions) {
    const ttl = session.expiresAt - Math.floor(Date.now() / 1000);
    if (ttl > 0) await redis.setex(\`blacklist:\${session.jti\}\`, ttl, '1');
  }
  res.json({ message: 'User downgraded and sessions invalidated' });
});

// ── Auth middleware in each internal service ──
const authMiddleware = (req, res, next) => {
  // Trust the gateway — read injected headers, not the raw token
  req.userId    = req.headers['x-user-id'];
  req.userRoles = req.headers['x-user-roles']?.split(',') ?? [];

  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  const hasRole = roles.some(r => req.userRoles.includes(r));
  if (!hasRole) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// Usage
app.delete('/orders/:id', authMiddleware, requireRole('admin', 'support'), handler);`
    },

    // ── Data ownership ──
    {
      speaker: "you",
      text: `"One thing I keep running into mentally — who owns what data? If a user deletes their account, Order Service has their userId and shipping address. Product Service has their reviews. Who is responsible for cleaning that up?"`
    },
    {
      speaker: "raj",
      text: `"This is one of the hardest parts of microservices and most people don't think about it until a GDPR request lands. The answer is events. Auth Service publishes a <em>user.deleted</em> event. Every service that holds data belonging to that user subscribes and handles the cleanup in its own way. Order Service might anonymise rather than delete — 'Customer [deleted]' — because you need order history for accounting. Review Service deletes the reviews entirely. Analytics anonymises the user ID. Each service decides what 'delete' means in its own domain. Auth Service fires the event and forgets it. The responsibility is distributed."`
    },
    {
      speaker: "you",
      text: `"What if a service is down when the event fires? The data never gets cleaned up."`
    },
    {
      speaker: "raj",
      text: `"That's why you use a durable message queue — not HTTP webhooks. The queue holds the message until the consumer is up and has processed it. Most queues guarantee <em>at-least-once delivery</em>: if the consumer crashes mid-processing, the message is redelivered. So your handlers need to be idempotent — running them twice has the same result as running them once. 'Delete where userId = X' is idempotent. Deleting works the second time even if the first run already did it."`
    },
    {
      type: "code",
      text: `// ── Data ownership across services ──
//
// Auth Service owns:      email, passwordHash, sessions
// Order Service owns:     orders, line items, shipping addresses
// Product Service owns:   catalogue, prices, inventory counts
// Review Service owns:    product reviews, ratings
// Analytics Service owns: event stream, aggregations
//
// The rule: only the owning service writes to its data.
// Every other service accesses it via API or event subscription.

// ── User deletion via event ──

// Auth Service — publishes the event, owns nothing else
app.delete('/users/:id', authMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await Session.deleteMany({ userId: req.params.id });

  // Publish — each service decides what deletion means in its domain
  await messageQueue.publish('user.deleted', {
    userId:    req.params.id,
    deletedAt: new Date().toISOString(),
    reason:    'user_requested',
  });

  res.json({ message: 'Account deleted' });
});

// Order Service — anonymises (can't delete orders, needed for accounting)
messageQueue.subscribe('user.deleted', async (event) => {
  await db.orders.updateMany(
    { userId: event.userId },
    {
      $set: {
        userId:          'deleted-user',
        shippingAddress: '[deleted]',
        customerEmail:   '[deleted]',
      }
    }
  );
  // Idempotent: running twice sets the same values — no harm
});

// Review Service — hard delete
messageQueue.subscribe('user.deleted', async (event) => {
  await db.reviews.deleteMany({ userId: event.userId });
  // Idempotent: deleteMany on already-deleted records is a no-op
});

// ── At-least-once delivery — why handlers must be idempotent ──
// Queue guarantees: message will be delivered at least once
// It does NOT guarantee: exactly once
//
// What happens without idempotency:
//   consumer processes message, crashes before acknowledging
//   queue redelivers → handler runs again → double-delete, double-email, double-charge
//
// Pattern: use a processed-events table
messageQueue.subscribe('user.deleted', async (event) => {
  const alreadyProcessed = await db.processedEvents.findOne({ eventId: event.id });
  if (alreadyProcessed) return;  // idempotency check

  await db.reviews.deleteMany({ userId: event.userId });
  await db.processedEvents.create({ eventId: event.id, processedAt: new Date() });
});`
    },

    // ── Service talking to service ──
    {
      speaker: "you",
      text: `"When Order Service calls Payment Service directly — no user involved, just server-to-server — how does Payment Service know the call is legitimate? There's no user JWT."`
    },
    {
      speaker: "raj",
      text: `"Service-to-service authentication. The simplest approach that works for most teams: a <em>shared API key</em> between the two services, passed in a header, rotatable via environment variables. Payment Service checks the header on every internal call — if it's missing or wrong, it rejects the request regardless of anything else. More robust: <em>mTLS</em> — mutual TLS where both sides present certificates. A service mesh like Istio provisions and rotates the certificates automatically. Your application code doesn't change at all — the mesh handles it at the infrastructure layer. Most teams start with API keys and move to mTLS when the security requirements demand it."`
    },
    {
      type: "code",
      text: `// ── Option 1: Shared API key (pragmatic starting point) ──

// Order Service calling Payment Service
const chargeCard = async (payload) => {
  return fetch('http://payment-service/charge', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-service-api-key': process.env.PAYMENT_SERVICE_KEY,  // rotatable via env var
      'x-trace-id':        getTraceId(),
    },
    body: JSON.stringify(payload),
  });
};

// Payment Service — validate every incoming call
app.use((req, res, next) => {
  const key = req.headers['x-service-api-key'];
  if (key !== process.env.EXPECTED_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// ── Option 2: mTLS via Istio service mesh ──
// Your application code: unchanged
// Istio sidecar intercepts all traffic between services
//
// kubectl apply -f:
// apiVersion: security.istio.io/v1beta1
// kind: PeerAuthentication
// metadata: { name: default, namespace: production }
// spec:
//   mtls: { mode: STRICT }   ← reject any plaintext — mTLS only
//
// apiVersion: security.istio.io/v1beta1
// kind: AuthorizationPolicy
// metadata: { name: payment-service-policy }
// spec:
//   selector: { matchLabels: { app: payment-service } }
//   rules:
//   - from:
//     - source:
//         principals: ["cluster.local/ns/production/sa/order-service"]
// Only order-service's service account can call payment-service
// Everything else is rejected at the network layer — no app code involved

// ── Tracing across services — the one thing you must do ──
// Assign a trace ID at the entry point, pass it on every outgoing call
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  res.setHeader('x-trace-id', req.traceId);
  next();
});

// Every outgoing call carries it
await fetch('http://payment-service/charge', {
  headers: { 'x-trace-id': req.traceId, ... },
});

// Every log line includes it
logger.info({ traceId: req.traceId, event: 'order.confirmed', orderId });

// One query across all services: show me everything with traceId X
// You see the full timeline — which service was slow, where it failed`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Go back to where you started. 'Microservices are just smaller apps, split by feature.' What's wrong with that now?"`
    },
    {
      speaker: "you",
      text: `"The shape isn't the point. If every service still calls every other service at runtime, you haven't bought anything — you've just added network hops to a monolith. The independence comes from the boundaries: each service owns its data, snapshots what it needs, communicates through events where it can and synchronously only when it must."`
    },
    {
      speaker: "raj",
      text: `"And the reason to split is teams, not code size. Get that backwards and you'll pay the full operational cost of microservices without any of the benefit."`
    },

    {
      type: "summary",
      points: [
        "Microservices solve an organisational problem: multiple teams blocked by a single shared codebase. Independent deployability is the goal. A single team is almost always better served by a monolith — the operational cost of microservices is real and you should only pay it when team coordination is the actual bottleneck.",
        "The boundary test: could this service do its core job if every other service was unreachable for an hour? If no, the boundary is wrong. Services that need to call three others to handle a single request are a distributed monolith — all the costs, none of the independence.",
        "Services snapshot the data they need at creation time rather than fetching it at runtime. Order Service stores the shipping address and product price at the moment the order is placed. Historical accuracy and runtime independence are the same solution.",
        "Database-per-service is non-negotiable. Shared database means shared schema — the coupling you were trying to escape. The database is private implementation detail. The only way to access another service's data is through its API or event stream.",
        "Three communication patterns. Synchronous REST when the caller genuinely needs the answer to continue — payment must succeed before order confirms. Async messaging when work is a side-effect and the user doesn't wait — emails, stock decrements, analytics. Data replication when a service needs frequent reads from another domain — subscribe to change events, maintain a local copy, eliminate the runtime dependency. Each pattern has a cost: sync = tight coupling, async = eventual consistency, replication = data duplication.",
        "Cascading failure: one slow service holds connections open, the caller's connection pool fills, unrelated features stop working. Always set timeouts on outgoing calls. Circuit breakers watch the failure rate and short-circuit calls when a dependency is unhealthy — fail in milliseconds instead of waiting for a timeout. Use idempotency keys on mutations so retries are safe.",
        "API Gateway validates user JWTs once for all services. It strips the token and injects trusted headers — x-user-id, x-user-roles. Internal services read those headers. They never see the original token and never need the JWT secret. Use RS256 so Auth Service is the only thing that can forge tokens — services get the public key which can only verify.",
        "Keep JWTs small: userId, roles, jti, iss. No PII — tokens are base64 encoded, not encrypted. jti enables revocation via Redis blacklist. Roles go stale when they change — keep access tokens short-lived (15 minutes) or blacklist immediately on critical role changes.",
        "Data ownership: each service decides what operations on its own data mean. User deletion is an event — Auth Service publishes user.deleted, every other service handles cleanup in its own way. Queues guarantee at-least-once delivery so handlers must be idempotent — use a processed-events table to deduplicate.",
        "Service-to-service auth: shared API key in a header for simple setups, mTLS via a service mesh (Istio/Linkerd) for production. Trace IDs are non-negotiable — one ID at the entry point, passed in every outgoing header, logged on every meaningful line. Without them, debugging a failed request across six services is archaeology."
      ]
    }
  ]
};

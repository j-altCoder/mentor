// ─────────────────────────────────────────────────────────────────
//  LESSON: Microservices
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_MICROSERVICES = {
  category: "Architecture & System Design",
  tag: "Microservices",
  title: "You Cut the Monolith. Now What?",
  intro: "The tech lead has just announced it: the monolith is being broken up. Six services, three teams, Q3 deadline. There's a slide with boxes and arrows. Raj walks past your desk, glances at the slide on your screen, and pulls up a chair. 'They've given you the diagram,' he says. 'Nobody's told you what you're actually signing up for.'",
  scenes: [

    // ── Monolith vs microservices — the honest tradeoff ──
    {
      speaker: "raj",
      text: `"Before the architecture — what problem are microservices actually solving? Not the sales pitch. The real answer."`
    },
    {
      speaker: "you",
      text: `"You can deploy services independently? Scale them separately?"`
    },
    {
      speaker: "raj",
      text: `"Those are the benefits. The problem they're solving is organisational, not technical. A monolith gets painful when multiple teams are stepping on each other — merge conflicts every day, one team's bad deploy takes down everyone, you need six approvals to ship a CSS change. Microservices let teams own their domain end to end and ship without coordinating with everyone else. That's the core value. Independent deployability follows from team autonomy, not the other way around. If you have three engineers on one team, a monolith is almost certainly the right answer. The complexity of microservices is real cost — you pay it whether or not you have the team size to justify it."`
    },
    {
      type: "analogy",
      text: "A monolith is a restaurant kitchen where everyone works together — one team, one space, one deployment. Fast to start, easy to coordinate, but as it grows, the pastry chef and the grill cook start fighting for space. Microservices is splitting into separate speciality kitchens — each owns their domain, deploys their own menu, scales their own capacity. But now you need a maitre d' routing orders, a way for kitchens to communicate, and a full disaster plan for when the dessert kitchen goes dark mid-service. The food is the same. The operational complexity is not."
    },
    {
      speaker: "raj",
      text: `"What do you actually gain with independent deployability?"`
    },
    {
      speaker: "you",
      text: `"Each service can be deployed without touching the others — faster releases, smaller blast radius."`
    },
    {
      speaker: "raj",
      text: `"Right. And what do you lose that you had for free in the monolith?"`
    },
    {
      speaker: "you",
      text: `"A function call becomes a network call? Transactions get harder?"`
    },
    {
      speaker: "raj",
      text: `"List it properly. In a monolith: function calls are in-process — microseconds, never fail due to network, share a transaction. Cross-cutting concerns — auth, logging, validation — live in one place. You deploy everything at once so versions are always consistent. When you split: every service call is a network hop that can time out, fail, or return stale data. You have no distributed transaction — two services updating their own databases is not atomic. You need service discovery, a way to find where each service lives. You need an API gateway or some routing layer. Every service needs its own logging, auth, deployment pipeline. You've traded one hard problem — coordinating one large codebase — for six harder problems distributed across six codebases. Eyes open."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// MONOLITH vs MICROSERVICES — THE TRADEOFF MAP
// ─────────────────────────────────────────────────────

// MONOLITH — you get these for free:
// ✓ In-process function calls (microseconds, never fail)
// ✓ ACID transactions across the whole domain
// ✓ Single deploy — versions always consistent
// ✓ Easy refactoring across domain boundaries
// ✓ One auth system, one logging setup, one CI pipeline
// ✓ Simple local development (one server to run)
//
// MICROSERVICES — you get these:
// ✓ Independent deployability per service
// ✓ Independent scaling (scale Order service, not Auth)
// ✓ Team ownership — one team, one service, one repo
// ✓ Technology choice per service (if genuinely needed)
// ✓ Fault isolation — one service crashes, others survive
//
// MICROSERVICES — you pay these costs:
// ✗ Every cross-service call: network latency + failure modes
// ✗ No distributed transactions — eventual consistency instead
// ✗ Service discovery, API gateway, load balancing per service
// ✗ Distributed tracing to follow a request across services
// ✗ N deployment pipelines instead of 1
// ✗ Data duplication — each service owns its own DB
// ✗ Integration testing is harder — need services running together
// ✗ Local development: run 6 services or mock 5 of them

// RULE OF THUMB:
// Start with a monolith. Extract a service when:
//   1. A specific part needs to scale differently
//   2. A team boundary has hardened around it
//   3. It has a genuinely different operational profile
// Never split speculatively. The future is always different
// from what you predicted.`
    },

    // ── Service boundaries — how to cut ──
    {
      speaker: "raj",
      text: `"On the slide — they've drawn six boxes. User Service, Auth Service, Order Service, Payment Service, Notification Service, Product Service. How do you know if these are the right cuts?"`
    },
    {
      speaker: "you",
      text: `"Each one is a different domain?"`
    },
    {
      speaker: "raj",
      text: `"Domain is a starting point, not a rule. The right cut is where the boundary is <em>stable</em> and where coupling across the line is <em>minimal</em>. If Order Service needs to read User data on every request, you've created a service that can't function without its neighbour. That's a distributed monolith — you get all the costs of microservices and none of the independence. The test: could this service operate and be deployed if every other service was offline for an hour? If the answer is no, reconsider the cut. Auth and Payment are typically good candidates — clear ownership, infrequent data relationships, genuinely different scaling and security profiles. 'User Service' is almost always wrong — user data is referenced by everything, so you've just created a bottleneck with a network hop."`
    },
    {
      speaker: "you",
      text: `"What's a distributed monolith?"`
    },
    {
      speaker: "raj",
      text: `"When you split a monolith into services but they're still tightly coupled — they share a database, or they call each other synchronously in a chain so deep that a single request touches six services before it returns. You've kept all the coordination costs of a monolith and added all the network costs of microservices. The worst of both worlds. The giveaway is: 'we can't deploy Service A without deploying Service B first.' That's not independent deployability — that's a monolith with extra steps and worse debugging."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SERVICE BOUNDARIES — GOOD CUTS vs BAD CUTS
// ─────────────────────────────────────────────────────

// ✗ BAD: Services share a database
// Order Service and User Service both read/write the same DB
// → Schema changes in one break the other
// → No independent deployability, no data ownership
// → This is a monolith with a network hop added

// ✗ BAD: Deep synchronous call chains
// Client → API Gateway → Order Service → User Service
//                     → Inventory Service → Product Service
//                     → Payment Service  → Fraud Service
// → One service slow = entire request slow
// → One service down = entire request fails
// → Latency compounds: 50ms × 6 hops = 300ms minimum

// ✓ GOOD: Each service owns its data
// Order Service:    orders DB (orders, order_items, order_status)
// Payment Service:  payments DB (transactions, refunds)
// Product Service:  products DB (catalogue, inventory)
// Each service's DB is private — only reachable via that service's API

// ✓ GOOD: Async for non-critical cross-service work
// Order placed → emit OrderCreated event to message queue
//   → Notification Service consumes → sends email (async, own pace)
//   → Analytics Service consumes   → updates dashboard (async)
//   → Inventory Service consumes   → decrements stock (async)
// Order Service doesn't wait for any of these — it returned 200 already

// ✓ GOOD: Services can operate in degraded mode
// Order Service places order even if Recommendation Service is down
// Notification Service queues emails if SMTP is slow
// "Can this service do its core job if neighbour X is unreachable?"
// If yes → good boundary. If no → reconsider the coupling.

// ── Domain-Driven Design vocabulary ──
// Bounded Context: the boundary within which a domain model is consistent
// Each microservice should map to one Bounded Context
// "User" inside Order Service = orderId + shippingAddress (what Order cares about)
// "User" inside Auth Service  = email + passwordHash + sessions
// Same word, different models — that's intentional, not a bug`
    },

    // ── Communication patterns ──
    {
      speaker: "raj",
      text: `"Service A needs data from Service B. What are your options and when do you use each?"`
    },
    {
      speaker: "you",
      text: `"REST API call, or a message queue for async?"`
    },
    {
      speaker: "raj",
      text: `"Three patterns. Synchronous request-response — REST or gRPC. Use it when the caller needs the answer before it can continue: a payment must succeed before you confirm an order. Synchronous is simple but it creates coupling — your service's availability is now tied to your dependency's. Asynchronous messaging — put an event on a queue, return immediately, consumer processes in its own time. Use it when the work doesn't need to complete in the same transaction: sending a confirmation email, updating a search index, logging analytics. The caller doesn't wait, failure is isolated. Third: data replication — a service subscribes to events from another service and maintains its own read-only copy of the data it needs. Eliminates the runtime dependency entirely. Order Service stores the product name and price at the time of order — it doesn't call Product Service on every order lookup. The tradeoff is eventual consistency and data duplication, which is often the right tradeoff."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// COMMUNICATION PATTERNS
// ─────────────────────────────────────────────────────

// ── Pattern 1: Synchronous REST/gRPC ──
// Use when: caller needs the answer to proceed
// Risk: tight coupling, cascading failures

// Order Service calling Payment Service
const confirmPayment = async (orderId, amount) => {
  try {
    const response = await fetch('http://payment-service/charge', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId, amount }),
      signal:  AbortSignal.timeout(5000), // ALWAYS set a timeout
    });
    if (!response.ok) throw new Error(\`Payment failed: \${response.status}\`);
    return response.json();
  } catch (err) {
    // Payment Service down → Order cannot complete
    // This is the cost of synchronous coupling
    throw new ServiceUnavailableError('payment-service', err);
  }
};

// ── Pattern 2: Async messaging (event-driven) ──
// Use when: work can happen out-of-band
// Benefit: caller returns immediately, consumer retries independently

// Order Service publishes event and returns 200 — does not wait
const placeOrder = async (orderData) => {
  const order = await db.orders.create({ ...orderData, status: 'confirmed' });

  // Fire and forget — these consumers operate independently
  await messageQueue.publish('order.placed', {
    orderId:   order.id,
    userId:    order.userId,
    items:     order.items,
    total:     order.total,
    placedAt:  order.createdAt,
  });

  return order; // returns 200 before email is sent, stock is updated, etc.
};

// Notification Service — independent consumer
messageQueue.subscribe('order.placed', async (event) => {
  await emailProvider.send({
    to:      await getUserEmail(event.userId),
    subject: 'Order confirmed',
    body:    renderOrderEmail(event),
  });
  // If this fails, queue retries it — Order Service is unaffected
});

// ── Pattern 3: Data replication (read model per service) ──
// Use when: service needs data from another domain but not in real time
// Benefit: zero runtime dependency on the source service

// Product Service publishes product data on change
messageQueue.publish('product.updated', {
  productId: '123',
  name:      'Wireless Headphones',
  price:     79.99,
});

// Order Service maintains its own read model of products it cares about
messageQueue.subscribe('product.updated', async (event) => {
  await db.productCache.upsert(
    { productId: event.productId },
    { name: event.name, price: event.price, updatedAt: new Date() }
  );
});

// When placing order — reads from local cache, no network call
const product = await db.productCache.findOne({ productId });
// Stale by seconds/minutes — acceptable for most use cases`
    },

    // ── Failure handling across services ──
    {
      speaker: "raj",
      text: `"Payment Service is slow. Response time has gone from 80ms to 8 seconds. Your Order Service is calling it synchronously. What happens to Order Service?"`
    },
    {
      speaker: "you",
      text: `"Requests start backing up? Thread pool exhausts?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. Your Order Service has a connection pool — say, 100 threads handling requests. Each one is now blocked for 8 seconds waiting for Payment Service. New orders keep arriving. At 100 concurrent orders you run out of threads. Order Service starts refusing connections — not because Order Service has a bug, but because its dependency is slow. This is cascading failure. The slowness of one service has taken down a completely separate service. The fix is a circuit breaker."`
    },
    {
      speaker: "you",
      text: `"How does a circuit breaker work?"`
    },
    {
      speaker: "raj",
      text: `"Three states: closed, open, half-open. Closed is normal — requests go through. When failures exceed a threshold — say, 50% of calls failing in a 10-second window — the circuit opens. While open, calls to that dependency fail immediately without attempting the network call. Fast fail instead of slow fail — your threads don't pile up waiting. After a timeout, the circuit goes half-open and lets one test request through. If it succeeds, circuit closes. If it fails, circuit reopens. Your Order Service can now handle Payment Service being down: return a 503 immediately, or show a 'payment unavailable, try again' message — either is better than hanging for 8 seconds and taking down everything."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// RESILIENCE PATTERNS: Circuit Breaker, Retry, Timeout
// ─────────────────────────────────────────────────────

// ── Circuit Breaker (using opossum library) ──
const CircuitBreaker = require('opossum');

const paymentBreaker = new CircuitBreaker(callPaymentService, {
  timeout:             5000,   // fail if call takes > 5s
  errorThresholdPercentage: 50, // open circuit if 50%+ of calls fail
  resetTimeout:        10000,  // try again after 10s (half-open)
  volumeThreshold:     5,      // need at least 5 calls before tripping
});

// Fallback when circuit is open or call fails
paymentBreaker.fallback(() => ({
  success: false,
  reason:  'payment-service-unavailable',
}));

// Events for observability
paymentBreaker.on('open',     () => logger.error({ event: 'circuit_open',     service: 'payment' }));
paymentBreaker.on('halfOpen', () => logger.warn({  event: 'circuit_half_open',service: 'payment' }));
paymentBreaker.on('close',    () => logger.info({  event: 'circuit_closed',   service: 'payment' }));

// Usage — same interface as direct call
const result = await paymentBreaker.fire({ orderId, amount });
if (!result.success) {
  return res.status(503).json({ error: 'Payment temporarily unavailable. Please retry.' });
}

// ── Timeout — always set one ──
// Default: no timeout = thread waits forever
// With timeout: fail fast, return error, free the thread
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err.name === 'AbortError') throw new TimeoutError('payment-service timed out after 5s');
} finally {
  clearTimeout(timeout);
}

// ── Retry with exponential backoff — only for idempotent operations ──
// GET requests, reads: safe to retry
// POST /charge: NOT safe to retry without idempotency key
// (retrying a charge could double-bill the user)

const retry = async (fn, { attempts = 3, baseDelay = 200 } = {}) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts - 1) throw err;
      // Don't retry client errors (4xx) — they won't succeed
      if (err.status >= 400 && err.status < 500) throw err;
      await new Promise(r => setTimeout(r, baseDelay * 2 ** i)); // 200ms, 400ms, 800ms
    }
  }
};

// ── Idempotency key for safe retries on mutations ──
const chargeWithIdempotency = async (orderId, amount) => {
  const idempotencyKey = \`charge-\${orderId}\`; // deterministic per order

  return fetch('http://payment-service/charge', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Idempotency-Key': idempotencyKey, // server deduplicates on this
    },
    body: JSON.stringify({ orderId, amount }),
  });
  // Retrying with the same key → server returns cached result, no double charge
};`
    },

    // ── Service discovery and API gateway ──
    {
      speaker: "raj",
      text: `"Order Service needs to call Payment Service. Where is Payment Service? What's its IP? What if it has three instances?"`
    },
    {
      speaker: "you",
      text: `"Service discovery — something like Consul or Kubernetes DNS?"`
    },
    {
      speaker: "raj",
      text: `"In Kubernetes, every service gets a stable DNS name automatically — payment-service.default.svc.cluster.local. The cluster handles load balancing across instances. Your code just calls http://payment-service — DNS resolves it, kube-proxy routes it to a healthy pod. You never hardcode IPs. Outside Kubernetes you'd use something like Consul or AWS Cloud Map — services register themselves on startup, deregister on shutdown, and clients query the registry for current addresses. The other piece is an API gateway — the single entry point for all external traffic. It handles TLS termination, auth token validation, rate limiting, request routing to the right internal service. External clients talk to one URL; the gateway routes it internally. This means your services don't need to implement auth and rate limiting themselves — the gateway handles it once."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SERVICE DISCOVERY & API GATEWAY
// ─────────────────────────────────────────────────────

// ── In Kubernetes — DNS-based discovery (automatic) ──
//
// Service manifest: kubernetes defines a stable DNS name
// payment-service → resolves to cluster IP → kube-proxy → healthy pod
//
// In code: just use the service name
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL
  || 'http://payment-service'; // Kubernetes DNS, no hardcoded IPs

// ── API Gateway — single external entry point ──
// All external traffic → gateway → routes internally
//
// /api/orders/*   → order-service:3001
// /api/payments/* → payment-service:3002
// /api/products/* → product-service:3003
//
// Gateway responsibilities:
//   - TLS termination (HTTPS → HTTP internally)
//   - Auth token validation (JWT verification once, not in every service)
//   - Rate limiting per client
//   - Request logging / distributed trace ID injection
//   - Circuit breaking for downstream services
//
// Example: AWS API Gateway, Kong, Nginx, Traefik, or custom Express gateway

// ── Health checks — essential for service discovery ──
// Kubernetes uses these to know which pods should receive traffic

// Liveness: is the process alive? (restart if failing)
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

// Readiness: is the service ready to serve traffic?
// (remove from load balancer if failing — e.g., DB connection not ready)
app.get('/health/ready', async (req, res) => {
  try {
    await db.ping();                        // can we reach the DB?
    await messageQueue.ping();              // can we reach the queue?
    res.json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', reason: err.message });
    // Kubernetes stops sending traffic until this returns 200
  }
});

// Kubernetes deployment manifest excerpt:
// livenessProbe:
//   httpGet: { path: /health/live, port: 3000 }
//   initialDelaySeconds: 10
//   periodSeconds: 10
// readinessProbe:
//   httpGet: { path: /health/ready, port: 3000 }
//   initialDelaySeconds: 5
//   periodSeconds: 5`
    },

    // ── Observability across services ──
    {
      speaker: "raj",
      text: `"A user calls support: 'my order failed at 2:14pm.' You have six services. Where do you even start?"`
    },
    {
      speaker: "you",
      text: `"Check logs across the services for that time?"`
    },
    {
      speaker: "raj",
      text: `"Six services, six log streams, looking for what? A request in a microservices system is a chain — API gateway to Order Service to Payment Service to Fraud Service. Each service logs its piece, but those logs have no shared context unless you put it there. You need a trace ID: a single identifier generated at the entry point that travels with the request through every service hop. Every log line emits it. Now 'find all logs for request X' is one query across all services. This is distributed tracing. Every production microservices system needs it. Honeycomb, Jaeger, Zipkin, AWS X-Ray — they all visualise the full request timeline as a waterfall: where did the 1.2 seconds go? Which service was slow? Where did it fail? Without distributed tracing, debugging a microservices system is archaeology."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// DISTRIBUTED TRACING — trace ID across every service
// ─────────────────────────────────────────────────────

// ── Middleware: generate or propagate trace ID ──
const { v4: uuidv4 } = require('uuid');

app.use((req, res, next) => {
  // Accept trace ID from upstream (API gateway / calling service)
  // or generate a new one at the entry point
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  res.setHeader('x-trace-id', req.traceId);

  // Make it available on the logger for this request
  req.log = logger.child({ traceId: req.traceId });
  next();
});

// ── Log with trace ID on every operation ──
app.post('/orders', asyncHandler(async (req, res) => {
  req.log.info({ event: 'order.create.start', userId: req.body.userId });

  const order = await db.orders.create(req.body);
  req.log.info({ event: 'order.create.db_saved', orderId: order.id });

  // CRITICAL: pass trace ID to every downstream call
  const payment = await fetch('http://payment-service/charge', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-trace-id':   req.traceId,   // ← trace ID travels with the request
    },
    body: JSON.stringify({ orderId: order.id, amount: order.total }),
  });

  req.log.info({ event: 'order.create.payment_done', orderId: order.id, paymentStatus: payment.status });
  res.json(order);
}));

// Every log line now has the same traceId →
// One query finds the complete picture across all services:
// { traceId: "abc-123", event: "order.create.start",   service: "order-service",   ms: 0    }
// { traceId: "abc-123", event: "charge.start",         service: "payment-service", ms: 45   }
// { traceId: "abc-123", event: "fraud.check.start",    service: "fraud-service",   ms: 48   }
// { traceId: "abc-123", event: "fraud.check.complete", service: "fraud-service",   ms: 890  } ← slow
// { traceId: "abc-123", event: "charge.complete",      service: "payment-service", ms: 950  }
// { traceId: "abc-123", event: "order.create.done",    service: "order-service",   ms: 1010 }

// ── OpenTelemetry — the standard instrumentation layer ──
const { NodeSDK }         = require('@opentelemetry/sdk-node');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

const sdk = new NodeSDK({
  traceExporter:   new OTLPTraceExporter({ url: 'http://jaeger:4318/v1/traces' }),
  instrumentations: [
    new HttpInstrumentation(),    // auto-instruments fetch/http
    new ExpressInstrumentation(), // auto-instruments Express routes
  ],
});
sdk.start();
// After this: every HTTP call automatically propagates trace context
// No manual header passing needed`
    },

    // ── Data consistency without transactions ──
    {
      speaker: "raj",
      text: `"Last hard problem. User clicks 'Place Order'. You need to: create the order in Order Service, charge the card in Payment Service, and decrement stock in Inventory Service. In a monolith that's one transaction — all or nothing. In microservices, how do you keep it consistent?"`
    },
    {
      speaker: "you",
      text: `"Two-phase commit? A distributed transaction?"`
    },
    {
      speaker: "raj",
      text: `"Two-phase commit works but it's slow, it requires all participants to be available and it creates a tight coupling that defeats the purpose of independent services. The approach that actually works in practice is the Saga pattern. A saga is a sequence of local transactions — each service does its piece and publishes an event. If a step fails, compensating transactions undo the previous steps. Choreography-based: each service listens for events and knows what to do next. Orchestration-based: a central saga orchestrator tells each service what to do in sequence. Choreography is simpler to start but harder to reason about as complexity grows. Orchestration makes the flow explicit and easier to monitor."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SAGA PATTERN — consistency without distributed transactions
// ─────────────────────────────────────────────────────

// ── Orchestration-based Saga ──
// A central OrderSaga orchestrates the sequence and handles failures

class OrderSaga {
  async execute(orderData) {
    let orderId, paymentId;

    try {
      // Step 1: Create order (pending status)
      const order = await orderService.createOrder({ ...orderData, status: 'pending' });
      orderId = order.id;

      // Step 2: Reserve inventory
      await inventoryService.reserve({ orderId, items: orderData.items });

      // Step 3: Charge payment
      const payment = await paymentService.charge({
        orderId,
        amount:         orderData.total,
        idempotencyKey: \`order-\${orderId}-charge\`,
      });
      paymentId = payment.id;

      // Step 4: Confirm order
      await orderService.confirm(orderId);

      return { success: true, orderId };

    } catch (err) {
      // Compensating transactions — undo in reverse order
      logger.error({ event: 'saga.failed', orderId, err: err.message });

      if (paymentId) {
        // Payment was charged — must refund
        await paymentService.refund({ paymentId, reason: 'order-saga-failure' })
          .catch(e => logger.error({ event: 'saga.refund_failed', paymentId, err: e.message }));
      }

      if (orderId) {
        // Inventory was reserved — must release
        await inventoryService.release({ orderId })
          .catch(e => logger.error({ event: 'saga.release_failed', orderId, err: e.message }));

        // Mark order as failed
        await orderService.fail(orderId, err.message)
          .catch(e => logger.error({ event: 'saga.fail_status_failed', orderId }));
      }

      return { success: false, reason: err.message };
    }
  }
}

// ── Idempotency is critical for saga steps ──
// Steps may be retried after partial failure
// Each step must be safe to call twice with the same input

// Payment service: idempotency key deduplicates charge attempts
// Inventory service: reserve is idempotent per orderId
// Order service: createOrder with same data returns existing order

// ── Outbox pattern — guaranteed event delivery ──
// Problem: you save to DB and then publish an event
// If the process crashes between the two, event is lost

// ✗ Can lose the event if crash happens here ↓
await db.orders.save(order);
await messageQueue.publish('order.created', order); // crash here → event lost

// ✓ Outbox: write event to DB in same transaction as the data
// A separate process (outbox relay) polls and publishes atomically
await db.transaction(async (tx) => {
  await tx.orders.save(order);
  await tx.outbox.insert({            // same transaction
    topic:   'order.created',
    payload: JSON.stringify(order),
    status:  'pending',
  });
});
// Outbox relay: polls outbox table, publishes to queue, marks as sent
// If relay crashes and retries — idempotency key on event prevents duplicates`
    },

    {
      type: "summary",
      points: [
        "Microservices solve an organisational problem, not a technical one. They make sense when multiple teams need to ship independently without stepping on each other. For a single team, a monolith is almost always cheaper and simpler.",
        "The right boundary cut is where coupling across the line is minimal and the service could operate if its neighbours were offline. A service that calls another service on every request is a distributed monolith — all the costs, none of the independence.",
        "Three communication patterns: synchronous REST/gRPC when the caller needs the answer to proceed; async messaging when the work can happen out-of-band; data replication when a service needs read access to another domain's data without a runtime dependency.",
        "Synchronous dependencies create cascading failures. A slow downstream service exhausts your thread pool. Circuit breakers prevent this: open when failures exceed a threshold, fail fast, try again after a reset timeout. Always set request timeouts — no timeout means a thread waits forever.",
        "Service discovery in Kubernetes is automatic via DNS. Every service gets a stable name; the cluster handles routing to healthy instances. The API gateway is the single external entry point — it handles TLS, auth, rate limiting, and routing once, so services don't each implement it.",
        "Distributed tracing is non-negotiable. Generate a trace ID at the entry point and pass it through every service hop in every outgoing request header. Every log line emits it. Without this, debugging a request that touched six services is archaeology.",
        "Data consistency without transactions: the Saga pattern. Each service does its local transaction and publishes an event. If a step fails, compensating transactions undo previous steps in reverse order. Idempotency keys make steps safe to retry. The outbox pattern guarantees events are published even if the process crashes between DB write and queue publish.",
        "The operational costs are real and cumulative: N deployment pipelines, distributed tracing, service meshes, saga patterns, health checks, circuit breakers. None of these exist in a monolith. Count the cost before you cut."
      ]
    }
  ]
};

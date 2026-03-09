// ─────────────────────────────────────────────────────────────────
//  LESSON: Microservices
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_MICROSERVICES = {
  category: "Architecture & System Design",
  tag: "Microservices",
  title: "The Boxes on the Whiteboard Cost More Than You Think",
  intro: "There's a new whiteboard in the meeting room. Someone drew six boxes connected by arrows overnight. Order Service. Payment Service. User Service. Notification Service. Inventory Service. Auth Service. The VP of Engineering called it 'the target architecture.' Raj stares at it for a long moment, then turns to you. 'Tell me what you see.'",
  scenes: [

    // ── What problem is this actually solving ──
    {
      speaker: "you",
      text: `"Six services. Each one handles a different part of the system — we can deploy them independently, scale them separately."`
    },
    {
      speaker: "raj",
      text: `"That's what they do. I asked what problem they're solving."`
    },
    {
      speaker: "you",
      text: `"The monolith got too big? Hard to change?"`
    },
    {
      speaker: "raj",
      text: `"Closer. The real answer is organisational. The monolith gets painful when multiple teams are stepping on each other — merge conflicts every day, one team's broken deploy takes down everyone, you need six sign-offs to ship a button change. Microservices let teams own their domain end to end and ship without coordinating with every other team. That's the core value. Independent deployability is a consequence of team autonomy, not the other way around. The question isn't 'is our codebase big?' — it's 'are multiple teams blocked by sharing one thing?' If you have three engineers on one team, a monolith is almost certainly the right answer. These six boxes cost more to run than a monolith. You should be clear about what you're buying."`
    },
    {
      type: "analogy",
      text: "A monolith is one restaurant kitchen — one team, one space, everything coordinated. Fast to start, easy to debug, but as the kitchen grows, the pastry section and the grill section start fighting for space and blocking each other. Microservices splits into separate speciality kitchens. Each kitchen owns their menu, hires their own staff, runs their own service. But now you need someone routing orders between kitchens, a way for them to communicate when they depend on each other, and a plan for when the dessert kitchen goes dark at 8pm on a Saturday. You've solved the coordination problem. The operational complexity is a new problem you've created."
    },

    // ── What you lose: transactions ──
    {
      speaker: "raj",
      text: `"In the monolith — placing an order decrements inventory and charges the card. One database transaction. All or nothing. What happens to that in your six-box diagram?"`
    },
    {
      speaker: "you",
      text: `"Each of those is now a network call to a different service."`
    },
    {
      speaker: "raj",
      text: `"And network calls can do something function calls can't. What's that?"`
    },
    {
      speaker: "you",
      text: `"Fail. Time out."`
    },
    {
      speaker: "raj",
      text: `"Fail, time out, return stale data, take three seconds instead of three milliseconds. And your transaction — what happened to it?"`
    },
    {
      speaker: "you",
      text: `"There isn't one anymore. Each service has its own database."`
    },
    {
      speaker: "raj",
      text: `"Right. So you charge the card in Payment Service, then Inventory Service returns a 500. The charge went through. The stock didn't decrement. Those two databases are now inconsistent and there's no rollback. In the monolith that was one transaction. Here it's a distributed systems problem that people write PhD theses about. I'm not saying don't do it. I'm saying look at that whiteboard and understand what you're agreeing to before the VP leaves the room."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// WHAT YOU TRADE WHEN YOU LEAVE THE MONOLITH
// ─────────────────────────────────────────────────────

// ── Monolith: one transaction, all or nothing ──
const placeOrder = async (userId, items) => {
  return await db.transaction(async (tx) => {
    const order = await tx.orders.create({ userId, items });
    await tx.inventory.decrement(items);
    await tx.payments.charge(userId, order.total);
    return order;
    // any throw → everything rolls back. clean.
  });
};

// ── Microservices: no shared transaction ──
const placeOrder = async (userId, items) => {
  const order = await orderService.create({ userId, items });
  // order is committed. if next line fails, it stays committed.
  await inventoryService.decrement(items);
  // inventory decremented. if this fails, order + decrement are committed.
  await paymentService.charge(userId, order.total);
  return order;
};
// Inconsistency is now your problem to design around.

// ── What you gain ──
// ✓ Teams ship independently — no cross-team deploys
// ✓ Services scale independently — scale checkout, not the whole app
// ✓ Failure isolation — Payment down ≠ browsing down
// ✓ Each service can be rewritten, replaced, or retired in isolation

// ── What you pay ──
// ✗ Every cross-service call: latency + network failure modes
// ✗ No distributed transactions — manage consistency yourself
// ✗ N deployment pipelines, N health checks, N monitoring setups
// ✗ Distributed tracing to follow one request across N services
// ✗ Service discovery, API gateway, load balancing infrastructure
// ✗ Local development: run all N or mock N-1 of them`
    },

    // ── Distributed monolith and boundaries ──
    {
      speaker: "raj",
      text: `"Look at User Service on the board. Every other service has an arrow pointing to it. Order Service calls it for the shipping address. Notification Service for the email. Payment Service for billing info. What's wrong with that?"`
    },
    {
      speaker: "you",
      text: `"If User Service goes down, everything goes down?"`
    },
    {
      speaker: "raj",
      text: `"That's one problem. The deeper one: you haven't decoupled anything. You turned a function call into a network hop. Those services can't operate without each other — they're still tightly coupled. This is called a distributed monolith. You get all the costs of microservices and none of the independence. The giveaway: 'we can't deploy Order Service without deploying User Service first because of the API change.' That's not independent deployability. That's a monolith with worse debugging and slower deploys."`
    },
    {
      speaker: "you",
      text: `"So what's the right cut?"`
    },
    {
      speaker: "raj",
      text: `"The test: could this service do its core job if every other service was unreachable for an hour? If no, the boundary is wrong. User Service fails immediately — it's a shared dependency, not a standalone service. The fix isn't making it more reliable. It's stopping the live fetch. Order Service stores what it needs at order time: the shipping address, the product name and price. That data doesn't change retroactively. Each service should own a narrow slice of the concept — 'User' in Order Service is just userId and shippingAddress. 'User' in Auth Service is email and passwordHash. Same word. Different models. That's intentional."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SERVICE BOUNDARIES — good cuts vs distributed monolith
// ─────────────────────────────────────────────────────

// ✗ Distributed monolith — every request crosses service lines
// Client → Order Service → User Service     (shipping address)
//                        → Inventory Service (stock check)
//                        → Payment Service  → Fraud Service
// Six round trips. User Service slow → orders slow.
// User Service deploying → orders broken.

// ✓ Order Service stores what it needs locally at creation time
const order = {
  orderId:         'o-123',
  userId:          'u-456',
  shippingAddress: '12 Main St',   // snapshotted at order time
  items: [
    { productId: 'p-789', name: 'Headphones', price: 79.99, qty: 1 }
    // name + price copied from Product catalogue at creation
    // historical accuracy — the price was 79.99 when they bought it
  ],
  total: 79.99,
};
// User Service deploys at 2am: orders still work.
// Product Service is slow: order history still loads.
// The denormalisation is intentional. It's the trade.

// ── Each service owns its own slice of shared concepts ──
// "User" in Order Service:   { userId, shippingAddress }
// "User" in Auth Service:    { userId, email, passwordHash, sessions }
// "User" in Billing Service: { userId, billingAddress, savedCards }
//
// ── Database-per-service — no shared DB, ever ──
// order-service  → PostgreSQL  orders DB
// payment-service → PostgreSQL payments DB  (PCI scope isolated here)
// product-service → MongoDB    catalogue DB
// Each service's DB is private — only accessible via that service's API.
// Shared DB = shared schema = can't deploy independently`
    },

    // ── Sync vs async communication ──
    {
      speaker: "raj",
      text: `"Order placed. Confirmation email needs to go out, inventory needs to decrement, analytics need to record it. How does Order Service handle all of that?"`
    },
    {
      speaker: "you",
      text: `"Call each service's API in sequence?"`
    },
    {
      speaker: "raj",
      text: `"Then what happens when Notification Service is slow because the mail provider is having issues?"`
    },
    {
      speaker: "you",
      text: `"Orders slow down. But the user doesn't need to wait for the email — the order is confirmed already."`
    },
    {
      speaker: "raj",
      text: `"Exactly. You've coupled your order latency to your email system for no reason. The rule: synchronous when the caller needs the answer to continue. Async when you're notifying something else that something happened and the user doesn't need to wait for it. Payment must succeed before you confirm — that's synchronous. Sending email, decrementing stock, recording analytics — publish an event and return 200. Each consumer processes it at its own pace, retries independently on failure. Order Service never knew there was a problem."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SYNC vs ASYNC — when to use each
// ─────────────────────────────────────────────────────

app.post('/orders', asyncHandler(async (req, res) => {
  const order = await db.orders.create({ ...req.body, status: 'pending' });

  // ── SYNCHRONOUS — must succeed before we can continue ──
  const payment = await fetch('http://payment-service/charge', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-trace-id': req.traceId },
    body:    JSON.stringify({ orderId: order.id, amount: order.total }),
    signal:  AbortSignal.timeout(8000), // always set a timeout
  });
  if (!payment.ok) {
    await db.orders.updateStatus(order.id, 'payment_failed');
    return res.status(402).json({ error: 'Payment declined' });
  }
  await db.orders.updateStatus(order.id, 'confirmed');

  // ── ASYNC — publish and return. Don't wait for any of these. ──
  await messageQueue.publish('order.placed', {
    orderId: order.id, userId: order.userId,
    items: order.items, total: order.total,
    placedAt: new Date(),
  });
  res.json({ orderId: order.id, status: 'confirmed' });
  // The 200 is back to the client. Email not sent yet. Stock not decremented yet.
  // Both will happen. Order Service is done.
}));

// ── Consumers process independently ──
messageQueue.subscribe('order.placed', async (event) => {   // Notification
  await email.send({ to: event.userEmail, template: 'order-confirmed', data: event });
});
messageQueue.subscribe('order.placed', async (event) => {   // Inventory
  for (const item of event.items) await db.inventory.decrement(item.productId, item.qty);
});
messageQueue.subscribe('order.placed', async (event) => {   // Analytics
  await analytics.track('order_placed', { orderId: event.orderId, total: event.total });
});
// Notification provider down → only Notification Service retries, others unaffected
// Each consumer has its own retry policy, dead-letter queue, and failure handling`
    },

    // ── Data replication — third communication pattern ──
    {
      speaker: "raj",
      text: `"There's a third pattern you haven't mentioned. Order Service needs to display the product name and price on every order. Right now it calls Product Service on every read. What's wrong with that?"`
    },
    {
      speaker: "you",
      text: `"Product Service being slow or down affects order reads. And it's a round trip every time even though the data barely changes."`
    },
    {
      speaker: "raj",
      text: `"Right. The third pattern is data replication — Order Service subscribes to product events and maintains its own local copy of the product data it cares about. When Product Service updates a price, it publishes a product.updated event. Order Service consumes it and updates its local read cache. Now Order Service never calls Product Service at runtime — it reads from its own store. Zero runtime dependency. If Product Service is down for an hour, orders still display fine. The trade-off is eventual consistency — Order Service might show a price that's thirty seconds stale. For most use cases that's completely acceptable. For displaying prices at checkout you'd still call Product Service synchronously. Same data, different access pattern, different pattern choice."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// DATA REPLICATION — eliminate runtime dependency
// ─────────────────────────────────────────────────────

// ── Product Service publishes changes ──
// Whenever a product is created, updated, or deleted:
await messageQueue.publish('product.updated', {
  productId:   'p-789',
  name:        'Wireless Headphones',
  price:       79.99,
  currency:    'GBP',
  isAvailable: true,
  updatedAt:   new Date().toISOString(),
});

// ── Order Service maintains its own product read cache ──
// Subscribes to product events and keeps a local copy of what it needs
messageQueue.subscribe('product.updated', async (event) => {
  await db.productCache.upsert(
    { productId: event.productId },
    {
      name:        event.name,
      price:       event.price,
      isAvailable: event.isAvailable,
      cachedAt:    new Date(),
    }
  );
});

messageQueue.subscribe('product.deleted', async (event) => {
  await db.productCache.delete({ productId: event.productId });
});

// ── Order Service reads from local cache — no network call ──
app.post('/orders', asyncHandler(async (req, res) => {
  const items = await Promise.all(req.body.items.map(async item => {
    const product = await db.productCache.findOne({ productId: item.productId });
    if (!product) throw new Error(\`Product \${item.productId} not found\`);
    if (!product.isAvailable) throw new Error(\`\${product.name} is no longer available\`);
    return {
      productId: item.productId,
      name:      product.name,       // snapshotted from local cache
      price:     product.price,      // the price at time of order
      qty:       item.qty,
    };
  }));
  // No call to Product Service. Product Service could be down right now.
  // We don't care.
  const order = await db.orders.create({ ...req.body, items, status: 'pending' });
  res.json(order);
}));

// ── When to use each pattern ──
//
// SYNCHRONOUS (REST/gRPC):
//   Use when: caller needs the answer before it can continue
//   Example:  charge payment before confirming order
//   Cost:     tight coupling — your uptime depends on theirs
//
// ASYNC MESSAGING (events/queue):
//   Use when: work can happen out-of-band, caller doesn't wait
//   Example:  send confirmation email, decrement stock, log analytics
//   Cost:     eventual consistency — consumer may lag seconds behind
//
// DATA REPLICATION (local read model):
//   Use when: service needs frequent read access to another domain's data
//   Example:  Order Service reading product names and prices
//   Cost:     data duplication, stale reads (seconds to minutes lag),
//             more complex initial sync if service comes up from scratch
//
// A single service often uses all three patterns for different neighbours.`
    },

    // ── Service discovery and API gateway ──
    {
      speaker: "raj",
      text: `"Order Service needs to call Payment Service. Where is it? How does Order Service know the address — especially if Payment has three instances running?"`
    },
    {
      speaker: "you",
      text: `"Some kind of service registry? Or hardcode the hostname?"`
    },
    {
      speaker: "raj",
      text: `"Never hardcode IPs. In Kubernetes — which is where most microservices actually run — each service gets a stable DNS name automatically. Payment Service is reachable at http://payment-service. Kubernetes handles routing to whichever pod is healthy. Outside Kubernetes you'd use a service registry like Consul — services register on startup, deregister on shutdown, clients query for live addresses. The other piece is an API gateway: a single entry point for all external traffic. It handles TLS termination, request routing, auth token validation, and rate limiting once — so every internal service doesn't have to implement all of that independently."`
    },
    {
      speaker: "you",
      text: `"What about health checks? How does Kubernetes know which pods to route to?"`
    },
    {
      speaker: "raj",
      text: `"Two probes. Liveness: is the process alive? If it fails, Kubernetes restarts the pod. Readiness: is the service ready to take traffic? If it fails, Kubernetes removes the pod from the load balancer but doesn't restart it — useful during startup before the DB connection is ready, or during graceful shutdown after you've stopped accepting new requests. A service with a good readiness probe drains cleanly on deploy. Without it, pods get killed mid-request."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SERVICE DISCOVERY, API GATEWAY & HEALTH CHECKS
// ─────────────────────────────────────────────────────

// ── Kubernetes DNS — automatic service discovery ──
// No hardcoded IPs. Just use the service name.
const PAYMENT_URL   = process.env.PAYMENT_SERVICE_URL   || 'http://payment-service';
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service';

// ── API Gateway responsibilities ──
// External: https://api.myapp.com/orders → gateway
// Gateway:
//   1. Terminates TLS
//   2. Validates JWT (once, not in every service)
//   3. Rate limits per client IP / API key
//   4. Routes to correct internal service:
//      /orders/*   → http://order-service
//      /payments/* → http://payment-service
//      /products/* → http://product-service
//   5. Injects x-user-id header after token validation
//   6. Assigns x-trace-id if not present
// Tools: AWS API Gateway, Kong, Traefik, Nginx, custom Express

// ── Health checks — liveness vs readiness ──
// Liveness: is the process healthy enough to keep running?
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
  // Simple — if Express responds, process is alive
});

// Readiness: is the service ready to serve traffic right now?
app.get('/health/ready', async (req, res) => {
  try {
    await db.ping();                 // DB connection live?
    await redis.ping();              // Cache reachable?
    await messageQueue.ping();       // Queue reachable?
    res.json({ status: 'ready' });
  } catch (err) {
    // Returns 503 → Kubernetes removes pod from load balancer
    res.status(503).json({ status: 'not_ready', reason: err.message });
  }
});

// Kubernetes deployment (excerpt):
// livenessProbe:
//   httpGet: { path: /health/live, port: 3000 }
//   initialDelaySeconds: 15   ← give Node time to start
//   periodSeconds: 10
//   failureThreshold: 3       ← 3 fails → restart pod
//
// readinessProbe:
//   httpGet: { path: /health/ready, port: 3000 }
//   initialDelaySeconds: 5
//   periodSeconds: 5
//   failureThreshold: 2       ← 2 fails → remove from LB (don't restart)`
    },

    // ── Inter-service authentication ──
    {
      speaker: "raj",
      text: `"The API gateway validates the user's JWT before requests reach your services. But what stops Order Service from calling Payment Service directly — bypassing the gateway entirely and pretending to be anyone?"`
    },
    {
      speaker: "you",
      text: `"The services are on an internal network? Nobody outside can reach them?"`
    },
    {
      speaker: "raj",
      text: `"That's network-level isolation, which helps. But it doesn't handle service-to-service trust inside the cluster. If Order Service's pod is compromised, it can call Payment Service with any payload it wants. The standard answer is mTLS — mutual TLS. Both sides present certificates. Payment Service only accepts connections from pods holding a certificate signed by your internal CA. Kubernetes service meshes like Istio or Linkerd provision and rotate these certificates automatically, so your application code doesn't change at all — it runs in a sidecar. The simpler alternative that most teams start with: shared secret API keys between services, passed as a header, rotated regularly. Less rigorous but workable."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// INTER-SERVICE AUTHENTICATION
// ─────────────────────────────────────────────────────

// ── Option 1: Service API key (pragmatic starting point) ──
// Each service has a secret key. Passed in header on every internal call.
// Rotate via environment variables — no code changes.

// Order Service calling Payment Service:
const callPaymentService = async (payload) => {
  return fetch('http://payment-service/charge', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-service-api-key': process.env.PAYMENT_SERVICE_KEY, // rotatable secret
      'x-trace-id':        getTraceId(),
    },
    body: JSON.stringify(payload),
  });
};

// Payment Service validating the caller:
app.use('/charge', (req, res, next) => {
  const key = req.headers['x-service-api-key'];
  if (key !== process.env.EXPECTED_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// ── Option 2: mTLS via service mesh (production standard) ──
// Istio sidecar proxy intercepts all traffic — your app code is unchanged
// kubectl apply -f istio-config.yaml:
//
// apiVersion: security.istio.io/v1beta1
// kind: PeerAuthentication
// metadata: { name: default, namespace: production }
// spec:
//   mtls: { mode: STRICT }    ← reject any plaintext connection
//
// apiVersion: security.istio.io/v1beta1
// kind: AuthorizationPolicy
// metadata: { name: payment-service }
// spec:
//   selector: { matchLabels: { app: payment-service } }
//   rules:
//   - from:
//     - source: { principals: ["cluster.local/ns/production/sa/order-service"] }
//
// Only order-service's service account can call payment-service. Everything else
// is rejected at the network layer — no application code involved.

// ── What the gateway injects — trust chain ──
// API Gateway validates user JWT → strips it → injects:
// x-user-id:    "u-456"      (verified user, safe to trust inside cluster)
// x-user-roles: "customer"
// x-trace-id:   "abc-123"
// Internal services read x-user-id — they never re-validate the original JWT`
    },

    // ── API versioning and contracts ──
    {
      speaker: "raj",
      text: `"Order Service calls Payment Service at /charge with a payload shape. Six months later the Payment team needs to add a required field. How do you not break Order Service?"`
    },
    {
      speaker: "you",
      text: `"Version the API? /v2/charge?"`
    },
    {
      speaker: "raj",
      text: `"URL versioning is one approach. The more important principle is: never remove or rename a field in a response that another service depends on. Add fields freely — consumers ignore what they don't understand. Remove fields only after confirming no consumer reads them, which is a coordination problem. The practical pattern most teams use is consumer-driven contract testing: Order Service declares what it expects from Payment Service's API in a contract file — the fields it reads, the status codes it handles. Payment Service runs those contracts in its own CI pipeline. If a change would break a consumer's contract, CI fails before anyone deploys. You catch the break at code review time, not in production at 2am."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// API VERSIONING & CONTRACT TESTING
// ─────────────────────────────────────────────────────

// ── Additive changes — always safe ──
// v1 response:
{ chargeId: 'ch_123', status: 'succeeded' }

// v1 response after safe change (added field):
{ chargeId: 'ch_123', status: 'succeeded', processorRef: 'stripe_pi_abc' }
// Order Service ignores processorRef — it still works fine.

// ── Breaking changes — coordinate or version ──
// Rename: status → chargeStatus      BREAKING — Order Service reads status
// Remove: chargeId                   BREAKING — Order Service stores chargeId
// Change type: amount string→number  BREAKING — subtle, causes silent bugs
// Solution: URL versioning for breaking changes
//   /v1/charge — old contract, supported until consumers migrate
//   /v2/charge — new contract, consumers adopt when ready
// Run both versions in parallel. Deprecate v1 with a sunset header.

// ── Consumer-driven contract testing with Pact ──
// order-service/tests/payment.contract.test.js
const { Pact } = require('@pact-foundation/pact');

const provider = new Pact({ consumer: 'order-service', provider: 'payment-service' });

describe('Payment Service contract', () => {
  before(() => provider.setup());
  after(() => provider.finalize());

  it('charges a card', async () => {
    await provider.addInteraction({
      state: 'a valid card exists',
      uponReceiving: 'a charge request',
      withRequest: {
        method: 'POST', path: '/v1/charge',
        headers: { 'Content-Type': 'application/json' },
        body:    { orderId: '123', amount: 79.99 },
      },
      willRespondWith: {
        status: 200,
        body: {
          chargeId: Pact.term({ generate: 'ch_123', matcher: /^ch_/ }),
          status:   'succeeded',
        },
      },
    });
    const result = await chargeCard({ orderId: '123', amount: 79.99 });
    expect(result.status).toBe('succeeded');
  });
});
// This contract is published to a Pact Broker.
// Payment Service CI pulls all consumer contracts and verifies against them.
// If Payment removes 'chargeId', their CI fails — before any deploy.`
    },

    // ── Cascading failure and circuit breaker ──
    {
      speaker: "raj",
      text: `"Payment Service starts responding in eight seconds instead of 200ms. You haven't changed anything in Order Service. What happens to it?"`
    },
    {
      speaker: "you",
      text: `"Requests pile up waiting. Order Service runs out of threads and stops responding too."`
    },
    {
      speaker: "raj",
      text: `"Cascading failure. One slow dependency takes down an unrelated service. A timeout helps — fail in five seconds not eight. But requests still pile up for those five seconds. A circuit breaker goes further. It watches the failure rate — when enough calls are failing, it opens. Open circuit: calls fail immediately, milliseconds, no network touch. After a reset timeout it half-opens and lets one test call through. Succeeds — closes, traffic resumes. Fails — opens again. Order Service can now respond to payment failures gracefully: show a useful message, offer to retry, keep the rest of the app running. That's different from taking everything down silently."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CIRCUIT BREAKER + RETRY + TIMEOUT
// ─────────────────────────────────────────────────────
const CircuitBreaker = require('opossum');

const chargeCard = async ({ orderId, amount, idempotencyKey }) => {
  const res = await fetch('http://payment-service/v1/charge', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'Idempotency-Key':   idempotencyKey,   // server deduplicates — safe to retry
      'x-service-api-key': process.env.PAYMENT_SERVICE_KEY,
      'x-trace-id':        getTraceId(),
    },
    body:   JSON.stringify({ orderId, amount }),
    signal: AbortSignal.timeout(5000),       // never wait more than 5s
  });
  if (!res.ok) throw Object.assign(new Error('charge failed'), { status: res.status });
  return res.json();
};

const paymentBreaker = new CircuitBreaker(chargeCard, {
  timeout:                  5000,  // call counts as failure after 5s
  errorThresholdPercentage: 50,    // open after 50%+ failure rate
  resetTimeout:             15000, // half-open after 15s
  volumeThreshold:          5,     // need 5 calls before circuit can trip
});

paymentBreaker.fallback(() => {
  throw new ServiceUnavailableError('Payment temporarily unavailable');
});

paymentBreaker.on('open',     () => metrics.increment('circuit.open',     { service: 'payment' }));
paymentBreaker.on('halfOpen', () => metrics.increment('circuit.halfOpen', { service: 'payment' }));
paymentBreaker.on('close',    () => metrics.increment('circuit.close',    { service: 'payment' }));

// ── Retry — only for idempotent operations ──
// GET requests: always safe to retry
// POST /charge WITH idempotency key: safe — server deduplicates
// POST /charge WITHOUT idempotency key: NEVER retry — double charge

const withRetry = async (fn, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      if (err.status >= 400 && err.status < 500) throw err; // 4xx: don't retry
      await new Promise(r => setTimeout(r, 200 * 2 ** (attempt - 1))); // 200ms, 400ms, 800ms
    }
  }
};

// Combined: circuit breaker wraps retries
const charge = ({ orderId, amount }) =>
  paymentBreaker.fire({
    orderId, amount,
    idempotencyKey: \`charge-\${orderId\}\`, // deterministic per order
  });`
    },

    // ── Distributed tracing ──
    {
      speaker: "raj",
      text: `"User calls support. Order failed at 14:37, error ID A3F92. Six services. Where do you start?"`
    },
    {
      speaker: "you",
      text: `"Order Service logs, find the request, follow it to Payment Service, then wherever from there."`
    },
    {
      speaker: "raj",
      text: `"Log file one, two, three — matching by timestamp across six streams. Twenty minutes to trace a ten-second transaction. What you actually need is a trace ID — one identifier generated at the entry point, passed in every outgoing header, logged on every meaningful line in every service. Then one query: show me everything with traceId A3F92. The full timeline appears. You see which service was slow, where it failed, how long each hop took. OpenTelemetry is the standard instrumentation layer now — it auto-instruments HTTP calls, database queries, Express routes. You add the SDK and the spans are generated for you."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// DISTRIBUTED TRACING
// ─────────────────────────────────────────────────────
const { v4: uuidv4 } = require('uuid');

// ── Manual: trace ID middleware (minimum viable) ──
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  res.setHeader('x-trace-id', req.traceId);
  req.log = logger.child({ traceId: req.traceId, service: 'order-service' });
  next();
});

// Pass it on every outgoing call:
await fetch('http://payment-service/v1/charge', {
  headers: { 'x-trace-id': req.traceId },  // ← this is the whole mechanism
  ...
});

// ── What one traceId query reveals ──
// A3F92  order-service    order.received        t=0ms
// A3F92  order-service    db.orders.insert      t=12ms
// A3F92  payment-service  charge.start          t=15ms
// A3F92  fraud-service    check.start           t=18ms
// A3F92  fraud-service    check.complete        t=854ms  ← 836ms spent here
// A3F92  payment-service  charge.complete       t=870ms
// A3F92  order-service    order.confirmed       t=901ms
//
// Fraud Service was slow. That's your answer in one query, not twenty minutes.

// ── OpenTelemetry: auto-instrumentation (production standard) ──
// instrumentation.js — loaded before anything else: node -r ./instrumentation.js server.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');

new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'http://otel-collector:4318/v1/traces' }),
  instrumentations: [
    new HttpInstrumentation(),    // auto-traces all fetch/http calls
    new ExpressInstrumentation(), // auto-traces all Express routes
    new PgInstrumentation(),      // auto-traces all DB queries
  ],
}).start();
// Every service call, DB query, and route is now a span.
// Trace context propagates automatically in headers.
// View in Jaeger, Honeycomb, Datadog, or any OTLP-compatible backend.`
    },

    // ── Saga pattern and outbox ──
    {
      speaker: "raj",
      text: `"Payment goes through. Then Inventory Service fails. What do you do?"`
    },
    {
      speaker: "you",
      text: `"Retry. If it keeps failing — refund the payment, cancel the order."`
    },
    {
      speaker: "raj",
      text: `"You just described a saga. A sequence of local transactions across services, each with a compensating transaction that undoes it if something downstream fails. Two things make it reliable. First: every step must be idempotent — safe to run twice. The saga will retry, and if the first attempt half-succeeded, the second must produce the same result, not a double charge. Use idempotency keys. Second: the outbox pattern. If your process crashes after committing to the DB but before publishing the event to the queue, that event is lost silently. Write the event into the same DB transaction as your data. A background relay reads it and publishes. Now crash-safety is guaranteed by the DB, not by hoping the process stays up."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SAGA PATTERN + OUTBOX
// ─────────────────────────────────────────────────────

class PlaceOrderSaga {
  async run(orderData) {
    let orderId = null, paymentId = null;
    try {
      // Step 1: create order
      const order = await orderService.create({ ...orderData, status: 'pending' });
      orderId = order.id;

      // Step 2: charge (idempotency key = safe to retry on network error)
      const payment = await paymentService.charge({
        orderId, amount: orderData.total,
        idempotencyKey: \`charge-\${orderId\}\`,
      });
      paymentId = payment.id;

      // Step 3: decrement inventory (idempotent per orderId)
      await inventoryService.decrement({
        orderId, items: orderData.items,
        idempotencyKey: \`inventory-\${orderId\}\`,
      });

      await orderService.confirm(orderId);
      return { success: true, orderId };

    } catch (err) {
      logger.error({ event: 'saga.failed', orderId, err: err.message });

      // Compensating transactions — undo in reverse order
      if (paymentId) {
        await paymentService.refund({ paymentId, reason: 'saga_failure' })
          .catch(e => logger.error({ event: 'refund_failed', paymentId }));
        // If refund also fails → dead-letter queue → ops team resolves manually
      }
      if (orderId) {
        await orderService.cancel(orderId)
          .catch(e => logger.error({ event: 'cancel_failed', orderId }));
      }
      return { success: false, reason: err.message };
    }
  }
}

// ── Outbox pattern — guaranteed event delivery ──

// ✗ Crash between these two lines = silent data loss
await db.orders.save(order);
await messageQueue.publish('order.placed', order); // process dies → event lost

// ✓ Write event to DB in same transaction as the data
await db.transaction(async (tx) => {
  await tx.orders.save(order);
  await tx.outbox.insert({        // same atomic write
    id:      uuidv4(),
    topic:   'order.placed',
    payload: JSON.stringify(order),
    sentAt:  null,
  });
});

// Outbox relay — runs as a separate process (or same process, different loop)
const relay = async () => {
  const unsent = await db.outbox.findAll({ where: { sentAt: null }, limit: 100 });
  for (const row of unsent) {
    await messageQueue.publish(row.topic, JSON.parse(row.payload));
    await db.outbox.update({ sentAt: new Date() }, { where: { id: row.id } });
  }
};
setInterval(relay, 1000);
// On restart: picks up unsent rows and publishes again.
// Consumer uses row.id as idempotency key — processes each event exactly once.`
    },

    // ── Deployment patterns ──
    {
      speaker: "raj",
      text: `"You have a breaking change in Order Service. You need to deploy it without taking the service down. How?"`
    },
    {
      speaker: "you",
      text: `"Blue-green deployment? Spin up the new version alongside the old, then switch traffic over."`
    },
    {
      speaker: "raj",
      text: `"Blue-green is clean for a full cutover — you keep the old version running, switch the load balancer, and rollback is instant if something's wrong. But if you have a million users you don't want to switch all of them at once. That's where canary deployments come in. You route 5% of traffic to the new version, watch your error rate and latency, and gradually roll forward — 5%, 20%, 50%, 100%. If anything spikes you pull back to 0% with one config change. Kubernetes makes this straightforward with replica counts — 1 new pod out of 20 total is 5%. Feature flags give you even finer control: you can turn on the new code path for internal users first, then 1% of customers, then roll out by region."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// DEPLOYMENT PATTERNS
// ─────────────────────────────────────────────────────

// ── Blue-green deployment ──
// Two identical environments. Only one serves live traffic.
//
// Blue (live):  order-service v1.4  ← all traffic here
// Green (idle): order-service v1.5  ← deploy and test here
//
// 1. Deploy v1.5 to green, run smoke tests
// 2. Switch load balancer: all traffic → green
// 3. If bad: switch back → blue (instant rollback, blue is still running)
// 4. After confidence: decommission blue or make it staging

// ── Canary deployment (Kubernetes) ──
// 20 total replicas: gradually shift from v1 to v2
//
// deployment-v1.yaml: replicas: 20, image: order-service:1.4
// deployment-v2.yaml: replicas:  0, image: order-service:1.5
//
// Stage 1 (5%):  v1 replicas: 19, v2 replicas: 1
// Stage 2 (20%): v1 replicas: 16, v2 replicas: 4
// Stage 3 (50%): v1 replicas: 10, v2 replicas: 10
// Stage 4 (100%): v1 replicas: 0, v2 replicas: 20
// If error rate or p99 latency spikes at any stage → v2 replicas: 0 immediately

// ── Feature flags for safe code changes ──
const { unleash } = require('unleash-client');

app.post('/orders', asyncHandler(async (req, res) => {
  // New order processing logic — off by default, on for internal users first
  if (unleash.isEnabled('new-order-flow', { userId: req.userId })) {
    return newOrderFlow(req, res);
  }
  return legacyOrderFlow(req, res);
}));
// Rollout: internal → 1% → 10% → 100% — all without a deploy
// Kill switch: disable flag → 100% on legacy instantly

// ── Database migrations with zero downtime ──
// Never alter a column in one deploy. Use expand-contract pattern:
//
// Deploy 1: ADD new column (nullable, old code ignores it)
// Deploy 2: Write to BOTH old and new column (backward compatible)
// Deploy 3: Read from new column, write only to new column
// Deploy 4: DROP old column (no code reads it anymore)
//
// Each deploy is independently rollback-safe.`
    },

    // ── CQRS and event sourcing basics ──
    {
      speaker: "raj",
      text: `"Last hard one. Your Order Service is getting hammered — reads and writes are competing for the same database connection pool. Order history queries are slow because they're running on the same replica as the writes. What do you do?"`
    },
    {
      speaker: "you",
      text: `"Read replica? Separate the read traffic onto a replica of the orders database?"`
    },
    {
      speaker: "raj",
      text: `"That's the simple version — and often enough. The pattern behind it is CQRS: Command Query Responsibility Segregation. The write side handles commands — create order, cancel order, update status. The read side handles queries — order history, order details, admin dashboards. They can use the same DB with a read replica, or completely different stores optimised for each use case. The write model is normalised for consistency. The read model is denormalised for query speed. You keep them in sync asynchronously via events. This is why order history can be a simple flat document even though the write model is across four normalised tables."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CQRS — separate read and write models
// ─────────────────────────────────────────────────────

// ── Write side: normalised, consistent ──
// Commands mutate state and emit events
class OrderCommandService {
  async createOrder(data) {
    const order = await db.write.orders.create({ ...data, status: 'pending' });
    await eventBus.publish('order.created', { orderId: order.id, ...data });
    return order;
  }
  async confirmOrder(orderId) {
    await db.write.orders.update({ status: 'confirmed' }, { where: { id: orderId } });
    await eventBus.publish('order.confirmed', { orderId });
  }
}

// ── Read side: denormalised, query-optimised ──
// A separate read model, updated by consuming events from the write side
class OrderReadModelUpdater {
  async onOrderCreated(event) {
    await db.read.orderViews.upsert({
      orderId:      event.orderId,
      userId:       event.userId,
      items:        JSON.stringify(event.items),   // flat, no joins needed
      total:        event.total,
      status:       'pending',
      customerName: event.customerName,            // denormalised from User
      createdAt:    event.createdAt,
    });
  }
  async onOrderConfirmed(event) {
    await db.read.orderViews.update(
      { status: 'confirmed' },
      { where: { orderId: event.orderId } }
    );
  }
}

// ── Query side: simple, fast, no joins ──
class OrderQueryService {
  async getOrderHistory(userId) {
    // One query, no joins, reads from dedicated read replica
    return db.read.orderViews.findAll({
      where:  { userId },
      order:  [['createdAt', 'DESC']],
      limit:  50,
    });
  }
}

// Trade-off: eventual consistency.
// Between order.confirmed event and read model update: ~50–200ms lag.
// For order history this is acceptable.
// For "did my payment go through right now?" — query the write model directly.`
    },

    // ── Local development ──
    {
      speaker: "raj",
      text: `"One more practical one. How does a developer run this locally? They can't spin up all six services plus their databases plus the queue plus Redis just to test one change."`
    },
    {
      speaker: "you",
      text: `"Docker Compose? Run everything locally in containers?"`
    },
    {
      speaker: "raj",
      text: `"Docker Compose works for small setups but once you're past four or five services it becomes slow and expensive to run everything locally. The better patterns: mock the services you don't own. If you're working on Order Service, mock Payment Service to return a fixed success response. Contract tests you wrote earlier ensure that mock stays accurate. The other pattern is to use the real staging environment for dependencies — your local Order Service calls the staging Payment Service via its URL. You only run what you're actively changing. Some teams use tools like Telepresence to run one service locally while the rest run in a real Kubernetes cluster — your local process intercepts traffic for its service name."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// LOCAL DEVELOPMENT STRATEGIES
// ─────────────────────────────────────────────────────

// ── Docker Compose — run everything locally ──
// docker-compose.yml (works well up to ~4 services)
// services:
//   order-service:
//     build: .
//     ports: ["3001:3000"]
//     environment:
//       PAYMENT_SERVICE_URL: http://payment-service:3000
//       DB_URL: postgres://localhost/orders
//     depends_on: [postgres, redis, rabbitmq]
//   payment-service:
//     image: myorg/payment-service:latest  ← run released image, not source
//     ports: ["3002:3000"]
//   postgres:
//     image: postgres:15
//   redis:
//     image: redis:7
//   rabbitmq:
//     image: rabbitmq:3-management

// ── Mocking dependencies (recommended for day-to-day dev) ──
// Use environment variable to swap real service for mock
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service';

// In test/local environment: point at a mock server
// PAYMENT_SERVICE_URL=http://localhost:9001

// Mock server using nock or a lightweight Express stub:
// mock-payment-service.js
const express = require('express');
const app = express();
app.use(express.json());
app.post('/v1/charge', (req, res) => {
  console.log('[MOCK] charge:', req.body);
  res.json({ chargeId: 'ch_mock_123', status: 'succeeded' });
});
app.listen(9001);
// Keep in sync with contract tests — if the contract changes, mock changes.

// ── Environment-based service URLs ──
// .env.local:
//   PAYMENT_SERVICE_URL=http://localhost:9001         ← local mock
// .env.staging:
//   PAYMENT_SERVICE_URL=https://payment.staging.myapp.com  ← real staging
// .env.production:
//   PAYMENT_SERVICE_URL=http://payment-service        ← Kubernetes DNS

// ── Telepresence (advanced — run one service locally against real k8s) ──
// telepresence intercept order-service --port 3001:3000
// All traffic to order-service in the cluster now routes to your laptop.
// Your local code, real cluster dependencies (payment-service, DB, queue).
// Best for debugging production-like behaviour without full local stack.`
    },

    {
      speaker: "raj",
      text: `"You look at the whiteboard again. Same six boxes. Does it look different?"`
    },
    {
      speaker: "you",
      text: `"There's a lot more between those arrows than the diagram shows. And a lot underneath each box too."`
    },
    {
      speaker: "raj",
      text: `"Every arrow is a network call, a consistency boundary, a contract to maintain, a circuit breaker to tune, and a trace ID to propagate. Every box is a deployment pipeline, a health check, a read model, a service account, and a local mock. None of that is on the whiteboard because diagrams are optimistic. The engineering is in the gaps — and now you know what's there."`
    },

    {
      type: "summary",
      points: [
        "Microservices solve an organisational problem: multiple teams blocked by one shared codebase. Independent deployability follows from team autonomy. A single team is almost always better served by a monolith — measure the organisational cost before paying the operational one.",
        "A distributed monolith is the worst outcome: services split across a network but still tightly coupled through shared databases or synchronous call chains. The boundary test: could this service do its core job if every other service was unreachable for an hour? If no, the boundary is wrong.",
        "Database-per-service is non-negotiable. Each service owns its data and exposes it only through its own API. Services store local copies of the data they need from other domains — denormalised, snapshotted at creation time. That's not a bug, it's the design.",
        "Three communication patterns, each with a distinct use case. Synchronous REST/gRPC when the caller needs the answer to continue — payment must succeed before the order confirms. Async messaging when work can happen out-of-band — emails, analytics, stock decrements; the caller returns 200 immediately and each consumer retries independently. Data replication when a service needs frequent read access to another domain's data — subscribe to change events, maintain a local copy, eliminate the runtime dependency entirely. The trade-off on replication is eventual consistency, which is acceptable for most reads.",
        "Service discovery via Kubernetes DNS in production — stable name, cluster handles routing. API gateway handles TLS, auth validation, rate limiting, and routing once for all external traffic. Liveness and readiness probes are how Kubernetes knows which pods should receive traffic.",
        "Inter-service authentication: shared API keys for simple setups, mTLS via a service mesh (Istio/Linkerd) for production. The API gateway validates user JWTs and injects trusted headers — internal services read those headers and trust the gateway, never re-validate the original token.",
        "Never remove or rename a field a consumer depends on. Consumer-driven contract tests (Pact) let consumers declare what they expect, and those contracts run in the provider's CI — breaking changes are caught at code review time, not production at 2am.",
        "Circuit breakers prevent cascading failure: watch failure rate, open when threshold trips, fail fast while open, test and close when the dependency recovers. Always set timeouts — a call with no timeout holds a thread forever. Use idempotency keys on mutations so retries are safe.",
        "Distributed tracing is mandatory. One trace ID at the entry point, passed in every outgoing request header, logged on every meaningful operation. OpenTelemetry auto-instruments HTTP, Express, and DB calls. Without it, debugging a failed request across six services is archaeology.",
        "Saga pattern for distributed consistency: local transactions with compensating transactions that undo previous steps on failure. Outbox pattern for guaranteed event delivery — write event and data in the same DB transaction, background relay publishes to the queue.",
        "Canary deployments roll out changes to 5% of traffic first, watch metrics, then gradually increase. Blue-green keeps the old version running for instant rollback. Database migrations use the expand-contract pattern — never alter a column in one atomic deploy.",
        "CQRS separates write models (normalised, consistent) from read models (denormalised, query-optimised), kept in sync via events. Reads can use a different store or replica entirely. The trade-off is eventual consistency — acceptable for most read queries, not for immediate post-write reads.",
        "Local development: Docker Compose for small setups, mock servers for services you don't own (kept in sync with contract tests), or Telepresence to run one service locally against a real cluster. Never require a developer to run all N services to make a change in one."
      ]
    }
  ]
};

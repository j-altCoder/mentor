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

    // ── What is this actually solving ──
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

    // ── What you actually lose ──
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

// ── Monolith: one transaction, three operations ──
const placeOrder = async (userId, items) => {
  return await db.transaction(async (tx) => {
    const order = await tx.orders.create({ userId, items });
    await tx.inventory.decrement(items);           // same transaction
    await tx.payments.charge(userId, order.total); // same transaction
    return order;
    // if anything throws → everything rolls back. clean.
  });
};

// ── Microservices: the same operation, now distributed ──
const placeOrder = async (userId, items) => {
  const order = await orderService.create({ userId, items });
  // What if next line fails? Order already created.
  await inventoryService.decrement(items);
  // What if THIS fails? Order created, stock decremented, no charge.
  await paymentService.charge(userId, order.total);
  return order;
};
// There is no rollback. Each service committed its own local transaction.
// Inconsistency is now your problem to manage.

// ── What you gain ──
// ✓ Order Service team ships without touching Payment Service code
// ✓ Payment Service scales independently
// ✓ Payment Service goes down → rest of the app still works
// ✓ Each service can be rewritten in isolation

// ── What you pay ──
// ✗ Every cross-service call: latency + failure modes
// ✗ No distributed transactions — you manage consistency manually
// ✗ N deployment pipelines instead of 1
// ✗ Distributed tracing to follow one request across six services
// ✗ Local dev: run all six or mock five of them`
    },

    // ── Distributed monolith ──
    {
      speaker: "raj",
      text: `"Look at User Service on the board. Every other service has an arrow pointing to it. Order Service calls it for the shipping address. Notification Service calls it for the email. Payment Service calls it for billing info. What's wrong with that?"`
    },
    {
      speaker: "you",
      text: `"If User Service goes down, everything goes down?"`
    },
    {
      speaker: "raj",
      text: `"That's one problem. The deeper one: you haven't actually decoupled anything. You just turned a function call into a network hop. Those services can't operate without each other — they're still tightly coupled. This is called a distributed monolith. You get all the costs of microservices and none of the independence. The giveaway is when a team says 'we can't deploy Order Service without deploying User Service first because of the API change.' That's not independent deployability. That's a monolith with worse debugging and slower deploys."`
    },
    {
      speaker: "you",
      text: `"So what's the right cut?"`
    },
    {
      speaker: "raj",
      text: `"The test I use: could this service do its core job if every other service was unreachable for an hour? If the answer is no, the boundary is wrong. User Service fails immediately — it's a shared dependency, not a standalone service. Payment is a good candidate. Its own data model, clear ownership, different scaling and security requirements, and most of the system works fine if payment is degraded for a moment. The fix for User Service isn't to make it more reliable — it's to stop calling it on every request. Order Service should store what it needs locally: the shipping address at order time, the product name and price. That data doesn't change retroactively. Stop fetching it live."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// GOOD BOUNDARIES vs DISTRIBUTED MONOLITH
// ─────────────────────────────────────────────────────

// ✗ Distributed monolith
// Every order request crosses four service boundaries before returning.
// User Service slow → orders slow. User Service down → orders down.
// Client → Order Service → User Service    (get shipping address)
//                        → Inventory Service (check stock)
//                        → Payment Service  → Fraud Service

// ✓ Each service stores what it needs locally
const order = {
  orderId:         '123',
  userId:          'u456',
  shippingAddress: '12 Main St',     // copied at order time — not fetched live
  items: [
    { productId: 'p789', name: 'Headphones', price: 79.99, qty: 1 }
    //                   ^^^^               ^^^^^
    // Copied from Product Service at order creation.
    // Order Service never calls Product Service to display order history.
  ],
  total: 79.99,
};
// User Service goes down for a deploy.
// Order history still works. New orders still process.
// The data is slightly denormalised. That's intentional.

// Each service has its own model of the same concept:
// "User" in Order Service   = { userId, shippingAddress }
// "User" in Auth Service    = { userId, email, passwordHash }
// "User" in Billing Service = { userId, billingAddress, paymentMethods }
// Same word. Different slices. Each service owns what it needs.`
    },

    // ── Sync vs async ──
    {
      speaker: "raj",
      text: `"Order is placed. Confirmation email needs to go out. How does Order Service trigger Notification Service?"`
    },
    {
      speaker: "you",
      text: `"Call its API?"`
    },
    {
      speaker: "raj",
      text: `"What happens if Notification Service is slow?"`
    },
    {
      speaker: "you",
      text: `"The order response takes longer. But... the user doesn't need to wait for the email. The order's already confirmed."`
    },
    {
      speaker: "raj",
      text: `"Exactly. Calling synchronously couples your order latency to your email system. Notification Service slows down during a mail provider outage and suddenly orders are slow too — for no reason. You publish an event to a queue instead. 'Order placed, here's the data.' Return 200. Notification Service consumes it at its own pace, retries if the provider is flaky, and Order Service never knew there was a problem. The rule: synchronous when the caller needs the answer to continue. Async when you're notifying something else that something happened."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SYNC vs ASYNC COMMUNICATION
// ─────────────────────────────────────────────────────

app.post('/orders', asyncHandler(async (req, res) => {
  const order = await db.orders.create({ ...req.body, status: 'pending' });

  // Synchronous — must succeed before we can confirm the order
  const payment = await fetch('http://payment-service/charge', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-trace-id': req.traceId },
    body:    JSON.stringify({ orderId: order.id, amount: order.total }),
    signal:  AbortSignal.timeout(8000), // always set a timeout
  });
  if (!payment.ok) {
    await db.orders.updateStatus(order.id, 'payment_failed');
    return res.status(402).json({ error: 'Payment failed' });
  }
  await db.orders.updateStatus(order.id, 'confirmed');

  // Async — publish and return. Order Service does not wait for any of these.
  await messageQueue.publish('order.placed', {
    orderId:  order.id,
    userId:   order.userId,
    items:    order.items,
    total:    order.total,
    placedAt: new Date(),
  });

  res.json({ orderId: order.id, status: 'confirmed' });
  // Response is back. Email not sent yet. Inventory not decremented yet.
  // Both will happen. Order Service doesn't need to watch.
}));

// Notification Service — its own process, its own pace
messageQueue.subscribe('order.placed', async (event) => {
  await emailProvider.send({
    to:      event.userEmail,
    subject: \`Order \${event.orderId} confirmed\`,
    body:    renderTemplate('order-confirmed', event),
  });
  // Retries automatically on failure. Order Service unaffected.
});

// Inventory Service — another independent consumer of the same event
messageQueue.subscribe('order.placed', async (event) => {
  for (const item of event.items) {
    await db.inventory.decrement(item.productId, item.qty);
  }
});`
    },

    // ── Cascading failure ──
    {
      speaker: "raj",
      text: `"Payment Service starts responding in eight seconds instead of 200ms. You haven't touched Order Service. What happens to it?"`
    },
    {
      speaker: "you",
      text: `"Requests pile up waiting on Payment Service. Eventually Order Service runs out of threads and stops responding too."`
    },
    {
      speaker: "raj",
      text: `"That's cascading failure. One slow dependency takes down a completely separate service. What stops it?"`
    },
    {
      speaker: "you",
      text: `"A timeout would help — fail faster. But requests are still piling up for eight seconds each."`
    },
    {
      speaker: "raj",
      text: `"Right. A circuit breaker goes further. It watches the failure rate — when enough calls are failing, it opens. Open circuit: calls return an error immediately without touching the network. Milliseconds instead of eight seconds. Threads freed instantly. After a reset timeout it lets one call through to test the dependency. If it succeeds, circuit closes and traffic resumes. If not, stays open. Order Service is now degraded — it tells users payment is temporarily unavailable — instead of completely down. That's the difference."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CIRCUIT BREAKER — stops cascading failure
// ─────────────────────────────────────────────────────
const CircuitBreaker = require('opossum');

const callPaymentService = async ({ orderId, amount, idempotencyKey }) => {
  const res = await fetch('http://payment-service/charge', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'Idempotency-Key': idempotencyKey, // safe to retry — server deduplicates
      'x-trace-id':      getTraceId(),
    },
    body:   JSON.stringify({ orderId, amount }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(\`payment \${res.status}\`);
  return res.json();
};

const paymentBreaker = new CircuitBreaker(callPaymentService, {
  timeout:                  5000,  // fail after 5s
  errorThresholdPercentage: 50,    // open when 50%+ of calls fail
  resetTimeout:             15000, // try again after 15s
  volumeThreshold:          5,     // need at least 5 calls before tripping
});

paymentBreaker.fallback(() => {
  throw new ServiceUnavailableError('Payment temporarily unavailable. Please retry.');
});

paymentBreaker.on('open',     () => logger.error({ event: 'circuit_open',     service: 'payment-service' }));
paymentBreaker.on('halfOpen', () => logger.warn({  event: 'circuit_half_open',service: 'payment-service' }));
paymentBreaker.on('close',    () => logger.info({  event: 'circuit_closed',   service: 'payment-service' }));

try {
  const result = await paymentBreaker.fire({ orderId, amount, idempotencyKey: \`charge-\${orderId}\` });
} catch (err) {
  return res.status(503).json({ error: err.message });
}`
    },

    // ── Distributed tracing ──
    {
      speaker: "raj",
      text: `"User calls support. Order failed at 14:37, error ID A3F92. You have six services. Where do you start?"`
    },
    {
      speaker: "you",
      text: `"Order Service logs, find the request, then follow it to Payment Service, then wherever it went from there."`
    },
    {
      speaker: "raj",
      text: `"So you're opening log files one by one, searching by timestamp, trying to match up requests across six different systems. Twenty minutes to trace a ten-second transaction. What you need instead is a trace ID — one identifier generated when the request enters the system, passed in every outgoing request header, logged on every line in every service. Then you run one query: show me everything with trace ID A3F92. The complete timeline falls out. Which service was slow. Exactly where it failed. You can't run microservices in production without this."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// DISTRIBUTED TRACING — one ID across every service
// ─────────────────────────────────────────────────────
const { v4: uuidv4 } = require('uuid');

// Every service runs this middleware
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || uuidv4(); // accept or generate
  res.setHeader('x-trace-id', req.traceId);
  req.log = logger.child({ traceId: req.traceId, service: 'order-service' });
  next();
});

app.post('/orders', asyncHandler(async (req, res) => {
  req.log.info({ event: 'order.start', userId: req.body.userId });

  const order = await db.orders.create(req.body);
  req.log.info({ event: 'order.saved', orderId: order.id });

  await fetch('http://payment-service/charge', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-trace-id':   req.traceId, // ← payment-service logs this same ID
    },
    body: JSON.stringify({ orderId: order.id, amount: order.total }),
  });

  req.log.info({ event: 'order.confirmed', orderId: order.id });
  res.json(order);
}));

// One query across all services for trace ID A3F92:
// A3F92  order-service    order.start           t=0ms
// A3F92  order-service    order.saved           t=11ms
// A3F92  payment-service  charge.start          t=14ms
// A3F92  fraud-service    check.start           t=17ms
// A3F92  fraud-service    check.complete        t=849ms  ← 832ms here
// A3F92  payment-service  charge.complete       t=865ms
// A3F92  order-service    order.confirmed       t=902ms
//
// Fraud Service was the problem. That took twenty seconds in the old approach.`
    },

    // ── Saga ──
    {
      speaker: "raj",
      text: `"Payment goes through. Then Inventory Service fails trying to decrement the stock. What do you do?"`
    },
    {
      speaker: "you",
      text: `"Retry the inventory step. If it keeps failing — refund the payment and cancel the order."`
    },
    {
      speaker: "raj",
      text: `"You just described a saga. A sequence of steps, each with a compensating transaction that undoes it if something downstream fails. That's the standard pattern for distributed consistency. Two things make it work in practice. First: idempotency. Every step must be safe to run twice — because when you retry, the first attempt might have half-succeeded. A charge without an idempotency key retried on a network error double-bills the user. Second: the outbox pattern. If your process crashes after saving to the DB but before publishing the event to the queue, the inventory step never runs. Writing the event to the DB in the same transaction as the order means it can't be lost."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SAGA PATTERN — consistency without transactions
// ─────────────────────────────────────────────────────

class PlaceOrderSaga {
  async run(orderData) {
    let orderId = null, paymentId = null;

    try {
      const order = await orderService.create({ ...orderData, status: 'pending' });
      orderId = order.id;

      const payment = await paymentService.charge({
        orderId,
        amount:         orderData.total,
        idempotencyKey: \`charge-\${orderId}\`, // safe to retry — server deduplicates
      });
      paymentId = payment.id;

      await inventoryService.decrement({
        orderId,
        items:          orderData.items,
        idempotencyKey: \`inventory-\${orderId}\`,
      });

      await orderService.confirm(orderId);
      return { success: true, orderId };

    } catch (err) {
      logger.error({ event: 'saga.failed', orderId, err: err.message });

      // Compensating transactions — undo in reverse order
      if (paymentId) {
        await paymentService.refund({ paymentId, reason: 'order_failed' })
          .catch(e => logger.error({ event: 'saga.refund_failed', paymentId }));
      }
      if (orderId) {
        await orderService.cancel(orderId)
          .catch(e => logger.error({ event: 'saga.cancel_failed', orderId }));
      }

      return { success: false, reason: err.message };
    }
  }
}

// ── Outbox pattern — events survive a crash ──

// ✗ Crash between these two lines → inventory never decrements, no error logged
await db.orders.save(order);
await messageQueue.publish('order.placed', order); // process dies here

// ✓ Event written to DB in the same transaction — can't be lost
await db.transaction(async (tx) => {
  await tx.orders.save(order);
  await tx.outbox.insert({
    topic:   'order.placed',
    payload: JSON.stringify(order),
    sentAt:  null,
  });
});
// Background relay reads outbox rows where sentAt is null → publishes → marks sent
// On restart: picks up unsent rows again. Idempotency key on consumer prevents duplicates.`
    },

    {
      speaker: "raj",
      text: `"You look at the whiteboard again. Same six boxes. Does it look different?"`
    },
    {
      speaker: "you",
      text: `"There's a lot more between those arrows than the diagram shows."`
    },
    {
      speaker: "raj",
      text: `"Every arrow is a network call that can fail, a consistency boundary you now own, a place where a trace ID has to travel, a circuit breaker that needs tuning. None of that is on the whiteboard because diagrams are optimistic. The engineering is in the gaps between the boxes."`
    },

    {
      type: "summary",
      points: [
        "Microservices solve an organisational problem, not a technical one. The right question isn't 'is our codebase big?' but 'are multiple teams blocked by sharing one thing?' A single team is almost always better off with a monolith.",
        "A distributed monolith is the worst outcome: services that can't deploy independently and can't operate without each other. Every service calling User Service on every request is not decoupling — it's a function call with a network hop and worse debugging.",
        "The boundary test: could this service do its core job if every other service was unreachable for an hour? If no, the boundary is wrong. Fix it by storing what you need locally rather than fetching it live.",
        "Synchronous calls when the caller needs the answer to continue — payment must succeed before the order confirms. Async messaging when the work can happen out of band — emails, inventory updates, analytics. The user doesn't wait for any of those.",
        "Cascading failure: one slow dependency exhausts your thread pool and takes down a healthy service. Circuit breakers prevent it — watch failure rates, open when the threshold trips, fail fast, test and close when the dependency recovers.",
        "Distributed tracing is non-negotiable. One trace ID at entry, passed in every outgoing header, logged on every meaningful line. Without it, debugging a six-service request is archaeology.",
        "Saga pattern for distributed consistency: sequence of local transactions with compensating transactions that undo previous steps on failure. Idempotency keys on every step so retries are safe. Outbox pattern so events can't be silently lost between a DB write and a queue publish.",
        "Every arrow on the architecture diagram is a network call, a consistency boundary, and a new operational concern. The engineering lives in the gaps between the boxes."
      ]
    }
  ]
};

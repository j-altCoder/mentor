// ─────────────────────────────────────────────────────────────────
//  LESSON: Distributed Systems Reliability
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_DISTRIBUTED = {
  category: "Architecture & System Design",
  tag: "Distributed Systems Reliability",
  title: "When Networks Lie, Servers Crash, and Clocks Disagree",
  intro: "Finance team flags a critical bug: some customers were charged twice. The code looks correct. The payment service logs show one request. Raj pulls up the network logs and finds something the app never saw.",
  scenes: [

    // ── The fundamental problem ──
    {
      speaker: "raj",
      text: `"Before we debug this — what do you think is fundamentally different about a distributed system versus a single server?"`
    },
    {
      speaker: "you",
      text: `"Multiple machines? Network calls instead of function calls?"`
    },
    {
      speaker: "raj",
      text: `"Closer: in a single process, when a function call fails, you know it failed. In a distributed system, a call can fail in a way where you genuinely don't know what happened. You sent a payment request to Stripe. The network dropped the response. Did Stripe charge the card? You don't know. Did your request arrive at all? You don't know. In a single process, failure is binary — succeeded or threw. Over a network, there are three outcomes: succeeded, failed, or <em>unknown</em>. Most reliability patterns exist specifically to handle that third state gracefully."`
    },
    {
      type: "analogy",
      text: "Sending a network request = posting a letter with no read receipt. You don't know if it arrived. The recipient might have received it and their reply got lost. Or it never arrived. Or they're processing it right now. You can't tell from silence whether the letter was lost in transit or the reply was."
    },

    // ── Idempotency ──
    {
      speaker: "you",
      text: `"So that's why the double charge happened? A retry?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. The first request timed out. The client retried. Stripe processed both. The fix is <em>idempotency</em> — designing operations so they can safely be executed multiple times with the same result. An idempotent operation applied twice is the same as applied once. GET is naturally idempotent — reading data twice gives the same data. POST /checkout is not — calling it twice charges twice. You make it idempotent by including an <em>idempotency key</em> — a unique ID the client generates for each logical operation. The server deduplicates on that key."`
    },
    {
      speaker: "you",
      text: `"Where does the idempotency key come from and how does the server use it?"`
    },
    {
      speaker: "raj",
      text: `"The client generates a UUID before the first attempt and includes it as a header — Idempotency-Key. The server processes the request, stores the result keyed by that UUID in Redis or the DB. If the same key arrives again — same client retrying after a timeout — the server returns the stored result immediately without processing again. The key must have a TTL so old records don't accumulate forever. 24 hours is typical for payments. Stripe, Stripe, and virtually every payment provider implements this pattern — they call it idempotency keys."`
    },
    {
      type: "code",
      text: `// Client — generate idempotency key ONCE per logical operation, persist across retries
const processPayment = async (orderId, amount) => {
  // Key is tied to the operation, not the attempt
  // Use a deterministic key so even a client restart doesn't create duplicates
  const idempotencyKey = 'checkout-' + orderId; // or UUID stored with the order

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await axios.post('/api/checkout', { orderId, amount }, {
        headers: { 'Idempotency-Key': idempotencyKey },
        timeout: 5000
      });
      return result.data;
    } catch (err) {
      if (attempt === 3 || !isRetryable(err)) throw err;
      await sleep(attempt * 1000); // exponential backoff
    }
  }
};

// Server — deduplicate on idempotency key
const idempotencyMiddleware = async (req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (!key) return next(); // key is optional for non-critical endpoints

  const cacheKey = 'idempotency:' + req.method + ':' + req.path + ':' + key;

  // Check if we already processed this request
  const cached = await redis.get(cacheKey);
  if (cached) {
    const stored = JSON.parse(cached);
    return res.status(stored.status).json(stored.body); // return stored result
  }

  // Intercept the response to store it
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    if (res.statusCode < 500) { // don't cache server errors
      await redis.setex(cacheKey, 86400, JSON.stringify({ // 24h TTL
        status: res.statusCode,
        body
      }));
    }
    return originalJson(body);
  };

  next();
};

app.post('/api/checkout', idempotencyMiddleware, asyncHandler(checkoutHandler));`
      }
    },

    // ── Retry strategies ──
    {
      speaker: "you",
      text: `"If we're retrying anyway — what's the right way to retry? Just loop three times?"`
    },
    {
      speaker: "raj",
      text: `"A simple loop retry can make things catastrophically worse. Imagine a downstream service is overloaded. A thousand clients all get a 503. They all immediately retry. The service, already struggling, gets hit by three times the traffic. It collapses completely. That's a <em>retry storm</em>. The fix is <em>exponential backoff with jitter</em>. Each retry waits longer than the last — typically doubling. But if all clients use the exact same backoff interval, they all retry simultaneously again, just less frequently. <em>Jitter</em> adds randomness to spread the retries out across time so the downstream service gets a steady trickle instead of a wave."`
    },
    {
      speaker: "you",
      text: `"What should you actually retry versus not retry?"`
    },
    {
      speaker: "raj",
      text: `"Only retry <em>transient, retryable errors</em>. Network timeouts — yes, the service might recover. 429 Too Many Requests — yes, back off and retry after the Retry-After header says. 503 Service Unavailable — yes, transient. <em>Never</em> retry 400 Bad Request — your request is malformed, retrying achieves nothing. Never retry 401 Unauthorized — you need new credentials first. Never retry 422 Unprocessable Entity — the data is semantically wrong. And never retry non-idempotent operations without an idempotency key — otherwise you do what caused our double charge."`
    },
    {
      type: "code",
      text: `// Exponential backoff with full jitter
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async (fn, options = {}) => {
  const {
    maxAttempts   = 3,
    baseDelayMs   = 500,
    maxDelayMs    = 30000,
    retryOn       = [408, 429, 500, 502, 503, 504]
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      const isLast = attempt === maxAttempts;

      // Don't retry non-retryable errors
      if (status && !retryOn.includes(status)) throw err;
      if (isLast) throw err;

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const exponential = baseDelayMs * Math.pow(2, attempt - 1);
      const capped       = Math.min(exponential, maxDelayMs);

      // Full jitter — random between 0 and the capped delay
      // Spreads retries across time, prevents thundering herd
      const jitter = Math.random() * capped;

      // Respect Retry-After header if present (rate limiting)
      const retryAfter = err.response?.headers?.['retry-after'];
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : jitter;

      console.log('Attempt', attempt, 'failed, retrying in', Math.round(delay), 'ms');
      await sleep(delay);
    }
  }
};

// Usage
const result = await withRetry(
  () => axios.post('https://api.stripe.com/v1/charges', chargeData, {
    headers: { 'Idempotency-Key': idempotencyKey }
  }),
  { maxAttempts: 3, baseDelayMs: 1000 }
);

// What NOT to retry
const isRetryable = (err) => {
  const status = err.response?.status;
  if (!status) return true;           // network error — always retry
  if (status === 400) return false;   // bad request — fix your payload
  if (status === 401) return false;   // unauthorized — get new token first
  if (status === 403) return false;   // forbidden — no point retrying
  if (status === 422) return false;   // validation error — fix your data
  return [408, 429, 500, 502, 503, 504].includes(status);
};`
      }
    },

    // ── Distributed locks ──
    {
      speaker: "you",
      text: `"What's a distributed lock and when do you need one?"`
    },
    {
      speaker: "raj",
      text: `"In a single process you use a mutex to ensure only one execution of a critical section at a time. Distributed systems have multiple processes across multiple servers — a mutex in one process means nothing to another. A <em>distributed lock</em> uses a shared external store — Redis — as the coordination point. The classic problem it solves: you send a daily summary email to each user. Your job runs on 5 servers simultaneously. Without a lock, each server independently identifies all users and sends 5 emails to each one. With a distributed lock, only one server acquires the lock for each userId and sends one email."`
    },
    {
      speaker: "you",
      text: `"What happens if the server holding the lock crashes before releasing it?"`
    },
    {
      speaker: "raj",
      text: `"That's exactly why every distributed lock must have a TTL — a time-to-live. If the lock holder crashes, the lock expires automatically after the TTL and another process can acquire it. The TTL must be longer than the longest expected execution time. Set it too short and a slow but healthy execution loses its lock mid-operation, causing concurrent execution and data corruption. Too long and a crash blocks the operation for a long time. In Redis the critical thing is using <em>SET NX EX</em> — Set if Not eXists, with Expiry — as a single atomic command. A two-step SET then EXPIRE is not atomic — a crash between them leaves a permanent lock."`
    },
    {
      type: "code",
      text: `// Distributed lock with Redis — atomic SET NX EX
const acquireLock = async (lockKey, ttlSeconds) => {
  const lockValue = crypto.randomUUID(); // unique per holder — prevents accidental release
  // SET key value NX EX ttl — atomic: only sets if key doesn't exist
  const acquired = await redis.set(lockKey, lockValue, 'NX', 'EX', ttlSeconds);
  return acquired ? lockValue : null; // null = lock already held by someone else
};

const releaseLock = async (lockKey, lockValue) => {
  // Lua script — atomic check-and-delete
  // Only release if WE hold the lock (prevents releasing another holder's lock)
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  return redis.eval(script, 1, lockKey, lockValue);
};

const withDistributedLock = async (lockKey, ttlSeconds, fn) => {
  const lockValue = await acquireLock(lockKey, ttlSeconds);
  if (!lockValue) {
    throw new Error('Could not acquire lock: ' + lockKey);
  }
  try {
    return await fn();
  } finally {
    await releaseLock(lockKey, lockValue); // always release — even on error
  }
};

// Usage — prevent duplicate email sends in distributed job runners
const sendDailySummary = async (userId) => {
  const lockKey = 'daily-summary-lock:' + userId + ':' + getTodayDate();

  try {
    await withDistributedLock(lockKey, 60, async () => {
      // Only one server reaches this code per userId per day
      const alreadySent = await SummaryLog.exists({ userId, date: getTodayDate() });
      if (alreadySent) return; // idempotency check inside the lock

      await sendEmail(userId);
      await SummaryLog.create({ userId, date: getTodayDate() });
    });
  } catch (err) {
    if (err.message.includes('Could not acquire lock')) return; // another server got it
    throw err;
  }
};

// Redlock — distributed lock across multiple Redis nodes (more resilient)
// Uses majority quorum: must acquire lock on >N/2 nodes
const Redlock = require('redlock');
const redlock = new Redlock([redis1, redis2, redis3], {
  retryCount: 3,
  retryDelay: 200
});
const lock = await redlock.acquire(['lock:' + resourceId], 30000); // 30s TTL
try { /* critical section */ } finally { await lock.release(); }`
      }
    },

    // ── Saga pattern ──
    {
      speaker: "you",
      text: `"What if I need a multi-step operation across services — like deduct inventory, create order, charge payment — and one step fails in the middle?"`
    },
    {
      speaker: "raj",
      text: `"That's where the <em>Saga pattern</em> comes in. In a single database, a transaction handles this — all steps succeed or all are rolled back. Across multiple services, there's no global transaction manager. A Saga is a sequence of local transactions where each step publishes an event. If a step fails, it triggers <em>compensating transactions</em> — the Saga's version of rollback. You created the order? Compensating action: cancel the order. You charged the card? Compensating action: issue a refund. Each step must be undoable. Two flavours: <em>Choreography</em> — services react to events from each other, no central coordinator, more decoupled but harder to debug. <em>Orchestration</em> — a central orchestrator tells each service what to do, easier to reason about, single point of control."`
    },
    {
      type: "code",
      text: `// Saga — Orchestration style (central coordinator)
// Easier to trace and debug than choreography

const runCheckoutSaga = async (order) => {
  const saga = {
    steps:        [],
    compensations: []
  };

  try {
    // Step 1: Reserve inventory
    const reservation = await inventoryService.reserve(order.items);
    saga.compensations.unshift(() =>             // unshift = compensate in reverse order
      inventoryService.cancelReservation(reservation.id)
    );
    saga.steps.push('inventory.reserved');

    // Step 2: Create order record
    const dbOrder = await orderService.create({
      ...order,
      reservationId: reservation.id,
      status: 'pending'
    });
    saga.compensations.unshift(() =>
      orderService.cancel(dbOrder.id)
    );
    saga.steps.push('order.created');

    // Step 3: Process payment
    const payment = await paymentService.charge({
      orderId:        dbOrder.id,
      amount:         order.total,
      idempotencyKey: 'payment-' + dbOrder.id  // idempotent payment
    });
    saga.compensations.unshift(() =>
      paymentService.refund(payment.id)
    );
    saga.steps.push('payment.charged');

    // Step 4: Confirm order
    await orderService.confirm(dbOrder.id, payment.id);

    return { success: true, orderId: dbOrder.id };

  } catch (err) {
    // Run compensating transactions in reverse order
    logger.error('Saga failed at step', { step: saga.steps.at(-1), err: err.message });

    for (const compensate of saga.compensations) {
      try {
        await compensate();
      } catch (compErr) {
        // Compensation failure — needs human intervention or dead letter queue
        logger.error('Compensation failed', { compErr: compErr.message });
        await deadLetterQueue.add('saga-compensation-failed', {
          orderId: order.id,
          failedStep: saga.steps.at(-1),
          compensationError: compErr.message
        });
      }
    }

    return { success: false, error: err.message };
  }
};`
      }
    },

    // ── Outbox pattern ──
    {
      speaker: "you",
      text: `"In event-driven systems, how do you guarantee that when you save to the database you also publish the event? They could get out of sync."`
    },
    {
      speaker: "raj",
      text: `"This is one of the classic distributed systems problems. You save the order to the database. Then you try to publish 'order.created' to Kafka. Your process crashes between those two steps. The order is saved but the event never fires. Every downstream service that depends on that event — fulfillment, email, analytics — never knows the order exists. The <em>Transactional Outbox pattern</em> solves this. Instead of publishing directly, you write the event to an <em>outbox table in the same database transaction</em> as the main write. If the transaction commits, both the order and the event record exist — atomically. A separate <em>relay process</em> polls the outbox table and publishes pending events to the message broker, then marks them as published."`
    },
    {
      type: "code",
      text: `// Transactional Outbox — atomic write + event in one DB transaction

// Same transaction: save order AND queue the event
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  // Primary write
  const [order] = await Order.create([{
    userId: req.user.userId,
    items:  req.body.items,
    total:  req.body.total,
    status: 'pending'
  }], { session });

  // Outbox entry — in the SAME transaction
  await OutboxEvent.create([{
    eventType:   'order.created',
    aggregateId: order._id.toString(),
    payload:     JSON.stringify({
      orderId: order._id,
      userId:  order.userId,
      total:   order.total,
      items:   order.items
    }),
    status:      'pending',
    createdAt:   new Date()
  }], { session });

  // If transaction commits: both order and outbox entry exist atomically.
  // If it rolls back: neither exists. No orphaned events.
});
await session.endSession();

// Relay worker — runs as a separate process, polls and publishes
const relayOutboxEvents = async () => {
  const batch = await OutboxEvent.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  for (const event of batch) {
    try {
      await kafka.producer.send({
        topic:    event.eventType,
        messages: [{ key: event.aggregateId, value: event.payload }]
      });
      await OutboxEvent.findByIdAndUpdate(event._id, {
        status:      'published',
        publishedAt: new Date()
      });
    } catch (err) {
      await OutboxEvent.findByIdAndUpdate(event._id, {
        $inc: { retryCount: 1 },
        lastError: err.message
      });
    }
  }
};

// Run relay every 1 second
setInterval(relayOutboxEvents, 1000);
// OR use MongoDB Change Streams to trigger relay instantly on new outbox entries`
      }
    },

    // ── Event-driven and at-least-once delivery ──
    {
      speaker: "you",
      text: `"Message queues say they guarantee at-least-once delivery. Doesn't that mean the same message could be processed twice?"`
    },
    {
      speaker: "raj",
      text: `"Exactly — and it will be, eventually. Kafka, RabbitMQ, SQS — they all guarantee at-least-once. Your consumer processes a message, and before it acknowledges it, the consumer crashes. The broker re-delivers. Your consumer processes it again. This is not a bug — it's a design decision. Exactly-once delivery at the broker level is extremely expensive and most systems choose not to pay that cost. The responsibility shifts to your consumer to be <em>idempotent</em>. Processing the same message twice should produce the same result as processing it once. Implement this exactly as we did for API calls — use a deduplication key, check if already processed, skip if so."`
    },
    {
      type: "code",
      text: `// Idempotent message consumer — handles at-least-once delivery safely
const processOrderCreatedEvent = async (message) => {
  const event = JSON.parse(message.value.toString());
  const { orderId, userId, total } = event;

  // Deduplication key — message ID from broker or deterministic key from payload
  const dedupKey = 'processed:order.created:' + orderId;

  // Check if already processed (Redis with TTL or DB unique constraint)
  const alreadyProcessed = await redis.set(dedupKey, '1', 'NX', 'EX', 86400);
  if (!alreadyProcessed) {
    console.log('Duplicate event — skipping:', orderId);
    return; // acknowledge without processing — safe to skip
  }

  try {
    // Idempotent operations — safe to run multiple times
    await fulfillmentService.createShipment(orderId);  // upsert by orderId
    await emailService.sendConfirmation(userId, orderId); // dedup on orderId
    await analyticsService.recordSale(orderId, total);  // upsert by orderId
  } catch (err) {
    // Delete dedup key so we retry on next delivery
    await redis.del(dedupKey);
    throw err; // rethrow — broker will re-deliver
  }
};

// Kafka consumer — commit offset only after successful processing
consumer.run({
  eachMessage: async ({ message, topic, partition, heartbeat }) => {
    try {
      await processOrderCreatedEvent(message);
      // Offset committed automatically after eachMessage resolves
    } catch (err) {
      logger.error('Event processing failed', { err: err.message });
      // Don't commit offset — message will be redelivered
      // Consider dead-letter queue after N failures to avoid infinite retry
    }
  }
});`
      }
    },

    // ── CAP theorem ──
    {
      speaker: "you",
      text: `"Interviewers always ask about CAP theorem. Can you give me an honest explanation of what it actually means in practice?"`
    },
    {
      speaker: "raj",
      text: `"The CAP theorem says a distributed system can guarantee at most two of three properties: <em>Consistency</em> — every read sees the most recent write. <em>Availability</em> — every request gets a response, even if it might be stale. <em>Partition tolerance</em> — the system keeps working when network partitions split nodes. Here's the practical interpretation: you always need partition tolerance — networks do fail, you can't opt out. So the real choice is between consistency and availability <em>during a partition</em>. A CP system — like HBase — stops accepting writes to prevent divergence when partitioned. A CA system — like MongoDB in many configs — continues serving reads and writes during a partition, but some nodes may return stale data. When the partition heals, they reconcile."`
    },
    {
      speaker: "you",
      text: `"How do I decide which to pick?"`
    },
    {
      speaker: "raj",
      text: `"Ask what happens when your system returns stale data. A bank balance that's wrong by even one cent is catastrophic — choose consistency, accept that the system may be briefly unavailable during failures. A social media feed that shows a post from 2 seconds ago instead of right now — nobody cares. Choose availability. Most real systems make this choice per-operation. MongoDB lets you choose write concern and read preference per query. You use strong consistency for critical financial writes and eventual consistency for analytics reads in the same application."`
    },
    {
      type: "code",
      text: `// CAP in practice — per-operation consistency choices

// CP — strong consistency, may reject during partition
// Write to MongoDB with majority write concern — blocks until majority of replicas confirm
await BankAccount.findByIdAndUpdate(accountId,
  { $inc: { balance: -amount } },
  { writeConcern: { w: 'majority', j: true } } // durability guaranteed
);
// Read from primary — always fresh, no stale reads
const balance = await BankAccount.findById(accountId).read('primary');

// AP — availability over consistency, might return stale data
// Fine for social feed, analytics, recommendations
const feed = await Post.find({ followedUsers: { $in: req.user.following } })
  .read('secondaryPreferred')   // might be milliseconds stale — acceptable
  .sort({ createdAt: -1 })
  .limit(20);

// Dynamo-style — tunable consistency per operation
// Reads: eventually consistent (default, fast) vs strongly consistent (slower)
const item = await dynamodb.getItem({
  TableName:       'Orders',
  Key:             { orderId: { S: orderId } },
  ConsistentRead:  true   // true = strongly consistent, false = eventual
}).promise();

// PACELC — extension of CAP for normal operation (no partition)
// Even without a partition, there's a latency vs consistency tradeoff:
// Strong consistency = wait for replication acknowledgement → higher latency
// Eventual consistency = return immediately, replicate async → lower latency`
      }
    },

    // ── Clock skew and ordering ──
    {
      speaker: "you",
      text: `"What about time? Can I just use timestamps to order events across services?"`
    },
    {
      speaker: "raj",
      text: `"Dangerously unreliable. Clocks across servers drift — NTP synchronises them periodically but there's always some skew between synchronisations, typically milliseconds to tens of milliseconds. For most purposes that's fine. But consider: event A happens on Server 1 at 10:00:00.005. Event B happens on Server 2 at 10:00:00.003 — Server 2's clock is 3ms ahead. Sorted by timestamp, B appears before A — causally wrong, A actually happened first. Worse: during a leap second or NTP correction, clocks can jump backwards. Now your timestamp ordering inverts completely."`
    },
    {
      speaker: "you",
      text: `"What do you use instead?"`
    },
    {
      speaker: "raj",
      text: `"<em>Logical clocks</em>. A <em>Lamport timestamp</em> is a counter. Each process increments it before every event. When a message is sent, include the current counter. When received, set your counter to max(yours, theirs) + 1. Events are now causally ordered — not by wall clock, but by happens-before relationships. For distributed databases, <em>vector clocks</em> extend this to track causality per-node. For most practical purposes in Node apps — use a snowflake-style ID generator that embeds a timestamp plus a sequence number, or use ULIDs — Universally Unique Lexicographically Sortable Identifiers — which are sortable by insertion time without relying purely on wall clocks."`
    },
    {
      type: "code",
      text: `// ❌ Relying on timestamps for event ordering — unreliable
const events = await Event.find().sort({ createdAt: 1 }); // clock skew = wrong order

// ✅ ULID — sortable, unique, embeds millisecond timestamp + randomness
const { ulid } = require('ulid');
const eventId = ulid();
// '01ARZ3NDEKTSV4RRFFQ69G5FAV' — lexicographically sortable by creation time
// First 10 chars = timestamp, last 16 chars = random
// Safe: if two events happen in same millisecond, random part prevents collision

// ✅ Sequence numbers in a single authoritative source
// One Redis counter as the sequence authority for a stream
const getNextSequence = async (streamName) => {
  return redis.incr('seq:' + streamName); // atomic increment — always monotonic
};

// ✅ Lamport clock — track causality across services
class LamportClock {
  constructor() { this.time = 0; }
  tick()    { return ++this.time; }                          // before sending event
  update(t) { this.time = Math.max(this.time, t) + 1; }     // on receiving event
}

const clock = new LamportClock();

// Sending an event
const event = {
  id:        ulid(),
  type:      'order.created',
  lamport:   clock.tick(), // attach logical time
  payload:   orderData
};
await publish(event);

// Receiving an event
const onEvent = (event) => {
  clock.update(event.lamport); // advance clock based on sender's time
  processEvent(event);
};`
      }
    },

    // ── Bulkhead pattern ──
    {
      speaker: "raj",
      text: `"One more pattern that comes up in senior interviews — the <em>Bulkhead pattern</em>. What happens when one slow dependency monopolises all your resources?"`
    },
    {
      speaker: "you",
      text: `"Everything else slows down too? Because they're sharing the same thread pool or connection pool?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. You have one connection pool of 10 connections shared by all your services. The recommendation service starts timing out at 3 seconds per request. Concurrent recommendation requests pile up, each holding a connection for 3 seconds. All 10 connections are occupied waiting for recommendations. Now your fast order queries — which take 5ms — can't get a connection and start timing out too. One slow service has cascaded to take down everything. Bulkheads partition resources like a ship's hull — a breach in one compartment doesn't flood the whole ship. Separate connection pools, separate thread pools, separate rate limits per dependency. A slow recommendations service can exhaust its own pool without touching orders."`
    },
    {
      type: "code",
      text: `// Bulkhead — separate connection pools per downstream dependency
// Slow or failing service can only exhaust its own pool

// ❌ Shared pool — one slow service starves all others
const sharedPool = mysql.createPool({ connectionLimit: 10 });
// All queries compete for the same 10 connections

// ✅ Isolated pools — each dependency gets its own budget
const ordersPool         = mysql.createPool({ host: DB_HOST, connectionLimit: 8  });
const analyticsPool      = mysql.createPool({ host: DB_HOST, connectionLimit: 4  });
const recommendationsPool = mysql.createPool({ host: RECS_HOST, connectionLimit: 3 });
// Recommendations can be slow/down — orders pool is unaffected

// Concurrency bulkhead — limit concurrent requests per dependency
class Bulkhead {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.active        = 0;
  }

  async execute(fn) {
    if (this.active >= this.maxConcurrent) {
      throw new Error('Bulkhead full — request rejected');
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
    }
  }
}

const recommendationsBulkhead = new Bulkhead(5); // max 5 concurrent calls
const ordersBulkhead          = new Bulkhead(50); // orders get more capacity

app.get('/home', asyncHandler(async (req, res) => {
  const [orders, recommendations] = await Promise.allSettled([
    ordersBulkhead.execute(() => fetchOrders(req.user.userId)),
    recommendationsBulkhead.execute(() => fetchRecommendations(req.user.userId))
    // Recommendations bulkhead full → returns error, not hanging
    // Orders unaffected — uses separate bulkhead
  ]);

  res.json({
    orders:          orders.status === 'fulfilled'          ? orders.value          : [],
    recommendations: recommendations.status === 'fulfilled' ? recommendations.value : []
  });
}));`
      }
    },

    {
      type: "summary",
      points: [
        "Distributed systems have three failure states: succeeded, failed, unknown. Most reliability patterns exist to handle the unknown case.",
        "Idempotency = same operation applied multiple times gives same result. Make POST operations idempotent with client-generated idempotency keys deduplicated in Redis.",
        "Exponential backoff = double delay between retries. Full jitter = randomise the delay. Prevents thundering herd — all clients retrying at once.",
        "Only retry transient errors: timeouts, 429, 503. Never retry 400, 401, 403, 422 — retrying won't change the outcome.",
        "Distributed locks use Redis SET NX EX — atomic, with TTL. Must use Lua script for release to prevent releasing another holder's lock.",
        "Saga pattern = multi-step cross-service operation with compensating transactions for rollback. Orchestration (central coordinator) is easier to debug than choreography.",
        "Transactional Outbox = write event to DB table in same transaction as main write. Relay process publishes to message broker. Prevents lost events on crash.",
        "At-least-once delivery = messages can be processed twice. Make consumers idempotent with deduplication keys. Don't commit offset until processing succeeds.",
        "CAP: during a partition, choose consistency (block writes, prevent divergence) or availability (continue serving, accept staleness). Most systems choose per-operation.",
        "Clock skew means timestamps can't reliably order events across servers. Use ULIDs for sortable IDs, Lamport clocks for causal ordering, sequence numbers for strict monotonic order.",
        "Bulkhead = separate resource pools per dependency. One slow service can only exhaust its own pool — cannot cascade to take down unrelated services."
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────
//  LESSON: Concurrency & Race Conditions
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_CONCURRENCY = {
  category: "Architecture & System Design",
  tag: "Concurrency & Race Conditions",
  title: "When Two Things Happen at Exactly the Wrong Time",
  intro: "The bug report comes in on a Friday. A flash sale ran for 20 minutes and sold 847 units of a product with a stock of 500. The inventory system says -347. Nobody knows how. Raj is already at the whiteboard.",
  scenes: [

    // ── Why concurrency is hard ──
    {
      speaker: "raj",
      text: `"Before we look at the code — why do race conditions happen at all? Node.js is single-threaded. Shouldn't that protect us?"`
    },
    {
      speaker: "you",
      text: `"I thought so too. But they still happen?"`
    },
    {
      speaker: "raj",
      text: `"Node's event loop is single-threaded, yes — so two lines of JavaScript never truly execute simultaneously. But the moment you await anything — a database read, a Redis call, an HTTP request — you yield control. Another request can run while you're waiting. So if request A reads stock as 5, then awaits something, and request B also reads stock as 5 during that gap, both think there are 5 units available. Both proceed. Now you've sold 10 units from a stock of 5. The gap between reading state and writing state is where races live. It doesn't matter that Node is single-threaded — the gap exists across the await boundary."`
    },
    {
      type: "analogy",
      text: "Race condition = two cashiers at the same register. Cashier A checks the drawer — £20 left. Cashier B checks the drawer — £20 left. Both promise a customer change. Both give £20. The drawer is now empty with £20 still owed. Neither cashier did anything wrong individually. The problem was that the check and the act weren't atomic — something could happen between them."
    },

    // ── The check-then-act pattern ──
    {
      speaker: "raj",
      text: `"Show me the code that caused the -347. I already know what it looks like."`
    },
    {
      speaker: "you",
      text: `"Probably something like: read the stock, check if it's enough, then update it?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. <em>Check-then-act</em> — the most common race condition in backend code. Read, decide, write. Three separate operations with gaps between each one. Under normal traffic you'd never see it. Under a flash sale with 500 concurrent requests hitting the same endpoint — you see it immediately. The fix at the database level is to make the check and the write a single atomic operation. MongoDB gives you <em>findOneAndUpdate</em> with a query condition. The condition is the check. If the condition fails, the update doesn't happen. No gap."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// THE RACE — check-then-act, not atomic
// ─────────────────────────────────────────────────────

// ❌ Request A and B both read stock=5, both pass the check,
//    both decrement — stock ends at 3 instead of 5-2=3... or -347
app.post('/api/purchase', asyncHandler(async (req, res) => {
  const { productId, qty } = req.body;

  const product = await Product.findById(productId);   // READ
  //
  //  ← another request runs here during the await gap
  //
  if (product.stock < qty) {                           // CHECK (stale data possible)
    return res.status(409).json({ error: 'Insufficient stock' });
  }

  await Product.findByIdAndUpdate(                     // WRITE (race window here)
    productId,
    { $inc: { stock: -qty } }
  );

  res.json({ success: true });
}));

// ─────────────────────────────────────────────────────
// THE FIX — atomic find-and-update, condition is the check
// ─────────────────────────────────────────────────────

// ✅ One round trip. The check (stock >= qty) and the write ($inc)
//    happen atomically inside MongoDB. No gap. No race.
app.post('/api/purchase', asyncHandler(async (req, res) => {
  const { productId, qty } = req.body;

  const product = await Product.findOneAndUpdate(
    {
      _id:   productId,
      stock: { $gte: qty }    // condition: only update if enough stock
    },
    { $inc: { stock: -qty } }, // atomic decrement
    { new: true }              // return updated doc
  );

  if (!product) {
    // Either product doesn't exist OR stock was insufficient
    return res.status(409).json({ error: 'Insufficient stock' });
  }

  res.json({ success: true, remaining: product.stock });
}));

// Under 500 concurrent requests:
// ✅ Atomic version: exactly qty units sold, stock never goes below 0
// ❌ Non-atomic version: oversell by hundreds during traffic spikes`
    },

    // ── Optimistic locking ──
    {
      speaker: "you",
      text: `"What about cases where the update logic is more complex — I can't fit it all into a single findOneAndUpdate?"`
    },
    {
      speaker: "raj",
      text: `"<em>Optimistic locking</em>. The idea: assume conflicts are rare, so don't lock upfront. Instead, add a version number to every document. When you read, you note the version. When you write, you include the version in your update condition: 'update this document only if the version is still the same as when I read it.' If two requests both read version 3, the first to write succeeds and bumps the version to 4. The second tries to update where version is 3 — that document no longer exists at version 3 — update matches nothing. Zero matched documents tells you there was a conflict. Retry or tell the user."`
    },
    {
      speaker: "you",
      text: `"What kinds of operations actually need this? The atomic $inc covers stock..."`
    },
    {
      speaker: "raj",
      text: `"Any operation where the new value depends on complex logic you can't express as a single MongoDB update operator. Repricing logic with tiered rules. Updating an embedded array where the new state depends on the full current state. Anything where you need to read, apply business logic in application code, then write back — and the read must still be valid when the write happens."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// OPTIMISTIC LOCKING — version field approach
// ─────────────────────────────────────────────────────

// Schema: add a __v version field (Mongoose does this automatically)
// or use an explicit version field for clarity
const OrderSchema = new Schema({
  items:   [{ productId: ObjectId, qty: Number, price: Number }],
  total:   Number,
  status:  String,
  version: { type: Number, default: 0 }  // explicit version counter
});

// The pattern: read → apply logic → write with version check
async function applyComplexPricing(orderId, promoCode) {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // 1. Read current state
    const order = await Order.findById(orderId).lean();
    if (!order) throw new NotFoundError('Order not found');

    // 2. Apply complex business logic in application code
    const discount = await PricingEngine.calculate(order, promoCode);
    const newTotal  = order.total - discount;
    const newItems  = applyLineDiscounts(order.items, promoCode);

    // 3. Write back — only if version hasn't changed
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, version: order.version },   // version must still match
      {
        $set: { total: newTotal, items: newItems },
        $inc: { version: 1 }                       // bump version atomically
      },
      { new: true }
    );

    if (updated) return updated; // ✅ success — no conflict

    // Version mismatch: another request modified the order between our read and write
    // Back off slightly before retrying (avoid thundering herd)
    if (attempt < MAX_RETRIES - 1) {
      await sleep(10 * (attempt + 1)); // 10ms, 20ms, ...
    }
  }

  throw new ConflictError('Could not apply pricing after retries — please try again');
}

// Mongoose's built-in __v field does optimistic locking automatically
// if you use .save() instead of findOneAndUpdate:
const order = await Order.findById(orderId);
order.total = newTotal;
// .save() checks __v automatically and throws VersionError on conflict
try {
  await order.save();
} catch (err) {
  if (err.name === 'VersionError') throw new ConflictError('Concurrent modification');
  throw err;
}`
    },

    // ── MongoDB transactions ──
    {
      speaker: "you",
      text: `"When do I need an actual multi-document transaction rather than atomic single-document operations?"`
    },
    {
      speaker: "raj",
      text: `"When you need multiple documents to change together or not at all. The classic example: moving money between accounts. Debit account A and credit account B. If the debit succeeds but the server crashes before the credit, you've lost money. Without a transaction, you need complex compensation logic to recover. With a transaction, either both happen or neither does. MongoDB supports multi-document ACID transactions on replica sets. The important thing: don't use transactions for everything — they're slower, hold locks, and can cause contention. Use atomic single-document operations whenever possible. Transactions are for when atomicity genuinely spans multiple documents."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// MONGODB TRANSACTIONS — multi-document atomicity
// ─────────────────────────────────────────────────────

// When you need: debit + credit, create order + decrement stock,
// delete record + create audit log — all or nothing

async function transferFunds(fromId, toId, amount) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction({
      readConcern:  { level: 'snapshot' },   // read consistent view
      writeConcern: { w: 'majority' }         // confirmed by majority of replica set
    });

    const fromAccount = await Account.findById(fromId).session(session);
    if (!fromAccount) throw new NotFoundError('Source account not found');
    if (fromAccount.balance < amount) throw new ValidationError('Insufficient funds');

    // Both writes happen inside the same transaction
    await Account.findByIdAndUpdate(
      fromId,
      { $inc: { balance: -amount } },
      { session }                            // must pass session to every operation
    );

    await Account.findByIdAndUpdate(
      toId,
      { $inc: { balance: amount } },
      { session }
    );

    await AuditLog.create([{
      type:      'transfer',
      fromId, toId, amount,
      timestamp: new Date()
    }], { session });                        // audit log is part of the same transaction

    await session.commitTransaction();
    return { success: true };

  } catch (err) {
    await session.abortTransaction();        // rolls back both writes atomically
    throw err;
  } finally {
    session.endSession();                    // always release session
  }
}

// Important: pass { session } to EVERY Mongoose operation inside the transaction
// Missing session on one operation = that operation runs outside the transaction

// ─────────────────────────────────────────────────────
// WHEN NOT TO USE TRANSACTIONS
// ─────────────────────────────────────────────────────

// ✅ Single document — use atomic operators, no transaction needed
await Product.findByIdAndUpdate(id, { $inc: { stock: -1, salesCount: 1 } });

// ✅ Denormalised data — embed instead of linking to avoid cross-doc writes
// Order embeds items instead of referencing them → single-document update

// ❌ Unnecessary transaction — two unrelated updates don't need atomicity
const session = await mongoose.startSession();
session.startTransaction();
await User.findByIdAndUpdate(userId, { lastLogin: new Date() }, { session });
await Analytics.create([{ event: 'login' }], { session });
await session.commitTransaction();
// These don't need to be atomic — just run them separately`
    },

    // ── Two workers, same job ──
    {
      speaker: "raj",
      text: `"Second scenario from the brief. Two background workers pick up the same job from the queue and both process it. Payment is charged twice. How do you prevent it?"`
    },
    {
      speaker: "you",
      text: `"Some kind of lock? Check if it's already being processed?"`
    },
    {
      speaker: "raj",
      text: `"Two approaches. The reliable one for job queues: <em>atomic job claiming</em>. The worker doesn't just read the job — it atomically changes the job's status from 'pending' to 'processing' as part of the read. If two workers try simultaneously, only one will match the 'pending' condition and get the job. The other gets nothing and moves on. This is exactly what good job queue libraries like BullMQ do internally — they use Redis commands that are atomic at the Redis layer. The second approach: database-level locking with SELECT FOR UPDATE in Postgres or findOneAndUpdate in MongoDB. Same idea — claim atomically or don't claim at all."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// ATOMIC JOB CLAIMING — two workers, only one wins
// ─────────────────────────────────────────────────────

// ❌ Non-atomic: read then update — race window between the two
const job = await Job.findOne({ status: 'pending' });
if (job) {
  await Job.findByIdAndUpdate(job._id, { status: 'processing' });
  // Two workers both find the same 'pending' job, both update it,
  // both process it — duplicate work, double charge
}

// ✅ Atomic claim: find-pending-and-set-processing in one operation
async function claimNextJob(workerId) {
  return Job.findOneAndUpdate(
    {
      status:         'pending',
      // Also handle stuck jobs: re-claim if processing for > 5 minutes
      $or: [
        { status: 'pending' },
        { status: 'processing', claimedAt: { $lt: new Date(Date.now() - 5 * 60_000) } }
      ]
    },
    {
      $set: {
        status:    'processing',
        workerId,
        claimedAt: new Date()
      }
    },
    {
      sort:    { priority: -1, createdAt: 1 }, // highest priority, oldest first
      new:     true
    }
  );
}

// Worker loop
async function runWorker(workerId) {
  while (true) {
    const job = await claimNextJob(workerId);

    if (!job) {
      await sleep(1000); // no jobs available — poll again in 1s
      continue;
    }

    try {
      await processJob(job);
      await Job.findByIdAndUpdate(job._id, { status: 'completed', completedAt: new Date() });
    } catch (err) {
      await Job.findByIdAndUpdate(job._id, {
        status:     job.attempts >= 3 ? 'failed' : 'pending', // retry up to 3 times
        $inc:       { attempts: 1 },
        lastError:  err.message,
        claimedAt:  null  // release the claim so another worker can retry
      });
    }
  }
}

// ─────────────────────────────────────────────────────
// BULLMQ — production job queues handle this automatically
// ─────────────────────────────────────────────────────
const { Queue, Worker } = require('bullmq');

const paymentQueue = new Queue('payments', { connection: redisConnection });

// Add job — BullMQ guarantees at-most-once processing with NACK support
await paymentQueue.add('charge', { userId, amount, orderId }, {
  jobId:    orderId,           // deterministic ID = deduplication key
  attempts: 3,
  backoff:  { type: 'exponential', delay: 2000 }
});

// Worker — BullMQ uses Redis atomic ZPOPMIN under the hood
const worker = new Worker('payments', async (job) => {
  await chargePayment(job.data);
}, { connection: redisConnection, concurrency: 5 });`
    },

    // ── Payment sent twice ──
    {
      speaker: "you",
      text: `"Third scenario: the same payment request is sent twice. Network retry, user double-clicks, whatever. How do you make sure the charge only happens once?"`
    },
    {
      speaker: "raj",
      text: `"<em>Idempotency keys</em> at the application layer — but let me be specific about how you implement them at the DB level. The client generates a unique key for each logical payment attempt — not each HTTP request. On the server, before charging, you try to atomically insert a record with that idempotency key. If the insert succeeds, proceed with the charge and record the result against that key. If the insert fails with a duplicate key error, the payment already happened — return the stored result without charging again. The key insight: the idempotency record must be written in the same transaction as the charge record, or in an atomic step that makes it impossible for a charge to exist without its idempotency record."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// IDEMPOTENCY KEY — charge exactly once regardless of retries
// ─────────────────────────────────────────────────────

const IdempotencyKeySchema = new Schema({
  key:       { type: String, unique: true, index: true },  // unique constraint
  result:    Schema.Types.Mixed,   // cached response
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL: 24 hours
});

app.post('/api/payments', asyncHandler(async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) throw new ValidationError('Idempotency-Key header required');

  // ── Step 1: Try to claim this key atomically ──
  // If two identical requests arrive simultaneously, only one insert wins.
  // The loser gets a duplicate key error and returns the cached result.

  let record;
  try {
    record = await IdempotencyKey.create({ key: idempotencyKey, result: null });
  } catch (err) {
    if (err.code === 11000) {  // MongoDB duplicate key error
      // Already processed — return the cached result
      const existing = await IdempotencyKey.findOne({ key: idempotencyKey });
      if (existing?.result) return res.status(200).json(existing.result);
      // Still in-flight (result is null): another request is processing it right now
      return res.status(409).json({ error: 'Duplicate request — try again shortly' });
    }
    throw err;
  }

  // ── Step 2: Process the payment ──
  try {
    const charge = await stripe.charges.create({
      amount:   req.body.amount,
      currency: 'usd',
      source:   req.body.token
    });

    const result = { chargeId: charge.id, status: 'success', amount: charge.amount };

    // ── Step 3: Store result against the key ──
    await IdempotencyKey.findByIdAndUpdate(record._id, { result });

    res.json(result);

  } catch (err) {
    // Payment failed — remove the key so the client can retry with the same key
    await IdempotencyKey.findByIdAndDelete(record._id);
    throw err;
  }
}));

// Client side — generate key per logical operation, not per request
// Same key must be reused on retries of the same operation
const idempotencyKey = \`payment-\${orderId}-\${userId}\`; // deterministic
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: { 'Idempotency-Key': idempotencyKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount, token })
});`
    },

    // ── Read-your-writes / replica lag ──
    {
      speaker: "you",
      text: `"One more: a user updates their profile and immediately refreshes — they see the old data. We're using a MongoDB replica set. What's happening?"`
    },
    {
      speaker: "raj",
      text: `"<em>Replica lag</em> combined with <em>read preference</em>. Your writes go to the primary. But reads are configured with <em>secondaryPreferred</em> — or just <em>secondary</em> — to spread the load. There's typically 10 to 100 milliseconds of replication lag between the primary and secondaries. The user writes to the primary, then immediately reads from a secondary that hasn't replicated yet. They see the old value. Three fixes, in order of preference: use <em>read-after-write consistency</em> — read from the primary for at least a short window after a write. Or send a <em>causally consistent session token</em> — MongoDB can track the last operation time and guarantee a read sees at least that state. Or for UI-only staleness, optimistically update the client without waiting for the read."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// READ-YOUR-WRITES — three approaches
// ─────────────────────────────────────────────────────

// Approach 1: Read from primary after write (simplest)
// On write endpoints, force primary read for the response
app.put('/api/users/:id', asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, req.body);

  // Read back from primary to confirm and return updated state
  const updated = await User.findById(req.params.id)
    .read('primary');  // Mongoose read preference for this query only

  res.json(updated);
}));

// Approach 2: Causal consistency session
// MongoDB tracks operation timestamps; session guarantees a read sees
// all writes that happened before it in the same session
app.put('/api/users/:id', asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, session }
    );
    await session.commitTransaction();

    // Any subsequent read in this session is guaranteed to see the write
    res.json(updated);
  } finally {
    session.endSession();
  }
}));

// Approach 3: Set read preference strategically
// Don't use secondaryPreferred globally — only for truly stale-ok reads
mongoose.connection.set('readPreference', 'primaryPreferred');
// primaryPreferred: reads from primary, falls back to secondary only if primary unavailable
// This is safer than secondaryPreferred for most apps

// Per-query override for read-heavy analytics (stale data acceptable)
const stats = await Order.find({ createdAt: { $gte: last30Days } })
  .read('secondaryPreferred')   // analytics can be slightly stale
  .lean();`
    },

    // ── Recognising race conditions in interviews ──
    {
      speaker: "raj",
      text: `"When an interviewer gives you a concurrency scenario, what's the framework you use to think through it?"`
    },
    {
      speaker: "you",
      text: `"Look for a gap between reading state and writing it?"`
    },
    {
      speaker: "raj",
      text: `"That's the core pattern, yes. Ask yourself: what is the shared state? Who can read it? Who can write it? Is the read and the write atomic, or is there a gap? What happens if two operations interleave at that gap? Then ask: what's the consequence — data loss, double charge, oversell, stale read? The severity shapes the fix. Minor UI staleness — optimistic update is fine. Money — you need atomicity at the database level or a distributed lock. Duplicate job processing — atomic claim or idempotency. And always ask: is a lock actually necessary, or can I redesign the operation to be inherently atomic? Locks are a last resort — they create contention, they can deadlock, and they don't scale. An atomic database operation or an idempotent design is almost always cleaner."`
    },

    {
      type: "summary",
      points: [
        "Node is single-threaded but races still happen: the await gap between reading state and writing it is where two requests interleave.",
        "Check-then-act is the most common pattern: read stock, check sufficiency, decrement. Not atomic. Fix: findOneAndUpdate with the check as the query condition.",
        "Optimistic locking: add a version field, include it in the update condition, retry on version mismatch. Use when logic is too complex for a single update operator.",
        "MongoDB transactions: multi-document atomicity for operations that must succeed or fail together (debit + credit, order + stock). Pass { session } to every operation inside.",
        "Atomic job claiming: change status from pending → processing as part of the read. Only the worker whose update matched gets the job. BullMQ does this automatically with Redis.",
        "Idempotency keys: atomically insert a key record before charging. Duplicate key error = already processed, return cached result. Delete key on failure so retries work.",
        "Replica lag + secondaryPreferred = read-your-writes failure. Fix: read from primary after a write, use causal consistency sessions, or use primaryPreferred as default.",
        "Interview framework: identify shared state → find the read/write gap → determine consequence severity → choose the lightest fix that guarantees correctness.",
        "Prefer atomic DB operations and idempotent design over locks. Locks create contention, can deadlock, and hurt throughput under load."
      ]
    }
  ]
};

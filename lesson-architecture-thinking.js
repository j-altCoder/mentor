// ─────────────────────────────────────────────────────────────────
//  LESSON: Architecture Thinking
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_ARCHITECTURE_THINKING = {
  category: "Architecture & System Design",
  tag: "Architecture Thinking",
  title: "How to Design a System You've Never Built Before",
  intro: "Raj caps his pen and puts it down. No laptop, no code editor. He slides a blank piece of paper across. 'New requirement came in this morning,' he says. 'We need to send a notification — push, email, or SMS — to every user on a specific date and time. Could be ten thousand users. Could be ten million.' He taps the paper. 'Design it.'",
  scenes: [

    // ── How to approach system design ──
    {
      speaker: "raj",
      text: `"Before you draw a single box — what's the first thing you do?"`
    },
    {
      speaker: "you",
      text: `"Ask questions? Clarify the requirements?"`
    },
    {
      speaker: "raj",
      text: `"What questions specifically? Don't just say 'clarify requirements' — that's not an answer, it's a category. What do you actually need to know before you can design anything?"`
    },
    {
      speaker: "you",
      text: `"Scale — how many users, how many notifications per day. Latency — does it need to be exactly on time or within a window? And channels — push, email, SMS have completely different delivery mechanisms."`
    },
    {
      speaker: "raj",
      text: `"Good. There are four things I always pin down before I draw a single box. Scale — orders of magnitude matter. A system for 10,000 users is architecturally different from one for 10 million. Timing precision — 'at 9am' could mean exactly 9:00:00 or anywhere between 8:55 and 9:05. That changes the entire queueing design. Failure tolerance — is a missed notification a minor inconvenience or a compliance violation? A bank's regulatory notice has different failure requirements than a marketing campaign. And idempotency — if something goes wrong and we retry, do users get the notification twice? That's often worse than not getting it at all. Pin these four down. Then draw boxes."`
    },
    {
      type: "analogy",
      text: "System design is architecture, not construction. A builder who starts pouring concrete before seeing the blueprints is going to tear it all down. The questions aren't stalling — they're the design. The constraints you uncover in the first five minutes determine every decision for the next hour. An interviewer who sees you ask sharp questions is watching you think like an engineer, not a coder."
    },

    // ── High-level design ──
    {
      speaker: "raj",
      text: `"Okay. Ten million users. Timing window of plus or minus five minutes is acceptable. A missed notification is bad but not catastrophic — we retry once. Duplicates are a problem — users complain. Now design it."`
    },
    {
      speaker: "you",
      text: `"We need something to schedule the send, something to actually do the sending, and somewhere to store what was sent."`
    },
    {
      speaker: "raj",
      text: `"Three components — scheduler, workers, storage. That's the right decomposition. Talk me through each one. Start with how you'd trigger the send at the right time."`
    },
    {
      speaker: "you",
      text: `"A cron job that runs every minute, finds notifications due in the next batch, and puts them in a queue?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. The scheduler's job is narrow: wake up periodically, find notifications whose scheduled time has arrived, enqueue them. Nothing else. It doesn't send — it queues. This separation matters because queuing is fast and reliable, but actual delivery is slow and fragile. Email providers have rate limits. Push notification services go down. SMS is expensive. If the scheduler tried to do the sending synchronously, one slow channel would back up everything. The queue decouples the scheduling from the delivery so they can fail and scale independently."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// HIGH-LEVEL DESIGN — THREE COMPONENTS
// ─────────────────────────────────────────────────────

// ── 1. Notifications table (MongoDB / Postgres) ──
// Stores what should be sent, to whom, when, and current status
{
  _id:           ObjectId,
  userId:        String,
  channel:       'push' | 'email' | 'sms',
  message:       { title: String, body: String },
  scheduledAt:   Date,          // when to send
  status:        'pending' | 'queued' | 'sent' | 'failed',
  sentAt:        Date | null,
  attempts:      Number,        // retry counter
  idempotencyKey: String,       // unique per notification — prevents duplicates
}

// Index for the scheduler query:
// db.notifications.createIndex({ status: 1, scheduledAt: 1 })

// ── 2. Scheduler (runs every minute via cron or BullMQ repeatable job) ──
const schedulerJob = async () => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60_000); // next 60 seconds

  // Atomically claim a batch — prevents multiple scheduler instances
  // from picking up the same notifications
  const notifications = await Notification.find({
    status:      'pending',
    scheduledAt: { $lte: windowEnd },
  })
  .limit(10_000)   // cap batch size
  .lean();

  // Mark as queued before enqueuing — if we crash mid-batch,
  // a recovery job can re-claim anything stuck in 'pending' too long
  const ids = notifications.map(n => n._id);
  await Notification.updateMany(
    { _id: { $in: ids } },
    { $set: { status: 'queued' } }
  );

  // Enqueue each notification as a job
  await notificationQueue.addBulk(
    notifications.map(n => ({
      name: n.channel,
      data: n,
      opts: {
        jobId:    n.idempotencyKey, // BullMQ deduplicates by jobId
        attempts: 3,
        backoff:  { type: 'exponential', delay: 5000 },
      },
    }))
  );
};

// ── 3. Workers (scaled horizontally) ──
// Each worker pulls jobs from the queue and delivers them
notificationQueue.process('email', async (job) => {
  await emailProvider.send({
    to:      job.data.userId,
    subject: job.data.message.title,
    body:    job.data.message.body,
  });
  await Notification.updateOne(
    { _id: job.data._id },
    { $set: { status: 'sent', sentAt: new Date() } }
  );
});`
    },

    // ── Storage ──
    {
      speaker: "raj",
      text: `"How are you storing the notifications? Walk me through the schema decisions."`
    },
    {
      speaker: "you",
      text: `"A notifications table with the user, channel, message, scheduled time, and a status field."`
    },
    {
      speaker: "raj",
      text: `"What do you index?"`
    },
    {
      speaker: "you",
      text: `"Status and scheduledAt — that's what the scheduler queries on."`
    },
    {
      speaker: "raj",
      text: `"Right. Compound index on (status, scheduledAt). Without it, the scheduler scans the entire table every minute. At ten million rows that's a full table scan per minute — your database is burning for no reason. What happens to old notifications? You sent them six months ago. They're still sitting in the table as 'sent'."`
    },
    {
      speaker: "you",
      text: `"Archive or delete them?"`
    },
    {
      speaker: "raj",
      text: `"Both. Archive to cold storage — S3, a data warehouse — if you need them for audit or analytics. Delete from the live table after, say, 90 days. The live table should stay small. A table with only pending and recently-sent notifications is fast. A table with 18 months of history for 10 million users is slow regardless of indexes. Data lifecycle is part of the schema design, not an afterthought."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// STORAGE — SCHEMA, INDEXES, AND DATA LIFECYCLE
// ─────────────────────────────────────────────────────

// ── Compound index — critical for scheduler performance ──
// Without: full table scan every minute → DB on fire
// With: index seek, microseconds
db.notifications.createIndex(
  { status: 1, scheduledAt: 1 },
  { name: 'scheduler_query' }
);

// Per-user lookup (user's notification history):
db.notifications.createIndex({ userId: 1, scheduledAt: -1 });

// ── Idempotency key — unique constraint prevents duplicates at DB level ──
db.notifications.createIndex(
  { idempotencyKey: 1 },
  { unique: true }
);
// If the same notification is inserted twice, DB rejects the second — no duplicate

// ── Partitioning strategy for scale ──
// Option A: time-based partitioning (Postgres PARTITION BY RANGE)
// Partition by scheduledAt month — old partitions become inactive, fast to drop
// CREATE TABLE notifications_2024_01 PARTITION OF notifications
//   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

// Option B: MongoDB TTL index — auto-delete sent notifications after 90 days
db.notifications.createIndex(
  { sentAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 } // 90 days
);
// Documents with sentAt set get automatically deleted by MongoDB
// Pending/queued notifications have no sentAt → never expire

// ── Archive before delete (for audit trail) ──
const archiveAndClean = async () => {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const old = await Notification.find({
    status: 'sent',
    sentAt: { $lt: cutoff }
  }).lean();

  if (old.length === 0) return;

  // Write to S3 / data warehouse
  await s3.putObject({
    Bucket: 'notifications-archive',
    Key:    \`archive/\${new Date().toISOString().slice(0,10)}.json\`,
    Body:   JSON.stringify(old),
  });

  // Delete from live table
  await Notification.deleteMany({
    _id: { $in: old.map(n => n._id) }
  });
};`
    },

    // ── Avoiding duplicates ──
    {
      speaker: "raj",
      text: `"Duplicates. You said users complain when they get the same notification twice. How do you make sure it can't happen?"`
    },
    {
      speaker: "you",
      text: `"Track what's been sent? Check before sending?"`
    },
    {
      speaker: "raj",
      text: `"Check-then-act — we talked about that in the concurrency lesson. Two workers can both check, both see 'not sent yet', both send. The check and the send have to be atomic, or you need to make the send itself idempotent. Walk me through how you'd do that here."`
    },
    {
      speaker: "you",
      text: `"An idempotency key on the notification — unique per notification. If we try to insert or process a duplicate, the unique constraint rejects it."`
    },
    {
      speaker: "raj",
      text: `"That handles storage-level duplicates. What about at the queue level? Your scheduler crashes mid-batch. It restarts and re-enqueues the same notifications. Now they're in the queue twice."`
    },
    {
      speaker: "you",
      text: `"BullMQ lets you set a jobId — if you try to add a job with the same jobId it's deduplicated."`
    },
    {
      speaker: "raj",
      text: `"Right. Three layers of deduplication: unique constraint in the database, jobId deduplication in the queue, and idempotent delivery at the worker level — use the notification's _id as the idempotency key when calling the email or SMS provider. Most providers accept an idempotency key and deduplicate on their end too. Any one of those three layers is enough for most failures. All three together means a notification only goes out once even if your system crashes, restarts, and retries multiple times."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// AVOIDING DUPLICATES — THREE LAYERS
// ─────────────────────────────────────────────────────

// ── Layer 1: DB unique constraint ──
// idempotencyKey is unique in the notifications collection
// Generating it: hash of (userId + campaignId + channel)
const idempotencyKey = crypto
  .createHash('sha256')
  .update(\`\${userId}:\${campaignId}:\${channel}\`)
  .digest('hex');

// Upsert — if key exists, no-op. If not, insert.
await Notification.updateOne(
  { idempotencyKey },
  { $setOnInsert: { userId, channel, message, scheduledAt, status: 'pending' } },
  { upsert: true }
);
// Duplicate insert → upsert finds existing doc, $setOnInsert does nothing

// ── Layer 2: Queue deduplication (BullMQ jobId) ──
await notificationQueue.add(
  'email',
  notificationData,
  {
    jobId: notification.idempotencyKey, // same jobId = deduplicated
    // If a job with this jobId is already in waiting/delayed/active state,
    // BullMQ silently discards the duplicate add
  }
);

// ── Layer 3: Atomic status update before delivery ──
// Worker claims the notification atomically before sending
// If two workers both pick up the same job, only one can claim it
const claimed = await Notification.findOneAndUpdate(
  {
    _id:    notification._id,
    status: 'queued',           // only claim if still queued
  },
  { $set: { status: 'sending', claimedAt: new Date() } },
  { returnDocument: 'after' }
);

if (!claimed) {
  // Another worker already claimed it — skip
  return;
}

// Now safe to send — only one worker reaches this point
await emailProvider.send({
  idempotencyKey: notification.idempotencyKey, // provider deduplicates too
  to:             notification.userId,
  body:           notification.message.body,
});

await Notification.updateOne(
  { _id: notification._id },
  { $set: { status: 'sent', sentAt: new Date() } }
);`
    },

    // ── Scaling workers ──
    {
      speaker: "raj",
      text: `"Ten million notifications scheduled for 9am Monday — a campaign. How do you make sure they all go out close to 9am without a single worker taking until noon to finish?"`
    },
    {
      speaker: "you",
      text: `"Scale the workers horizontally — run more of them so more notifications are processed in parallel."`
    },
    {
      speaker: "raj",
      text: `"How many workers?"`
    },
    {
      speaker: "you",
      text: `"Depends on the throughput of each channel? Email providers have rate limits..."`
    },
    {
      speaker: "raj",
      text: `"Exactly. The bottleneck isn't your workers — it's the downstream channel. SendGrid might give you 100 requests per second. Twilio SMS might give you 1,000 per second. Push notifications via FCM can handle 500 per second per connection. You size your worker count to the rate limit of the provider, not to your CPU count. More workers than the provider allows just means more workers sitting in rate-limit backoff. Different channels should also have separate worker queues so a slow email provider doesn't back up push notifications."`
    },
    {
      speaker: "you",
      text: `"What about the scheduler itself? If it only runs once a minute it can't enqueue 10 million jobs in one batch."`
    },
    {
      speaker: "raj",
      text: `"Good catch. Two options. Cursor-based batching: the scheduler runs, grabs 10,000 due notifications, enqueues them, grabs the next 10,000, and so on until the batch is done — all within one scheduler tick. Or pre-warming: the night before the campaign, a separate job pre-enqueues all the scheduled notifications with a delayed timestamp in BullMQ. By 9am they're already in the queue and workers just drain them. Pre-warming is the better pattern for known large campaigns — the scheduler becomes just a safety net for ad-hoc notifications, not the critical path for millions of jobs."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SCALING WORKERS — QUEUES PER CHANNEL + RATE LIMITS
// ─────────────────────────────────────────────────────

// ── Separate queue per channel — independent scaling ──
const emailQueue = new Queue('notifications:email',    { connection: redis });
const pushQueue  = new Queue('notifications:push',     { connection: redis });
const smsQueue   = new Queue('notifications:sms',      { connection: redis });

// Each channel has its own worker pool sized to provider rate limits
// Email: SendGrid at 100 rps → 10 workers × 10 rps each
// Push:  FCM at 500 rps     → 5 workers × 100 rps each
// SMS:   Twilio at 100 rps  → 2 workers × 50 rps each

const emailWorker = new Worker('notifications:email', sendEmail, {
  connection:  redis,
  concurrency: 10,    // 10 jobs processed simultaneously per worker process
  limiter: {
    max:      100,    // max 100 jobs per duration window
    duration: 1000,   // per 1 second — matches SendGrid rate limit
  },
});

// ── Cursor-based batching in the scheduler ──
const schedulerJob = async () => {
  const now = new Date();
  let lastId = null;
  let totalEnqueued = 0;

  while (true) {
    const query = {
      status:      'pending',
      scheduledAt: { $lte: now },
      ...(lastId && { _id: { $gt: lastId } }), // cursor — pick up where we left off
    };

    const batch = await Notification.find(query)
      .sort({ _id: 1 })
      .limit(5000)
      .lean();

    if (batch.length === 0) break;

    await enqueueAll(batch);
    totalEnqueued += batch.length;
    lastId = batch[batch.length - 1]._id;

    logger.info({ event: 'scheduler_batch', totalEnqueued });
  }
};

// ── Pre-warming for known large campaigns ──
// Run this the night before a large scheduled campaign
const prewarmCampaign = async (campaignId, scheduledAt) => {
  const notifications = await Notification.find({
    campaignId, status: 'pending', scheduledAt,
  }).lean();

  const delay = scheduledAt.getTime() - Date.now();

  await notificationQueue.addBulk(
    notifications.map(n => ({
      name: n.channel,
      data: n,
      opts: {
        jobId: n.idempotencyKey,
        delay, // BullMQ holds the job until scheduledAt, then makes it active
      },
    }))
  );

  logger.info({
    event:    'campaign_prewarmed',
    campaignId,
    count:    notifications.length,
    sendAt:   scheduledAt,
  });
};`
    },

    // ── Failure handling ──
    {
      speaker: "raj",
      text: `"SendGrid goes down at 9:03am, right in the middle of the campaign. What happens?"`
    },
    {
      speaker: "you",
      text: `"The email jobs fail. BullMQ retries with backoff?"`
    },
    {
      speaker: "raj",
      text: `"Right — if you've configured it. Jobs fail, go into a retry queue, wait for exponential backoff, try again. If SendGrid comes back at 9:15, the retried jobs succeed. Users get the notification 12 minutes late — acceptable within your five-minute-ish tolerance. What if SendGrid is down for the whole day?"`
    },
    {
      speaker: "you",
      text: `"Jobs exhaust their retries and go into the failed queue?"`
    },
    {
      speaker: "raj",
      text: `"Which means you need a failed-job recovery process — something that periodically looks at failed jobs, assesses if the reason is still valid, and requeues them. Or, for truly critical notifications, a fallback channel: if email fails after N attempts, try push notification instead. The architecture decision is how much failure tolerance the business actually needs. A marketing campaign can tolerate 2% failure. A password reset cannot. Design to the actual requirement, not to a theoretical perfect system. And tell the interviewer that — showing you're thinking about cost and tradeoffs is what separates architecture thinking from engineering thinking."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// FAILURE HANDLING — RETRIES, FALLBACK, RECOVERY
// ─────────────────────────────────────────────────────

// ── Retry with exponential backoff ──
const worker = new Worker('notifications:email', sendEmail, {
  connection: redis,
  concurrency: 10,
});

// Job-level retry config (set when adding to queue)
await emailQueue.add('send', notification, {
  attempts: 5,                             // try up to 5 times total
  backoff: {
    type:  'exponential',
    delay: 2000,                           // 2s, 4s, 8s, 16s, 32s
  },
  removeOnComplete: true,
  removeOnFail:     false,                 // keep failed jobs for inspection
});

// ── Failed job recovery — re-queue after provider outage ──
const recoverFailedJobs = async () => {
  const failed = await emailQueue.getFailed();

  for (const job of failed) {
    const isRetriable = job.failedReason?.includes('ECONNREFUSED')
                     || job.failedReason?.includes('rate limit');

    if (isRetriable) {
      await job.retry(); // put back into active queue
    } else {
      // Permanent failure (invalid email, unsubscribed) — mark and skip
      await Notification.updateOne(
        { _id: job.data._id },
        { $set: { status: 'failed', failedReason: job.failedReason } }
      );
    }
  }
};

// ── Channel fallback — email → push if email keeps failing ──
const sendWithFallback = async (notification) => {
  try {
    await emailProvider.send(notification);
    await Notification.updateOne(
      { _id: notification._id },
      { $set: { status: 'sent', channel: 'email', sentAt: new Date() } }
    );
  } catch (err) {
    logger.warn({ event: 'email_failed_falling_back', id: notification._id });

    // Try push as fallback
    await pushQueue.add('send', {
      ...notification,
      channel:        'push',
      idempotencyKey: notification.idempotencyKey + ':push-fallback',
    });
  }
};

// ── Observability — know what's happening during a large send ──
setInterval(async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
  ]);

  metrics.gauge('notifications.email.waiting',   waiting);
  metrics.gauge('notifications.email.active',    active);
  metrics.gauge('notifications.email.completed', completed);
  metrics.gauge('notifications.email.failed',    failed);

  const totalDue     = waiting + active + completed + failed;
  const failureRate  = totalDue ? failed / totalDue : 0;

  if (failureRate > 0.05) { // alert if more than 5% failing
    logger.error({ event: 'high_notification_failure_rate', failureRate });
  }
}, 10_000);`
    },

    // ── The interviewer's real question ──
    {
      speaker: "raj",
      text: `"You've been drawing boxes and talking queues for twenty minutes. What is the interviewer actually testing when they ask this question?"`
    },
    {
      speaker: "you",
      text: `"Whether I can design something that scales?"`
    },
    {
      speaker: "raj",
      text: `"Partly. But more specifically: can you decompose a vague requirement into components with clear boundaries, can you identify where failures happen and what to do about them, and can you reason about tradeoffs without needing a textbook answer. They're not expecting you to produce a production-ready system in 45 minutes. They're watching how you think. Do you ask clarifying questions before designing? Do you start with a simple version and layer complexity? Do you name the tradeoffs explicitly — 'this is simpler but won't handle X' — instead of pretending every decision is obviously correct? That last one is the most important. The engineer who says 'I'd use a queue here because it decouples scheduling from delivery, which means they can fail and scale independently, but it adds operational complexity' is far more impressive than the one who says 'use a queue' with no explanation."`
    },
    {
      type: "analogy",
      text: "Architecture interviews are not about the answer. They're about the reasoning out loud. The interviewer already knows how to build a notification system — they live in the codebase. They're watching whether you structure your thinking, acknowledge unknowns, make tradeoffs explicit, and course-correct when they push back. A candidate who draws a perfect diagram in silence is less impressive than one who draws a mediocre diagram while explaining every decision and its cost."
    },

    {
      type: "summary",
      points: [
        "Before drawing a single box: pin down scale, timing precision, failure tolerance, and idempotency requirements. These four constraints determine every architectural decision. 'Clarify requirements' is not an answer — knowing which questions to ask is.",
        "The three components of a notification system: scheduler (find what's due, enqueue it), queue (decouple scheduling from delivery), workers (deliver via each channel). Each component can fail and scale independently.",
        "The scheduler should only enqueue — never send synchronously. Queuing is fast and reliable. Actual delivery is slow and fragile. Decoupling them is the core architectural insight.",
        "Storage: compound index on (status, scheduledAt) for the scheduler query. Unique constraint on idempotencyKey. TTL index or time-based partitioning to keep the live table small. Archive before deleting.",
        "Three layers of deduplication: unique DB constraint, jobId deduplication in BullMQ, atomic status claim before delivery. Each layer handles a different failure scenario. All three together means a notification fires exactly once through crashes and retries.",
        "Scale workers to the downstream provider's rate limit, not to CPU. Different channels need separate queues — a slow email provider shouldn't block push notifications. Pre-warm large campaigns the night before by adding delayed jobs to the queue.",
        "Failure handling: exponential backoff retry for transient provider failures. Failed-job recovery process for sustained outages. Channel fallback (email → push) for truly critical notifications. Design to the actual failure tolerance the business needs.",
        "In architecture interviews, reasoning out loud beats a perfect diagram in silence. Name every tradeoff explicitly: 'this is simpler but won't handle X.' The interviewer knows the answer — they're watching how you think."
      ]
    }
  ]
};

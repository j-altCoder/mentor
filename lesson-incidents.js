// ─────────────────────────────────────────────────────────────────
//  LESSON: Production Incident Response
//  Category: Security & Production Operations
// ─────────────────────────────────────────────────────────────────

const LESSON_INCIDENTS = {
  category: "Security & Production Operations",
  tag: "Production Incident Response",
  title: "Stay Calm, Stop the Bleeding, Then Find the Wound",
  intro: "It's 11:47pm. PagerDuty fires. Your phone lights up. The on-call rotation landed on you three weeks into the job. Raj is already on the Slack bridge. 'You've got this,' he types. 'Walk me through what you do first.'",
  scenes: [

    // ── The incident mindset ──
    {
      speaker: "raj",
      text: `"Before anything else — what's the most important thing to understand about incident response that most engineers get wrong?"`
    },
    {
      speaker: "you",
      text: `"Finding the root cause as fast as possible?"`
    },
    {
      speaker: "raj",
      text: `"That's what feels right, but it's wrong. The priority order is: <em>mitigate first, investigate second</em>. Users are experiencing pain right now. Every minute you spend doing archaeology while the site is down costs real money and real trust. If rolling back the last deployment stops the bleeding in two minutes, you roll back — even if you're not certain it's the cause. You can investigate why after users are unblocked. The engineer who spends 40 minutes finding the root cause while the site stays down made the wrong call. Mitigate first. Understand why later."`
    },
    {
      type: "analogy",
      text: "Incident response = trauma medicine. When a patient arrives bleeding, the doctor doesn't start with a full diagnosis. They apply pressure to stop the bleeding first — that's mitigation. Then they stabilise — that's the immediate fix. Then, once the patient is out of danger, they do the full workup to understand what happened. Root cause analysis is the post-surgery debrief, not the emergency room procedure."
    },

    // ── The four phases ──
    {
      speaker: "raj",
      text: `"Give me the four phases of incident response in order."`
    },
    {
      speaker: "you",
      text: `"Detect, respond, fix, postmortem?"`
    },
    {
      speaker: "raj",
      text: `"Close. <em>Triage, mitigate, resolve, review.</em> Triage: understand scope and severity in the first two minutes — what's broken, who's affected, is it getting worse? Mitigate: stop the bleeding — rollback, circuit breaker, kill switch, disable a feature. This doesn't fix the root cause, it limits the damage. Resolve: find and fix the root cause, verify the fix, restore full service. Review: blameless postmortem — timeline, impact, root cause, action items. Most engineers skip triage and jump to resolve. That's the mistake. Two minutes of triage saves you from spending an hour fixing the wrong thing."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// THE INCIDENT RESPONSE FRAMEWORK
// ─────────────────────────────────────────────────────

// ── Phase 1: TRIAGE (target: < 2 minutes) ──
// Answer these questions before touching anything:
//
// 1. What is broken?           → dashboard, specific endpoint, full site?
// 2. When did it start?        → correlate with deploys, traffic spikes, cron jobs
// 3. How many users affected?  → 1 user, 1%, all users?
// 4. Is it getting worse?      → error rate climbing or stable?
// 5. What changed recently?    → deployment in last 2 hours? config change? cron?

// Triage output: a one-line summary
// "Checkout endpoint returning 500s for all users since 23:44,
//  correlates with deployment at 23:41. Error rate: 34% and climbing."

// ── Phase 2: MITIGATE (target: < 5 minutes from detection) ──
// The fastest action that stops users being hurt — even if it's not the fix.
// Mitigation options (in order of speed):
const mitigationPlaybook = [
  { action: 'Roll back last deployment',         when: 'Incident started after a deploy',              risk: 'low'    },
  { action: 'Disable feature flag',              when: 'New feature was recently enabled',             risk: 'low'    },
  { action: 'Restart crashing processes',        when: 'OOM or deadlock — restart buys time',         risk: 'medium' },
  { action: 'Scale up horizontally',             when: 'Traffic spike causing resource exhaustion',   risk: 'low'    },
  { action: 'Enable circuit breaker',            when: 'Slow dependency causing cascade failure',     risk: 'medium' },
  { action: 'Serve cached/static fallback',      when: 'DB down — serve last known good state',       risk: 'medium' },
  { action: 'Block traffic from bad actor',      when: 'DDoS or scraper causing overload',            risk: 'low'    },
  { action: 'Increase timeout / retry budgets',  when: 'Transient network issue — buying time',       risk: 'medium' },
];

// ── Phase 3: RESOLVE (after users are unblocked) ──
// Now find the root cause with proper investigation.
// Root cause is not always what mitigation implied.

// ── Phase 4: REVIEW (within 48 hours) ──
// Blameless postmortem. See the postmortem template in the Debugging lesson.`
    },

    // ── Scenario 1: CPU at 100% ──
    {
      speaker: "raj",
      text: `"First scenario. Production server CPU hits 100%. What do you do, in order?"`
    },
    {
      speaker: "you",
      text: `"Check what process is using CPU, see if it's our app or something else..."`
    },
    {
      speaker: "raj",
      text: `"Good start. But first: is this one server or all servers? One server could be a fluke — restart it and monitor. All servers means something systematic is consuming CPU across the fleet. That's a code problem or a traffic problem, and restarting won't help. Check your metrics: did traffic spike? Did a deployment just happen? Is there a cron job that runs at this time? Then: what specific process is using CPU — is it Node, or is it something else like a runaway system process? If it's Node, you need a CPU profile to find the hot function. We covered the tools in the debugging lesson — clinic.js flame graph, node --prof."`
    },
    {
      speaker: "you",
      text: `"What if there's no time to profile? Users are down right now."`
    },
    {
      speaker: "raj",
      text: `"Mitigation first. If a deployment happened in the last two hours, roll back — that's your fastest path to recovery. If no recent deployment, scale horizontally: add more servers to absorb the load while you investigate. That gets users back. Then profile on one instance while the others serve traffic. If you identify a runaway cron job, kill it. If it's a traffic spike from a scraper or bot, rate-limit the offending IPs at the load balancer. Profile after you've bought yourself time."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SCENARIO 1: CPU AT 100%
// ─────────────────────────────────────────────────────

// ── Immediate triage (30 seconds) ──
// Is it one instance or all?
//   → Metrics dashboard: CPU per instance
//   → One instance: restart it, remove from load balancer pool, investigate
//   → All instances: systematic problem — need code or traffic fix

// Did traffic spike?
//   → Request rate graph: sudden spike = traffic problem
//   → No spike but CPU spiked = code problem (inefficient algorithm, infinite loop)

// Did a deploy just happen?
//   → Deployment log: correlates? → rollback is fastest mitigation

// ── Mitigation options ──
// Option A: Roll back deployment (if deploy in last 2 hrs)
// git revert HEAD && git push → CI deploys previous version
// PM2: pm2 deploy ecosystem.config.js production revert

// Option B: Scale out horizontally (buys time while investigating)
// AWS: increase desired capacity in Auto Scaling Group
// k8s: kubectl scale deployment api --replicas=10

// Option C: Kill the runaway process and prevent restart
// Identify: top -u node → find PID with high CPU
// Kill: kill -SIGTERM <PID>   (graceful) or kill -9 <PID> (force)
// Prevent cron from restarting it: comment out crontab entry temporarily

// ── Root cause investigation (after mitigation) ──
// Is there a hot function? → clinic.js flame graph
// Is there an inefficient query? → check DB slow query log
// Is it regex catastrophic backtracking? → check for new validation code
// Is it a new endpoint with missing pagination? → unbounded data load

// ── Prevention ──
// CPU usage alert at 70% (not 100% — give yourself reaction time)
// Event loop lag monitor: fires before CPU pins
const { monitorEventLoopDelay } = require('perf_hooks');
const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();
setInterval(() => {
  const meanMs = h.mean / 1e6;
  if (meanMs > 100) {
    logger.error({ event: 'event_loop_lag', meanMs }); // alert before CPU peaks
    metrics.gauge('event_loop_lag_ms', meanMs);
  }
}, 10_000);`
    },

    // ── Scenario 2: DB stops responding ──
    {
      speaker: "raj",
      text: `"Second scenario. The database suddenly stops responding. Every API call times out. What's your playbook?"`
    },
    {
      speaker: "you",
      text: `"Check if the DB server is up? Check connection pool?"`
    },
    {
      speaker: "raj",
      text: `"In what order, though? Triage first. Is it total unresponsiveness — can't connect at all — or is it slow responses, or specific queries hanging? Total: check if the DB process is alive, check disk space — a full disk will freeze MongoDB completely. Slow: check active queries for long-running operations blocking others. Connection limit: check if you've hit max connections — your Node processes have collectively opened more connections than the DB can handle. Each diagnosis has a different immediate response."`
    },
    {
      speaker: "you",
      text: `"What about mitigation while the DB is down? You can't just tell users to wait."`
    },
    {
      speaker: "raj",
      text: `"Read-only fallback if you have a read replica — cut write traffic, keep reads alive. Serve cached responses from Redis for anything cacheable — most users hitting a product page don't need live DB data. Circuit breaker: stop hammering a DB that's already struggling — every retry makes it worse. Graceful degradation: return a 503 with a Retry-After header instead of hanging for 30 seconds and returning a 500. That last one is critical — a hanging connection holds a server thread and exhausts your connection pool faster than a fast failure does."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SCENARIO 2: DATABASE NOT RESPONDING
// ─────────────────────────────────────────────────────

// ── Triage questions ──
// Can you connect at all?
//   → Yes, just slow: look for blocking queries, index scans, lock waits
//   → No connection: is the process running? Is disk full? Network issue?

// MongoDB: check what's currently running
// db.currentOp({ active: true, secs_running: { $gt: 5 } })
// → Find long-running ops, kill with: db.killOp(<opid>)

// Check disk space — full disk freezes MongoDB
// df -h /var/lib/mongodb
// If full: clear old logs, expand volume, or move data

// Check connection count vs max
// db.serverStatus().connections
// { current: 498, available: 2, totalCreated: 12000 }
// → Connection pool exhausted — Node processes holding too many connections

// ── Connection pool fix (prevent exhaustion) ──
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize:     10,   // max connections per Node process (default: 5)
  minPoolSize:     2,    // keep 2 warm connections ready
  serverSelectionTimeoutMS: 5000,  // fail fast if DB unreachable (not 30s)
  socketTimeoutMS:          45000, // kill hung queries after 45s
  connectTimeoutMS:         10000, // give up connecting after 10s
});

// ── Circuit breaker — stop hammering a struggling DB ──
// When DB is slow, retries compound the problem.
// Circuit breaker opens after N failures, rejects requests fast.
const CircuitBreaker = require('opossum');

const dbQuery = (fn) => new CircuitBreaker(fn, {
  timeout:              3000,  // if fn takes > 3s, it failed
  errorThresholdPct:    50,    // open circuit when 50% of requests fail
  resetTimeout:         10000, // try again after 10s
  volumeThreshold:      10,    // don't open on first request
});

// ── Graceful degradation — fast failure > hanging ──
app.use(async (req, res, next) => {
  try {
    await mongoose.connection.db.admin().ping(); // lightweight health check
    next();
  } catch (err) {
    // DB unreachable — fail fast with retryable status
    res.setHeader('Retry-After', '30');
    res.status(503).json({
      error: 'Service temporarily unavailable',
      retryAfterSeconds: 30
    });
    // Do NOT hang — a hanging response holds a connection slot
  }
});

// ── Read replica fallback for reads ──
const primaryUri   = process.env.MONGO_PRIMARY_URI;
const replicaUri   = process.env.MONGO_REPLICA_URI;

const readWithFallback = async (query) => {
  try {
    return await query.read('primary');
  } catch (primaryErr) {
    logger.warn({ event: 'primary_down_fallback_to_replica' });
    return await query.read('secondary'); // stale but available
  }
};`
    },

    // ── Scenario 3: Third-party API slow ──
    {
      speaker: "raj",
      text: `"Third scenario. A third-party payment API starts responding in 8 seconds instead of 200ms. Your checkout is timing out. What do you do?"`
    },
    {
      speaker: "you",
      text: `"Check if it's on their end, contact their support..."`
    },
    {
      speaker: "raj",
      text: `"That's the investigation path — but mitigation first. Your users can't check out right now. The most important immediate action: is this every request or intermittent? If intermittent, a fast timeout plus retry with exponential backoff might be enough. If consistent — every call is slow — you need a different strategy. Can you queue the payment asynchronously? Accept the order, show 'payment processing', complete the charge in the background. Can you switch to a backup payment provider? Most payment integrations should have a fallback. Can you cache or re-use a recent successful session to reduce calls? The third-party being slow is a dependency failure — your system's job is to degrade gracefully, not to fail completely because one dependency is struggling."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SCENARIO 3: THIRD-PARTY API SLOW / DOWN
// ─────────────────────────────────────────────────────

// ── Aggressive timeout + retry — for intermittent slowness ──
const axios = require('axios');

const paymentClient = axios.create({
  baseURL: 'https://api.stripe.com',
  timeout: 3000,  // fail fast — 3s max, not their 8s
});

// Exponential backoff retry — only on transient errors
const axiosRetry = require('axios-retry');
axiosRetry(paymentClient, {
  retries:       3,
  retryDelay:    axiosRetry.exponentialDelay,  // 1s, 2s, 4s
  retryCondition: (err) =>
    axiosRetry.isNetworkError(err) ||           // network drop
    err.response?.status === 429 ||             // rate limited
    err.response?.status >= 500,               // server error
  // Never retry: 400, 401, 402, 403, 422 — those are your fault
});

// ── Async payment queue — decouple user response from payment ──
// User sees "order confirmed, payment processing" immediately
// Payment completes in background — no 8s wait

app.post('/api/checkout', asyncHandler(async (req, res) => {
  // Create order record with 'payment_pending' status
  const order = await Order.create({
    userId: req.user.userId,
    items:  req.body.items,
    total:  req.body.total,
    status: 'payment_pending'
  });

  // Queue payment — background worker processes without blocking user
  await paymentQueue.add('charge', {
    orderId:  order._id,
    amount:   order.total,
    token:    req.body.paymentToken
  }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 }
  });

  // User gets immediate response — not waiting for Stripe
  res.status(202).json({
    orderId: order._id,
    status:  'payment_pending',
    message: 'Your order is confirmed. Payment is being processed.'
  });
}));

// ── Circuit breaker on the payment provider ──
const paymentBreaker = new CircuitBreaker(
  (chargeData) => paymentClient.post('/v1/charges', chargeData),
  {
    timeout:           3000,
    errorThresholdPct: 40,   // open after 40% failure rate
    resetTimeout:      30000 // try again after 30s
  }
);

paymentBreaker.on('open',    () => logger.error({ event: 'payment_circuit_open' }));
paymentBreaker.on('halfOpen',() => logger.warn({  event: 'payment_circuit_probing' }));
paymentBreaker.on('close',   () => logger.info({  event: 'payment_circuit_recovered' }));

// ── Status page monitoring — know before your users ──
// Check third-party status page programmatically
const checkProviderStatus = async () => {
  const res = await fetch('https://status.stripe.com/api/v2/summary.json');
  const data = await res.json();
  const api = data.components.find(c => c.name === 'API');
  if (api.status !== 'operational') {
    logger.error({ event: 'stripe_degraded', status: api.status });
    metrics.increment('external.stripe.degraded');
  }
};
setInterval(checkProviderStatus, 60_000); // check every minute`
    },

    // ── Rollback strategies ──
    {
      speaker: "you",
      text: `"Talk me through rollback. When do you roll back vs hotfix?"`
    },
    {
      speaker: "raj",
      text: `"Default to rollback. Always. A hotfix takes time — writing, reviewing, testing, deploying. While you're doing that, users are hurting. A rollback takes two minutes and immediately restores the last known good state. The only reasons not to roll back: the deployment included a database migration that is not backwards-compatible — rolling back the code but not the schema leaves you in a worse state. Or the deployment fixed a critical security vulnerability — reverting introduces the vulnerability again. In those cases you hotfix. But those are the exceptions, not the rule. Most deployments can be rolled back cleanly and the answer to 'roll back or hotfix' is almost always 'roll back'."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// ROLLBACK STRATEGIES
// ─────────────────────────────────────────────────────

// ── Option 1: Git revert + redeploy (safest, cleanest) ──
// Creates a new commit that undoes the last commit — preserves git history
// git revert HEAD --no-edit
// git push origin main
// → CI/CD pipeline deploys the revert automatically

// ── Option 2: Tag-based deploy (fastest if pre-tagged) ──
// Keep immutable image tags — never use 'latest'
// docker pull registry.example.com/api:v2.4.0  (previous version)
// → Deploy previous image tag directly, skip CI entirely

// ── Option 3: Feature flag disable (zero-deploy rollback) ──
// The fastest rollback — no deployment needed at all
await featureFlags.set('new_checkout_flow', { enabled: false });
// Any infra that watches the flag stops routing to new code immediately
// This is why feature flags are the foundation of safe deployment

// ── Option 4: Blue-green swap (infrastructure level) ──
// Two environments: blue (current) and green (previous)
// Swap load balancer target in seconds — instant, no redeployment
// AWS: update target group in Application Load Balancer
// k8s: kubectl rollout undo deployment/api

// ── When NOT to roll back — migration guard ──
// Database migration ran as part of this deploy?
// Check: did the migration add nullable columns or non-breaking indexes?
//   → Safe to roll back code (old code works with new nullable columns)
// Did the migration rename columns, change types, or remove columns?
//   → NOT safe — old code references column names that no longer exist
//   → Must hotfix forward instead

// ── Decision tree ──
const rollbackDecision = (deploy) => {
  if (deploy.hasMigration && deploy.migration.isBreaking) {
    return 'HOTFIX — migration is not backwards-compatible, rollback unsafe';
  }
  if (deploy.fixedSecurityVulnerability) {
    return 'HOTFIX — rollback would re-introduce vulnerability';
  }
  return 'ROLLBACK — fastest path to restoring service';
};

// ── Always have a rollback plan before you deploy ──
// Pre-deploy checklist:
// [ ] Is this deploy rollback-safe? (check for breaking migrations)
// [ ] What's the rollback command? (know it before you need it)
// [ ] What metrics confirm the deploy is healthy? (define success criteria)
// [ ] Who is on call during and after the deploy? (don't deploy and disappear)`
    },

    // ── Communication during incidents ──
    {
      speaker: "raj",
      text: `"One thing that separates experienced incident responders: communication. What does good incident communication look like?"`
    },
    {
      speaker: "you",
      text: `"Keep stakeholders updated? Post in Slack?"`
    },
    {
      speaker: "raj",
      text: `"Specific cadence and format. Within two minutes of confirming an incident: post in the incident channel with what you know — even if that's just 'we are aware and investigating.' Every 15 minutes after that: a brief status update — what you've tried, what you've ruled out, current hypothesis. When you mitigate: announce it, even if you haven't resolved. 'Service restored, investigating root cause.' When resolved: full timeline. Why does this matter? Engineers go silent when they're deep in investigation mode — stakeholders assume the worst. A 'still investigating, no new info' update is more valuable than silence because it prevents a second panic layer on top of the actual incident."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// INCIDENT COMMUNICATION TEMPLATE
// ─────────────────────────────────────────────────────

// ── T+0 (within 2 minutes of alert) ──
// "🔴 INCIDENT: Checkout endpoint returning 500s for all users.
//  Started ~23:44. We are investigating. Updates every 15 min."

// ── T+15 minutes ──
// "🟡 UPDATE: Correlates with deploy at 23:41. Rolling back now.
//  Estimated restoration: ~5 minutes."

// ── T+20 minutes ──
// "🟢 MITIGATED: Rollback deployed. Error rate back to baseline.
//  Root cause investigation ongoing. Full summary to follow."

// ── T+60 minutes ──
// "✅ RESOLVED: Full root cause identified. Summary below.
//  [link to incident doc]"

// Programmatic status page update during incidents
const updateStatusPage = async (status, message) => {
  await fetch('https://api.statuspage.io/v1/pages/{pageId}/incidents', {
    method: 'POST',
    headers: { Authorization: 'OAuth ' + process.env.STATUSPAGE_KEY },
    body: JSON.stringify({
      incident: {
        name:   'API Performance Degradation',
        status,   // 'investigating' | 'identified' | 'monitoring' | 'resolved'
        body:   message,
        components: { [checkoutComponentId]: status === 'resolved' ? 'operational' : 'degraded_performance' }
      }
    })
  });
};

// ── Runbook — codified incident procedures ──
// Keep runbooks in your docs repo, linked from alerts
// A runbook for "checkout 500s" might look like:
const checkoutRunbook = \`
# Checkout 500s Runbook

## Immediate triage (2 min)
1. Check error rate dashboard: https://grafana.example.com/d/checkout
2. Check last deploy time vs incident start time
3. Check DB connection count: db.serverStatus().connections

## Mitigation options
- Deploy correlates: git revert HEAD && git push
- DB connection exhausted: restart app servers (drains pools)
- Feature flag issue: disable 'new_checkout_flow' flag in LaunchDarkly

## Escalation
- DB down > 5 min: page DBA on-call
- Revenue impact > $10k: page VP Engineering
\`;`
    },

    {
      type: "summary",
      points: [
        "Mitigate first, investigate second. Users are hurting now. Two minutes of triage + five minutes to rollback beats forty minutes of root cause analysis while the site stays down.",
        "Four phases: Triage (what broke, when, who's affected, getting worse?) → Mitigate (stop the bleeding) → Resolve (find and fix root cause) → Review (blameless postmortem).",
        "CPU at 100%: first check if it's one instance or all. One → restart and remove from pool. All → code or traffic problem. Mitigation: rollback if recent deploy, scale out to buy time, then profile.",
        "DB not responding: triage type first — no connection vs slow vs connection exhaustion. Each has a different fix. Mitigation: circuit breaker, serve cached reads, fast 503 with Retry-After (never hang).",
        "Third-party API slow: aggressive timeout + retry for transient issues. For sustained degradation: async queue the operation, circuit breaker, fallback provider. Your system should degrade gracefully when dependencies struggle.",
        "Default to rollback. It's two minutes. Hotfix only if: migration is not backwards-compatible, or rollback reintroduces a security vulnerability.",
        "Feature flags are zero-deploy rollback. Disabling a flag is faster than any deployment. This is why separating deployment from release matters most at incident time.",
        "Communication cadence: announce within 2 minutes even if you know nothing yet. Update every 15 minutes. Announce mitigation before resolution. Silence is more alarming than 'still investigating'.",
        "Runbooks: codify the triage steps and mitigation options for your most common alert types. The middle of an incident is not the time to think from scratch."
      ]
    }
  ]
};

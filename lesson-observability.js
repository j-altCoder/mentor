// ─────────────────────────────────────────────────────────────────
//  LESSON: Observability & Monitoring
//  Category: Security & Production Operations
// ─────────────────────────────────────────────────────────────────

const LESSON_OBSERVABILITY = {
  category: "Security & Production Operations",
  tag: "Observability & Monitoring",
  title: "You Can't Fix What You Can't See",
  intro: "2am. PagerDuty wakes you up. P1 alert — checkout is failing. You have no dashboards, no traces, just raw server logs scrolling too fast to read. Raj is somehow already online.",
  scenes: [

    // ── The three pillars ──
    {
      speaker: "raj",
      text: `"Before we look at the alert — do you know the difference between monitoring and observability?"`
    },
    {
      speaker: "you",
      text: `"Aren't they the same thing?"`
    },
    {
      speaker: "raj",
      text: `"Monitoring is knowing when something is wrong. Observability is being able to figure out <em>why</em>. A monitor tells you checkout is down. Observability lets you trace a failing request through every service it touched, correlate it with a spike in database latency, and find the exact line of code that timed out — in under five minutes, without deploying new code. Observability has three pillars: <em>logs</em> — discrete events with context. <em>Metrics</em> — numeric measurements over time. <em>Traces</em> — the journey of a single request through your system. Each answers a different question. Together, they let you understand a system you've never seen fail before."`
    },
    {
      type: "analogy",
      text: "Logs = the black box flight recorder — a full record of what happened. Metrics = the cockpit instruments — altitude, speed, fuel at a glance. Traces = the flight path — where exactly the plane went. An investigation needs all three: instruments told you something was wrong, the path shows where, the recorder explains what happened there."
    },

    // ── Structured logging ──
    {
      speaker: "you",
      text: `"We have logging — Winston, like you showed me before. What are we doing wrong?"`
    },
    {
      speaker: "raj",
      text: `"Probably logging strings. Show me a typical log line from your app."`
    },
    {
      speaker: "you",
      text: `"Something like: 'User 12345 failed to checkout — payment gateway timeout'."`
    },
    {
      speaker: "raj",
      text: `"That's a human-readable string. It's useless at scale. To find all checkout failures in the last hour you'd have to grep through millions of lines with a regex and hope the phrasing is consistent. <em>Structured logging</em> means every log entry is a JSON object with consistent, queryable fields. The same event becomes: <em>{ level: 'error', event: 'checkout.failed', userId: '12345', reason: 'payment_timeout', durationMs: 5002 }</em>. Now Datadog or Grafana can filter, count, group, and alert on any field instantly. You can answer 'how many checkouts failed in the last hour, broken down by failure reason' in one query."`
    },
    {
      type: "code",
      text: `// ❌ String logging — unqueryable, inconsistent
logger.error('User ' + userId + ' failed to checkout — payment gateway timeout');

// ✅ Structured logging — every field is queryable
logger.error({
  event:      'checkout.failed',
  userId,
  orderId,
  reason:     'payment_timeout',
  durationMs: 5002,
  gateway:    'stripe',
  retryCount: 3
});

// Winston — structured JSON with default metadata on every entry
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {           // attached to EVERY log entry automatically
    service:     'checkout-api',
    version:     process.env.npm_package_version,
    environment: process.env.NODE_ENV
  },
  transports: [new winston.transports.Console()]
});

// Request-scoped context — every log inside a request automatically gets
// userId, requestId, path — without passing them manually everywhere
const { AsyncLocalStorage } = require('async_hooks');
const requestContext = new AsyncLocalStorage();

app.use((req, res, next) => {
  const store = {
    requestId: req.headers['x-request-id'] || crypto.randomUUID(),
    userId:    req.user?.userId,
    path:      req.path,
    method:    req.method
  };
  requestContext.run(store, next); // all async code in this request inherits store
});

const log = (level, data) => {
  const ctx = requestContext.getStore() || {};
  logger[level]({ ...ctx, ...data }); // merge request context into every log
};

// Every log line: { requestId, userId, path, method, ...your data }
// Search "userId:12345" in CloudWatch → every log from that user, across all requests`
    },

    // ── Correlation IDs ──
    {
      speaker: "you",
      text: `"In our microservices setup a request touches the API gateway, the order service, the payment service. If something fails the logs are spread across three services. How do you find them all?"`
    },
    {
      speaker: "raj",
      text: `"<em>Correlation IDs</em>. When a request arrives at your API gateway, generate a UUID. Pass it as an HTTP header — X-Correlation-ID — to every downstream service you call. Every service logs that ID with every log entry for that request. Now to investigate a failure, search your log aggregator for that one ID and every log line across every service appears in chronological order. A complete narrative of one request's journey, assembled from logs scattered across 10 servers."`
    },
    {
      type: "code",
      text: `// Correlation ID — generate at edge, propagate everywhere
const correlationStore = new AsyncLocalStorage();

app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  res.setHeader('x-correlation-id', correlationId); // echo back to client
  correlationStore.run({ correlationId }, next);
});

// Axios interceptor — attach to all outgoing service calls automatically
axios.interceptors.request.use(config => {
  const store = correlationStore.getStore();
  if (store) config.headers['x-correlation-id'] = store.correlationId;
  return config;
});

// Every log includes correlationId
const log = (level, data) => {
  const ctx = correlationStore.getStore() || {};
  logger[level]({ correlationId: ctx.correlationId, ...data });
};

// Searching "correlationId: abc-123" in your log aggregator shows:
// [API Gateway]     abc-123 — received POST /checkout
// [Order Service]   abc-123 — created order ord-789
// [Payment Service] abc-123 — charging card...
// [Payment Service] abc-123 — ERROR: gateway timeout after 5002ms
// [Order Service]   abc-123 — marking order as failed
// [API Gateway]     abc-123 — returning 502 to client`
    },

    // ── Metrics ──
    {
      speaker: "you",
      text: `"Metrics — I know they're numbers over time. But what specifically should we be measuring?"`
    },
    {
      speaker: "raj",
      text: `"Start with the <em>RED method</em> — designed for services. <em>Rate</em> — requests per second. <em>Errors</em> — percentage of requests failing. <em>Duration</em> — how long requests take. Those three on every endpoint tell you immediately when something's wrong and roughly where. For infrastructure use the <em>USE method</em> — <em>Utilisation</em>, <em>Saturation</em>, <em>Errors</em> per resource. CPU, memory, disk, network. Together RED and USE give you signals at every layer of the stack."`
    },
    {
      speaker: "you",
      text: `"How do you actually emit metrics from a Node app?"`
    },
    {
      speaker: "raj",
      text: `"The standard is <em>Prometheus</em>. You instrument your code with a Prometheus client, it tracks counters, gauges, and histograms in memory, and exposes a /metrics endpoint. Prometheus scrapes it on a schedule and stores the time-series. Grafana reads from Prometheus and renders dashboards. The metric types matter: <em>Counter</em> — ever-increasing, good for request counts. <em>Gauge</em> — can go up and down, good for active connections. <em>Histogram</em> — samples values into buckets, essential for latency percentiles — you can't average averages and get P99."`
    },
    {
      type: "code",
      text: `const client = require('prom-client');
client.collectDefaultMetrics(); // CPU, memory, event loop lag — auto-collected for free

// Counter — request counts
const httpRequestsTotal = new client.Counter({
  name:       'http_requests_total',
  help:       'Total HTTP requests',
  labelNames: ['method', 'path', 'status']
});

// Histogram — latency with percentile support
const httpDuration = new client.Histogram({
  name:       'http_request_duration_seconds',
  help:       'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets:    [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});

// Gauge — active connections (goes up and down)
const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Middleware — instrument every request automatically
app.use((req, res, next) => {
  const end = httpDuration.startTimer({ method: req.method, path: req.route?.path });
  res.on('finish', () => {
    const labels = { method: req.method, path: req.route?.path, status: res.statusCode };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
});

// Expose /metrics for Prometheus to scrape
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Business metrics — instrument what matters most
const checkoutsTotal = new client.Counter({ name: 'checkouts_total', labelNames: ['status'] });
const revenueTotal   = new client.Counter({ name: 'revenue_cents_total' });

// In checkout handler:
checkoutsTotal.inc({ status: 'success' });
revenueTotal.inc(order.totalCents);`
    },

    // ── Alerting ──
    {
      speaker: "you",
      text: `"How do you decide what to alert on? We get paged for everything and alert fatigue is real."`
    },
    {
      speaker: "raj",
      text: `"Alert on <em>symptoms</em>, not causes. Alert when users are affected — high error rate, slow responses, failing checkouts. Don't alert on every CPU spike or memory wiggle — those are causes and they might not be affecting users at all. The rule: every alert must be actionable. If an engineer gets paged and there's nothing they can do in the next 30 minutes, it shouldn't wake them up. Use <em>SLOs</em> — Service Level Objectives. Define what 'good' means: 99.9% of checkouts succeed, P95 latency under 500ms. Alert when you're burning through your error budget too fast, not on every individual blip."`
    },
    {
      type: "code",
      text: `# Prometheus alerting rules — symptoms not causes
groups:
  - name: api_alerts
    rules:

      # High error rate — users seeing failures RIGHT NOW
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 2m          # must be true for 2 min — avoids flapping
        labels: { severity: critical }
        annotations:
          summary: "Error rate above 5% for 2 minutes"

      # High latency P99 — users waiting too long
      - alert: HighP99Latency
        expr: |
          histogram_quantile(0.99,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 2.0
        for: 5m
        labels: { severity: warning }

      # Business metric — checkout failure spike
      - alert: CheckoutFailureSpike
        expr: |
          rate(checkouts_total{status="failed"}[5m])
          / rate(checkouts_total[5m]) > 0.02
        for: 1m
        labels: { severity: critical }

      # SLO burn rate — burning error budget 14x faster than sustainable
      # (entire monthly 0.1% budget consumed in 2 hours)
      - alert: ErrorBudgetBurnRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[1h]))
          / sum(rate(http_requests_total[1h])) > (14.4 * 0.001)
        labels: { severity: critical }

      # ❌ Don't alert on: CPU > 70%, Memory > 80%
      # Those are causes. Alert on the user-visible effect instead.`
    },

    // ── Distributed tracing ──
    {
      speaker: "you",
      text: `"What's distributed tracing? Is it different from the correlation IDs we just talked about?"`
    },
    {
      speaker: "raj",
      text: `"Correlation IDs are a DIY version — you manually propagate an ID and search logs. <em>Distributed tracing</em> is the full solution. Every operation — incoming request, DB query, HTTP call, queue message — is a <em>span</em>. Spans are linked into a <em>trace</em> by a shared trace ID. The trace forms a tree showing the full timeline: which spans ran in parallel, which ran sequentially, exactly how long each one took. Correlation IDs tell you what happened. Traces show you <em>when and for how long</em> everything happened, in a visual waterfall diagram. The difference between reading a police report and watching the CCTV footage."`
    },
    {
      speaker: "you",
      text: `"What's OpenTelemetry — I keep seeing that name?"`
    },
    {
      speaker: "raj",
      text: `"Before OpenTelemetry, every vendor — Datadog, Jaeger, Zipkin — had its own SDK. You'd instrument your app for Datadog and be locked in. <em>OpenTelemetry</em> is the open standard. Instrument once with the OTel SDK, point the output at any backend. It covers logs, metrics, and traces under one API. Auto-instrumentation packages for Node automatically create spans for Express routes, MongoDB queries, HTTP calls, and Redis operations — without you writing a single trace line manually."`
    },
    {
      type: "code",
      text: `// tracing.js — must be required BEFORE any other import
const { NodeSDK }                     = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter }           = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource }                    = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME }    = require('@opentelemetry/semantic-conventions');

const sdk = new NodeSDK({
  resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: 'checkout-api' }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT // Jaeger, Honeycomb, Datadog, etc.
  }),
  instrumentations: [getNodeAutoInstrumentations()]
  // Auto-creates spans for: Express routes, Mongoose queries, HTTP calls, Redis
});
sdk.start();

// Manual spans — add context around business logic
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const tracer = trace.getTracer('checkout-service');

const processCheckout = async (order) => {
  return tracer.startActiveSpan('processCheckout', async (span) => {
    try {
      span.setAttributes({
        'checkout.orderId':   order._id.toString(),
        'checkout.total':     order.total,
        'checkout.itemCount': order.items.length
      });
      const payment = await chargeCard(order); // Axios call auto-traced
      span.setAttributes({ 'checkout.paymentId': payment.id });
      return payment;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
};

// What the waterfall looks like in Jaeger/Honeycomb:
// ┌─ POST /checkout [320ms] ──────────────────────────────────┐
// │  ├─ mongoose.findById (User) [12ms]                       │
// │  ├─ mongoose.findById (Cart)  [8ms]                       │
// │  └─ processCheckout [290ms] ──────────────────────────────│
// │       ├─ mongoose.create (Order) [15ms]                   │
// │       └─ POST stripe.com/v1/charges [265ms]  ← SLOW       │
// └───────────────────────────────────────────────────────────┘
// Stripe is 83% of request time — bottleneck identified instantly`
    },

    // ── Error monitoring ──
    {
      speaker: "you",
      text: `"We try/catch everywhere and log errors. Is that enough for error monitoring?"`
    },
    {
      speaker: "raj",
      text: `"Logging errors is the floor, not the ceiling. Problems: you have to actively go looking for them. You don't know how many times an error occurred, whether it's new or recurring, which users were affected, or what the context was when it happened. <em>Sentry</em> is the standard solution. It captures every unhandled exception, groups identical errors together, tracks occurrence count and affected users, shows the full stack trace resolved back to your original TypeScript source via source maps, shows local variable values at the time of the crash, and alerts you the instant a new error type appears. It also captures <em>breadcrumbs</em> — a trail of recent events leading up to the crash."`
    },
    {
      type: "code",
      text: `const Sentry = require('@sentry/node');

Sentry.init({
  dsn:              process.env.SENTRY_DSN,
  environment:      process.env.NODE_ENV,
  release:          process.env.npm_package_version,
  tracesSampleRate: 0.1,   // trace 10% of requests for performance monitoring
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ]
});

app.use(Sentry.Handlers.requestHandler());  // FIRST middleware
app.use(Sentry.Handlers.tracingHandler());
app.use('/api', apiRoutes);
app.use(Sentry.Handlers.errorHandler());    // LAST middleware — catches everything

// Attach user identity to every error from this request
app.use((req, res, next) => {
  if (req.user) Sentry.setUser({ id: req.user.userId, email: req.user.email });
  next();
});

// Add context before capturing
app.post('/checkout', asyncHandler(async (req, res) => {
  try {
    const order = await processOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    Sentry.withScope(scope => {
      scope.setExtra('orderId',   req.body.orderId);
      scope.setExtra('cartTotal', req.body.total);
      scope.setTag('payment.gateway', 'stripe');
      Sentry.captureException(err);
    });
    throw err;
  }
}));

// Breadcrumbs — leave a trail of events leading up to errors
Sentry.addBreadcrumb({
  category: 'checkout',
  message:  'Starting payment processing',
  data:     { orderId, amount: order.total },
  level:    'info'
});
// Sentry shows these breadcrumbs in the error report — like a mini-trace`
    },

    // ── Uptime monitoring ──
    {
      speaker: "you",
      text: `"We've had incidents where everything looked fine from the inside but users couldn't reach the site. How do you catch that?"`
    },
    {
      speaker: "raj",
      text: `"<em>External uptime monitoring</em>. Your internal metrics only tell you what the server sees. If your CDN is misconfigured, DNS is broken, or your SSL certificate expired — your internal metrics are all green while users get errors. External monitors like Checkly, Datadog Synthetics, or Pingdom make real HTTP requests to your public endpoints from locations around the world on a schedule. They check the response is correct, not just that it returned 200. You get paged before your users call you. Synthetic browser tests take it further — they run a real browser through your checkout flow every 10 minutes and alert if anything breaks or gets too slow."`
    },
    {
      type: "code",
      text: `// Checkly — synthetic monitoring as code (lives in your repo)
// checks/api-health.check.ts
import { ApiCheck, AssertionBuilder, Frequency } from 'checkly/constructs'

new ApiCheck('api-health', {
  name:      'API Health',
  frequency: Frequency.EVERY_5M,
  locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
  request: {
    url:    'https://api.myapp.com/health/ready',
    method: 'GET'
  },
  assertions: [
    AssertionBuilder.statusCode().equals(200),
    AssertionBuilder.responseTime().lessThan(500),
    AssertionBuilder.jsonBody('$.status').equals('ready')
  ]
})

// checks/checkout-flow.check.ts — full browser test (Playwright)
new BrowserCheck('checkout-flow', {
  name:      'Full Checkout Flow',
  frequency: Frequency.EVERY_10M,
  code: { entrypoint: './playwright/checkout.spec.ts' }
})

// The Playwright script runs a real Chromium browser:
// 1. Navigate to product page
// 2. Add item to cart
// 3. Fill in test card (Stripe test mode)
// 4. Submit checkout
// 5. Assert order confirmation appears within 3 seconds
// Fail or timeout at any step → PagerDuty alert immediately

// What external monitoring catches that internal doesn't:
// ✓ Expired SSL certificate
// ✓ DNS misconfiguration
// ✓ CDN cache serving wrong content
// ✓ Geographic routing failures (works in US, broken in EU)
// ✓ Third-party script failures blocking checkout`
    },

    // ── Dashboards ──
    {
      speaker: "you",
      text: `"What should a production dashboard actually show? Ours is just CPU and memory graphs that nobody looks at."`
    },
    {
      speaker: "raj",
      text: `"Your dashboard tells the wrong story. CPU and memory tell you about the machine. A good dashboard tells you about the <em>service from the user's perspective</em>. Top row: request rate, error rate, P50/P95/P99 latency — the RED metrics. Anyone should be able to glance at these and know in 5 seconds if the service is healthy. Second row: business metrics — checkouts per minute, revenue rate, active users. Third row: downstream dependency health — database query times, Redis latency, external API p99. Infrastructure — CPU, memory — goes at the bottom. If the top two rows are green, nobody needs to look at the bottom."`
    },
    {
      type: "code",
      text: `# Grafana — the queries that power a useful dashboard
# (Prometheus as data source)

# Row 1: Service health (RED)
# Request rate — requests per second
sum(rate(http_requests_total[1m]))

# Error rate % — what % of requests are failing
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# Latency percentiles (p50, p95, p99)
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Row 2: Business metrics
rate(checkouts_total{status="success"}[1m]) * 60    # checkouts per minute
rate(revenue_cents_total[1m]) / 100 * 60            # revenue per minute ($)

# Row 3: Dependencies
# MongoDB query P95 latency
histogram_quantile(0.95,
  rate(mongodb_query_duration_seconds_bucket[5m]) by (le, operation)
)

# Row 4: Infrastructure (last, least urgent)
# CPU utilisation per instance
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100`
    },

    // ── Tying it all together ──
    {
      speaker: "raj",
      text: `"Back to the 2am incident. Checkout is failing. Walk me through it — now that you have observability set up."`
    },
    {
      speaker: "you",
      text: `"Check the error rate dashboard first — see how bad it is and when it started."`
    },
    {
      speaker: "raj",
      text: `"And then?"`
    },
    {
      speaker: "you",
      text: `"Open traces for the checkout endpoint — filter to the failing ones. See which span is taking longest or erroring."`
    },
    {
      speaker: "raj",
      text: `"The Stripe charge span is timing out at 5 seconds. You copy the trace ID, search logs for that correlation ID — the payment service logged a connection refused to Stripe's API. You check Stripe's status page, they have an active incident. You look at the SLO dashboard — you've burned 40% of your monthly error budget in 20 minutes. You flip a feature flag to route to your backup payment processor. Checkout recovers in 90 seconds. You write the incident report. Total time: 11 minutes. Without observability, that's a two-hour all-hands war room at 2am. That's the difference."`
    },

    {
      type: "summary",
      points: [
        "Monitoring = knowing something is wrong. Observability = understanding why. You need both, and observability is harder.",
        "Three pillars: Logs (what happened), Metrics (how much/fast), Traces (where time was spent). Each answers a different question.",
        "Structured logging = JSON objects with consistent fields. String logs are unqueryable. Use defaultMeta for service-wide context.",
        "AsyncLocalStorage = request-scoped context. Every log inside a request automatically gets userId, requestId, path — no manual passing.",
        "Correlation IDs = UUID generated at API gateway, propagated via X-Correlation-ID header to all downstream services. Search one ID, see the full story.",
        "RED method: Rate, Errors, Duration — for services. USE method: Utilisation, Saturation, Errors — for infrastructure.",
        "Prometheus types: Counter (ever-increasing), Gauge (up/down), Histogram (latency buckets). You need histograms for meaningful percentiles.",
        "Alert on symptoms (high error rate, slow P99) not causes (CPU spike). Every alert must be actionable or it causes fatigue.",
        "SLO = definition of 'good'. Error budget = allowed failures. Alert on burn rate, not individual errors.",
        "Distributed traces = spans linked by trace ID forming a waterfall. Shows exactly where request time is spent across services.",
        "OpenTelemetry = instrument once, send to any backend. Auto-instrumentation handles Express/Mongoose/Redis spans for free.",
        "Sentry = error grouping, occurrence counts, affected users, source-mapped stack traces, breadcrumbs. Logging errors is not enough.",
        "External uptime monitoring = real requests from outside your network. Catches DNS failures, CDN issues, expired certs, geographic failures.",
        "Dashboard top row = RED metrics (5-second glance shows service health). Business metrics second. Dependencies third. Infrastructure last.",
        "Incident workflow: dashboard → failing traces → correlation ID in logs → root cause → mitigate → postmortem."
      ]
    }
  ]
};

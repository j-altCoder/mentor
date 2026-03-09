// ─────────────────────────────────────────────────────────────────
//  LESSON: Product Thinking
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_PRODUCT_THINKING = {
  category: "Architecture & System Design",
  tag: "Product Thinking",
  title: "Engineering Without Context Is Just Typing",
  intro: "The interviewer puts down their pen. 'Forget the code for a minute. We're thinking about adding a new checkout flow. How would you approach it?' You weren't expecting this. Neither was anyone else in the room who got asked it and rambled for five minutes about microservices.",
  scenes: [

    // ── Why product thinking is tested ──
    {
      speaker: "raj",
      text: `"Why do you think a senior engineering interview includes questions like this?"`
    },
    {
      speaker: "you",
      text: `"To see if you can think beyond the code?"`
    },
    {
      speaker: "raj",
      text: `"More specific than that. Senior engineers spend a significant portion of their time on decisions that aren't purely technical — scoping features, pushing back on requirements, estimating tradeoffs, flagging risk before it becomes an incident. An engineer who can only think about code is useful but limited. The interviewer is checking: does this person ask why before asking how? Do they think about users, not just systems? Can they reason about risk and rollout, not just correctness? Those are the habits that separate someone who ships features from someone who ships the right features."`
    },

    // ── How to approach redesign questions ──
    {
      speaker: "raj",
      text: `"First type: 'How would you redesign this feature?' The interviewer shows you something — a checkout flow, a search page, a notification system. What's the wrong way to answer?"`
    },
    {
      speaker: "you",
      text: `"Jump straight into technical changes?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. The wrong answer starts with 'I'd replace this with GraphQL' or 'I'd move this to a microservice.' You have no idea yet if those changes serve any real need. The right answer starts with questions. What problem is this feature solving today? What isn't working — is it slow, confusing, expensive to maintain, causing errors? Who are the users and what are they trying to accomplish? What does success look like — a metric, a user behaviour, a cost reduction? Only after you understand the problem do you talk about solutions. This isn't a soft skill — it's engineering discipline. You can't design a good solution to a problem you haven't understood."`
    },
    {
      type: "analogy",
      text: "Redesigning before understanding = a surgeon who proposes the incision before reading the patient's chart. Technically skilled. But operating on the wrong organ. Diagnosis before treatment is not optional — it's the entire job."
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// REDESIGN QUESTION — the structured approach
// ─────────────────────────────────────────────────────

// Interviewer: "How would you redesign our checkout flow?"

// ── Step 1: Understand the problem before proposing anything ──
// Questions to ask (pick the most relevant):
//
// "What's the current drop-off rate at checkout?"
// "Are there specific steps where users abandon?"
// "What complaints do we see in support tickets?"
// "Is this a performance issue, a UX issue, or a reliability issue?"
// "What's the business goal — increase conversion, reduce fraud, cut costs?"
// "Who are the users — mobile-first? recurring buyers? one-time?"

// ── Step 2: Diagnose before prescribing ──
// Hypothetical findings:
// - 34% drop-off at the payment step
// - 60% of users on mobile
// - Average payment step load time: 4.2 seconds
// - Top support complaint: "my card keeps getting declined"

// ── Step 3: Now propose solutions tied to the diagnosis ──
// Don't: "I'd rewrite it in React and add GraphQL"
// Do:    Match each solution to a specific problem

const redesignProposal = {
  problem1: {
    finding:  '4.2s load time on payment step — above 3s, conversion drops sharply',
    cause:    'Payment iframe loads Stripe SDK synchronously, blocking render',
    solution: 'Lazy-load Stripe SDK, preload on previous step, skeleton UI during load',
    metric:   'Target: payment step load < 1.5s',
  },
  problem2: {
    finding:  '60% mobile users, form optimised for desktop',
    cause:    'Input fields not using correct mobile keyboard types',
    solution: 'inputmode="numeric" for card number, autocomplete attributes, Apple/Google Pay',
    metric:   'Target: mobile conversion rate parity with desktop',
  },
  problem3: {
    finding:  '"Card declined" is top complaint — many are false declines',
    cause:    'No retry UX, no clear error messages distinguishing bank decline vs typo',
    solution: 'Distinct error messages per decline code, inline card validation, retry flow',
    metric:   'Target: 20% reduction in support tickets about payment failures',
  }
};

// Each solution has: a specific problem, a diagnosed cause, a targeted fix,
// and a measurable outcome. This is what senior thinking sounds like.`
    },

    // ── Performance questions ──
    {
      speaker: "raj",
      text: `"Second type: 'This page is slow. How do you improve it?' Same trap?"`
    },
    {
      speaker: "you",
      text: `"Don't jump to solutions. Measure first?"`
    },
    {
      speaker: "raj",
      text: `"Right. <em>You cannot optimise what you haven't measured.</em> A slow page has many possible causes — a slow API call, too many API calls, a render-blocking script, a large image, a slow database query, a JavaScript bundle that's 4MB. Fixing the wrong one wastes weeks and doesn't move the metric. The diagnostic order: first, what does the user experience — is it slow to start showing anything, slow to become interactive, or slow to load all content? That maps to Time to First Byte, First Contentful Paint, and Time to Interactive respectively. Each of those points to different root causes."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// PAGE PERFORMANCE — diagnostic framework
// ─────────────────────────────────────────────────────

// ── Three user-facing symptoms, three root cause areas ──

// Symptom 1: Nothing shows for > 1s (high TTFB)
// Root cause: server is slow
// Check:
//   - Is the API query slow? → check slow query logs, add index
//   - Is a downstream service slow? → check service traces, add cache
//   - Is the server under load? → check CPU/memory, add caching layer
//   - Is CDN misconfigured? → static assets should be cached at edge

// Symptom 2: Page starts loading but stays blank/broken for seconds (high FCP)
// Root cause: render-blocking resources
// Check:
//   - Large synchronous scripts in <head> → defer or async
//   - Large CSS bundles → critical CSS inline, rest deferred
//   - Web fonts blocking render → font-display: swap

// Symptom 3: Page visible but unresponsive (high TtI / INP)
// Root cause: JavaScript executing on main thread
// Check:
//   - Bundle size → code splitting, lazy load routes
//   - Third-party scripts → tag manager, analytics, chat widget
//   - Long tasks > 50ms → profiler, break up with requestIdleCallback

// ── Practical toolchain ──
// Chrome DevTools Performance tab:   flame graph, long tasks, layout shifts
// Lighthouse:                        scores + specific actionable suggestions
// WebPageTest:                       real network simulation, waterfall chart
// Core Web Vitals in Google Search Console: real-user data, not lab data

// ── The 80/20 fixes that almost always help ──
const highImpactFixes = [
  'Image optimisation: WebP/AVIF format, correct dimensions, lazy loading below fold',
  'Bundle splitting: vendor chunk separate from app, route-level code splitting',
  'CDN for static assets: JS, CSS, images served from edge, not origin',
  'HTTP caching headers: Cache-Control max-age on immutable assets',
  'Preconnect/prefetch for known third parties: <link rel="preconnect">',
  'Database query optimisation: explain plan, missing indexes, N+1 elimination',
  'API response caching: Redis for expensive queries, stale-while-revalidate pattern',
];

// ── How to talk about it in an interview ──
// "Before suggesting fixes, I'd look at the Core Web Vitals data to see
//  which metric is actually failing — LCP, FCP, or TtI. That tells me
//  whether the problem is server-side, resource-loading, or JavaScript.
//  Then I'd use the performance profiler to find the specific bottleneck
//  rather than guessing. Once I know the cause, here's what I'd try..."
//
// This answer demonstrates diagnostic thinking, not random optimisation.`
    },

    // ── Feature rollout ──
    {
      speaker: "you",
      text: `"The rollout question — 'how do you roll out a feature safely?' — what are they actually testing there?"`
    },
    {
      speaker: "raj",
      text: `"Whether you think about risk. Every deployment is a bet. The question is how much you're risking at once. An inexperienced engineer deploys to all users simultaneously and hopes it works. A senior engineer asks: what's the worst case if this is broken? Who does it affect? How quickly can we detect it? How quickly can we recover? The answers to those questions determine the rollout strategy. A cosmetic UI change on a non-critical page — deploy to everyone, monitor for an hour. A new payment flow touching revenue — canary at 1%, watch conversion and error rates, expand slowly, have a kill switch ready."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// FEATURE ROLLOUT — risk-proportionate strategies
// ─────────────────────────────────────────────────────

// ── Strategy 1: Feature flags — the foundation of safe rollout ──
// Separate deployment from release. Code ships dark, enabled by config.
// Can target by user ID, percentage, cohort, internal users, or region.

// Simple flag check (using a flags service or env config)
const flagEnabled = (flagName, userId) => {
  const flag = featureFlags.get(flagName);
  if (!flag || !flag.enabled) return false;
  if (flag.allowedUsers?.includes(userId)) return true;   // specific users
  if (flag.percentage) {
    // Deterministic: same user always gets same treatment
    const hash = murmurhash(flagName + userId) % 100;
    return hash < flag.percentage;
  }
  return false;
};

app.post('/api/checkout', asyncHandler(async (req, res) => {
  if (flagEnabled('new_checkout_flow', req.user.userId)) {
    return newCheckoutHandler(req, res);   // new path — only for flagged users
  }
  return legacyCheckoutHandler(req, res); // everyone else
}));

// ── Strategy 2: Canary deployment ──
// Roll out to a small % of real traffic first. Watch metrics. Expand or rollback.

const ROLLOUT_STAGES = [
  { pct: 1,   waitHours: 2,  watchMetrics: ['error_rate', 'p99_latency'] },
  { pct: 10,  waitHours: 4,  watchMetrics: ['error_rate', 'conversion_rate'] },
  { pct: 50,  waitHours: 24, watchMetrics: ['error_rate', 'conversion_rate', 'revenue'] },
  { pct: 100, waitHours: 0,  watchMetrics: [] },
];

// ── Strategy 3: Dark launch (shadow mode) ──
// Run new code in parallel with old code. Compare results. No user impact.
app.get('/api/recommendations', asyncHandler(async (req, res) => {
  const legacyResult = await legacyRecommendations(req.user.userId);

  // Run new algorithm silently — don't affect response
  newRecommendations(req.user.userId)
    .then(newResult => {
      // Log both for comparison — no user sees the new result yet
      metrics.track('recommendation_comparison', {
        userId:    req.user.userId,
        legacyIds: legacyResult.map(r => r.id),
        newIds:    newResult.map(r => r.id),
        match:     arraysEqual(legacyResult, newResult)
      });
    })
    .catch(err => logger.error({ event: 'dark_launch_error', err: err.message }));

  res.json(legacyResult); // always respond with legacy result during dark launch
}));

// ── What to monitor during rollout ──
const rolloutDashboard = {
  tier1_alerts: [
    'error_rate > baseline + 0.5%',   // stop rollout immediately
    'p99_latency > 2x baseline',       // stop rollout immediately
  ],
  tier2_watch: [
    'conversion_rate vs control group',
    'revenue per session vs control',
    'support ticket volume',
  ],
  rollback_trigger: 'Any tier-1 alert → disable flag → investigate'
};`
    },

    // ── Estimation ──
    {
      speaker: "you",
      text: `"Sometimes they ask estimation questions: 'How long would this feature take?' How do you handle that without sounding either overconfident or evasive?"`
    },
    {
      speaker: "raj",
      text: `"Decompose before you estimate. A feature isn't one thing — it's a set of tasks with different uncertainty profiles. Break it into: backend API changes, data model changes, frontend, integration tests, deployment and monitoring setup. Estimate each piece in isolation. Then add explicit unknowns: are there third-party integrations to build? Are there design decisions not yet made? Are there dependencies on another team? The honest answer is a range with named assumptions — 'three to five days if the design is final and the payment provider has a sandbox API; two to three weeks if we need to build mock infrastructure for testing.' That answer shows you've thought it through. It's not evasion — it's precision about what you know and what you don't."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// ESTIMATION — decompose and name assumptions
// ─────────────────────────────────────────────────────

// Feature: "Add Apple Pay to checkout"

const estimate = {
  tasks: [
    { name: 'Stripe PaymentRequest Button integration',  days: 1,   confidence: 'high'   },
    { name: 'Backend: handle new payment method type',   days: 0.5, confidence: 'high'   },
    { name: 'Frontend: detect capability, show button',  days: 1,   confidence: 'high'   },
    { name: 'Testing: real device testing (iOS)',        days: 1,   confidence: 'medium' },
    { name: 'Analytics: track Apple Pay conversion',    days: 0.5, confidence: 'high'   },
    { name: 'Error handling + edge cases',              days: 1,   confidence: 'medium' },
  ],

  assumptions: [
    'Stripe account already supports PaymentRequest API (check: yes)',
    'Design for button placement already decided (check: pending)',
    'QA has access to iPhone for end-to-end testing (check: unknown)',
  ],

  risks: [
    'Apple Pay domain verification requires DNS change — needs DevOps',
    'Stripe sandbox may not fully simulate Apple Pay — real device needed early',
  ],

  estimate: {
    optimistic:  '3–4 days (design confirmed, no DNS delay)',
    realistic:   '5–6 days (one round of design feedback, standard DNS TTL)',
    pessimistic: '8–10 days (if QA device not available, staging issues)',
  }
};

// How to present this in an interview:
// "I'd break this into about six tasks. The core integration is probably
//  three days of solid work. But there are two unknowns I'd want to resolve
//  before committing: whether design has finalised the button placement,
//  and whether we have iOS devices in QA for end-to-end testing. Assuming
//  those are sorted, I'd say five to six days. If either is a blocker,
//  add two to three days for the back-and-forth."
//
// This is more useful than "about a week" and more honest than "three days."`
    },

    // ── Pushing back on requirements ──
    {
      speaker: "raj",
      text: `"Last one. The PM says: 'We need to add a real-time notification for every single event in the system — orders, messages, promotions, system updates, everything, by Friday.' What do you do?"`
    },
    {
      speaker: "you",
      text: `"That's not realistic for Friday. But how do you say that without just being obstructive?"`
    },
    {
      speaker: "raj",
      text: `"You make the tradeoffs visible instead of just saying no. 'By Friday' and 'every notification type' are two separate constraints — which one is actually fixed? Maybe Friday is a demo and they need three types working, not fifteen. Maybe the deadline is flexible and they really do need all types. You can't know until you ask. Then you scope it: what's the minimum that serves the actual need? Build the notification infrastructure once — the channel, the delivery mechanism, the preferences system — and add notification types incrementally. That's not pushing back — that's scoping. Senior engineers are paid to make those calls, not just to execute whatever's asked."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SCOPING — minimum viable vs full scope
// ─────────────────────────────────────────────────────

// Request: "All 15 notification types by Friday"
// Discovery question: "What's the Friday demo actually showing?"
// Answer: "Order confirmation + shipping update for the investor demo"

// ── Scoped response ──
const notificationScope = {
  byFriday: {
    types:         ['order_confirmed', 'order_shipped'],
    delivery:      ['in-app badge + toast'],
    infrastructure: 'build the notification channel and worker — extensible',
    effort:        '2–3 days',
  },
  nextSprint: {
    types:    ['message_received', 'promo_offer', 'price_drop'],
    delivery: ['email', 'push notification'],
    effort:   '3–4 days per delivery channel',
  },
  later: {
    types:    ['system_maintenance', 'account_security', 'weekly_digest'],
    delivery: ['SMS'],
    effort:   'Depends on SMS provider integration',
  }
};

// ── The architecture that makes this easy to extend ──
// Build the infrastructure once — adding a type is just a new event handler

// Notification worker — subscribes to all events, routes by type
eventBus.subscribe('*', async (event) => {
  const template = notificationTemplates[event.type];
  if (!template) return; // type not yet supported — silently skip

  const prefs = await UserPrefs.findOne({ userId: event.userId });
  if (!prefs?.notifications[event.type]) return; // user opted out

  await notificationQueue.add('send', {
    userId:   event.userId,
    type:     event.type,
    channels: template.defaultChannels,
    data:     event.data,
  });
});

// Adding a new notification type = add one entry to notificationTemplates
// No changes to infrastructure, worker, or delivery code
const notificationTemplates = {
  order_confirmed: {
    title:           'Order confirmed',
    defaultChannels: ['in_app', 'email'],
    template:        'order-confirmed',
  },
  order_shipped: {
    title:           'Your order is on its way',
    defaultChannels: ['in_app', 'push'],
    template:        'order-shipped',
  },
  // new type added in 30 minutes, not 3 days:
  price_drop: {
    title:           'Price drop on your wishlist',
    defaultChannels: ['push'],
    template:        'price-drop',
  },
};

// This is the answer to "by Friday": not "we can't",
// but "here's what we can ship Friday that's genuinely useful,
// and here's the architecture that makes the rest trivial to add."`
    },

    {
      type: "summary",
      points: [
        "Product thinking is tested because senior engineers make decisions, not just execute them. Asking why before how separates engineers who ship the right thing from engineers who just ship.",
        "Redesign questions: resist the urge to propose technical changes first. Ask what's broken, who uses it, what success looks like. Solutions should map to specific diagnosed problems — not preferences.",
        "Performance questions: measure before optimising. TTFB points to server-side causes. FCP points to render-blocking resources. TtI points to JavaScript. Fix the right layer.",
        "The diagnostic toolchain: Chrome DevTools flame graph for JS, Lighthouse for actionable scores, WebPageTest for real network simulation, Core Web Vitals for real-user data.",
        "Feature rollout: risk determines strategy. Cosmetic change → deploy to all, monitor. Revenue-critical path → feature flag, canary at 1%, watch conversion and error rates, kill switch ready.",
        "Feature flags separate deployment from release. Dark launch runs new code silently in parallel to validate correctness before any user sees it.",
        "Estimation: decompose first, then estimate each piece. Name assumptions explicitly. Give a range with the conditions that produce each end — that's more useful than a single number.",
        "Pushing back: don't say no, make tradeoffs visible. Which constraint is actually fixed — deadline or scope? Build the infrastructure once, add types incrementally.",
        "The shape of a senior answer: clarify the problem → diagnose before prescribing → propose solutions tied to findings → define metrics for success → identify risks and mitigations."
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────
//  LESSON: API Design
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_API_DESIGN = {
  category: "Architecture & System Design",
  tag: "API Design",
  title: "APIs Are Contracts — Break Them and You Break Everyone",
  intro: "The mobile team opens a ticket: 'The API changed again and our app is broken in production.' The web team opens another: 'We need six separate requests to render one page.' Raj calls a design review.",
  scenes: [

    // ── REST fundamentals ──
    {
      speaker: "raj",
      text: `"Before we fix anything — what's REST actually supposed to be? Not the definition, what's the idea behind it?"`
    },
    {
      speaker: "you",
      text: `"Use HTTP verbs and URLs to represent resources and actions on them?"`
    },
    {
      speaker: "raj",
      text: `"Closer: REST is about making your API predictable by following conventions that clients already understand. A developer who has never seen your API should be able to guess the shape of it from the URL structure. GET never modifies state. POST creates. PUT replaces completely. PATCH updates partially. DELETE removes. A URL represents a noun — a resource — not an action. <em>/api/cancelOrder</em> is not REST. <em>POST /api/orders/:id/cancellation</em> is — you're creating a cancellation resource. The payoff: clients can cache GETs correctly, retry safely based on HTTP method semantics, and navigate your API without documentation for basic operations."`
    },
    {
      type: "code",
      text: `// REST URL design — nouns, not verbs

// ❌ RPC-style — verbs in URLs
GET  /api/getUser/123
POST /api/createOrder
POST /api/cancelOrder/456
POST /api/getUserOrders/123

// ✅ REST-style — nouns, HTTP method carries the verb
GET    /api/users/123              // read user
POST   /api/users                  // create user
PUT    /api/users/123              // replace user (full update)
PATCH  /api/users/123              // partial update
DELETE /api/users/123              // delete user
GET    /api/users/123/orders       // user's orders (nested resource)
POST   /api/orders/456/cancellation // create a cancellation (action as noun)

// Resource naming conventions
// ✅ Plural nouns:        /api/orders, /api/products, /api/users
// ✅ Lowercase + hyphens: /api/order-items  (not /api/orderItems)
// ✅ Nested for ownership: /api/users/123/addresses  (user's addresses)
// ❌ Don't nest too deep: /api/users/123/orders/456/items/789/reviews
//    Flatten after 2 levels: /api/reviews?orderId=456&itemId=789

// HTTP methods and their semantics
// GET    — safe (no side effects) + idempotent
// POST   — neither safe nor idempotent (creates new resource each time)
// PUT    — idempotent (same result if called multiple times with same body)
// PATCH  — not necessarily idempotent (increment operations can accumulate)
// DELETE — idempotent (deleting already-deleted resource = same state)`
      }
    },

    // ── HTTP status codes ──
    {
      speaker: "you",
      text: `"HTTP status codes — I know 200, 400, 404, 500. When does the specific code actually matter?"`
    },
    {
      speaker: "raj",
      text: `"Always — they're part of the contract. Clients make decisions based on status codes. A 401 means 'retry after getting a new token.' A 403 means 'authenticated but not allowed — retrying with a new token won't help.' A 429 means 'back off and retry after the Retry-After header.' A 503 means 'the server is temporarily unavailable — retry.' A 400 means 'the request itself is malformed — don't retry, fix the payload.' If you return 200 with <em>{ success: false }</em> in the body, clients have to parse the body to know it failed — they can't use standard HTTP machinery like retry logic, logging, or monitoring that operates on status codes."`
    },
    {
      type: "code",
      text: `// HTTP status codes — the ones that matter and when to use them

// 2xx — Success
// 200 OK           — successful GET, PATCH, DELETE
// 201 Created      — successful POST that created a resource
//                    include Location header: Location: /api/orders/789
// 202 Accepted     — request received, processing async (background job queued)
// 204 No Content   — successful DELETE or action with no response body

// 3xx — Redirection
// 301 Moved Permanently  — resource has a new permanent URL (update your bookmarks)
// 302 Found              — temporary redirect
// 304 Not Modified       — ETag/If-None-Match matched, use your cached version

// 4xx — Client errors (caller's fault — retrying the same request won't help)
// 400 Bad Request        — malformed JSON, missing required field, wrong type
// 401 Unauthorized       — not authenticated (misleadingly named — means "unauthenticated")
// 403 Forbidden          — authenticated but not authorised for this resource
// 404 Not Found          — resource doesn't exist
// 409 Conflict           — state conflict (duplicate email, optimistic lock failure)
// 410 Gone               — permanently deleted (stronger than 404 — don't retry ever)
// 422 Unprocessable      — valid JSON, valid types, but fails business validation
// 429 Too Many Requests  — include Retry-After header

// 5xx — Server errors (server's fault — may be worth retrying)
// 500 Internal Server Error — unexpected failure
// 502 Bad Gateway           — upstream service returned invalid response
// 503 Service Unavailable   — server temporarily down, include Retry-After
// 504 Gateway Timeout       — upstream service timed out

// ❌ Anti-patterns
res.status(200).json({ success: false, error: 'Not found' });     // lying with 200
res.status(400).json({ error: 'Internal database error' });        // exposing internals
res.status(500).json({ error: e.message });                        // leaking stack context
res.status(404).json({ error: 'You are not authorised' });         // wrong code for the error

// ✅ Status code matches the semantic reality
// Request has no auth token → 401
// Has token but not owner of this resource → 403
// Correct owner but resource deleted last week → 410
// Valid request but stock ran out → 409 Conflict`
      }
    },

    // ── Request/response design ──
    {
      speaker: "you",
      text: `"How should request and response bodies be structured? I see a lot of different conventions."`
    },
    {
      speaker: "raj",
      text: `"Consistency is more important than any specific convention. Pick a shape and use it everywhere. For responses: return the resource directly for single-resource endpoints. For collections: always wrap in an object — not a bare array — so you can add metadata later without a breaking change. A bare array response is a design trap: when you need to add pagination info, you have to change the shape, which breaks existing clients. Return <em>{ data: [], total: 0, cursor: null }</em> from the start and you can add fields without breaking anything. For errors: consistent structure everywhere — type, message, and optionally a field map for validation errors."`
    },
    {
      type: "code",
      text: `// Response envelope design

// ❌ Bare array — breaks when you add pagination
// GET /api/orders → [ {...}, {...}, {...} ]
// Later you need total count and cursor — now you must break the contract

// ✅ Object envelope — add fields without breaking clients
// GET /api/orders
{
  "data": [
    { "id": "ord_1", "status": "shipped", "total": 99.99 },
    { "id": "ord_2", "status": "pending", "total": 24.50 }
  ],
  "pagination": {
    "total":      243,
    "cursor":     "ord_2",
    "hasMore":    true
  }
}

// ✅ Single resource — return directly, no wrapper needed
// GET /api/orders/ord_1
{ "id": "ord_1", "status": "shipped", "total": 99.99, "items": [...] }

// ✅ Consistent error shape — every error looks the same
// 400 validation error:
{
  "error": {
    "type":    "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": {
      "email":    "Must be a valid email address",
      "password": "Must be at least 8 characters"
    }
  }
}
// 404 not found:
{
  "error": {
    "type":    "NOT_FOUND",
    "message": "Order not found"
  }
}
// 429 rate limited:
// Headers: Retry-After: 30
{
  "error": {
    "type":    "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfterSeconds": 30
  }
}

// Express — centralised error response helper
const errorResponse = (res, statusCode, type, message, fields = null) => {
  const body = { error: { type, message } };
  if (fields) body.error.fields = fields;
  return res.status(statusCode).json(body);
};`
      }
    },

    // ── Pagination ──
    {
      speaker: "you",
      text: `"Pagination — when should I use offset pagination versus cursor pagination?"`
    },
    {
      speaker: "raj",
      text: `"Offset pagination — <em>page=3&limit=20</em> — is simple and supports jumping to arbitrary pages. The problem: it's implemented as SKIP and LIMIT in the database. SKIP scans and discards rows. For page 1 you discard 0 rows. For page 100 with 20 results per page, you discard 1,980 rows before returning 20. Performance degrades linearly with page depth. Worse: if someone inserts a new item between page 1 and page 2, page 2 now shows one result you already saw on page 1. Items shift. Users get duplicates. For most APIs — infinite scroll, feeds, large datasets — cursor pagination is correct. For admin tables where users need to jump to page 47, offset is acceptable because the data is bounded."`
    },
    {
      speaker: "you",
      text: `"How does cursor pagination actually work?"`
    },
    {
      speaker: "raj",
      text: `"Instead of 'give me rows 40-60', you say 'give me 20 rows after this specific item'. The cursor is an opaque pointer to a position — typically the ID or timestamp of the last item seen. The server stores no state — the cursor is everything needed to resume. The client sends it back on the next request. Implementation: query for <em>_id greater than the cursor</em> with an index on _id, limit to page size, return the last item's _id as the next cursor. Constant time regardless of depth. Stable under insertions. Works perfectly for feeds and infinite scroll."`
    },
    {
      type: "code",
      text: `// Pagination — offset vs cursor

// Offset pagination — simple, use for admin/bounded datasets
// GET /api/orders?page=3&limit=20
app.get('/api/orders', asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20); // cap at 100
  const skip  = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ userId: req.user.userId })
  ]);

  res.json({
    data: orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}));

// Cursor pagination — use for feeds, infinite scroll, large datasets
// GET /api/feed?limit=20
// GET /api/feed?limit=20&cursor=ord_xyz123   (next page)
app.get('/api/feed', asyncHandler(async (req, res) => {
  const limit  = Math.min(100, parseInt(req.query.limit) || 20);
  const cursor = req.query.cursor; // opaque to client — they just send it back

  const query = { userId: req.user.userId };
  if (cursor) {
    query._id = { $lt: cursor }; // items before this cursor (sorted desc by _id)
  }

  const items = await FeedItem.find(query)
    .sort({ _id: -1 })           // descending — newest first
    .limit(limit + 1)            // fetch one extra to detect if there are more
    .lean();

  const hasMore    = items.length > limit;
  const pageItems  = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? pageItems.at(-1)._id : null;

  res.json({
    data:       pageItems,
    pagination: { hasMore, cursor: nextCursor } // client sends cursor back for next page
  });
}));
// O(log n) with index regardless of depth — page 1000 as fast as page 1
// Stable: new items prepended to feed don't shift pages you've already seen`
      }
    },

    // ── Filtering and sorting ──
    {
      speaker: "you",
      text: `"How should filtering and sorting be designed in a REST API?"`
    },
    {
      speaker: "raj",
      text: `"Filtering via query parameters — keep it readable. <em>?status=shipped&minTotal=50</em> not <em>?filter[status]=shipped&filter[total][gte]=50</em>. The bracket syntax looks clever but it's painful to construct and read. For sorting: <em>?sort=createdAt&order=desc</em> or a shorthand <em>?sort=-createdAt</em> where the minus sign means descending. The critical things to get right on the server: whitelist allowed filter fields — never pass raw query params to the database query. Whitelist sort fields and directions — an unsupported field with no index will cause a full collection scan. Always validate and sanitise before touching the database."`
    },
    {
      type: "code",
      text: `// Filtering and sorting — design and safe implementation

// URL design — readable query params
// GET /api/orders?status=shipped&after=2024-01-01&sort=-createdAt&limit=20
// GET /api/products?minPrice=10&maxPrice=100&category=electronics&sort=price

app.get('/api/orders', asyncHandler(async (req, res) => {
  const {
    status, after, before,
    sort    = '-createdAt', // default: newest first
    limit   = 20,
    cursor
  } = req.query;

  // Whitelist — never pass raw query params to MongoDB
  const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'total', 'status']);
  const ALLOWED_STATUSES    = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

  // Parse sort: '-createdAt' → { createdAt: -1 }
  const sortDir   = sort.startsWith('-') ? -1 : 1;
  const sortField = sort.replace(/^-/, '');
  if (!ALLOWED_SORT_FIELDS.has(sortField)) {
    throw new ValidationError('Invalid sort field: ' + sortField);
  }

  // Build query from whitelisted params
  const query = { userId: req.user.userId };

  if (status) {
    if (!ALLOWED_STATUSES.has(status)) throw new ValidationError('Invalid status');
    query.status = status;
  }
  if (after)  query.createdAt = { ...query.createdAt, $gte: new Date(after)  };
  if (before) query.createdAt = { ...query.createdAt, $lte: new Date(before) };
  if (cursor) query._id = { $lt: cursor };

  const pageLimit = Math.min(100, parseInt(limit));
  const items = await Order.find(query)
    .sort({ [sortField]: sortDir })
    .limit(pageLimit + 1)
    .lean();

  const hasMore   = items.length > pageLimit;
  const pageItems = hasMore ? items.slice(0, pageLimit) : items;

  res.json({
    data:       pageItems,
    pagination: { hasMore, cursor: hasMore ? pageItems.at(-1)._id : null }
  });
}));`
      }
    },

    // ── Versioning ──
    {
      speaker: "you",
      text: `"API versioning — URL versioning like /v1/orders, or header versioning? I've seen both."`
    },
    {
      speaker: "raj",
      text: `"URL versioning — <em>/api/v1/orders</em> — is the pragmatic choice for most APIs. It's visible, bookmarkable, easy to test in a browser, easy to route at the infrastructure level, and obvious in logs. Header versioning — <em>Accept: application/vnd.myapi.v2+json</em> — is technically 'more correct' by REST principles because the URL identifies the resource not the version. But in practice it's painful to test, invisible in browser URLs, and forces every client to set headers explicitly. The real versioning question isn't the mechanism — it's <em>what counts as a breaking change</em>. Adding a field: not breaking. Renaming a field: breaking. Removing a field: breaking. Changing a field's type: breaking. Changing status code semantics: breaking. Expanding an enum: technically not breaking but treat it as if it is."`
    },
    {
      type: "code",
      text: `// API versioning — what breaks clients and what doesn't

// ✅ Backwards-compatible changes — ship freely
// Adding a new optional field to a response
{ "id": "ord_1", "status": "shipped", "trackingUrl": "https://..." } // NEW: trackingUrl

// Adding a new optional request field (with a default)
// POST /api/orders → now accepts optional { "priority": "express" }

// Adding a new endpoint entirely
// POST /api/v1/orders/bulk  ← new, doesn't affect existing clients

// Adding a new enum value (but warn clients to handle unknown values gracefully)
// status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned" ← NEW

// ❌ Breaking changes — require a new version
// Renaming a field
{ "orderId": "..." }   → { "id": "..." }              // breaks any client reading orderId

// Changing a field's type
{ "total": 99.99 }     → { "total": "99.99" }         // string vs number — clients crash

// Removing a field
{ "estimatedDelivery": "2024-03-20" }  → field removed // clients reading it get undefined

// Changing status code semantics
// 404 → now returns 410 for deleted resources — clients may not handle 410

// Version routing — serve both versions from the same codebase
// routes/v1/orders.js — old behaviour
// routes/v2/orders.js — new behaviour, same underlying services
app.use('/api/v1', require('./routes/v1'));
app.use('/api/v2', require('./routes/v2'));

// Deprecation — give clients time, communicate clearly
app.use('/api/v1', (req, res, next) => {
  res.setHeader('Deprecation',  'Sun, 31 Dec 2024 23:59:59 GMT');
  res.setHeader('Sunset',       'Sun, 31 Dec 2024 23:59:59 GMT');
  res.setHeader('Link',         '</api/v2>; rel="successor-version"');
  next();
});`
      }
    },

    // ── REST vs GraphQL ──
    {
      speaker: "you",
      text: `"When would you choose GraphQL over REST? The mobile team keeps asking for it."`
    },
    {
      speaker: "raj",
      text: `"GraphQL solves two specific problems. <em>Over-fetching</em> — REST returns the full resource even if the client only needs three fields. GraphQL clients specify exactly the fields they want. For mobile clients on limited bandwidth, this matters. <em>Under-fetching</em> — needing multiple REST requests to assemble one screen. A dashboard needs user, orders, and reviews — three requests, or a custom REST endpoint for that screen. GraphQL lets clients ask for all three in one query. The tradeoff: complexity. You need a schema, a resolver layer, a query depth limiter to prevent abuse, query cost analysis to prevent expensive queries, and DataLoader for batching. REST is simpler to implement, simpler to cache at the HTTP layer, simpler to secure, and simpler to monitor. Choose GraphQL when you have multiple client types with genuinely divergent data needs — mobile needs minimal data, web needs rich data, a third-party needs custom subsets. Choose REST for everything else."`
    },
    {
      type: "code",
      text: `// GraphQL — solving real problems, with real tradeoffs

// The under-fetching problem — REST needs 3 requests for one screen
// GET /api/users/123          → user profile
// GET /api/users/123/orders   → user's orders
// GET /api/users/123/reviews  → user's reviews

// GraphQL — one request, client specifies exactly what it needs
const DASHBOARD_QUERY = \`
  query UserDashboard($userId: ID!) {
    user(id: $userId) {
      name
      email                         # mobile only needs these two
      avatarUrl
      orders(limit: 5, status: RECENT) {
        id
        total
        status
        product { name imageUrl }   # joined in one query
      }
      reviews(limit: 3) {
        rating
        createdAt
      }
    }
  }
\`;

// GraphQL resolver with DataLoader — N+1 prevention
const resolvers = {
  Order: {
    // Called once per order — naive implementation does N DB queries
    // DataLoader batches these into one query automatically
    product: (order, _, { loaders }) => loaders.product.load(order.productId)
  }
};

// DataLoader — batches per-item loads into one query
const productLoader = new DataLoader(async (productIds) => {
  const products  = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  return productIds.map(id => productMap.get(id.toString()) ?? null);
});

// Query depth limiting — prevent abusive nested queries
// { user { orders { user { orders { user { ... } } } } } }
const depthLimit = require('graphql-depth-limit');
const app = express();
app.use('/graphql', graphqlHTTP({
  schema,
  validationRules: [depthLimit(5)] // max 5 levels deep
}));

// When REST is still better than GraphQL:
// - Simple CRUD API with one client type
// - HTTP caching is important (GraphQL POSTs aren't cached by default)
// - You want clear per-endpoint monitoring and rate limiting
// - Your team is small and operational simplicity matters`
      }
    },

    // ── Rate limiting ──
    {
      speaker: "you",
      text: `"Rate limiting — how should it be designed into an API, not just bolted on?"`
    },
    {
      speaker: "raj",
      text: `"Rate limiting protects both you and your clients from abuse and mistakes. Design it in layers. Per-IP for unauthenticated endpoints — prevents scraping and brute force. Per-user for authenticated endpoints — so one user can't monopolise capacity. Per-endpoint for expensive operations — the search endpoint might be limited to 10 requests per minute while simple reads are 1,000. Always return the right headers: <em>X-RateLimit-Limit</em>, <em>X-RateLimit-Remaining</em>, <em>X-RateLimit-Reset</em>. These let well-behaved clients throttle themselves proactively rather than hammering until they hit a 429. And always return 429 with a <em>Retry-After</em> header so clients know when to try again."`
    },
    {
      type: "code",
      text: `// Rate limiting — layered and communicative
const rateLimit  = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Shared Redis store — rate limits work across all server instances
const store = new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) });

// Layer 1: Global rate limit — all requests
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      500,
  store,
  standardHeaders: true,  // sends X-RateLimit-* headers
  legacyHeaders:   false,
  message: { error: { type: 'RATE_LIMITED', message: 'Too many requests' } }
}));

// Layer 2: Strict limit for auth endpoints — brute force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,              // 10 login attempts per 15 minutes per IP
  store,
  keyGenerator: (req) => req.ip + ':auth' // separate bucket from general limit
});
app.post('/api/users/login',    authLimiter, loginHandler);
app.post('/api/users/register', authLimiter, registerHandler);

// Layer 3: Per-user limit for authenticated expensive endpoints
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max:      10,
  store,
  keyGenerator: (req) => req.user?.userId || req.ip, // per user, not per IP
  skip: (req) => req.user?.plan === 'enterprise'     // enterprise users exempt
});
app.get('/api/search', authMiddleware, searchLimiter, searchHandler);

// Response headers clients receive:
// X-RateLimit-Limit:     10        (max requests)
// X-RateLimit-Remaining: 7         (remaining this window)
// X-RateLimit-Reset:     1710532800 (Unix timestamp when window resets)
// Retry-After:           30        (seconds to wait — only on 429)`
      }
    },

    // ── HATEOAS ──
    {
      speaker: "you",
      text: `"Interviewers sometimes ask about HATEOAS. What is it and do real APIs use it?"`
    },
    {
      speaker: "raj",
      text: `"HATEOAS — Hypermedia As The Engine Of Application State — is the REST constraint where API responses include links to related actions and resources. The idea: a client doesn't need to know URLs in advance — they discover them from the response. A payment response includes a link to cancel it. An order response includes a link to track shipment. The client follows links rather than constructing URLs. In theory this makes APIs self-describing and lets server URLs change without breaking clients. In practice, full HATEOAS is rare — it's complex to implement, most clients don't use the links, and URL construction is simple enough that the theoretical benefit rarely justifies the cost. But <em>partial HATEOAS</em> — adding a few useful links to responses — is genuinely good API design and worth doing."`
    },
    {
      type: "code",
      text: `// Partial HATEOAS — useful links without full discovery overhead

// ✅ Include links for the most useful next actions
// GET /api/orders/ord_123
{
  "id":     "ord_123",
  "status": "processing",
  "total":  99.99,
  "_links": {
    "self":   { "href": "/api/orders/ord_123",             "method": "GET"    },
    "cancel": { "href": "/api/orders/ord_123/cancellation", "method": "POST"   },
    "items":  { "href": "/api/orders/ord_123/items",        "method": "GET"    },
    "user":   { "href": "/api/users/usr_456",               "method": "GET"    }
  }
}
// Client can follow "cancel" link without knowing the URL pattern
// If you rename the cancel URL, clients using the link still work

// Location header on creation — a small HATEOAS gesture every API should do
// POST /api/orders → 201 Created
app.post('/api/orders', asyncHandler(async (req, res) => {
  const order = await orderService.create(req.user.userId, req.body.items);
  res.setHeader('Location', \`/api/orders/\${order._id}\`); // tell client where to find it
  res.status(201).json(order);
}));

// Pagination links — practical hypermedia for collection responses
// GET /api/orders?limit=20&cursor=ord_50
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "cursor":  "ord_30"
  },
  "_links": {
    "self": { "href": "/api/orders?limit=20&cursor=ord_50" },
    "next": { "href": "/api/orders?limit=20&cursor=ord_30" }  // client just follows this
  }
}`
      }
    },

    // ── The six questions test ──
    {
      speaker: "raj",
      text: `"When you're designing a new API endpoint from scratch — in an interview or in a design doc — what questions do you ask yourself?"`
    },
    {
      speaker: "you",
      text: `"What resource it's operating on, what HTTP method..."`
    },
    {
      speaker: "raj",
      text: `"Six questions. What resource does this operate on — and is it a noun? What HTTP method represents the semantics — and is it idempotent? What status codes can this return — for success, for each error case? What does the client already have and what do they need — am I over-fetching or under-fetching? How will this be paginated, filtered, and sorted if it returns a collection? And — what breaks if I change this later? That last one is the most important. An API is a public contract. Design it like one."`
    },

    {
      type: "summary",
      points: [
        "REST is about predictability: nouns in URLs, HTTP methods carry verb semantics, clients can infer behaviour without reading docs.",
        "URL conventions: plural nouns, lowercase-hyphenated, nested resources for ownership. Flatten after two levels deep.",
        "HTTP methods: GET (safe + idempotent), PUT (idempotent), POST (neither), DELETE (idempotent). PATCH is not necessarily idempotent.",
        "Status codes are part of the contract. 401 = unauthenticated (retry with token). 403 = unauthorised (retrying won't help). 429 = rate limited (respect Retry-After). Never return 200 with success: false.",
        "Collections: always return an object envelope, never a bare array. You'll need to add pagination metadata eventually — build for it from day one.",
        "Offset pagination: simple, supports jump-to-page, degrades at depth, unstable under insertions. Cursor pagination: O(log n) always, stable, no jump-to-page.",
        "Filtering: readable query params whitelisted on the server. Sorting: ?sort=-createdAt convention. Never pass raw query params to the database.",
        "Versioning: URL versioning (/v1/) is the pragmatic choice. Breaking changes: removing/renaming fields, changing types, changing status code semantics.",
        "GraphQL solves over-fetching and under-fetching for multiple clients with divergent needs. Cost: schema, resolvers, DataLoader, depth limiting. REST is simpler for everything else.",
        "Rate limiting layers: per-IP global, strict per-IP for auth endpoints, per-user for expensive operations. Always return X-RateLimit-* headers and Retry-After.",
        "HATEOAS: full implementation is rare but partial — Location on 201, pagination next links, action links — is good practice.",
        "Six design questions: resource noun? HTTP method semantics? Status codes for each case? Data needs (over/under-fetching)? Pagination/filtering shape? What breaks if this changes?"
      ]
    }
  ]
};

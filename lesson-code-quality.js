// ─────────────────────────────────────────────────────────────────
//  LESSON: Code Quality & Best Practices
//  Category: Code Quality & Debugging
// ─────────────────────────────────────────────────────────────────

const LESSON_CODE_QUALITY = {
  category: "Code Quality & Debugging",
  tag: "Code Quality & Best Practices",
  title: "Code That Works Today and Is Readable in Six Months",
  intro: "You've been handed a 3,000-line file called helpers.js. No tests. No comments. Functions that do five things each. You need to add a feature without breaking anything. Raj finds you staring at the screen.",
  scenes: [

    // ── The real goal of code quality ──
    {
      speaker: "raj",
      text: `"Before you touch that file — what do you think code quality actually means?"`
    },
    {
      speaker: "you",
      text: `"Clean code? No bugs?"`
    },
    {
      speaker: "raj",
      text: `"It means: how fast can someone who has never seen this code understand what it does, change it safely, and not break anything else. That's it. Code quality is fundamentally about the <em>cost of change</em>. A codebase where every change takes a week of archaeology is low quality regardless of how elegant the algorithms are. A codebase where you can add a feature in an afternoon, with confidence nothing else broke, is high quality. Tests, naming, structure, separation of concerns — all of these serve that one goal."`
    },

    // ── Testing pyramid ──
    {
      speaker: "you",
      text: `"Testing. I write tests but I'm not sure I'm writing the right ones. What should the mix actually look like?"`
    },
    {
      speaker: "raj",
      text: `"The <em>testing pyramid</em>. Bottom layer: <em>unit tests</em> — fast, isolated, test one function with all dependencies mocked. Hundreds of them. Middle layer: <em>integration tests</em> — test a module with its real dependencies — real database, real Redis, but mocked external APIs. Slower but they catch wiring mistakes. Top layer: <em>end-to-end tests</em> — test the whole system from the outside like a real user. Slowest, most brittle, fewest of them. The mistake teams make is an inverted pyramid — too many E2E tests. They're slow, they fail for unrelated reasons, they don't tell you where something broke. Unit tests fail close to the problem. E2E tests tell you something is broken but not where."`
    },
    {
      type: "analogy",
      text: "Testing pyramid = quality control in a car factory. Most testing happens at the component level — each bolt torqued correctly, each wire connected. Some testing at the assembly level — does the engine fit in the car? A few full road tests. You don't take every car on a road test to verify every bolt is tight — you check the bolts individually, faster and cheaper."
    },
    {
      type: "code",
      text: `// Testing pyramid — the right ratios
//
//        ▲
//       /E2E\          ~5%  — few, slow, test critical user journeys only
//      /─────\
//     / Integ.\        ~20% — test module boundaries with real dependencies
//    /─────────\
//   /   Unit    \      ~75% — many, fast, isolated, one function at a time
//  /─────────────\
//
// Unit test — isolated, mocked dependencies, runs in milliseconds
describe('calculateOrderTotal', () => {
  it('applies discount when order exceeds threshold', () => {
    const items   = [{ price: 100, qty: 2 }, { price: 50, qty: 1 }];
    const total   = calculateOrderTotal(items, { discountThreshold: 200, discountPct: 10 });
    expect(total).toBe(225); // 250 - 10%
  });

  it('returns full price when below threshold', () => {
    const items = [{ price: 50, qty: 1 }];
    const total = calculateOrderTotal(items, { discountThreshold: 200, discountPct: 10 });
    expect(total).toBe(50); // no discount
  });
});

// Integration test — real MongoDB (in-memory or test container), real logic
describe('OrderService.create', () => {
  beforeAll(() => mongoose.connect(process.env.TEST_DB_URL));
  afterAll(() => mongoose.disconnect());
  afterEach(() => Order.deleteMany({}));

  it('creates order and decrements stock', async () => {
    await Product.create({ _id: productId, stock: 10 });
    const order = await OrderService.create({ userId, items: [{ productId, qty: 2 }] });
    const product = await Product.findById(productId);
    expect(order.status).toBe('pending');
    expect(product.stock).toBe(8);     // stock actually decremented
  });
});

// E2E test — full HTTP request through the real app
describe('POST /api/checkout', () => {
  it('returns 201 and sends confirmation email', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', 'Bearer ' + testToken)
      .send({ items: [{ productId, qty: 1 }] });
    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(emailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: testUser.email
    }));
  });
});`
      }
    },

    // ── What to test and what not to ──
    {
      speaker: "you",
      text: `"How do I know what's worth testing? I've been told to aim for 100% coverage but it feels like some tests add no value."`
    },
    {
      speaker: "raj",
      text: `"100% coverage is a vanity metric. Coverage tells you which lines ran during tests — not whether the tests actually verify correct behaviour. You can have 100% coverage with useless assertions. What you should test: <em>logic with multiple code paths</em> — conditions, edge cases, boundary values. <em>Things that can fail in non-obvious ways</em> — async operations, external service interactions, data transformations. <em>Regressions</em> — every bug you fix gets a test that would have caught it. What you shouldn't bother testing: getters and setters with no logic, framework boilerplate, third-party library behaviour. Test behaviour, not implementation."`
    },
    {
      speaker: "you",
      text: `"What do you mean by 'test behaviour, not implementation'?"`
    },
    {
      speaker: "raj",
      text: `"If you test that a function calls a specific internal method in a specific order, your test breaks every time you refactor the internals — even when the observable behaviour is unchanged. That's a brittle test that slows you down without catching real bugs. Test what the function returns or what side effects it produces — not how it does it internally. Ask: if I rewrote this function completely differently but it still produced the same output for the same input, should this test pass? If yes, it's testing behaviour. If it would fail, it's testing implementation."`
    },
    {
      type: "code",
      text: `// ❌ Testing implementation — breaks on refactor even when behaviour is correct
it('calls hashPassword then saveUser in order', async () => {
  const hashSpy = jest.spyOn(bcrypt, 'hash');
  const saveSpy = jest.spyOn(userRepo, 'save');
  await UserService.register({ email, password });
  expect(hashSpy).toHaveBeenCalledBefore(saveSpy); // testing internals
});

// ✅ Testing behaviour — what does the operation produce?
it('stores a hashed password, not the plaintext', async () => {
  await UserService.register({ email: 'alice@test.com', password: 'secret123' });
  const user = await User.findOne({ email: 'alice@test.com' });
  expect(user.password).not.toBe('secret123');          // not plaintext ✓
  expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);   // looks like bcrypt hash ✓
});

// ❌ Testing obvious framework behaviour — no value
it('creates a Mongoose model instance', () => {
  const user = new User({ email });
  expect(user).toBeInstanceOf(User); // testing mongoose, not your code
});

// ✅ Testing your validation logic — could actually fail
it('rejects email without @ symbol', async () => {
  await expect(User.create({ email: 'notanemail', password: 'pass123' }))
    .rejects.toThrow('Path email is invalid');
});

// Edge cases and boundaries — high value
it('handles empty cart on checkout', async () => {
  await expect(OrderService.create({ userId, items: [] }))
    .rejects.toThrow('Cart cannot be empty');
});

it('handles exactly zero stock on checkout', async () => {
  await Product.create({ _id: productId, stock: 0 });
  await expect(OrderService.create({ userId, items: [{ productId, qty: 1 }] }))
    .rejects.toThrow('Insufficient stock');
});`
      }
    },

    // ── Mocking strategies ──
    {
      speaker: "you",
      text: `"When should I mock something versus using the real thing in a test?"`
    },
    {
      speaker: "raj",
      text: `"Mock external boundaries — things outside your codebase. Third-party APIs, email services, payment gateways, anything that has side effects in the real world or is slow and unpredictable. Mock them in unit tests. In integration tests, use the real database and real Redis but mock external HTTP calls. Never mock what you're testing — if you mock the database in an integration test for a database query, you're not testing anything. The practical heuristic: if the thing you're about to mock is code you wrote, don't mock it — test through it. If it's a network call or a third-party library with real-world side effects, mock it."`
    },
    {
      type: "code",
      text: `// Jest mocking — what and how

// ✅ Mock external HTTP calls — nondeterministic, has side effects
jest.mock('axios');
const axios = require('axios');

it('sends order data to fulfillment service', async () => {
  axios.post.mockResolvedValueOnce({ data: { shipmentId: 'ship-123' } });
  const result = await fulfillmentService.createShipment(order);
  expect(axios.post).toHaveBeenCalledWith(
    'https://fulfillment.example.com/shipments',
    expect.objectContaining({ orderId: order._id })
  );
  expect(result.shipmentId).toBe('ship-123');
});

// ✅ Mock email service — side effect in the real world
const emailService = require('../services/emailService');
jest.mock('../services/emailService');

afterEach(() => jest.clearAllMocks()); // reset call counts between tests

it('sends confirmation email after successful checkout', async () => {
  await OrderService.checkout(userId, cartId);
  expect(emailService.send).toHaveBeenCalledTimes(1);
  expect(emailService.send).toHaveBeenCalledWith(
    expect.objectContaining({ template: 'order-confirmation' })
  );
});

// ✅ Mock time — for testing TTLs, expiry, scheduled behaviour
const RealDate = Date;
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-03-10T10:00:00Z'));
});
afterAll(() => jest.useRealTimers());

it('expires session token after 15 minutes', async () => {
  const token = await createSession(userId);
  jest.advanceTimersByTime(16 * 60 * 1000); // advance 16 minutes
  await expect(validateSession(token)).rejects.toThrow('Session expired');
});

// ❌ Don't mock your own database queries in integration tests
it('creates order in database', async () => {
  const mockSave = jest.spyOn(Order.prototype, 'save').mockResolvedValue(fakeOrder);
  // ...
  // You're testing that you called .save() — not that the order was actually saved correctly
});`
      }
    },

    // ── SOLID principles ──
    {
      speaker: "you",
      text: `"SOLID principles — I know the acronym but I couldn't explain how they apply to real Node code."`
    },
    {
      speaker: "raj",
      text: `"Let's do the two that matter most in practice. <em>Single Responsibility</em>: a module should have one reason to change. That 3,000-line helpers.js has hundreds of reasons to change — it violates SRP catastrophically. When you change the email logic, you risk breaking the payment logic because they're in the same file. Split it so each file owns one concern. Changes to email affect only the email module. <em>Dependency Inversion</em>: your high-level business logic shouldn't depend on concrete low-level implementations. OrderService shouldn't import Nodemailer directly — it should depend on an email interface. In tests, inject a mock. In production, inject the real Nodemailer adapter. Your business logic is now testable without a mail server."`
    },
    {
      speaker: "you",
      text: `"What about Open/Closed, Liskov, and Interface Segregation?"`
    },
    {
      speaker: "raj",
      text: `"Open/Closed matters when you're adding behaviour — extend by adding new code, not by modifying existing code. If you have a payment processor that handles Stripe and you need to add PayPal — add a PayPal adapter, don't modify the Stripe code. Liskov means subtypes should be substitutable for their base type without breaking behaviour — if you have a CachedUserRepository that extends UserRepository, it must fulfil the same contract. Interface Segregation — don't force clients to depend on methods they don't use. Practically in JavaScript: if you're passing a service object to a function that only uses one method, don't pass the entire service — pass just the function it needs."`
    },
    {
      type: "code",
      text: `// Single Responsibility — one module, one reason to change
// ❌ helpers.js — everything in one file
module.exports = { sendEmail, hashPassword, formatCurrency, validateAddress, parseCSV };

// ✅ Each concern in its own module
// services/email.js    → only email sending
// utils/crypto.js      → only hashing/encryption
// utils/currency.js    → only currency formatting
// validators/address.js → only address validation

// Dependency Inversion — depend on abstractions, not concretions
// ❌ OrderService directly imports a concrete dependency
const nodemailer = require('nodemailer');
class OrderService {
  async checkout(order) {
    // ... order logic ...
    await nodemailer.createTransport(smtpConfig).sendMail(emailOptions); // tightly coupled
  }
}

// ✅ OrderService depends on an interface — injected from outside
class OrderService {
  constructor(emailService) {         // injected — could be real or mock
    this.emailService = emailService;
  }
  async checkout(order) {
    // ... order logic ...
    await this.emailService.send({    // calls the interface, not nodemailer
      to:       order.userEmail,
      template: 'order-confirmation',
      data:     { orderId: order._id }
    });
  }
}

// Production: inject real implementation
const emailAdapter = new NodemailerAdapter(smtpConfig);
const orderService = new OrderService(emailAdapter);

// Tests: inject mock
const mockEmail = { send: jest.fn().mockResolvedValue(true) };
const orderService = new OrderService(mockEmail);
// Business logic tested — no SMTP server needed

// Open/Closed — add behaviour by adding code, not modifying it
// ❌ Modifying existing code to add PayPal
class PaymentService {
  async charge(order, method) {
    if (method === 'stripe') { /* stripe logic */ }
    else if (method === 'paypal') { /* NEW paypal logic mixed in */ } // modified existing code
  }
}

// ✅ Add PayPal by adding a new adapter
class StripeAdapter  { async charge(amount) { /* ... */ } }
class PaypalAdapter  { async charge(amount) { /* ... */ } } // new file, existing code untouched

class PaymentService {
  constructor(adapter) { this.adapter = adapter; }
  async charge(order) { return this.adapter.charge(order.total); }
}`
      }
    },

    // ── Separation of concerns / layered architecture ──
    {
      speaker: "you",
      text: `"How should a Node API be structured? I see different patterns — MVC, service layer, repository pattern..."`
    },
    {
      speaker: "raj",
      text: `"The layered architecture is the most practical for a Node API. Three layers. <em>Routes/Controllers</em> — parse HTTP request, validate input, call the service, format the HTTP response. Zero business logic here. <em>Services</em> — contain all business logic. Orchestrate calls between repositories, enforce business rules, handle transactions. Independent of HTTP — a service should work whether called by an HTTP handler, a cron job, or a test. <em>Repositories</em> — contain all database queries. The service calls a repository, the repository calls Mongoose or the DB driver. Services never write raw queries. This separation means you can test services without HTTP, and test queries without business logic."`
    },
    {
      type: "code",
      text: `// Layered architecture — three clear layers

// Layer 1: Route/Controller — HTTP only, no business logic
// routes/orders.js
router.post('/', [authMiddleware, validateOrder, validate], asyncHandler(async (req, res) => {
  const order = await orderService.create(req.user.userId, req.body.items);
  res.status(201).json(order); // format HTTP response
}));

// Layer 2: Service — business logic, no HTTP, no raw DB queries
// services/orderService.js
class OrderService {
  constructor(orderRepository, productRepository, emailService) {
    this.orders   = orderRepository;
    this.products = productRepository;
    this.email    = emailService;
  }

  async create(userId, items) {
    // Business rules
    if (!items.length) throw new AppError('Cart cannot be empty', 400);

    // Check stock (via repository — no Mongoose here)
    for (const item of items) {
      const product = await this.products.findById(item.productId);
      if (!product || product.stock < item.qty)
        throw new AppError('Insufficient stock for ' + item.productId, 400);
    }

    // Create order (via repository)
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const order = await this.orders.create({ userId, items, total, status: 'pending' });

    // Side effects
    await this.email.send({ template: 'order-confirmation', to: userId });
    return order;
  }
}

// Layer 3: Repository — database queries only, no business logic
// repositories/orderRepository.js
class OrderRepository {
  async create(data) {
    return Order.create(data); // Mongoose here — nowhere else
  }

  async findByUserId(userId, { limit = 20, cursor } = {}) {
    const query = cursor ? { userId, _id: { $lt: cursor } } : { userId };
    return Order.find(query).sort({ _id: -1 }).limit(limit).lean();
  }

  async updateStatus(orderId, status) {
    return Order.findByIdAndUpdate(orderId, { status }, { new: true });
  }
}

// Benefits: test OrderService by injecting mock repositories — no DB needed
// Benefits: swap Mongoose for a different ORM by only changing repositories
// Benefits: use OrderService from HTTP handler, cron job, CLI — same logic`
      }
    },

    // ── Error handling patterns ──
    {
      speaker: "you",
      text: `"How should errors be handled across a layered codebase? Throw? Return error objects? Error codes?"`
    },
    {
      speaker: "raj",
      text: `"Throw — but with <em>typed errors</em>. A plain Error thrown from a service doesn't tell the HTTP layer what status code to use. A custom AppError class carries a status code and whether it's operational — expected and safe to show to the user. ValidationError for 400s, NotFoundError for 404s, UnauthorizedError for 401s. The centralized error handler in Express checks the error type and maps it to an HTTP response. The service doesn't know or care about HTTP — it just throws a typed error describing what went wrong. The HTTP layer maps it to a response. That separation is clean and testable."`
    },
    {
      type: "code",
      text: `// Typed error hierarchy — services throw these, HTTP layer maps them
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = isOperational; // true = expected, safe to show user
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError  extends AppError { constructor(msg) { super(msg, 400); } }
class UnauthorizedError extends AppError { constructor(msg) { super(msg, 401); } }
class ForbiddenError    extends AppError { constructor(msg) { super(msg, 403); } }
class NotFoundError     extends AppError { constructor(msg) { super(msg, 404); } }
class ConflictError     extends AppError { constructor(msg) { super(msg, 409); } }

// Service throws typed errors — no HTTP knowledge
class OrderService {
  async findById(orderId, userId) {
    const order = await this.orders.findById(orderId);
    if (!order)              throw new NotFoundError('Order not found');
    if (!order.userId.equals(userId)) throw new ForbiddenError('Not your order');
    return order;
  }
}

// Centralised error handler — one place maps errors to HTTP responses
app.use((err, req, res, next) => {
  // Log everything, but only show details on operational errors
  logger.error({ err, url: req.url, userId: req.user?.userId });

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unknown/programmer errors — don't leak internals
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
  res.status(500).json({ error: 'Something went wrong' });
});

// Testing error paths explicitly
it('throws NotFoundError for unknown order', async () => {
  await expect(orderService.findById('nonexistent-id', userId))
    .rejects.toBeInstanceOf(NotFoundError);
});`
      }
    },

    // ── Code review culture ──
    {
      speaker: "you",
      text: `"What makes a good code review? I feel like ours just check for typos."`
    },
    {
      speaker: "raj",
      text: `"A code review is not a bug hunt — that's what tests are for. A good code review asks: does this code do what it claims? Are there edge cases the author missed? Is the change appropriately tested? Is the naming clear enough that a future developer understands the intent? Does this introduce tech debt? Does it follow the patterns already established in the codebase? The things reviewers should not spend time on: formatting, import ordering, semicolons — all of that is automated. If your CI doesn't enforce it, add a rule. Human review time is expensive and should be spent on logic and design, not style."`
    },
    {
      type: "code",
      text: `// Code review checklist — what to actually look for

// ✅ Logic correctness
// Does the happy path work? What about edge cases?
// Empty array, null input, concurrent execution, network failure

// ✅ Test coverage of the change
// Is the new behaviour tested? Are error paths tested?
// Would these tests catch a regression?

// ✅ Naming and clarity
// Does the function name describe what it does?
// Are variable names informative?

// ❌ processData(d) { ... }
// ✅ formatCurrencyForDisplay(amountInCents) { ... }

// ✅ Appropriate error handling
// What happens on failure? Is the error actionable?
// Will this silently swallow errors?

// ✅ Security implications
// Does this expose sensitive data?
// Is user input validated before reaching the DB?
// Does this create a mass assignment vulnerability?

// ✅ Performance implications
// Is there a query inside a loop?
// Does this load an unbounded dataset into memory?
// Is there a missing index for the query pattern introduced?

// ✅ PR size — the most impactful review factor
// PRs over 400 lines are statistically reviewed worse
// Large PRs = reviewers skim = real bugs slip through
// Small, focused PRs = better reviews = fewer production bugs

// .github/pull_request_template.md — guide reviewers and authors
// ## What does this PR do?
// ## How was it tested?
// ## Edge cases considered
// ## Screenshots (if UI change)
// ## Checklist: [ ] Tests added  [ ] No console.logs  [ ] No hardcoded values`
      }
    },

    // ── Documentation ──
    {
      speaker: "you",
      text: `"How much documentation is actually needed? I feel like comments everywhere are just noise."`
    },
    {
      speaker: "raj",
      text: `"The rule: good code documents the <em>what</em> through naming. Comments document the <em>why</em>. If you need a comment to explain what code does, the code should be rewritten to be self-explanatory. But the why — the business context, the gotcha, the non-obvious tradeoff — that belongs in a comment. Why do we add this 100ms delay? Why do we check for this specific error code? Why is this calculation done this way despite looking wrong? That context doesn't belong in the code, it belongs in a comment that'll still be there six months later."`
    },
    {
      type: "code",
      text: `// ❌ Comments that describe what the code obviously does
const total = items.reduce((sum, item) => sum + item.price, 0);
// adds up all item prices to get total ← explains nothing new

// ✅ Comments that explain WHY
// Stripe requires amounts in smallest currency unit (cents for USD)
// Our DB stores as dollars (float) — convert here to avoid Stripe validation error
const amountInCents = Math.round(order.total * 100);

// We intentionally delay 100ms here — the inventory service
// has an eventual consistency lag from its replica and may return
// stale stock counts if checked immediately after a write (see: INV-342)
await sleep(100);
const stock = await inventoryService.getStock(productId);

// JSDoc — especially valuable for public service methods and utilities
/**
 * Creates an order and initiates payment.
 *
 * @param {string} userId - The ID of the purchasing user
 * @param {Array<{productId: string, qty: number}>} items - Cart items
 * @throws {ValidationError} If cart is empty or items are invalid
 * @throws {NotFoundError} If a product doesn't exist
 * @throws {AppError} If stock is insufficient (409)
 * @returns {Promise<Order>} The created order with status 'pending'
 */
async create(userId, items) { ... }

// Architectural decision records (ADRs) — for big decisions
// docs/decisions/001-use-mongodb-over-postgres.md
// Context: need flexible schema for product catalog with varying attributes
// Decision: MongoDB for product catalog, Postgres for financial transactions
// Consequences: two DBs to manage but best tool for each job
// Alternatives considered: JSONB in Postgres, single Mongo for everything`
      }
    },

    // ── Refactoring safely ──
    {
      speaker: "raj",
      text: `"Back to that 3,000-line helpers.js. How would you actually safely refactor it without breaking anything?"`
    },
    {
      speaker: "you",
      text: `"Tests first? But there are no tests..."`
    },
    {
      speaker: "raj",
      text: `"Exactly — and that's the trap. You can't safely refactor without tests, but you can't easily add tests to untested spaghetti. The technique is called <em>characterisation testing</em>. Before touching anything, write tests that describe what the code currently does — not what it should do. Call the function with various inputs and record the outputs. These tests don't judge the code — they just characterise its current behaviour. Now you have a safety net. Refactor to extract the email logic into its own module. Run the tests. Still passing — you didn't break anything. Extract the payment logic. Run tests. Repeat until helpers.js is gone."`
    },
    {
      type: "code",
      text: `// Characterisation testing — capture current behaviour before refactoring

// Step 1: Call the function with various inputs, record outputs
// Don't judge whether they're right — just capture current behaviour
describe('helpers.processPayment (characterisation)', () => {
  it('returns expected structure for valid card', async () => {
    const result = await helpers.processPayment({
      amount: 100, cardToken: 'tok_valid', currency: 'usd'
    });
    // Record actual output — even if it looks wrong
    expect(result).toMatchSnapshot(); // first run records the snapshot
  });

  it('throws for invalid token', async () => {
    await expect(helpers.processPayment({ amount: 100, cardToken: 'invalid' }))
      .rejects.toThrow(); // record that it throws (exact message might change)
  });
});

// Step 2: Now refactor safely — tests catch regressions
// Extract processPayment from helpers.js to services/paymentService.js
// Run tests — still green? Good. The behaviour is preserved.

// Step 3: Once extracted, improve the tests to test intent not just snapshot
it('charges correct amount in cents', async () => {
  const stripe = require('stripe');
  jest.mock('stripe');
  stripe().charges.create.mockResolvedValue({ id: 'ch_123', status: 'succeeded' });

  await paymentService.charge({ amountDollars: 19.99, cardToken: 'tok_test' });

  expect(stripe().charges.create).toHaveBeenCalledWith(
    expect.objectContaining({ amount: 1999 }) // verify cents conversion
  );
});

// The Boy Scout Rule — leave code cleaner than you found it
// Don't refactor everything in one PR
// But when you touch a function: improve its name, extract a helper,
// add a missing test. Small improvements every pass compound over time.`
      }
    },

    {
      type: "summary",
      points: [
        "Code quality = cost of change. How fast can someone understand, modify, and safely ship changes? That's the metric.",
        "Testing pyramid: 75% unit (fast, isolated), 20% integration (real DB), 5% E2E (critical journeys only). Inverted pyramid = slow, brittle suite.",
        "Test behaviour not implementation. If you can rewrite the internals and the test still passes, it's testing the right thing.",
        "100% coverage is a vanity metric. Test logic with multiple paths, edge cases, error paths. Not framework boilerplate.",
        "Mock external boundaries: third-party APIs, email, payment gateways. Don't mock your own code in integration tests.",
        "Fake timers for testing TTLs and expiry — jest.useFakeTimers() + jest.advanceTimersByTime().",
        "Single Responsibility: one reason to change per module. Dependency Inversion: depend on interfaces, inject implementations.",
        "Layered architecture: Routes (HTTP parsing) → Services (business logic) → Repositories (DB queries). Services don't know about HTTP or raw queries.",
        "Typed errors: ValidationError (400), NotFoundError (404), ForbiddenError (403). Centralised error handler maps types to HTTP responses.",
        "Code reviews check logic, edge cases, test quality, naming, security implications. Not formatting — that's automated.",
        "Comments explain WHY, not WHAT. Self-documenting code explains what. JSDoc for public service methods. ADRs for architectural decisions.",
        "Characterisation tests: write tests describing current behaviour before refactoring legacy code. Safety net first, then refactor.",
        "Boy Scout Rule: leave code cleaner than you found it. Small improvements every PR compound into a maintainable codebase."
      ]
    }
  ]
};

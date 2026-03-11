// ─────────────────────────────────────────────────────────────────
//  LESSON: Design Patterns in MERN
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_DESIGN_PATTERNS = {
  category: "Architecture & System Design",
  tag: "Design Patterns",
  title: "The Patterns Behind the Code You Already Write",
  intro: "You're in a code review. The comment says 'this should use a Repository pattern' and 'extract this into a Strategy.' You nod. You have no idea what either of those means in a Node codebase. Raj pulls up the file.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"I keep seeing 'design pattern' thrown around in reviews and interviews. I thought they were like... abstract academic things. Singleton, Observer, Factory. Do people actually use those?"`
    },
    {
      speaker: "raj",
      text: `"You're already using most of them. You just don't know the names."`
    },
    {
      speaker: "you",
      text: `"What do you mean?"`
    },
    {
      speaker: "raj",
      text: `"Every time you write Express middleware you're using the <em>Chain of Responsibility</em> pattern. Every time you write a service layer between your routes and your database, that's a <em>Facade</em>. Every time you do mongoose.connection once and export it, that's a <em>Singleton</em>. Design patterns aren't academic exercises — they're names for solutions that keep reappearing because the same problems keep reappearing. Knowing the names matters in interviews and in code reviews. Knowing <em>why</em> they exist matters for every codebase you'll ever work in."`
    },

    // ── Repository pattern ──
    {
      speaker: "you",
      text: `"The most common one I see in reviews is the Repository pattern. Right now I just call mongoose directly from my service — what's wrong with that?"`
    },
    {
      speaker: "raj",
      text: `"Walk me through what happens when you want to test your order service."`
    },
    {
      speaker: "you",
      text: `"I'd need a database running. Or I'd mock mongoose directly, which is painful."`
    },
    {
      speaker: "raj",
      text: `"That's the problem. Your service knows it's talking to MongoDB. If you ever switch to PostgreSQL, or add a Redis cache, or just want to run tests without a database, the service has to change. The <em>Repository pattern</em> puts a layer between your service and the database. The service calls a repository — which looks like a plain JavaScript object with methods like findById and save. The service doesn't know or care what's underneath that interface. In tests you swap the real repository for a fake one that just stores things in memory. In production it calls Mongoose. The interface is identical. The service never changes."`
    },
    {
      type: "code",
      text: `// ✗ Without Repository — service knows it's talking to MongoDB
class OrderService {
  async getOrder(orderId) {
    return await Order.findById(orderId).populate('user');  // Mongoose baked in
  }
  async createOrder(data) {
    const order = new Order(data);
    return await order.save();                              // Mongoose baked in
  }
}
// To test: need a real DB connection or a complex mongoose mock
// To switch DB: rewrite every method in every service

// ✓ With Repository — service talks to an interface
class MongoOrderRepository {
  async findById(orderId) {
    return await Order.findById(orderId).populate('user').lean();
  }
  async findByUserId(userId) {
    return await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  }
  async create(data) {
    return await Order.create(data);
  }
  async updateStatus(orderId, status) {
    return await Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean();
  }
}

// Service only knows the interface — not the implementation
class OrderService {
  constructor(orderRepository) {          // injected — not imported directly
    this.orderRepo = orderRepository;
  }
  async getOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }
  async createOrder(userId, items) {
    // business logic here — no DB calls
    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return await this.orderRepo.create({ userId, items, total, status: 'pending' });
  }
}

// ── In tests: swap the real repository for an in-memory fake ──
class InMemoryOrderRepository {
  constructor() { this.orders = new Map(); }
  async findById(id)         { return this.orders.get(id) ?? null; }
  async create(data)         { const order = { _id: 'test-id', ...data };
                               this.orders.set(order._id, order); return order; }
  async updateStatus(id, s)  { const o = this.orders.get(id); o.status = s; return o; }
}

// Test — no database, no mocking framework needed
const repo    = new InMemoryOrderRepository();
const service = new OrderService(repo);
const order   = await service.createOrder('user-1', [{ price: 10, qty: 2 }]);
assert.equal(order.total, 20);`
    },

    // ── Service Layer / Facade ──
    {
      speaker: "you",
      text: `"I do have a service layer already — but mine does a bit of everything. It calls mongoose, sends emails, calls stripe, formats responses. Is that still a service layer?"`
    },
    {
      speaker: "raj",
      text: `"That's a service doing five jobs. What does your route handler look like?"`
    },
    {
      speaker: "you",
      text: `"Pretty thin — it just calls the service and sends the response."`
    },
    {
      speaker: "raj",
      text: `"Good, that part is right. The route is the HTTP boundary — parse the request, call the service, format the response. Nothing else. The service is the business logic boundary — it orchestrates: call the repository, apply the rules, maybe call a third-party. The problem you described is the service importing Stripe directly, importing nodemailer directly. When Stripe changes their API or you swap to a different mailer, you're inside your business logic making those changes. Each external dependency should be behind its own thin wrapper — an <em>Adapter</em>. The service calls a PaymentAdapter. Whether that adapter talks to Stripe, Braintree, or a mock in tests, the service doesn't care."`
    },
    {
      type: "analogy",
      text: "The service layer is a hotel concierge. You tell the concierge what you need — book a table, arrange a car, get flowers. The concierge knows which restaurants to call, which car company to use, which florist. You don't deal with any of them directly. If the florist changes, the concierge handles it — you just keep saying 'get flowers.' The service is the concierge. The adapters are the vendors."
    },
    {
      type: "code",
      text: `// ── Three-layer architecture: Route → Service → Repository ──

// ── Layer 1: Route/Controller — HTTP only ──
// src/routes/orders.js
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.userId, req.body);
  res.status(201).json(order);
  // No business logic. No DB calls. No Stripe. Just HTTP.
}));

// ── Layer 2: Service — business logic + orchestration ──
// src/services/OrderService.js
class OrderService {
  constructor({ orderRepo, paymentAdapter, emailAdapter }) {
    this.orderRepo      = orderRepo;
    this.paymentAdapter = paymentAdapter;
    this.emailAdapter   = emailAdapter;
  }

  async placeOrder(userId, { items, shippingAddress }) {
    const total = this.calculateTotal(items);

    // Business rule: minimum order value
    if (total < 5) throw new ValidationError('Minimum order is £5');

    const charge = await this.paymentAdapter.charge({ userId, amount: total });

    const order = await this.orderRepo.create({
      userId, items, shippingAddress, total,
      chargeId: charge.id,
      status: 'confirmed',
    });

    await this.emailAdapter.sendOrderConfirmation({ userId, order });
    return order;
  }

  calculateTotal(items) {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }
  // Testable in isolation: inject fake adapters, test business rules only
}

// ── Layer 3: Adapters — each external dependency wrapped ──
// src/adapters/StripePaymentAdapter.js
class StripePaymentAdapter {
  async charge({ userId, amount }) {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'gbp',
      metadata: { userId },
    });
  }
}

// src/adapters/SendGridEmailAdapter.js
class SendGridEmailAdapter {
  async sendOrderConfirmation({ userId, order }) {
    await sgMail.send({
      to: order.email, from: 'orders@myapp.com',
      templateId: 'd-abc123', dynamicTemplateData: { order },
    });
  }
}

// Swap Stripe for Braintree: write BraintreePaymentAdapter, inject it.
// Service never changes.`
    },

    // ── Singleton ──
    {
      speaker: "you",
      text: `"Singleton — I know the name. It's where you only have one instance of something. I probably do that with my mongoose connection without thinking about it."`
    },
    {
      speaker: "raj",
      text: `"Exactly right. What would happen if you didn't — if you called mongoose.connect() inside every file that needed the database?"`
    },
    {
      speaker: "you",
      text: `"You'd open a new connection every time a file was imported. Hundreds of connections, all wasted."`
    },
    {
      speaker: "raj",
      text: `"And in Node that pattern is baked into the module system. When you import a file, Node caches the module — every subsequent import returns the same instance. So if you connect in a db.js file and export the connection, every file that imports db.js gets the same connection. That's a Singleton, but the module cache is doing the work. The pattern becomes explicit when you need to control it yourself — like a logger that shouldn't be re-instantiated, or a config object that reads env vars once at startup. The mistake people make is <em>overusing</em> it: making things Singletons because it's convenient, when really they should be injected so tests can swap them out."`
    },
    {
      type: "code",
      text: `// ── Implicit Singleton via Node module cache ──
// src/db.js
import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;                      // guard: only connect once
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log('MongoDB connected');
};

export default mongoose.connection;
// Every import of this file gets the same mongoose.connection instance
// Node's module cache is the Singleton mechanism

// ── Explicit Singleton — when you need more control ──
// src/config.js
class Config {
  static #instance = null;

  constructor() {
    if (Config.#instance) return Config.#instance;  // return existing if already made
    this.port    = parseInt(process.env.PORT) || 3001;
    this.env     = process.env.NODE_ENV || 'development';
    this.isDev   = this.env === 'development';
    this.isProd  = this.env === 'production';
    Config.#instance = this;
  }

  static getInstance() {
    if (!Config.#instance) new Config();
    return Config.#instance;
  }
}

export const config = Config.getInstance();
// import { config } from './config.js'  — always the same object

// ── Logger Singleton via module export ──
// src/logger.js
import pino from 'pino';

// Created once when module first loads — all imports share it
const logger = pino({
  level:     process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined,
});

export default logger;

// ── The Singleton trap in tests ──
// If your service imports config or logger directly, tests can't swap them.
// Rule: inject dependencies. Singleton is fine for app-wide infrastructure
// (DB connection, logger, config) but not for things tests need to control.`
    },

    // ── Factory pattern ──
    {
      speaker: "you",
      text: `"Factory — I know it creates objects. But I don't know when I'd reach for it over just calling new directly."`
    },
    {
      speaker: "raj",
      text: `"When the creation logic is complex, conditional, or needs to be hidden from the caller. Show me how you'd create a notification — email vs SMS vs push."`
    },
    {
      speaker: "you",
      text: `"Probably an if-else — check the type, call the right class."`
    },
    {
      speaker: "raj",
      text: `"And that if-else lives where? In the service that needs to send a notification?"`
    },
    {
      speaker: "you",
      text: `"Yeah, I'd put it in the service."`
    },
    {
      speaker: "raj",
      text: `"Now you add a fourth notification type. You open the service — which has nothing to do with how notifications are constructed — and add another branch. A <em>Factory</em> moves that decision out. The service says 'give me a notifier for this user' and the factory decides which implementation to return based on the user's preferences. The service doesn't know and doesn't care. Add a new type: change the factory, not the service. In a MERN context you'll see this most in error handling, notification systems, payment provider selection, and anywhere you have a family of implementations behind one interface."`
    },
    {
      type: "code",
      text: `// ✗ Without Factory — creation logic scattered in the caller
class NotificationService {
  async send(user, message) {
    let notifier;
    if (user.preferences.channel === 'email') {
      notifier = new EmailNotifier(sgMail, user.email);
    } else if (user.preferences.channel === 'sms') {
      notifier = new SMSNotifier(twilio, user.phone);
    } else if (user.preferences.channel === 'push') {
      notifier = new PushNotifier(fcm, user.deviceToken);
    }
    // Add Slack? Open NotificationService and add another branch.
    await notifier.send(message);
  }
}

// ✓ With Factory — creation logic in one place
// src/factories/NotifierFactory.js
class NotifierFactory {
  static create(user) {
    const channel = user.preferences?.channel ?? 'email';

    const notifiers = {
      email: () => new EmailNotifier(sgMail,       user.email),
      sms:   () => new SMSNotifier(twilio,          user.phone),
      push:  () => new PushNotifier(fcm,            user.deviceToken),
      slack: () => new SlackNotifier(slackClient,   user.slackId),
    };

    const factory = notifiers[channel];
    if (!factory) throw new Error(\`Unknown notification channel: \${channel}\`);
    return factory();
  }
}

// Service stays clean
class NotificationService {
  async send(user, message) {
    const notifier = NotifierFactory.create(user);
    await notifier.send(message);
  }
}
// Add WhatsApp: add one entry to the notifiers map. Service never touched.

// ── Factory for Express error handlers ──
// Different error types need different response shapes — factory centralises this
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
  }
  static notFound(msg = 'Not found')          { return new AppError(msg, 404, 'NOT_FOUND'); }
  static unauthorized(msg = 'Unauthorized')   { return new AppError(msg, 401, 'UNAUTHORIZED'); }
  static badRequest(msg = 'Bad request')      { return new AppError(msg, 400, 'BAD_REQUEST'); }
  static conflict(msg = 'Conflict')           { return new AppError(msg, 409, 'CONFLICT'); }
}

// Usage — caller doesn't construct manually, uses the factory methods
if (!user) throw AppError.notFound('User not found');
if (!isValid) throw AppError.badRequest('Invalid email format');`
    },

    // ── Observer / Event Emitter ──
    {
      speaker: "you",
      text: `"Observer — I've used EventEmitter in Node but I never thought of it as a design pattern."`
    },
    {
      speaker: "raj",
      text: `"That's exactly what it is. What does EventEmitter give you that a direct function call doesn't?"`
    },
    {
      speaker: "you",
      text: `"Multiple things can listen to the same event without the emitter knowing about them."`
    },
    {
      speaker: "raj",
      text: `"Right. The emitter and the listeners are <em>decoupled</em>. Order placed — emit an event. The analytics module listens. The stock module listens. The email module listens. None of them know about each other, and the order module doesn't know they exist. You want to add audit logging? Add a listener. You want to remove analytics? Delete the listener. The order module never changes. In a MERN app you'll use this pattern inside a single process — EventEmitter for in-process events, a message queue like RabbitMQ for cross-service events. Same idea, different scope."`
    },
    {
      type: "code",
      text: `// ── Observer via Node EventEmitter ──
// src/events/orderEvents.js
import { EventEmitter } from 'events';
export const orderEvents = new EventEmitter();
export const ORDER_EVENTS = {
  PLACED:     'order:placed',
  CONFIRMED:  'order:confirmed',
  CANCELLED:  'order:cancelled',
};

// ── Emitter — doesn't know who's listening ──
// src/services/OrderService.js
import { orderEvents, ORDER_EVENTS } from '../events/orderEvents.js';

class OrderService {
  async placeOrder(userId, items) {
    const order = await this.orderRepo.create({ userId, items, status: 'pending' });
    orderEvents.emit(ORDER_EVENTS.PLACED, { order, userId });
    // Emit and move on. Doesn't know or care who handles it.
    return order;
  }
}

// ── Listeners — registered at startup, unknown to the emitter ──
// src/listeners/analyticsListener.js
import { orderEvents, ORDER_EVENTS } from '../events/orderEvents.js';

orderEvents.on(ORDER_EVENTS.PLACED, async ({ order }) => {
  await analytics.track('order_placed', { orderId: order._id, total: order.total });
});

// src/listeners/inventoryListener.js
orderEvents.on(ORDER_EVENTS.PLACED, async ({ order }) => {
  for (const item of order.items) {
    await inventoryRepo.decrement(item.productId, item.qty);
  }
});

// src/listeners/emailListener.js
orderEvents.on(ORDER_EVENTS.PLACED, async ({ order, userId }) => {
  const user = await userRepo.findById(userId);
  await emailAdapter.sendOrderConfirmation({ user, order });
});

// ── Register all listeners at app startup ──
// src/index.js
import './listeners/analyticsListener.js';
import './listeners/inventoryListener.js';
import './listeners/emailListener.js';
// Order Service never imported any of these.

// ── Caveat: error handling in async listeners ──
// EventEmitter doesn't catch async errors — add a wrapper
const asyncListener = (fn) => (...args) => {
  Promise.resolve(fn(...args)).catch(err => {
    logger.error({ event: 'listener_error', err: err.message });
  });
};

orderEvents.on(ORDER_EVENTS.PLACED, asyncListener(async ({ order }) => {
  await analytics.track('order_placed', { orderId: order._id });
}));`
    },

    // ── Strategy pattern ──
    {
      speaker: "you",
      text: `"Strategy — I've seen that term in reviews but I don't know what it means."`
    },
    {
      speaker: "raj",
      text: `"Here's a situation. You have a discount system — sometimes it's a percentage off, sometimes it's a flat amount, sometimes it's buy-two-get-one. How do you structure that?"`
    },
    {
      speaker: "you",
      text: `"An if-else or switch on the discount type inside the order calculation."`
    },
    {
      speaker: "raj",
      text: `"And when marketing invents a new discount type for the Black Friday campaign, you open the order calculation function and add another branch. The <em>Strategy</em> pattern pulls each variation into its own object with a consistent interface — a calculate method, say. The context — your order service — just calls calculate without knowing which strategy it has. You pass in the right strategy from the outside. In tests you pass a fixed one. In production you look it up by type. Add a new type: write a new strategy class, register it. Never touch the order calculation."`
    },
    {
      type: "code",
      text: `// ✗ Without Strategy — adding a new discount type means editing core logic
const applyDiscount = (order, discount) => {
  if (discount.type === 'percentage') {
    return order.total * (1 - discount.value / 100);
  } else if (discount.type === 'flat') {
    return Math.max(0, order.total - discount.value);
  } else if (discount.type === 'bogo') {
    // complex logic here
  }
  // Black Friday flash sale? Open this function. Again.
};

// ✓ With Strategy — each variation is isolated
class PercentageDiscountStrategy {
  calculate(total, { value }) {
    return total * (1 - value / 100);
  }
}

class FlatDiscountStrategy {
  calculate(total, { value }) {
    return Math.max(0, total - value);
  }
}

class BuyTwoGetOneStrategy {
  calculate(total, { eligibleItems }) {
    const freeItems = Math.floor(eligibleItems.length / 3);
    const saving    = eligibleItems
      .sort((a, b) => a.price - b.price)           // cheapest items are free
      .slice(0, freeItems)
      .reduce((sum, i) => sum + i.price, 0);
    return total - saving;
  }
}

// Registry — add a new type here, nowhere else
const discountStrategies = {
  percentage: new PercentageDiscountStrategy(),
  flat:       new FlatDiscountStrategy(),
  bogo:       new BuyTwoGetOneStrategy(),
};

// Context — never changes when new strategies are added
class OrderService {
  applyDiscount(order, discount) {
    const strategy = discountStrategies[discount.type];
    if (!strategy) throw AppError.badRequest(\`Unknown discount type: \${discount.type}\`);
    return strategy.calculate(order.total, discount);
  }
}

// ── Strategy in authentication ──
// Same pattern: each auth method is a strategy
class JWTAuthStrategy {
  async authenticate(req) {
    const token = req.headers.authorization?.split(' ')[1];
    return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
  }
}

class APIKeyAuthStrategy {
  async authenticate(req) {
    const key = req.headers['x-api-key'];
    return await APIKey.findOne({ key, isActive: true });
  }
}

const authStrategies = {
  jwt:    new JWTAuthStrategy(),
  apiKey: new APIKeyAuthStrategy(),
};

const authenticate = (strategy = 'jwt') => async (req, res, next) => {
  try {
    req.user = await authStrategies[strategy].authenticate(req);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Route chooses the strategy
router.get('/api/orders',  authenticate('jwt'),    handler);
router.get('/api/webhook', authenticate('apiKey'), handler);`
    },

    // ── Middleware chain / Chain of Responsibility ──
    {
      speaker: "you",
      text: `"You mentioned Express middleware is a Chain of Responsibility. I've been writing middleware for years — I don't think of it as a pattern."`
    },
    {
      speaker: "raj",
      text: `"That's the point of learning the pattern names — you start recognising the same structure in different contexts. What does Express middleware actually do?"`
    },
    {
      speaker: "you",
      text: `"It gets the request, does something, then either calls next() to pass it on or sends a response to stop the chain."`
    },
    {
      speaker: "raj",
      text: `"That's <em>Chain of Responsibility</em> exactly. A request passes through a chain of handlers. Each handler decides: handle it and stop, or pass it on. None of the handlers know what's before or after them in the chain. The pattern shows up outside Express too — validation pipelines, event processing, permission checking. Whenever you have a sequence of steps where each step can short-circuit, you're looking at this pattern. The key property: the chain is assembled by the caller, not the handlers. A handler doesn't call the next one directly — it says 'I'm done, whoever's next can go.' In Express that's next(). In a custom pipeline it's the return value."`
    },
    {
      type: "code",
      text: `// ── Express middleware — Chain of Responsibility ──
// Each handler either continues the chain or terminates it

// Handler 1: rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
// Too many requests → sends 429, chain stops. Otherwise → next()

// Handler 2: parse body
app.use(express.json({ limit: '10kb' }));
// Body too large → sends 413, chain stops. Otherwise → next()

// Handler 3: authenticate
app.use('/api', authenticate);
// No token → sends 401, chain stops. Otherwise → attaches req.user, next()

// Handler 4: route handler
router.post('/orders', asyncHandler(async (req, res) => {
  // only reaches here if all three previous handlers called next()
  const order = await orderService.placeOrder(req.userId, req.body);
  res.status(201).json(order);
}));

// ── Custom validation pipeline — same pattern, different context ──
// Each validator is a handler: return an error to stop, return null to continue
const validators = [
  (data) => !data.email          ? 'Email is required'          : null,
  (data) => !isEmail(data.email) ? 'Email format is invalid'    : null,
  (data) => !data.password       ? 'Password is required'       : null,
  (data) => data.password.length < 8 ? 'Password too short'     : null,
];

const validate = (data, chain) => {
  for (const handler of chain) {
    const error = handler(data);
    if (error) return { valid: false, error };  // stop chain, return error
  }
  return { valid: true };
};

const result = validate(req.body, validators);
if (!result.valid) return res.status(400).json({ error: result.error });

// ── Async middleware chain with error propagation ──
const pipeline = (...middlewares) => async (req, res) => {
  const run = async (index) => {
    if (index >= middlewares.length) return;
    await middlewares[index](req, res, () => run(index + 1));
  };
  await run(0);
};

// Compose specific middleware chains per route
const protectedRoute   = pipeline(authenticate, requireRole('admin'), handler);
const publicRoute      = pipeline(rateLimiter, handler);
const webhookRoute     = pipeline(verifyWebhookSignature, handler);`
    },

    // ── Decorator pattern ──
    {
      speaker: "you",
      text: `"Decorator — I've heard of this. Isn't it just wrapping something?"`
    },
    {
      speaker: "raj",
      text: `"It's wrapping something to add behaviour without changing the original. What's the difference between that and just editing the original?"`
    },
    {
      speaker: "you",
      text: `"You don't have to touch the original code. And you can add or remove the wrapper independently."`
    },
    {
      speaker: "raj",
      text: `"Exactly. In a MERN codebase you'll see it most in two places. One: adding cross-cutting concerns to repository methods — caching, logging, retry logic — without polluting the repository itself. Two: your asyncHandler wrapper in Express. You've probably written that a hundred times without calling it a Decorator. The handler function has no error handling — the decorator adds it. The handler is unchanged. You want to also add request timing? Wrap it with another decorator. Stack them. Each one does one thing."`
    },
    {
      type: "code",
      text: `// ── asyncHandler — the Decorator you've always written ──
// The original handler: just business logic, no try/catch
const getOrder = async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  res.json(order);
};

// The Decorator: adds error handling around it
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/orders/:id', asyncHandler(getOrder));
// getOrder is unchanged. Decorator adds the try/catch.

// ── Caching Decorator for a Repository ──
// Add a cache layer without touching the real repository
class CachedOrderRepository {
  constructor(realRepo, redis) {
    this.realRepo = realRepo;
    this.redis    = redis;
    this.ttl      = 300; // 5 minutes
  }

  async findById(orderId) {
    const cacheKey = \`order:\${orderId}\`;
    const cached   = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);            // cache hit

    const order = await this.realRepo.findById(orderId);  // delegate
    if (order) await this.redis.setex(cacheKey, this.ttl, JSON.stringify(order));
    return order;
  }

  async create(data) {
    const order = await this.realRepo.create(data);   // delegate
    await this.redis.del(\`orders:user:\${order.userId}\`); // invalidate list cache
    return order;
  }

  // All other methods delegate straight through — no caching needed
  async updateStatus(orderId, status) {
    const order = await this.realRepo.updateStatus(orderId, status);
    await this.redis.del(\`order:\${orderId}\`);           // invalidate on write
    return order;
  }
}

// Wire it up — service doesn't change, gets caching for free
const realRepo   = new MongoOrderRepository();
const cachedRepo = new CachedOrderRepository(realRepo, redis);
const service    = new OrderService({ orderRepo: cachedRepo, ... });

// ── Logging Decorator — timing every repository call ──
const withLogging = (repo, label) => new Proxy(repo, {
  get(target, method) {
    if (typeof target[method] !== 'function') return target[method];
    return async (...args) => {
      const start = Date.now();
      try {
        const result = await target[method](...args);
        logger.debug({ repo: label, method, ms: Date.now() - start });
        return result;
      } catch (err) {
        logger.error({ repo: label, method, ms: Date.now() - start, err: err.message });
        throw err;
      }
    };
  }
});

const loggedRepo = withLogging(cachedRepo, 'OrderRepository');`
    },

    // ── Dependency Injection ──
    {
      speaker: "you",
      text: `"All of these patterns seem to rely on passing things in as constructor arguments rather than importing them directly. Is that itself a pattern?"`
    },
    {
      speaker: "raj",
      text: `"<em>Dependency Injection</em>. And you're right — it's the thread running through all of them. When a class imports its own dependencies directly, it controls its own wiring. You can't test it without the real thing. You can't swap it without editing the class. When you inject dependencies through the constructor, the class declares what it needs but doesn't decide where it comes from. The caller decides. In tests the caller is your test file — inject mocks. In production the caller is your app startup — inject real implementations."`
    },
    {
      speaker: "you",
      text: `"That seems like a lot of boilerplate to wire everything up at startup though."`
    },
    {
      speaker: "raj",
      text: `"It is more code than just importing. The trade-off is testability and flexibility. In a small app you wire it manually in one place — a composition root in index.js or a container file. In larger apps you might use a lightweight DI library like awilix or tsyringe to automate the wiring. But the pattern is the same either way: classes declare what they need, something else provides it, and the class doesn't care what that something else decided to provide."`
    },
    {
      type: "code",
      text: `// ✗ Without Dependency Injection — hard wired, untestable
import mongoose from 'mongoose';
import sgMail   from '@sendgrid/mail';
import stripe   from 'stripe';

class OrderService {
  async placeOrder(userId, items) {
    // Mongoose, Stripe, and SendGrid are baked in
    // To test: need real credentials, real network, real DB
    const charge = await stripe.paymentIntents.create({ ... });
    const order  = await Order.create({ ... });
    await sgMail.send({ ... });
  }
}

// ✓ With Dependency Injection — class declares needs, caller provides them
class OrderService {
  constructor({ orderRepo, paymentAdapter, emailAdapter, logger }) {
    this.orderRepo      = orderRepo;
    this.paymentAdapter = paymentAdapter;
    this.emailAdapter   = emailAdapter;
    this.logger         = logger;
  }
  // No imports of Stripe, Mongoose, or SendGrid inside this class
  // test → inject fakes. production → inject real implementations.
}

// ── Manual wiring: composition root (src/container.js) ──
// One place where the whole app is assembled. Everything else is just classes.
import mongoose         from 'mongoose';
import { redis }        from './db/redis.js';
import { MongoOrderRepository }    from './repositories/OrderRepository.js';
import { CachedOrderRepository }   from './repositories/CachedOrderRepository.js';
import { StripePaymentAdapter }    from './adapters/StripePaymentAdapter.js';
import { SendGridEmailAdapter }    from './adapters/SendGridEmailAdapter.js';
import { OrderService }            from './services/OrderService.js';
import { UserService }             from './services/UserService.js';
import logger                      from './logger.js';

const orderRepo      = new CachedOrderRepository(new MongoOrderRepository(), redis);
const paymentAdapter = new StripePaymentAdapter(process.env.STRIPE_SECRET);
const emailAdapter   = new SendGridEmailAdapter(process.env.SENDGRID_KEY);

export const orderService = new OrderService({ orderRepo, paymentAdapter, emailAdapter, logger });
export const userService  = new UserService({ userRepo: new MongoUserRepository(), logger });

// Routes import from the container — not from individual classes
// src/routes/orders.js
import { orderService } from '../container.js';

router.post('/', asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder(req.userId, req.body);
  res.status(201).json(order);
}));

// ── In tests: swap individual pieces ──
const fakePayment = { charge: async () => ({ id: 'ch_test', status: 'succeeded' }) };
const fakeEmail   = { sendOrderConfirmation: async () => {} };
const fakeRepo    = new InMemoryOrderRepository();

const service = new OrderService({
  orderRepo:      fakeRepo,
  paymentAdapter: fakePayment,
  emailAdapter:   fakeEmail,
  logger:         { info: () => {}, error: () => {} },
});
// Full business logic tested with zero network calls, zero DB connections`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Go back to the start. Someone leaves a review comment: 'this should use a Repository pattern.' What do they mean now?"`
    },
    {
      speaker: "you",
      text: `"The service is calling Mongoose directly. They want a class that wraps the DB calls so the service only talks to an interface — so you can test it without a database and swap the DB later without touching business logic."`
    },
    {
      speaker: "raj",
      text: `"And if the comment says 'extract this into a Strategy'?"`
    },
    {
      speaker: "you",
      text: `"There's an if-else inside the service deciding which behaviour to use. Each branch should be its own class. The service picks the right one and calls a consistent method — it doesn't know which branch it's running."`
    },
    {
      speaker: "raj",
      text: `"These patterns aren't rules. They're names for solutions that work. You'll know you need one when the same pain keeps coming back — logic scattered in the wrong place, tests that need a real database, a function that grows a new branch every sprint. The pattern is just the shape of the solution someone already named."`
    },

    {
      type: "summary",
      points: [
        "Design patterns are named solutions to recurring problems — not abstract theory. You're already using most of them. Learning the names lets you communicate precisely in reviews and interviews.",
        "Repository pattern: a class that wraps all database calls behind a plain interface. Services call the repository, never Mongoose or the DB driver directly. Benefits: tests use an in-memory fake, swapping databases doesn't touch business logic, DB queries are isolated and testable on their own.",
        "Service Layer (Facade): the business logic boundary. Routes handle HTTP only — parse, call service, respond. Services orchestrate — apply rules, call repositories, call adapters. External dependencies (Stripe, SendGrid) live behind Adapter classes. Each layer has one job.",
        "Singleton: one instance shared across the app. Node's module cache does this automatically — a db.js that exports mongoose.connection is a Singleton. Use it for infrastructure shared across the whole app (logger, config, DB connection). Don't use it for things tests need to control — inject those instead.",
        "Factory pattern: moves object construction logic out of the caller. When you have a family of implementations (email / SMS / push notifier, Stripe / Braintree payment) the factory decides which to create based on input. Adding a new type means updating the factory, not every caller.",
        "Observer pattern (EventEmitter): the emitter publishes an event and doesn't know who's listening. Listeners subscribe independently. Decouples side effects — order placed, email sent, stock decremented, analytics recorded — without the order service knowing any of them exist. Use EventEmitter for in-process events, a message queue for cross-service.",
        "Strategy pattern: each variation of an algorithm is its own class with a consistent interface. Context calls strategy.execute() — doesn't know which implementation it has. The right strategy is injected from outside. Eliminates the if-else that grows a new branch every sprint. Common in discount systems, auth methods, sorting and filtering.",
        "Chain of Responsibility (Express middleware): a request passes through a chain of handlers. Each decides: handle and stop, or pass forward with next(). Handlers don't know what's before or after them. The chain is assembled by the caller. Use it for validation pipelines, permission checks, request processing steps.",
        "Decorator pattern: wrap something to add behaviour without changing the original. asyncHandler is a decorator — adds error handling around the handler. CachedRepository is a decorator — adds caching around the real repository. Stack decorators to compose behaviours. Each decorator does one thing.",
        "Dependency Injection: classes declare what they need in the constructor rather than importing dependencies directly. The caller provides the implementations. In tests inject fakes. In production inject real ones. Wire the whole app in one composition root — a container.js or equivalent. This is what makes all the other patterns testable."
      ]
    }
  ]
};

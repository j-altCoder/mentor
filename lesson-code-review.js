// ─────────────────────────────────────────────────────────────────
//  LESSON: Code Review & Refactoring
//  Category: Code Quality & Debugging
// ─────────────────────────────────────────────────────────────────

const LESSON_CODE_REVIEW = {
  category: "Code Quality & Debugging",
  tag: "Code Review & Refactoring",
  title: "Reading Code You Didn't Write",
  intro: "The interviewer shares their screen. 'Here's a real handler from our codebase. Tell me everything that's wrong with it, then show me how you'd rewrite it.' The code appears. You have 60 seconds before they expect you to start talking.",
  scenes: [

    // ── How to approach code review in an interview ──
    {
      speaker: "raj",
      text: `"Before we look at any code — how do you approach a code review question in an interview? What's your framework?"`
    },
    {
      speaker: "you",
      text: `"Read it, find the bugs?"`
    },
    {
      speaker: "raj",
      text: `"Too reactive. The interviewer wants to hear you think in categories, not just react to whatever jumps out first. Train yourself to scan in order: <em>correctness</em> first — does this code actually do what it claims? Are there logic errors, off-by-ones, race conditions? Then <em>error handling</em> — what happens when something fails? Then <em>security</em> — is user input trusted without validation? Is sensitive data exposed? Then <em>performance</em> — N+1 queries, unbounded data loads, missing indexes. Then <em>maintainability</em> — naming, single responsibility, magic numbers. Saying 'I see five issues across correctness, security, and performance' sounds far more senior than pointing at the first thing that looks wrong."`
    },

    // ── Exercise 1: The Kitchen Sink Handler ──
    {
      speaker: "raj",
      text: `"First exercise. Here's a real Express handler. Tell me everything wrong with it."`
    },
    {
      type: "code",
      text: `// ⚠️  REVIEW THIS CODE — what's wrong?
app.post('/api/users/login', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ email: req.body.email });

    if (user.password === req.body.password) {
      const token = jwt.sign({ userId: user._id }, 'secret123');
      res.json({ token: token, user: user });
    } else {
      res.status(401).json({ error: 'Wrong password' });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});`
    },
    {
      speaker: "you",
      text: `"The password is being compared in plaintext — it should be hashed. And 'secret123' is a hardcoded JWT secret."`
    },
    {
      speaker: "raj",
      text: `"Good — those are the most dangerous. Keep going. What else?"`
    },
    {
      speaker: "you",
      text: `"The error leaks the exception message to the client? And... the user object is being returned directly, which probably includes the password field."`
    },
    {
      speaker: "raj",
      text: `"Yes — four security issues in eight lines. But there's more. What happens if <em>user</em> is null — if the email doesn't exist in the database?"`
    },
    {
      speaker: "you",
      text: `"Oh — user.password throws a TypeError because you're accessing a property on null. That crashes the handler."`
    },
    {
      speaker: "raj",
      text: `"Right. And the error message from that crash — 'Cannot read properties of null' — goes straight to the client in the catch block. The error handling is actively making security worse. One more: what does the error message 'Wrong password' tell an attacker about a valid email address?"`
    },
    {
      speaker: "you",
      text: `"If the email doesn't exist you'd crash, but if it exists and the password is wrong you return 'Wrong password'. So different behaviour for existing vs non-existing accounts — an attacker can enumerate valid emails."`
    },
    {
      speaker: "raj",
      text: `"Exactly. User enumeration. You've found: null dereference crash, plaintext password comparison, hardcoded JWT secret, password included in response, internal error message exposed, and user enumeration. Now rewrite it."`
    },
    {
      type: "code",
      text: `// ✅ REFACTORED
app.post('/api/users/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Generic message for both "no account" and "wrong password"
  // Prevents user enumeration — attacker learns nothing from the response
  const GENERIC_ERROR = 'Invalid email or password';

  const user = await User.findOne({ email }).select('+password'); // password excluded by default in schema

  // Use constant-time comparison even for the "user not found" case
  // bcrypt.compare on a dummy hash prevents timing attacks that reveal account existence
  const passwordValid = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, '$2b$10$dummyhashtopreventtimingattack.');

  if (!user || !passwordValid) {
    return res.status(401).json({ error: GENERIC_ERROR });
  }

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,           // from environment, never hardcoded
    { expiresIn: '7d' }               // always set an expiry
  );

  // Explicitly shape the response — never return the raw DB document
  res.json({
    token,
    user: {
      id:    user._id,
      email: user.email,
      name:  user.name
      // password, __v, internal fields — explicitly excluded
    }
  });
  // asyncHandler catches any unhandled errors and passes to centralised error handler
  // which returns a generic 500 message without exposing internal details
}));`
    },

    // ── Exercise 2: The Performance Trap ──
    {
      speaker: "raj",
      text: `"Second exercise. Different kind of problem — this one looks clean. What's wrong with it?"`
    },
    {
      type: "code",
      text: `// ⚠️  REVIEW THIS CODE — what's wrong?
app.get('/api/dashboard', async (req, res) => {
  try {
    const user     = await User.findById(req.user.userId);
    const orders   = await Order.find({ userId: req.user.userId });
    const products = await Product.find({ _id: { $in: orders.map(o => o.productId) } });
    const reviews  = await Review.find({ userId: req.user.userId });

    const enrichedOrders = orders.map(order => ({
      ...order.toObject(),
      product: products.find(p => p._id.equals(order.productId))
    }));

    res.json({ user, orders: enrichedOrders, reviews });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});`
    },
    {
      speaker: "you",
      text: `"The four database queries are sequential — each one waits for the previous to finish. They could run in parallel."`
    },
    {
      speaker: "raj",
      text: `"Good. What else? Look at what's returned."`
    },
    {
      speaker: "you",
      text: `"The full user and review objects are returned. Depending on what's in those documents, that could include fields the client doesn't need and fields that shouldn't be exposed."`
    },
    {
      speaker: "raj",
      text: `"Right. Over-fetching — slow network, large payloads, potential data exposure. And the products query — is there a performance issue with it at scale?"`
    },
    {
      speaker: "you",
      text: `"If a user has hundreds of orders... the $in query could have hundreds of IDs. That's a lot of IDs in one query."`
    },
    {
      speaker: "raj",
      text: `"Yes — and each order.map call inside enrichedOrders does a linear scan through the products array. If there are 100 orders and 80 unique products, that's 8,000 comparisons. Quadratic. Plus the same error message exposure we saw before. Rewrite it."`
    },
    {
      type: "code",
      text: `// ✅ REFACTORED
app.get('/api/dashboard', asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // Run independent queries in parallel — not sequentially
  const [user, orders, reviews] = await Promise.all([
    User.findById(userId).select('name email avatarUrl').lean(),
    Order.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(), // paginate — don't load all
    Review.find({ userId }).select('rating productId createdAt').lean()
  ]);

  // Fetch only the products we actually need
  const productIds = [...new Set(orders.map(o => o.productId))]; // deduplicate
  const products   = await Product.find({ _id: { $in: productIds } })
    .select('name price imageUrl')
    .lean();

  // O(1) lookup map — not O(n) linear scan per order
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  const enrichedOrders = orders.map(order => ({
    id:        order._id,
    status:    order.status,
    total:     order.total,
    createdAt: order.createdAt,
    product:   productMap.get(order.productId.toString()) ?? null
  }));

  // Explicitly shaped response — only what the client needs
  res.json({
    user,
    orders:  enrichedOrders,
    reviews: reviews.map(r => ({ id: r._id, rating: r.rating, createdAt: r.createdAt }))
  });
}));

// What changed:
// Sequential → parallel queries with Promise.all (4x faster if queries take equal time)
// Loaded all orders → paginated to 20
// O(n²) find inside map → O(1) Map lookup
// Full documents → .select() only needed fields + .lean() for 30-40% less memory
// Raw DB documents in response → explicitly shaped objects`
    },

    // ── Exercise 3: The Hidden Time Bomb ──
    {
      speaker: "raj",
      text: `"Third exercise. This one is subtle — it works fine in testing. What's the problem?"`
    },
    {
      type: "code",
      text: `// ⚠️  REVIEW THIS CODE — what's wrong?
app.post('/api/orders/:orderId/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (order.status === 'shipped') {
      return res.status(400).json({ error: 'Cannot cancel shipped order' });
    }

    order.status = 'cancelled';
    await order.save();

    await refundPayment(order.paymentId);
    await sendCancellationEmail(order.userId);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});`
    },
    {
      speaker: "you",
      text: `"The error message exposure again. And... is there an authorisation check? Anyone who knows an order ID can cancel any order."`
    },
    {
      speaker: "raj",
      text: `"Good. What about the sequence of operations? What happens if refundPayment succeeds but sendCancellationEmail throws?"`
    },
    {
      speaker: "you",
      text: `"The order is saved as cancelled and the payment is refunded but the customer never gets the email. And the caller gets a 500, so they might retry..."`
    },
    {
      speaker: "raj",
      text: `"Right. Partial completion. And if the caller retries, the order is already cancelled. Does the refund happen again? What about that null check — if someone passes a fake order ID?"`
    },
    {
      speaker: "you",
      text: `"order is null and order.status throws a TypeError. Same crash pattern as before."`
    },
    {
      speaker: "raj",
      text: `"And the check-then-act pattern — what if two cancellation requests arrive at the same moment?"`
    },
    {
      speaker: "you",
      text: `"Both read the order as 'pending', both pass the shipped check, both try to cancel... race condition."`
    },
    {
      speaker: "raj",
      text: `"Five issues: missing auth, null dereference, race condition, partial failure on email error, error exposure. Rewrite it."`
    },
    {
      type: "code",
      text: `// ✅ REFACTORED
app.post('/api/orders/:orderId/cancel', asyncHandler(async (req, res) => {
  // Atomic find-and-update: only matches if this user owns it AND it's cancellable
  // Eliminates: null check, ownership check, AND race condition in one operation
  const order = await Order.findOneAndUpdate(
    {
      _id:    req.params.orderId,
      userId: req.user.userId,           // authorisation: only owner can cancel
      status: { $in: ['pending', 'processing'] }  // only cancellable statuses
    },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { new: true }
  );

  if (!order) {
    // Could be: not found, not owned by this user, or already shipped/cancelled
    // Generic message — don't reveal which one (prevents probing)
    return res.status(400).json({ error: 'Order cannot be cancelled' });
  }

  // Side effects after the state change — failures here don't re-cancel
  // These are idempotent operations or handled separately
  try {
    await refundPayment(order.paymentId);
  } catch (refundErr) {
    // Refund failure is serious — alert on-call, do NOT swallow silently
    logger.error({ event: 'refund_failed', orderId: order._id, err: refundErr.message });
    // Consider: mark order as 'cancellation_pending_refund' for manual review
    // Don't fail the whole request — the cancellation itself succeeded
  }

  // Email failure is non-critical — log it, don't crash the response
  emailService.send({ template: 'order-cancelled', userId: order.userId })
    .catch(err => logger.error({ event: 'email_failed', orderId: order._id, err: err.message }));
    // fire-and-forget — intentional: email failure shouldn't affect cancellation response

  res.json({ success: true, orderId: order._id });
}));

// What changed:
// Separate read + check + write → atomic findOneAndUpdate (no race condition)
// No auth check → ownership baked into the query condition
// Crash on null → handled by "order not found" branch
// All-or-nothing error → refund errors logged separately, email is fire-and-forget
// Error message exposure → generic "cannot be cancelled" response`
    },

    // ── Exercise 4: The Async Antipattern ──
    {
      speaker: "raj",
      text: `"Fourth exercise. This one is purely a JavaScript problem — no security, no database. What's wrong?"`
    },
    {
      type: "code",
      text: `// ⚠️  REVIEW THIS CODE — what's wrong?
const getOrderSummaries = async (orderIds) => {
  const summaries = [];

  for (const id of orderIds) {
    const order    = await Order.findById(id);
    const product  = await Product.findById(order.productId);
    const shipping = await ShippingService.getStatus(order.shipmentId);

    summaries.push({
      id:       order._id,
      product:  product.name,
      status:   shipping.status,
      total:    order.total
    });
  }

  return summaries;
};`
    },
    {
      speaker: "you",
      text: `"The await inside the for loop makes each order fully sequential. 10 orders × 3 async calls each = 30 sequential operations."`
    },
    {
      speaker: "raj",
      text: `"Right — worst case: 30 network round trips one after another. What else?"`
    },
    {
      speaker: "you",
      text: `"The three calls per order are also sequential but they're independent — they could be parallelised too."`
    },
    {
      speaker: "raj",
      text: `"Good. And is there a hidden N+1 problem here? If you parallelise across orders, what happens at 1,000 orders?"`
    },
    {
      speaker: "you",
      text: `"1,000 parallel DB queries... that could overwhelm the database connection pool."`
    },
    {
      speaker: "raj",
      text: `"Exactly — unbounded concurrency. Rewrite it to be parallel but controlled."`
    },
    {
      type: "code",
      text: `// ✅ REFACTORED
const getOrderSummaries = async (orderIds) => {
  // Batch fetch orders — one query instead of N
  const orders = await Order.find({ _id: { $in: orderIds } }).lean();

  // Batch fetch products — one query instead of N
  const productIds = [...new Set(orders.map(o => o.productId))];
  const products   = await Product.find({ _id: { $in: productIds } })
    .select('name price')
    .lean();
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  // Shipping status must be fetched per-order (external service, no batch API)
  // Process in controlled batches to avoid overwhelming connection pool
  const BATCH_SIZE = 10;
  const summaries  = [];

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch   = orders.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (order) => {
        const shipping = await ShippingService.getStatus(order.shipmentId);
        return {
          id:      order._id,
          product: productMap.get(order.productId.toString())?.name ?? 'Unknown',
          status:  shipping.status,
          total:   order.total
        };
      })
    );
    summaries.push(...results);
  }

  return summaries;
};

// What changed:
// N order queries → 1 batch $in query
// N product queries → 1 batch $in query + O(1) Map lookup
// Fully sequential → parallel within batches of 10
// Unbounded Promise.all(1000) → controlled BATCH_SIZE chunks

// If the interviewer asks: "what if ShippingService has no batch endpoint?"
// This is the right answer: batch the DB calls to reduce round trips,
// then process external calls in controlled concurrent batches, not one-by-one.`
    },

    // ── Exercise 5: The Maintainability Problem ──
    {
      speaker: "raj",
      text: `"Last exercise. This one has no bugs. It works correctly. What's wrong with it?"`
    },
    {
      type: "code",
      text: `// ⚠️  REVIEW THIS CODE — what's wrong?
app.post('/api/checkout', async (req, res) => {
  try {
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let total = 0;
    const itemDetails = [];
    for (const item of req.body.items) {
      const p = await Product.findById(item.id);
      if (!p) return res.status(404).json({ error: 'Product not found: ' + item.id });
      if (p.stock < item.qty) return res.status(400).json({ error: 'Not enough stock for ' + p.name });
      total += p.price * item.qty;
      itemDetails.push({ product: p, qty: item.qty });
    }

    if (total > 10000) {
      total = total * 0.9;
    }

    const o = await Order.create({ userId: req.user.userId, items: itemDetails, total, status: 'pending' });
    for (const item of itemDetails) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.qty } });
    }

    const t = jwt.sign({ orderId: o._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await transporter.sendMail({
      to:      req.user.email,
      subject: 'Order Confirmed',
      html:    '<h1>Order #' + o._id + '</h1><p>Total: $' + total + '</p>'
    });

    res.status(201).json({ orderId: o._id, total, confirmationToken: t });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
});`
    },
    {
      speaker: "you",
      text: `"It's doing everything in one function — validation, pricing, stock check, order creation, stock update, email... that's at least five separate responsibilities."`
    },
    {
      speaker: "raj",
      text: `"Right. What's the practical consequence of that?"`
    },
    {
      speaker: "you",
      text: `"Can't test individual pieces. To test the discount logic I have to mock the database, the email service, JWT... or I just don't test it at all."`
    },
    {
      speaker: "raj",
      text: `"And you don't. What else do you see?"`
    },
    {
      speaker: "you",
      text: `"Magic numbers — 10000 and 0.9. Single-letter variables p, o, t. Nodemailer called directly in the route — tight coupling. Sequential queries in the loop again. console.log instead of a real logger. Error message still exposed. And the stock update could race if two requests arrive simultaneously."`
    },
    {
      speaker: "raj",
      text: `"Good list. In a real interview, you don't have to rewrite everything from scratch — you explain the structure you'd move it to and rewrite the most important parts. Show me."`
    },
    {
      type: "code",
      text: `// ✅ REFACTORED — structure explained, critical parts shown

// services/checkoutService.js — business logic extracted, testable in isolation
class CheckoutService {
  constructor(orderRepository, productRepository, emailService) {
    this.orders   = orderRepository;
    this.products = productRepository;
    this.email    = emailService;
  }

  // Business rule as a named, testable constant — not a magic number
  static BULK_DISCOUNT_THRESHOLD = 10_000;
  static BULK_DISCOUNT_RATE      = 0.10;

  async checkout(userId, userEmail, cartItems) {
    if (!cartItems?.length) throw new ValidationError('Cart is empty');

    // Batch fetch — not sequential N+1
    const productIds = cartItems.map(i => i.id);
    const products   = await this.products.findByIds(productIds);
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // Validate and price in one pass
    const lineItems = cartItems.map(item => {
      const product = productMap.get(item.id);
      if (!product)              throw new NotFoundError('Product not found: ' + item.id);
      if (product.stock < item.qty) throw new ConflictError('Insufficient stock: ' + product.name);
      return { product, qty: item.qty, lineTotal: product.price * item.qty };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const total    = this.applyDiscount(subtotal);

    // Persist order, decrement stock atomically
    const order = await this.orders.createWithStockDecrement(userId, lineItems, total);

    // Side effect — email failure must not roll back the order
    this.email.send({ template: 'order-confirmation', to: userEmail, data: { order } })
      .catch(err => logger.error({ event: 'checkout_email_failed', orderId: order._id, err: err.message }));

    return order;
  }

  applyDiscount(subtotal) {
    // Named method — can be unit tested without any mocking
    return subtotal > CheckoutService.BULK_DISCOUNT_THRESHOLD
      ? subtotal * (1 - CheckoutService.BULK_DISCOUNT_RATE)
      : subtotal;
  }
}

// routes/checkout.js — thin route, just HTTP glue
app.post('/api/checkout',
  [authMiddleware, validateBody(checkoutSchema)],
  asyncHandler(async (req, res) => {
    const order = await checkoutService.checkout(
      req.user.userId,
      req.user.email,
      req.body.items
    );
    res.status(201).json({ orderId: order._id, total: order.total });
  })
);

// Now individually testable:
// applyDiscount()  — pure function, zero mocks needed
// checkout()       — inject mock repositories and email service
// route handler    — inject mock checkoutService`
    },

    // ── What to say when you're reviewing in an interview ──
    {
      speaker: "raj",
      text: `"One last thing. When you're doing this in an interview, what's the right way to structure what you say?"`
    },
    {
      speaker: "you",
      text: `"List the issues, then refactor?"`
    },
    {
      speaker: "raj",
      text: `"More structured than that. Start with a summary sentence: 'I can see issues in four areas — security, correctness, performance, and maintainability.' That signals you have a framework and not just pattern-matching. Then go through each category. Name each issue precisely — not 'there's a bug' but 'this is a race condition between the read and the write'. Explain the consequence — not just 'this is wrong' but 'an attacker can enumerate valid email addresses using the different error responses'. Then show the fix. The strongest candidates explain why each fix works, not just what the fix is."`
    },

    {
      type: "summary",
      points: [
        "Review in categories, not randomly: correctness → error handling → security → performance → maintainability. Naming your framework upfront sounds senior.",
        "User enumeration: different responses for 'wrong email' vs 'wrong password' let attackers confirm which emails exist. Always return a generic message.",
        "Timing attacks: comparing a fake hash even when the user doesn't exist prevents attackers from inferring account existence via response time.",
        "Never return raw DB documents — explicitly shape every response. Fields like password, __v, and internal IDs have no place in API responses.",
        "Catch blocks that return e.message expose internals to clients. Log the full error, return a generic message to users.",
        "Null dereference is the most common crash pattern: always check the result of a DB lookup before accessing properties on it.",
        "Check-then-act is a race condition. Use atomic DB operations: findOneAndUpdate with conditions handles the check and the write in one step.",
        "Sequential awaits in a loop = N round trips. Batch with $in, use Promise.all for parallel, chunk with a BATCH_SIZE limit for unbounded lists.",
        "O(n²) from .find() inside .map() — replace with a Map keyed by ID for O(1) lookup.",
        "Magic numbers and single-letter variable names are maintainability issues — name constants semantically, name variables for what they hold.",
        "A handler doing validation, pricing, persistence, and email has four reasons to change. Extract to a service layer so each concern can be tested in isolation.",
        "In interviews: name issues precisely, explain the consequence, show the fix, explain why it works. That structure is what separates senior from junior."
      ]
    }
  ]
};

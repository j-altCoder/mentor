const ANSWERS = [
  {
    id: 1,
    explanation: 'A debounced function uses a closure to hold a single timer ID. Every time the returned function is called, it cancels the previous timer and starts a fresh one. Only the call that survives the full delay actually executes fn. The key insight: clearTimeout on a non-existent/already-fired timer is a no-op — safe to call unconditionally.',
    solution: `function debounce(fn, delay) {
  let timerId;                          // captured in closure, persists between calls

  return function (...args) {
    clearTimeout(timerId);              // cancel any pending invocation
    timerId = setTimeout(() => {
      fn.apply(this, args);             // preserve caller's 'this' and all args
    }, delay);
  };
}

// --- Usage ---
const search = debounce((q) => fetch('/api/search?q=' + q), 300);
input.addEventListener('input', (e) => search(e.target.value));`,
    walkthrough: [
      '`let timerId` lives in the closure — it\'s the same variable across all calls to the returned function',
      '`clearTimeout(timerId)` cancels the previously scheduled call (safe even if timerId is undefined)',
      '`setTimeout(() => fn.apply(this, args), delay)` schedules the real call and saves the new timer ID',
      '`fn.apply(this, args)` — `this` is the execution context of the *returned* function (the event listener context), and `args` is the spread rest parameter array',
      'Arrow function inside setTimeout: `() => fn.apply(this, args)` — arrow functions capture `this` lexically from the outer function, so `this` refers to the debounced function\'s caller context correctly',
    ],
    timeComplexity: 'O(1) per call',
    spaceComplexity: 'O(1) — only one timer ID stored',
    commonMistakes: [
      'Using `fn(...args)` instead of `fn.apply(this, args)` — loses the caller\'s `this` context',
      'Using a regular function inside setTimeout: `setTimeout(function() { fn.apply(this, args) }, delay)` — `this` would be `window`/`undefined` inside the setTimeout callback',
      'Not using rest params: `return function(arg)` — only captures first argument, breaks multi-arg functions',
      'Placing clearTimeout after setTimeout — defeats the whole purpose',
    ],
    followUp: {
      question: 'How do you add a `leading: true` option to also fire on the FIRST call immediately?',
      answer: `function debounce(fn, delay, { leading = false } = {}) {
  let timerId;
  return function (...args) {
    const shouldCallNow = leading && !timerId;
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;                   // reset so next call can fire leading again
      if (!leading) fn.apply(this, args);
    }, delay);
    if (shouldCallNow) fn.apply(this, args);
  };
}`
    }
  },
  {
    id: 2,
    explanation: 'Promise.all() runs all promises concurrently and collects results by INDEX (not arrival order). The trick is tracking how many have completed with a counter — when it hits the input length, all are done. Any single rejection immediately rejects the outer Promise via the shared reject reference. Using Promise.resolve(promise) handles both plain values and actual Promises.',
    solution: `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!promises.length) return resolve([]);    // edge case: empty array

    const results = new Array(promises.length);  // pre-sized to preserve order
    let completed = 0;

    promises.forEach((promise, index) => {
      Promise.resolve(promise)                   // handles non-Promise values safely
        .then((value) => {
          results[index] = value;                // store at exact position
          completed++;
          if (completed === promises.length) {
            resolve(results);                    // all done
          }
        })
        .catch(reject);                          // first rejection wins
    });
  });
}

// --- Usage ---
promiseAll([
  fetch('/api/user').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
  42                                             // non-Promise, handled by Promise.resolve()
]).then(([user, posts, num]) => console.log(user, posts, num));`,
    walkthrough: [
      '`new Array(promises.length)` creates a fixed-length array — ensures output order matches input order regardless of which promise resolves first',
      '`Promise.resolve(promise)` — if `promise` is already a Promise, this is a no-op. If it\'s a plain value (like 42), it wraps it in a resolved Promise. Handles mixed arrays safely.',
      '`results[index] = value` — stores at the correct position, not push() which would lose order',
      '`completed++` then check — only calls resolve() when every single input has resolved',
      '`.catch(reject)` — passes the rejection reason directly to the outer Promise\'s reject. Because Promise.resolve(promise) is a new chain, multiple rejections are possible but only the first one runs (a settled Promise ignores further settle calls)',
    ],
    timeComplexity: 'O(n) — processes each promise once',
    spaceComplexity: 'O(n) — results array',
    commonMistakes: [
      'Using results.push(value) instead of results[index] = value — destroys order when fast promises resolve before slow ones',
      'Forgetting the empty array edge case — forEach on empty array never calls resolve()',
      'Not wrapping with Promise.resolve() — calling .then() on a plain number throws a TypeError',
      'Using a simple counter without index storage — then unable to preserve order',
    ],
    followUp: {
      question: 'How does Promise.allSettled() differ, and when would you use it?',
      answer: `// promiseAllSettled — never rejects, always resolves with ALL outcomes:
function promiseAllSettled(promises) {
  return promiseAll(
    promises.map(p =>
      Promise.resolve(p)
        .then(value => ({ status: 'fulfilled', value }))
        .catch(reason => ({ status: 'rejected', reason }))
    )
  );
}
// Use when: you need to know the outcome of ALL promises, not just fail-fast.
// Example: batch API calls where partial failure is acceptable.`
    }
  },
  {
    id: 3,
    explanation: 'useFetch manages a fetch lifecycle with three state variables. The critical part is the race condition fix: when the URL changes, a new effect runs but the old fetch is still in-flight. Without a cancellation mechanism, the old response could overwrite the new one. The fix: a `cancelled` boolean in the closure — set to true by the cleanup function — guards all state setters.',
    solution: `import { useState, useEffect } from 'react';

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;              // stale-response guard

    setLoading(true);
    setError(null);

    async function load() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (!cancelled) {               // only update if still current
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();

    return () => { cancelled = true; }; // cleanup: mark stale on URL change or unmount
  }, [url]);

  return { data, loading, error };
}

// --- Usage ---
function UserCard({ userId }) {
  const { data, loading, error } = useFetch('/api/users/' + userId);
  if (loading) return <p>Loading...</p>;
  if (error)   return <p>Error: {error}</p>;
  return <h2>{data.name}</h2>;
}`,
    walkthrough: [
      '`let cancelled = false` is declared fresh on each effect run — it\'s a separate variable for each fetch lifecycle',
      'The cleanup function `return () => { cancelled = true }` runs when: (a) the URL changes before fetch completes, (b) component unmounts',
      '`if (!cancelled)` before every setState — if cleanup ran, this is false and we silently discard the stale response',
      '`setLoading(true); setError(null)` at the start resets state for the new fetch — prevents showing old error or old data during transition',
      '`if (!res.ok) throw new Error(...)` — fetch only rejects on network failure. A 404 or 500 is a successful response with error status. You must manually check res.ok.',
      'Inner async function `load()` — useEffect callback cannot be async (it must return void or a cleanup function, not a Promise)',
    ],
    timeComplexity: 'N/A — I/O bound',
    spaceComplexity: 'O(n) — stores the response data',
    commonMistakes: [
      'Making the useEffect callback async: `useEffect(async () => {...})` — this makes the callback return a Promise, not a cleanup function. React will warn and ignore the returned Promise.',
      'Not checking res.ok — fetch resolves even for 404/500, only network errors cause rejection',
      'Missing the cancelled guard — causes "Can\'t perform a React state update on an unmounted component" warning and potential bugs',
      'Not resetting loading/error on new fetch — stale state flashes the old error message briefly',
    ],
    followUp: {
      question: 'How would you add a manual refetch capability?',
      answer: `// Expose a refetch function by using a separate trigger state:
function useFetch(url) {
  const [trigger, setTrigger] = useState(0);
  // ...all the same code, but add trigger to dependency array:
  useEffect(() => { /* fetch logic */ }, [url, trigger]);

  const refetch = () => setTrigger(t => t + 1);
  return { data, loading, error, refetch };
}`
    }
  },
  {
    id: 4,
    explanation: 'Three valid approaches. Recursive is the most readable. Iterative with a stack avoids call-stack overflow on deeply nested arrays (thousands of levels deep). Reduce is the most functional/concise. In an interview, showing the recursive approach first then mentioning the stack-based approach for stack-overflow concerns shows real depth.',
    solution: `// Approach 1: Recursive (clearest, most common interview answer)
function flatten(arr) {
  const result = [];
  function helper(input) {
    for (const item of input) {
      if (Array.isArray(item)) {
        helper(item);                   // recurse into nested array
      } else {
        result.push(item);
      }
    }
  }
  helper(arr);
  return result;
}

// Approach 2: Iterative with stack (handles deep nesting, no stack overflow)
function flattenIterative(arr) {
  const stack = [...arr];             // copy to avoid mutating input
  const result = [];
  while (stack.length) {
    const item = stack.pop();         // process from end (LIFO)
    if (Array.isArray(item)) {
      stack.push(...item);            // spread nested array back onto stack
    } else {
      result.unshift(item);           // unshift preserves left-to-right order
    }
  }
  return result;
}

// Approach 3: reduce (one-liner)
const flattenReduce = (arr) =>
  arr.reduce((acc, item) =>
    Array.isArray(item) ? acc.concat(flattenReduce(item)) : [...acc, item]
  , []);

// --- Test all three ---
console.log(flatten([1, [2, [3, [4]], 5], 6]));
// → [1, 2, 3, 4, 5, 6]`,
    walkthrough: [
      'Recursive: `helper` mutates the outer `result` array through closure — avoids creating new arrays on each call, efficient',
      '`Array.isArray(item)` is the correct check — `typeof []` is "object", so typeof would incorrectly match null and plain objects',
      'Iterative: `stack.pop()` processes right-to-left, so `result.unshift(item)` inserts at front to maintain original left-to-right order',
      'Alternative to unshift: process with shift() instead of pop() and use push() — but shift() is O(n), unshift() is also O(n). Better: use pop() + push() then reverse at end for O(n) total',
      'Reduce approach: `acc.concat(flattenReduce(item))` — creates new array on every element, so O(n²) space. Fine for interviews, bad for production with large arrays',
    ],
    timeComplexity: 'O(n) — visits every element exactly once (recursive and iterative)',
    spaceComplexity: 'O(d) — recursive call stack depth = nesting depth d. Iterative: O(n) stack.',
    commonMistakes: [
      'Using `typeof item === "object"` — catches null (typeof null === "object") and plain objects',
      'Mutating the input array (using splice, shift) instead of working on a copy',
      'reduce approach with concat is O(n²) — concat creates a new array every iteration',
      'Forgetting the base case in reduce: missing `, []` initial accumulator causes TypeError',
    ],
    followUp: {
      question: 'How would you implement flatten with a depth limit, like Array.flat(depth)?',
      answer: `function flattenDepth(arr, depth = 1) {
  return depth > 0
    ? arr.reduce((acc, item) =>
        Array.isArray(item)
          ? acc.concat(flattenDepth(item, depth - 1))
          : acc.concat(item)
      , [])
    : arr.slice(); // depth exhausted, return copy
}
// flattenDepth([1,[2,[3]]], 1) → [1, 2, [3]]
// flattenDepth([1,[2,[3]]], 2) → [1, 2, 3]`
    }
  },
  {
    id: 5,
    explanation: 'A complete Express CRUD API uses Router for modularity, Mongoose for MongoDB interaction, and async/await with try/catch + next(err) for consistent error handling. The key conventions: 201 for POST (created), 404 when a document isn\'t found, always return { data } or { error } consistently. Pass all errors to Express error handler with next(err) — never handle them silently.',
    solution: `// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  role:  { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

// -------------------------------------------

// routes/users.js
const express = require('express');
const User    = require('../models/User');
const router  = express.Router();

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};
    const users = await User.find(filter).select('-__v');
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/', async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ data: user });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }  // new: return updated doc
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: { message: 'User deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// -------------------------------------------

// app.js (wiring)
const express = require('express');
const mongoose = require('mongoose');
const userRouter = require('./routes/users');

const app = express();
app.use(express.json());
app.use('/api/users', userRouter);

// Central error handler (must have 4 params):
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(3000, () => console.log('Server on :3000')));`,
    walkthrough: [
      'Router is mounted at /api/users in app.js — routes inside the router use / and /:id (not /api/users/...)',
      '`{ new: true }` in findByIdAndUpdate returns the UPDATED document — without it, you get the old document before changes',
      '`runValidators: true` — by default, Mongoose doesn\'t run schema validators on update operations. This option enables them.',
      '`next(err)` passes the error to the central error handler — never let async errors crash the process silently',
      'ValidationError check on POST: Mongoose throws this when required fields are missing or enum values are wrong. Return 400, not 500.',
      '`select(\'-__v\')` removes the internal Mongoose version key from responses',
    ],
    timeComplexity: 'O(1) for get by ID (indexed), O(n) for list without index',
    spaceComplexity: 'O(n) for list endpoint',
    commonMistakes: [
      'Forgetting { new: true } in findByIdAndUpdate — returns stale data to the client',
      'Not checking if result is null after findById/findByIdAndDelete — sends 200 with null data instead of 404',
      'Using app.get() directly instead of Router — mixes concerns, hard to organize',
      'Not calling next(err) in catch — error is swallowed, request hangs forever with no response',
    ],
    followUp: {
      question: 'What is the difference between PUT and PATCH? How would you implement PATCH?',
      answer: `// PUT = replace entire document (full update)
// PATCH = partial update (only sent fields change)

// PATCH /api/users/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },      // $set ensures only sent fields are updated
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ data: user });
  } catch (err) { next(err); }
});`
    }
  },
  {
    id: 6,
    explanation: 'JWT auth middleware extracts the token from the Authorization header, verifies it with the secret, and attaches the payload to req.user. The two critical error cases are: missing/malformed token (401) and expired token (401 with a specific message so the client can trigger a token refresh). All other JWT errors are "invalid token". Never swallow jwt.verify() errors — always catch and respond.',
    solution: `const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const auth = req.headers.authorization;

  // Check header exists and is in Bearer format:
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = auth.split(' ')[1];   // "Bearer <token>" → "<token>"

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();                           // token valid → continue to route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

// -------------------------------------------

// Login endpoint that ISSUES a token (for context):
const bcrypt = require('bcrypt');

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user._id, role: user.role },   // payload
      process.env.JWT_SECRET,
      { expiresIn: '15m' }                  // short-lived
    );
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------

// Protecting routes — use authenticate as middleware:
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ user: req.user });   // req.user = { sub: userId, role, iat, exp }
});

// Role-based access control built on top of authenticate:
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

app.delete('/api/admin/users/:id', authenticate, requireRole('admin'), deleteUser);`,
    walkthrough: [
      '`auth.startsWith(\'Bearer \')` — note the space after "Bearer". Split on space gives ["Bearer", "token"]; split(" ")[1] gets the token.',
      '`jwt.verify()` is synchronous and throws on failure — wrap in try/catch, not .catch()',
      '`err.name === \'TokenExpiredError\'` — this specific error name is from the jsonwebtoken library. Other errors (bad signature, malformed) have different names like \'JsonWebTokenError\'',
      '`req.user = jwt.verify(...)` — the return value is the decoded payload object. Attaching to req makes it available in all subsequent middleware and route handlers',
      'The `requireRole` function is a middleware factory — it returns a middleware function, so you call it: `requireRole(\'admin\')` not `requireRole`',
      'Never mix up 401 (not authenticated) vs 403 (authenticated but not authorized). Missing/invalid token = 401. Valid token but wrong role = 403.',
    ],
    timeComplexity: 'O(1) — JWT verification is a hash comparison',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Forgetting the space in startsWith(\'Bearer \') — splits to ["Bearer", "token"] only with the space',
      'Using .then()/.catch() with jwt.verify() — it\'s synchronous, not a Promise. It throws, doesn\'t reject.',
      'Hardcoding the JWT secret in code instead of process.env.JWT_SECRET — security vulnerability',
      'Calling next() inside the catch block — execution continues into the route handler even after auth failure',
      'Not differentiating 401 vs 403 — both are auth errors but have different meanings',
    ],
    followUp: {
      question: 'How do you implement refresh token rotation to keep users logged in securely?',
      answer: `// Pattern: short-lived access token (15min) + long-lived refresh token (7 days in HttpOnly cookie)
// On access token expiry:
app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;     // from HttpOnly cookie
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    // Rotate: issue new access token AND new refresh token (invalidates old one):
    const newToken = jwt.sign({ sub: payload.sub, role: payload.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefresh = jwt.sign({ sub: payload.sub }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});`
    }
  },
  {
    id: 7,
    explanation: 'The aggregation pipeline is a sequence of stages, each transforming the documents. For this problem: filter early ($match), group to compute totals ($group), sort and limit the top 5, then join with customers ($lookup) for names/emails. The key: $match first reduces documents before expensive operations. $lookup produces an array, so $unwind flattens it. $project cleans the output.',
    solution: `// Mongoose model version:
const Order = require('./models/Order');

const topCustomers = await Order.aggregate([
  // Stage 1: Filter — only completed orders
  // PUT $match FIRST to minimize documents in subsequent stages
  {
    $match: { status: 'completed' }
  },

  // Stage 2: Group by customer, compute totals
  {
    $group: {
      _id: '$customerId',                         // group key
      totalSpend: { $sum: '$totalAmount' },       // sum all order amounts
      orderCount: { $sum: 1 },                    // count orders per customer
      avgOrderValue: { $avg: '$totalAmount' },    // bonus: average order value
    }
  },

  // Stage 3: Sort by total spend descending
  {
    $sort: { totalSpend: -1 }
  },

  // Stage 4: Keep only top 5
  {
    $limit: 5
  },

  // Stage 5: Join with customers collection
  {
    $lookup: {
      from: 'customers',         // target collection name (NOT the Mongoose model name)
      localField: '_id',         // _id here = customerId from $group
      foreignField: '_id',       // _id in customers collection
      as: 'customer',            // result is stored as an array field named 'customer'
    }
  },

  // Stage 6: Flatten the customer array into a single object
  {
    $unwind: '$customer'         // [{ name:'Alice' }] → { name:'Alice' }
  },

  // Stage 7: Shape the final output
  {
    $project: {
      _id: 0,                                          // exclude the grouped _id
      name: '$customer.name',
      email: '$customer.email',
      totalSpend: 1,
      orderCount: 1,
      avgOrderValue: { $round: ['$avgOrderValue', 2] },
    }
  }
]);

// Result shape:
// [
//   { name: 'Alice', email: 'alice@co.com', totalSpend: 8500, orderCount: 12, avgOrderValue: 708.33 },
//   ...
// ]`,
    walkthrough: [
      '$match first: a $match at the start of the pipeline can use indexes. Moving it later means scanning ALL orders before filtering — much slower.',
      '$group: `_id: "$customerId"` is the grouping expression. The `$` prefix means "field value". Without `$`, MongoDB treats it as a literal string.',
      '$sum: "$totalAmount" sums the field value across all docs in the group. $sum: 1 is a counter — adds 1 for each document.',
      '$lookup result is ALWAYS an array, even for one-to-one joins. $unwind converts `customer: [{ name:... }]` into `customer: { name:... }`.',
      '$project: setting a field to 1 includes it, 0 excludes it. You can rename fields: `name: "$customer.name"` maps the nested field.',
      'The `from` field in $lookup is the MongoDB collection name (lowercase, plural by Mongoose convention) — NOT the Mongoose model name.',
    ],
    timeComplexity: 'O(n) for $match + $group scan; $sort on limited set is O(k log k) where k=5',
    spaceComplexity: 'O(k) — only top-k results kept in memory after $limit',
    commonMistakes: [
      'Putting $sort/$group before $match — processes all documents instead of only completed orders',
      'Forgetting $unwind after $lookup — leaves customer as an array, so customer.name is undefined',
      'Using the Mongoose model name in $lookup\'s `from` — MongoDB uses the actual collection name (e.g., "customers" not "Customer")',
      'Not using $project with _id: 0 — response includes the raw grouped customerId as _id which is confusing',
    ],
    followUp: {
      question: 'How would you add a date range filter (e.g., last 30 days)?',
      answer: `// Update the $match stage:
{
  $match: {
    status: 'completed',
    createdAt: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)  // 30 days ago
    }
  }
}
// Ensure an index on { status: 1, createdAt: -1 } for this query to be efficient.`
    }
  },
  {
    id: 8,
    explanation: 'Rate limiting uses a closure over a Map to track request counts per IP. Each call to rateLimit() creates an independent Map — so different route limiters don\'t share state. The Map holds { count, resetTime } per IP. On each request: if the window has expired, reset the counter; if count >= max, block with 429; otherwise increment and allow.',
    solution: `function rateLimit({ windowMs = 60 * 1000, max = 100 } = {}) {
  // Each rateLimit() call gets its own Map — independent per route
  const store = new Map();    // ip → { count, resetTime }

  return function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress;
    const now = Date.now();
    const entry = store.get(ip);

    // No entry for this IP, or their window has expired → fresh start
    if (!entry || now > entry.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    // Within the window: check if over limit
    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter,
      });
    }

    // Under limit: increment and allow
    entry.count++;
    next();
  };
}

// --- Usage in Express app ---
const express = require('express');
const app = express();

// Strict limit for auth routes (5 attempts per 15 minutes):
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));

// General API limit (100 per minute):
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 100 }));

// These two limiters are completely independent — each has its own Map.`,
    walkthrough: [
      'The outer function creates the Map in a closure — `const store = new Map()`. This is created ONCE per rateLimit() call, then shared across all requests to that middleware.',
      '`req.ip` is set by Express when `app.set(\'trust proxy\', 1)` is configured (needed behind load balancers). Fall back to `req.socket.remoteAddress`.',
      '`now > entry.resetTime` — the window has expired for this IP, so we reset. This is a "sliding window" reset approach.',
      '`Math.ceil((entry.resetTime - now) / 1000)` converts ms to seconds. Retry-After header value must be in whole seconds per HTTP spec.',
      'We mutate `entry.count++` directly — this works because Map.get() returns a reference to the object, not a copy.',
      'Limitation: in-memory, single-process only. Use Redis with atomic INCR + EXPIRE for multi-instance deployments.',
    ],
    timeComplexity: 'O(1) per request — Map lookup is O(1)',
    spaceComplexity: 'O(n) — n unique IPs in the store',
    commonMistakes: [
      'Putting the Map outside the factory function — all rateLimit() calls share the same store, so different route limits interfere with each other',
      'Not handling the expired window case — count grows unboundedly',
      'Forgetting the Retry-After header — clients can\'t know when to retry without it',
      'Using `req.headers[\'x-forwarded-for\']` directly — it can be spoofed. Use req.ip with trust proxy config.',
    ],
    followUp: {
      question: 'How would you implement this using Redis for multi-server deployments?',
      answer: `// Redis implementation using INCR + EXPIRE:
const redis = require('redis');
const client = redis.createClient();

function rateLimit({ windowMs, max }) {
  return async (req, res, next) => {
    const key = 'rl:' + req.ip;
    const count = await client.incr(key);        // atomic increment
    if (count === 1) {
      await client.expire(key, windowMs / 1000); // set TTL on first request
    }
    if (count > max) {
      const ttl = await client.ttl(key);
      res.set('Retry-After', String(ttl));
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}
// Redis INCR is atomic — safe across multiple Node processes/servers.`
    }
  },
  {
    id: 9,
    explanation: 'useDebounce is a hook that delays updating a value until it stops changing. The pattern: store debouncedValue in state, use useEffect to update it after a timeout, and clean up the timeout when value changes. SearchBar then uses debouncedQuery as the useEffect dependency for fetching — the fetch only runs when the user pauses typing.',
    solution: `import { useState, useEffect } from 'react';

// ---- useDebounce hook ----
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);         // update after silence
    }, delay);

    return () => clearTimeout(timer);   // cancel if value changes before delay
  }, [value, delay]);

  return debouncedValue;
}

// ---- SearchBar component using useDebounce ----
function SearchBar() {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // debouncedQuery only updates 300ms after user stops typing:
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // Don't fetch for empty/whitespace queries:
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch('/api/search?q=' + encodeURIComponent(debouncedQuery))
      .then(res => {
        if (!res.ok) throw new Error('Search failed: ' + res.status);
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setResults(data.results);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);            // ← fetch only when DEBOUNCED value changes

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <p>Searching...</p>}
      {error   && <p className="error">{error}</p>}
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}`,
    walkthrough: [
      'useDebounce effect: every time `value` changes, the old timer is cancelled (cleanup runs) and a new timer starts. Only the timer that survives the full `delay` calls setDebouncedValue.',
      'SearchBar has two separate effects conceptually: (1) user typing updates `query` instantly (no delay — controlled input), (2) the fetch effect depends on `debouncedQuery` (delayed).',
      '`encodeURIComponent(debouncedQuery)` — critical for correct URL encoding. Searching "react hooks" would otherwise produce a space in the URL which breaks the query.',
      'The `cancelled` guard in the fetch effect handles the same race condition as useFetch — if debouncedQuery changes while a fetch is in-flight, discard the stale response.',
      'This is the hook-composition pattern: useDebounce is a general-purpose hook that SearchBar uses. SearchBar doesn\'t need to know about timers at all.',
    ],
    timeComplexity: 'N/A — I/O bound',
    spaceComplexity: 'O(n) for results',
    commonMistakes: [
      'Adding `query` to the fetch effect\'s dependency array instead of `debouncedQuery` — defeats debouncing, fetch runs on every keystroke',
      'Not returning the clearTimeout in useDebounce — debounce doesn\'t work at all, value updates immediately',
      'Forgetting encodeURIComponent — queries with spaces or special characters produce broken URLs',
      'Not guarding against empty debouncedQuery — fetches on empty string, returns all results or errors',
    ],
    followUp: {
      question: 'How is useDebounce different from the debounce function in Q1?',
      answer: `// Q1 debounce: delays CALLING a function
const debouncedFetch = debounce((q) => fetchResults(q), 300);
// Problem: if used directly in useEffect deps, a new function is created each render
//          → effect runs on every render, debounce never fires

// useDebounce: delays UPDATING A VALUE (state)
// Works naturally with React's reactivity — when debouncedValue changes,
// React re-renders and the useEffect sees the new value in its deps.
// This is the idiomatic React way to debounce side effects.`
    }
  },
  {
    id: 10,
    explanation: 'Retry with exponential backoff uses a while loop, a catch block to detect failure, and a manual delay between attempts. The delay doubles on each retry (500ms → 1s → 2s), which is exponential backoff — gives the server progressively more recovery time. The critical pattern: increment attempt BEFORE checking if retries are exhausted, then re-throw if done, or sleep and try again.',
    solution: `// Core implementation:
async function fetchWithRetry(url, options = {}, {
  retries = 3,
  delay = 1000,
  backoff = 2,
} = {}) {
  let attempt = 0;
  let currentDelay = delay;

  while (attempt < retries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error('HTTP ' + res.status);  // treat 4xx/5xx as errors
      return await res.json();                              // success — return data
    } catch (err) {
      attempt++;

      if (attempt >= retries) {
        throw err;                  // all retries exhausted — propagate the error
      }

      console.warn('Attempt ' + attempt + ' failed:', err.message, '— retrying in ' + currentDelay + 'ms');

      // Wait before next attempt:
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoff;    // exponential: 1000 → 2000 → 4000 → ...
    }
  }
}

// --- Usage ---
async function loadDashboard() {
  try {
    const data = await fetchWithRetry(
      '/api/dashboard',
      { headers: { Authorization: 'Bearer ' + token } },
      { retries: 3, delay: 500, backoff: 2 }
    );
    renderDashboard(data);
  } catch (err) {
    showError('Dashboard unavailable: ' + err.message);
  }
}

// Timeline on complete failure:
// t=0ms:    Attempt 1 → HTTP 503
// t=500ms:  Attempt 2 → HTTP 503
// t=1500ms: Attempt 3 → HTTP 503 → throws Error('HTTP 503')

// -------------------------------------------

// Extended version: only retry on specific status codes (e.g., not 401 or 400):
async function fetchWithRetrySelective(url, options = {}, config = {}) {
  const { retries = 3, delay = 1000, backoff = 2, retryOn = [503, 429, 500] } = config;
  let attempt = 0;
  let currentDelay = delay;

  while (attempt < retries) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        if (!retryOn.includes(res.status)) {
          throw new Error('HTTP ' + res.status);    // don't retry 401, 400, etc.
        }
        throw new Error('HTTP ' + res.status);      // retryable error
      }
      return await res.json();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, currentDelay));
      currentDelay *= backoff;
    }
  }
}`,
    walkthrough: [
      '`while (attempt < retries)` — loop runs at most `retries` times. On success, we return inside the try. On final failure, we throw inside the catch.',
      '`if (!res.ok) throw new Error(...)` — fetch resolves even for 5xx responses. You MUST manually check res.ok and throw to trigger retry logic.',
      '`attempt++` before checking `if (attempt >= retries)` — this way, after the 3rd failure, attempt becomes 3, which equals retries (3), so we throw without sleeping again.',
      '`await new Promise(resolve => setTimeout(resolve, currentDelay))` — the only way to sleep in async JS. setTimeout doesn\'t return a Promise natively, so we wrap it.',
      '`currentDelay *= backoff` — doubles after each retry: 1000 → 2000 → 4000. This is exponential backoff. Without it, retries hammer a struggling server at the same rate.',
      'Jitter (production improvement): add `Math.random() * currentDelay` to spread retries across many clients so they don\'t all retry simultaneously.',
    ],
    timeComplexity: 'O(retries) — at most `retries` attempts',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Not checking res.ok — code always returns on first attempt since fetch "succeeded" (HTTP 500 is still a resolved fetch)',
      'Sleeping AFTER the final failed attempt — wastes time sleeping when there\'s nothing left to retry. Increment first, check if done, then sleep.',
      'Using setTimeout without Promise wrapping — setTimeout is not awaitable natively; await setTimeout(...) awaits undefined',
      'Not re-throwing on final failure — the error is silently swallowed and the caller never knows all retries failed',
    ],
    followUp: {
      question: 'What is "jitter" in retry logic and why does it matter?',
      answer: `// Without jitter: all clients retry at the exact same time
// → thundering herd problem — server gets slammed simultaneously

// With jitter: add random delay to spread retries:
currentDelay = delay * Math.pow(backoff, attempt) + Math.random() * 1000;
// "Full jitter" approach: random between 0 and the exponential cap
currentDelay = Math.random() * delay * Math.pow(backoff, attempt);

// AWS, Google, and most distributed systems use jitter in their SDKs.
// At scale, retries without jitter can cascade a partial outage into a full outage.`
    }
  },
  {
    id: 11,
    explanation: 'EventEmitter stores listeners in a Map keyed by event name. on() appends to the array, off() filters it, emit() calls each listener with spread args. once() wraps the real listener in a disposable function that calls off(event, wrapper) after the first fire — the wrapper holds a reference to itself via closure so it can pass itself to off().',
    solution: `class EventEmitter {
  constructor() {
    this.events = new Map(); // event name → [listeners]
  }

  on(event, listener) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(listener);
    return this;                               // chainable
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    this.events.get(event).forEach(fn => fn(...args));
    return true;
  }

  off(event, listener) {
    if (!this.events.has(event)) return this;
    const remaining = this.events.get(event).filter(fn => fn !== listener);
    this.events.set(event, remaining);
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);               // remove after first fire
    };
    return this.on(event, wrapper);
  }
}

// --- Usage ---
const bus = new EventEmitter();
const handler = (data) => console.log('received:', data);

bus.on('message', handler);
bus.emit('message', 'hello');   // → received: hello
bus.off('message', handler);
bus.emit('message', 'world');   // → (nothing)

bus.once('connect', () => console.log('connected'));
bus.emit('connect');             // → connected
bus.emit('connect');             // → (nothing, auto-removed)`,
    walkthrough: [
      'Map is used instead of plain object so event names can be any value (including symbols) and Map has O(1) has/get/set',
      'on() lazily initialises the array with events.set(event, []) only when the first listener registers',
      'emit() calls slice of the array via forEach — if a listener calls off() during emit, it modifies the array but forEach already captured the original iteration, so no listeners are skipped',
      'off() uses filter() which returns a NEW array — never mutates in place, avoiding iteration bugs',
      'once() closure: wrapper captures itself by variable name. The wrapper is what gets pushed by on(), so off(event, wrapper) correctly removes it by reference',
    ],
    timeComplexity: 'O(n) for emit — calls each listener. O(n) for off — filters the array.',
    spaceComplexity: 'O(n) — n total registered listeners across all events',
    commonMistakes: [
      'once() referencing wrapper before it is declared — use a var declaration or define wrapper as a named function expression',
      'Mutating the listeners array during emit() — use filter() (returns new array) not splice() (mutates in place)',
      'Not returning this from on/off/once — breaks method chaining',
      'Using a plain object instead of Map — object keys are coerced to strings, causing collision issues',
    ],
    followUp: {
      question: 'How would you add a removeAllListeners(event) method, and what does Node\'s EventEmitter do to prevent memory leaks?',
      answer: `removeAllListeners(event) {
  if (event) this.events.delete(event);
  else this.events.clear();
  return this;
}

// Node's built-in EventEmitter warns when > 10 listeners
// are registered for the same event (likely a memory leak):
emitter.setMaxListeners(20); // raise the limit
emitter.on('newListener', ...) // hook into registrations`
    }
  },
  {
    id: 12,
    explanation: 'http.createServer() gives you a raw req/res pair. You manually inspect req.method and the parsed pathname to route requests. POST bodies arrive in chunks via the "data" event and must be buffered until "end" fires. Express does exactly this internally — understanding it shows you know what abstractions you\'re using.',
    solution: `const http = require('http');
const url  = require('url');

const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);
  const method = req.method;

  // GET /users
  if (pathname === '/users' && method === 'GET') {
    return sendJSON(res, 200, users);
  }

  // GET /users/:id
  const match = pathname.match(/^\\/users\\/(\\d+)$/);
  if (match && method === 'GET') {
    const user = users.find(u => u.id === parseInt(match[1]));
    if (!user) return sendJSON(res, 404, { error: 'Not found' });
    return sendJSON(res, 200, user);
  }

  // POST /users
  if (pathname === '/users' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data    = JSON.parse(body);
        const newUser = { id: users.length + 1, ...data };
        users.push(newUser);
        sendJSON(res, 201, newUser);
      } catch (e) {
        sendJSON(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  sendJSON(res, 404, { error: 'Route not found' });
});

server.listen(3000, () => console.log('Server on :3000'));`,
    walkthrough: [
      'http.createServer() takes a callback called for every incoming request — this is Express\'s request handler function',
      'url.parse(req.url).pathname extracts just the path (/users/1) without query string (?sort=asc)',
      'regex match on pathname: /^\\/users\\/(\\d+)$/ captures the numeric id segment. match[1] is the captured group.',
      'POST body: req is a Readable stream. Body arrives in chunks — must buffer chunks and parse only in the "end" event',
      'return after sendJSON() is critical — without it, code falls through to the 404 handler and throws "headers already sent"',
    ],
    timeComplexity: 'O(n) for list endpoint (n users), O(1) for routing',
    spaceComplexity: 'O(b) where b is the POST body size',
    commonMistakes: [
      'Not returning after sendJSON() — causes "Cannot set headers after they are sent" error',
      'Parsing JSON before the "end" event — body is incomplete in "data", only full in "end"',
      'Not wrapping JSON.parse in try/catch — invalid request body crashes the server',
      'Using req.url directly without url.parse — breaks when query strings are present (/users?sort=asc would not match /users)',
    ],
    followUp: {
      question: 'What does Express\'s app.use(express.json()) actually do under the hood?',
      answer: `// express.json() is middleware that does exactly what we did manually:
// it buffers the request body, checks Content-Type: application/json,
// parses it, and attaches the result to req.body.

// Simplified version:
function jsonMiddleware(req, res, next) {
  if (req.headers['content-type'] !== 'application/json') return next();
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try { req.body = JSON.parse(body); } catch(e) { req.body = {}; }
    next();
  });
}`
    }
  },
  {
    id: 13,
    explanation: 'Streams process data in chunks (default 64KB per chunk) — a 10GB file uses the same memory as a 1KB file. readline wraps a Readable stream and gives you a clean async iterable of lines. Transform streams sit in the middle of a pipeline: they receive a chunk, modify it, and push the result downstream. pipe() wires streams together and handles backpressure automatically.',
    solution: `const fs       = require('fs');
const readline = require('readline');
const { Transform } = require('stream');

// Approach 1: readline — process a large CSV line by line
async function processCSV(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,         // handle both \\r\\n and \\n
  });

  let lineCount  = 0;
  let totalSales = 0;

  for await (const line of rl) {
    if (lineCount === 0) { lineCount++; continue; } // skip CSV header
    const columns = line.split(',');
    totalSales += parseFloat(columns[2]) || 0;      // column index 2 = amount
    lineCount++;
  }

  return { lines: lineCount - 1, totalSales };
}

// Approach 2: Transform stream + pipe
function upperCaseTransform() {
  return new Transform({
    transform(chunk, encoding, callback) {
      // chunk is a Buffer — convert to string, transform, push result
      callback(null, chunk.toString().toUpperCase());
    }
  });
}

// Pipe: read file → uppercase → write file
fs.createReadStream('input.txt')
  .pipe(upperCaseTransform())
  .pipe(fs.createWriteStream('output.txt'))
  .on('finish', () => console.log('Done — output.txt written'));

// --- Usage ---
processCSV('sales.csv').then(console.log);
// → { lines: 50000, totalSales: 2847293.50 }`,
    walkthrough: [
      'fs.createReadStream() opens the file and reads it in chunks — never the whole file at once',
      'readline.createInterface({ input: stream }) wraps the stream and splits it on newlines',
      'for await (const line of rl) — readline implements the async iterable protocol so you can use for-await-of without callbacks',
      'crlfDelay: Infinity handles Windows line endings (\\r\\n) — without this, \\r appears at the end of each line',
      'Transform._transform(chunk, encoding, callback) — call callback(null, result) to push the transformed chunk downstream. Call callback(err) to abort the pipeline.',
      'pipe() returns the destination stream, enabling chaining: read.pipe(transform).pipe(write)',
    ],
    timeComplexity: 'O(n) — processes each byte exactly once regardless of file size',
    spaceComplexity: 'O(1) — only one chunk (~64KB) in memory at a time',
    commonMistakes: [
      'Loading the whole file with fs.readFile() before processing — crashes on large files',
      'Not handling the "finish" event — code after pipe() runs before the file is written',
      'Forgetting crlfDelay: Infinity — Windows files get \\r garbage at end of each line',
      'Calling callback() multiple times inside _transform — causes "stream already finished" error',
    ],
    followUp: {
      question: 'What is backpressure and how does pipe() handle it?',
      answer: `// Backpressure: when the writable stream can't keep up with the readable.
// Without handling it, the readable buffers unbounded data in memory.

// pipe() handles backpressure automatically:
// - writable.write() returns false when its buffer is full
// - pipe() pauses the readable (readable.pause()) when write() returns false
// - resumes when the writable emits 'drain' (buffer flushed)
// This is why you should use pipe() instead of manually calling write()
// on every 'data' event from a readable stream.`
    }
  },
  {
    id: 14,
    explanation: 'INNER JOIN returns only rows where the join condition matches in ALL joined tables. LEFT JOIN returns ALL rows from the left table with NULLs for unmatched right-table columns. Put $match / WHERE first to use indexes. GROUP BY + HAVING computes aggregates per group then filters — WHERE cannot filter on aggregate values.',
    solution: `-- Tables assumed:
-- orders(id, user_id, product_id, quantity, created_at)
-- users(id, name, email)
-- products(id, name, price)

-- Query 1: INNER JOIN — order details with names (all 3 tables must match)
SELECT
  o.id                              AS order_id,
  u.name                            AS customer,
  p.name                            AS product,
  o.quantity,
  o.quantity * p.price              AS line_total
FROM   orders   o
INNER JOIN users    u ON o.user_id    = u.id
INNER JOIN products p ON o.product_id = p.id
WHERE  o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY o.created_at DESC;

-- Query 2: LEFT JOIN — total spend per customer (include orders with deleted users)
SELECT
  COALESCE(u.name, 'Deleted User')  AS customer,
  u.email,
  COUNT(o.id)                       AS order_count,
  SUM(o.quantity * p.price)         AS total_spent
FROM   orders   o
LEFT  JOIN users    u ON o.user_id    = u.id
LEFT  JOIN products p ON o.product_id = p.id
GROUP BY o.user_id, u.name, u.email
HAVING total_spent > 5000
ORDER BY total_spent DESC
LIMIT 10;

-- JOIN type summary:
-- INNER JOIN  → only rows matching in BOTH tables
-- LEFT JOIN   → all left rows + NULLs where right has no match
-- RIGHT JOIN  → all right rows + NULLs where left has no match (rare, just flip LEFT)
-- FULL OUTER  → all rows from both (MySQL doesn't support directly — use UNION of LEFT+RIGHT)`,
    walkthrough: [
      'Alias each table (o, u, p) — required when the same column name appears in multiple tables (id, name)',
      'INNER JOIN on o.user_id = u.id means: only include rows where a matching user exists. Orphaned orders (user deleted) are excluded.',
      'LEFT JOIN keeps all orders even when user or product is NULL (deleted) — COALESCE(u.name, "Deleted User") replaces NULL',
      'GROUP BY u.id — not u.name — because two users could have the same name. Group by the unique key.',
      'HAVING filters after aggregation (after GROUP BY). WHERE filters before aggregation. You cannot use WHERE total_spent > 5000 because total_spent doesn\'t exist until after GROUP BY runs.',
    ],
    timeComplexity: 'O(n log n) with indexes on join columns; O(n²) without indexes',
    spaceComplexity: 'O(g) where g = number of groups in GROUP BY result',
    commonMistakes: [
      'Using WHERE instead of HAVING to filter aggregate values — WHERE runs before GROUP BY, aggregate columns don\'t exist yet',
      'GROUP BY u.name instead of u.id — two users named "John" would be merged into one group',
      'Selecting non-aggregated columns not in GROUP BY (MySQL may allow this in non-strict mode but returns arbitrary values)',
      'Forgetting COALESCE on LEFT JOIN — NULL values appear in output for deleted users/products',
    ],
    followUp: {
      question: 'What indexes should you add to make these queries fast?',
      answer: `-- Index on foreign keys (automatically added with InnoDB FK constraints):
CREATE INDEX idx_orders_user_id    ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);

-- Composite index for the date filter + join:
CREATE INDEX idx_orders_created ON orders(created_at, user_id);

-- Why: without indexes on user_id/product_id, MySQL does a full table scan
-- for every join — O(n*m) instead of O(n log n).
-- Use EXPLAIN SELECT ... to verify IXSCAN vs COLLSCAN in the plan.`
    }
  },
  {
    id: 15,
    explanation: 'The key insight: without DISTINCT, tied salaries are counted as separate rows (LIMIT OFFSET gives you rows, not distinct values). DENSE_RANK() is the cleanest solution — it assigns the same rank to ties and never creates gaps, so the Nth highest salary is always WHERE rnk = N. Know all three approaches because the interviewer may ask you to solve it with a specific constraint.',
    solution: `-- employees table: id, name, department, salary

-- Approach 1: LIMIT + OFFSET (simplest, any MySQL version)
-- N=2: second highest, OFFSET = N-1 = 1
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;           -- change OFFSET to N-1 for any N

-- Approach 2: Subquery (works everywhere, but hardcoded for 2nd)
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Approach 3: DENSE_RANK() — best, handles all N and all edge cases (MySQL 8+)
SELECT salary
FROM (
  SELECT
    salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk = 2;          -- change 2 to any N

-- Example with data: 90000, 85000, 85000, 70000, 60000
-- DENSE_RANK results:
-- 90000 → rnk 1
-- 85000 → rnk 2  (both rows — tied)
-- 70000 → rnk 3
-- 60000 → rnk 4

-- RANK() vs DENSE_RANK() vs ROW_NUMBER():
-- salary | RANK | DENSE_RANK | ROW_NUMBER
-- 90000  |  1   |     1      |     1
-- 85000  |  2   |     2      |     2
-- 85000  |  2   |     2      |     3  (arbitrary order for equal values)
-- 70000  |  4   |     3      |     4   ← RANK skips 3 after tie
-- 60000  |  5   |     4      |     5`,
    walkthrough: [
      'DISTINCT is required in Approach 1 — without it, two employees both earning 85000 would appear as two rows, making OFFSET 1 skip only ONE of them, returning 85000 as "2nd" when the actual 2nd distinct value is 70000',
      'LIMIT 1 OFFSET N-1: OFFSET 0 = 1st highest (no skip), OFFSET 1 = 2nd (skip 1), etc.',
      'Subquery approach: finds MAX salary that is less than the overall MAX. Elegant for 2nd, but nesting deeper for 3rd, 4th... becomes unreadable.',
      'DENSE_RANK() OVER (ORDER BY salary DESC): window function — computed per row without collapsing rows. The outer SELECT then filters on the rank value.',
      'RANK() leaves gaps (1,2,2,4) after ties. DENSE_RANK() does not (1,2,2,3). ROW_NUMBER() ignores ties (1,2,3,4). For Nth highest, always use DENSE_RANK.',
    ],
    timeComplexity: 'O(n log n) — sorting dominates. With index on salary: O(n).',
    spaceComplexity: 'O(n) for window function approach — computes rank for all rows in memory',
    commonMistakes: [
      'Forgetting DISTINCT in the LIMIT/OFFSET approach — returns nth row, not nth distinct salary',
      'Using RANK() instead of DENSE_RANK() — if two employees tie for 1st, RANK skips 2nd and jumps to 3rd',
      'ROW_NUMBER() for this problem — it assigns unique ranks to tied salaries arbitrarily, giving wrong results',
      'Not handling N > number of distinct salaries — DENSE_RANK approach returns empty result (correct); subquery returns NULL (also correct); handle this in application code',
    ],
    followUp: {
      question: 'Write a query to find the top 3 earners per department.',
      answer: `SELECT name, department, salary
FROM (
  SELECT
    name,
    department,
    salary,
    DENSE_RANK() OVER (
      PARTITION BY department      -- restart rank for each department
      ORDER BY salary DESC
    ) AS rnk
  FROM employees
) ranked
WHERE rnk <= 3
ORDER BY department, salary DESC;
-- PARTITION BY makes DENSE_RANK reset per department.`
    }
  },
  {
    id: 16,
    explanation: 'A transaction is all-or-nothing: if the debit succeeds but the credit throws, rollback() undoes the debit. FOR UPDATE locks the row so no other transaction reads the same balance concurrently and causes a double-spend. Connection pooling is critical: always release the connection in finally, otherwise the pool runs out and the server hangs. This pattern is the standard for any multi-step write in Node.js + MySQL.',
    solution: `const mysql = require('mysql2/promise');

// Create pool ONCE at module level (not per request):
const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASS,
  database:         process.env.DB_NAME,
  connectionLimit:  10,           // max concurrent connections
  waitForConnections: true,       // queue requests when all connections busy
});

async function transfer(fromId, toId, amount) {
  const conn = await pool.getConnection(); // borrow from pool
  try {
    await conn.beginTransaction();

    // Lock the source row — prevents concurrent reads of same balance:
    const [rows] = await conn.execute(
      'SELECT balance FROM accounts WHERE id = ? FOR UPDATE',
      [fromId]
    );
    if (!rows.length)              throw new Error('Account not found');
    if (rows[0].balance < amount)  throw new Error('Insufficient balance');

    await conn.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [amount, fromId]
    );
    await conn.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, toId]
    );
    await conn.execute(
      'INSERT INTO transactions (from_id, to_id, amount, created_at) VALUES (?, ?, ?, NOW())',
      [fromId, toId, amount]
    );

    await conn.commit();
    return { success: true, transferred: amount };

  } catch (err) {
    await conn.rollback();         // undo ALL changes made in this transaction
    throw err;                     // re-throw so caller can handle it
  } finally {
    conn.release();                // ALWAYS return to pool — even on error
  }
}

// --- Usage in Express route ---
app.post('/api/transfer', async (req, res, next) => {
  try {
    const result = await transfer(req.body.from, req.body.to, req.body.amount);
    res.json(result);
  } catch (err) {
    if (err.message === 'Insufficient balance') return res.status(400).json({ error: err.message });
    next(err);
  }
});`,
    walkthrough: [
      'pool vs single connection: a single connection blocks all requests — pool maintains multiple connections for concurrency. createPool() is called ONCE at startup.',
      'pool.getConnection() borrows one connection. It must be returned with conn.release() — failure to release causes pool exhaustion (all future requests hang).',
      'FOR UPDATE places a row-level exclusive lock: other transactions attempting SELECT ... FOR UPDATE or UPDATE on the same row will wait until this transaction commits or rolls back.',
      'conn.execute() uses parameterized queries (? placeholders) — prevents SQL injection automatically.',
      'rollback() in catch + re-throw: rollback undoes partial changes, then re-throw passes the error up. Never swallow errors after rollback.',
      'finally { conn.release() } — this runs even if commit or rollback throws. Critical for pool health.',
    ],
    timeComplexity: 'O(1) per query with proper indexes on accounts.id',
    spaceComplexity: 'O(1) — one connection from pool',
    commonMistakes: [
      'Calling conn.release() inside catch but not finally — if commit() throws, release() is never called',
      'Creating a new pool inside the function — wastes connections, hits MySQL max_connections limit',
      'Not using FOR UPDATE — two concurrent transfers can both read balance=500, both debit 400, resulting in -300 balance',
      'Not re-throwing after rollback — caller thinks the transfer succeeded when it actually failed',
    ],
    followUp: {
      question: 'What is the difference between mysql2 and mysql2/promise?',
      answer: `// mysql2 uses callbacks:
conn.execute('SELECT 1', (err, rows) => { ... });

// mysql2/promise wraps everything in Promises for async/await:
const [rows] = await conn.execute('SELECT 1');

// The [rows] destructuring: mysql2/promise returns [rows, fields]
// You almost always just need rows.

// Both share the same underlying C++ bindings —
// mysql2/promise is just a thin Promise wrapper over the callback API.`
    }
  },
  {
    id: 17,
    explanation: 'Finding duplicates uses GROUP BY + HAVING — group by the duplicated column, keep groups with count > 1. Deleting duplicates while keeping the newest requires self-joining the table to itself (on matching email AND lower id) and deleting the "older" row from the pair. ROW_NUMBER() + PARTITION BY is the cleaner MySQL 8 approach. The common mistake: MySQL forbids deleting from a table while selecting from it in a plain subquery — must wrap in a derived table.',
    solution: `-- Step 1: Find duplicates (identify the problem)
SELECT email, COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2a: Preview what WOULD be deleted (always run SELECT first)
SELECT u1.id, u1.email, u1.created_at
FROM users u1
INNER JOIN users u2
  ON  u1.email = u2.email
  AND u1.id    < u2.id;          -- u1 is the OLDER duplicate (smaller id)

-- Step 2b: DELETE using self-join (MySQL 5.7+ compatible)
DELETE u1
FROM users u1
INNER JOIN users u2
  ON  u1.email = u2.email
  AND u1.id    < u2.id;          -- deletes all but the highest id per email

-- Step 2c: DELETE using ROW_NUMBER() (MySQL 8+, cleaner)
DELETE FROM users
WHERE id NOT IN (
  SELECT id FROM (             -- derived table wraps the subquery (MySQL workaround)
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY email ORDER BY id DESC) AS rn
    FROM users
  ) t
  WHERE rn = 1                 -- keep only the row with rn=1 (highest id per email)
);

-- Step 3: Add UNIQUE constraint to prevent future duplicates
ALTER TABLE users ADD UNIQUE INDEX idx_users_email (email);`,
    walkthrough: [
      'GROUP BY email HAVING COUNT(*) > 1 — groups all users by email, returns only groups where more than one row shares that email',
      'Self-join: join users to itself (u1 and u2) where both have the same email. The condition u1.id < u2.id means: for any duplicate pair, u1 is the older one. DELETE u1 removes the older row, keeping u2 (the newest).',
      'For 3 duplicates (ids 1, 3, 4 all with same email): pairs are (1,3), (1,4), (3,4). DELETE u1 removes ids 1 (from pairs 1-3 and 1-4) and 3 (from pair 3-4). Only id 4 remains.',
      'ROW_NUMBER() PARTITION BY email ORDER BY id DESC: for each email group, assigns rn=1 to the highest id, rn=2 to second highest, etc. Keeping only rn=1 keeps the latest.',
      'Why the derived table wrapper: MySQL prevents modifying a table while also selecting from it in the same query. Wrapping the SELECT in a subquery (derived table) forces MySQL to materialise it first.',
    ],
    timeComplexity: 'O(n log n) for the GROUP BY and self-join sort',
    spaceComplexity: 'O(d) where d = number of distinct duplicate groups',
    commonMistakes: [
      'Running DELETE without a SELECT preview first — always test what you\'ll delete',
      'DELETE FROM users WHERE id NOT IN (SELECT id FROM users WHERE ...) — MySQL error: can\'t reference the same table. Must use a derived table (nested subquery).',
      'Using MAX(id) subquery to keep latest without considering 3+ duplicates — the self-join approach handles all counts correctly',
      'Forgetting to add a UNIQUE constraint after cleanup — duplicates will be reinserted without it',
    ],
    followUp: {
      question: 'How would you find duplicates across MULTIPLE columns (e.g. same first_name AND last_name)?',
      answer: `-- Group by all columns that define "duplicate":
SELECT first_name, last_name, COUNT(*) AS count
FROM users
GROUP BY first_name, last_name
HAVING COUNT(*) > 1;

-- Delete using self-join on multiple columns:
DELETE u1
FROM users u1
INNER JOIN users u2
  ON  u1.first_name = u2.first_name
  AND u1.last_name  = u2.last_name
  AND u1.id         < u2.id;`
    }
  },
  {
    id: 18,
    explanation: 'Throttle and debounce both limit invocation frequency but in opposite ways. Throttle fires immediately on the first call, then ignores calls until the window expires. Debounce delays every call and only fires after a period of silence. The implementation is simpler than debounce: no timer needed, just compare Date.now() against the last call timestamp.',
    solution: `function throttle(fn, limit) {
  let lastCall = 0;                          // timestamp of last execution

  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;                        // update before calling fn
      fn.apply(this, args);
    }
    // calls within the window are silently dropped
  };
}

// --- Usage ---
const onScroll = throttle(() => {
  console.log('scroll handler at', Date.now());
  updateScrollIndicator();
}, 200);

window.addEventListener('scroll', onScroll);
// Fires at most once every 200ms regardless of how fast user scrolls.

// --- Comparison with debounce ---
const debouncedSave = debounce(saveForm, 500);
// Saves 500ms after the user STOPS typing (silence-triggered)

const throttledAPI = throttle(callAPI, 1000);
// Calls API at most once per second regardless of how often triggered (time-triggered)

// Real-world use:
// throttle  → scroll handlers, resize, mousemove, API rate limiting
// debounce  → search input, form autosave, window resize final value`,
    walkthrough: [
      'lastCall = 0 initialises to epoch (Jan 1 1970) — ensures the very first call always fires since Date.now() will always be > limit ms from epoch',
      'now - lastCall >= limit: if enough time has passed since the last execution, fire. Otherwise, drop the call.',
      'lastCall = now before fn() — not after. If fn() throws, lastCall is still updated so the next call waits the full interval (prevents rapid retry on repeated errors)',
      'No setTimeout: unlike debounce, throttle does not schedule future execution. The dropped calls are simply ignored — no trailing call fires.',
      'fn.apply(this, args): same as debounce — preserves this context and forwards all arguments',
    ],
    timeComplexity: 'O(1) per call',
    spaceComplexity: 'O(1) — one timestamp stored in closure',
    commonMistakes: [
      'Using setTimeout instead of Date.now() — creates a timer per invocation and fires the last call, making it behave like debounce',
      'Initialising lastCall = Date.now() — first call is dropped if it happens within limit ms of module load',
      'Not using fn.apply(this, args) — loses this context for method calls',
      'Confusing throttle with debounce in the interview explanation — state clearly: throttle = regular intervals, debounce = after silence',
    ],
    followUp: {
      question: 'How would you add a trailing call option so the last dropped call fires at the end of the window?',
      answer: `function throttle(fn, limit, { trailing = false } = {}) {
  let lastCall = 0;
  let trailingTimer = null;

  return function (...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      clearTimeout(trailingTimer);
      trailingTimer = null;
      lastCall = now;
      fn.apply(this, args);
    } else if (trailing) {
      clearTimeout(trailingTimer);
      trailingTimer = setTimeout(() => {
        lastCall = Date.now();
        trailingTimer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}`
    }
  },
  {
    id: 19,
    explanation: 'JSON.parse/stringify is not a real deep clone: it silently drops undefined values and functions, converts Dates to ISO strings, and throws on circular references. A proper deep clone recurses through the object graph using a visited Map to detect and handle circular references without infinite recursion. Handle type checks in order: null check first (typeof null === "object"), then Date, then Array, then plain object.',
    solution: `function deepClone(obj, visited = new Map()) {
  // Base cases: primitives and null pass through unchanged
  if (obj === null || typeof obj !== 'object') return obj;

  // Circular reference: already cloning this object
  if (visited.has(obj)) return visited.get(obj);

  // Date: create new Date with same timestamp
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // Array: clone each element
  if (Array.isArray(obj)) {
    const clone = [];
    visited.set(obj, clone);             // register BEFORE recursing (handles self-referencing arrays)
    for (const item of obj) {
      clone.push(deepClone(item, visited));
    }
    return clone;
  }

  // Plain object: clone each own property
  const clone = {};
  visited.set(obj, clone);               // register BEFORE recursing into properties
  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key], visited);
  }
  return clone;
}

// --- Test cases ---
const obj = {
  name: 'Alice',
  scores: [95, 87],
  meta: { createdAt: new Date('2024-01-01'), active: true },
};
const clone = deepClone(obj);
clone.scores.push(100);
console.log(obj.scores);             // [95, 87] — unchanged

// Circular reference test:
const a = { name: 'a' };
a.self = a;
const cloneA = deepClone(a);        // no infinite recursion
console.log(cloneA.self === cloneA); // true — circular ref preserved

// What JSON.parse/stringify would do:
// JSON.stringify(a) → throws: "Converting circular structure to JSON"
// new Date converted: JSON.parse(JSON.stringify(obj)).meta.createdAt
//   → string "2024-01-01T00:00:00.000Z", NOT a Date instance`,
    walkthrough: [
      'typeof null === "object" is a JavaScript quirk — the null check must come FIRST before the typeof check',
      'visited Map stores { originalObject → cloneObject } pairs. When we encounter a circular reference (obj already in visited), we return the clone we already started building — the clone graph mirrors the original graph\'s structure.',
      'visited.set(obj, clone) BEFORE recursing: if we set it after, a self-referencing object would recurse forever before we ever register it',
      'Array.isArray(obj) check before the plain object path — arrays are objects (typeof [] === "object")',
      'Object.keys(obj) iterates only own enumerable properties, not prototype chain. For a true deep clone of class instances, you\'d also need Object.getPrototypeOf to set the prototype.',
    ],
    timeComplexity: 'O(n) — visits each node in the object graph exactly once',
    spaceComplexity: 'O(n) — visited Map + call stack depth = nesting depth',
    commonMistakes: [
      'Checking typeof obj === "object" without the null guard — null passes typeof and then obj.getTime() throws',
      'Not registering in visited Map before recursing — circular references cause infinite recursion and stack overflow',
      'Handling Array AFTER the plain object path — [] is an object, would get {} cloned incorrectly',
      'Using JSON.parse(JSON.stringify()) in an interview — shows you don\'t know its limitations (undefined/function loss, Date→string, circular reference crash)',
    ],
    followUp: {
      question: 'How would you extend this to handle Map and Set?',
      answer: `// Add before the plain object check:
if (obj instanceof Map) {
  const clone = new Map();
  visited.set(obj, clone);
  for (const [key, val] of obj) {
    clone.set(deepClone(key, visited), deepClone(val, visited));
  }
  return clone;
}

if (obj instanceof Set) {
  const clone = new Set();
  visited.set(obj, clone);
  for (const val of obj) {
    clone.add(deepClone(val, visited));
  }
  return clone;
}`
    }
  },
  {
    id: 20,
    explanation: 'useReducer centralises all state transitions in one pure function: (state, action) => newState. It shines over multiple useStates when: (1) next state depends on previous state in multiple ways, (2) multiple action types modify the same state shape, (3) state has 3+ related fields that always change together. The reducer must be pure — never mutate state, always return new objects/arrays.',
    solution: `import { useReducer } from 'react';

// ---- Reducer (pure function — no side effects, no mutation) ----
function cartReducer(state, action) {
  switch (action.type) {

    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, qty: i.qty + 1 }   // increment qty, don't mutate
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, qty: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload.id),
      };

    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items
          .map(i => i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i)
          .filter(i => i.qty > 0),           // remove items with qty 0 or less
      };

    case 'CLEAR':
      return { ...state, items: [] };

    default:
      return state;                          // unknown actions return unchanged state
  }
}

const initialState = { items: [] };

// ---- Component ----
function Cart() {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  // Derived state: compute total from current items (never store in state)
  const total = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div>
      <h2>Cart ({cart.items.length} items)</h2>

      {cart.items.map(item => (
        <div key={item.id}>
          <span>{item.name} × {item.qty} — \${(item.price * item.qty).toFixed(2)}</span>
          <button onClick={() =>
            dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, qty: item.qty - 1 } })
          }>−</button>
          <button onClick={() =>
            dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, qty: item.qty + 1 } })
          }>+</button>
          <button onClick={() =>
            dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } })
          }>Remove</button>
        </div>
      ))}

      <p><strong>Total: \${total.toFixed(2)}</strong></p>
      <button onClick={() => dispatch({ type: 'ADD_ITEM', payload: { id: 1, name: 'Widget', price: 9.99 } })}>
        Add Widget
      </button>
      <button onClick={() => dispatch({ type: 'CLEAR' })}>Clear Cart</button>
    </div>
  );
}`,
    walkthrough: [
      'switch (action.type) with string constants: each case handles one state transition. Adding a new feature = adding a new case, not changing existing ones.',
      'ADD_ITEM: check existing first. If found, .map() to create new array with updated item (spread to avoid mutation). If not found, spread state.items into new array with new item appended.',
      '{ ...state, items: newItems } — always spread the full state. If you add fields to state later (e.g. couponCode), existing case handlers won\'t accidentally drop them.',
      'UPDATE_QTY chains .map() then .filter() — single pass isn\'t needed, readability wins. Items with qty ≤ 0 are auto-removed.',
      'total is DERIVED not STORED: computing it from items in render is always in sync. Storing it separately means it can get out of sync with items.',
    ],
    timeComplexity: 'O(n) per action — map/filter iterate the items array',
    spaceComplexity: 'O(n) — new arrays created on each action (immutability requirement)',
    commonMistakes: [
      'Mutating state directly: state.items.push(item) — React does not detect the change because the array reference is the same, no re-render occurs',
      'Storing derived state (total, itemCount) in the reducer — it gets stale when items change via other actions. Always derive from items in render.',
      'Missing default: return state — without it, unknown action types return undefined, crashing the component',
      'Calling dispatch directly in render (not in an event handler) — causes infinite re-render loop',
    ],
    followUp: {
      question: 'When should you use useReducer instead of useState, and when should you reach for Zustand or Redux?',
      answer: `// useState: 1-2 independent state values, simple updates
const [count, setCount] = useState(0);

// useReducer: complex state where multiple fields change together,
// or when next state depends on previous in non-trivial ways.
// Also good when you want to test state logic in isolation (pure function).

// Zustand / Redux: when state needs to be shared across MANY components
// without prop drilling, or when you need middleware (logging, persistence,
// devtools time-travel debugging). Don't add Redux/Zustand for state that
// lives in one component subtree — useContext + useReducer handles that.`
    }
  },
  {
    id: 21,
    explanation: 'curry() returns a function (curried) that checks whether it has received enough arguments. If args.length >= fn.length (the number the original function declares), it calls fn immediately. Otherwise, it returns another function that merges the accumulated args with new args and calls curried again. This recursion continues until enough args are collected — enabling both one-at-a-time and bulk application.',
    solution: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);          // enough args — execute
    }
    return function (...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]); // collect more
    };
  };
}

// --- Usage ---
const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));   // 6
console.log(curriedAdd(1, 2)(3));   // 6
console.log(curriedAdd(1)(2, 3));   // 6

// Partial application:
const add10 = curriedAdd(10);
console.log(add10(5));   // 15
console.log(add10(20));  // 30`,
    walkthrough: [
      'curry(fn) creates the curried wrapper that holds a reference to fn via closure',
      'Every call to curried checks: do I have at least fn.length arguments accumulated?',
      'If YES: fn.apply(this, args) — executes the original with all collected args',
      'If NO: return a new function that spreads args + moreArgs and calls curried again',
      '[...args, ...moreArgs] — creates a new array each time, never mutates the closure',
      'fn.length caveat: only counts non-default, non-rest params — (a, b = 1) has .length 1',
    ],
    timeComplexity: 'O(1) per call — each call either returns a partial or calls fn once',
    spaceComplexity: 'O(n) — each partial application creates a closure holding accumulated args',
    commonMistakes: [
      'Using args.length === fn.length instead of >= — breaks when called with more args than fn.length expects',
      'Mutating args (args.push(...moreArgs)) — corrupts the closure for subsequent partial applications',
      'Using an arrow function for curried — arrow functions capture this lexically and cannot be called with a specific this via .apply()',
      'Forgetting fn.length — functions with default params or rest params have a lower .length than you expect',
    ],
    followUp: {
      question: 'How do you curry a variadic function with no fixed arity (fn.length is 0)?',
      answer: `function curryVariadic(fn) {
  const accumulated = [];
  return function collect(...args) {
    if (args.length === 0) {
      return fn(...accumulated);   // empty call = "execute now"
    }
    accumulated.push(...args);
    return collect;
  };
}

const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
const c = curryVariadic(sum);
console.log(c(1)(2)(3)()); // → 6  (empty call triggers execution)`
    }
  },
  {
    id: 22,
    explanation: 'memoize() creates a Map in the closure. Each call serializes its arguments array to JSON as a cache key. On a cache hit the stored value is returned immediately without calling fn. On a miss, fn runs, the result is stored, and returned. JSON.stringify handles numbers, strings, arrays, and plain objects but not functions or undefined — acceptable for most pure numeric/string-arg functions.',
    solution: `function memoize(fn) {
  const cache = new Map();

  function memoized(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);              // cache hit — fn not called
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  }

  memoized.clear = () => cache.clear();   // expose cache invalidation
  return memoized;
}

// --- Usage ---
const factorial = memoize(function f(n) {
  return n <= 1 ? 1 : n * f(n - 1);
});

console.log(factorial(5)); // 120 — computes
console.log(factorial(5)); // 120 — instant cache hit
console.log(factorial(6)); // 720 — only multiplies 6 * cached(5)`,
    walkthrough: [
      'const cache = new Map() lives in the closure — shared across all calls to memoized, isolated per memoize() call',
      'JSON.stringify(args) — args is always an array (rest params), so (1,2) → \'[1,2]\'. Consistent key for same inputs.',
      'cache.has(key) — O(1) Map lookup. If found, return immediately without touching fn.',
      'fn.apply(this, args) — preserves the caller\'s this and spreads args correctly',
      'cache.set(key, result) — store before return so future calls hit the cache',
      'memoized.clear() — lets tests reset the cache or evict stale results',
    ],
    timeComplexity: 'O(1) for cache hit, O(fn complexity) for cache miss',
    spaceComplexity: 'O(u) where u = number of unique argument combinations called',
    commonMistakes: [
      'Using key = args[0] alone — memoAdd(1,2) and memoAdd(1,3) get the same key and return wrong results',
      'Using an object {} as cache — object keys are strings, Map handles any key type without coercion',
      'Memoizing functions with side effects — cache returns old result, side effects never re-run on cache hit',
      'Not handling cache misses: forgetting to store result before returning causes it to compute every time',
    ],
    followUp: {
      question: 'How do you limit the cache size to prevent unbounded memory growth?',
      answer: `function memoize(fn, maxSize = 100) {
  const cache = new Map(); // Map preserves insertion order

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);

    if (cache.size >= maxSize) {
      // Evict the oldest entry (Map keys() returns insertion-order iterator)
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
// This is LRU-lite: evict oldest on overflow.
// A true LRU also moves recently accessed keys to the end on each hit.`
    }
  },
  {
    id: 23,
    explanation: 'createContext creates the context object. AuthProvider owns the state and passes { user, login, logout } to all children via Provider\'s value prop. Any descendant calls useContext(AuthContext) and subscribes — React automatically re-renders it when user changes. The useAuth wrapper adds a null guard that turns a silent bug (missing Provider) into an immediate, descriptive error during development.',
    solution: `import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(userData) {
    setUser(userData);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// --- Usage ---
function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Dashboard />
    </AuthProvider>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  return user
    ? <button onClick={logout}>Logout ({user.name})</button>
    : <span>Not logged in</span>;
}

function Dashboard() {
  const { user, login } = useAuth();
  if (!user) {
    return (
      <button onClick={() => login({ name: 'Alice', role: 'admin' })}>
        Login as Alice
      </button>
    );
  }
  return <h1>Welcome, {user.name} ({user.role})</h1>;
}`,
    walkthrough: [
      'createContext(null) — null default is intentional: signals "you are outside the Provider" which the null guard catches',
      'AuthProvider owns useState for user — single source of truth for auth state',
      '<AuthContext.Provider value={{ user, login, logout }}> — all three exposed to the entire subtree',
      'useContext(AuthContext) subscribes the component — it re-renders automatically when user changes',
      'if (!ctx) throw Error — prevents silent failures; wrong usage shows an explicit error immediately',
      'Components anywhere in the tree read auth state without props — no intermediate components need to know about it',
    ],
    timeComplexity: 'O(1) per context read',
    spaceComplexity: 'O(1) — one user object in state',
    commonMistakes: [
      'Forgetting <AuthProvider> wrapper — useAuth returns null (or context default), guard throw helps diagnose this',
      'Passing a new object literal as value every render — all consumers re-render even if user didn\'t change; fix with useMemo',
      'Using Context for high-frequency updates (mousemove, scroll) — every consumer re-renders on every change',
      'Calling useAuth inside a conditional — breaks the rules of hooks, React throws a runtime error',
    ],
    followUp: {
      question: 'How do you prevent unnecessary re-renders when the context value hasn\'t actually changed?',
      answer: `import { useMemo } from 'react';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login  = useCallback((userData) => setUser(userData), []);
  const logout = useCallback(() => setUser(null), []);

  // Same object reference when user hasn't changed → consumers skip re-render
  const value = useMemo(
    () => ({ user, login, logout }),
    [user, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
// Without useMemo: every AuthProvider render (e.g. from a sibling state change)
// creates a new { user, login, logout } object → ALL consumers re-render.`
    }
  },
  {
    id: 24,
    explanation: 'useMemo caches the return value of a computation; useCallback caches the function itself (equivalent to useMemo(() => fn, deps)). React.memo wraps a component and skips re-rendering if its props haven\'t shallowly changed. The three work together: without React.memo on the child, useCallback is pointless because the child re-renders anyway. Without useCallback, React.memo sees a new function reference every render and always re-renders.',
    solution: `import React, { useState, useMemo, useCallback, memo } from 'react';

// Child wrapped in React.memo — only re-renders if props change (shallow compare)
const ProductCard = memo(({ product, onAddToCart }) => {
  console.log('ProductCard rendered:', product.name);
  return (
    <div>
      <span>{product.name} - \${product.price}</span>
      <button onClick={() => onAddToCart(product.id)}>Add to Cart</button>
    </div>
  );
});

function ProductList({ products }) {
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);

  // useMemo: re-filter ONLY when products or search changes
  // Without this: re-filters on every cartCount update too
  const filteredProducts = useMemo(
    () => products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    ),
    [products, search]
  );

  // useCallback: stable function reference — ProductCard's React.memo works
  // Without this: new function ref every render → ProductCard always re-renders
  const handleAddToCart = useCallback((productId) => {
    setCartCount(c => c + 1);
    console.log('Added:', productId);
  }, []); // empty deps: function never changes (uses setState updater form)

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      <span>Cart: {cartCount}</span>
      {filteredProducts.map(p => (
        <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
      ))}
    </div>
  );
}`,
    walkthrough: [
      'React.memo(ProductCard) — wraps the component; on parent re-render, shallowly compares old vs new props. Equal → skip re-render.',
      'useMemo([products, search]) — filteredProducts only recomputes when search changes or products array changes, NOT on cartCount changes.',
      'useCallback([], []) — handleAddToCart is created once. Same function reference on every render.',
      'setCartCount(c => c + 1) updater form — no need to include cartCount in deps because we read the previous value, not the current one.',
      'The React.memo + useCallback contract: React.memo does shallow comparison. Functions compare by reference. useCallback keeps the reference stable.',
      'When to skip: if filtering takes < 1ms, useMemo overhead costs more than it saves. Always measure before memoizing.',
    ],
    timeComplexity: 'O(n) for useMemo filter — but skipped when deps unchanged',
    spaceComplexity: 'O(k) where k = filtered results count, stored in memo cache',
    commonMistakes: [
      'Using useCallback without React.memo on the child — child re-renders anyway, useCallback is pure overhead',
      'Missing deps in the array — stale closure: the function captures an old value of the variable',
      'Memoizing everything "for safety" — adds memory pressure and dep comparison cost without benefit',
      'Including object/array literals in deps: useMemo([data], [{ filter: \'a\' }]) — new object every render = deps always change = never caches',
    ],
    followUp: {
      question: 'When should you reach for useReducer instead of multiple useState calls?',
      answer: `// Use useReducer when multiple state values are always updated together,
// or when next state depends on previous in complex ways.

// Instead of 3 separate useState calls that must always change together:
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

// Use useReducer — one dispatch updates all three atomically:
const [state, dispatch] = useReducer((s, action) => {
  switch (action.type) {
    case 'LOADING': return { loading: true,  data: null,           error: null };
    case 'SUCCESS': return { loading: false, data: action.payload, error: null };
    case 'ERROR':   return { loading: false, data: null,           error: action.payload };
    default: return s;
  }
}, { loading: false, data: null, error: null });`
    }
  },
  {
    id: 25,
    explanation: 'Express identifies error-handling middleware by its 4-parameter signature (err, req, res, next). All errors — whether thrown synchronously or passed via next(err) from async handlers — flow to this function. Centralizing error responses means route handlers only need to throw or call next(err); they never send error responses directly. The HttpError class carries a status code so the handler can respond correctly without guessing.',
    solution: `// ── 1. Custom error class ──────────────────────────────────────
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

// ── 2. Global error handler — MUST have exactly 4 params ───────
function errorHandler(err, req, res, next) {
  console.error(err);

  // Mongoose invalid ObjectId (e.g. /users/not-valid-id)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  // Mongoose schema validation failure
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Operational error with a known status code
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Unexpected error — hide internals in production
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && { detail: err.message, stack: err.stack }),
  });
}

// ── 3. Route using the pattern ─────────────────────────────────
const router = require('express').Router();

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ data: user });
  } catch (err) {
    next(err);   // delegate — never respond directly on error
  }
});

// ── 4. App setup — errorHandler registered LAST ────────────────
app.use('/api/users', router);
app.use(errorHandler);`,
    walkthrough: [
      'class HttpError extends Error — adds a status property. throw new HttpError(404, ...) is an operational error.',
      'errorHandler(err, req, res, next) — the 4th param tells Express this is an error handler, not regular middleware. Even if next is unused, it must be declared.',
      'err.name === \'CastError\' — Mongoose throws this when findById receives an invalid ObjectId string.',
      'Mongoose ValidationError: err.errors is an object keyed by field name — map its values to readable messages.',
      'err instanceof HttpError — our own errors carry their HTTP status. All other errors fall through to 500.',
      'process.env.NODE_ENV check — only expose err.message and stack in development; never in production.',
    ],
    timeComplexity: 'O(1) per request',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Defining error handler with 3 params — Express treats it as regular middleware, errors are never caught',
      'Registering error handler before routes — errors thrown in routes defined after it are never caught',
      'Calling next(err) inside the error handler itself — can cause infinite loops if the handler errors',
      'Responding AND calling next(err) in a route — causes "Cannot set headers after they are sent" crash',
    ],
    followUp: {
      question: 'How do you handle async errors without wrapping every route in try/catch?',
      answer: `// Option 1: asyncHandler wrapper utility
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Not found');
  res.json({ data: user });
  // No try/catch — asyncHandler catches rejections and calls next(err)
}));

// Option 2: require('express-async-errors')
// Patches Express internals so async handlers automatically call next(err)
// on rejection. Just require once at app startup — no wrapper needed.`
    }
  },
  {
    id: 26,
    explanation: 'Mongoose schema is the single source of truth for document shape, validation, and behavior. Built-in and custom validators run before save and throw ValidationError on failure. Virtuals expose computed data (fullName, URLs) in API responses without storing them. The pre-save hook intercepts every save — the isModified check is critical: without it, updating any other field would re-hash the already-hashed password, making the hash unverifiable.',
    solution: `const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\\S+@\\S+\\.\\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: (v) => /[A-Z]/.test(v) && /\\d/.test(v),
      message: 'Password must contain an uppercase letter and a number',
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },
}, {
  timestamps: true,
  toJSON:     { virtuals: true },
});

// ── Virtuals — computed, never stored in MongoDB ───────────────
userSchema.virtual('fullName').get(function () {
  return this.firstName + ' ' + this.lastName;
});

userSchema.virtual('gravatarUrl').get(function () {
  const hash = crypto.createHash('md5').update(this.email).digest('hex');
  return 'https://www.gravatar.com/avatar/' + hash + '?d=identicon';
});

// ── Pre-save hook — hash password before write ─────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();   // skip if unchanged
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method ────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);`,
    walkthrough: [
      'match: [regex, message] — built-in validator. Fails with the custom message if email does not match.',
      'validate: { validator, message } — custom validator. Returns true/false. Runs before save, throws ValidationError on false.',
      'enum: [...] — validates value is one of the listed strings. ValidationError otherwise.',
      'timestamps: true — Mongoose adds and manages createdAt + updatedAt automatically.',
      'virtual(\'fullName\').get(function() {...}) — regular function, not arrow, so this = the document instance.',
      'isModified(\'password\') === false — true when password field was not changed in this save operation. Prevents double-hashing.',
    ],
    timeComplexity: 'O(1) for virtuals (computed on access), O(bcrypt cost factor) for pre-save hash',
    spaceComplexity: 'O(1) — virtuals are not persisted',
    commonMistakes: [
      'Arrow function in pre or methods — loses this (the document), gets undefined instead',
      'Missing isModified check — updating name re-hashes the already-hashed password, making subsequent comparePassword calls fail',
      'Not setting toJSON: { virtuals: true } — virtuals work in code but disappear from res.json() API responses',
      'Validating password format AFTER hashing — the bcrypt hash always passes a pattern validator, so validate the raw password before the pre-hook runs',
    ],
    followUp: {
      question: 'How do you add a compound index to a Mongoose schema and when should you?',
      answer: `// Single field index in schema definition:
const schema = new mongoose.Schema({
  email: { type: String, unique: true },     // unique adds an index automatically
});

// Compound index at schema level (for multi-field queries):
schema.index({ role: 1, createdAt: -1 });
// 1 = ascending, -1 = descending. Direction matters for sort queries.

// When to index:
// YES — fields used in .find() / .sort() / $lookup in frequent queries
// YES — high cardinality fields (email, userId) — many unique values
// NO  — low cardinality (boolean, 2-value enum) — full scan may be faster
// NO  — collections < 1000 docs — index overhead exceeds scan savings`
    }
  },
  {
    id: 27,
    explanation: 'MongoDB uses a B-tree per index. A single-field index sorts documents by one field — O(log n) for equality and range queries. Compound indexes sort on multiple fields simultaneously. The ESR rule determines field order: equality fields first (narrow to exact partition), sort fields next (already ordered in the index), range fields last (ranges cannot maintain sort order across the scan). A covered query reads only the index B-tree, never touching document storage — the fastest possible read.',
    solution: `// ── 1. Indexes in Mongoose schema ─────────────────────────────
userSchema.index({ email: 1 });           // single ascending
userSchema.index({ createdAt: -1 });      // single descending (newest first)

// Compound: ESR — Equality → Sort → Range
// Query: { status: 'active', age: { $gte: 25 } }, sort: { createdAt: -1 }
userSchema.index({ status: 1, createdAt: -1, age: 1 });
//                 E──────── S────────────── R──────

// ── 2. MongoDB shell equivalent ────────────────────────────────
db.users.createIndex(
  { status: 1, createdAt: -1, age: 1 },
  { background: true }   // non-blocking build (legacy option; 4.2+ always non-blocking)
);

// ── 3. Read explain() output ───────────────────────────────────
const plan = db.users
  .find({ status: 'active', age: { $gte: 25 } })
  .sort({ createdAt: -1 })
  .explain('executionStats');

// Key fields:
// plan.queryPlanner.winningPlan.stage          → 'IXSCAN' = good, 'COLLSCAN' = no index
// plan.executionStats.totalDocsExamined        → should be close to nReturned
// plan.executionStats.executionTimeMillis      → query duration

// ── 4. Covered query (fastest — reads index only) ─────────────
db.users.createIndex({ status: 1, email: 1, name: 1 });

db.users.find(
  { status: 'active' },
  { email: 1, name: 1, _id: 0 }   // project only indexed fields
);
// explain() shows: stage 'PROJECTION_COVERED' — zero document reads`,
    walkthrough: [
      '1 = ascending, -1 = descending — direction only matters for sort queries and compound indexes. Equality queries work either way.',
      'ESR ordering: wrong order (range first) forces MongoDB to do an in-memory SORT stage after the index scan — far slower.',
      'explain(\'executionStats\') shows: which index was chosen (winningPlan), how many docs were examined, and the query duration.',
      'totalDocsExamined / nReturned ratio: 1:1 is ideal. A ratio of 10000:1 means the index is wrong or missing.',
      'Covered query: MongoDB answers the query entirely from the index. Works only when ALL projected fields AND the filter field are in the index.',
      'Indexes slow writes: every insert/update/delete must update each index on the collection. Never index fields that aren\'t queried.',
    ],
    timeComplexity: 'O(log n) for indexed query vs O(n) for COLLSCAN',
    spaceComplexity: 'O(n) per index — each index stores copies of indexed field values',
    commonMistakes: [
      'Over-indexing — more indexes = slower writes and more RAM used. Index only what you actually query.',
      'Low-cardinality index on boolean — MongoDB may ignore it and COLLSCAN anyway because scanning ~50% of docs is faster',
      'Wrong compound field order — { age: 1, status: 1 } for { status: \'active\', age: { $gte: 25 } } forces in-memory sort',
      'Not verifying with explain() — creating an index does not guarantee MongoDB uses it; the query planner may still choose COLLSCAN',
    ],
    followUp: {
      question: 'What is a text index and how do you use it for full-text search in MongoDB?',
      answer: `// Text index tokenizes and stems words (not character-by-character):
db.articles.createIndex({ title: 'text', body: 'text' });

// Query — finds documents containing 'nodejs' OR 'express' (stemmed):
db.articles.find({ $text: { $search: 'nodejs express' } });

// Sort results by relevance score:
db.articles.find(
  { $text: { $search: 'nodejs express' } },
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });

// Limitations:
// - Only one text index per collection
// - Not suitable for prefix/wildcard search — use Atlas Search for that
// - Language-aware: different stemming per locale`
    }
  },
  {
    id: 28,
    explanation: 'pipe() and compose() implement function composition using reduce. The accumulator starts as the input value (x); each iteration applies the next function to the current accumulator. reduce processes left-to-right (pipe); reduceRight processes right-to-left (compose). Each function must be unary — it receives one value and returns one value. The composition is itself pure: same input always produces the same output.',
    solution: `// pipe — left to right (natural reading order)
function pipe(...fns) {
  if (fns.length === 0) return x => x;        // identity for empty pipe
  return function (x) {
    return fns.reduce((acc, fn) => fn(acc), x);
  };
}

// compose — right to left (mathematical notation)
function compose(...fns) {
  if (fns.length === 0) return x => x;
  return function (x) {
    return fns.reduceRight((acc, fn) => fn(acc), x);
  };
}

// ── Usage 1: numeric transforms ────────────────────────────────
const double  = x => x * 2;
const addOne  = x => x + 1;
const square  = x => x * x;

const transform = pipe(double, addOne, square);
console.log(transform(3)); // 3→6→7→49

// ── Usage 2: string pipeline ───────────────────────────────────
const slugify = pipe(
  str => str.trim(),
  str => str.toLowerCase(),
  str => str.replace(/\\s+/g, '-')
);
console.log(slugify('  Hello World  ')); // → 'hello-world'

// ── Usage 3: object transformation pipeline ────────────────────
const sanitizeEmail  = u => ({ ...u, email: u.email.toLowerCase() });
const addDefaultRole = u => ({ ...u, role: u.role || 'user' });
const addTimestamp   = u => ({ ...u, createdAt: new Date() });

const prepareUser = pipe(sanitizeEmail, addDefaultRole, addTimestamp);
const user = prepareUser({ name: 'Alice', email: 'ALICE@TEST.COM' });
// → { name: 'Alice', email: 'alice@test.com', role: 'user', createdAt: Date }`,
    walkthrough: [
      'fns.reduce((acc, fn) => fn(acc), x) — acc starts as x (the input). Each step: acc = fn(acc). Final acc is the result.',
      'reduceRight — identical but iterates fns from last to first, giving right-to-left application.',
      'Empty fns edge case: x => x (identity function). pipe()(5) returns 5 unchanged.',
      'compose(f,g,h)(x) === f(g(h(x))) — h runs first despite being listed third. Matches mathematical notation.',
      'pipe is preferred in codebases — it reads left to right, matching the order functions execute.',
      'Each function must be unary. If fn(a, b) is in the chain, it receives one arg (the accumulated value) and the second param is undefined.',
    ],
    timeComplexity: 'O(n) where n = number of functions — each applied once',
    spaceComplexity: 'O(1) — only one accumulated value exists at a time',
    commonMistakes: [
      'Starting reduce without an initial value: fns.reduce((f, g) => ...) — treats the first function as the accumulator, wrong pattern',
      'Passing multi-arg functions — they receive only one argument from the pipeline; extra params are undefined',
      'Confusing pipe and compose order — pipe is left-to-right, compose is right-to-left',
    ],
    followUp: {
      question: 'How do you implement an async pipe where functions can return Promises?',
      answer: `function pipeAsync(...fns) {
  return async function (x) {
    let result = await Promise.resolve(x);
    for (const fn of fns) {
      result = await fn(result);           // awaits each step
    }
    return result;
  };
}

// Usage:
const processUser = pipeAsync(
  async (email)  => User.findOne({ email }),    // returns Promise<User>
  async (user)   => enrichWithProfile(user),   // returns Promise<User>
  async (user)   => formatForResponse(user),   // returns Promise<DTO>
);

const dto = await processUser('alice@test.com');
// Each step resolves before the next runs — sequential async pipeline`
    }
  },
  {
    id: 29,
    explanation: 'React.lazy wraps a dynamic import(). When React first renders a lazy component, it throws a Promise internally (the Suspense protocol). The nearest Suspense boundary catches it, renders the fallback, and waits for the Promise to resolve (chunk downloaded and evaluated). It then re-renders the component subtree with the real component. Error boundaries catch import() failures — network errors, 404s — and let you display a useful message and retry button instead of a blank screen.',
    solution: `import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// ── Lazy imports — each becomes a separate JS chunk ────────────
const HomePage   = lazy(() => import('./pages/HomePage'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel')); // heavy, admin-only

// ── Error boundary — class component (no hook equivalent yet) ──
class ChunkErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Chunk load failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p>Failed to load. Check your connection.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── App with route-based code splitting ───────────────────────
function App() {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <nav>
          <Link to="/">Home</Link>
          <Link
            to="/admin"
            onMouseEnter={() => import('./pages/AdminPanel')} // preload on hover
          >
            Admin
          </Link>
        </nav>
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin"    element={<AdminPanel />} />
        </Routes>
      </Suspense>
    </ChunkErrorBoundary>
  );
}`,
    walkthrough: [
      'lazy(() => import(\'./AdminPanel\')) — the import() is not called immediately, only when AdminPanel is first rendered.',
      'Suspense fallback — replaces the lazy component\'s subtree during download. Must be lightweight (spinner, skeleton).',
      'Route-based splitting — each route is its own chunk. Users download only the code for pages they visit.',
      'getDerivedStateFromError — sets hasError: true when any descendant throws (including import() failures).',
      'componentDidCatch — called after rendering with the error. Use for logging to Sentry, Datadog, etc.',
      'Preloading: import(\'./pages/AdminPanel\') on hover starts the download early. By the time the user clicks, the chunk may already be in cache.',
    ],
    timeComplexity: 'O(1) after initial load — subsequent navigations use the cached chunk',
    spaceComplexity: 'O(chunk size) — each chunk downloaded once, cached by browser',
    commonMistakes: [
      'Named exports with lazy — lazy requires default export. Wrap named: lazy(() => import(\'./M\').then(m => ({ default: m.Modal })))',
      'No error boundary — a network failure causes the entire Suspense subtree to crash silently',
      'Lazy-loading tiny components — HTTP request overhead exceeds bundle savings; only worthwhile for 10KB+ chunks',
      'Single Suspense wrapping the entire app — one loading component blocks the whole UI; use per-route Suspense boundaries',
    ],
    followUp: {
      question: 'How does React 18 startTransition improve Suspense-based navigation?',
      answer: `import { startTransition, useState, Suspense, lazy } from 'react';

const Page = lazy(() => import('./Page'));

function App() {
  const [showPage, setShowPage] = useState(false);

  function navigate() {
    // Mark as non-urgent — React keeps current UI visible while
    // the new chunk loads. No blank Suspense fallback flash.
    startTransition(() => setShowPage(true));
  }

  return (
    <Suspense fallback={<Spinner />}>
      {showPage ? <Page /> : <Home />}
      <button onClick={navigate}>Go to Page</button>
    </Suspense>
  );
}
// Without startTransition: React shows fallback immediately on navigation.
// With startTransition: React defers the state update, keeps current UI
// rendered until the chunk resolves — much smoother UX.`
    }
  },
  {
    id: 30,
    explanation: 'The factory pattern (validate(schema) returning a middleware) lets each route have its own schema without shared state. The inner function iterates all schema fields, runs every applicable rule, and accumulates error messages. It returns all errors at once — not just the first — so the client can fix all problems in one round-trip. Calling next() with no arguments passes control to the next middleware (the route handler), only reached when validation fully passes.',
    solution: `function validate(schema) {
  return function (req, res, next) {
    const errors = [];
    const body   = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value   = body[field];
      const isEmpty = value === undefined || value === null || value === '';

      // Required check
      if (rules.required && isEmpty) {
        errors.push(field + ' is required');
        continue;              // skip further checks — field is absent
      }

      if (isEmpty) continue;   // optional, not provided — nothing to validate

      // Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push(field + ' must be a ' + rules.type);
        continue;
      }

      // String rules
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(field + ' must be at least ' + rules.minLength + ' characters');
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(field + ' must be at most ' + rules.maxLength + ' characters');
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(field + ' has an invalid format');
      }

      // Number rules
      if (rules.min !== undefined && value < rules.min) {
        errors.push(field + ' must be at least ' + rules.min);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(field + ' must be at most ' + rules.max);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
}

// ── Usage ──────────────────────────────────────────────────────
const userSchema = {
  name:     { type: 'string', required: true, minLength: 2, maxLength: 50 },
  email:    { type: 'string', required: true, pattern: /^\\S+@\\S+\\.\\S+$/ },
  age:      { type: 'number', required: false, min: 0, max: 120 },
  password: { type: 'string', required: true, minLength: 8 },
};

const loginSchema = {
  email:    { type: 'string', required: true },
  password: { type: 'string', required: true },
};

router.post('/register', validate(userSchema), createUser);
router.post('/login',    validate(loginSchema), loginUser);`,
    walkthrough: [
      'Object.entries(schema) — iterates [fieldName, rulesObject] pairs. Order matches schema definition.',
      'isEmpty check — covers undefined (field missing from body), null, and empty string (typeof \'string\' passes but empty string is semantically absent).',
      'continue after required failure — no point checking minLength on a field that\'s not present at all.',
      'typeof value !== rules.type — simple type check. For numbers, JSON.parse already produces a JS number from valid JSON.',
      'rules.pattern.test(value) — pattern is a RegExp. .test() returns true if it matches — check the inverse (!rules.pattern.test(value)) to detect invalid format.',
      'errors.length > 0 — return early with 400. Otherwise next() advances to the route handler with validated req.body.',
    ],
    timeComplexity: 'O(f × r) where f = fields, r = rules per field — effectively O(1) for typical schemas',
    spaceComplexity: 'O(e) where e = number of validation errors in the worst case',
    commonMistakes: [
      'Stopping at the first error (return after first failure) — client must make multiple requests to discover all errors',
      'Not handling req.body being undefined — happens when express.json() middleware is not configured',
      'Using == null instead of explicit isEmpty — misses empty strings which are a common form-submission issue',
      'Not calling next() after validation passes — request hangs with no response, looks like a server hang',
    ],
    followUp: {
      question: 'How would you add an async validator (e.g. check email uniqueness in the database)?',
      answer: `// Extend the schema rule with asyncValidator:
const userSchema = {
  email: {
    type: 'string',
    required: true,
    pattern: /^\\S+@\\S+\\.\\S+$/,
    asyncValidator: async (value) => {
      const existing = await User.findOne({ email: value });
      return existing ? 'Email already registered' : null; // null = no error
    },
  },
};

// Updated factory — make the middleware async:
function validate(schema) {
  return async function (req, res, next) {
    const errors = [];
    const body = req.body || {};

    // Sync checks first (same as before) ...

    // Async validators — run in parallel:
    const asyncChecks = Object.entries(schema)
      .filter(([field, rules]) => rules.asyncValidator && body[field])
      .map(async ([field, rules]) => {
        const msg = await rules.asyncValidator(body[field]);
        if (msg) errors.push(msg);
      });

    await Promise.all(asyncChecks);

    if (errors.length > 0) return res.status(400).json({ errors });
    next();
  };
}`
    }
  },
  {
    id: 31,
    explanation: 'call() and apply() both invoke the function immediately with a specified this — they differ only in how extra args are passed (individually vs as an array). bind() returns a new function with this permanently locked in; it never calls the original. Arrow functions have no own this and capture it lexically from the enclosing scope, so call/apply/bind have no effect on them.',
    solution: `// ── call, apply, bind ────────────────────────────────────────
const user = { name: 'Alice' };

function greet(greeting, punct) {
  return greeting + ', ' + this.name + punct;
}

console.log(greet.call(user,  'Hello', '!'));  // Hello, Alice!
console.log(greet.apply(user, ['Hi',   '?'])); // Hi, Alice?

const greetAlice = greet.bind(user, 'Hello');
console.log(greetAlice('!'));  // Hello, Alice!
console.log(greetAlice('…')); // Hello, Alice…

// ── Method borrowing ──────────────────────────────────────────
const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
const arr = Array.prototype.slice.call(arrayLike); // ['a', 'b', 'c']

// ── React class method pitfall ────────────────────────────────
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    this.increment = this.increment.bind(this); // bind once in constructor
  }
  increment() {
    this.setState({ count: this.state.count + 1 });
    // Without bind: onClick passes the function reference — 'this' becomes undefined
  }
  render() {
    return <button onClick={this.increment}>{this.state.count}</button>;
  }
}

// ── Implement bind() from scratch ─────────────────────────────
Function.prototype.myBind = function (thisArg, ...partialArgs) {
  const fn = this;
  return function (...args) {
    return fn.apply(thisArg, [...partialArgs, ...args]);
  };
};

const bound = greet.myBind(user, 'Hey');
console.log(bound('!')); // Hey, Alice!

// ── Arrow functions ignore bind ───────────────────────────────
const arrow = () => console.log(this?.name);
arrow.call(user); // undefined — arrow captured outer 'this', bind has no effect`,
    walkthrough: [
      'greet.call(user, \'Hello\', \'!\') — greet runs immediately with this = user. Args listed one-by-one after thisArg.',
      'greet.apply(user, [\'Hi\', \'?\']) — identical result. Only difference: args in an array. Mnemonic: A = array.',
      'greet.bind(user, \'Hello\') — returns a new function. First arg \'Hello\' is pre-filled (partial application). Calling it later supplies remaining args.',
      'Method borrowing: Array.prototype.slice.call(arrayLike) — runs slice with this = arrayLike, converting it to a real Array.',
      'React class: onClick={this.increment} detaches the method from the instance. Without bind, this is undefined inside increment when called by React.',
      'myBind: closure captures fn and thisArg. Returns a function that merges partialArgs + new args and calls fn.apply(thisArg, ...).',
    ],
    timeComplexity: 'O(1) — just function invocation',
    spaceComplexity: 'O(1) for call/apply; O(n) for bind (creates a new function closure)',
    commonMistakes: [
      'Expecting bind to call the function — it returns a new function, does not invoke it',
      'Using bind in render: onClick={this.method.bind(this)} — creates a new function every render, defeats React.memo',
      'Trying to bind an arrow function — arrow functions capture this lexically, bind has no effect on them',
      'Confusing call and apply: call takes individual args, apply takes an array',
    ],
    followUp: {
      question: 'How does `this` behave differently across regular functions, arrow functions, and method calls?',
      answer: `const obj = {
  name: 'obj',
  regular:  function() { return this.name; },
  arrow:    () => (typeof this !== 'undefined' ? this.name : undefined),
  shorthand() { return this.name; },
};

obj.regular();          // 'obj'      — this = obj (method call)
obj.arrow();            // undefined  — arrow captures outer this (global/undefined in strict)
obj.shorthand();        // 'obj'      — same as regular function

const fn = obj.regular;
fn();                   // undefined  — detached, this = global or undefined (strict mode)
fn.call(obj);           // 'obj'      — explicitly set with call

setTimeout(obj.regular, 0);      // undefined — callback detaches this
setTimeout(() => obj.regular(), 0); // 'obj' — arrow preserves obj as the caller`
    }
  },
  {
    id: 32,
    explanation: 'JavaScript\'s event loop processes tasks in a strict priority order. When the call stack empties: (1) drain ALL microtasks — including any new microtasks added during draining; (2) pick ONE macrotask and run it to completion; (3) drain ALL microtasks again; repeat. Promises (.then callbacks) are microtasks. setTimeout/setInterval callbacks are macrotasks. async/await is sugar for Promises, so code after await is always a microtask.',
    solution: `// ── Order: Sync → Microtasks → Macrotask → Microtasks → … ──

// Example 1: the classic
console.log('sync 1');
setTimeout(() => console.log('macrotask'), 0);
Promise.resolve()
  .then(() => console.log('microtask 1'))
  .then(() => console.log('microtask 2'));
console.log('sync 2');

// Output:
// sync 1
// sync 2
// microtask 1
// microtask 2
// macrotask

// Example 2: async/await
async function main() {
  console.log('async start');    // sync — runs before first await
  await Promise.resolve();       // suspends; rest becomes a microtask
  console.log('after await');    // microtask
}
console.log('before');
main();
console.log('after call');       // sync — runs while main() is suspended

// Output: before, async start, after call, after await

// Example 3: nested microtask — still before macrotask
Promise.resolve().then(() => {
  console.log('A');
  Promise.resolve().then(() => console.log('B')); // queued DURING drain
});
setTimeout(() => console.log('C'), 0);
// Output: A, B, C   — B drains before C even though C was queued earlier

// Example 4: Node.js — process.nextTick fires before Promises
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
setTimeout(() => console.log('setTimeout'), 0);
// Node output: nextTick, promise, setTimeout`,
    walkthrough: [
      'Sync code fills the call stack and runs to completion — no callbacks interrupt it.',
      'When stack empties: drain ALL microtasks. New microtasks queued during draining also run before any macrotask.',
      'Pick ONE macrotask (e.g. first setTimeout callback). Run it. Then drain microtasks again.',
      'async/await: await pauses the async function, schedules the rest as a .then callback (microtask). The caller continues synchronously.',
      'Two setTimeouts(fn, 0): both are macrotasks. They run in FIFO order, but only after all microtasks have cleared.',
      'process.nextTick (Node.js): a separate queue checked before Promise microtasks — even higher priority.',
    ],
    timeComplexity: 'O(1) per event loop tick — each task runs to completion before queues are checked',
    spaceComplexity: 'O(n) — each pending callback occupies queue memory',
    commonMistakes: [
      'Assuming setTimeout(fn, 0) runs "immediately" — it is always a macrotask, always after all Promises',
      'Thinking two setTimeouts interleave with Promises — no, both macrotasks run after all microtasks clear',
      'Expecting async/await to be synchronous — await pauses the function; the caller continues',
      'Confusing process.nextTick with setImmediate: nextTick fires before Promises; setImmediate fires after I/O in the macrotask queue',
    ],
    followUp: {
      question: 'What is the difference between setImmediate() and setTimeout(fn, 0) in Node.js?',
      answer: `// In the main module: order is non-deterministic (OS timer precision)
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));
// Either can fire first

// Inside an I/O callback: setImmediate ALWAYS fires before setTimeout
const fs = require('fs');
fs.readFile('file.txt', () => {
  setTimeout(() => console.log('setTimeout'), 0);
  setImmediate(() => console.log('setImmediate'));
  // Always: setImmediate, then setTimeout
});

// Rule of thumb:
// setImmediate — run after current I/O events, before timers
// setTimeout(fn, 0) — run after at least 0ms (timer queue — less predictable)`
    }
  },
  {
    id: 33,
    explanation: 'JavaScript uses prototypal inheritance: every object has a hidden [[Prototype]] link to another object (or null). Property lookups walk this chain. Object.create(proto) creates a new object with proto as its [[Prototype]]. The ES6 class/extends syntax compiles to the same constructor function + prototype assignment — it is pure syntactic sugar. instanceof walks the prototype chain to check if Constructor.prototype appears anywhere in it.',
    solution: `// ── 1. Object.create — prototype chain ───────────────────────
const animal = {
  breathes: true,
  describe() { return 'I am ' + this.name; },
};

const dog = Object.create(animal);   // dog.__proto__ === animal
dog.name  = 'Rex';
dog.speaks = 'woof';

console.log(dog.breathes);                      // true — from animal
console.log(dog.describe());                    // 'I am Rex'
console.log(dog.hasOwnProperty('breathes'));    // false — inherited
console.log(Object.getPrototypeOf(dog) === animal); // true

// ── 2. Constructor function (pre-ES6) ─────────────────────────
function Animal(name) {
  this.name = name;               // own property — per instance
}
Animal.prototype.breathes = true; // shared via prototype chain
Animal.prototype.describe = function () { return 'I am ' + this.name; };

const cat = new Animal('Whiskers');
// new does: create {} → set __proto__ = Animal.prototype → run Animal → return {}
console.log(cat instanceof Animal); // true

// ── 3. class/extends — same thing, cleaner syntax ─────────────
class Vehicle {
  constructor(make) { this.make = make; }
  describe() { return 'Vehicle: ' + this.make; }
}

class Car extends Vehicle {
  constructor(make, model) {
    super(make);                   // calls Vehicle constructor, sets this.make
    this.model = model;
  }
  describe() { return super.describe() + ' ' + this.model; }
}

const tesla = new Car('Tesla', 'Model 3');
console.log(tesla.describe());          // 'Vehicle: Tesla Model 3'
console.log(tesla instanceof Car);      // true
console.log(tesla instanceof Vehicle);  // true — Vehicle.prototype is in chain

// Car.prototype.__proto__ === Vehicle.prototype  ← what extends wires up

// ── 4. Object.create(null) — no prototype ─────────────────────
const dict = Object.create(null);
dict.key = 'value';
console.log('toString' in dict); // false — no inherited properties at all`,
    walkthrough: [
      'Object.create(animal): new object with animal as [[Prototype]]. dog.breathes walks up to animal and returns true.',
      'hasOwnProperty(\'breathes\'): checks only dog itself — not the chain. Returns false.',
      'new Animal(): (1) create {} (2) set {}.__proto__ = Animal.prototype (3) run Animal with this = {} (4) return {}.',
      'Methods on Animal.prototype are shared by all instances — not copied. Own properties (name) are per-instance.',
      'class Car extends Vehicle: sets Car.prototype.__proto__ = Vehicle.prototype. super() calls Vehicle\'s constructor.',
      'instanceof tesla Vehicle: checks if Vehicle.prototype appears in tesla\'s chain — tesla → Car.prototype → Vehicle.prototype. Found. Returns true.',
    ],
    timeComplexity: 'O(d) for property lookup where d = prototype chain depth (usually O(1) in practice)',
    spaceComplexity: 'O(1) — prototype methods shared, not duplicated per instance',
    commonMistakes: [
      'Mutating Array.prototype or Object.prototype — affects ALL arrays/objects including third-party code',
      'Forgetting super() in a subclass constructor — throws ReferenceError before this can be accessed',
      'Confusing __proto__ (instance link) with prototype (the property on constructor functions)',
      'Setting Animal.prototype = new Animal() — creates shared mutable state across all instances (classic bug)',
    ],
    followUp: {
      question: 'What does Object.create(null) do and when would you use it?',
      answer: `const map = Object.create(null);
// map has NO prototype — not even Object.prototype
// No .toString(), .hasOwnProperty(), .constructor — truly empty object

map.key = 'value';
console.log('toString' in map);    // false — no inherited keys
console.log(map.hasOwnProperty);   // undefined

// Use case: safe dictionary / hash map
// Regular {} inherits from Object.prototype — keys like 'constructor',
// 'hasOwnProperty', 'toString' are reserved and can cause subtle bugs
// if user-supplied data is used as keys.
// Object.create(null) has no such risk.`
    }
  },
  {
    id: 34,
    explanation: 'Browsers enforce same-origin policy — JavaScript cannot read responses from a different origin without the server\'s explicit permission via CORS headers. For simple requests (GET/POST with standard headers) the browser sends the request directly and checks the response for Access-Control-Allow-Origin. For complex requests (PUT, DELETE, or custom headers like Authorization) the browser first sends an OPTIONS preflight — the server must respond with permission headers before the real request proceeds.',
    solution: `const express = require('express');
const cors    = require('cors');
const app     = express();

// ── Option 1: allow all origins (dev only) ────────────────────
app.use(cors()); // Access-Control-Allow-Origin: *

// ── Option 2: whitelist specific origins (production) ─────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://myapp.com',
];

const corsOptions = {
  origin(origin, callback) {
    // no origin = curl / Postman / server-to-server → allow
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,   // allow cookies and Authorization header cross-origin
  maxAge: 86400,       // browser caches preflight response for 24h
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle preflight for ALL routes

// ── Manual CORS (without the cors package) ─────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});`,
    walkthrough: [
      'Same-origin = same protocol + host + port. localhost:3000 and localhost:5000 differ by port → cross-origin.',
      'app.use(cors()) must come BEFORE route handlers — middleware order determines when headers are set.',
      'Dynamic origin function: checks against whitelist. Allows no-origin requests (Postman, server-to-server).',
      'credentials: true — required to send cookies and Authorization headers across origins. Forces explicit origin (not *).',
      'app.options(\'*\', cors()) — handles preflight for all routes. Without this, PUT/DELETE with Authorization silently fail.',
      'maxAge: 86400 — browser caches the preflight response, reducing OPTIONS round-trips for 24 hours.',
    ],
    timeComplexity: 'O(n) per request where n = number of allowed origins',
    spaceComplexity: 'O(1)',
    commonMistakes: [
      'Access-Control-Allow-Origin: * with credentials: true — browsers reject this combination; use explicit origin',
      'Not handling preflight: PUT/DELETE/PATCH with Authorization header silently fail without app.options()',
      'Applying cors() after routes — headers must be set before the route sends a response',
      'Using wildcard * in production for authenticated endpoints — exposes the API to any website',
    ],
    followUp: {
      question: 'What is the difference between a simple request and a preflighted request?',
      answer: `// Simple request — no preflight (browser sends directly):
// Methods: GET, HEAD, POST
// Headers: only Content-Type: application/x-www-form-urlencoded | text/plain | multipart/form-data

fetch('https://api.example.com/data');  // GET — simple, no preflight

// Preflighted request — OPTIONS sent first:
// Methods: PUT, DELETE, PATCH
// OR: custom headers (Authorization, X-Custom-Header)
// OR: Content-Type: application/json

fetch('https://api.example.com/users', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Alice' }),
});
// 1. Browser: OPTIONS /users + headers listing desired method/headers
// 2. Server: 200 + Access-Control-Allow-Methods, Allow-Headers
// 3. Browser: sends the real PUT`
    }
  },
  {
    id: 35,
    explanation: 'populate() replaces an ObjectId field with the actual document from the referenced collection by making a second query. For a single document it is 2 queries. For an array of refs, Mongoose batches all IDs into one $in query — not one query per item. Choosing to embed vs reference is a schema design decision: embed when the data is always read with the parent and bounded in size; reference when the data is large, shared, or updated independently.',
    solution: `const mongoose = require('mongoose');

// ── Schemas with refs ─────────────────────────────────────────
const userSchema = new mongoose.Schema({ name: String, email: String, password: String });

const commentSchema = new mongoose.Schema({
  body:   String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const postSchema = new mongoose.Schema({
  title:    String,
  body:     String,
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

const User    = mongoose.model('User',    userSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Post    = mongoose.model('Post',    postSchema);

// ── Basic populate ─────────────────────────────────────────────
const post = await Post.findById(postId).populate('author');
// post.author = { _id, name, email, password }

// ── Populate with field selection — exclude password ───────────
const post = await Post.findById(postId)
  .populate('author', 'name email');     // only name and email (_id included by default)
// post.author = { _id, name, email }

// ── Multiple fields ────────────────────────────────────────────
const post = await Post.findById(postId)
  .populate('author', 'name email')
  .populate('comments');

// ── Nested populate: comments + each comment's author ─────────
const post = await Post.findById(postId)
  .populate({
    path: 'comments',
    populate: { path: 'author', select: 'name' },
  });
// post.comments[0].author = { _id, name }

// ── Array query + populate ─────────────────────────────────────
const posts = await Post.find({ tags: 'nodejs' })
  .populate('author', 'name')
  .sort({ createdAt: -1 })
  .limit(10);
// Mongoose batches all author IDs into one $in query — not one per post`,
    walkthrough: [
      'ref: \'User\' in the schema field tells populate() which model to query when replacing the ObjectId.',
      '.populate(\'author\') — after finding the post, runs User.find({ _id: { $in: [authorId] } }) and replaces the field.',
      '.populate(\'author\', \'name email\') — second arg is a space-separated field selection. Prefix with - to exclude.',
      'Nested populate: { path: \'comments\', populate: { path: \'author\' } } — second-level query after getting comments.',
      'Array batching: 10 posts with 10 different authors → 2 queries total (1 for posts, 1 $in for all authors).',
      'Embed vs reference: embed small, bounded, always-read-together data. Reference large, shared, or independently-updated data.',
    ],
    timeComplexity: 'O(n) for the secondary $in query where n = distinct referenced IDs',
    spaceComplexity: 'O(n) — each populated document loaded into memory',
    commonMistakes: [
      'Forgetting ref: \'ModelName\' — populate() silently returns null or the raw ObjectId without it',
      'Populating every field on every query — select only needed fields to avoid loading unnecessary data',
      'Unbounded ref arrays: storing thousands of IDs in one document hits MongoDB\'s 16MB document limit',
      'Assuming populate prevents N+1 entirely — it batches same-level refs but nested populates add more queries',
    ],
    followUp: {
      question: 'What is virtual populate and when do you use it?',
      answer: `// Problem: storing all post IDs on User creates an unbounded array.
// Virtual populate queries from the "many" side — no array on User needed.

const userSchema = new mongoose.Schema({ name: String });

userSchema.virtual('posts', {
  ref:          'Post',    // model to query
  localField:   '_id',     // field on User
  foreignField: 'author',  // field on Post that references User
});

const user = await User.findById(userId)
  .populate('posts', 'title createdAt');
// Mongoose runs: Post.find({ author: userId })
// User document stays small — no growing array of post IDs

// Use virtual populate when: parent could have unbounded children
// Use stored array when: you need to query/sort on the array in MongoDB`
    }
  },
  {
    id: 36,
    explanation: 'HTTP is request-response — the server can only send data when the client asks. WebSockets establish a persistent, full-duplex TCP connection so the server can push data at any time. Socket.io wraps WebSockets with automatic reconnection, rooms (named groups of sockets), and HTTP long-polling fallback. Rooms let you target events: a personal room per user (user:userId) for notifications, and shared rooms (order:orderId) for collaborative features.',
    solution: `// ── server.js ─────────────────────────────────────────────────
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);   // Socket.io needs the http server, not Express app
const io     = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

const onlineUsers = new Map(); // socketId → userId

io.on('connection', (socket) => {
  // Client identifies itself after connecting
  socket.on('identify', (userId) => {
    onlineUsers.set(socket.id, userId);
    socket.join('user:' + userId); // personal room for targeted events
    io.emit('userCount', onlineUsers.size);
  });

  // Chat: broadcast message to everyone in a room
  socket.on('chatMessage', ({ room, text }) => {
    io.to(room).emit('chatMessage', {
      text,
      from: onlineUsers.get(socket.id),
      at: Date.now(),
    });
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('userCount', onlineUsers.size);
  });
});

// Push order update from an HTTP route handler:
app.post('/api/orders/:id/ship', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: 'shipped' });
  io.to('user:' + order.userId).emit('orderUpdate', { orderId: order._id, status: 'shipped' });
  res.json({ data: order });
});

server.listen(5000);

// ── React client hook ──────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function useSocket(userId) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    const socket = socketRef.current;

    socket.on('connect', () => socket.emit('identify', userId));
    socket.on('orderUpdate', (data) => console.log('Order update:', data));
    socket.on('chatMessage', (msg) => console.log(msg.from, ':', msg.text));

    return () => socket.disconnect();  // cleanup on unmount
  }, [userId]);

  function sendChat(room, text) {
    socketRef.current?.emit('chatMessage', { room, text });
  }

  return { sendChat };
}`,
    walkthrough: [
      'http.createServer(app) — Socket.io attaches to the raw HTTP server. If you pass the Express app directly, it won\'t work.',
      'new Server(server, { cors }) — CORS must be configured on Socket.io separately from Express\'s cors middleware.',
      'socket.join(\'user:\' + userId) — subscribes this socket to a personal room. io.to(\'user:\' + userId).emit() reaches any device that user is connected from.',
      'io.to(room).emit() — sends to all sockets in the room, including the sender. socket.to(room).emit() — all except the sender.',
      'Map of socketId → userId: bridge between Socket.io identities and your app\'s user model. Always clean up on disconnect.',
      'HTTP route + socket push: regular REST endpoint updates the DB and then pushes a real-time event to the affected user.',
    ],
    timeComplexity: 'O(r) to emit to a room where r = sockets in that room',
    spaceComplexity: 'O(n) for onlineUsers Map where n = connected clients',
    commonMistakes: [
      'Attaching Socket.io to the Express app instead of the http server — connections never establish',
      'Not cleaning up on disconnect — the Map grows forever (memory leak)',
      'Missing CORS config on Socket.io — frontend can\'t connect even with Express CORS set',
      'Not re-identifying on reconnect — client may reconnect with a new socket.id; listen on \'connect\' not just \'connect\' once',
    ],
    followUp: {
      question: 'How do you scale Socket.io across multiple Node.js processes?',
      answer: `// Problem: io.to(room).emit() only reaches clients on the SAME process.
// 4 Node processes (cluster/PM2) → user on process 1 misses events from process 2.

// Solution: @socket.io/redis-adapter — Redis pub/sub relays events across processes
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient }  = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));

// Now io.to(room).emit() is relayed via Redis to ALL processes.
// Any process can target any room regardless of which process the socket is on.`
    }
  },
  {
    id: 37,
    explanation: 'useRef returns the same mutable { current } object on every render. Mutating current never triggers a re-render — unlike setState. This makes it ideal for storing values you need to read but that shouldn\'t cause UI updates: timer IDs, abort controllers, previous prop values, and DOM references. forwardRef lets you pass a ref from a parent through a component to a DOM element inside it. useImperativeHandle customizes what the parent sees on ref.current.',
    solution: `import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';

// ── 1. useRef: focus DOM element on mount ─────────────────────
function AutoFocusInput() {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current.focus(); }, []); // null on first render, DOM node after mount
  return <input ref={inputRef} placeholder="auto-focused" />;
}

// ── 2. useRef: store timer ID without re-rendering ────────────
function Stopwatch() {
  const [time, setTime]     = useState(0);
  const intervalRef         = useRef(null); // changing this never re-renders

  function start() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => setTime(t => t + 1), 1000);
  }
  function stop() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  useEffect(() => () => clearInterval(intervalRef.current), []); // cleanup on unmount

  return <div>{time}s <button onClick={start}>Start</button> <button onClick={stop}>Stop</button></div>;
}

// ── 3. useRef: track previous value ───────────────────────────
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }); // runs after render — ref holds previous value during render
  return ref.current;
}

// ── 4. forwardRef: parent accesses child's DOM node ───────────
const FancyInput = forwardRef(function FancyInput(props, ref) {
  return (
    <div className="fancy-wrapper">
      <input ref={ref} {...props} />   {/* ref wired to inner <input> */}
    </div>
  );
});

function Form() {
  const inputRef = useRef(null);
  return (
    <>
      <FancyInput ref={inputRef} placeholder="fancy" />
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </>
  );
}

// ── 5. useImperativeHandle: expose custom API ─────────────────
const SmartInput = forwardRef(function SmartInput({ label }, ref) {
  const innerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus:    () => innerRef.current.focus(),
    clear:    () => { innerRef.current.value = ''; },
    getValue: () => innerRef.current.value,
  }));

  return <input ref={innerRef} placeholder={label} />;
});

function Parent() {
  const smartRef = useRef(null);
  return (
    <>
      <SmartInput ref={smartRef} label="Type here" />
      <button onClick={() => smartRef.current.clear()}>Clear</button>
    </>
  );
}`,
    walkthrough: [
      'useRef(null) — initial value null. After mount, React sets ref.current = the DOM node. On unmount, sets it back to null.',
      'Mutating intervalRef.current does not schedule a re-render. The interval ID is readable across renders because the ref object is the same object.',
      'usePrevious: useEffect runs after the render paints. During the current render, ref.current still holds last render\'s value. The effect then updates it for next time.',
      'forwardRef(fn): React calls fn(props, ref) where ref is the ref passed by the parent. The component decides where to attach it.',
      'useImperativeHandle(ref, factory): replaces what the parent sees on ref.current with the object returned by factory. Hides internal DOM details.',
      'When to use: DOM manipulation (focus, scroll, play/pause), timer management, tracking values without render side effects.',
    ],
    timeComplexity: 'O(1) — ref access is direct object property lookup',
    spaceComplexity: 'O(1) per ref',
    commonMistakes: [
      'Reading ref.current during render — it is null on the first render (DOM not mounted yet)',
      'Using useState instead of useRef for timer IDs — causes an extra re-render on start/stop',
      'Expecting ref mutation to trigger re-render — it doesn\'t; use state if the UI must update',
      'Using forwardRef without useImperativeHandle when you want to hide the DOM node — parents get raw DOM access',
    ],
    followUp: {
      question: 'What is the difference between a controlled and an uncontrolled input?',
      answer: `// Controlled: React state owns the value
function Controlled() {
  const [value, setValue] = React.useState('');
  return (
    <input
      value={value}                           // React drives the input
      onChange={e => setValue(e.target.value)}
    />
  );
}

// Uncontrolled: DOM owns the value — read it via ref when needed
function Uncontrolled() {
  const inputRef = React.useRef(null);
  function handleSubmit() {
    console.log(inputRef.current.value);      // read from DOM on demand
  }
  return (
    <>
      <input ref={inputRef} defaultValue="initial" />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}

// Controlled: use for validation, dependent fields, conditional rendering
// Uncontrolled: use for file inputs, simple forms, third-party DOM libs`
    }
  },
  {
    id: 38,
    explanation: 'React\'s reconciliation algorithm compares the previous and new virtual DOM trees to compute minimal DOM changes. For lists, keys are how React identifies which items moved, were added, or removed. With key={index}, removing the first item gives the second item the first\'s key — React reuses its DOM node. If that node had a controlled input with typed text, the text appears to shift to the next item. Stable, unique IDs eliminate this by letting React track each item independently of position.',
    solution: `import React, { useState } from 'react';

// ── BUG: key={index} — delete first item → DOM nodes shift ────
function BadList() {
  const [items, setItems] = useState([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ]);

  function remove(index) {
    setItems(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          {/*
            After removing Alice (index 0):
              Bob   gets key=0 (was Alice's)
              Charlie gets key=1 (was Bob's)
            React REUSES Alice's DOM node for Bob.
            Uncontrolled input (defaultValue) retains Alice's typed text in Bob's row.
          */}
          <input defaultValue={item.name} />
          <button onClick={() => remove(index)}>×</button>
        </li>
      ))}
    </ul>
  );
}

// ── FIX: stable unique IDs ─────────────────────────────────────
function GoodList() {
  const [items, setItems] = useState([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ]);

  function remove(id) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {/* key=2 always = Bob. React removes Alice's node, keeps Bob's. Input value correct. */}
          <input defaultValue={item.name} />
          <button onClick={() => remove(item.id)}>×</button>
        </li>
      ))}
    </ul>
  );
}

// ── Reconciliation rules ───────────────────────────────────────
// Rule 1: different element type in same position → full unmount + remount
// <div><Child /></div> → <span><Child /></span>  : Child loses all state

// Rule 2: same element type → update props in place, keep DOM node

// Rule 3: lists → use keys to match across renders

// ── Intentional remount with key ──────────────────────────────
// Change key to force full remount (resets all state in the subtree):
function ProfilePage({ userId }) {
  return <ProfileForm key={userId} />;
  // When userId changes → key changes → ProfileForm unmounts + remounts fresh
}`,
    walkthrough: [
      'Virtual DOM: React.createElement builds JS objects like { type: \'li\', props: {} }. Diffing objects is O(n) — far cheaper than diffing real DOM.',
      'Index key bug: items=[Alice,Bob,Charlie], remove Alice → [Bob,Charlie]. Bob gets key=0, Charlie gets key=1. React sees key=0 changed (Alice→Bob) and key=2 disappeared — it updates key=0\'s node in place. The DOM node (with any typed text) stays, only props update.',
      'ID key fix: Bob always has key=2. After removing Alice (key=1), React removes key=1\'s DOM node and leaves key=2 (Bob) and key=3 (Charlie) untouched.',
      'key={Math.random()}: new key every render → every item unmounts and remounts — catastrophically bad.',
      'Intentional key change: swap key={userId} when userId changes to force a full remount. Cleaner than imperative reset functions.',
      'When key={index} IS acceptable: static list that never reorders and items are never deleted from non-tail positions (e.g. a read-only table).',
    ],
    timeComplexity: 'O(n) for reconciliation — linear scan of the component tree',
    spaceComplexity: 'O(n) for the virtual DOM tree',
    commonMistakes: [
      'key={index} on any list that allows reordering, filtering, or deletion from non-tail positions',
      'key={Math.random()} — generates a new key every render, forces every item to unmount/remount',
      'Missing keys entirely — React warns and falls back to index-based matching',
      'Using the same key for different component types — React may reuse the wrong DOM node',
    ],
    followUp: {
      question: 'What triggers a re-render in React and how do you prevent unnecessary ones?',
      answer: `// A component re-renders when:
// 1. Its own state changes  (useState, useReducer)
// 2. Its parent re-renders  (even if props didn't change)
// 3. Its context value changes  (useContext)

// Prevent unnecessary re-renders:

// React.memo — skip re-render if props shallowly unchanged
const Child = React.memo(({ name }) => <div>{name}</div>);

// useMemo — skip expensive recomputation
const sorted = useMemo(() => [...items].sort(cmp), [items]);

// useCallback — stable function reference for memoized children
const handle = useCallback(() => doSomething(id), [id]);

// Key insight: React.memo compares props by reference.
// Inline objects/functions ({}, () => {}) are new references every render.
// Pair React.memo with useMemo/useCallback for it to have any effect.`
    }
  },
  {
    id: 39,
    explanation: 'The four Promise combinators each handle the "what if some fail?" question differently. all: fail-fast — one rejection stops everything (use when you need all results). allSettled: wait-for-all — always resolves, gives status of every promise (use for batch jobs where partial success matters). race: first-to-settle — both resolve and reject compete (use for timeouts). any: first-to-fulfill — rejections ignored unless all fail, then throws AggregateError (use for redundant sources).',
    solution: `// ── allSettled: all results, never throws ─────────────────────
const results = await Promise.allSettled([
  fetch('/api/users'),
  fetch('/api/posts'),
  Promise.reject(new Error('network error')),
]);

results.forEach(r => {
  if (r.status === 'fulfilled') console.log('OK:', r.value);
  else                          console.log('Fail:', r.reason.message);
});
// → OK: Response, OK: Response, Fail: network error

// ── race: timeout pattern ──────────────────────────────────────
function fetchWithTimeout(url, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timed out after ' + ms + 'ms')), ms)
  );
  return Promise.race([fetch(url), timeout]);
}

const data = await fetchWithTimeout('/api/slow', 5000);

// ── any: first successful mirror ──────────────────────────────
try {
  const response = await Promise.any([
    fetch('https://mirror1.cdn.com/data.json'),
    fetch('https://mirror2.cdn.com/data.json'),
    fetch('https://mirror3.cdn.com/data.json'),
  ]);
  const json = await response.json();
} catch (err) {
  // AggregateError — all three mirrors failed
  console.log('All failed:', err.errors); // err.errors = array of all reasons
}

// ── Comparison: same 3 promises ───────────────────────────────
const p1 = Promise.resolve('a');
const p2 = Promise.reject(new Error('b'));
const p3 = Promise.resolve('c');

await Promise.all([p1, p2, p3]);          // throws Error('b')
await Promise.allSettled([p1, p2, p3]);   // [{fulfilled,'a'},{rejected,Error},{fulfilled,'c'}]
await Promise.race([p1, p2, p3]);         // resolves 'a' (p1 already resolved)
await Promise.any([p1, p2, p3]);          // resolves 'a' (first fulfill)

// ── Implement allSettled from scratch ─────────────────────────
function promiseAllSettled(promises) {
  return Promise.all(
    promises.map(p =>
      Promise.resolve(p)
        .then(value  => ({ status: 'fulfilled', value }))
        .catch(reason => ({ status: 'rejected',  reason }))
    )
  );
}`,
    walkthrough: [
      'allSettled: wraps each promise in .then/.catch to convert it to a non-rejecting status object. The outer Promise.all always resolves since every input is now guaranteed to resolve.',
      'race timeout: the timeout promise rejects after N ms. Race returns the first to settle — if the fetch is slow, the timeout rejection wins.',
      'race important: BOTH resolve and reject compete. If you want "first success", use any — not race.',
      'any: skips rejections until all have failed. AggregateError.errors is an array of all rejection reasons in input order.',
      'Promises cannot be cancelled: losing promises in race/any continue running — their results are just ignored.',
      'promiseAllSettled implementation: map each to a .then/.catch that always resolves → outer Promise.all collects them all.',
    ],
    timeComplexity: 'O(n) waiting time scales with slowest (allSettled) or fastest (race/any) promise',
    spaceComplexity: 'O(n) for allSettled results array',
    commonMistakes: [
      'Using race when you want "first success" — race returns first settled including rejections; use any instead',
      'Expecting race/any to cancel losing promises — they don\'t; all continue running in the background',
      'Not handling AggregateError from any — if all promises reject, catch receives AggregateError with .errors array',
      'Using all when partial success is acceptable — use allSettled instead to get every result',
    ],
    followUp: {
      question: 'How do you run promises with a concurrency limit — at most N in parallel?',
      answer: `async function runWithConcurrency(tasks, limit) {
  const results  = [];
  const executing = new Set();

  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    executing.add(p);
    p.finally(() => executing.delete(p));

    if (executing.size >= limit) {
      await Promise.race(executing); // wait for one slot to open
    }
  }

  return Promise.all(results);
}

// Process 100 URLs, max 5 simultaneous:
const tasks = urls.map(url => () => fetch(url).then(r => r.json()));
const all   = await runWithConcurrency(tasks, 5);`
    }
  },
  {
    id: 40,
    explanation: 'Scroll event listeners fire hundreds of times per second, requiring debouncing and manual viewport math. IntersectionObserver is the browser-native solution: observe a sentinel element and get notified only when it enters or leaves the viewport — zero scroll listener overhead. A sentinel div at the bottom of the list, when visible, triggers the next page fetch. The cancelled flag prevents stale state updates on unmount. hasMore prevents fetching past the last page.',
    solution: `import { useState, useEffect, useRef, useCallback } from 'react';

// ── useInfiniteScroll hook ─────────────────────────────────────
function useInfiniteScroll(fetchFn, { limit = 10 } = {}) {
  const [items,   setItems]   = useState([]);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error,   setError]   = useState(null);

  // Fetch when page changes
  useEffect(() => {
    if (!hasMore) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const newItems = await fetchFn({ page, limit });
        if (!cancelled) {
          setItems(prev => [...prev, ...newItems]);
          setHasMore(newItems.length === limit); // fewer than limit = last page
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [page]);

  // Attach IntersectionObserver to the sentinel element
  const observerRef = useRef(null);

  const sentinelRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node || !hasMore || loading) return;

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(p => p + 1);
      }
    }, { threshold: 0 });

    observerRef.current.observe(node);
  }, [loading, hasMore]);

  return { items, loading, hasMore, error, sentinelRef };
}

// ── Usage ──────────────────────────────────────────────────────
async function fetchProducts({ page, limit }) {
  const res = await fetch('/api/products?page=' + page + '&limit=' + limit);
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
}

function ProductList() {
  const { items, loading, hasMore, error, sentinelRef } =
    useInfiniteScroll(fetchProducts, { limit: 10 });

  return (
    <div>
      {items.map(p => (
        <div key={p.id} style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <strong>{p.name}</strong> — \${p.price}
        </div>
      ))}

      {loading && <p style={{ textAlign: 'center' }}>Loading…</p>}
      {error   && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Invisible sentinel — observer fires when this enters viewport */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {!hasMore && !loading && <p style={{ textAlign: 'center' }}>All items loaded</p>}
    </div>
  );
}`,
    walkthrough: [
      'new IntersectionObserver(cb, { threshold: 0 }) — fires as soon as 1px of the sentinel is visible. threshold: 1.0 would require the full element to be visible.',
      'useCallback for sentinelRef — React calls this function when the sentinel div mounts (node = DOM element) or unmounts (node = null). Recreated when loading or hasMore changes.',
      'disconnect() before re-observing — when loading changes, the callback runs again. Disconnect the stale observer first to avoid duplicate triggers.',
      'Triple guard: entries[0].isIntersecting && hasMore && !loading — prevents double-fetching when the observer fires while a fetch is in progress.',
      'setHasMore(newItems.length === limit) — if the server returned fewer than 10 items, we\'ve reached the last page.',
      'cancelled flag — prevents setItems/setLoading from updating state after the component has unmounted (avoids memory leak warning).',
    ],
    timeComplexity: 'O(n) total where n = all items loaded across all pages',
    spaceComplexity: 'O(n) — all items accumulated in state; use react-window/react-virtual for 10,000+ items',
    commonMistakes: [
      'Using scroll event listener — fires hundreds of times per second, needs throttling, requires manual getBoundingClientRect math',
      'Not disconnecting the old observer before re-observing — stale closure fires with old loading/hasMore values',
      'Missing loading guard — user scrolling fast increments page multiple times before the first fetch completes',
      'Deriving hasMore from a total count — simpler and more reliable to check newItems.length < limit',
    ],
    followUp: {
      question: 'How do you add list virtualization for 10,000+ items without degrading performance?',
      answer: `// Problem: 10,000 DOM nodes freeze the browser.
// react-window renders only visible rows + a small overscan buffer.

import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>   {/* style = { top, height } for absolute positioning */}
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}           // visible viewport height
      itemCount={items.length}
      itemSize={60}          // fixed row height in px
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// Combine with infinite scroll:
// - useInfiniteScroll accumulates items in state
// - FixedSizeList renders only the ~10 visible rows at any scroll position
// - Result: instant scroll regardless of total item count`
    }
  },
];

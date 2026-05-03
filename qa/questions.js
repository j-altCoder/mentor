const QUESTIONS = [
  {
    id: 1,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Implement debounce(fn, delay)',
    description: 'Debouncing is a technique to limit how often a function fires. When a debounced function is called repeatedly (e.g., on every keypress), it only executes after the calls stop for a specified delay. Write a `debounce(fn, delay)` function that takes any function and a delay in milliseconds, and returns a debounced version of that function.',
    requirements: [
      'Returns a new function that delays invoking fn until after delay ms have passed since the last call',
      'If the returned function is called again before delay expires, restart the timer',
      'The debounced function must preserve the original `this` context',
      'All arguments passed to the debounced function must be forwarded to fn',
    ],
    example: {
      usage: `const search = debounce((query) => {
  console.log('Fetching:', query);
  fetch('/api/search?q=' + query);
}, 300);

// User types fast — only the last call fires after 300ms of silence:
search('h');       // timer starts
search('he');      // resets timer
search('hel');     // resets timer
search('hell');    // resets timer
search('hello');   // resets timer → fires after 300ms → logs 'Fetching: hello'`,
      explanation: 'The API is only called once (with "hello") instead of 5 times. Saves bandwidth and prevents race conditions on responses.'
    },
    hints: [
      'Use a closure to capture a `timerId` variable that persists between calls',
      'Call clearTimeout(timerId) at the start of the returned function before setting a new timeout',
      'Use fn.apply(this, args) — not fn(...args) — to preserve the caller\'s `this` context',
      'Capture args with rest parameter: return function(...args)',
    ],
    tags: ['closures', 'timers', 'higher-order-functions']
  },
  {
    id: 2,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Implement Promise.all() from scratch',
    description: 'Promise.all() takes an array of promises and returns a single Promise that resolves when ALL input promises resolve, or rejects immediately when ANY of them rejects. Implement your own version called `promiseAll(promises)` that behaves identically. The result array must preserve the ORDER of input promises regardless of completion order.',
    requirements: [
      'Returns a Promise that resolves with an array of all resolved values in input order',
      'Rejects immediately with the first rejection reason (fail-fast)',
      'Handles non-Promise values in the input array (treat as already-resolved)',
      'Resolves with an empty array if input is empty',
      'Does not cancel other pending promises on rejection (JS cannot cancel promises)',
    ],
    example: {
      usage: `promiseAll([
  fetch('/api/user'),
  fetch('/api/posts'),
  Promise.resolve(42)
]).then(([user, posts, num]) => {
  console.log(user, posts, num); // all three results in order
}).catch(err => {
  console.error('At least one failed:', err);
});`,
      explanation: 'All three run in parallel. If any fails, catch fires immediately. Otherwise then receives [user, posts, 42].'
    },
    hints: [
      'Create a results array of the same length and track a `completed` counter',
      'Use Promise.resolve(promise) to safely handle both Promise and non-Promise values',
      'Store results[index] = value — not results.push(value) — to preserve order',
      'Call resolve(results) when completed === promises.length',
    ],
    tags: ['promises', 'async', 'concurrency']
  },
  {
    id: 3,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'Write a useFetch custom React hook',
    description: 'Custom hooks extract reusable logic from components. Write a `useFetch(url)` hook that handles the entire data-fetching lifecycle: loading state, success data, and error state. It must also handle the stale response problem — if the URL changes while a request is in-flight, the old response must be discarded. This is one of the most common custom hooks asked in React interviews.',
    requirements: [
      'Returns { data, loading, error } — all three states must be tracked',
      'Sets loading: true whenever a new fetch starts (including on URL change)',
      'Clears error on new fetch, clears data only if needed',
      'Must handle race conditions: if URL changes mid-fetch, discard the old response',
      'Re-fetches automatically when url prop changes',
      'Handles non-2xx HTTP responses as errors (check res.ok)',
    ],
    example: {
      usage: `function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch('/api/users/' + userId);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <h1>{user.name}</h1>;
}

// When userId prop changes, hook automatically re-fetches new user.`,
      explanation: 'Component stays clean — no fetch logic, no state management, just renders what the hook provides.'
    },
    hints: [
      'Use three useState calls: data, loading, error',
      'Race condition fix: declare a `cancelled` boolean inside useEffect, set it to true in the cleanup function, only call setData if !cancelled',
      'The cleanup function (return () => {...}) in useEffect runs before the next effect and on unmount',
      'Add url to the dependency array so the effect re-runs on URL change',
      'You cannot make the useEffect callback itself async — define an inner async function and call it',
    ],
    tags: ['custom-hooks', 'useEffect', 'useState', 'fetch', 'race-conditions']
  },
  {
    id: 4,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Flatten a nested array (without Array.flat())',
    description: 'Write a `flatten(arr)` function that takes a deeply nested array and returns a single flat array. You cannot use the native Array.flat() or Array.flatMap() methods. The interviewer is testing your ability to think recursively and iteratively. Know at least two approaches: recursive (clean) and iterative with a stack (no call-stack risk for deeply nested arrays).',
    requirements: [
      'Handles arbitrary nesting depth (not just one level)',
      'Returns a new array — does not mutate the input',
      'Handles mixed arrays: [1, [2, [3, [4]], 5]] → [1, 2, 3, 4, 5]',
      'Handles empty arrays and non-array primitives correctly',
    ],
    example: {
      usage: `flatten([1, [2, [3, [4]], 5], 6]);
// → [1, 2, 3, 4, 5, 6]

flatten([]);
// → []

flatten([1, 2, 3]);
// → [1, 2, 3]

flatten([[['a']], [['b', ['c']]]]);
// → ['a', 'b', 'c']`,
      explanation: 'Recursively digs into every nested array until all items are primitives.'
    },
    hints: [
      'Recursive approach: loop through items, if item is an array recurse into it, else push to result',
      'Iterative approach: use a stack (start with [...arr]), pop each item, if array push its spread back onto stack, else push to result',
      'reduce() approach: arr.reduce((acc, item) => Array.isArray(item) ? acc.concat(flatten(item)) : [...acc, item], [])',
      'Array.isArray(item) is the correct check — not typeof item === "object" (that would catch null and objects)',
    ],
    tags: ['recursion', 'arrays', 'iteration']
  },
  {
    id: 5,
    category: 'Express',
    categoryColor: '#aaaaaa',
    categoryTextColor: '#1a1a1a',
    title: 'Write a complete Express CRUD API for a User resource',
    description: 'Build a complete RESTful Express.js API with all 5 CRUD operations for a User resource backed by MongoDB (using Mongoose). The API must follow REST conventions for routes, HTTP methods, and status codes. Include proper error handling, validation, and async/await throughout. This is asked in almost every backend/full-stack role to verify you can build a real feature end-to-end.',
    requirements: [
      'GET /api/users — list all users (with optional query param for search)',
      'GET /api/users/:id — get one user by ID (404 if not found)',
      'POST /api/users — create user (201 on success, 400 on validation error)',
      'PUT /api/users/:id — full update (200 on success, 404 if not found)',
      'DELETE /api/users/:id — delete (200 on success, 404 if not found)',
      'Use express.Router() — not app.get() on main app',
      'Use try/catch around all async operations and call next(err) on error',
      'Return consistent JSON: { data } on success, { error } on failure',
    ],
    example: {
      usage: `// Expected HTTP behavior:
POST /api/users          { name: "Alice", email: "alice@test.com" }
→ 201 { data: { _id: "...", name: "Alice", email: "alice@test.com" } }

GET /api/users/invalid-id
→ 404 { error: "User not found" }

DELETE /api/users/abc123
→ 200 { data: { message: "User deleted" } }`,
      explanation: 'Consistent response shape and correct HTTP status codes are what interviewers check — not just "does it work".'
    },
    hints: [
      'Create a separate router file: const router = express.Router(), then module.exports = router',
      'Mount it in app.js: app.use(\'/api/users\', userRouter)',
      'Use User.findByIdAndUpdate(id, update, { new: true }) — the { new: true } option returns the updated doc',
      'Check if result is null after findById/findByIdAndUpdate/findByIdAndDelete to send 404',
      'Pass errors to Express error handler with next(err) — never swallow errors silently',
    ],
    tags: ['rest-api', 'express', 'mongoose', 'crud', 'http-status-codes']
  },
  {
    id: 6,
    category: 'Express',
    categoryColor: '#aaaaaa',
    categoryTextColor: '#1a1a1a',
    title: 'Implement JWT auth middleware in Express',
    description: 'Write an Express middleware function called `authenticate` that protects routes by verifying a JWT access token. The token is expected in the Authorization header as a Bearer token. On success, attach the decoded payload to req.user and call next(). On failure, respond with the appropriate error. This is asked in virtually every MERN/Node interview.',
    requirements: [
      'Read token from Authorization header: "Bearer <token>"',
      'Return 401 if Authorization header is missing or not in Bearer format',
      'Return 401 with "Token expired" message if token is expired (TokenExpiredError)',
      'Return 401 with "Invalid token" message for any other jwt error',
      'On success: attach decoded payload to req.user and call next()',
      'Use process.env.JWT_SECRET — never hardcode the secret',
      'Be usable as middleware: app.get(\'/protected\', authenticate, handler)',
    ],
    example: {
      usage: `// Client sends:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Middleware decodes it → req.user = { sub: "userId123", role: "admin", iat: ..., exp: ... }

// Protected route:
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ user: req.user }); // req.user is available here
});

// Bonus: role-based guard using req.user:
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}`,
      explanation: 'authenticate runs first, populates req.user, then the route handler can trust req.user is valid.'
    },
    hints: [
      'Check: if (!auth || !auth.startsWith(\'Bearer \')) — note the space after Bearer',
      'Split to get token: const token = auth.split(\' \')[1]',
      'Wrap jwt.verify() in try/catch — it throws synchronously on failure',
      'Check err.name === \'TokenExpiredError\' for expired token — other errors are "invalid token"',
      'DO NOT call next() inside the catch block unless you want execution to continue after auth failure',
    ],
    tags: ['jwt', 'middleware', 'authentication', 'express', 'security']
  },
  {
    id: 7,
    category: 'MongoDB',
    categoryColor: '#13aa52',
    categoryTextColor: '#ffffff',
    title: 'MongoDB Aggregation: Top 5 Customers by Total Spend',
    description: 'Write a MongoDB aggregation pipeline that finds the top 5 customers by total amount spent across all completed orders. The `orders` collection has documents with fields: customerId (ObjectId ref to customers), totalAmount (Number), status (String). The `customers` collection has: _id, name, email. The pipeline must group, sort, limit, then join with the customers collection to include the name and email in the output.',
    requirements: [
      'Filter: only count orders with status "completed"',
      'Group by customerId, sum totalAmount, count orders',
      'Sort by totalSpend descending',
      'Limit to top 5',
      'Join with customers collection to get name and email ($lookup)',
      'Final output per document: { name, email, totalSpend, orderCount } — no _id clutter',
    ],
    example: {
      usage: `// orders collection sample:
{ customerId: ObjectId("c1"), totalAmount: 500, status: "completed" }
{ customerId: ObjectId("c1"), totalAmount: 300, status: "completed" }
{ customerId: ObjectId("c2"), totalAmount: 200, status: "cancelled" }

// Expected output:
[
  { name: "Alice", email: "alice@test.com", totalSpend: 800, orderCount: 2 },
  { name: "Bob",   email: "bob@test.com",   totalSpend: 150, orderCount: 1 },
  ...
]`,
      explanation: 'c2\'s cancelled order is excluded. c1\'s two orders are summed to 800.'
    },
    hints: [
      'Always put $match FIRST to reduce the number of documents flowing through the pipeline',
      '$group uses _id to specify the grouping key — { _id: "$customerId" }',
      '$sum: "$totalAmount" sums the field value, $sum: 1 counts documents',
      '$lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } — the result is an array',
      '$unwind: "$customer" flattens the one-element array into a single field',
      '$project with _id: 0 removes the _id from output',
    ],
    tags: ['aggregation', 'mongodb', '$group', '$lookup', '$match', 'pipeline']
  },
  {
    id: 8,
    category: 'Express',
    categoryColor: '#aaaaaa',
    categoryTextColor: '#1a1a1a',
    title: 'Implement a rate limiter middleware in Express',
    description: 'Build an in-memory rate limiting middleware factory function `rateLimit({ windowMs, max })` that limits how many requests a single IP can make within a time window. When the limit is exceeded, respond with 429 Too Many Requests. This tests whether you understand closures, Maps, and middleware factory patterns — a classic Node.js interview problem.',
    requirements: [
      'Takes options: windowMs (time window in ms) and max (max requests per window)',
      'Tracks request count per IP address',
      'Resets the counter for an IP after the window expires',
      'Returns 429 with { error: "Too many requests" } when limit exceeded',
      'Sets the Retry-After response header (seconds until reset)',
      'Each call to rateLimit() creates an independent limiter (different routes can have different limits)',
    ],
    example: {
      usage: `// Apply different limits to different routes:
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));
// max 5 login attempts per 15 minutes per IP

app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 100 }));
// max 100 requests per minute per IP for all other API routes

// On 6th login attempt within 15 min:
// → 429 { error: "Too many requests, try again later" }
// → Retry-After: 840 (seconds until window resets)`,
      explanation: 'The factory pattern lets you configure independent limiters per route. The Map holds per-IP state in a closure.'
    },
    hints: [
      'The outer function creates a new Map — each limiter has its own isolated request store',
      'Map key = IP address (req.ip), value = { count, resetTime }',
      'Check if (now > entry.resetTime) to reset the window for this IP',
      'Calculate Retry-After: Math.ceil((entry.resetTime - now) / 1000)',
      'res.set(\'Retry-After\', seconds) before returning 429',
      'Limitation: this is in-memory only — won\'t work across multiple Node processes (use Redis for production)',
    ],
    tags: ['rate-limiting', 'middleware', 'closures', 'maps', 'express']
  },
  {
    id: 9,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'Write useDebounce hook and a Search component using it',
    description: 'Build a `useDebounce(value, delay)` hook that returns a debounced version of any value — updates only after the user stops changing it for `delay` ms. Then build a `SearchBar` component that uses this hook to make a live search API call only after the user stops typing. This combines hooks composition, controlled inputs, and side effects — one of the most popular React interview questions.',
    requirements: [
      'useDebounce takes (value, delay) and returns the debounced value',
      'The debounced value only updates after value stops changing for delay ms',
      'Cleanup: cancel the pending timeout if value changes before delay expires',
      'SearchBar: controlled input, uses useDebounce on query state',
      'SearchBar: calls fetch only when debouncedQuery changes (not on every keystroke)',
      'SearchBar: shows loading/error states, renders result list',
      'Skip the API call if debouncedQuery is empty',
    ],
    example: {
      usage: `// useDebounce in isolation:
const debouncedSearch = useDebounce(inputValue, 300);
// debouncedSearch only updates 300ms after user stops typing

// SearchBar component usage:
<SearchBar />
// User types "react hooks" quickly
// → Only 1 API call made (after 300ms of silence)
// → Not 10 calls for each character typed`,
      explanation: 'useDebounce wraps the debounce logic so any component can reuse it without duplicating setTimeout/clearTimeout management.'
    },
    hints: [
      'useDebounce stores the debounced value in useState, and useEffect sets it after a setTimeout',
      'The useEffect cleanup (return () => clearTimeout(timer)) is what cancels the stale timeout',
      'In SearchBar, use two state vars: query (raw input) and results',
      'Put the fetch in a useEffect that depends on [debouncedQuery]',
      'Guard with: if (!debouncedQuery.trim()) return setResults([]); before fetching',
      'This is the hook version of Q1 (debounce function) — the pattern is the same but wrapped in React state',
    ],
    tags: ['custom-hooks', 'debounce', 'useEffect', 'useState', 'controlled-components']
  },
  {
    id: 10,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Implement retry logic for a failed async API call',
    description: 'Write a `fetchWithRetry(url, options, retryConfig)` function that wraps the native `fetch` API with automatic retry on failure. It should retry up to N times with exponential backoff (each retry waits longer than the last). Exponential backoff is critical in production systems to avoid hammering a struggling server. This tests your ability to combine async/await with loops and error handling.',
    requirements: [
      'Retries up to `retries` times (default 3) before throwing the error',
      'Waits `delay` ms before the first retry (default 1000ms)',
      'Each subsequent retry waits delay * backoff^attempt ms (exponential backoff)',
      'Treats non-2xx HTTP responses as errors (check res.ok)',
      'On the final attempt failure, throws the error — does not swallow it',
      'Returns the parsed JSON data on success',
    ],
    example: {
      usage: `const data = await fetchWithRetry(
  '/api/unreliable-endpoint',
  { method: 'GET' },
  { retries: 3, delay: 500, backoff: 2 }
);

// Retry timeline if all fail:
// Attempt 1 → fails immediately
// Wait 500ms
// Attempt 2 → fails
// Wait 1000ms  (500 * 2^1)
// Attempt 3 → fails
// Wait 2000ms  (500 * 2^2)
// Throws error: "HTTP 503" (all retries exhausted)`,
      explanation: 'Exponential backoff (500ms → 1s → 2s) reduces server load during recovery. Without it, retries can make an overloaded service worse.'
    },
    hints: [
      'Use a while loop: while (attempt < retries) — simpler than recursion for this case',
      'Track currentDelay separately from delay — multiply after each failure: currentDelay *= backoff',
      'await new Promise(resolve => setTimeout(resolve, currentDelay)) is how you sleep in async code',
      'Check res.ok after fetch — fetch only rejects on network failure, not HTTP error status codes',
      'Increment attempt and re-throw if (attempt >= retries) before the sleep to avoid sleeping after the last failure',
    ],
    tags: ['async-await', 'error-handling', 'retry', 'exponential-backoff', 'fetch']
  },
  {
    id: 11,
    category: 'Node.js',
    categoryColor: '#68a063',
    categoryTextColor: '#ffffff',
    title: 'Build an EventEmitter class (on, emit, off, once)',
    description: 'Node\'s built-in EventEmitter is the backbone of its async model. Implement your own EventEmitter class from scratch with four methods: on (subscribe), emit (trigger), off (unsubscribe), and once (subscribe for a single fire). This tests class syntax, closures, and the observer pattern — asked in almost every Node.js interview.',
    requirements: [
      'on(event, listener) — registers a listener, returns this (chainable)',
      'emit(event, ...args) — calls all listeners for the event with given args, returns true if any listeners exist',
      'off(event, listener) — removes a specific listener by reference',
      'once(event, listener) — listener fires once then automatically unsubscribes',
      'Multiple listeners per event must be supported',
      'Emitting an event with no listeners must not throw',
    ],
    example: {
      usage: `const emitter = new EventEmitter();

function onData(msg) { console.log('got:', msg); }

emitter.on('data', onData);
emitter.on('data', (msg) => console.log('also got:', msg));

emitter.emit('data', 'hello');   // both listeners fire
// → got: hello
// → also got: hello

emitter.off('data', onData);
emitter.emit('data', 'world');   // only second listener fires
// → also got: world

emitter.once('connect', () => console.log('connected!'));
emitter.emit('connect');  // → connected!
emitter.emit('connect');  // → (nothing, already unsubscribed)`,
      explanation: 'once() wraps the listener in a disposable wrapper that calls off() on itself after the first fire.'
    },
    hints: [
      'Use a Map where key = event name, value = array of listener functions',
      'on() pushes to the array; off() filters out the specific listener reference',
      'once() creates a wrapper function that calls the real listener then calls this.off(event, wrapper)',
      'Return this from on/off/once so calls can be chained: emitter.on(\'x\', f).on(\'y\', g)',
    ],
    tags: ['node', 'eventEmitter', 'observer-pattern', 'class']
  },
  {
    id: 12,
    category: 'Node.js',
    categoryColor: '#68a063',
    categoryTextColor: '#ffffff',
    title: 'Create an HTTP server without Express',
    description: 'Before Express abstracts everything away, Node\'s built-in http module is what actually handles requests. Write a basic HTTP server using http.createServer() that handles 3 routes: GET /users (return list), GET /users/:id (return one), POST /users (create). This tests whether you understand what Express actually does under the hood — a common interview deep-dive question.',
    requirements: [
      'Use only Node\'s built-in http and url modules — no Express or third-party packages',
      'GET /users → respond 200 with JSON array',
      'GET /users/:id → respond 200 with matching user or 404 JSON error',
      'POST /users → read request body, parse JSON, push to array, respond 201',
      'All responses must set Content-Type: application/json header',
      'Unknown routes respond with 404 JSON error',
    ],
    example: {
      usage: `// curl http://localhost:3000/users
// → [{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]

// curl http://localhost:3000/users/1
// → {"id":1,"name":"Alice"}

// curl http://localhost:3000/users/99
// → {"error":"Not found"}   (status 404)

// curl -X POST http://localhost:3000/users \\
//      -H "Content-Type: application/json" \\
//      -d '{"name":"Charlie"}'
// → {"id":3,"name":"Charlie"}   (status 201)`,
      explanation: 'Express is just a thin wrapper around this same http.createServer pattern.'
    },
    hints: [
      'req.method gives you "GET" or "POST"; use url.parse(req.url).pathname for the path',
      'Match /users/:id with a regex: pathname.match(/^\\/users\\/(\\d+)$/)',
      'For POST, buffer the body: req.on("data", chunk => body += chunk) then parse in req.on("end", ...)',
      'res.writeHead(status, headers) sets status + headers; res.end(JSON.stringify(data)) sends the body',
    ],
    tags: ['node', 'http', 'routing', 'no-framework']
  },
  {
    id: 13,
    category: 'Node.js',
    categoryColor: '#68a063',
    categoryTextColor: '#ffffff',
    title: 'Process a large file using Node.js Streams',
    description: 'Loading a large file (logs, CSV exports, database dumps) entirely into memory crashes the process. Node\'s Stream API lets you process data chunk by chunk. Show two approaches: (1) readline + createReadStream to process a CSV line by line, and (2) a Transform stream with pipe() to modify data as it flows. This question is a strong differentiator between junior and mid-level Node developers.',
    requirements: [
      'Read a large file without loading it fully into memory (streaming)',
      'Process each line of a CSV: skip the header, accumulate a numeric column',
      'Return total count and sum when done — use async/await with for-await-of',
      'Also implement a Transform stream that converts text to uppercase',
      'Pipe: createReadStream → Transform → createWriteStream',
      'Handle the "finish" event to know when piping is complete',
    ],
    example: {
      usage: `// Approach 1: readline (line-by-line CSV processing)
const result = await processCSV('sales.csv');
// → { lines: 50000, totalSales: 2847293.50 }
// Memory used: ~constant, regardless of file size

// Approach 2: Transform stream + pipe
fs.createReadStream('input.txt')
  .pipe(upperCaseTransform())
  .pipe(fs.createWriteStream('output.txt'))
  .on('finish', () => console.log('Done'));
// Processes in chunks — never holds full file in memory`,
      explanation: 'Streaming processes data in chunks (default 64KB). A 10GB file uses the same memory as a 1KB file.'
    },
    hints: [
      'readline.createInterface({ input: fs.createReadStream(file) }) gives you an async iterable of lines',
      'for await (const line of rl) iterates lines without callbacks',
      'Transform stream: extend Transform, implement _transform(chunk, encoding, callback), call callback(null, transformedChunk)',
      'pipe() returns the destination stream, so you can chain: readable.pipe(transform).pipe(writable)',
      'The "finish" event fires on the writable stream (last in the pipe chain) when all data is flushed',
    ],
    tags: ['node', 'streams', 'readline', 'transform', 'memory-efficiency']
  },
  {
    id: 14,
    category: 'MySQL',
    categoryColor: '#00618a',
    categoryTextColor: '#ffffff',
    title: 'SQL JOINs: write a multi-table query with INNER and LEFT JOIN',
    description: 'JOINs are the most tested SQL topic. Write queries that join 3 tables: orders, users, and products. Show the difference between INNER JOIN (only matching rows) and LEFT JOIN (all rows from left table, NULLs for unmatched). Include GROUP BY, HAVING, and aggregate functions. This is asked in every MERN/full-stack interview that involves a relational database.',
    requirements: [
      'INNER JOIN orders + users + products to get order summary with names',
      'LEFT JOIN to include orders even if user/product was deleted (show NULL safely with COALESCE)',
      'GROUP BY user to calculate total_spent per customer',
      'HAVING to filter customers who spent more than a threshold',
      'Include ORDER BY and a date filter for last 30 days',
      'Explain: what INNER vs LEFT vs RIGHT JOIN returns',
    ],
    example: {
      usage: `-- Tables:
-- orders:   id, user_id, product_id, quantity, created_at
-- users:    id, name, email
-- products: id, name, price

-- Expected output (INNER JOIN):
-- order_id | customer | product    | qty | total
-- 101      | Alice    | Keyboard   | 2   | 3998
-- 102      | Bob      | Monitor    | 1   | 15000

-- Expected output (LEFT JOIN + GROUP BY):
-- customer     | total_spent
-- Alice        | 48000
-- Deleted User | 12000   ← user was deleted but order still exists`,
      explanation: 'INNER JOIN: only orders where BOTH the user AND product still exist. LEFT JOIN: all orders, even orphaned ones.'
    },
    hints: [
      'INNER JOIN syntax: FROM orders o INNER JOIN users u ON o.user_id = u.id',
      'LEFT JOIN keeps all rows from the left (orders) even with no match in users — unmatched columns are NULL',
      'COALESCE(u.name, "Deleted User") replaces NULL with a fallback value',
      'GROUP BY u.id, u.name (not just u.name — two users could share a name)',
      'HAVING filters after GROUP BY — unlike WHERE which filters before grouping',
      'DATE_SUB(NOW(), INTERVAL 30 DAY) gives you the date 30 days ago',
    ],
    tags: ['mysql', 'sql', 'joins', 'group-by', 'aggregate-functions']
  },
  {
    id: 15,
    category: 'MySQL',
    categoryColor: '#00618a',
    categoryTextColor: '#ffffff',
    title: 'SQL: Find the Nth highest salary',
    description: 'The single most commonly asked SQL interview question in Indian tech companies. Know all three approaches: subquery (works everywhere), LIMIT/OFFSET (clean and simple), and DENSE_RANK() window function (the correct modern answer). Interviewers specifically ask about DENSE_RANK vs RANK vs ROW_NUMBER — know the difference.',
    requirements: [
      'Write a query to find the 2nd highest salary using a subquery',
      'Write the same using LIMIT + OFFSET (generalizes to any N)',
      'Write using DENSE_RANK() window function (MySQL 8+) — the best approach',
      'Explain the difference between DENSE_RANK, RANK, and ROW_NUMBER',
      'Handle the edge case: what if N is greater than the total number of distinct salaries?',
      'Handle ties: multiple employees with the same salary',
    ],
    example: {
      usage: `-- employees table: id, name, salary
-- Data: 90000, 85000, 85000, 70000, 60000

-- 2nd highest salary = 85000 (not 85000 again — use DISTINCT)

-- DENSE_RANK output for this data:
-- salary | rank
-- 90000  | 1
-- 85000  | 2  ← rnk = 2, both rows with 85000 get same rank
-- 70000  | 3
-- 60000  | 4

-- RANK would give: 1, 2, 2, 4 (gap after ties)
-- ROW_NUMBER would give: 1, 2, 3, 4 (no ties, arbitrary order for equal values)`,
      explanation: 'Use DENSE_RANK for Nth highest — it handles ties correctly and has no gaps in rank numbers.'
    },
    hints: [
      'Subquery: WHERE salary < (SELECT MAX(salary) FROM employees) gives 2nd highest — but only works for 2nd',
      'LIMIT + OFFSET: SELECT DISTINCT salary ORDER BY salary DESC LIMIT 1 OFFSET N-1 — cleaner',
      'DENSE_RANK: wrap in a subquery, filter WHERE rnk = N — handles all edge cases',
      'DISTINCT matters: without it, two employees with 90000 count as two rows',
      'Window functions (OVER clause) are available in MySQL 8+. Always mention version compatibility.',
    ],
    tags: ['mysql', 'sql', 'window-functions', 'dense_rank', 'subquery']
  },
  {
    id: 16,
    category: 'MySQL',
    categoryColor: '#00618a',
    categoryTextColor: '#ffffff',
    title: 'MySQL transactions with mysql2 and connection pooling',
    description: 'A transaction groups multiple SQL statements into one atomic unit — either ALL succeed or ALL are rolled back. Write a Node.js function that transfers money between two accounts using a transaction. It must lock rows to prevent race conditions, roll back on any error, and always release the connection back to the pool. This is asked for any role involving financial data or multi-step writes.',
    requirements: [
      'Use mysql2/promise for async/await (not callbacks)',
      'Create a connection pool (not a single connection) — explain why',
      'Get a connection from the pool: pool.getConnection()',
      'Use conn.beginTransaction(), conn.commit(), conn.rollback()',
      'Lock the source row with SELECT ... FOR UPDATE to prevent race conditions',
      'Always call conn.release() in a finally block — even if an error occurs',
      'Throw the error after rollback so the caller knows the transfer failed',
    ],
    example: {
      usage: `// Transfer $500 from account 1 to account 2:
await transfer(1, 2, 500);

// If account 1 has $200 (insufficient):
// → beginTransaction
// → SELECT balance ... FOR UPDATE (locks row)
// → balance < amount → throw Error('Insufficient balance')
// → rollback() ← no rows changed
// → release() ← connection returned to pool
// → caller receives Error('Insufficient balance')`,
      explanation: 'If the debit succeeds but the credit throws (e.g. account 2 deleted), rollback() undoes the debit. Without transactions, you would lose money.'
    },
    hints: [
      'mysql2/promise: import with require("mysql2/promise"), not require("mysql2")',
      'Connection pool vs single connection: pool reuses connections across requests, handles concurrency automatically',
      'FOR UPDATE locks the selected rows until commit/rollback — prevents two concurrent transfers from reading the same balance',
      'try { await conn.commit() } catch { await conn.rollback(); throw err } finally { conn.release() }',
      'pool.getConnection() returns a connection object; conn.execute() runs parameterized queries',
    ],
    tags: ['mysql', 'node', 'transactions', 'connection-pool', 'mysql2', 'atomicity']
  },
  {
    id: 17,
    category: 'MySQL',
    categoryColor: '#00618a',
    categoryTextColor: '#ffffff',
    title: 'SQL: Find duplicate records and delete keeping the latest',
    description: 'A two-part SQL problem: (1) write a query to identify rows with duplicate values in a column, and (2) delete the duplicates while keeping the row with the highest ID (most recent). Both parts are asked frequently — they test GROUP BY + HAVING for finding, and self-join or ROW_NUMBER() for deleting. Know both the self-join DELETE (works in all MySQL versions) and the window function approach (MySQL 8+).',
    requirements: [
      'Find all duplicate emails: SELECT email, COUNT(*) GROUP BY email HAVING COUNT(*) > 1',
      'Delete duplicates keeping highest id using self-JOIN (works in MySQL 5.7+)',
      'Delete duplicates using ROW_NUMBER() (MySQL 8+ — cleaner and more flexible)',
      'Explain why DELETE FROM ... WHERE id NOT IN (SELECT ... FROM same_table) fails in MySQL',
      'Test your DELETE logic with a SELECT first before running DELETE',
    ],
    example: {
      usage: `-- users table:
-- id | email             | created_at
-- 1  | alice@test.com    | 2024-01-01
-- 2  | bob@test.com      | 2024-01-02
-- 3  | alice@test.com    | 2024-01-10   ← duplicate, newer
-- 4  | alice@test.com    | 2024-01-15   ← duplicate, newest

-- After DELETE (keep id=4, remove id=1 and id=3):
-- id | email             | created_at
-- 2  | bob@test.com      | 2024-01-02
-- 4  | alice@test.com    | 2024-01-15`,
      explanation: 'Self-join DELETE: join the table to itself on matching email where left.id < right.id — delete the one with the lower id.'
    },
    hints: [
      'Find duplicates: GROUP BY email HAVING COUNT(*) > 1',
      'Self-join DELETE: DELETE u1 FROM users u1 INNER JOIN users u2 ON u1.email = u2.email AND u1.id < u2.id',
      'Why u1.id < u2.id? For each duplicate pair, this condition is true for the older (smaller id) row — so it gets deleted',
      'ROW_NUMBER() approach: PARTITION BY email ORDER BY id DESC — rn=1 is the one to keep, delete where rn > 1',
      'MySQL prevents DELETE from a table in a subquery that SELECTs from the same table — wrap in a derived table (subquery alias) to work around it',
    ],
    tags: ['mysql', 'sql', 'duplicates', 'self-join', 'row_number', 'delete']
  },
  {
    id: 18,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Implement throttle(fn, limit)',
    description: 'Throttle is debounce\'s sibling — both limit how often a function fires, but differently. Throttle guarantees the function fires at most once per time window, no matter how many times it\'s called. Debounce resets the timer on every call (fires after silence). Implement throttle(fn, limit) — interviewers always ask you to compare and contrast the two.',
    requirements: [
      'Returns a function that calls fn at most once per limit milliseconds',
      'The first call fires immediately (not delayed)',
      'Subsequent calls within the window are silently dropped',
      'After the window expires, the next call fires immediately again',
      'Must preserve this context and all arguments',
    ],
    example: {
      usage: `const onScroll = throttle(() => console.log('scroll!'), 200);

// User scrolls rapidly — fires every 200ms at most:
window.addEventListener('scroll', onScroll);
// t=0ms:   scroll → fires  ('scroll!')
// t=50ms:  scroll → dropped
// t=100ms: scroll → dropped
// t=200ms: scroll → fires  ('scroll!')
// t=210ms: scroll → dropped

// vs debounce: would only fire 200ms AFTER scrolling STOPS`,
      explanation: 'Use throttle for continuous events where you want regular updates (scroll, resize, mousemove). Use debounce for events where you want to wait for the user to stop (search input, form autosave).'
    },
    hints: [
      'Track the last call time with a variable: let lastCall = 0',
      'On each call: const now = Date.now(); if (now - lastCall >= limit) — fire and update lastCall',
      'No setTimeout needed for the basic version — just a timestamp comparison',
      'This is the "leading edge" throttle. You can also implement "trailing edge" (fires at end of window) using setTimeout.',
      'Compare with debounce: debounce uses clearTimeout + setTimeout (resets on every call). Throttle just checks elapsed time.',
    ],
    tags: ['closures', 'timers', 'throttle', 'higher-order-functions', 'performance']
  },
  {
    id: 19,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Deep clone an object without JSON.parse/stringify',
    description: 'JSON.parse(JSON.stringify(obj)) is the common shortcut for deep cloning, but it has critical limitations: it drops functions and undefined, converts Date to string, and breaks on circular references. Write a proper deepClone function that handles: nested objects, arrays, Date objects, null, primitives, and circular references via a visited Map.',
    requirements: [
      'Returns a completely independent copy — mutations on the clone do not affect the original',
      'Handles nested objects and arrays recursively',
      'Preserves Date objects as real Date instances (not strings)',
      'Returns primitives (string, number, boolean, null, undefined) as-is',
      'Handles circular references without infinite recursion — use a visited Map',
      'Does NOT need to handle: functions, Map, Set, WeakMap, Symbol (mention these limitations)',
    ],
    example: {
      usage: `const original = {
  name: 'Alice',
  scores: [95, 87, 92],
  meta: { createdAt: new Date('2024-01-01'), active: true },
};

const clone = deepClone(original);
clone.scores.push(100);
clone.meta.createdAt.setFullYear(2099);

console.log(original.scores);           // [95, 87, 92]  ← unchanged
console.log(original.meta.createdAt);   // 2024-01-01    ← unchanged
console.log(clone.meta.createdAt instanceof Date); // true (not a string)`,
      explanation: 'JSON.parse/stringify would turn the Date into a string and lose the reference independence would still hold — but Date becomes a string.'
    },
    hints: [
      'Base cases first: if obj is null or not an object (typeof !== "object"), return it directly',
      'Check for Date: if (obj instanceof Date) return new Date(obj.getTime())',
      'Check for Array: if (Array.isArray(obj)) — clone each element recursively',
      'Circular reference: pass a visited Map, check if (visited.has(obj)) return visited.get(obj), then set visited.set(obj, clone) BEFORE recursing into properties',
      'Use Object.keys(obj) to iterate — avoids prototype chain properties',
    ],
    tags: ['recursion', 'objects', 'deep-clone', 'circular-references', 'date']
  },
  {
    id: 20,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'useReducer for shopping cart state management',
    description: 'useReducer is the right tool when state transitions are complex: when next state depends on the previous state in multiple ways, when several actions modify the same state, or when you have 3+ related useState calls. Build a shopping cart reducer that handles adding, removing, updating quantity, and clearing. Interviewers ask this to test whether you know when to reach for useReducer vs useState.',
    requirements: [
      'cartReducer(state, action) handles 4 action types: ADD_ITEM, REMOVE_ITEM, UPDATE_QTY, CLEAR',
      'ADD_ITEM: if item already in cart, increment qty; otherwise push with qty: 1',
      'REMOVE_ITEM: filter out the item by id',
      'UPDATE_QTY: set new qty; if qty becomes 0 or less, remove the item',
      'CLEAR: empty the cart',
      'State is always immutable — return new objects/arrays, never mutate',
      'Show a Cart component using useReducer and computing derived state (total)',
    ],
    example: {
      usage: `dispatch({ type: 'ADD_ITEM', payload: { id: 1, name: 'Keyboard', price: 999 } });
// cart: [{ id:1, name:'Keyboard', price:999, qty:1 }]

dispatch({ type: 'ADD_ITEM', payload: { id: 1, name: 'Keyboard', price: 999 } });
// cart: [{ id:1, name:'Keyboard', price:999, qty:2 }]  ← qty incremented, not duplicated

dispatch({ type: 'UPDATE_QTY', payload: { id: 1, qty: 0 } });
// cart: []  ← qty 0 removes the item

dispatch({ type: 'ADD_ITEM', payload: { id: 2, name: 'Mouse', price: 499 } });
dispatch({ type: 'CLEAR' });
// cart: []`,
      explanation: 'Total is derived: cart.items.reduce((sum, i) => sum + i.price * i.qty, 0) — never stored in state.'
    },
    hints: [
      'ADD_ITEM: find existing item first with state.items.find(i => i.id === action.payload.id)',
      'Immutable update for increment: state.items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)',
      'UPDATE_QTY: .map() to set new qty then .filter(i => i.qty > 0) to auto-remove zero-qty items in one chain',
      'Always return { ...state, items: newItems } — spread state in case you add more fields later',
      'When to use useReducer vs useState: useReducer when next state depends on previous in complex ways, or when 3+ state variables are always updated together',
    ],
    tags: ['react', 'useReducer', 'immutability', 'state-management', 'shopping-cart']
  },
  {
    id: 21,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Implement curry(fn)',
    description: 'Currying transforms a function that takes multiple arguments into a chain of functions each taking a single argument. curry(fn) returns a curried version that accumulates arguments until it has received as many as fn expects (fn.length), then executes fn. This enables partial application — creating specialized functions from general ones. A classic advanced JavaScript interview question.',
    requirements: [
      'curry(fn) returns a curried wrapper around fn',
      'The curried function can be called one argument at a time: curry(add)(1)(2)(3)',
      'Or all at once: curry(add)(1, 2, 3) — full application',
      'Or in groups: curry(add)(1, 2)(3) — partial application',
      'Uses fn.length to determine when enough arguments have been collected',
      'Returns another collecting function if args are insufficient; calls fn when args are sufficient',
    ],
    example: {
      usage: `const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);

curriedAdd(1)(2)(3)   // → 6
curriedAdd(1, 2)(3)   // → 6
curriedAdd(1)(2, 3)   // → 6
curriedAdd(1, 2, 3)   // → 6

// Partial application — pre-fill arguments:
const add10 = curriedAdd(10);
const add10and20 = curriedAdd(10)(20);
console.log(add10(5));      // → 15
console.log(add10and20(5)); // → 35`,
      explanation: 'add10 is a reusable function with 10 already locked in. curry enables point-free style and partial application without calling bind().'
    },
    hints: [
      'The returned curried function checks: if args.length >= fn.length, call fn; otherwise return another collecting function',
      'Spread to accumulate: [...previousArgs, ...newArgs] — never mutate the args array',
      'fn.length is the number of declared parameters — does not count default params or rest params',
      'Use recursion: curried calls itself with the merged args, not a separate wrapper',
    ],
    tags: ['closures', 'currying', 'partial-application', 'functional-programming']
  },
  {
    id: 22,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Implement memoize(fn)',
    description: 'Memoization caches the result of a function call keyed by its arguments. If the same arguments are passed again, the cached result is returned without re-running fn. Write a memoize(fn) factory that works for any function. Know the cache key strategy and trade-offs: it trades memory for speed, and is only safe for pure functions (same input always produces same output).',
    requirements: [
      'Returns a memoized version of fn',
      'Calling with the same arguments returns the cached result without calling fn',
      'fn is called exactly once per unique argument combination',
      'Cache is per memoized function — not shared globally',
      'Works for functions with multiple arguments',
      'Expose a .clear() method on the returned function for cache invalidation',
    ],
    example: {
      usage: `let callCount = 0;
const expensiveAdd = (a, b) => { callCount++; return a + b; };
const memoAdd = memoize(expensiveAdd);

console.log(memoAdd(1, 2));  // → 3  (fn called, callCount = 1)
console.log(memoAdd(1, 2));  // → 3  (cache hit, callCount still 1)
console.log(memoAdd(2, 3));  // → 5  (fn called, callCount = 2)
console.log(memoAdd(1, 2));  // → 3  (cache hit, callCount still 2)
console.log(callCount);      // → 2`,
      explanation: 'fn is only called twice total — once per unique argument pair. The third call for (1,2) hits the cache.'
    },
    hints: [
      'Use a Map to store results: key → cached value',
      'The cache key must encode ALL arguments — JSON.stringify(args) is the simplest approach',
      'args is always an array (rest params), so JSON.stringify([1, 2]) → \'[1,2]\' — consistent key',
      'Limitation: JSON.stringify cannot handle functions, undefined, or circular references as args',
      'memoized.clear = () => cache.clear() exposes cache invalidation for testing or stale data',
    ],
    tags: ['closures', 'memoization', 'caching', 'higher-order-functions', 'performance']
  },
  {
    id: 23,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'Build an AuthContext with useContext and Context API',
    description: 'React Context solves prop drilling — passing state through many component layers without threading props through every intermediate component. Build an AuthContext that holds the logged-in user and provides login/logout to any component in the tree. Context + useState is the lightweight alternative to Redux for auth state and is asked in nearly every React interview.',
    requirements: [
      'Create AuthContext with createContext()',
      'AuthProvider component owns user state and provides { user, login, logout }',
      'useAuth() custom hook wraps useContext(AuthContext) and throws a descriptive error if used outside Provider',
      'login(userData) sets user in state',
      'logout() sets user to null',
      'Show a Navbar and Dashboard component using useAuth — no props passed down',
    ],
    example: {
      usage: `// Wrap the app once:
<AuthProvider>
  <App />
</AuthProvider>

// Any nested component — no props needed:
function Navbar() {
  const { user, logout } = useAuth();
  return user
    ? <button onClick={logout}>Logout ({user.name})</button>
    : <span>Not logged in</span>;
}

function Dashboard() {
  const { user } = useAuth();
  if (!user) return <p>Please log in</p>;
  return <h1>Welcome, {user.name}</h1>;
}`,
      explanation: 'Both Navbar and Dashboard read from the same AuthContext — no state hoisting or prop threading needed.'
    },
    hints: [
      'createContext(null) — null default is intentional; the useAuth null check turns a silent bug into a clear error',
      'Provider syntax: <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>',
      'useContext(AuthContext) subscribes the component — re-renders automatically when context value changes',
      'if (!ctx) throw new Error(\'useAuth must be used inside <AuthProvider>\') — catches missing Provider immediately',
      'Passing a new object as value every render re-renders all consumers — wrap in useMemo if needed',
    ],
    tags: ['react', 'context', 'useContext', 'auth', 'prop-drilling']
  },
  {
    id: 24,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'useMemo and useCallback — when to use and when not to',
    description: 'useMemo caches the result of a computation between renders. useCallback caches a function reference. Both prevent unnecessary work — but both have a real cost (memory, dep comparison) and are wrong when overused. Know the rule: useCallback is only useful when the receiving component is wrapped in React.memo, otherwise the re-render happens anyway. This is a common React optimization question.',
    requirements: [
      'useMemo(() => computation, deps) — returns cached value, only recomputes when deps change',
      'useCallback(fn, deps) — returns cached function reference, equivalent to useMemo(() => fn, deps)',
      'React.memo(Component) — skips re-render if props are shallowly equal',
      'Show a filtered product list using useMemo — only re-filters when products or search changes',
      'Show a child component wrapped in React.memo receiving a useCallback handler',
      'Explain: useCallback without React.memo on the child is useless',
    ],
    example: {
      usage: `// Without useMemo: re-filters every render, including on unrelated state changes
const filtered = products.filter(p => p.name.includes(search));

// With useMemo: only re-filters when products or search changes
const filtered = useMemo(
  () => products.filter(p => p.name.includes(search)),
  [products, search]
);

// Without useCallback: new function every render → React.memo on child is useless
const handleClick = () => addToCart(id);

// With useCallback: same function reference → React.memo works
const handleClick = useCallback(() => addToCart(id), [id]);`,
      explanation: 'cartCount updating re-renders the parent. Without useMemo+useCallback, every ProductCard re-renders on every cart update even when the product list hasn\'t changed.'
    },
    hints: [
      'React.memo does a shallow prop comparison — reference equality for objects and functions',
      'useCallback(fn, []) — empty deps means same function reference forever (safe when fn uses no external values)',
      'useMemo and useCallback add overhead — only use when you can measure a real performance problem',
      'Deps array rules are identical to useEffect — missing a dep causes stale closures',
      'Don\'t memoize cheap computations — the comparison overhead can cost more than recomputing',
    ],
    tags: ['react', 'useMemo', 'useCallback', 'performance', 'React.memo']
  },
  {
    id: 25,
    category: 'Express',
    categoryColor: '#aaaaaa',
    categoryTextColor: '#1a1a1a',
    title: 'Build Express global error handling middleware',
    description: 'In Express, a global error handler — middleware with exactly 4 parameters (err, req, res, next) — catches all errors passed via next(err) in one central place. Without it, unhandled errors crash the server or hang the request forever. This is fundamental Express architecture: route handlers throw or call next(err), the error handler decides the response. Asked in every backend interview.',
    requirements: [
      'Define a 4-parameter middleware: (err, req, res, next) — Express identifies this by arity',
      'Create a custom HttpError class that carries an HTTP status code',
      'Handle Mongoose CastError (invalid ObjectId) → 400',
      'Handle Mongoose ValidationError → 400 with all field messages',
      'Handle HttpError → use its status code',
      'Handle unexpected errors → 500, never expose stack trace in production',
      'Register it LAST, after all routes',
    ],
    example: {
      usage: `// Route handler — throw, never respond directly on error:
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ data: user });
  } catch (err) {
    next(err);  // delegate to global error handler
  }
});

// Client receives:
// → 404 { error: 'User not found' }     (HttpError)
// → 400 { error: 'Invalid ID format' }  (CastError from bad ObjectId)
// → 500 { error: 'Internal server error' }  (unexpected)`,
      explanation: 'Routes only throw — the error handler owns the response logic. Status codes and message formats are consistent across the entire API.'
    },
    hints: [
      'EXACTLY 4 params — Express uses arity to distinguish error handlers from regular middleware',
      'app.use(errorHandler) must come AFTER all app.use(router) calls',
      'err.name === \'CastError\' catches invalid MongoDB ObjectId (e.g. /users/not-valid)',
      'Mongoose ValidationError has an errors object — map its values to messages',
      'process.env.NODE_ENV === \'production\' — never send stack traces in production responses',
    ],
    tags: ['express', 'error-handling', 'middleware', 'http-status-codes', 'mongoose']
  },
  {
    id: 26,
    category: 'MongoDB',
    categoryColor: '#13aa52',
    categoryTextColor: '#ffffff',
    title: 'Mongoose schema — validators, virtuals, and pre-save hooks',
    description: 'A Mongoose schema is far more than a type map. It supports built-in and custom validators (run before save), virtual fields (computed properties not stored in MongoDB), and middleware hooks (pre-save, pre-find). These three features are asked together in full-stack interviews to test whether you know Mongoose beyond basic CRUD. The password hashing pre-hook is asked especially often.',
    requirements: [
      'Define a User schema with firstName, lastName, email, password, role',
      'Built-in validation: required, minlength, match regex for email, enum for role',
      'Custom validator for password strength (must contain uppercase + digit)',
      'Virtual: fullName (firstName + lastName) — not stored in MongoDB',
      'Pre-save hook: hash password with bcrypt, but only when password was modified',
      'Instance method: comparePassword(candidate) → returns Promise<boolean>',
      'Add { timestamps: true } and { toJSON: { virtuals: true } } to schema options',
    ],
    example: {
      usage: `const user = new User({
  firstName: 'Alice', lastName: 'Smith',
  email: 'alice@test.com', password: 'Secret123'
});

console.log(user.fullName);  // → 'Alice Smith' (virtual, not in DB)

await user.save();  // pre-save hook hashes 'Secret123' before writing

const match = await user.comparePassword('Secret123');  // → true
const wrong = await user.comparePassword('wrongpass');  // → false

// Updating name does NOT re-hash password:
user.firstName = 'Alicia';
await user.save();  // pre-save sees isModified('password') === false → skips bcrypt`,
      explanation: 'The isModified check prevents double-hashing: updating any other field triggers save, but the hook skips bcrypt if password was not changed in this operation.'
    },
    hints: [
      'Use regular function (not arrow) in pre hooks and methods — arrow functions don\'t bind this',
      'if (!this.isModified(\'password\')) return next() — the most important line in the pre-save hook',
      'schema.virtual(\'fullName\').get(function() { return this.firstName + \' \' + this.lastName; })',
      'toJSON: { virtuals: true } — without this, virtuals disappear from res.json() responses',
      'schema.methods.comparePassword = async function(candidate) { return bcrypt.compare(candidate, this.password); }',
    ],
    tags: ['mongoose', 'mongodb', 'schema', 'bcrypt', 'virtuals', 'pre-hooks']
  },
  {
    id: 27,
    category: 'MongoDB',
    categoryColor: '#13aa52',
    categoryTextColor: '#ffffff',
    title: 'MongoDB indexing — compound indexes, explain(), and covered queries',
    description: 'Without indexes, MongoDB does a full collection scan for every query — O(n) reads regardless of result size. Indexes make queries O(log n). But wrong indexes waste RAM and slow writes. Know: single vs compound indexes, the ESR rule (Equality, Sort, Range) for ordering compound index fields, how to read explain() output, and what a covered query is. Asked in mid-to-senior MongoDB interviews.',
    requirements: [
      'Create single and compound indexes in Mongoose schema and MongoDB shell',
      'Explain the ESR rule: Equality fields first, Sort fields second, Range fields last',
      'Use explain(\'executionStats\') — identify COLLSCAN (bad) vs IXSCAN (good)',
      'Check totalDocsExamined vs nReturned — they should be close to equal',
      'Explain what a covered query is and create one',
      'Know index trade-offs: indexes speed reads but slow writes and use RAM',
    ],
    example: {
      usage: `// Query: active users, sorted newest first, aged 25–40
db.users.find({ status: 'active', age: { $gte: 25, $lte: 40 } })
        .sort({ createdAt: -1 })

// Wrong index order — range before sort forces in-memory sort:
{ age: 1, status: 1, createdAt: 1 }

// Correct ESR order — Equality → Sort → Range:
{ status: 1, createdAt: -1, age: 1 }
//  E──────   S──────────── R─────

// explain() output:
// winningPlan.stage: 'IXSCAN'           ← index used (good)
// totalDocsExamined: 12, nReturned: 12  ← 1:1 ratio (good)`,
      explanation: 'ESR: equality fields narrow the index scan to one partition; sort fields are already sorted in the index; range fields go last because they can\'t maintain sort order across a range.'
    },
    hints: [
      'createIndex({ field: 1 }) — 1 = ascending, -1 = descending; direction matters for sort queries',
      'explain(\'executionStats\') — winningPlan.stage shows which index was chosen and why',
      'Covered query: all fields in the projection exist in the index — MongoDB reads index only, never touches documents',
      'Low-cardinality fields (boolean, 2-value enum) rarely benefit from indexes — a full scan can be faster',
      'Index every field used in .find(), .sort(), or join ($lookup) conditions in frequently-run queries',
    ],
    tags: ['mongodb', 'indexes', 'compound-index', 'explain', 'performance', 'ESR']
  },
  {
    id: 28,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Implement pipe() and compose()',
    description: 'pipe() and compose() take a list of functions and return a new function that passes each function\'s output as the next function\'s input. pipe() runs left-to-right (natural reading order); compose() runs right-to-left (mathematical notation). They are the foundation of functional programming, used in Redux middleware, data pipelines, and utility libraries like lodash/fp. Implement both using Array.reduce.',
    requirements: [
      'pipe(f, g, h) returns x => h(g(f(x))) — left-to-right application',
      'compose(f, g, h) returns x => f(g(h(x))) — right-to-left application',
      'Both handle any number of functions (variadic with rest params)',
      'pipe() and compose() with zero functions return the identity function (x => x)',
      'Implement using Array.reduce / Array.reduceRight — not a manual loop',
      'Each function in the chain must be unary (single argument)',
    ],
    example: {
      usage: `const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

const transform = pipe(double, addOne, square);
transform(3);
// → double(3)=6 → addOne(6)=7 → square(7)=49

const transform2 = compose(square, addOne, double);
transform2(3);
// → same result: square(addOne(double(3))) = 49

// Real use case: string pipeline
const slugify = pipe(
  str => str.trim(),
  str => str.toLowerCase(),
  str => str.replace(/\s+/g, '-')
);
slugify('  Hello World  '); // → 'hello-world'`,
      explanation: 'pipe(f,g,h)(x) === h(g(f(x))). The value flows left to right through each function. compose reverses the order.'
    },
    hints: [
      'pipe: return x => fns.reduce((acc, fn) => fn(acc), x) — acc starts as x, each step applies the next fn',
      'compose: same pattern with fns.reduceRight instead of reduce',
      'Edge case: if fns.length === 0, return x => x (identity function)',
      'Each function must return a value — if any fn returns undefined, the next fn receives undefined',
      'pipe is preferred in most codebases — it reads in execution order, left to right',
    ],
    tags: ['functional-programming', 'pipe', 'compose', 'higher-order-functions', 'reduce']
  },
  {
    id: 29,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'Code splitting with React.lazy() and Suspense',
    description: 'By default, webpack bundles the entire app into one JS file — large bundles slow initial load. React.lazy() + Suspense splits the bundle by route or component; each chunk downloads only when first rendered. This is essential for production React apps. Know: what Suspense renders during load, how ErrorBoundary handles chunk load failures, and when NOT to lazy-load (small components, always-needed on initial render).',
    requirements: [
      'Use React.lazy(() => import(\'./Page\')) to lazily import a component',
      'Wrap in <Suspense fallback={<Spinner />}> to show a fallback during loading',
      'Implement route-based code splitting: each route is a separate lazy chunk',
      'Add a class-based ErrorBoundary to handle chunk load failures (network errors)',
      'Show how to preload a chunk before navigation (trigger import() on hover)',
      'Know: React.lazy only works with default exports',
    ],
    example: {
      usage: `// Without lazy: AdminPanel bundled into main JS — all users pay for admin code
import AdminPanel from './AdminPanel';

// With lazy: AdminPanel chunk downloads only when user navigates to /admin
const AdminPanel = React.lazy(() => import('./AdminPanel'));

// Wrap in Suspense — renders Spinner while chunk downloads, then swaps in AdminPanel:
<Suspense fallback={<Spinner />}>
  <AdminPanel />
</Suspense>

// Preload on hover — chunk starts downloading before user clicks:
<Link to="/admin" onMouseEnter={() => import('./AdminPanel')}>
  Admin
</Link>`,
      explanation: 'Regular users never download AdminPanel. The chunk only fetches when the route is visited — or when hover triggers the preload.'
    },
    hints: [
      'React.lazy wraps a dynamic import() — the import runs only when the component first renders',
      'Suspense catches the Promise that lazy throws internally — renders fallback until it resolves',
      'Multiple lazy components under one Suspense show one fallback while ANY of them load',
      'ErrorBoundary must be a class component — componentDidCatch / getDerivedStateFromError (no hook equivalent)',
      'React.lazy requires default export: export default function Page() {} — named exports need a wrapper',
    ],
    tags: ['react', 'lazy', 'suspense', 'code-splitting', 'performance', 'error-boundary']
  },
  {
    id: 30,
    category: 'Express',
    categoryColor: '#aaaaaa',
    categoryTextColor: '#1a1a1a',
    title: 'Write a request validation middleware factory',
    description: 'req.body is untrusted user input — validate it before any business logic runs. Write a validate(schema) middleware factory (no Joi, no Yup) where schema is a plain object describing expected fields with their rules. It must collect ALL validation errors in one pass and return them together. This tests middleware factory patterns, error aggregation, and how to make reusable, composable middleware.',
    requirements: [
      'validate(schema) returns an Express middleware function',
      'schema shape: { fieldName: { type, required, minLength, maxLength, pattern, min, max } }',
      'Validates req.body against every field in the schema',
      'Collects ALL validation errors (not just the first) before responding',
      'Returns 400 { errors: [...messages] } if any rule fails',
      'Calls next() if validation passes — no response sent',
      'Composable: app.post(\'/users\', validate(userSchema), createUserHandler)',
    ],
    example: {
      usage: `const userSchema = {
  name:     { type: 'string', required: true, minLength: 2, maxLength: 50 },
  email:    { type: 'string', required: true, pattern: /^\\S+@\\S+\\.\\S+$/ },
  age:      { type: 'number', required: false, min: 0, max: 120 },
  password: { type: 'string', required: true, minLength: 8 },
};

// POST /api/users { name: 'A', password: 'abc' }
// → 400 {
//     errors: [
//       'name must be at least 2 characters',
//       'email is required',
//       'password must be at least 8 characters'
//     ]
//   }`,
      explanation: 'All three errors are returned in one response. The client fixes everything at once instead of in three separate round-trips.'
    },
    hints: [
      'Collect errors into an array — push messages for every failing rule, return early only after checking all fields',
      'isEmpty check: value === undefined || value === null || value === \'\' — catches missing and empty string',
      'continue after required failure — skip minLength/pattern checks on a field that\'s not even there',
      'typeof value !== rules.type — simple type check for \'string\', \'number\', \'boolean\'',
      'rules.pattern.test(value) — pattern should be a RegExp; .test() returns true if it matches',
    ],
    tags: ['express', 'middleware', 'validation', 'factory-pattern', 'error-handling']
  },
  {
    id: 31,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'call(), apply(), and bind() — explicit this binding',
    description: 'Every JavaScript function has three methods that explicitly set the `this` context. call() and apply() invoke the function immediately; bind() returns a new permanently-bound function. Understanding these is required to explain React class method binding, method borrowing, and how to implement bind() from scratch. Asked in every JS interview that touches `this`.',
    requirements: [
      'call(thisArg, arg1, arg2) — invoke immediately, args listed individually',
      'apply(thisArg, [arg1, arg2]) — invoke immediately, args as array',
      'bind(thisArg, arg1) — returns a NEW function with this permanently set, does not invoke',
      'Demonstrate method borrowing: calling one object\'s method on another object',
      'Show the classic React class pitfall: passing a method as callback loses this',
      'Implement bind() from scratch using call/apply',
      'Explain: call/apply/bind have NO effect on arrow functions (arrow functions capture this lexically)',
    ],
    example: {
      usage: `const user = { name: 'Alice' };
function greet(greeting, punct) {
  return greeting + ', ' + this.name + punct;
}

greet.call(user, 'Hello', '!');      // → 'Hello, Alice!'
greet.apply(user, ['Hello', '!']);   // → 'Hello, Alice!'

const greetAlice = greet.bind(user, 'Hello');
greetAlice('!');  // → 'Hello, Alice!'
greetAlice('?');  // → 'Hello, Alice?'  (pre-filled arg stays)

// Method borrowing:
const arrayLike = { 0: 'a', 1: 'b', length: 2 };
Array.prototype.slice.call(arrayLike); // → ['a', 'b']`,
      explanation: 'call and apply differ only in how args are passed. bind is for later — it returns a function, not a result. Arrow functions ignore all three.'
    },
    hints: [
      'Mnemonic: A for apply = A for array — apply takes args as an array',
      'bind does NOT call the function — it returns a new one. Common mistake: expecting it to run immediately.',
      'Arrow functions have no own this — they inherit from the enclosing scope. bind(user) on an arrow function does nothing.',
      'Implement bind: use a closure to capture thisArg and partialArgs, then apply them with fn.apply(thisArg, [...partialArgs, ...args])',
    ],
    tags: ['this', 'call', 'apply', 'bind', 'context', 'javascript']
  },
  {
    id: 32,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Event loop — microtasks vs macrotasks',
    description: 'JavaScript is single-threaded but non-blocking because of the event loop. It processes tasks in a strict priority order: synchronous code first, then microtasks (Promise callbacks), then one macrotask (setTimeout, I/O), then microtasks again, and so on. Getting this order wrong in an interview is a red flag. This question is asked in virtually every senior JavaScript and Node.js interview.',
    requirements: [
      'Explain the call stack, microtask queue, and macrotask (task) queue',
      'Synchronous code always runs before any callbacks',
      'Microtasks: Promise.then, queueMicrotask, MutationObserver — drain ALL before next macrotask',
      'Macrotasks: setTimeout, setInterval, setImmediate, I/O — one per event loop tick',
      'async/await: code after await is a microtask',
      'Node.js only: process.nextTick runs before Promise microtasks',
      'Predict the output order of the classic mixed-async code snippet',
    ],
    example: {
      usage: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');

// Output: A, D, C, B
// Sync (A, D) → microtask (C) → macrotask (B)

// Nested microtask — still before macrotask:
Promise.resolve().then(() => {
  console.log('E');
  Promise.resolve().then(() => console.log('F')); // queued during drain — still microtask
});
setTimeout(() => console.log('G'), 0);
// Output: E, F, G`,
      explanation: 'After the call stack empties, ALL microtasks drain (including ones queued during draining) before the next macrotask runs.'
    },
    hints: [
      'setTimeout(fn, 0) does NOT mean "run immediately" — it goes to the macrotask queue, always after Promises',
      'await suspends the function — code after await is scheduled as a microtask when the awaited value resolves',
      'Two setTimeouts fire in order (FIFO), but both fire after all microtasks clear',
      'Node.js: process.nextTick > Promise.then > setImmediate > setTimeout (roughly)',
    ],
    tags: ['event-loop', 'microtasks', 'macrotasks', 'promises', 'async', 'javascript']
  },
  {
    id: 33,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Prototypal inheritance and Object.create()',
    description: 'JavaScript uses prototypal inheritance — not classical inheritance. Every object has a hidden [[Prototype]] link. Property lookups walk the chain until found or null is reached. ES6 class syntax is pure sugar over this same mechanism. Interviewers ask this to test whether you understand what class/extends actually compile to, how instanceof works, and why mutating Object.prototype is catastrophic.',
    requirements: [
      'Explain the prototype chain: object → prototype → Object.prototype → null',
      'Object.create(proto) — create object with proto as its [[Prototype]]',
      'Constructor functions: new F() sets instance.__proto__ = F.prototype',
      'class/extends: show what it compiles to with constructor functions',
      'instanceof: traverses the prototype chain, checks if Constructor.prototype appears',
      'hasOwnProperty: checks only the object itself, not the chain',
    ],
    example: {
      usage: `const animal = { breathes: true, describe() { return 'I am ' + this.name; } };
const dog = Object.create(animal);
dog.name = 'Rex';

console.log(dog.breathes);   // true  — from animal via chain
console.log(dog.describe()); // 'I am Rex'  — this = dog
console.log(dog.hasOwnProperty('breathes')); // false
console.log(Object.getPrototypeOf(dog) === animal); // true

class Vehicle { describe() { return 'Vehicle'; } }
class Car extends Vehicle { describe() { return super.describe() + ' + Car'; } }
const c = new Car();
console.log(c instanceof Car);      // true
console.log(c instanceof Vehicle);  // true — Vehicle.prototype is in the chain`,
      explanation: 'class/extends wires Car.prototype.__proto__ = Vehicle.prototype. instanceof walks this chain. Object.create does the same thing manually.'
    },
    hints: [
      'Use Object.getPrototypeOf(obj) not obj.__proto__ — __proto__ is non-standard (though widely supported)',
      'new F(): creates {}, sets __proto__ = F.prototype, runs F with this = {}, returns the object',
      'Methods on F.prototype are SHARED across all instances — not copied. Own properties (from constructor) are per-instance.',
      'Object.create(null) creates an object with NO prototype — use as a safe dictionary with no inherited keys',
    ],
    tags: ['prototype', 'inheritance', 'Object.create', 'class', 'instanceof']
  },
  {
    id: 34,
    category: 'Express',
    categoryColor: '#aaaaaa',
    categoryTextColor: '#1a1a1a',
    title: 'Configure CORS in Express',
    description: 'CORS (Cross-Origin Resource Sharing) is a browser security mechanism that blocks requests from a different origin (protocol + domain + port). In a MERN app, the React dev server (localhost:3000) and Express API (localhost:5000) are different origins — every request is blocked by default. Know how to configure CORS correctly, what a preflight request is, why wildcard (*) breaks with credentials, and the security implications.',
    requirements: [
      'Explain same-origin policy and why browsers enforce it',
      'Use the cors npm package to add CORS headers globally',
      'Whitelist specific origins — not * in production',
      'credentials: true requires explicit origin (not *) — for cookies and Authorization headers',
      'Handle preflight: browser sends OPTIONS before PUT/DELETE/custom headers — must respond 200',
      'app.options(\'*\', cors()) to handle all preflight routes',
    ],
    example: {
      usage: `// Browser blocks this without CORS:
// React (localhost:3000) → fetch('http://localhost:5000/api/users')
// ↳ Error: No 'Access-Control-Allow-Origin' header present

// After CORS config:
// Response includes: Access-Control-Allow-Origin: http://localhost:3000
// Browser allows the response to be read by JavaScript

// Preflight (for PUT/DELETE or custom headers):
// Browser first sends: OPTIONS /api/users
// Server must respond: 200 + Access-Control-Allow-Methods, Allow-Headers
// Then browser sends the real request`,
      explanation: 'Simple requests (GET/POST with standard headers) send directly. "Complex" requests (PUT, DELETE, Authorization header) trigger a preflight OPTIONS check first.'
    },
    hints: [
      'cors() with no options → Access-Control-Allow-Origin: * (fine for dev, never for auth routes)',
      'credentials: true + origin: * is invalid — browser rejects this combination',
      'app.use(cors()) must come BEFORE route definitions — middleware order matters',
      'Preflight check: browser sends OPTIONS, expects 200 with allow headers before sending the real request',
    ],
    tags: ['cors', 'express', 'security', 'http-headers', 'preflight']
  },
  {
    id: 35,
    category: 'MongoDB',
    categoryColor: '#13aa52',
    categoryTextColor: '#ffffff',
    title: 'Mongoose populate() — cross-collection references',
    description: 'MongoDB has no native JOINs. Mongoose\'s populate() fills in referenced documents using ObjectId fields — it makes a second query and stitches results together. Know how to define refs in schemas, select specific fields, populate nested references, and understand the embed-vs-reference trade-off. This is asked in every full-stack interview that involves Mongoose.',
    requirements: [
      'Define two schemas with a ref relationship (Post → User)',
      'Basic populate: replace ObjectId with the full User document',
      'Field selection: .populate(\'author\', \'name email\') — exclude password',
      'Multiple fields: chain multiple .populate() calls',
      'Nested populate: populate comments, then each comment\'s author',
      'Explain the embed vs reference decision and the N+1 trade-off',
    ],
    example: {
      usage: `// Without populate:
Post.findById(id)
// → { title: 'Hello', author: ObjectId('abc123'), comments: [ObjectId('x'), ...] }

// With populate:
Post.findById(id).populate('author', 'name email')
// → { title: 'Hello', author: { _id: 'abc123', name: 'Alice', email: '...' } }

// Nested populate (comments + comment authors):
Post.findById(id).populate({
  path: 'comments',
  populate: { path: 'author', select: 'name' }
})
// → comments[0].author = { _id, name }`,
      explanation: 'populate() runs a second query behind the scenes. For an array of refs, Mongoose batches all IDs into one $in query — not one query per item.'
    },
    hints: [
      'Schema field needs ref: \'ModelName\' — tells populate() which model to query',
      '.populate(\'field\', \'name email -_id\') — space-separated fields; - prefix excludes',
      'Mongoose batches array refs with $in — 10 posts with different authors = 2 queries, not 11',
      'Embed when always read together, small, and owned by one parent. Reference when large, shared, or independently updated.',
    ],
    tags: ['mongoose', 'populate', 'references', 'ObjectId', 'mongodb']
  },
  {
    id: 36,
    category: 'Node.js',
    categoryColor: '#68a063',
    categoryTextColor: '#ffffff',
    title: 'Real-time communication with Socket.io',
    description: 'HTTP is request-response — the client always initiates. WebSockets give a persistent full-duplex channel so the server can push events to clients instantly. Socket.io builds on WebSockets with rooms, reconnection, and fallbacks. Real-time features — live order updates, notifications, chat — are core to e-commerce and asked at product companies. Know: emit, broadcast, rooms, and how to target specific users.',
    requirements: [
      'Set up a Socket.io server on top of Express\'s http.createServer()',
      'Client connects and emits an identify event; server joins them to a personal room',
      'Server emits an event to a specific user: io.to(\'user:\' + userId).emit(...)',
      'Broadcast to all clients: io.emit()',
      'Broadcast to all except sender: socket.broadcast.emit()',
      'Handle disconnect: clean up the user from the online map',
      'Show the React client hook: connect on mount, disconnect on unmount',
    ],
    example: {
      usage: `// Server pushes order update directly to one user:
io.to('user:' + userId).emit('orderUpdate', { orderId: 123, status: 'shipped' });

// Client reacts instantly — no polling:
socket.on('orderUpdate', ({ orderId, status }) => {
  showToast('Order ' + orderId + ' is now ' + status);
});

// Rooms — target groups:
socket.join('order:' + orderId);         // join order-specific room
io.to('order:' + orderId).emit('update', payload);  // notify all watchers`,
      explanation: 'Rooms are named groups. Personal rooms (user:userId) let you target one user across devices. Order rooms let you notify everyone watching that order.'
    },
    hints: [
      'Socket.io wraps the http server, not the Express app: const server = http.createServer(app); new Server(server)',
      'io.to(room).emit() — send to all in room. socket.to(room).emit() — send to all in room EXCEPT this socket.',
      'CORS must be configured on Socket.io separately from Express cors middleware',
      'Track socketId → userId in a Map for disconnect cleanup; use Redis for multi-process scaling',
    ],
    tags: ['websockets', 'socket.io', 'real-time', 'rooms', 'node']
  },
  {
    id: 37,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'useRef and forwardRef',
    description: 'useRef has two jobs: (1) hold a mutable value that survives re-renders without causing them — perfect for timer IDs, previous values, and abort controllers; (2) access a DOM element directly for focus, scroll, or media control. forwardRef lets a parent pass a ref through a component to an inner DOM element. useImperativeHandle exposes a custom API on the ref instead of the raw DOM node.',
    requirements: [
      'useRef to focus an input on mount via useEffect',
      'useRef to store a timer ID — why useState would cause unnecessary re-renders here',
      'usePrevious hook: track the previous value of a prop or state',
      'forwardRef: allow a parent to control focus on a child\'s internal input',
      'useImperativeHandle: expose a custom { focus, clear, getValue } API on the ref',
      'Explain: mutating ref.current does NOT trigger a re-render',
    ],
    example: {
      usage: `// Focus on mount:
const ref = useRef(null);
useEffect(() => { ref.current.focus(); }, []);
return <input ref={ref} />;

// Parent controlling a wrapped component's input:
const FancyInput = forwardRef((props, ref) => (
  <div className="fancy"><input ref={ref} /></div>
));

// In parent:
const inputRef = useRef(null);
<FancyInput ref={inputRef} />
<button onClick={() => inputRef.current.focus()}>Focus</button>`,
      explanation: 'ref.current points directly to the DOM node. forwardRef passes the parent\'s ref through to the inner element. useImperativeHandle replaces the DOM node with a custom object.'
    },
    hints: [
      'useRef(initialValue) returns the same { current } object every render — mutating it never re-renders',
      'ref prop on a DOM element: React sets ref.current = DOM node after mount, null on unmount',
      'Timer IDs in useRef: clearInterval works across renders because the ref object persists',
      'useImperativeHandle must be used with forwardRef — it replaces what the parent sees on ref.current',
    ],
    tags: ['useRef', 'forwardRef', 'useImperativeHandle', 'DOM', 'react']
  },
  {
    id: 38,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'React reconciliation and why key={index} is dangerous',
    description: 'React\'s reconciliation algorithm (the "diffing" algorithm) compares old and new virtual DOM trees to compute the minimum DOM changes needed. Keys identify which list items have moved, been added, or removed between renders. Using key={index} is a common anti-pattern: deleting from the start or reordering causes React to match items incorrectly, corrupting controlled input state and wasting re-renders.',
    requirements: [
      'Explain virtual DOM: a JS object tree that React diffs against itself to find minimal DOM changes',
      'Three diffing rules: different element type → remount; same type → update props; lists → use keys',
      'Show the key={index} bug: delete the first item — the remaining items get wrong DOM nodes',
      'Show the fix: use stable unique IDs as keys',
      'Show using key to force a component to fully remount (intentional reset trick)',
      'Two cases where key={index} is acceptable',
    ],
    example: {
      usage: `// BUG: key={index} — delete first item → second item gets first's DOM node
// If inputs had typed values, they shift incorrectly
{items.map((item, i) => <li key={i}><input defaultValue={item.name} /></li>)}

// FIX: stable IDs — React tracks each item independently of position
{items.map(item => <li key={item.id}><input defaultValue={item.name} /></li>)}

// Intentional remount trick — force reset when userId changes:
<ProfileForm key={userId} />
// Changing key → React treats it as a new component → all state resets`,
      explanation: 'With index keys, removing Alice gives Bob key=0 (Alice\'s old key). React reuses Alice\'s DOM node for Bob — if the input had a typed value, Bob\'s input shows Alice\'s text.'
    },
    hints: [
      'key is not a prop — it is only used by React\'s reconciliation algorithm, not passed to the component',
      'key={index} is fine ONLY when the list never reorders and items are never deleted from non-tail positions',
      'key={Math.random()} — creates a new key every render → every item remounts every render (terrible)',
      'Changing a component\'s key intentionally forces a full remount — cleaner than calling a reset() method',
    ],
    tags: ['reconciliation', 'virtual-dom', 'keys', 'diffing', 'react']
  },
  {
    id: 39,
    category: 'JavaScript',
    categoryColor: '#f7df1e',
    categoryTextColor: '#1a1a1a',
    title: 'Promise.allSettled, Promise.race, and Promise.any',
    description: 'You know Promise.all — but three other combinators are asked equally often and map to distinct real-world patterns. Promise.allSettled waits for ALL and never rejects (batch operations). Promise.race resolves/rejects with the FIRST to settle — use for timeouts. Promise.any resolves with the FIRST to fulfill — use for redundant sources. Know when to use each and implement allSettled from scratch.',
    requirements: [
      'allSettled: always resolves with { status, value } or { status, reason } for every input',
      'race: first to settle (resolve OR reject) wins — use for request timeout pattern',
      'any: first to FULFILL wins; only rejects (AggregateError) if ALL promises reject',
      'Implement the timeout pattern using race',
      'Implement the redundant-fetch pattern using any',
      'Implement promiseAllSettled from scratch',
      'Explain: Promise.all vs allSettled — when to choose each',
    ],
    example: {
      usage: `// allSettled — get every result, never throw:
const results = await Promise.allSettled([fetch('/a'), fetch('/b'), Promise.reject('x')]);
// → [{status:'fulfilled', value:...}, {status:'fulfilled', value:...}, {status:'rejected', reason:'x'}]

// race — timeout pattern:
await Promise.race([
  fetch('/api/data'),
  new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 5000))
]);

// any — use first successful mirror:
await Promise.any([fetch('https://mirror1/data'), fetch('https://mirror2/data')]);`,
      explanation: 'Use allSettled for batch jobs (want all results). Use race for deadlines. Use any for redundancy (fastest mirror wins).'
    },
    hints: [
      'allSettled never rejects — wrap each promise in .then(value=>({status:\'fulfilled\',value})).catch(reason=>({status:\'rejected\',reason}))',
      'race: BOTH resolve and reject compete — not just resolve. First settled wins.',
      'any: ignores rejections until ALL fail. AggregateError has an .errors array with all rejection reasons.',
      'Promise.all short-circuits on first rejection. allSettled waits for every promise to settle.',
    ],
    tags: ['promises', 'allSettled', 'race', 'any', 'async', 'javascript']
  },
  {
    id: 40,
    category: 'React',
    categoryColor: '#61dafb',
    categoryTextColor: '#1a1a1a',
    title: 'Infinite scroll with Intersection Observer',
    description: 'Infinite scroll is mandatory for e-commerce interviews. The scroll event fires hundreds of times per second — the Intersection Observer API is the correct, performant alternative: it fires only when a sentinel element enters the viewport. Build a useInfiniteScroll hook with page tracking, loading/error states, and end-of-data detection. The hook is reusable for any paginated resource.',
    requirements: [
      'Place a sentinel div at the bottom of the list',
      'Use IntersectionObserver to detect when the sentinel enters the viewport',
      'On intersection: increment page, which triggers a useEffect fetch',
      'Track: items (accumulated), loading, hasMore, error',
      'hasMore = false when fetch returns fewer items than the page limit',
      'Guard: do not increment page when loading or !hasMore',
      'Clean up: observer.disconnect() on unmount',
    ],
    example: {
      usage: `function ProductList() {
  const { items, loading, hasMore, sentinelRef } =
    useInfiniteScroll(fetchProducts, { limit: 10 });

  return (
    <div>
      {items.map(p => <ProductCard key={p.id} product={p} />)}
      {loading && <Spinner />}
      <div ref={sentinelRef} />
      {!hasMore && <p>All products loaded</p>}
    </div>
  );
}`,
      explanation: 'sentinelRef attaches the IntersectionObserver to the invisible div at the bottom. When it scrolls into view the observer fires, page increments, and the next batch fetches.'
    },
    hints: [
      'new IntersectionObserver(callback, { threshold: 0 }) — fires as soon as 1px of sentinel is visible',
      'Use useCallback for the sentinelRef — called by React when the element mounts/unmounts',
      'Disconnect the old observer before creating a new one when loading/hasMore changes',
      'if (entries[0].isIntersecting && hasMore && !loading) setPage(p => p + 1) — triple guard',
      'hasMore = newItems.length === limit — fewer items than limit means last page',
    ],
    tags: ['infinite-scroll', 'intersection-observer', 'pagination', 'react', 'performance']
  },
];

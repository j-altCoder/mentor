// ─────────────────────────────────────────────────────────────────
//  LESSON: Backend Libraries & Framework Usage
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_BACKEND_LIBS = {
  category: "Language & Framework Fundamentals",
  tag: "Backend Libraries & Frameworks",
  title: "The Packages Behind Every Node API",
  intro: "Sprint planning. The tech lead asks you to build a secure REST API from scratch. You open a blank index.js. Raj pulls up a chair.",
  scenes: [

    // ── Express fundamentals ──
    {
      speaker: "raj",
      text: `"Before you install anything — what does Express actually give you that plain Node's http module doesn't?"`
    },
    {
      speaker: "you",
      text: `"Routing? And it's easier to set up a server?"`
    },
    {
      speaker: "raj",
      text: `"Right — but let's be specific. Node's built-in http module gives you one function that receives every request. You'd have to manually parse the URL, check the method, read the body, set headers on every response — all string manipulation. Express gives you <em>routing</em> — match requests by method and path. <em>Middleware</em> — a composable chain of functions between request and response. <em>Request parsing</em> — body, query params, route params already extracted. And a clean <em>response API</em> — res.json(), res.status(), res.send(). That's it. Express is deliberately thin. Everything else you add yourself through middleware."`
    },
    {
      type: "code",
      text: `// Plain Node http — you handle everything manually
const http = require('http');
http.createServer((req, res) => {
  if (req.url === '/users' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users: [] }));
  }
  // every route, every method, every header — manual
}).listen(3000);

// Express — clean routing and response API
const express = require('express');
const app = express();
app.use(express.json()); // parse JSON bodies automatically

app.get('/users', (req, res) => {
  res.json({ users: [] }); // sets Content-Type, status 200 automatically
});

app.post('/users', (req, res) => {
  const { name, email } = req.body; // body already parsed
  res.status(201).json({ id: 1, name, email });
});

app.listen(3000);`
    },

    // ── Middleware deep dive ──
    {
      speaker: "you",
      text: `"I use middleware but I'm not confident explaining how it actually works internally."`
    },
    {
      speaker: "raj",
      text: `"Middleware is just a function with three parameters: <em>req, res, next</em>. Express keeps an ordered list of middleware functions. When a request comes in, it runs them one by one. Each middleware can do three things: modify req or res and call next() to pass control to the next middleware, send a response and end the chain, or call next(err) to jump to the error handler. The order you register middleware matters — app.use() calls above a route run for all routes. app.use() calls after a route run only if that route calls next() without sending a response."`
    },
    {
      type: "analogy",
      text: "Middleware = an airport security line. Every passenger (request) passes through the same checkpoints in order — check-in, baggage drop, security scan, gate check. Any checkpoint can send you back (reject request) or stamp your boarding pass (modify req) and wave you through (call next). Skip one checkpoint and the chain breaks."
    },
    {
      type: "code",
      text: `// Middleware anatomy — req, res, next
const logMiddleware = (req, res, next) => {
  console.log(req.method, req.path);   // do something with the request
  next();                               // pass to next middleware
};

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' }); // end chain
  req.user = jwt.verify(token, SECRET); // attach data to req
  next();                               // pass to route handler
};

// Error-handling middleware — FOUR params (err, req, res, next)
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
};

// ORDER MATTERS
app.use(express.json());      // 1. parse body — runs for ALL routes
app.use(logMiddleware);        // 2. log — runs for ALL routes

app.get('/public', handler);   // no auth needed

app.use(authMiddleware);       // 3. auth — runs only for routes BELOW this line

app.get('/private', handler);  // protected — auth runs first
app.delete('/admin', requireRole('admin'), handler); // route-level middleware

app.use(errorHandler);         // must be LAST — catches errors from all above`
    },

    // ── Error handling in Express ──
    {
      speaker: "you",
      text: `"What's the right way to handle errors in Express? I've seen people use try/catch everywhere, some use a wrapper function..."`
    },
    {
      speaker: "raj",
      text: `"The problem with async route handlers is that Express doesn't catch thrown errors from async functions automatically — in Express 4. You have to either wrap everything in try/catch and call next(err), or use a wrapper utility. Express 5 — currently in release candidate — handles async errors natively. Until then, the cleanest pattern is an <em>asyncHandler wrapper</em> that wraps your async route function and automatically forwards any rejection to next(). Define it once, use it everywhere, keep your route handlers clean."`
    },
    {
      type: "code",
      text: `// The problem — Express 4 doesn't catch async errors
app.get('/users', async (req, res) => {
  const users = await User.find(); // if this throws, Express never catches it
  res.json(users);                 // unhandled promise rejection ❌
});

// Fix 1 — try/catch everywhere (verbose)
app.get('/users', async (req, res, next) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err); // forward to error handler
  }
});

// Fix 2 — asyncHandler wrapper (clean, define once)
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find(); // any throw goes to error handler automatically
  res.json(users);
}));

// Centralised error handler — catches everything
app.use((err, req, res, next) => {
  const status  = err.status  || 500;
  const message = err.message || 'Internal server error';
  if (status === 500) console.error(err.stack); // log server errors only
  res.status(status).json({ error: message });
});

// Custom error class — attach status code to errors
class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
// Usage: throw new AppError('User not found', 404);`
    },

    // ── helmet ──
    {
      speaker: "you",
      text: `"What does helmet do? I add it to every project but I couldn't explain what it actually changes."`
    },
    {
      speaker: "raj",
      text: `"<em>helmet</em> sets HTTP response headers that protect against well-known browser-based attacks. By default a Node/Express app sends no security headers — browsers make no assumptions about what you allow. Helmet sets about 15 headers in one app.use() call. The most important ones: <em>Content-Security-Policy</em> tells the browser which sources it's allowed to load scripts, styles, and images from — the main defence against XSS. <em>X-Frame-Options</em> prevents your page being embedded in an iframe on another site — blocks clickjacking. <em>Strict-Transport-Security</em> tells browsers to always use HTTPS even if someone links to the HTTP version. <em>X-Content-Type-Options</em> stops browsers guessing the content type — prevents MIME-type sniffing attacks."`
    },
    {
      speaker: "you",
      text: `"Can I configure individual headers instead of using the defaults?"`
    },
    {
      speaker: "raj",
      text: `"Yes — and you often need to. The default Content-Security-Policy is very strict and will break things like inline scripts, CDN resources, or external fonts. You configure each header individually when calling helmet(). The key insight: Helmet doesn't make your app secure by itself — it removes the default insecure browser behaviours. Real security comes from your code. But these headers are free protection you'd be foolish not to add."`
    },
    {
      type: "code",
      text: `// helmet — sets ~15 security headers with one line
const helmet = require('helmet');
app.use(helmet()); // sane defaults — add this early, before routes

// What helmet sets by default:
// Content-Security-Policy: default-src 'self'       ← no external scripts
// X-Frame-Options: SAMEORIGIN                        ← no iframe embedding
// Strict-Transport-Security: max-age=15552000        ← HTTPS only
// X-Content-Type-Options: nosniff                    ← no MIME sniffing
// X-DNS-Prefetch-Control: off
// X-Download-Options: noopen
// Referrer-Policy: no-referrer

// Custom config — common for SPAs that load from CDN
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "https://cdn.jsdelivr.net"],  // allow CDN scripts
      styleSrc:    ["'self'", "'unsafe-inline'"],            // allow inline styles
      imgSrc:      ["'self'", "data:", "https:"],            // allow HTTPS images
      connectSrc:  ["'self'", "https://api.myapp.com"],
    }
  },
  frameguard: { action: 'deny' },  // stricter than default: no iframes at all
}));

// Disable a specific header if needed
app.use(helmet({ xPoweredBy: false })); // hides "X-Powered-By: Express"`
    },

    // ── morgan ──
    {
      speaker: "you",
      text: `"morgan — I know it logs requests. But what format should I use, and what's the point in production?"`
    },
    {
      speaker: "raj",
      text: `"<em>morgan</em> is HTTP request logging middleware. In development, use the <em>dev</em> format — it gives you coloured output with method, path, status, and response time. In production you want <em>combined</em> — the Apache standard format that includes IP address, timestamp, user-agent, and referrer. That data is what log aggregators like Datadog, Papertrail, or CloudWatch parse to give you traffic dashboards and alerting. But here's the important bit: in production you typically don't write logs to stdout and forget them. You stream them to a file or directly to a logging service so they survive server restarts and can be searched."`
    },
    {
      type: "code",
      text: `const morgan = require('morgan');
const fs     = require('fs');
const path   = require('path');

// Development — colourful, human-readable
app.use(morgan('dev'));
// Output: GET /users 200 12.345 ms

// Production — combined format (Apache standard)
app.use(morgan('combined'));
// Output: 192.168.1.1 - - [10/Oct/2024:13:55:36 +0000] "GET /users HTTP/1.1" 200 1234

// Production best practice — stream to a rotating log file
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs/access.log'),
  { flags: 'a' }   // append mode
);
app.use(morgan('combined', { stream: accessLogStream }));

// Custom token — log user ID alongside request
morgan.token('user-id', (req) => req.user?.userId || 'anonymous');
app.use(morgan(':method :url :status :response-time ms - user: :user-id'));

// Skip logging for health check endpoints (reduces noise)
app.use(morgan('dev', {
  skip: (req) => req.url === '/health'
}));`
    },

    // ── bcrypt deep dive ──
    {
      speaker: "you",
      text: `"I know bcrypt hashes passwords. But what is a salt, and what does the number 12 mean in bcrypt.hash(password, 12)?"`
    },
    {
      speaker: "raj",
      text: `"Good question — most people copy that number without knowing what it does. The <em>salt</em> is a random string generated by bcrypt and prepended to your password before hashing. It means two users with the same password get completely different hashes. Without salting, an attacker with a precomputed table of common password hashes — a <em>rainbow table</em> — can instantly look up millions of passwords. With a unique salt per user, every hash is unique and rainbow tables are useless."`
    },
    {
      speaker: "you",
      text: `"And the number 12?"`
    },
    {
      speaker: "raj",
      text: `"That's the <em>cost factor</em> — also called salt rounds. It controls how many times bcrypt iterates the hashing function internally — 2 to the power of 12, which is 4096 iterations. Higher number means slower hash computation. That's intentional. You want hashing to be slow enough that brute-forcing millions of guesses per second is impractical, but fast enough that your login endpoint doesn't take seconds. 10 to 12 is the standard recommendation today. As hardware gets faster, you increase the cost factor. The stored hash includes the cost factor in it, so bcrypt.compare() always knows how to verify even if you increase the cost factor later."`
    },
    {
      type: "analogy",
      text: "Salt = adding a unique fingerprint to each password before locking it. Rainbow table attacks = having a master key that works on generic locks. A unique fingerprint means your lock is one-of-a-kind — the master key doesn't fit. Cost factor = the number of times you re-lock the lock. Higher rounds = attacker has to try every key 4096 times per attempt instead of once."
    },
    {
      type: "code",
      text: `const bcrypt = require('bcrypt');

// Hashing a password on signup
const SALT_ROUNDS = 12;  // 2^12 = 4096 iterations

const hashPassword = async (plaintext) => {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
  // bcrypt auto-generates a salt, hashes, and returns:
  // "$2b$12$<22-char-salt><31-char-hash>"
  // The hash embeds: algorithm, cost factor, salt, and hash — all in one string
};

// Comparing on login
const verifyPassword = async (plaintext, storedHash) => {
  return bcrypt.compare(plaintext, storedHash);
  // bcrypt extracts the salt from storedHash, re-hashes plaintext with it,
  // then compares — you never store or manage the salt separately
};

// Why bcrypt.compare() — not simple string comparison
// Even comparing two bcrypt hashes of the same password gives different results
// because the salt is random each time
const h1 = await bcrypt.hash('password123', 12); // $2b$12$AAA...
const h2 = await bcrypt.hash('password123', 12); // $2b$12$BBB... (different!)
// bcrypt.compare('password123', h1) → true  ✓
// h1 === h2  → false  (hashes differ even for same input)

// Timing attack note: always use bcrypt.compare(), never implement your own
// bcrypt.compare() runs in constant time regardless of where strings differ`
    },

    // ── jsonwebtoken deep dive ──
    {
      speaker: "you",
      text: `"What tricky things does jsonwebtoken do that I might not know about?"`
    },
    {
      speaker: "raj",
      text: `"A few sharp edges. First — <em>jwt.verify() is synchronous by default</em> and it throws on failure. Wrap it in try/catch or use the callback form. Second — the <em>algorithms option on verify()</em> is not optional from a security standpoint. If you don't specify it, some versions accept any algorithm including 'none' — which means an attacker can forge a token by signing with alg:none and no secret. Always explicitly pass algorithms: ['HS256'] or algorithms: ['RS256']. Third — <em>jwt.decode()</em> is not the same as jwt.verify(). decode() just base64-decodes the payload without checking the signature. It's for reading claims from a token you already verified — not for security checks."`
    },
    {
      speaker: "you",
      text: `"What about token expiry — what actually happens when a token expires?"`
    },
    {
      speaker: "raj",
      text: `"jwt.verify() checks the exp claim and throws a <em>TokenExpiredError</em> — a specific error type. You should catch this separately from other JWT errors because expired tokens are a normal expected case — the client needs to refresh. Other errors like JsonWebTokenError mean the token is malformed or the signature is wrong — which is suspicious and should probably log differently. Always distinguish between these two error types in your auth middleware."`
    },
    {
      type: "code",
      text: `const jwt = require('jsonwebtoken');

// Signing — options matter
const token = jwt.sign(
  { userId: user._id, role: user.role },  // payload
  process.env.JWT_SECRET,                  // secret
  {
    expiresIn:  '15m',      // exp claim — can be string or seconds
    issuer:     'my-app',   // iss claim — who issued it
    audience:   'my-api',   // aud claim — who it's for
    jwtid:      uuid(),     // jti claim — unique ID for revocation
    algorithm:  'HS256'     // explicit always
  }
);

// Verifying — always specify algorithms
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],  // ← never omit this
      issuer:    'my-app',    // validate issuer matches what you signed with
      audience:  'my-api'
    });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      // client sees TOKEN_EXPIRED → triggers silent refresh
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
      // malformed or bad signature — probably not a legitimate client
    }
    next(err);
  }
};

// decode() vs verify() — critical distinction
jwt.decode(token)             // reads payload, NO signature check — never for auth
jwt.verify(token, secret)     // reads payload AND verifies signature — always for auth`
    },

    // ── cors ──
    {
      speaker: "you",
      text: `"CORS — I know it causes errors when my frontend tries to call my API. But I don't fully understand why it exists and what exactly I'm configuring."`
    },
    {
      speaker: "raj",
      text: `"CORS — Cross-Origin Resource Sharing — is a browser security policy, not a server one. When your React app on localhost:3000 calls your API on localhost:5000, the browser blocks the response by default because the origins differ. The server can opt in by including specific response headers that tell the browser 'this origin is allowed to read my response.' The <em>cors</em> npm package sets those headers automatically. Without the correct headers, the request technically reaches your server — you'll see it in your logs — but the browser discards the response before your JavaScript sees it."`
    },
    {
      speaker: "you",
      text: `"What's the difference between a simple CORS request and a preflight?"`
    },
    {
      speaker: "raj",
      text: `"For simple requests — GET or POST with basic headers — the browser just makes the request and checks the response headers. For anything more complex — DELETE, PUT, PATCH, custom headers like Authorization — the browser first sends an <em>OPTIONS preflight request</em> asking 'are you okay with me sending this?' The server must respond with the right headers on that OPTIONS request. If it doesn't, the actual request never gets sent. This is why your DELETE routes sometimes fail even when GET works — the preflight is failing silently."`
    },
    {
      type: "code",
      text: `const cors = require('cors');

// ❌ Never do this in production — allows ALL origins
app.use(cors());

// ✅ Specific origins only
app.use(cors({
  origin: ['https://myapp.com', 'https://www.myapp.com'],
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,       // allow cookies to be sent cross-origin
  maxAge:      86400        // browser caches preflight for 24 hours
}));

// Dynamic origin — useful for multiple envs or subdomains
const allowedOrigins = ['https://myapp.com', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Handling preflight explicitly for all routes
app.options('*', cors()); // respond to OPTIONS preflight on all routes

// What CORS headers look like in the response
// Access-Control-Allow-Origin: https://myapp.com
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE
// Access-Control-Allow-Headers: Content-Type, Authorization
// Access-Control-Allow-Credentials: true`
    },

    // ── express-validator ──
    {
      speaker: "you",
      text: `"How should I validate request bodies? Right now I'm just checking things manually in the route handler."`
    },
    {
      speaker: "raj",
      text: `"Manual validation gets messy fast. Use <em>express-validator</em>. It gives you a declarative chain-based API — you define your validation rules as middleware, and they run before your handler. If any rule fails, the errors are collected and you retrieve them with validationResult(). The key separation: validation middleware runs first, the handler only runs if validation passed. Keep your route handlers free of validation logic entirely."`
    },
    {
      type: "code",
      text: `const { body, param, query, validationResult } = require('express-validator');

// Validation rules as middleware
const validateCreateUser = [
  body('email')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),                // lowercases, strips dots from gmail etc.
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long'),
];

// Reusable middleware to check results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Route — clean handler, no validation logic inside
app.post('/users',
  validateCreateUser,   // run validation rules
  validate,             // check results, return 400 if failed
  asyncHandler(async (req, res) => {
    const user = await User.create(req.body); // body is validated and sanitised
    res.status(201).json(user);
  })
);

// Validating URL params and query strings
app.get('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  validate
], asyncHandler(getUser));`
    },

    // ── multer ──
    {
      speaker: "you",
      text: `"What's happening when I use multer? Files just appear on req.file — but how?"`
    },
    {
      speaker: "raj",
      text: `"<em>multer</em> is a middleware that parses <em>multipart/form-data</em> — the encoding used when a browser submits a form with a file input. A regular JSON body has a Content-Type of application/json. A file upload has multipart/form-data with a boundary string that separates each field. multer reads that stream, separates the fields, and puts text fields on req.body and file data on req.file or req.files. By default it stores files in memory as Buffers — fine for small files you're immediately uploading to S3. For larger files or if you need them on disk, configure it with DiskStorage."`
    },
    {
      type: "code",
      text: `const multer  = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Memory storage — file lands in req.file.buffer (good for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },  // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);   // accept
    } else {
      cb(new Error('Only JPEG, PNG, WebP allowed'), false); // reject
    }
  }
});

// Disk storage — file saved to disk (good for large files or video)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadToDisk = multer({ storage: diskStorage });

// Route — single file
app.post('/avatar',
  authMiddleware,
  upload.single('avatar'),          // 'avatar' = form field name
  asyncHandler(async (req, res) => {
    // req.file = { buffer, mimetype, originalname, size }
    const key = 'avatars/' + req.user.userId + '-' + Date.now();
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key:    key,
      Body:   req.file.buffer,
      ContentType: req.file.mimetype
    }));
    res.json({ url: 'https://cdn.myapp.com/' + key });
  })
);

// Multiple files
app.post('/gallery', upload.array('photos', 10), handler); // max 10 files`
    },

    // ── express-rate-limit ──
    {
      speaker: "you",
      text: `"How does rate limiting actually work? Is it just counting requests?"`
    },
    {
      speaker: "raj",
      text: `"At its core yes — but the details matter. <em>express-rate-limit</em> uses a sliding window or fixed window counter keyed by IP address. For each incoming request it increments the counter for that IP. If the counter exceeds the limit within the window, it returns 429 Too Many Requests. By default the counter is stored in memory — fine for a single server but it resets when the server restarts and doesn't work across multiple instances. For a multi-server setup you need a shared store like Redis so all instances share the same counters."`
    },
    {
      speaker: "you",
      text: `"What about users behind a reverse proxy? All their requests would come from the proxy's IP."`
    },
    {
      speaker: "raj",
      text: `"Exactly — that's a critical configuration. When you're behind Nginx or a load balancer, req.ip is the proxy's IP, not the real user's IP. You need to set <em>app.set('trust proxy', 1)</em> to tell Express to read the real IP from the X-Forwarded-For header. But only do this if you actually have a trusted proxy — if there's no proxy and you trust that header, attackers can spoof their IP and bypass rate limiting entirely."`
    },
    {
      type: "code",
      text: `const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Basic rate limiter — per IP, in memory
const apiLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,  // 15 minute window
  max:              100,              // 100 requests per window per IP
  standardHeaders:  true,            // adds RateLimit-* headers to response
  legacyHeaders:    false,
  message: { error: 'Too many requests, please try again later' }
});

// Strict limiter for auth routes — brute force protection
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,   // only 10 login attempts per 15 min
  skipSuccessfulRequests: true  // don't count successful logins
});

// Redis store — works across multiple server instances
const redisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  })
});

// Trust proxy — read real IP from X-Forwarded-For
app.set('trust proxy', 1);  // only if behind a trusted proxy (Nginx, Heroku etc.)

// Apply per-route
app.use('/api/', apiLimiter);
app.post('/auth/login',    authLimiter, loginHandler);
app.post('/auth/register', authLimiter, registerHandler);`
    },

    // ── compression ──
    {
      speaker: "you",
      text: `"What does the compression middleware do? When would I need it?"`
    },
    {
      speaker: "raj",
      text: `"The <em>compression</em> package adds gzip or Brotli compression to HTTP responses. When a client sends Accept-Encoding: gzip in the request headers, your server compresses the response body before sending it. A 500KB JSON payload can compress to 50KB — a 10x reduction. Clients decompress automatically, and you get dramatically lower bandwidth costs and faster load times. Add it early in your middleware chain so it applies to all responses. The threshold option controls the minimum response size to compress — no point compressing a 200-byte JSON object. Typically you'd use this for APIs returning large datasets or serving static files."`
    },
    {
      type: "code",
      text: `const compression = require('compression');

// Add early in middleware chain — compresses all responses above threshold
app.use(compression({
  level:     6,      // 0-9, compression effort. 6 = good balance of speed vs ratio
  threshold: 1024,   // only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client explicitly opts out
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res); // default filter
  }
}));

// What the client sees:
// Request:  Accept-Encoding: gzip, deflate, br
// Response: Content-Encoding: gzip  (Express sets this automatically)
//           500KB JSON → ~50KB on the wire

// Note: don't use this if you're behind Nginx in production
// Nginx handles compression more efficiently at the network layer
// Use Node compression only for direct Node → client setups`
    },

    // ── winston / logging ──
    {
      speaker: "you",
      text: `"We use console.log for everything right now. When should I switch to a proper logger?"`
    },
    {
      speaker: "raj",
      text: `"The moment your app goes to production. console.log has no log levels — you can't distinguish a debug trace from a critical error. It has no structured output — log aggregators like Datadog or CloudWatch can't parse plain strings to create alerts or dashboards. And it has no control over where logs go. <em>Winston</em> is the most popular Node logging library. It gives you log levels — error, warn, info, http, debug — so in production you can set the level to 'warn' and only see warnings and errors, filtering out all the noise. It outputs structured JSON — each log entry is a parseable object that your monitoring platform can index and query."`
    },
    {
      type: "code",
      text: `const winston = require('winston');

// Create a configured logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',  // minimum level to log
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // include stack traces on errors
    winston.format.json()                   // structured JSON output
  ),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()  // human-readable in dev
          )
        : winston.format.json()      // JSON in production for log aggregators
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level:    'error'             // only errors go to this file
    }),
    new winston.transports.File({
      filename: 'logs/combined.log' // all levels go here
    }),
  ]
});

// Usage — structured context with every log
logger.info('User created', { userId: user._id, email: user.email });
logger.warn('Rate limit approaching', { ip: req.ip, count: 95 });
logger.error('DB connection failed', { error: err.message, stack: err.stack });

// In production the JSON output is machine-parseable:
// { "level":"error", "message":"DB connection failed", "timestamp":"2024-03-10T...",
//   "error":"ECONNREFUSED", "stack":"Error: ECONNREFUSED\n    at..." }

// Replace morgan with winston for request logging
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));`
    },

    // ── Summary ──
    {
      type: "summary",
      points: [
        "Express = thin wrapper around Node's http. Adds routing, middleware chain, body parsing, clean response API.",
        "Middleware = fn(req, res, next). Chain runs in order. Call next() to continue, send response to end, next(err) to error handler.",
        "asyncHandler wrapper = catches async throws and forwards to next(err). Keeps routes clean. Express 5 handles this natively.",
        "helmet = sets ~15 HTTP security headers. CSP blocks XSS. X-Frame-Options blocks clickjacking. Free protection, always add it.",
        "morgan = HTTP request logging. 'dev' for development, 'combined' for production. Stream to file or log service.",
        "bcrypt salt = unique random string per user, defeats rainbow tables. Cost factor = iteration count, slows brute force.",
        "bcrypt.compare() = always use this, never string compare. Runs in constant time, extracts salt from stored hash automatically.",
        "jwt.verify() needs algorithms option specified always — prevents alg:none attack. Throws TokenExpiredError vs JsonWebTokenError — handle separately.",
        "jwt.decode() ≠ jwt.verify(). decode() skips signature check — never use for authentication.",
        "CORS = browser security policy. cors package sets response headers. credentials:true needed for cookies. Handle OPTIONS preflight.",
        "express-validator = declarative validation as middleware. Separate validation rules from route handler logic.",
        "multer = parses multipart/form-data. memoryStorage for S3 upload. DiskStorage for large files. Always validate MIME type.",
        "express-rate-limit = per-IP counters. Use Redis store for multi-server. Set trust proxy only if behind a real proxy.",
        "compression = gzip responses. 10x size reduction on large JSON. Skip if Nginx handles compression upstream.",
        "winston = structured JSON logging with levels. Never console.log in production. Stream to log aggregator for alerts and dashboards."
      ]
    }
  ]
};

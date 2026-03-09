// ─────────────────────────────────────────────────────────────────
//  LESSON: Networking & HTTP
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_NETWORKING = {
  category: "Language & Framework Fundamentals",
  tag: "Networking & HTTP",
  title: "What Actually Happens When You Type a URL",
  intro: "Raj leans back, crosses his arms, and asks the most deceptively simple question in any frontend interview. 'Walk me through everything that happens between typing https://example.com and seeing the page.' You open your mouth. 'A request is sent to—' He holds up a hand. 'Before the request. Way before.'",
  scenes: [

    {
      speaker: "raj",
      text: `"This question isn't about testing knowledge. It's a depth probe. They ask it and follow the thread wherever you go shallow. What does that mean for how you should answer?"`
    },
    {
      speaker: "you",
      text: `"Cover every layer? DNS, TCP, TLS, HTTP..."`
    },
    {
      speaker: "raj",
      text: `"More than that. Each layer has a <em>why</em>. The candidate who says 'DNS lookup happens' is giving a checklist. The candidate who says 'DNS lookup happens, and here's why that takes 120ms on a cache miss and 2ms on a hit, and here's why that matters for deployments' — that's the answer that ends the follow-up questions. They're not testing whether you've memorised the steps. They're testing whether you understand the costs."`
    },

    // ── DNS ──
    {
      speaker: "raj",
      text: `"Start at the very beginning. You've typed the URL, hit Enter. What's the first thing the browser does?"`
    },
    {
      speaker: "you",
      text: `"DNS lookup — turns the domain into an IP address."`
    },
    {
      speaker: "raj",
      text: `"Where does it look first?"`
    },
    {
      speaker: "you",
      text: `"Its own cache?"`
    },
    {
      speaker: "raj",
      text: `"Right, but there are four levels before it hits the actual DNS network. Browser cache, OS cache, router cache, ISP resolver cache. Most lookups for common sites stop at level two. Only on a full miss does the ISP's resolver kick off a recursive lookup — it asks a root nameserver who handles .com, that points to Verisign, Verisign points to example.com's authoritative nameserver, and that server returns the IP. The whole chain is 20ms on a cache hit, 120ms on a full miss. This is why DNS TTL matters in deployments — if you forget to lower TTL before migrating servers, users keep hitting the old IP for however many hours the cached TTL says. Not a fun incident to be first responder on."`
    },
    {
      type: "analogy",
      text: "DNS is a phonebook lookup with four layers of local directories. Your browser's cache is the sticky note on your monitor — checked first, gone when you close the tab. Your OS is the building directory. Your router is the neighbourhood one. Your ISP is the city phonebook. Only when none of those have it do you call the central registry — and even then it says 'go ask this other office', who says 'go ask that office', who finally has the answer."
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// DNS — THE LOOKUP CHAIN
// ─────────────────────────────────────────────────────

// Order of lookup (fastest → slowest):
// 1. Browser cache    → ~1ms  (TTL-limited, cleared on browser restart)
// 2. OS/hosts file    → ~2ms  (system cache, /etc/hosts overrides)
// 3. Router cache     → ~5ms
// 4. ISP resolver     → ~20ms (cache hit — most queries stop here)
// 5. Recursive lookup → ~120ms (cache miss — full chain below)
//       Root nameserver   ("who handles .com?")
//    →  TLD nameserver    ("who handles example.com?")    [Verisign for .com]
//    →  Authoritative NS  ("example.com = 93.184.216.34") [the actual answer]

// Common DNS record types:
const records = {
  A:     'Domain → IPv4 address    (example.com → 93.184.216.34)',
  AAAA:  'Domain → IPv6 address',
  CNAME: 'Alias to another domain  (www → example.com)',
  MX:    'Mail server for domain',
  TXT:   'Arbitrary text           (SPF records, ownership verification)',
};

// Node.js — two lookup methods that behave very differently:
const dns = require('dns').promises;

await dns.lookup('example.com');   // uses OS resolver — can hit hosts file / cache
await dns.resolve4('example.com'); // bypasses OS, goes direct to DNS server

// The deployment TTL trap:
// Your current TTL is 86400 (24 hours).
// You point the domain at a new server at 09:00.
// Users who cached it at 08:59 don't get the new IP until 08:59 tomorrow.
// Fix: lower TTL to 300 (5 min) 48hrs before migration, migrate, restore TTL after.`
    },

    // ── TCP ──
    {
      speaker: "raj",
      text: `"You've got the IP. Now what?"`
    },
    {
      speaker: "you",
      text: `"Open a TCP connection. Three-way handshake — SYN, SYN-ACK, ACK."`
    },
    {
      speaker: "raj",
      text: `"What does the handshake actually cost?"`
    },
    {
      speaker: "you",
      text: `"One round trip."`
    },
    {
      speaker: "raj",
      text: `"One round trip before a single byte of your application gets sent. London to New York is about 70ms each way. The handshake alone costs 70ms before HTTP even starts. Then TLS costs another round trip. Then the actual request and response. You can't make light faster — you can only reduce the number of round trips. That's the whole game. It's why connection reuse matters. It's why HTTP/2 matters. It's why CDNs matter — moving the server closer doesn't change physics, it just shortens the distance."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// TCP HANDSHAKE
// ─────────────────────────────────────────────────────

//   Client                    Server
//     │──── SYN ─────────────►│   "I want to connect, seq# = X"
//     │◄─── SYN-ACK ──────────│   "OK, my seq# = Y, I acknowledge X"
//     │──── ACK ─────────────►│   "I acknowledge Y — connected"
//     │                       │
//     │──── HTTP request ────►│   (only now does data flow)
//
// Cost: 1 RTT of pure overhead before the first byte of your app

// Why TCP? It guarantees:
// • Ordered delivery    — packets arrive in sequence
// • Reliable delivery   — lost packets are retransmitted
// • Flow control        — won't overwhelm the receiver
// • Congestion control  — won't overwhelm the network

// TCP vs UDP — the tradeoff:
// TCP:  correct but has handshake overhead and head-of-line blocking
// UDP:  no guarantees, no handshake — used for DNS, video, games, WebRTC
// HTTP/3 (QUIC): built on UDP but adds reliability in userspace,
//                eliminating TCP's head-of-line blocking problem entirely

// keep-alive: reuse the same TCP connection across multiple requests
// (default in HTTP/1.1) — amortises the handshake cost`
    },

    // ── TLS ──
    {
      speaker: "raj",
      text: `"TCP is connected. We're on HTTPS. What's next?"`
    },
    {
      speaker: "you",
      text: `"TLS handshake. Sets up encryption."`
    },
    {
      speaker: "raj",
      text: `"What does TLS actually give you — not just 'encryption'."`
    },
    {
      speaker: "you",
      text: `"Encryption so nobody can read the traffic... and authentication, proving you're talking to the right server."`
    },
    {
      speaker: "raj",
      text: `"Three things: authentication, confidentiality, integrity. Authentication: the server shows a certificate signed by a Certificate Authority your browser already trusts — that's how you know you're talking to example.com and not an impersonator. Confidentiality: the traffic is encrypted with session keys derived during the handshake — a network observer sees noise. Integrity: every message has a cryptographic tag so if anyone tampers with a byte in transit, you know. TLS 1.3 — the current standard — does all of this in one round trip. TLS 1.2 took two. That single round trip difference across every HTTPS connection in the world is why the upgrade mattered."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// TLS 1.3 HANDSHAKE
// ─────────────────────────────────────────────────────

//   Client                           Server
//     │──── ClientHello ────────────►│  "here are my cipher suites + key share"
//     │◄─── ServerHello ─────────────│  "using this cipher, here's my key share"
//     │◄─── Certificate ─────────────│  "here's my identity, signed by a CA you trust"
//     │◄─── CertificateVerify ───────│  "proof I own this cert"
//     │◄─── Finished ───────────────│  (encrypted tunnel is open)
//     │──── Finished ──────────────►│
//     │──── HTTP request ──────────►│  (first actual data)
//
// TLS 1.3: 1 RTT
// TLS 1.2: 2 RTTs  (one extra round trip every new HTTPS connection, forever)

// Round trip tally before first byte of response:
// DNS (cache miss)  ~120ms
// TCP handshake     ~70ms   (1 RTT)
// TLS 1.3           ~70ms   (1 RTT)
// HTTP request      ~70ms   (1 RTT)
// ──────────────────────────
// ~330ms to first byte, London → New York

// Each of these is a lever:
// DNS:  CDN with anycast, pre-lowered TTL
// TCP:  keep-alive, TLS session resumption, QUIC (combines TCP+TLS into 1 RTT)
// HTTP: caching (0 RTT for cached resources), HTTP/2 multiplexing

// Node.js — enforce TLS version minimum:
const https = require('https');
https.createServer({
  key:        fs.readFileSync('key.pem'),
  cert:       fs.readFileSync('cert.pem'),
  minVersion: 'TLSv1.2',  // reject TLS 1.0/1.1 connections
}, app);`
    },

    // ── HTTP request/response ──
    {
      speaker: "raj",
      text: `"Encrypted tunnel is open. The browser sends the request. What's in it?"`
    },
    {
      speaker: "you",
      text: `"Method and path, headers, body."`
    },
    {
      speaker: "raj",
      text: `"What do headers actually do — why do they exist?"`
    },
    {
      speaker: "you",
      text: `"They carry metadata about the request. Content-Type, auth tokens, caching info..."`
    },
    {
      speaker: "raj",
      text: `"Headers are how HTTP stays extensible. The protocol itself barely changes — new behaviours get added as new headers without touching the spec. Content-Type tells the receiver how to parse the body — without it, a JSON blob looks identical to an HTML page. Cache-Control tells every cache between here and the server how long to hold onto the response. ETag is a fingerprint — client sends it back as If-None-Match, server replies 304 Not Modified with no body if nothing changed. That last one is underused. Sending a 10kb JSON response when nothing changed because you forgot to implement ETags is the most expensive 'no news' in web development."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// HTTP REQUEST / RESPONSE + IMPORTANT HEADERS
// ─────────────────────────────────────────────────────

// ── Request ──
// GET /api/products?page=2 HTTP/2
// Host: example.com
// Authorization: Bearer eyJhbGci...
// Accept: application/json
// Accept-Encoding: gzip, br
// If-None-Match: "33a64df5"    ← send cached fingerprint back

// ── Response ──
// HTTP/2 200 OK
// Content-Type: application/json; charset=utf-8
// Content-Encoding: gzip
// Cache-Control: public, max-age=300, stale-while-revalidate=60
// ETag: "33a64df5"             ← fingerprint of this response

// ── The headers that actually matter day-to-day ──
const headers = {
  // Caching
  'Cache-Control': 'max-age=300          → cache for 5 minutes\n' +
                   'no-store             → never cache (sensitive data)\n' +
                   'private              → browser only, no CDN caching\n' +
                   'stale-while-revalidate=60 → serve stale while fetching fresh',
  'ETag':          'Fingerprint. Client echoes as If-None-Match → 304 saves entire body',
  'Vary':          'Which req headers affect caching (e.g. Accept-Encoding)',

  // Security
  'Strict-Transport-Security': 'Force HTTPS — "max-age=31536000; includeSubDomains"',
  'Content-Security-Policy':   'Allowlist for scripts, images, frames',
  'X-Content-Type-Options':    '"nosniff" — browser must use declared Content-Type',

  // Rate limiting
  'Retry-After':           'Seconds until client should try again (429, 503)',
  'X-RateLimit-Remaining': 'Requests left in current window',
};

// ── Conditional requests — save the entire response body ──
app.get('/api/config', (req, res) => {
  const config = getConfig();
  const etag   = createHash('md5').update(JSON.stringify(config)).digest('hex');

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // nothing changed — zero body bytes sent
  }

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json(config);
});`
    },

    // ── Status codes ──
    {
      speaker: "raj",
      text: `"Status codes. What's the one that junior developers get wrong most often?"`
    },
    {
      speaker: "you",
      text: `"401 vs 403?"`
    },
    {
      speaker: "raj",
      text: `"That's the interview answer. What's the actual distinction?"`
    },
    {
      speaker: "you",
      text: `"401 means not authenticated — you haven't proved who you are. 403 means authenticated but not allowed."`
    },
    {
      speaker: "raj",
      text: `"Right. 401 Unauthorised is a misleading name in the spec — it actually means unauthenticated. 403 is the real 'authorisation failed'. The other one I see constantly in code review: returning 200 with a JSON body that contains an error field. HTTP 200 with {'error': 'user not found'} in the body. Do you know why that's actually a serious mistake, not just a style issue?"`
    },
    {
      speaker: "you",
      text: `"CDNs cache 200s? And monitoring tools look at status codes?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. Your CDN happily caches that error and serves it to the next user. Your alerting system sees 200 and reports everything is fine while users are hitting error responses. Your load balancer keeps routing to a broken instance. Status codes aren't aesthetic — they're the contract between your API and every piece of infrastructure between you and the user. Use the right ones."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// STATUS CODES — THE ONES THAT MATTER
// ─────────────────────────────────────────────────────

// ── 2xx: things went well ──
// 200 OK           — standard success
// 201 Created      — POST created a resource; include Location header
// 202 Accepted     — received and queued, not done yet (async operations)
// 204 No Content   — success, nothing to return (DELETE, some PATCHes)

// ── 3xx: go somewhere else ──
// 301 Moved Permanently — update your bookmarks; cached by default
// 304 Not Modified      — conditional GET; client should use cached response
// 307 Temporary Redirect — same as 302 but browser must keep the original method
// 308 Permanent Redirect — same as 301 but browser must keep the original method

// ── 4xx: you made a mistake ──
// 400 Bad Request   — malformed syntax, missing required field
// 401 Unauthorized  — not authenticated (misleading name)
// 403 Forbidden     — authenticated, but not permitted
// 404 Not Found     — resource doesn't exist
// 409 Conflict      — state conflict (duplicate key, version mismatch)
// 422 Unprocessable — valid syntax, but semantic validation failed
// 429 Too Many Requests — rate limited; include Retry-After

// ── 5xx: we made a mistake ──
// 500 Internal Server Error — generic server fault
// 502 Bad Gateway    — upstream server returned garbage
// 503 Service Unavailable — overloaded or in maintenance; include Retry-After
// 504 Gateway Timeout — upstream didn't respond in time

// The 401 vs 403 logic:
const statusFor = (user, resource) => {
  if (!user)                      return 401; // go log in
  if (!canAccess(user, resource)) return 403; // you're logged in, still no
  if (!exists(resource))          return 404; // authorised, just not there
  return 200;
};

// 201 with Location (the response header that's always forgotten):
app.post('/api/users', asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201)
     .setHeader('Location', \`/api/users/\${user._id}\`)
     .json(user);
}));`
    },

    // ── HTTP/1.1 vs HTTP/2 vs HTTP/3 ──
    {
      speaker: "raj",
      text: `"HTTP/2. Why did it need to exist?"`
    },
    {
      speaker: "you",
      text: `"HTTP/1.1 could only process one request at a time per connection."`
    },
    {
      speaker: "raj",
      text: `"Which led to what developer workarounds?"`
    },
    {
      speaker: "you",
      text: `"Opening multiple connections, bundling files together, domain sharding..."`
    },
    {
      speaker: "raj",
      text: `"All of them hacks around the same underlying problem: head-of-line blocking. You're downloading a page with 40 resources. Connection 1 is halfway through a big JS file. The CSS you actually need to render anything is queued behind it, waiting. Browsers opened 6–8 parallel connections per domain to work around this. Developers bundled all their JS into one file, inlined images as base64, spread assets across multiple subdomains for more connection slots. HTTP/2 fixes the root cause: one TCP connection, many independent streams running in parallel. The workarounds don't just become unnecessary — they become actively counterproductive. Domain sharding splits your streams across multiple connections and loses HTTP/2's multiplexing. Bundling everything into one file prevents individual files from being cached independently."`
    },
    {
      speaker: "you",
      text: `"And HTTP/3?"`
    },
    {
      speaker: "raj",
      text: `"HTTP/2 solved it at the application layer but TCP still had head-of-line blocking at the transport layer. One lost packet freezes all streams on that TCP connection, even ones that have nothing to do with the lost packet. HTTP/3 replaces TCP with QUIC — runs over UDP, handles reliability in userspace, each stream retransmits independently. It also merges the TCP handshake and TLS into a single round trip. And connection IDs instead of IP/port pairs — so switching from WiFi to mobile data doesn't break your connection."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// HTTP/1.1 → HTTP/2 → HTTP/3
// ─────────────────────────────────────────────────────

// ── HTTP/1.1 ──
// One request at a time per connection
// Browser workarounds: 6-8 parallel connections, bundling, domain sharding, sprites
// These workarounds are HARMFUL under HTTP/2 — don't apply them to modern stacks

// ── HTTP/2 ──
// • Multiplexing: many streams on one TCP connection, fully interleaved
// • HPACK header compression: same headers sent on every request → send index, not full string
// • Stream prioritisation
// • One TCP connection — domain sharding is now counterproductive

// HTTP/2 makes classic optimisations wrong:
const http2Impact = {
  bundling:       'Less critical — many small files handled fine via multiplexing',
  domainSharding: 'HARMFUL — splits to multiple connections, loses multiplexing benefit',
  spriting:       'Less needed — parallel stream requests are cheap',
  inlining:       'Less beneficial — separately cached files > inlined uncacheable ones',
};

// ── HTTP/3 (QUIC over UDP) ──
// • No TCP head-of-line blocking — each QUIC stream retransmits independently
// • QUIC + TLS 1.3 in one handshake: 1 RTT (vs TCP 1RTT + TLS 1RTT = 2RTTs)
// • Connection IDs: survive network change (WiFi → LTE) without re-handshake
// • 0-RTT resumption for returning connections (with replay attack caveats)

// Round trip comparison to first byte:
// HTTP/1.1 + TLS 1.2:  DNS + TCP(1) + TLS(2) + HTTP(1) = 4+ RTTs
// HTTP/2   + TLS 1.3:  DNS + TCP(1) + TLS(1) + HTTP(1) = 3 RTTs
// HTTP/3   (QUIC):     DNS + QUIC+TLS(1)     + HTTP(1) = 2 RTTs`
    },

    // ── CORS ──
    {
      speaker: "raj",
      text: `"CORS. You've hit the error. Explain what's actually happening."`
    },
    {
      speaker: "you",
      text: `"The browser blocks a request because it came from a different origin."`
    },
    {
      speaker: "raj",
      text: `"Close, but important nuance. The browser doesn't block the request. It blocks reading the response. The request goes out. The server processes it. The response comes back. The browser looks at the response headers and if CORS headers aren't there, it throws away the response and gives your JavaScript an error. Why does that matter?"`
    },
    {
      speaker: "you",
      text: `"The state-changing action already happened... so CORS doesn't actually protect against CSRF?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. CORS is Same-Origin Policy for reads — your JavaScript can't read responses from other origins without permission. It is not a server-side access control. A curl request bypasses CORS entirely. A server-to-server call bypasses CORS entirely. An attacker's form submit bypasses CORS entirely. It's purely browser enforcement, purely about reading responses. Don't rely on it as a security boundary for state-changing endpoints."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────

// Same origin = same protocol + same host + same port
// https://app.example.com  vs  https://api.example.com → different host = cross-origin

// Simple requests (no preflight): GET, HEAD, basic POST (text/plain, urlencoded)
// Preflighted requests: DELETE, PUT, PATCH, JSON POST, any custom headers
//
//   Browser          Your API
//     │──OPTIONS ───►│  "Can I POST JSON to /api/users with Authorization header?"
//     │◄─ 204 ───────│  Access-Control-Allow-Origin, Allow-Methods, Allow-Headers
//     │──POST ──────►│  actual request (browser only sends if preflight approved)

const cors = require('cors');

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'https://app.example.com',
      'https://admin.example.com',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean);

    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(\`Origin \${origin} not allowed\`));
    }
  },
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    true,   // allow cookies / Authorization headers
  maxAge:         86400,  // cache preflight for 24hrs — browsers won't preflight again
}));

// The trap: credentials: true + origin: '*' → browser rejects it
// If you need credentials, you must name the exact origin. No wildcards.`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Now give me the full answer. Everything between Enter and pixels on screen."`
    },
    {
      speaker: "you",
      text: `"Browser checks DNS cache, then OS, router, ISP — on a full miss does the recursive lookup through root, TLD, and authoritative nameserver. Gets the IP. Three-way TCP handshake, one round trip. TLS 1.3 handshake — authentication, encryption, integrity — another round trip. HTTP/2 request goes out inside the encrypted tunnel. Server responds with status code, headers including Cache-Control and ETag, compressed body. Browser checks the ETag — if it matches cached version, takes the 304 and skips the body. Otherwise parses HTML, kicks off sub-requests for CSS, JS, images — all multiplexed over the same connection. Builds DOM, CSSOM, render tree, layout, paint."`
    },
    {
      speaker: "raj",
      text: `"And every step you just named is a lever. DNS — CDN with anycast, TTL strategy. TCP — connection reuse, or QUIC to eliminate the handshake cost. TLS — session resumption, TLS 1.3. HTTP — multiplexing, caching, compression. Content — code splitting, image optimisation. You just described the entire performance engineering discipline in one answer. That's why they ask this question."`
    },

    {
      type: "summary",
      points: [
        "The 'type a URL' question is a depth probe — every layer you mention becomes a follow-up. Know the costs, not just the steps.",
        "DNS has four cache levels before a network call: browser → OS → router → ISP. A full recursive lookup is root → TLD → authoritative nameserver. Lower TTL to 5 minutes at least 48 hours before any server migration.",
        "TCP three-way handshake costs 1 RTT before any application data. You cannot make light faster — you can only reduce the number of round trips. Connection reuse (keep-alive) amortises this cost.",
        "TLS gives three things: authentication (cert signed by trusted CA), confidentiality (AES encryption), integrity (HMAC — tampering is detectable). TLS 1.3 = 1 RTT. TLS 1.2 = 2 RTTs.",
        "HTTP headers are the protocol's extensibility mechanism. ETag + If-None-Match = 304 saves the entire response body. Cache-Control tells every cache in the chain how long to hold the response.",
        "401 = not authenticated (misleadingly named 'Unauthorised'). 403 = authenticated but forbidden. Never return 200 with an error body — CDNs cache it, monitors report everything is fine, load balancers stay on broken instances.",
        "HTTP/2 multiplexing fixes HTTP/1.1 head-of-line blocking. This makes HTTP/1.1 workarounds (bundling, domain sharding, sprites) actively counterproductive under HTTP/2.",
        "HTTP/3 (QUIC over UDP) eliminates TCP-level head-of-line blocking too. One packet loss no longer freezes all streams. Merges TCP + TLS into 1 RTT. Connection IDs survive network changes.",
        "CORS blocks reading responses, not making requests. The request goes out. The server processes it. CORS is browser enforcement only — curl, Postman, and server-to-server calls are never affected. credentials: true requires an explicit origin, never a wildcard."
      ]
    }
  ]
};

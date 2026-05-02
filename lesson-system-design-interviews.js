// ─────────────────────────────────────────────────────────────────
//  LESSON: Handling Any System Design Interview
//  Category: Career & Interview Prep
// ─────────────────────────────────────────────────────────────────

const LESSON_SYSTEM_DESIGN_INTERVIEW = {
  category: "Career & Interview Prep",
  tag: "System Design",
  title: "They Don't Want the Right Answer",
  intro: "You have a loop at a FAANG-adjacent company next week. Five rounds, and one of them is system design. The question will be something like 'Design Twitter' or 'Design a URL shortener' and you'll have 45 minutes. You've been reading architecture blog posts for three days and you feel less prepared than when you started. Raj has seen this before.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"I've been studying system design for a week and I still don't know how to approach it. There's so much — databases, caching, queues, load balancers. Every 'Design Twitter' walkthrough I read is different. I don't know what they actually want."`
    },
    {
      speaker: "raj",
      text: `"What do you think they want?"`
    },
    {
      speaker: "you",
      text: `"The correct architecture? A design that would actually work at scale?"`
    },
    {
      speaker: "raj",
      text: `"No. They want to watch you think. The interviewer has given that prompt to fifty candidates. They know there's no single correct answer. What they're evaluating is whether you ask the right questions before drawing boxes, whether you make conscious trade-offs instead of just reciting patterns, and whether you can drive a conversation about ambiguity without freezing up. The candidate who says 'let me start with requirements' and then systematically builds a design will beat the candidate who immediately starts drawing a perfect architecture every time."`
    },
    {
      speaker: "you",
      text: `"So it's more about process than the actual design?"`
    },
    {
      speaker: "raj",
      text: `"Process and communication. A senior engineer at a real company doesn't sit down and immediately produce a complete architecture. They ask questions, they make assumptions explicit, they identify the hard parts, they talk through trade-offs. That's what the interview is simulating. If you sprint to a solution, you look junior — even if the solution is technically sound."`
    },

    // ── The framework ──
    {
      speaker: "you",
      text: `"Okay. So what's the actual process? Give me the framework."`
    },
    {
      speaker: "raj",
      text: `"Five phases. Requirements. Estimation. High-level design. Deep dive. Trade-offs and wrap-up. You spend roughly the same amount of time on each. Most candidates skip the first two and spend the whole interview on the third. That's why they struggle — they're designing a system they don't fully understand yet."`
    },
    {
      speaker: "you",
      text: `"How long is the interview usually?"`
    },
    {
      speaker: "raj",
      text: `"45 minutes is standard. Allocate ten minutes for requirements and estimation, ten for high-level design, fifteen for deep dive on the one or two hard parts, and ten for trade-offs and follow-up questions. You won't always hit those marks — the interviewer will steer you — but having a mental clock means you don't spend 30 minutes on an ERD and then have no time left to talk about the interesting problems."`
    },
    {
      type: "analogy",
      text: "A system design interview is like being asked to design a bridge on a whiteboard. The interviewer doesn't actually need a bridge. They want to see if you ask how long the bridge needs to be, how much weight it needs to carry, whether it needs to withstand earthquakes, and what the budget is — before you start drawing. The engineer who asks those questions and then designs a simple suspension bridge with explicit trade-offs is more impressive than the one who immediately sketches a technically perfect cable-stayed bridge that answers a question nobody asked."
    },
    {
      type: "code",
      text: `// ── The five phases — time allocation for a 45-minute interview ──
//
//  Phase 1: Requirements          ~10 min  ← most candidates skip this. don't.
//  Phase 2: Estimation            ~5  min  ← back-of-envelope numbers
//  Phase 3: High-level design     ~10 min  ← boxes and arrows, APIs, data model
//  Phase 4: Deep dive             ~15 min  ← the hard parts — this is where you're evaluated
//  Phase 5: Trade-offs + wrap-up  ~5  min  ← what you'd do differently, what you'd add
//
// ── What the interviewer is scoring ──
//
// Problem clarification    Did you ask questions before designing?
// Requirement scoping      Did you handle both functional and non-functional requirements?
// High-level thinking      Can you translate requirements into components?
// Technical depth          Do you understand the hard parts of what you proposed?
// Trade-off awareness      Do you know what you gave up with each decision?
// Communication            Can a colleague follow your reasoning in real time?
//
// ── What kills candidates ──
//
// Jumping straight to a solution         — looks like you memorised a template
// Designing in silence                   — the interviewer can't evaluate what they can't hear
// Treating the design as final           — real systems evolve, interviewers probe
// Vague answers to follow-up questions   — "we'd use a cache" with no specifics
// Running out of time on basics          — no time left for the interesting problems`
    },

    // ── Phase 1: Requirements ──
    {
      speaker: "you",
      text: `"Let's go through each phase. Requirements — what am I actually trying to find out?"`
    },
    {
      speaker: "raj",
      text: `"Two categories. Functional requirements — what does the system do? Non-functional requirements — how does it do it, at what scale, under what constraints? Most candidates only ask about the first. The second is where the interesting design decisions live."`
    },
    {
      speaker: "you",
      text: `"Give me an example. Say the prompt is 'Design a URL shortener.'"`
    },
    {
      speaker: "raj",
      text: `"Functional first. Do users need accounts or is shortening anonymous? Can users choose custom slugs or are they always generated? Does a short URL ever expire? Can it be deleted? Can the owner see click analytics? Each of those yes/no answers changes the data model significantly. Now non-functional. How many URLs are being shortened per second? How many redirects per second — that's usually much higher than shortening, maybe a hundred to one. What's the acceptable latency on a redirect — 100 milliseconds? What's the availability requirement — five nines? Do we need the short URL to work globally with low latency everywhere, or is this US-only?"`
    },
    {
      speaker: "you",
      text: `"That's a lot of questions. Won't the interviewer get impatient?"`
    },
    {
      speaker: "raj",
      text: `"No. They'll love it. Most candidates panic and start designing immediately. You asking targeted, intelligent questions signals that you understand that requirements drive architecture. Ask four or five sharp questions, not twenty vague ones. And if the interviewer says 'you decide' — that's not a trap, it's an invitation. State your assumption explicitly and move on. 'I'll assume anonymous shortening for now, no custom slugs, URLs don't expire. I can revisit that.' You've just shown you can handle ambiguity."`
    },
    {
      speaker: "you",
      text: `"What if I ask about something that turns out not to matter for the design?"`
    },
    {
      speaker: "raj",
      text: `"That's fine. The cost of an unnecessary question is five seconds. The cost of designing the wrong system for fifteen minutes is the interview. Err on the side of asking."`
    },
    {
      type: "code",
      text: `// ── Requirements — the questions to ask for any prompt ──

// ── Functional requirements ──
// What are the core user actions? (the happy path — just two or three)
// What does the system NOT need to do? (explicitly descope)
// Are there different user types with different permissions?
// Does the system need real-time behaviour, or is eventual consistency acceptable?
// Is this read-heavy, write-heavy, or balanced?

// ── Non-functional requirements ──
// Scale: how many users? daily active users? requests per second?
// Latency: what's acceptable? p99? is this user-facing or backend?
// Availability: what's the uptime target? can we tolerate downtime for maintenance?
// Consistency: strong consistency required, or can reads be slightly stale?
// Durability: what happens if data is lost? (financial data vs. feed posts)
// Geography: global users or regional? latency implications of CDN / replication?
// Data volume: how much data total? how much growth per year?

// ── URL shortener — worked requirements ──
//
// Functional (agreed with interviewer):
//   - Shorten a URL → get a unique short code (7 characters, alphanumeric)
//   - Redirect short code → original URL
//   - No user accounts for now (anonymous)
//   - No custom slugs, no expiry, no deletion
//   - Basic click count analytics (total clicks per short URL)
//
// Non-functional (stated assumptions):
//   - Write: 100 new URLs shortened per second
//   - Read:  10,000 redirects per second (100:1 read/write ratio — redirect is the hot path)
//   - Latency: redirect must complete in < 100ms globally
//   - Availability: 99.99% (four nines — roughly 1hr downtime/year)
//   - Durability: once created, a short URL must never return the wrong destination
//   - Storage: 100 bytes per record × 100 writes/sec × 86,400 sec/day × 365 days × 5 years
//             ≈ 15TB over five years — manageable, no exotic storage needed
//   - Global: users worldwide → CDN for redirects, global read replicas

// ── The descope statement ──
// "I'm going to set aside user accounts, custom slugs, link expiry, and spam detection
//  for now. I'll call those out as things we'd add next. This lets us focus on the
//  core read and write paths first."
//
// Explicitly descoping shows you know what matters.
// It also gives you things to talk about in the trade-offs phase.`
    },

    // ── Phase 2: Estimation ──
    {
      speaker: "you",
      text: `"Estimation — I always feel like I'm just making numbers up. And I'm slow at mental maths. What's the actual point of this?"`
    },
    {
      speaker: "raj",
      text: `"You're not making numbers up — you're making assumptions explicit and reasoning from them. The point isn't precision. It's to catch design decisions that would be wildly wrong at the stated scale. If your estimation tells you you're storing a petabyte, you need a distributed storage system. If it's ten gigabytes, SQLite would work. Those lead to very different architectures. Estimation steers the design before you draw a single box."`
    },
    {
      speaker: "you",
      text: `"What numbers should I always be calculating?"`
    },
    {
      speaker: "raj",
      text: `"Four things. Reads per second and writes per second — because that ratio determines everything about your storage and caching strategy. Storage size over five years — because it tells you whether you need a distributed database or a single Postgres instance. Bandwidth — because high-traffic systems have network costs that change the architecture. And the one number most candidates miss: peak load. Systems don't run at average load. Design for peak, which is usually three to five times the average."`
    },
    {
      speaker: "you",
      text: `"I'm never sure what numbers to start with. Like, how many users does Twitter have?"`
    },
    {
      speaker: "raj",
      text: `"You don't need to know. You need a starting number and the ability to reason from it. The interviewer will give you one or you state an assumption. 'I'll assume 500 million daily active users, each reads their timeline once a day and posts once a week.' From there everything is arithmetic. Nobody is checking if you got Twitter's actual numbers right. They're checking if you can derive downstream implications from a starting assumption without reaching for a calculator."`
    },
    {
      type: "code",
      text: `// ── Estimation — the numbers that matter and how to get them ──

// ── Memory anchors — learn these, derive everything else ──
// 1 million seconds ≈ 11.5 days
// 1 billion seconds ≈ 31.7 years
// 1KB = 10^3 bytes  |  1MB = 10^6  |  1GB = 10^9  |  1TB = 10^12  |  1PB = 10^15
// Average tweet: ~300 bytes  |  average image: ~300KB  |  average video: ~50MB
// Postgres: comfortable to ~500GB single node, up to a few TB with tuning
// Redis:    comfortable to ~100GB single node before you shard
// HTTP request latency: same DC ~1ms | cross-region ~60ms | cross-continent ~150ms

// ── URL shortener estimation ──
//
// Given: 100 writes/sec, 10,000 reads/sec
//
// ── Storage ──
// Per record: short_code (7B) + original_url (200B) + created_at (8B) + click_count (8B) ≈ 250B
// Records per day: 100 writes/sec × 86,400 sec/day = 8.6M records/day
// Storage per day: 8.6M × 250B ≈ 2.2GB/day
// Storage over 5 years: 2.2GB × 365 × 5 ≈ 4TB
// → Single database is fine. No distributed storage needed. Postgres or DynamoDB works.
//
// ── Bandwidth ──
// Write bandwidth: 100 req/sec × 250B ≈ 25KB/s — negligible
// Read bandwidth:  10,000 req/sec × 200B (just the URL) ≈ 2MB/s — fine
// → Not a bandwidth-constrained system. CDN helps latency, not throughput here.
//
// ── QPS and caching ──
// Read QPS: 10,000/sec
// Hot URLs: top 20% of URLs get 80% of traffic (Zipf distribution — always assume this)
// Cache hit rate target: 95%+
// Cache memory needed: if top 20% of 8.6M daily records = 1.7M records × 250B ≈ 430MB
// → Small enough to fit in a single Redis instance easily
//
// ── Peak load ──
// Average read QPS: 10,000
// Peak read QPS: 3-5× average = 30,000–50,000 req/sec
// → Design the redirect path to handle 50,000 req/sec
// → At 50,000 req/sec with 95% cache hit rate: 2,500 req/sec hit the database at peak
// → A single Postgres read replica handles this easily
//
// ── The conclusion from estimation ──
// "Storage is manageable at ~4TB over 5 years — single relational DB works.
//  The hot path is reads at 10,000/sec peak 50,000/sec. A Redis cache with 95%+ hit rate
//  means the DB sees 2,500 req/sec at peak — easily handled by one read replica.
//  This isn't a storage problem or a bandwidth problem. It's a latency and cache problem."
//
// That conclusion directly shapes your design. You just told yourself where to focus.`
    },

    // ── Phase 3: High-level design ──
    {
      speaker: "you",
      text: `"Okay, now I draw the boxes. This is where I freeze because I don't know where to start."`
    },
    {
      speaker: "raj",
      text: `"Start with the client and work inward. The client makes a request. What's the first thing it hits?"`
    },
    {
      speaker: "you",
      text: `"A load balancer?"`
    },
    {
      speaker: "raj",
      text: `"Good. Then what?"`
    },
    {
      speaker: "you",
      text: `"Some kind of API server. And then the database."`
    },
    {
      speaker: "raj",
      text: `"You've drawn the skeleton. Client → load balancer → API server → database. Now trace your two core operations through it. How does a new URL get shortened? How does a redirect happen? Walk me through both, one at a time, and draw what you need as you need it. Don't draw components you haven't justified yet. Every box you draw should be there because one of your user flows requires it."`
    },
    {
      speaker: "you",
      text: `"For the URL shortener — shortening is a write. The API server generates a unique code and stores it. Redirect is a read — takes the code, looks up the URL, returns a 301 or 302."`
    },
    {
      speaker: "raj",
      text: `"Good. Now — where does the cache fit? And which operation does it serve?"`
    },
    {
      speaker: "you",
      text: `"The redirect. It's the hot path. The cache sits between the API server and the database — check the cache first, if miss go to the database and populate the cache."`
    },
    {
      speaker: "raj",
      text: `"Right. Now your diagram has a reason for every component. One more: the API — what does it actually look like? What are the endpoints?"`
    },
    {
      speaker: "you",
      text: `"POST /shorten to create a short URL. GET /{code} to redirect. Maybe GET /{code}/stats for analytics."`
    },
    {
      speaker: "raj",
      text: `"Good. That's your high-level design. You haven't over-engineered anything. You have a client, a load balancer, API servers, a cache, and a database. Every component is justified by a requirement. The data model comes next — just the core entities and their key fields. Don't go deep on schema yet. That's for the deep dive."`
    },
    {
      type: "code",
      text: `// ── High-level design — what to cover and in what order ──

// ── 1. Start with the client-to-server skeleton ──
//
//  Client → DNS → CDN (static assets / cached redirects)
//         ↓
//  Load Balancer (L7 — routes by path/header)
//         ↓
//  API Server cluster (stateless — horizontally scalable)
//         ↓
//  Cache (Redis) ← check here first on reads
//         ↓
//  Primary Database (Postgres / DynamoDB / etc.)
//         ↓
//  Read Replica(s) ← for read-heavy paths

// ── 2. Trace the core flows ──
//
// WRITE: POST /shorten
//   1. API server receives URL
//   2. Generate unique 7-character code (how? — defer to deep dive)
//   3. Write {code, original_url, created_at, click_count: 0} to primary DB
//   4. Return short URL to client
//   Note: don't write to cache on creation — let the first redirect populate it
//
// READ: GET /{code}
//   1. API server receives code
//   2. Check Redis: GET code → hit? return 302 to original_url immediately
//   3. Miss → query DB read replica: SELECT original_url WHERE code = ?
//   4. Populate cache: SET code original_url EX 86400 (24hr TTL)
//   5. Increment click_count asynchronously (don't block the redirect for a counter)
//   6. Return 302 redirect
//   Note: 301 (permanent) vs 302 (temporary) — important choice, covered in deep dive

// ── 3. API design — REST endpoints ──
//
// POST   /api/v1/urls
//   Body:    { "original_url": "https://very-long-url.com/path?query=string" }
//   Returns: { "short_url": "https://short.ly/xK9mPqR", "code": "xK9mPqR" }
//
// GET    /{code}
//   Returns: HTTP 302 Location: https://very-long-url.com/path?query=string
//   (or 404 if code doesn't exist)
//
// GET    /api/v1/urls/{code}/stats
//   Returns: { "code": "xK9mPqR", "click_count": 4821, "created_at": "..." }

// ── 4. Core data model ──
//
// urls table / collection:
//   code         VARCHAR(7)   PRIMARY KEY   -- the short code
//   original_url TEXT         NOT NULL      -- the destination
//   created_at   TIMESTAMP    NOT NULL
//   click_count  BIGINT       DEFAULT 0
//
// Indexes:
//   PRIMARY KEY on code  ← the only lookup we do
//   No other indexes needed for this scope
//
// That's it. Don't add columns you haven't justified.
// User ID, tags, expiry — those go in the "what we'd add next" section.`
    },

    // ── Phase 4: Deep dive — unique ID generation ──
    {
      speaker: "you",
      text: `"The deep dive — how do I know which part to go deep on? I don't want to pick something trivial."`
    },
    {
      speaker: "raj",
      text: `"The interviewer usually guides you. But if they don't, pick the component that has the most non-obvious failure mode. For the URL shortener — what's the hardest part of what you've designed?"`
    },
    {
      speaker: "you",
      text: `"Generating the unique code? If two requests come in at the same time and both generate the same code, you have a collision."`
    },
    {
      speaker: "raj",
      text: `"Good. That's a real problem. Walk me through how you'd solve it."`
    },
    {
      speaker: "you",
      text: `"I could generate a random code and check if it exists in the database before inserting. If it exists, generate another one and try again."`
    },
    {
      speaker: "raj",
      text: `"What's wrong with that?"`
    },
    {
      speaker: "you",
      text: `"At high write volume, collision probability goes up as the namespace fills. And you have race conditions — two servers could check, both find the code doesn't exist, and both try to insert. One succeeds, one gets a unique constraint violation."`
    },
    {
      speaker: "raj",
      text: `"Right. So what's a better approach?"`
    },
    {
      speaker: "you",
      text: `"Use the database's auto-increment ID and convert it to base62? Each ID is unique by definition."`
    },
    {
      speaker: "raj",
      text: `"That works. What does it buy you? What does it cost you?"`
    },
    {
      speaker: "you",
      text: `"Buys you: guaranteed uniqueness, no retries, no race conditions. Costs you: the codes are sequential — someone can enumerate all your URLs by incrementing the ID. Also, a single database sequence is a bottleneck if you're at massive write scale."`
    },
    {
      speaker: "raj",
      text: `"Good. You just did a real trade-off analysis on a deep-dive question. That's exactly what they want. Now — what if I told you this system needs to handle 10,000 writes per second, not 100? Does base62 auto-increment still work?"`
    },
    {
      speaker: "you",
      text: `"The single sequence becomes the bottleneck. You'd need something like Snowflake IDs — a distributed ID generation scheme where each server generates IDs with a timestamp component and a machine ID so they're globally unique without coordinating."`
    },
    {
      speaker: "raj",
      text: `"Now you're going deep. That's the conversation the interviewer wants."`
    },
    {
      type: "code",
      text: `// ── Deep dive: unique code generation — four approaches with trade-offs ──

// ── Approach 1: Random generation with collision check ──
const generateCode = async () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  while (true) {
    const code = Array.from({ length: 7 }, () =>
      chars[Math.floor(Math.random() * 62)]
    ).join('');

    const exists = await db.urls.findOne({ code });
    if (!exists) return code;
    // Retry on collision — probability is low but non-zero and grows as table fills
  }
};
// Pros: simple, codes look random (not enumerable)
// Cons: race condition between check and insert (needs DB unique constraint + retry on 23505)
//       collision rate increases as namespace fills (62^7 ≈ 3.5 trillion — fine in practice)
//       two DB round trips per write

// ── Approach 2: Base62 of auto-increment ID — recommended for most cases ──
const toBase62 = (num) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  while (num > 0) {
    result = chars[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(7, '0');
};

// DB insert returns auto-incremented ID → convert to base62
const createShortUrl = async (originalUrl) => {
  const { rows } = await db.query(
    'INSERT INTO urls (original_url, created_at) VALUES ($1, NOW()) RETURNING id',
    [originalUrl]
  );
  const code = toBase62(rows[0].id);
  await db.query('UPDATE urls SET code = $1 WHERE id = $2', [code, rows[0].id]);
  return code;
};
// Pros: guaranteed unique, no retries, no collisions, O(1) operation
// Cons: sequential — codes are enumerable (minor concern for most products)
//       single DB sequence is a bottleneck above ~5,000 writes/sec on one node

// ── Approach 3: Snowflake ID for distributed, high-scale writes ──
// Structure: [41-bit timestamp ms][10-bit machine ID][12-bit sequence]
// Each machine generates up to 4096 unique IDs per millisecond with no coordination
const EPOCH = 1609459200000n;   // 2021-01-01 as custom epoch

const makeSnowflake = (() => {
  let sequence  = 0n;
  let lastMs    = 0n;
  const MACHINE = BigInt(process.env.MACHINE_ID || 1);   // unique per instance (0-1023)

  return () => {
    let ms = BigInt(Date.now()) - EPOCH;
    if (ms === lastMs) {
      sequence = (sequence + 1n) & 0xFFFn;   // 12 bits max: 4095
      if (sequence === 0n) {
        while (ms <= lastMs) ms = BigInt(Date.now()) - EPOCH;  // wait for next ms
      }
    } else {
      sequence = 0n;
    }
    lastMs = ms;
    return (ms << 22n) | (MACHINE << 12n) | sequence;
  };
})();

const createShortUrlDistributed = async (originalUrl) => {
  const id   = makeSnowflake();
  const code = toBase62(Number(id));  // 64-bit → base62 string
  await db.urls.insertOne({ code, original_url: originalUrl, created_at: new Date() });
  return code;
};
// Pros: globally unique across machines with no coordination
//       handles 4096 writes per millisecond per machine = millions/sec per cluster
//       monotonically increasing → friendly to B-tree indexes
// Cons: requires unique machine ID provisioning (Zookeeper, env variable, etc.)
//       codes are not random-looking — still somewhat sequential

// ── Approach 4: MD5/SHA hash of URL (mention but reject) ──
// Hash the original URL, take first 7 characters
// Problem: two different URLs can hash to the same 7-character prefix (collision)
// Problem: same URL from different users should arguably get different codes
// → Use only if you want the same URL to always produce the same short code
//   (content-addressed shortening) — explicitly mention this trade-off

// ── 301 vs 302 redirect — a common deep-dive question ──
//
// 301 Permanent: browser caches the redirect forever
//   → Subsequent visits never hit your server — massive reduction in load
//   → You lose all analytics after the first visit (can't count clicks)
//   → You can NEVER change the destination — the browser won't re-check
//
// 302 Temporary: browser always re-requests through your server
//   → Full analytics on every click
//   → Can change or disable the destination at any time
//   → More server load — every click is a request
//
// The answer: 302 by default for URL shorteners that want analytics or the ability
// to deactivate links. 301 only if you explicitly want to offload all traffic after
// the first click and don't care about analytics.`
    },

    // ── Deep dive: caching ──
    {
      speaker: "you",
      text: `"What other deep dives are common? I want to have a few in my pocket."`
    },
    {
      speaker: "raj",
      text: `"Caching strategy is almost always asked. The interviewer will say 'walk me through how the cache works' and they're waiting to see if you know more than just 'it's Redis.' What cache eviction policy do you use? What's the TTL? What happens on a cache miss at high load?"`
    },
    {
      speaker: "you",
      text: `"I'd use LRU eviction. TTL of... I don't know, a day?"`
    },
    {
      speaker: "raj",
      text: `"Why a day?"`
    },
    {
      speaker: "you",
      text: `"That's the thing — I don't actually know. I just said it."`
    },
    {
      speaker: "raj",
      text: `"Good that you caught that. TTL should come from your access patterns. If most clicks on a short URL happen within the first 24 hours of creation — which is true for viral content — then a 24-hour TTL makes sense. For URLs that are evergreen, longer TTL but you need to think about what invalidates it. For a URL shortener, the destination almost never changes. A URL entry is effectively immutable once created. So your TTL could be a week, a month, even indefinite — you'd only ever evict based on memory pressure, not on data freshness."`
    },
    {
      speaker: "you",
      text: `"What's a thundering herd? I see that term in a lot of design discussions."`
    },
    {
      speaker: "raj",
      text: `"A cache entry expires. One hundred requests arrive simultaneously, all find a miss, all go to the database at once. That's a thundering herd — a sudden spike of load on the database triggered by a single cache expiry. The fixes: probabilistic early expiration, where you start refreshing a key before it expires so it never truly misses. Or a cache lock — the first request to miss acquires a lock, fetches from the database, populates the cache, releases the lock. Every other request that missed waits and then reads from cache. Only one database query per thundering herd instead of a hundred."`
    },
    {
      type: "code",
      text: `// ── Caching deep dive — the questions behind every cache decision ──

// ── Eviction policy — choose based on access pattern ──
//
// LRU  (Least Recently Used)     → evict whatever was accessed longest ago
//      Good for: URL shortener, social feeds — recent = likely to be accessed again
//
// LFU  (Least Frequently Used)   → evict whatever has been accessed fewest times total
//      Good for: recommendation engines — popularity over recency
//
// TTL  (Time To Live)            → evict after a fixed duration regardless of access
//      Good for: session tokens, rate limit windows, anything with a natural expiry
//
// FIFO (First In, First Out)     → rarely right — ignores access patterns entirely

// ── Cache-aside pattern (most common — use this as default) ──
const redirect = async (code) => {
  // 1. Check cache
  const cached = await redis.get(\`url:\${code}\`);
  if (cached) {
    incrementClickAsync(code);   // fire and forget — don't block the redirect
    return cached;
  }

  // 2. Miss — fetch from DB
  const url = await db.urls.findOne({ code });
  if (!url) throw new NotFoundError(code);

  // 3. Populate cache
  await redis.setex(\`url:\${code}\`, 86400, url.original_url);   // 24hr TTL
  incrementClickAsync(code);
  return url.original_url;
};

// ── Thundering herd — cache lock pattern ──
const redirectSafe = async (code) => {
  const cached = await redis.get(\`url:\${code}\`);
  if (cached) return cached;

  const lockKey  = \`lock:\${code}\`;
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 5);   // 5s lock TTL

  if (!acquired) {
    // Another request is fetching — wait and retry from cache
    await new Promise(r => setTimeout(r, 50));
    return redis.get(\`url:\${code}\`);   // should be populated by now
  }

  try {
    const url = await db.urls.findOne({ code });
    if (!url) throw new NotFoundError(code);
    await redis.setex(\`url:\${code}\`, 86400, url.original_url);
    return url.original_url;
  } finally {
    await redis.del(lockKey);
  }
};

// ── Write strategies — when does the cache get updated? ──
//
// Write-through:   write to cache AND DB on every write → cache always fresh
//                  Cost: write latency is doubled (two writes before returning)
//
// Write-back:      write to cache only, flush to DB asynchronously
//                  Cost: data loss if cache dies before flush (never for financial data)
//
// Write-around:    write to DB only, let the read path populate cache on first access
//                  Cost: cold start — first request after write always misses
//                  Recommended for URL shortener — writes are rare, reads populate cache

// ── Cache sizing ──
// 80% of traffic goes to 20% of URLs (Zipf distribution — always assume this)
// If you have 8.6M URLs created per day, the hot 20% = 1.7M URLs
// At 250B per entry: 1.7M × 250B ≈ 430MB → fits in a single Redis instance with room to spare
// → One Redis node is enough. Mention Redis Cluster for future scale.

// ── Metrics to mention ──
// Cache hit rate: target 95%+ — monitor this in production, alert if it drops
// Cache memory usage: monitor headroom, alert at 80%
// Eviction rate: high eviction rate = cache is too small for the working set`
    },

    // ── Deep dive: database choices ──
    {
      speaker: "you",
      text: `"Database choice — this is another one where I never know what to say. I always just say Postgres and hope for the best."`
    },
    {
      speaker: "raj",
      text: `"Postgres is usually fine and a safe answer. The problem is saying it without justification. Tell me why Postgres for the URL shortener."`
    },
    {
      speaker: "you",
      text: `"Um. Because it's relational and I know it?"`
    },
    {
      speaker: "raj",
      text: `"That's honest. But what the interviewer wants to hear is: what are the access patterns, and what database properties does that require? For a URL shortener — you're doing point lookups by primary key. You're not doing complex joins. You're not doing full-text search. You're not querying by multiple dimensions. A key-value store would actually be faster than a relational database for pure point lookups. DynamoDB with the code as the partition key — sub-millisecond reads guaranteed. So why would you still pick Postgres?"`
    },
    {
      speaker: "you",
      text: `"Because we already know how to operate it? And the analytics feature might need more complex queries later?"`
    },
    {
      speaker: "raj",
      text: `"Both valid. That's a trade-off — operational familiarity and flexibility for complex queries versus maximum point-lookup performance. State both sides and make a call. That conversation is worth ten times 'I'd use Postgres' with no reasoning."`
    },
    {
      speaker: "you",
      text: `"When would I actually choose a NoSQL database over a relational one?"`
    },
    {
      speaker: "raj",
      text: `"Three situations. When your data is genuinely document-shaped with variable structure — no consistent schema across records. When you need horizontal write scaling beyond what a single primary node can provide — relational databases shard awkwardly, DynamoDB and Cassandra are built for it. And when you need extremely predictable, low-latency point lookups at massive scale — DynamoDB's single-digit millisecond reads with no cold starts beat Postgres on that specific benchmark. Outside those three, relational is usually the right default because the query flexibility is worth having."`
    },
    {
      type: "code",
      text: `// ── Database choice — the decision framework ──

// ── Ask yourself these before picking ──
//
// Access pattern:  point lookup, range scan, full-text search, aggregation, graph traversal?
// Schema:          fixed and consistent? or variable across records?
// Consistency:     does every read need to see the latest write (strong) or is stale okay?
// Write scale:     how many writes per second? does it need to scale horizontally?
// Query flexibility: will you need to query this data in ways you can't predict today?
// Operational:     what does your team already know how to run?

// ── The decision matrix ──
//
//  Relational (Postgres, MySQL)
//    → Fixed schema, complex queries, joins, transactions across multiple tables
//    → Strong consistency by default
//    → Vertical scaling + read replicas — primary node is write bottleneck above ~10k TPS
//    → Sweet spot: most web apps, anything that needs ACID guarantees
//
//  Document (MongoDB, CouchDB)
//    → Variable schema, nested/hierarchical data, data that changes shape over time
//    → Horizontal write scaling via sharding
//    → Sweet spot: product catalogues, CMS content, user profiles with flexible attributes
//
//  Key-Value (DynamoDB, Redis)
//    → Extremely fast point lookups and range scans by key
//    → Horizontal write scaling built-in
//    → No joins, no complex queries — you must know your access patterns at design time
//    → Sweet spot: session stores, shopping carts, URL shorteners, leaderboards
//
//  Wide-column (Cassandra, HBase)
//    → Massive write throughput, multi-datacenter replication built-in
//    → Data modelled around queries, not normalisation
//    → Eventual consistency by default
//    → Sweet spot: time-series data, activity feeds, IoT event streams, analytics
//
//  Graph (Neo4j, Neptune)
//    → Traversing relationships is the primary operation (not looking up rows)
//    → Sweet spot: social graphs, fraud detection, recommendation engines
//
//  Search (Elasticsearch, Algolia)
//    → Full-text search, faceted filtering, ranking by relevance
//    → Not a primary store — index alongside your source of truth
//    → Sweet spot: product search, log search, anything with 'search as you type'

// ── Read replicas — always mention for read-heavy systems ──
//
// Primary handles all writes
// One or more read replicas handle reads — lag is typically <1 second
// Application uses a read/write split:
//   - writes → primary
//   - reads  → round-robin across replicas
//
// Replication lag matters: if user writes a record and immediately reads it,
// they might read from a replica that hasn't caught up yet.
// Fix: read-your-own-writes — route reads to primary for X seconds after a user writes.

// ── Sharding — when read replicas aren't enough ──
//
// Vertical scaling + read replicas tops out at roughly 10,000–20,000 writes/sec.
// Above that: horizontal sharding — split data across multiple primary nodes.
//
// Shard key choice is critical:
//   Good shard key:  user_id — distributes evenly, queries usually scoped to one user
//   Bad shard key:   created_at — all writes go to the "latest" shard (hot partition)
//   Bad shard key:   country — uneven distribution (US shard is 10× the size of others)
//
// Resharding (redistributing data as you add shards) is painful — design the shard key
// to distribute evenly and grow with you.`
    },

    // ── Deep dive: scaling the write path ──
    {
      speaker: "you",
      text: `"What about the write path specifically? For something like a feed system where millions of users are writing posts constantly — how do you think about scaling that?"`
    },
    {
      speaker: "raj",
      text: `"What's the hard problem in a social feed? Writing a post is easy — one row in a database. The hard problem is reading the feed. When you load Twitter, you need to see posts from everyone you follow, sorted by time. How would you implement that?"`
    },
    {
      speaker: "you",
      text: `"On read, query all the posts from users I follow and sort them? Like a JOIN or a big IN query?"`
    },
    {
      speaker: "raj",
      text: `"That works for a hundred followers. What about someone following ten thousand accounts, each posting twenty times a day? Your read query is joining or aggregating two hundred thousand posts and then sorting them. At scale that query is the bottleneck. You'd time out before you could show the user anything."`
    },
    {
      speaker: "you",
      text: `"So you pre-compute it somehow?"`
    },
    {
      speaker: "raj",
      text: `"Fan-out on write. When someone posts, instead of storing the post once and computing everyone's feed at read time, you immediately push the post ID into the feed of every follower. Each user has a pre-built feed stored in Redis — a sorted set ordered by timestamp. Reading the feed is a single O(log n) range query. You pay a higher write cost so that reads are cheap. That's the trade-off. Twitter calls this approach timeline fan-out."`
    },
    {
      speaker: "you",
      text: `"What if someone has ten million followers? Pushing to ten million feeds on every post is expensive."`
    },
    {
      speaker: "raj",
      text: `"Exactly the right question. That's the celebrity problem. The fix is a hybrid approach: fan-out on write for normal users — say, under fifty thousand followers. For celebrities above that threshold, fan-out on read — when a normal user loads their feed, they get their pre-computed feed plus a real-time merge of posts from the celebrity accounts they follow. Twitter actually built exactly this. Knowing the problem exists and having a coherent answer to it is what makes you sound senior."`
    },
    {
      type: "code",
      text: `// ── Feed system: fan-out on write vs fan-out on read ──

// ── Fan-out on write (push model) ──
// When a user posts, push the post ID to every follower's feed immediately
const publishPost = async (authorId, content) => {
  // 1. Write the post to the posts table
  const post = await db.posts.create({
    author_id:  authorId,
    content,
    created_at: new Date(),
  });

  // 2. Fan out to all followers asynchronously (via message queue — don't block the response)
  const followers = await db.follows.findAll({ followee_id: authorId });

  // Push to queue — worker processes fan-out so the API responds immediately
  await queue.publish('post.created', {
    post_id:     post.id,
    author_id:   authorId,
    timestamp:   post.created_at.getTime(),
    follower_ids: followers.map(f => f.follower_id),
  });

  return post;
};

// Fan-out worker — runs asynchronously after the API has responded
queue.subscribe('post.created', async (event) => {
  // Batch the Redis writes for efficiency
  const pipeline = redis.pipeline();
  for (const followerId of event.follower_ids) {
    const feedKey = \`feed:\${followerId}\`;
    pipeline.zadd(
      feedKey,                        // sorted set per user
      event.timestamp,                // score = timestamp → sorted chronologically
      event.post_id                   // member = post ID
    );
    pipeline.zremrangebyrank(feedKey, 0, -1001);  // keep only 1000 most recent
  }
  await pipeline.exec();
});

// Reading the feed — single Redis query, no joins, O(log n)
const getFeed = async (userId, page = 0, limit = 20) => {
  const postIds = await redis.zrevrange(
    \`feed:\${userId}\`,
    page * limit,
    page * limit + limit - 1   // paginate through the sorted set
  );

  if (postIds.length === 0) return [];

  // Fetch post details in one query
  return db.posts.findAll({ id: { $in: postIds } });
};

// ── Fan-out on read (pull model) ──
// Don't precompute — query at read time
const getFeedPull = async (userId, limit = 20) => {
  const following = await db.follows.findAll({ follower_id: userId });
  const followeeIds = following.map(f => f.followee_id);

  return db.posts.findAll({
    author_id: { $in: followeeIds },
    order:     [['created_at', 'DESC']],
    limit,
  });
  // Works fine at small scale
  // Becomes expensive as followee count or post volume grows
};

// ── Hybrid approach — the production answer ──
//
// Normal users (< 50k followers):  fan-out on write → pre-built feed in Redis
// Celebrities (≥ 50k followers):   fan-out on read at load time, merged into the feed
//
// Why? A celebrity posts once → push to 10M feeds = 10M Redis writes in seconds
// That's a write amplification problem that fan-out on read sidesteps for high-follower accounts
//
const getHybridFeed = async (userId, limit = 20) => {
  // 1. Get pre-built feed (fan-out on write, normal users)
  const prebuiltPostIds = await redis.zrevrange(\`feed:\${userId}\`, 0, limit - 1);

  // 2. Get celebrity follows for this user
  const celebFollows = await db.follows.findAll({
    follower_id: userId,
    followee_type: 'celebrity'   // flagged at follow-time
  });

  // 3. Fetch recent posts from celebrities (fan-out on read, small set)
  const celebPosts = celebFollows.length > 0
    ? await db.posts.findAll({
        author_id: { $in: celebFollows.map(f => f.followee_id) },
        created_at: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
    : [];

  // 4. Merge, deduplicate, sort, return top N
  const allIds = [...new Set([...prebuiltPostIds, ...celebPosts.map(p => p.id)])];
  const posts  = await db.posts.findAll({ id: { $in: allIds }, order: [['created_at', 'DESC']], limit });
  return posts;
};`
    },

    // ── Deep dive: rate limiting ──
    {
      speaker: "you",
      text: `"Rate limiting comes up a lot too. I know it's a thing but I've never actually implemented it. What do I say?"`
    },
    {
      speaker: "raj",
      text: `"First say where it lives — at the API gateway, before requests hit your services. Then say which algorithm. There are four common ones. Fixed window — count requests in a one-minute bucket. Sliding window — smoother, counts requests in a rolling window. Token bucket — users accumulate tokens over time, each request costs one. Leaky bucket — requests flow out at a fixed rate regardless of how fast they arrive. Most interviewers are happy if you know fixed vs sliding window and can explain the downside of fixed."`
    },
    {
      speaker: "you",
      text: `"What's the downside of fixed window?"`
    },
    {
      speaker: "raj",
      text: `"A user can send double their limit in two seconds. Allow 100 requests per minute — they send 100 at 11:59 and 100 at 12:00. Two bursts of 100 back to back, technically within two different windows. Sliding window prevents that — it counts requests in the last 60 seconds, not requests since the minute changed. The implementation cost is higher but the behaviour is what you actually want."`
    },
    {
      speaker: "you",
      text: `"And where do I store the counters? I can't store them in the API servers because those are stateless."`
    },
    {
      speaker: "raj",
      text: `"Redis. Single atomic operation — increment a counter keyed by user ID and window, set TTL to the window size, check if it's over the limit. If you have multiple Redis nodes you need to think about atomicity — a Lua script or a Redis transaction ensures the check-and-increment is atomic. That's usually where the interviewer probes."`
    },
    {
      type: "code",
      text: `// ── Rate limiting — four algorithms and when to use each ──

// ── Algorithm 1: Fixed window counter ──
// Simple, cheap — but allows 2× burst at window boundaries
const fixedWindowLimit = async (userId, limit, windowSeconds) => {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const key    = \`ratelimit:\${userId}:\${window}\`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);   // set TTL on first request

  return count <= limit;
};

// ── Algorithm 2: Sliding window log ──
// Precise — stores timestamp of every request, expensive at high volume
const slidingWindowLog = async (userId, limit, windowMs) => {
  const now    = Date.now();
  const cutoff = now - windowMs;
  const key    = \`ratelimit:log:\${userId}\`;

  await redis.zremrangebyscore(key, 0, cutoff);   // remove expired entries
  const count = await redis.zcard(key);           // count requests in window

  if (count >= limit) return false;

  await redis.zadd(key, now, \`\${now}-\${Math.random()}\`);   // add this request
  await redis.pexpire(key, windowMs);
  return true;
};

// ── Algorithm 3: Token bucket ──
// Allows bursting up to bucket capacity, refills at a fixed rate
// Most natural model for "users can occasionally burst but not indefinitely"
const tokenBucket = async (userId, capacity, refillRate) => {
  const key  = \`ratelimit:bucket:\${userId}\`;
  const now  = Date.now() / 1000;

  const data = await redis.hgetall(key);
  let tokens    = parseFloat(data.tokens    ?? capacity);
  let lastRefill = parseFloat(data.lastRefill ?? now);

  // Refill tokens based on time elapsed
  const elapsed = now - lastRefill;
  tokens = Math.min(capacity, tokens + elapsed * refillRate);

  if (tokens < 1) return false;   // insufficient tokens

  await redis.hset(key, 'tokens', tokens - 1, 'lastRefill', now);
  await redis.expire(key, Math.ceil(capacity / refillRate) * 2);
  return true;
};
// Note: hget + hset is not atomic — use a Lua script in production to prevent race conditions

// ── Lua script for atomic check-and-decrement (production pattern) ──
const RATE_LIMIT_SCRIPT = \`
  local key      = KEYS[1]
  local limit    = tonumber(ARGV[1])
  local window   = tonumber(ARGV[2])
  local current  = redis.call('INCR', key)
  if current == 1 then redis.call('EXPIRE', key, window) end
  if current > limit then return 0 else return 1 end
\`;

const checkRateLimit = async (userId, limit, windowSeconds) => {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const key    = \`rl:\${userId}:\${window}\`;
  const allowed = await redis.eval(RATE_LIMIT_SCRIPT, 1, key, limit, windowSeconds);
  return allowed === 1;
};

// ── Express middleware ──
const rateLimiter = (limit, windowSeconds) => async (req, res, next) => {
  const userId  = req.userId ?? req.ip;   // authenticated users by ID, anonymous by IP
  const allowed = await checkRateLimit(userId, limit, windowSeconds);

  res.setHeader('X-RateLimit-Limit',     limit);
  res.setHeader('X-RateLimit-Remaining', allowed ? 'check Redis' : '0');

  if (!allowed) return res.status(429).json({ error: 'Too many requests', retryAfter: windowSeconds });
  next();
};

// Apply to routes
app.post('/api/v1/urls', rateLimiter(10, 60), createShortUrl);    // 10 per minute
app.get ('/:code',       rateLimiter(100, 1), redirect);          // 100 per second`
    },

    // ── Deep dive: consistency and replication ──
    {
      speaker: "you",
      text: `"Consistency — I hear 'eventual consistency' thrown around as if it's always the answer. When is it actually not okay?"`
    },
    {
      speaker: "raj",
      text: `"When the user's next action depends on the value they just wrote. Give me an example from everyday life."`
    },
    {
      speaker: "you",
      text: `"Banking. I transfer money out, check my balance, need to see it deducted immediately."`
    },
    {
      speaker: "raj",
      text: `"Good. What else?"`
    },
    {
      speaker: "you",
      text: `"Inventory. If I buy the last item and someone else tries to buy it, they need to see it as out of stock immediately."`
    },
    {
      speaker: "raj",
      text: `"Right. The test is: what's the worst case if a read returns stale data? For a social media like count, stale data means someone sees 1,403 likes instead of 1,404. Acceptable. For inventory, stale data means you sell the same item twice and have to cancel someone's order. Not acceptable. The requirement — not the technology — tells you which consistency model you need. Eventual consistency is a trade-off you make consciously for performance and availability, not a default you reach for."`
    },
    {
      speaker: "you",
      text: `"What's the CAP theorem and when do I bring it up?"`
    },
    {
      speaker: "raj",
      text: `"CAP says: in a distributed system experiencing a network partition, you must choose between consistency — every node returns the same data — and availability — every request gets a response. Bring it up when you're choosing a database that needs to be distributed across data centres. 'We're using Cassandra because we need availability over consistency — during a partition we'd rather return slightly stale data than return an error.' That's a good sentence. Don't bring it up unprompted as if it applies to every system design — most systems don't experience network partitions in ways that force this choice."`
    },
    {
      type: "code",
      text: `// ── Consistency models — what they mean in practice ──

// ── Strong consistency ──
// Every read reflects the most recent write, globally, immediately
// How: single primary node for writes, reads go to primary too
//      OR distributed transaction protocol (2PC, Paxos, Raft)
// Cost: higher latency (reads wait for write confirmation across nodes)
//       lower availability (if primary is down, reads may fail too)
// Use when: financial transactions, inventory counts, anything where stale data = real harm

// ── Read-your-own-writes consistency ──
// You always see your own writes immediately; others may see them slightly later
// How: route reads to primary for X seconds after user writes
//      OR use a session token that tracks the user's latest write timestamp
const getUserProfile = async (req, userId) => {
  const useReplica = !req.session.recentWrite || Date.now() - req.session.recentWrite > 2000;
  const db = useReplica ? readReplica : primaryDb;
  return db.users.findOne({ id: userId });
};

const updateUserProfile = async (req, updates) => {
  await primaryDb.users.update({ id: req.userId }, updates);
  req.session.recentWrite = Date.now();   // mark that user just wrote — read from primary for 2s
};

// ── Eventual consistency ──
// All replicas will eventually converge to the same value — but not immediately
// How: async replication from primary to replicas (lag: typically < 1 second)
// Cost: reads may return stale data for a short window
// Use when: social likes, view counts, follower counts, search indexes, analytics
//            — the user isn't harmed by seeing data that's one second stale

// ── The consistency decision for common components ──
//
// User authentication tokens:   STRONG  — a revoked token must be invalid immediately
// Bank balance / payments:      STRONG  — stale balance = incorrect transaction decisions
// Inventory counts:             STRONG  — selling the same item twice is costly
// User profile (name, bio):     READ-YOUR-OWN-WRITES — user sees their own changes; lag ok for others
// Post like counts:             EVENTUAL — 1,403 vs 1,404 is invisible to users
// Search index:                 EVENTUAL — new posts appear in search within seconds, not ms
// Analytics / dashboards:       EVENTUAL — yesterday's report being 2 seconds old is fine

// ── CRDT — when you need concurrent writes without coordination ──
// Conflict-free Replicated Data Type
// Data structures that can be merged deterministically — no conflicts possible
// Example: G-Counter (grow-only counter) for like counts that span datacentres
//   Each node increments its own slot. Total = sum of all slots. No conflict possible.
//   Used by: Riak, Redis CRDTs, collaborative editing tools
// When to mention: when you have multi-primary writes (both datacentres accept writes)
//                  and you need the data to converge without a single arbiter`
    },

    // ── Trade-offs phase ──
    {
      speaker: "you",
      text: `"The trade-offs phase at the end — what's the right way to handle that? I always feel like I'm just listing things I didn't build."`
    },
    {
      speaker: "raj",
      text: `"That's exactly what you should be doing, but with intent. A senior engineer always knows what they didn't build and why. The trade-offs phase is your opportunity to show you're aware of the limitations of what you designed, what you'd add next, and what you'd do differently if the constraints changed. It turns a 'here's my design' into 'here's my design and I understand its edges.'"`
    },
    {
      speaker: "you",
      text: `"What should I cover?"`
    },
    {
      speaker: "raj",
      text: `"Three things. What explicit trade-offs did you make — what did you sacrifice for what benefit? What did you intentionally descope that a real system would need? And what breaks first if scale increases by ten times? That last question is the most revealing. If you can point to the first bottleneck in your own system, you understand it. If you can't, the interviewer wonders if you built it from a template."`
    },
    {
      speaker: "you",
      text: `"What if the interviewer suggests a completely different approach at the end? Like, 'what if we used Kafka instead of Redis for the feed?'"`
    },
    {
      speaker: "raj",
      text: `"Don't defend your design like it's precious. Think through their suggestion out loud. 'Kafka would give us durability on the event stream and make it easier to replay events for new features — the trade-off is operational complexity and higher latency on the fan-out. For our current scale, Redis sorted sets are simpler and fast enough. At ten times the write volume, Kafka starts to look more attractive because...' That kind of response shows you understand both options and can evaluate new information. Stubbornly defending your original design looks like ego, not engineering."`
    },
    {
      type: "code",
      text: `// ── Trade-offs phase — what to say and how to structure it ──

// ── 1. State the explicit trade-offs you made ──
//
// "I chose Redis sorted sets for the feed over a database query because reads are the hot path
//  and we need sub-millisecond response. The cost is that feed data is not durable — if Redis
//  loses data, users' feeds need to be rebuilt from the posts table. For a feed, that's
//  acceptable. For financial data, it wouldn't be."
//
// "I chose a 302 redirect over 301 because analytics requires us to count every click.
//  301 would offload repeat visits to the browser cache and we'd lose that data.
//  The cost is higher server load — every click hits our infrastructure."
//
// "I chose base62 of auto-increment over random generation because it's simpler and
//  guaranteed unique without retries. The cost is that codes are sequential and therefore
//  enumerable. For a product that doesn't have security requirements around URL discovery,
//  this is fine. If we needed to hide the existence of URLs, I'd switch to random generation."

// ── 2. Name what you descoped ──
//
// "Things I'd add in a real system:
//  - User accounts and authentication — links owned by a user, manageable via a dashboard
//  - Custom slugs — users can choose their own short code (with collision handling)
//  - Link expiry — TTL on short URLs, important for compliance and spam prevention
//  - Spam and abuse detection — a URL shortener is a tool for disguising phishing links
//  - Detailed analytics — geographic breakdown, device type, referrer, time-series click data
//  - Rate limiting on the shorten endpoint — prevent bulk shortening abuse"

// ── 3. Identify the first bottleneck at 10× scale ──
//
// Current design handles: 10,000 redirects/sec, 100 writes/sec
// At 10× (100,000 redirects/sec, 1,000 writes/sec):
//
// First bottleneck: the single Redis primary
//   → 100,000 GET/sec is within Redis's range (~100k ops/sec single node)
//   → but at 10× write volume the fan-out worker becomes a bottleneck
//   Fix: Redis Cluster — shard cache by code hash prefix
//
// Second bottleneck: the database primary on writes
//   → 1,000 writes/sec is fine for Postgres
//   → but at 10× again (10,000 writes/sec) we'd hit limits
//   Fix: switch to DynamoDB (writes distributed by partition key) or Postgres with sharding
//
// Third bottleneck: DNS and CDN cold cache
//   → If a URL goes viral, the CDN might not have it cached yet
//   → First million requests after creation all miss the CDN and hit your servers
//   Fix: cache-warming — pre-populate CDN on URL creation for anticipated viral content

// ── 4. How to respond to alternative suggestions ──
//
// Interviewer: "What if we put Kafka in front of the database writes?"
//
// Good response:
// "That's interesting — an event log in front of the DB gives us a few things.
//  The write is durable as soon as it hits Kafka, so we can return success to the user
//  faster. The consumer writes to the DB asynchronously. The downside is the redirect
//  won't work until the consumer has caught up — there's a window after creation where
//  the short URL 404s. For a URL shortener, that's probably not acceptable — users expect
//  the link to work immediately after creation. So I'd keep the synchronous write to the
//  DB on the creation path, but I might use Kafka for the analytics fan-out — writing
//  click events to a stream that gets aggregated asynchronously."
//
// What makes this answer good:
// - You engaged with the idea rather than dismissing it
// - You identified the specific failure mode it introduces
// - You found the part of the suggestion that IS a good fit`
    },

    // ── Talking while designing ──
    {
      speaker: "you",
      text: `"One thing I struggle with is talking while I design. I go quiet when I'm thinking and I can tell the interviewer is getting uncomfortable."`
    },
    {
      speaker: "raj",
      text: `"Silence is the biggest signal you can send in a system design interview, and it's almost always a bad one. The interviewer can't evaluate what they can't hear. They don't know if you're thinking deeply or completely stuck. Narrate everything — including uncertainty. 'I'm not sure whether to use Redis or Memcached here — let me think through the trade-offs for a second.' That single sentence tells the interviewer you know there's a choice to be made and you're reasoning about it. That's better than the right answer delivered in silence."`
    },
    {
      speaker: "you",
      text: `"What if I say something wrong while narrating?"`
    },
    {
      speaker: "raj",
      text: `"Catch it and correct it. 'Actually, wait — I said 301 redirect but that would prevent us from counting clicks. Let me change that to 302.' Showing that you can self-correct in real time is a positive signal, not a negative one. The only wrong move is to not notice and keep building on a flawed assumption. Real engineers change their minds when they encounter new information. The interview is simulating that."`
    },
    {
      speaker: "you",
      text: `"What if the interviewer asks something I genuinely don't know?"`
    },
    {
      speaker: "raj",
      text: `"Say you don't know and reason toward an answer. 'I haven't worked with Cassandra's tombstone behaviour directly, but based on how LSM trees work, I'd expect...' That sentence is worth five times 'I don't know.' You demonstrated that you understand the underlying model well enough to reason from first principles. That's what senior engineers do. Nobody expects you to have memorised every database's internals. They expect you to be able to think."`
    },
    {
      type: "code",
      text: `// ── Talking while designing — phrases that keep the conversation alive ──

// ── Framing the problem ──
"Let me start by making sure I understand what we're building..."
"Before I draw anything, I want to clarify a few things..."
"I'm going to assume X for now — let me know if that doesn't match your expectations."

// ── Narrating your reasoning ──
"The reason I'm adding a cache here is..."
"I'm thinking about the write path first because that's where the interesting problem is..."
"This is a read-heavy system, which pushes me toward..."
"My concern with this approach is... so instead I'm going to..."

// ── Handling uncertainty ──
"I want to think about this for a second — I'm weighing X against Y..."
"I haven't used this in production but based on how I understand it, I'd expect..."
"There are a couple of ways to do this — let me talk through the trade-offs..."
"I'm not 100% sure about the exact numbers here but the order of magnitude is..."

// ── Self-correcting ──
"Actually, wait — I think I got that wrong. If I use X then Y breaks because..."
"Let me revise that — I said Z but that doesn't account for..."
"On reflection, this is a better approach because..."

// ── Inviting collaboration ──
"Does that match how you're thinking about the scale?"
"Is there a particular component you'd like to go deeper on?"
"I could go in a few directions here — is there a part that's most interesting to you?"

// ── Handling curveballs ──
"That's a good point — I hadn't considered that. If that's a requirement, it changes..."
"That approach would also work. The trade-off compared to what I have is..."
"You're right that this breaks at that scale. The fix would be..."

// ── Things to never say ──
// "I don't know" with nothing after it
// "That's how it works" with no explanation of why
// "We'd just use Kafka" without saying what Kafka gives you
// "This is how Netflix does it" — cite patterns, not companies
// Silence for more than 30 seconds without narrating`
    },

    // ── Common system design prompts ──
    {
      speaker: "you",
      text: `"Can we go through some common prompts quickly? Like the patterns that keep coming up so I know where to focus."`
    },
    {
      speaker: "raj",
      text: `"Every system design prompt is one of five archetypes. Storage systems — design S3, Dropbox, a CDN. These are about chunking, metadata, replication, and consistency. Feed systems — design Twitter, Instagram, Facebook News Feed. These are about fan-out, ranking, and the read/write trade-off. Search systems — design Google Search, type-ahead. These are about indexing, inverted indexes, and ranking. Communication systems — design WhatsApp, Slack. These are about message delivery guarantees, presence, and websockets. Rate limiting and access control — often standalone prompts. Know the five archetypes and you have a mental model for any prompt."`
    },
    {
      speaker: "you",
      text: `"Are there things that come up in almost every design regardless of the prompt?"`
    },
    {
      speaker: "raj",
      text: `"Five things. Load balancing — always there, usually not the interesting part. Caching — always there, often the interesting part. Database choice — always there, always requires justification. Message queues — whenever you need async processing or decoupling. CDN — whenever you have static assets or global latency requirements. Know those five cold, and you have the vocabulary for every prompt."`
    },
    {
      type: "code",
      text: `// ── The five archetypes and their key problems ──

// ── Archetype 1: Storage system (S3, Dropbox, CDN) ──
// Key problems:
//   File chunking: split large files into chunks (e.g. 64MB) → upload/resume individually
//   Metadata store: separate DB for file metadata (owner, name, size, chunk locations)
//   Deduplication: same file content = same hash → store once (content-addressed storage)
//   Consistency: file must be fully uploaded before it's accessible
//   CDN: serve from edge nodes close to the user — origin is the source of truth
// Key components: chunk storage (S3), metadata DB (Postgres), CDN, upload service, sync client

// ── Archetype 2: Feed system (Twitter, Instagram) ──
// Key problems:
//   Fan-out on write vs read: covered above — use hybrid for celebrity accounts
//   Feed ranking: simple reverse-chronological vs ML ranking model (different system)
//   Real-time updates: long polling, SSE, or WebSocket for live feed updates
//   Media storage: images/video go to CDN — feed only stores references, not blobs
// Key components: post service, fan-out worker, feed store (Redis sorted set), media CDN

// ── Archetype 3: Search (Google, type-ahead, product search) ──
// Key problems:
//   Inverted index: term → list of document IDs containing that term
//   Crawling / indexing: how new content gets into the index (batch or real-time)
//   Ranking: TF-IDF, PageRank, ML — how results are ordered
//   Type-ahead: Trie data structure or prefix index in Redis sorted sets
//   Freshness: new content must appear in search within seconds (streaming index update)
// Key components: crawler, indexer, inverted index (Elasticsearch), ranking service, query parser

// ── Archetype 4: Communication (WhatsApp, Slack) ──
// Key problems:
//   Message delivery: at-least-once vs exactly-once — what happens if client disconnects?
//   Ordering: messages must arrive in order per conversation — sequence IDs per channel
//   Presence: is the user online right now? — heartbeat + Redis TTL
//   Push notifications: APNs / FCM for offline users
//   WebSocket: persistent bidirectional connection — horizontal scaling needs sticky sessions
//               or a pub/sub layer (Redis pub/sub, or a message queue per channel)
// Key components: connection service (WebSocket), message store (Cassandra), presence service,
//                 notification service, message queue per channel

// ── Archetype 5: Rate limiting / access control ──
// Key problems:
//   Algorithm choice: fixed window, sliding window, token bucket (covered above)
//   Distributed enforcement: multiple API servers — counters must be shared (Redis)
//   Granularity: per-user, per-IP, per-endpoint, or per-API-key
//   DDoS: rate limiting is not the same as DDoS protection — mention WAF / Cloudflare separately
// Key components: Redis counter store, API gateway middleware, alerting on sustained limit hits

// ── Components that appear in every design ──
//
//  Load Balancer
//    L4: routes by IP/port — fast, no application-level awareness
//    L7: routes by path, header, method — slower, smarter (use this for most APIs)
//    Sticky sessions: route same user to same server — needed for WebSocket, stateful apps
//
//  Message Queue (Kafka, SQS, RabbitMQ)
//    Use when: decoupling services, async processing, fan-out to multiple consumers
//    Kafka: high-throughput, durable, replayable event log — use for data pipelines, fan-out
//    SQS: managed, simpler, good for task queues — use when you don't need replay
//    RabbitMQ: complex routing rules, low-latency task dispatch
//
//  CDN
//    Use when: static assets (JS, CSS, images), cacheable API responses, global latency
//    Cache invalidation: TTL-based or explicit purge on update
//    Edge caching: can cache entire redirect responses (301 only — 302 bypasses CDN cache)
//
//  Horizontal vs Vertical Scaling
//    Vertical: bigger machine — simple, no code changes, has a ceiling
//    Horizontal: more machines — requires stateless services, load balancer in front
//    Stateless design: API servers should hold no session state — session in Redis, not in memory`
    },

    // ── Closing ──
    {
      speaker: "you",
      text: `"That's a lot to hold in my head for 45 minutes."`
    },
    {
      speaker: "raj",
      text: `"You don't hold all of it. You hold the process. Requirements, estimation, high-level, deep dive, trade-offs. Five phases. Keep your mental clock. The content — caching, database choice, fan-out, rate limiting — comes from having thought about real problems. The more systems you've built or thought through deeply, the easier the interview feels. But even without that, the process gets you further than any list of patterns."`
    },
    {
      speaker: "you",
      text: `"What's the thing that most separates the candidates who pass from the ones who don't?"`
    },
    {
      speaker: "raj",
      text: `"The ones who pass know what they built and why. They can tell you what breaks first, what they'd change if the scale doubled, and what they gave up to get what they have. They designed a system and understood it. The ones who don't pass drew boxes and labelled them. There's a difference between a design and an architecture diagram. The interview is looking for the former."`
    },

    {
      type: "summary",
      points: [
        "The system design interview evaluates process and communication, not a single correct answer. The interviewer has seen every popular prompt dozens of times. What distinguishes candidates is whether they ask the right questions before designing, make trade-offs consciously rather than reciting patterns, narrate their reasoning out loud, and demonstrate understanding of the edges and limitations of their own design. Jumping straight to a solution looks junior even if the solution is technically sound.",
        "Use five phases with rough time allocations: requirements (10 min), estimation (5 min), high-level design (10 min), deep dive on the hard parts (15 min), trade-offs and wrap-up (5 min). Most candidates spend their entire time on high-level design and run out of time for the deep dive, which is where the interesting evaluation happens. Having a mental clock prevents this.",
        "Requirements come in two categories. Functional: what does the system do — the core user actions, what's explicitly out of scope, different user types, real-time vs eventual behaviour. Non-functional: scale (reads/sec, writes/sec, daily active users), latency targets, availability requirements, consistency model, data volume and growth rate, geographic distribution. Non-functional requirements drive the interesting architectural decisions. Missing them means designing the wrong system.",
        "Estimation anchors the design. Calculate reads per second, writes per second (and their ratio — it tells you everything about your caching strategy), total storage over five years (tells you whether you need a distributed store or a single Postgres instance), and peak load (three to five times average — design for this, not average). The point isn't precision — it's to catch architectural decisions that would be wildly wrong at the stated scale, and to identify where to focus in the deep dive.",
        "Draw the high-level design by tracing your core user flows, not by drawing all possible components upfront. Start with client → load balancer → API server → database. Then walk through each core operation and add components only when a flow requires them. Define the API endpoints and data model at this stage — just the core entities and their key fields, not a full schema. Every box on the diagram should be justified by a requirement or a flow, not added preemptively.",
        "The deep dive is where the interview is actually decided. Pick the component with the most non-obvious failure mode — usually ID generation, the cache strategy, the consistency model, or the hot path under peak load. Walk through multiple approaches with explicit trade-offs for each. The interviewer is listening for: do you know why your design works, what breaks it, and what alternative approaches exist. Going two or three levels deep on one hard problem is more impressive than shallowly covering every component.",
        "Caching decisions require more than 'I'd use Redis.' Name the eviction policy and justify it against the access pattern. State the TTL and explain why. Explain which write strategy you're using (write-through, write-back, write-around) and why. Describe the thundering herd problem and how your design addresses it — cache lock or probabilistic early expiration. Target and monitor cache hit rate (95%+ for most systems). Cache sizing should come from your estimation: the working set (top 20% of data that gets 80% of traffic) must fit comfortably in memory.",
        "Database choice requires justification from access patterns, not familiarity. Relational databases excel at complex queries, joins, and ACID transactions — vertical scaling plus read replicas handles most web apps. Key-value stores (DynamoDB, Redis) excel at point lookups with guaranteed low latency. Document stores (MongoDB) fit variable schema and hierarchical data. Wide-column stores (Cassandra) handle massive write throughput with multi-region replication. Search engines (Elasticsearch) are secondary indexes, not primary stores. State the trade-offs explicitly rather than just naming a technology.",
        "Consistency is a requirement-driven decision, not a default. Strong consistency is required when stale data causes real harm: financial balances, inventory counts, authentication token revocation. Read-your-own-writes consistency is right for user profile updates where the user must immediately see their own changes but others can wait. Eventual consistency is appropriate when the cost of staleness is low: like counts, follower counts, search index updates, analytics. The CAP theorem is relevant when designing systems that must span data centres and must choose behaviour during a network partition — don't invoke it for single-region systems.",
        "The trade-offs phase demonstrates engineering maturity. Cover three things: the explicit trade-offs you made and what you sacrificed for what benefit; what you intentionally descoped that a real system would need, and why; and what breaks first if the scale increases by ten times. The third question is the most revealing — if you can identify your own system's first bottleneck, you understand it. When the interviewer suggests an alternative approach, engage with it rather than defending your design. Identify what the alternative gains, what it costs, and whether that trade-off would be appropriate given the requirements."
      ]
    }
  ]
};

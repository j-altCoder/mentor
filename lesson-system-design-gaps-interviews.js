// ─────────────────────────────────────────────────────────────────
//  LESSON: System Design — The Gaps
//  Category: Career & Interview Prep
// ─────────────────────────────────────────────────────────────────

const LESSON_SYSTEM_DESIGN_GAPS = {
  category: "Career & Interview Prep",
  tag: "System Design Gaps",
  title: "The Parts Everyone Skips",
  intro: "You've done the framework. Requirements, estimation, high-level design, deep dive, trade-offs. You know the URL shortener inside out. But the interview loop is for a staff position and the prompt is 'Design a distributed key-value store.' You froze. Raj is not surprised.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"I think I'm okay on the surface-level stuff now. Caching, database choice, fan-out. But some questions just go to a different level and I don't have the vocabulary for it. The distributed systems questions specifically."`
    },
    {
      speaker: "raj",
      text: `"Give me an example of one that tripped you up."`
    },
    {
      speaker: "you",
      text: `"Someone asked me how I'd handle leader election if the primary database node goes down. I said 'you'd promote a replica' and then just stopped. I didn't know how that actually works."`
    },
    {
      speaker: "raj",
      text: `"That's the gap between knowing what components exist and understanding how they behave under failure. The surface answer — promote a replica — is correct. The real question is: who decides which replica gets promoted? How do they agree? What happens if two replicas both think they should be leader? That's where distributed systems theory lives, and that's what staff-level interviews are testing."`
    },
    {
      speaker: "you",
      text: `"Is this stuff actually used in practice or is it purely interview theory?"`
    },
    {
      speaker: "raj",
      text: `"Every database you've ever used runs this. Postgres streaming replication, Redis Sentinel, MongoDB replica sets, Kafka's controller election — they all implement variants of the same ideas. You use the results of distributed systems theory every day. The interview is checking whether you understand what's underneath the tools you reach for."`
    },

    // ── Distributed systems fundamentals ──

    // ── Consensus ──
    {
      speaker: "you",
      text: `"Start with the leader election thing. How does it actually work?"`
    },
    {
      speaker: "raj",
      text: `"The problem is called consensus. You have N nodes. They need to agree on something — who the leader is, whether a transaction committed, what the next value in a log is. The hard part: any of them can crash at any time, and messages between them can be delayed or lost. How do you get agreement under those conditions?"`
    },
    {
      speaker: "you",
      text: `"You'd vote? Whichever node gets the most votes becomes leader?"`
    },
    {
      speaker: "raj",
      text: `"Majority vote is the right instinct. The classic algorithm is Paxos. The practical one everyone actually implements is Raft. Raft is designed to be understandable — the paper literally says that's the goal. The core idea: nodes are in one of three states at any time. Follower, candidate, or leader. There's exactly one leader at a time. The leader sends heartbeats to followers. If a follower stops hearing heartbeats for a random timeout period, it assumes the leader is dead and promotes itself to candidate. It requests votes. If it gets votes from a majority of nodes — more than half — it becomes the new leader and starts sending heartbeats. The randomised timeout is how you break ties: two candidates are unlikely to start an election at exactly the same moment."`
    },
    {
      speaker: "you",
      text: `"What's the majority requirement for? Why not just whoever gets the first vote?"`
    },
    {
      speaker: "raj",
      text: `"Split brain. Imagine five nodes. The network partitions — nodes 1 and 2 can't talk to nodes 3, 4, and 5. Both sides might try to elect a leader. If you allow any node that gets one vote to become leader, you get two leaders simultaneously. Both accept writes. When the partition heals, you have two diverged histories and no way to reconcile them cleanly. Requiring a majority — three out of five — means only one side of the partition can form a quorum. The minority side is leaderless and refuses writes until the partition heals. You sacrifice availability on the minority side to preserve consistency everywhere."`
    },
    {
      speaker: "you",
      text: `"So if I have five nodes and two go down, the system still works?"`
    },
    {
      speaker: "raj",
      text: `"Yes. Three nodes can still form a majority. If three go down, you can't form a majority of five — the system stops accepting writes to stay consistent. That's the fault tolerance formula: you can lose at most (N-1)/2 nodes and keep going. Five nodes tolerates two failures. Seven nodes tolerates three. This is why you almost always deploy in odd numbers — three, five, seven. Even numbers don't improve fault tolerance. Four nodes can only lose one before you lose the majority, same as three nodes. The extra node bought you nothing."`
    },
    {
      type: "analogy",
      text: "Consensus in distributed systems is like a jury reaching a verdict when some jurors are unreachable. The court doesn't need all twelve to agree — it needs a majority. If the building loses power and some jurors are stuck in an elevator, the remaining jurors can still reach a verdict if there are enough of them. If too many are stuck, the trial is declared a mistrial — the system would rather admit it can't decide than produce a wrong verdict. Raft works the same way. A majority of nodes can always make forward progress. A minority cannot."
    },
    {
      type: "code",
      text: `// ── Raft consensus — the concepts you need for interviews ──
//
// ── Node states ──
// Follower:   passive — accepts writes from leader, forwards to leader if contacted directly
// Candidate:  running for election — has stopped hearing from leader
// Leader:     exactly one per term — handles all writes, sends heartbeats
//
// ── Terms ──
// Time is divided into terms — monotonically increasing integers
// Each term begins with an election. If a candidate wins, it leads for the rest of the term.
// If the election fails (split vote), a new term begins and another election starts.
// Terms are how nodes detect stale information: "I got a message from term 3,
// but I'm in term 5 — this message is from an old leader, ignore it."
//
// ── Log replication — how writes work ──
// Client sends write to leader
// Leader appends entry to its local log (uncommitted)
// Leader sends AppendEntries RPC to all followers
// Once a majority of nodes have written the entry to their log → leader commits it
// Leader responds to client: write is committed
// Leader notifies followers in next heartbeat: entry is committed, apply to state machine
//
// ── Key guarantee: committed entries are never lost ──
// A leader can only be elected if it has the most up-to-date log of any majority
// This means: any entry that was committed by an old leader
//             is guaranteed to be in the new leader's log
//             → you never lose a committed write, even across leader failures
//
// ── Fault tolerance by cluster size ──
// Nodes:  3  → tolerates 1 failure  (majority = 2)
// Nodes:  5  → tolerates 2 failures (majority = 3)
// Nodes:  7  → tolerates 3 failures (majority = 4)
// Formula: tolerate ⌊N/2⌋ failures
// Always deploy in odd numbers — even numbers don't improve tolerance
//
// ── Real systems that use Raft or Raft-like consensus ──
// etcd         → Kubernetes uses this for all cluster state
// CockroachDB  → distributed SQL built on Raft per range
// TiKV         → distributed key-value store under TiDB
// Kafka KRaft  → Kafka's replacement for ZooKeeper, uses Raft
// Consul       → service discovery, uses Raft for consistency
//
// ── Real systems that use Paxos-like consensus ──
// Google Spanner   → TrueTime + Paxos for external consistency
// Google Chubby    → distributed lock service (inspired ZooKeeper)
// Apache ZooKeeper → used by older Kafka, HBase for coordination
//
// ── What to say in an interview ──
// "For leader election I'd use an existing consensus system — etcd or ZooKeeper —
//  rather than implementing Raft from scratch. Both expose a simple API for
//  distributed locks and leader election. My service nodes try to acquire a lock
//  in etcd. The one that acquires it is the leader. If it crashes, the lock TTL expires
//  and another node acquires it. I don't need to implement the consensus algorithm —
//  I need to use one correctly."
//
// ── Leader election with etcd (the practical implementation) ──
//
// Leader tries to PUT /election/leader with a lease (TTL)
// If key doesn't exist → this node is leader, renew lease via keepalive
// If key exists → this node is follower, watches /election/leader for changes
// If leader crashes → lease expires → key deleted → followers race to acquire it
//
// const lease  = await etcd.lease(10);           // 10-second TTL
// const result = await lease.put('/election/leader').value(nodeId).onlyIf({ version: 0 });
// if (result.succeeded) { becomeLeader(); }
// else                  { becomeFollower(); watchForLeaderChange(); }`
    },

    // ── Distributed transactions ──
    {
      speaker: "you",
      text: `"What about distributed transactions? Like — transferring money between two bank accounts that live on different database shards. How do you make that atomic?"`
    },
    {
      speaker: "raj",
      text: `"The naive approach fails immediately. You debit one account. You try to credit the other. The second database is down. You've taken money out of one account and put it nowhere. What do you do?"`
    },
    {
      speaker: "you",
      text: `"Roll back the debit?"`
    },
    {
      speaker: "raj",
      text: `"How? The first database committed successfully. It doesn't know the second one failed. You'd need to issue a compensating transaction — a separate write that reverses the first one. That's not a rollback. That's a saga. The fundamental problem: there's no global transaction log across two independent databases. Each database has its own ACID guarantees but they can't jointly guarantee atomicity without coordination."`
    },
    {
      speaker: "you",
      text: `"So what's two-phase commit?"`
    },
    {
      speaker: "raj",
      text: `"A protocol for cross-database atomicity. A coordinator asks all participants: 'can you commit this transaction?' Each participant votes yes or no and writes to its own log that it's prepared to commit — but doesn't commit yet. If all vote yes, the coordinator sends commit. Everyone commits. If any vote no or don't respond, the coordinator sends abort. Everyone rolls back. The problem: after participants vote yes, they're locked waiting for the coordinator's decision. If the coordinator crashes at that exact moment, participants are stuck holding locks indefinitely. That's the blocking problem."`
    },
    {
      speaker: "you",
      text: `"So 2PC is not used in practice?"`
    },
    {
      speaker: "raj",
      text: `"It's used, but carefully, and mostly within a single system's control — not across external services. The alternative for cross-service scenarios is the saga pattern. Each step in the transaction is a local operation. If a step fails, you run compensating transactions for all previous steps. No distributed lock, no coordinator. The trade-off: you don't have atomicity in the ACID sense — there's a window where the system is in a partially completed state. For money transfers, this means the debit is visible before the credit lands. You handle that with careful compensating logic and idempotency."`
    },
    {
      type: "code",
      text: `// ── Distributed transactions — three patterns ──

// ── Pattern 1: Two-Phase Commit (2PC) ──
// Use when: you need strong atomicity, you control all participants, blocking is acceptable
// Avoid when: participants are external services, high availability is required

// Phase 1: Prepare
// Coordinator → Participant A: "prepare to debit $100 from account 1"
//   Participant A: locks row, writes to WAL, responds "ready"
// Coordinator → Participant B: "prepare to credit $100 to account 2"
//   Participant B: locks row, writes to WAL, responds "ready"

// Phase 2: Commit (only if all voted ready)
// Coordinator → Participant A: "commit"  → A commits, releases lock
// Coordinator → Participant B: "commit"  → B commits, releases lock

// If coordinator crashes after Phase 1:
//   Participants are locked, waiting — this is the blocking problem
//   Recovery: new coordinator reads coordinator log, re-sends decision
//   Requires coordinator's log to be durable (it usually is)

// ── Pattern 2: Saga (choreography-based) ──
// Use when: cross-service transactions, long-running workflows, high availability needed
// Trade-off: eventual consistency — system is briefly in intermediate state

// Order service: debit inventory (local transaction) → publish "inventory.debited"
// Payment service: subscribes → charges card (local transaction) → publish "payment.charged"
// Shipping service: subscribes → create shipment (local transaction) → publish "shipment.created"

// Compensating transactions (run in reverse on failure):
const processOrder = async (orderId) => {
  const steps = [
    {
      execute:     () => inventoryService.reserve(orderId),
      compensate:  () => inventoryService.release(orderId),
    },
    {
      execute:     () => paymentService.charge(orderId),
      compensate:  () => paymentService.refund(orderId),
    },
    {
      execute:     () => shippingService.schedule(orderId),
      compensate:  () => shippingService.cancel(orderId),
    },
  ];

  const completed = [];
  try {
    for (const step of steps) {
      await step.execute();
      completed.push(step);
    }
  } catch (err) {
    // Run compensating transactions in reverse
    for (const step of completed.reverse()) {
      await step.compensate().catch(e => logger.error(e, 'compensate.failed'));
      // Compensation can also fail — log it, alert, require manual intervention
      // This is why idempotency on compensating transactions is critical
    }
    throw err;
  }
};

// ── Pattern 3: Outbox pattern — reliable event publishing ──
// The gap between "write to DB" and "publish to queue" is where data is lost
// If your service crashes between the two, the write happened but the event didn't publish

// Wrong way:
const createOrder = async (order) => {
  await db.orders.create(order);          // commits
  await queue.publish('order.created');   // crashes here → event never sent
};

// Right way: write the event to the DB in the same transaction as the business data
const createOrderSafe = async (order) => {
  await db.transaction(async (trx) => {
    await trx.orders.create(order);
    await trx.outbox.create({             // same transaction → atomic
      event_type: 'order.created',
      payload:    JSON.stringify(order),
      created_at: new Date(),
      published:  false,
    });
  });
  // A separate outbox worker polls for unpublished events and sends them
  // Worker marks published=true after successful queue send
  // Idempotency key on the event prevents duplicate processing if worker retries
};

// Outbox worker
setInterval(async () => {
  const pending = await db.outbox.findAll({ published: false, limit: 100 });
  for (const event of pending) {
    await queue.publish(event.event_type, JSON.parse(event.payload));
    await db.outbox.update({ id: event.id }, { published: true });
  }
}, 1000);`
    },

    // ── Consistent hashing ──
    {
      speaker: "you",
      text: `"Consistent hashing — I've heard this comes up a lot when talking about sharding and I nod along but I don't actually know what it means."`
    },
    {
      speaker: "raj",
      text: `"Tell me the naive way to shard first. You have ten database nodes and a key. How do you decide which node stores it?"`
    },
    {
      speaker: "you",
      text: `"Hash the key, modulo ten. hash(key) % 10."`
    },
    {
      speaker: "raj",
      text: `"Works perfectly until you add an eleventh node. Now the modulus changes. hash(key) % 11 maps almost every key to a different node than hash(key) % 10 did. You have to move nearly all your data to rebalance. For a large database, that's weeks of migration and your system is partially broken the whole time. Consistent hashing solves this. Instead of a modulo ring, you have a hash ring — a circle of positions from 0 to 2^32. Each node gets placed at one or more positions on that ring. A key maps to the first node clockwise from its hash position. Adding a new node only moves the keys between it and its predecessor on the ring. Typically one-Nth of all keys. Removing a node moves those keys to its successor. Everything else is untouched."`
    },
    {
      speaker: "you",
      text: `"What are virtual nodes?"`
    },
    {
      speaker: "raj",
      text: `"Without virtual nodes, each physical node occupies one position on the ring. The distribution of keys is statistically even on average but can be lumpy in practice — one node might get 30% of the keys, another gets 5%. Virtual nodes solve this: each physical node occupies multiple positions on the ring, say 150 positions. The key distribution across the ring becomes much smoother because each physical node takes a share of many regions rather than owning one large arc. When you add a node, it claims some virtual positions from many existing nodes — a small, smooth redistribution rather than one node bearing the entire burden."`
    },
    {
      type: "code",
      text: `// ── Consistent hashing — why it matters and how it works ──

// ── The problem with naive sharding ──
// 10 nodes: hash(key) % 10
// Add 1 node → hash(key) % 11
// Almost every key maps to a different node
// You must move ~90% of data to rebalance → weeks of migration
//
// ── The hash ring ──
// Positions: 0 to 2^32 - 1, arranged in a circle
// Each node is placed at hash(node_id) on the ring (one or more positions)
// Each key maps to: hash(key) → walk clockwise → first node you hit
//
// Add a node: it claims the arc between itself and its predecessor
//   → only keys in that arc need to move → 1/N keys on average
// Remove a node: its keys move to its successor → only that node's keys move
//
// ── Minimal implementation ──
import crypto from 'crypto';

class ConsistentHashRing {
  constructor(virtualNodes = 150) {
    this.virtualNodes = virtualNodes;
    this.ring         = new Map();   // position → nodeId
    this.sortedKeys   = [];          // sorted ring positions for binary search
  }

  _hash(key) {
    return parseInt(crypto.createHash('md5').update(key).digest('hex').slice(0, 8), 16);
  }

addNode(nodeId) {
  for (let i = 0; i < this.virtualNodes; i++) {
    const position = this._hash(\`\${nodeId}:vnode:\${i}\`);
    this.ring.set(position, nodeId);
  }
  this.sortedKeys = [...this.ring.keys()].sort((a, b) => a - b);
}

removeNode(nodeId) {
  for (let i = 0; i < this.virtualNodes; i++) {
    const position = this._hash(\`\${nodeId}:vnode:\${i}\`);
    this.ring.delete(position);
  }
  this.sortedKeys = [...this.ring.keys()].sort((a, b) => a - b);
}

  getNode(key) {
    if (this.ring.size === 0) throw new Error('Ring is empty');
    const hash = this._hash(key);

    // Binary search for first ring position >= hash
    let lo = 0, hi = this.sortedKeys.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sortedKeys[mid] < hash) lo = mid + 1;
      else hi = mid;
    }
    // Wrap around if hash is greater than all positions
    const position = this.sortedKeys[lo] >= hash ? this.sortedKeys[lo] : this.sortedKeys[0];
    return this.ring.get(position);
  }
}

// ── Usage ──
const ring = new ConsistentHashRing(150);
ring.addNode('node-1');
ring.addNode('node-2');
ring.addNode('node-3');

ring.getNode('user:12345')   // → 'node-2' (deterministic)
ring.getNode('user:99999')   // → 'node-1'

ring.addNode('node-4');
ring.getNode('user:12345')   // → might still be 'node-2', or moved to 'node-4'
                              // Only keys in node-4's new arc moved — ~25% of all keys

// ── Where consistent hashing is used in production ──
// Amazon DynamoDB:   partitions data across storage nodes using consistent hashing
// Apache Cassandra:  each row has a partition key → hashed to a token on the ring
//                    each node owns a token range → data is distributed accordingly
// Redis Cluster:     16,384 hash slots distributed across nodes — a simpler variant
// Memcached clients: client-side consistent hashing for key → server mapping
// CDN edge routing:  route request to the edge node 'closest' on the hash ring
//                    ensures the same URL always hits the same cache node`
    },

    // ── Networking fundamentals ──
    {
      speaker: "you",
      text: `"Networking is another one. I use HTTP every day but if someone asked me to explain what actually happens when a browser makes a request, I'd struggle past 'DNS lookup, TCP handshake'."`
    },
    {
      speaker: "raj",
      text: `"What happens after the TCP handshake?"`
    },
    {
      speaker: "you",
      text: `"The browser sends the HTTP request? And then gets the response back?"`
    },
    {
      speaker: "raj",
      text: `"Right. And in HTTP/1.1, what's the problem?"`
    },
    {
      speaker: "you",
      text: `"I don't know."`
    },
    {
      speaker: "raj",
      text: `"One request per TCP connection at a time — head-of-line blocking. The browser opens the connection, sends request one, waits for the full response, then sends request two. A modern web page loads sixty-odd resources — JavaScript, CSS, images. In HTTP/1.1 you'd need sixty sequential round trips, or you open multiple parallel connections, which is wasteful. HTTP/2 fixes this with multiplexing — multiple requests in flight simultaneously over a single TCP connection, each identified by a stream ID. But TCP itself still has head-of-line blocking at the transport layer — one lost packet blocks all streams until it's retransmitted. HTTP/3 moves to QUIC over UDP, which eliminates that. Each stream is independent even at the transport layer. A lost packet only blocks its own stream."`
    },
    {
      speaker: "you",
      text: `"When does this matter for system design?"`
    },
    {
      speaker: "raj",
      text: `"When you're talking about API design between services, or about real-time communication, or about CDN behaviour. If someone asks 'how do your mobile clients stay up to date?' and you say 'they poll every second,' a follow-up will be 'what's the overhead of that?' If you know that each HTTP/1.1 request has a TCP handshake cost — roughly one round trip time — you understand why long polling and WebSockets exist. They amortise or eliminate that overhead."`
    },
    {
      type: "code",
      text: `// ── Networking fundamentals — what interviewers actually test ──

// ── The full request lifecycle (what happens when you type a URL) ──
//
// 1. DNS resolution
//    Browser checks local cache → OS cache → recursive resolver → root nameserver
//    → TLD nameserver → authoritative nameserver → returns IP
//    TTL on DNS records: low TTL = fast failover, high cost (more queries)
//                        high TTL = cheap, slow to propagate changes
//    In system design: use low TTL (60s) when you need rapid failover (active-passive setup)
//
// 2. TCP handshake (3 messages)
//    Client → SYN → Server
//    Server → SYN-ACK → Client
//    Client → ACK → Server
//    Cost: 1 full round trip before any data is sent
//    RTT examples: same datacenter ~0.5ms | cross-US ~40ms | US-Europe ~80ms
//
// 3. TLS handshake (for HTTPS, on top of TCP)
//    TLS 1.2: 2 additional round trips after TCP (expensive)
//    TLS 1.3: 1 additional round trip — 0-RTT resumption for returning clients
//    Total for HTTPS (TLS 1.3): 2 round trips before first byte of actual data
//
// 4. HTTP request / response
//    HTTP/1.1: one request at a time per connection — browsers open 6 parallel connections
//    HTTP/2:   multiplexed streams over one connection — no per-connection limit
//              but TCP head-of-line blocking still exists (one lost packet blocks all streams)
//    HTTP/3:   QUIC over UDP — per-stream loss recovery, 0-RTT connection resumption
//              Google serves most traffic on HTTP/3 — reduces tail latency significantly
//
// ── TCP vs UDP — when to care ──
//
// TCP:
//   Guaranteed delivery (retransmission on loss)
//   Ordered delivery (no out-of-order processing)
//   Flow control and congestion control
//   Use for: anything where correctness matters — HTTP, database connections, file transfer
//
// UDP:
//   No delivery guarantee — packets may be lost, duplicated, or arrive out of order
//   No connection setup — send and forget
//   Much lower overhead per packet
//   Use for: latency-critical applications where a dropped packet is better than a delayed one
//     → Video streaming (a dropped frame is better than buffering)
//     → Online gaming (position updates — stale data is worse than no data)
//     → DNS queries (small, fire-and-forget, retry is cheap)
//     → WebRTC (real-time audio/video between browsers)
//     → QUIC (HTTP/3 — reliability implemented at application layer, not transport layer)
//
// ── WebSocket vs SSE vs Long Polling ──
//
// Long Polling:
//   Client sends request → server holds it open until there's data (or timeout)
//   Client immediately sends another request → repeat
//   Works over plain HTTP/1.1 — no special infrastructure
//   Overhead: one HTTP round trip per message received + reconnection on timeout
//   Use when: you need real-time updates and can't change infrastructure
//
// Server-Sent Events (SSE):
//   Client opens one HTTP connection → server streams events over it
//   One direction: server → client only
//   Automatic reconnection built into the browser EventSource API
//   Works over HTTP/2 naturally (multiple SSE streams over one connection)
//   Use when: server pushes updates, client never sends mid-stream messages
//             → live dashboards, notifications, feed updates, progress bars
//
// WebSocket:
//   Full-duplex: client and server send messages in both directions simultaneously
//   Single persistent TCP connection, low overhead after handshake
//   Not HTTP — requires special infrastructure support (load balancer must handle upgrades)
//   Use when: true bidirectional real-time communication
//             → chat, collaborative editing, multiplayer games, live trading UIs
//
// ── WebSocket scaling problem ──
// WebSocket connections are stateful — they're pinned to a specific server
// If you have 10 API servers and user A is on server 1, user B on server 3:
// User A sends a message to user B → server 1 gets it → server 1 doesn't have B's socket
//
// Fix: pub/sub layer between servers
//   Server 1 receives message from A → publishes to Redis pub/sub channel for B's room
//   Server 3 subscribes to that channel → receives message → delivers to B's socket
//
// const redis = new Redis();
// const sub   = new Redis();   // separate connection for subscriptions
//
// // On message from client:
// ws.on('message', async (data) => {
//   const { to, content } = JSON.parse(data);
//   await redis.publish(\`user:\${to}\`, JSON.stringify({ from: userId, content }));
// });
//
// // On connection, subscribe to this user's channel:
// sub.subscribe(\`user:\${userId}\`);
// sub.on('message', (channel, message) => {
//   ws.send(message);   // forward to the actual WebSocket
// });`
    },

    // ── Observability ──
    {
      speaker: "you",
      text: `"Observability — I know the word but in interviews I don't know what to say beyond 'we'd add logging and monitoring.'"`
    },
    {
      speaker: "raj",
      text: `"That's like saying 'we'd add testing' when asked about quality. It's not wrong, it's just not useful. Observability has three pillars — metrics, logs, and traces — and they answer different questions. Metrics tell you something is wrong. Logs tell you what happened. Traces tell you where."`
    },
    {
      speaker: "you",
      text: `"How do they differ in practice?"`
    },
    {
      speaker: "raj",
      text: `"Your dashboard shows p99 latency spiked at 3am. That's a metric — it tells you something is wrong. You look at your logs around that time and see a flood of 'connection timeout to database' errors. That's the what. You pull a trace for one of those slow requests and see that it spent 450 milliseconds waiting for a database query that normally takes 5 milliseconds. The query is on the order service, which called the inventory service, which hit the database. That's the where. Without all three you're debugging blind in different ways."`
    },
    {
      speaker: "you",
      text: `"In an interview, when does the interviewer actually want me to bring this up?"`
    },
    {
      speaker: "raj",
      text: `"Two moments. First, proactively — at the end of your high-level design, one sentence: 'I'd instrument this with metrics on every service boundary, distributed tracing with a trace ID propagated through every call, and alerting on p99 latency and error rate.' That signals operational maturity without taking time away from the design. Second, when they ask 'how do you know this is working in production?' — that's the direct invitation. Have a specific answer. Not 'monitoring' — what metrics, what thresholds, what alerts, what's your on-call rotation doing at 3am with this system."`
    },
    {
      type: "code",
      text: `// ── Observability — metrics, logs, traces, and alerting ──

// ── Pillar 1: Metrics ──
// Numerical measurements over time — aggregated, cheap to store, fast to query
// The four golden signals (Google SRE Book):
//
// Latency:      how long requests take — always track p50, p95, p99, not just average
//               average latency hides the tail — p99 is what your worst-off users experience
// Traffic:      requests per second — shows demand and helps size infrastructure
// Errors:       error rate (4xx, 5xx) — absolute count and percentage of total requests
// Saturation:   how full is your system — CPU%, memory%, queue depth, connection pool usage
//
// ── What to instrument at every service boundary ──
const requestDuration = new Histogram({
  name:    'http_request_duration_seconds',
  help:    'HTTP request duration',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],   // define buckets for histogram
});

const errorCounter = new Counter({
  name:    'http_errors_total',
  help:    'Total HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
});

// Express middleware — wraps every request
app.use((req, res, next) => {
  const end = requestDuration.startTimer({ method: req.method, route: req.route?.path });
  res.on('finish', () => {
    end({ status_code: res.statusCode });
    if (res.statusCode >= 400) {
      errorCounter.inc({ method: req.method, route: req.route?.path, status_code: res.statusCode });
    }
  });
  next();
});

// ── Pillar 2: Logs (structured) ──
// Already covered in MERN environments lesson — use pino, JSON output, log levels
// The critical addition for distributed systems: trace ID on every log line
// Without it: logs from ten services are ten unrelated streams
// With it: one grep across all services tells you the complete story of one request

// ── Pillar 3: Distributed Tracing ──
// A trace is a tree of spans — one span per operation across every service
// Each span records: service name, operation, start time, duration, parent span ID
// Visualised: a waterfall diagram showing exactly where time was spent
//
// Trace ID: generated at the entry point (API gateway or first service)
//           propagated as an HTTP header on every downstream call
//           every service creates child spans under the same trace ID
//
// ── OpenTelemetry — the standard (use this, not vendor-specific SDKs) ──
import { NodeSDK }           from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  instrumentations: [
    new HttpInstrumentation(),      // auto-instruments all outgoing/incoming HTTP
    new ExpressInstrumentation(),   // auto-instruments Express routes
    new MongoDBInstrumentation(),   // auto-instruments MongoDB queries
  ],
});
sdk.start();
// Every HTTP request, Express route, and MongoDB query now has a span automatically
// Spans are linked by trace ID → complete waterfall in your tracing backend (Jaeger, Tempo)

// ── Manual span for a critical section ──
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

const processPayment = async (orderId, amount) => {
  const span = tracer.startSpan('payment.charge', { attributes: { orderId, amount } });
  try {
    const result = await paymentGateway.charge({ orderId, amount });
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (err) {
    span.recordException(err);
    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
    throw err;
  } finally {
    span.end();
  }
};

// ── Alerting — what to alert on and what not to ──
//
// Alert on: symptoms, not causes
//   ✓ p99 latency > 500ms for 5 minutes    — users are experiencing slowness
//   ✓ error rate > 1% for 2 minutes        — users are seeing errors
//   ✓ payment success rate < 99%           — directly measuring business impact
//   ✗ CPU > 80%                            — not a problem by itself (might be normal load)
//   ✗ "database connection pool exhausted" — this is a cause, not a symptom
//
// Alert fatigue is real — too many noisy alerts → on-call ignores them
// Every alert should be: actionable, urgent, and symptomatic
//
// ── SLIs, SLOs, SLAs — the language of reliability ──
// SLI (Service Level Indicator): the metric you measure
//   → "99.5% of /api/orders requests complete in < 200ms"
// SLO (Service Level Objective): the target you commit to internally
//   → "We will maintain that SLI at 99.9% over a rolling 30-day window"
// SLA (Service Level Agreement): the contractual promise to customers
//   → "If availability drops below 99.5% we issue a credit" (always looser than SLO)
// Error budget: (1 - SLO) × time window = how much unreliability you can afford
//   → 99.9% SLO over 30 days = 43 minutes of allowed downtime/month
//   → When error budget is exhausted: no new features, only reliability work`
    },

    // ── Real-time systems and message queues ──
    {
      speaker: "you",
      text: `"Kafka — I keep seeing it in architecture diagrams and I say 'we'd use Kafka' like it's a magic word. I don't actually know what it gives me versus a regular database or a queue."`
    },
    {
      speaker: "raj",
      text: `"What's the difference between a queue and a log?"`
    },
    {
      speaker: "you",
      text: `"A queue — messages are consumed and deleted. A log... stays around?"`
    },
    {
      speaker: "raj",
      text: `"A log is an append-only, ordered, durable sequence of records. Kafka is a distributed log. The critical difference from a queue: messages are not deleted after consumption. They're retained for a configurable period — a week, a month, indefinitely. Multiple consumers can read the same messages independently, each tracking their own position in the log. Consumer A can be at message 1,000. Consumer B can be at message 500. If Consumer B crashes and restarts at message 450, Consumer A is unaffected. And here's the one that changes how you think about data: if you add a new consumer six months from now, it can replay the entire log from the beginning and reconstruct any derived state it needs."`
    },
    {
      speaker: "you",
      text: `"When would I use Kafka versus SQS?"`
    },
    {
      speaker: "raj",
      text: `"SQS is a task queue. A job goes in, one worker pulls it out and processes it, it's gone. Perfect for background jobs — sending emails, resizing images, processing payments. You don't need to replay them, you don't need multiple independent consumers reading the same message. Kafka is an event log. Something happened — an order was placed, a user signed up, a sensor reading arrived. You want to capture that event durably and let multiple downstream systems react to it independently, possibly at different speeds, possibly in the future. If you ever need to replay events, to add a new consumer after the fact, or to have more than one consumer process the same event — Kafka. If you need a reliable task queue — SQS."`
    },
    {
      speaker: "you",
      text: `"What's a consumer group and why do I need to know about it?"`
    },
    {
      speaker: "raj",
      text: `"A consumer group is how you scale consumption. A Kafka topic is divided into partitions. Each partition is consumed by exactly one consumer in a group at a time. If you have one partition and three consumers in a group, two of those consumers are idle — only one gets messages. If you have three partitions and three consumers, each consumer gets one partition and you process three times as fast. The maximum parallelism of a consumer group is bounded by the number of partitions. That's why partition count is a design decision you make upfront and can only increase, never decrease."`
    },
    {
      type: "code",
      text: `// ── Kafka — the concepts that matter for system design ──

// ── Core concepts ──
//
// Topic:      a named log — like a table but append-only and ordered
// Partition:  a topic is split into N partitions — unit of parallelism
//             messages with the same key always go to the same partition (ordering guarantee)
//             messages with no key are round-robined
// Offset:     a message's position within a partition — immutable, monotonically increasing
// Consumer group: a set of consumers that collectively consume a topic
//                 each partition is assigned to exactly one consumer in the group
//                 Kafka tracks the committed offset per consumer group per partition
// Retention:  messages are kept for a configurable time (default 7 days) regardless of consumption
//             consumers can reset their offset to replay old messages
//
// ── Partition key choice — why it matters ──
//
// Good partition key: user_id
//   → All events for a user go to the same partition → ordered per user
//   → Partitions distribute evenly if user IDs are random (UUID or high-cardinality ID)
//
// Bad partition key: country
//   → US traffic is 10× India traffic → one partition is overwhelmed, others are idle
//   → Hot partition problem — exactly what consistent hashing was designed to avoid
//
// Bad partition key: null (no key)
//   → Round-robin distribution is even, but ordering is lost
//   → Fine for truly independent events where order doesn't matter
//
// ── Producer: publishing events ──
import { Kafka } from 'kafkajs';

const kafka    = new Kafka({ clientId: 'order-service', brokers: ['kafka:9092'] });
const producer = kafka.producer({ idempotent: true });   // exactly-once semantics
await producer.connect();

const publishOrderCreated = async (order) => {
  await producer.send({
    topic: 'orders',
    messages: [{
      key:   order.userId,           // partition key — all orders for a user go to same partition
      value: JSON.stringify(order),
      headers: { traceId: getTraceId() },
    }],
  });
};

// ── Consumer: processing events ──
const consumer = kafka.consumer({ groupId: 'notification-service' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const order = JSON.parse(message.value.toString());

    try {
      await sendOrderConfirmationEmail(order);
      // Offset is committed automatically after eachMessage resolves
      // If this throws, the message is retried — make your handler idempotent
    } catch (err) {
      logger.error({ err, orderId: order.id }, 'notification.failed');
      // Dead letter queue for messages that keep failing
      await dlqProducer.send({ topic: 'orders.dlq', messages: [message] });
    }
  },
});

// ── Kafka vs SQS vs RabbitMQ — decision guide ──
//
// Use Kafka when:
//   → Multiple independent consumers need the same events (fan-out without coupling)
//   → Event replay is valuable — audit log, rebuilding a read model, adding new consumers
//   → High throughput — Kafka handles millions of messages/sec per broker
//   → Stream processing — Kafka Streams, Flink, Spark Structured Streaming connect natively
//   → Event sourcing — the Kafka log IS the source of truth
//
// Use SQS when:
//   → Simple task queue — one producer, one consumer type, message processed once
//   → Managed, zero operational overhead — no cluster to run
//   → At-least-once delivery is fine, exactly-once is not required
//   → Tasks: image resizing, email sending, report generation
//
// Use RabbitMQ when:
//   → Complex routing rules — route messages to different queues based on content
//   → Low-latency task dispatch — sub-millisecond delivery
//   → Request-reply pattern — send a message, wait for a response on a reply queue
//   → Flexible topology without operationalising Kafka
//
// ── Delivery guarantees ──
//
// At-most-once:    message sent, consumer may or may not receive it — fire and forget
// At-least-once:   message will be delivered, consumer may process it more than once
//                  → handlers MUST be idempotent (use idempotency key / processed-events table)
// Exactly-once:    hardest guarantee — Kafka achieves this with idempotent producers
//                  + transactional APIs, but with a throughput cost
//                  → use at-least-once + idempotent consumers in most cases`
    },

    // ── Storage systems and CDN ──
    {
      speaker: "you",
      text: `"Storage systems — S3, blob storage. I always say 'store files in S3' but I've never thought about how S3 actually works internally."`
    },
    {
      speaker: "raj",
      text: `"When you upload a large file to S3, what do you think happens?"`
    },
    {
      speaker: "you",
      text: `"It... goes to a server somewhere?"`
    },
    {
      speaker: "raj",
      text: `"It gets chunked. Large files — anything over a few megabytes — are split into chunks, typically 64MB to 128MB each. Each chunk is uploaded independently, checksummed, stored on different physical nodes, and replicated. The metadata — filename, owner, size, chunk locations — lives in a separate metadata service. The actual bytes live in a distributed object store. This is why S3 uploads can be parallelised and resumed — you're uploading independent chunks, not a single blob. This is also why S3 can store objects of arbitrary size — there's no monolithic file on a single disk."`
    },
    {
      speaker: "you",
      text: `"What's a CDN actually doing? I always draw it in diagrams but I don't fully understand what's happening at the edge."`
    },
    {
      speaker: "raj",
      text: `"A CDN is a geographically distributed network of caches. When a user in Mumbai requests an image that lives on a server in Virginia, the first request goes all the way to Virginia — 150 milliseconds round trip. The CDN edge node in Mumbai caches the response. The next user in Mumbai hits the edge node — 5 milliseconds. The CDN doesn't fetch from origin again until the TTL expires or the cache is purged. The trade-off you're making is freshness for latency — a file with a one-year TTL loads instantly everywhere but you can't update it without also updating the URL. That's why static assets have content hashes in their filenames: main.abc123.js. Change the file, change the hash, the URL changes, the old URL stays cached forever with the old content, the new URL is fetched fresh."`
    },
    {
      speaker: "you",
      text: `"What about cache invalidation — purging the CDN when something changes?"`
    },
    {
      speaker: "raj",
      text: `"Two approaches. Time-based — set a short TTL and wait for it to expire. Simple, but you can't push urgent updates. Purge-based — your deployment pipeline sends an explicit purge request to the CDN API after deploying. Instant, but costs money per purge (most CDNs charge per invalidation request) and large-scale purges can take tens of seconds to propagate globally. The common pattern: long TTL plus content-hashed filenames for static assets you control. Short TTL plus purge-on-deploy for content that changes without a URL change — an API response cached at the CDN layer, for example."`
    },
    {
      type: "code",
      text: `// ── Storage systems — blob storage and CDN internals ──

// ── How object storage works (S3, GCS, Azure Blob) ──
//
// Object = key + value (arbitrary bytes) + metadata
// No hierarchy — the "/" in "photos/2024/vacation.jpg" is part of the key, not a folder
// Flat namespace per bucket — keys are just strings
//
// ── Multipart upload — how large files get uploaded ──
// 1. Initiate: POST /bucket/key?uploads → returns uploadId
// 2. Upload parts: PUT /bucket/key?partNumber=1&uploadId=xxx (repeat for each chunk)
//    Each part: minimum 5MB, maximum 5GB
//    Parts can be uploaded in parallel across multiple connections/machines
//    Each part returns an ETag (checksum)
// 3. Complete: POST /bucket/key?uploadId=xxx with list of (partNumber, ETag)
//    S3 assembles the parts and creates the final object
// 4. Abort: DELETE /bucket/key?uploadId=xxx (cleans up partial upload, stops billing)
//
// ── Resumable upload implementation ──
const uploadLargeFile = async (filePath, bucket, key) => {
  const CHUNK_SIZE = 64 * 1024 * 1024;   // 64MB per chunk
  const fileSize   = fs.statSync(filePath).size;

  // 1. Initiate
  const { UploadId } = await s3.createMultipartUpload({ Bucket: bucket, Key: key }).promise();

  const parts = [];
  let partNumber = 1;

  // 2. Upload parts in parallel (4 at a time to control memory)
  for (let offset = 0; offset < fileSize; offset += CHUNK_SIZE) {
    const chunk = fs.createReadStream(filePath, {
      start: offset,
      end:   Math.min(offset + CHUNK_SIZE - 1, fileSize - 1),
    });

    const { ETag } = await s3.uploadPart({
      Bucket:     bucket,
      Key:        key,
      UploadId,
      PartNumber: partNumber,
      Body:       chunk,
    }).promise();

    parts.push({ PartNumber: partNumber, ETag });
    partNumber++;
  }

  // 3. Complete
  await s3.completeMultipartUpload({
    Bucket:          bucket,
    Key:             key,
    UploadId,
    MultipartUpload: { Parts: parts },
  }).promise();
};

// ── Pre-signed URLs — the right way to handle user uploads ──
// Wrong: client → your server → S3  (your server handles all the bytes — bandwidth cost, latency)
// Right: client → S3 directly using a pre-signed URL your server generates

const getUploadUrl = async (filename, contentType) => {
  const key = \`uploads/\${Date.now()}-\${filename}\`;
  const url = await s3.getSignedUrlPromise('putObject', {
    Bucket:      process.env.S3_BUCKET,
    Key:         key,
    ContentType: contentType,
    Expires:     300,   // URL is valid for 5 minutes
  });
  return { url, key };
  // Client uploads directly to S3 using this URL
  // Your server is not in the upload path
};

// ── CDN cache control headers ──
//
// Static assets with content hash (main.abc123.js):
//   Cache-Control: public, max-age=31536000, immutable
//   → Cache for one year. "immutable" tells browser not to revalidate — content never changes.
//   → URL change = content change. Old URL stays cached. New URL fetches fresh.
//
// HTML files (change with each deploy):
//   Cache-Control: public, max-age=0, must-revalidate
//   → Never cache the HTML — it references the hashed asset URLs
//   → Browser always revalidates, gets ETag/304 if unchanged (fast)
//
// API responses (occasionally cached at CDN for public data):
//   Cache-Control: public, max-age=60, stale-while-revalidate=600
//   → Cache for 60 seconds. Serve stale for 10 more minutes while revalidating in background.
//   → User never waits for a cache miss — stale is served while fresh copy is fetched.
//
// User-specific data:
//   Cache-Control: private, no-store
//   → Never cache at CDN level — each user's data is different
//   → Browser may cache locally (private) but CDN edge nodes won't

// ── CDN routing strategies ──
//
// Anycast:   one IP address, multiple physical locations
//            BGP routing directs each user to the nearest PoP (Point of Presence)
//            Used by: Cloudflare, Fastly
//
// GeoDNS:    DNS returns different IPs based on requester's geographic location
//            Simpler than anycast, slightly slower to adapt to network changes
//            Used by: AWS CloudFront, Akamai`
    },

    // ── Security at scale ──
    {
      speaker: "you",
      text: `"Security — I know to say 'add HTTPS' and 'hash passwords' but I never know what to say beyond that in a system design context."`
    },
    {
      speaker: "raj",
      text: `"Security in system design isn't about specific CVEs or cryptography details. It's about trust boundaries. Who is allowed to call what, how do you know they are who they say they are, and how do you ensure that if one component is compromised it can't reach everything else. Draw your system and ask: what's the blast radius if this service is fully compromised?"`
    },
    {
      speaker: "you",
      text: `"How do I think about authentication versus authorisation at scale? In a monolith it's just middleware. Across services it feels complicated."`
    },
    {
      speaker: "raj",
      text: `"Authentication — who are you — happens once, at the edge. Your API gateway validates the token and either rejects the request or injects verified identity headers into the internal request. Every downstream service trusts those headers and never touches the original token. They don't need the signing secret. That's the API gateway pattern we covered in the microservices lesson. Authorisation — what are you allowed to do — can happen at the gateway for coarse rules, and at the individual service for fine-grained rules. The service knows its own domain best."`
    },
    {
      speaker: "you",
      text: `"What about service-to-service calls? When the order service calls the payment service with no user involved?"`
    },
    {
      speaker: "raj",
      text: `"Two options worth knowing. Mutual TLS — both services present certificates to each other. The certificate proves identity at the network level. A service mesh like Istio handles certificate issuance and rotation automatically — your application code doesn't change. The second option is service accounts with short-lived tokens — each service has an identity, it requests a short-lived JWT from an auth service using a long-lived credential it holds securely. It presents that JWT on each call to other services. The JWT expires in minutes, so a stolen token has limited damage window."`
    },
    {
      speaker: "you",
      text: `"What about DDoS? Is that something I need to talk about?"`
    },
    {
      speaker: "raj",
      text: `"Mention it but don't dwell on it — it's largely solved by infrastructure, not architecture. Rate limiting at the API gateway handles targeted abuse. A WAF — Web Application Firewall — handles malformed requests, injection attempts, and some L7 DDoS. Cloudflare or AWS Shield handles volumetric L3/L4 DDoS. The design decision you own is: don't expose your origin servers directly to the internet. Everything goes through a CDN or a load balancer. Your application servers are on a private network. Attackers can't address them directly even if they know the IPs."`
    },
    {
      type: "code",
      text: `// ── Security at scale — the concepts interviewers probe ──

// ── Trust boundaries — draw these before you draw components ──
//
//  Public internet (untrusted)
//    ↓  (TLS termination, DDoS protection, WAF)
//  CDN / API Gateway (trust boundary — authentication happens here)
//    ↓  (auth validated, identity headers injected, mTLS begins)
//  Internal services (private network — trust gateway's headers, verify service identity)
//    ↓
//  Data layer (most restricted — only specific services can connect)
//
// ── Auth at the API gateway ──
// Already covered in microservices lesson — key points:
// - Validate JWT at the gateway, never in individual services
// - Use RS256 (asymmetric) — services get the public key for verification only
//   A compromised service cannot forge tokens (it has no private key)
// - Inject x-user-id, x-user-roles as headers — strip the original Authorization header
// - Internal services reject any request without a valid service key in addition to user headers

// ── Short-lived credentials — limiting blast radius ──
//
// Long-lived API key:    leaked → attacker has indefinite access → rotate manually, painful
// Short-lived JWT:       leaked → attacker has access for 15 minutes maximum → self-healing
//
// Pattern: machine identity via short-lived tokens (similar to AWS instance profiles)
const getServiceToken = async (serviceId, privateKey) => {
  // Service authenticates to auth service using its long-lived credential (private key, stored in secrets manager)
  const response = await fetch('https://auth.internal/service-token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      service_id: serviceId,
      assertion:  jwt.sign({ service: serviceId, iat: Date.now() }, privateKey, { expiresIn: '1m' }),
    }),
  });
  const { token } = await response.json();
  return token;   // short-lived JWT (5-15 minutes) used for service-to-service calls
};

// Refresh automatically before expiry — don't wait for a 401
const tokenCache = { token: null, expiresAt: 0 };
const getValidToken = async () => {
  if (tokenCache.expiresAt - Date.now() < 60_000) {   // refresh 1 minute before expiry
    tokenCache.token     = await getServiceToken(SERVICE_ID, PRIVATE_KEY);
    tokenCache.expiresAt = Date.now() + 14 * 60 * 1000;   // 14 minutes (token is 15 min)
  }
  return tokenCache.token;
};

// ── mTLS via service mesh (Istio) ──
// Application code: unchanged
// Sidecar proxy (Envoy) handles:
//   - Certificate issuance from the mesh CA
//   - Certificate rotation before expiry (automatic)
//   - mTLS negotiation on every service-to-service call
//   - Authorization policy enforcement (which services can call which)
//
// kubectl apply:
// apiVersion: security.istio.io/v1beta1
// kind: PeerAuthentication
// spec: { mtls: { mode: STRICT } }   # reject plaintext between services
//
// apiVersion: security.istio.io/v1beta1
// kind: AuthorizationPolicy
// spec:
//   selector: { matchLabels: { app: payment-service } }
//   rules:
//   - from:
//     - source: { principals: ["cluster.local/ns/prod/sa/order-service"] }
//   # Only order-service's service account can call payment-service
//   # Everything else is rejected at the network layer — no app code involved

// ── Secrets management — where credentials live ──
//
// Never:  hardcoded in code, committed to git, in a .env file on a server
// Never:  in environment variables baked into a Docker image
// Always: in a secrets manager — AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager
//
// Pattern: inject at runtime
//   Deployment platform fetches secret from Vault at container startup
//   Secret is available as an environment variable or mounted file
//   Secret is never written to disk in the container image
//   Rotation: update in Vault → rolling redeploy picks up new value → no code change
//
// ── Input validation and injection prevention ──
//
// SQL injection: use parameterised queries / prepared statements — never string concatenation
//   ✓ db.query(\`SELECT * FROM users WHERE id = $1\`, [userId])
//   ✗ db.query(\`SELECT * FROM users WHERE id = \${userId}\`)
//
// NoSQL injection:   validate that query operators ($where, $gt) don't come from user input
//   const { filter } = req.body;
//   if (typeof filter !== 'string') throw new AppError('Invalid filter', 400);
//   // Never pass raw user input as a MongoDB query object
//
// Mass assignment:   whitelist fields you accept — never spread req.body into DB operations
//   ✓ const update = { name: req.body.name, bio: req.body.bio };
//   ✗ await User.update(req.userId, req.body);   // user could send { role: 'admin' }
//
// ── OWASP Top 10 — know these by name, not by detail ──
// A01: Broken Access Control       — check authorisation on every request
// A02: Cryptographic Failures      — use TLS, bcrypt for passwords, no MD5/SHA1 for secrets
// A03: Injection                   — parameterised queries, input validation
// A05: Security Misconfiguration   — least privilege, no default credentials, headers (HSTS, CSP)
// A07: Identification/Auth Failures — rate limit auth endpoints, MFA, short-lived tokens
// A09: Logging/Monitoring Failures — alert on auth failures, log security events, retain logs`
    },

    // ── Search systems ──
    {
      speaker: "you",
      text: `"Search — you mentioned an inverted index in the previous lesson but never explained how it actually works. If the prompt is 'design a search engine for a product catalogue' what am I actually building?"`
    },
    {
      speaker: "raj",
      text: `"Start with the data problem. You have a million products. A user types 'red running shoes size 10'. You need to return relevant results in under 100 milliseconds. A full table scan — go through every product, check if it matches — takes seconds on a million rows. An inverted index flips the relationship. Instead of product → words, you build words → products. 'Red' maps to a list of product IDs that contain the word red. 'Running' maps to its own list. 'Shoes' maps to another. The search query finds the intersection of those three lists. That intersection is fast — you're doing set intersection on sorted lists, which is O(n) where n is the size of the smaller list."`
    },
    {
      speaker: "you",
      text: `"And ranking? How do you decide which result comes first?"`
    },
    {
      speaker: "raj",
      text: `"TF-IDF is the classical answer. TF — term frequency — how often the search term appears in this product's description. IDF — inverse document frequency — how rare the term is across all products. A word that appears in every product, like 'the', gets a very low IDF and barely affects ranking. A word that appears in only fifty products gets a high IDF and strongly influences ranking. The product whose description best matches your query on that weighted score ranks first. In practice, modern search combines TF-IDF with other signals — click-through rate, purchase history, recency, personalisation. But TF-IDF is what you describe in an interview to show you understand the mechanics."`
    },
    {
      speaker: "you",
      text: `"Is search always Elasticsearch or can I use Postgres for it?"`
    },
    {
      speaker: "raj",
      text: `"Postgres has a full-text search capability — tsvector and tsquery. It builds an inverted index, supports ranking, handles stemming. For a million products it's completely fine and it removes a piece of infrastructure. Elasticsearch becomes the right answer when you need faceted search — filtering by multiple attributes simultaneously at high speed — or when you need search-as-you-type with fuzzy matching at scale, or when your index is so large that Postgres's single-node full-text search becomes a bottleneck. For a product catalogue in a mid-sized company, Postgres full-text is underrated and underused."`
    },
    {
      type: "code",
      text: `// ── Search systems — from inverted index to production search ──

// ── The inverted index — how it works ──
//
// Documents:
//   doc:1  "red leather running shoes"
//   doc:2  "blue canvas running shoes"
//   doc:3  "red suede dress shoes"
//
// Inverted index after tokenisation and normalisation:
//   "red"     → [doc:1, doc:3]
//   "leather" → [doc:1]
//   "running" → [doc:1, doc:2]
//   "shoes"   → [doc:1, doc:2, doc:3]
//   "blue"    → [doc:2]
//   "canvas"  → [doc:2]
//   "suede"   → [doc:3]
//   "dress"   → [doc:3]
//
// Query: "red running shoes"
//   → Intersect [doc:1, doc:3] ∩ [doc:1, doc:2] ∩ [doc:1, doc:2, doc:3]
//   → Result: [doc:1]   (only doc:1 contains all three terms)
//
// Query: "shoes" (single term, no intersection needed)
//   → Union with ranking: [doc:1, doc:2, doc:3] ranked by TF-IDF
//
// ── Text processing pipeline (what happens before indexing) ──
//
// 1. Tokenisation:  "Red Running Shoes!" → ["Red", "Running", "Shoes"]
// 2. Lowercasing:   → ["red", "running", "shoes"]
// 3. Stop words:    remove "the", "a", "is", etc. → low information, high noise
// 4. Stemming:      "running" → "run", "shoes" → "shoe" (conflate variants)
//    OR Lemmatisation: "better" → "good" (more accurate, more expensive)
// 5. Synonyms:      "sneakers" → also index as "shoes" (expand recall)
//
// ── Postgres full-text search — production-ready for small/medium scale ──
// Create a GIN index on a tsvector column for fast full-text lookup
//
// ALTER TABLE products ADD COLUMN search_vector tsvector;
//
// UPDATE products SET search_vector =
//   setweight(to_tsvector('english', name), 'A') ||            -- name weighted highest
//   setweight(to_tsvector('english', description), 'B') ||     -- description second
//   setweight(to_tsvector('english', category), 'C');          -- category third
//
// CREATE INDEX products_search_idx ON products USING GIN(search_vector);
//
// -- Keep the vector updated on writes:
// CREATE TRIGGER products_search_update
//   BEFORE INSERT OR UPDATE ON products
//   FOR EACH ROW EXECUTE FUNCTION
//   tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description, category);
//
// -- Query with ranking:
const searchProducts = async (query, limit = 20, offset = 0) => {
  const { rows } = await db.query(\`
    SELECT
      id, name, description, price,
      ts_rank(search_vector, query) AS rank
    FROM products, to_tsquery('english', $1) query
    WHERE search_vector @@ query
    ORDER BY rank DESC
    LIMIT $2 OFFSET $3
  \`, [query.split(' ').join(' & '), limit, offset]);

  // "red running shoes" → "red & running & shoes" (AND query)
  return rows;
};

// ── Elasticsearch — when you need to go further ──
//
// Faceted search: filter by multiple attributes simultaneously
//   User searches "shoes", then filters: brand=Nike, size=10, colour=red, price < $150
//   Elasticsearch aggregations compute the count for each facet value in one query
//   Postgres can do this but loses performance above ~10M products with complex facets
//
// Fuzzy matching: "runing shoes" → "running shoes" (handles typos)
//   Elasticsearch: { "match": { "name": { "query": "runing", "fuzziness": "AUTO" } } }
//   Postgres: pg_trgm extension for trigram similarity — works but less flexible
//
// Type-ahead / autocomplete:
//   As user types "run..." → suggest "running shoes", "running shorts", "runners"
//   Approach 1: edge n-gram index — index "ru", "run", "runn", "runni"... at index time
//   Approach 2: search-as-you-type field type in Elasticsearch (built-in)
//   Approach 3: Redis sorted set of popular queries — prefix search with ZRANGEBYLEX
//               const suggestions = await redis.zrangebylex('popular_queries', '[run', '[run\xff', 'LIMIT', 0, 5);
//
// ── Indexing pipeline — how new products get into the search index ──
//
// Synchronous (simple): write to DB → write to Elasticsearch in same request
//   Problem: Elasticsearch write fails → product saved but not searchable → silent inconsistency
//
// Asynchronous (reliable): write to DB → outbox event → worker indexes into Elasticsearch
//   Delay: new products appear in search within seconds, not milliseconds
//   Reliability: if indexer fails, it retries → eventual consistency, no silent gaps
//   Recovery: if Elasticsearch cluster is down, events queue up → catch up on restart
//
// Full reindex: periodically scan all DB records and rebuild the index from scratch
//   Use when: mapping changes, index corruption, adding a new Elasticsearch cluster
//   Zero-downtime reindex: build new index in parallel, swap alias when complete`
    },

    // ── Putting it all together — staff-level prompt ──
    {
      speaker: "you",
      text: `"Can we do a worked example that uses all of this? Something that would actually come up at a staff-level interview?"`
    },
    {
      speaker: "raj",
      text: `"Design a distributed key-value store. From scratch. Not 'use DynamoDB' — the actual internals. How would you build something like Redis or DynamoDB yourself."`
    },
    {
      speaker: "you",
      text: `"Okay. Core operations: get, set, delete. The hard parts — storing data across multiple nodes, handling node failures, keeping reads fast."`
    },
    {
      speaker: "raj",
      text: `"Good start. How do you distribute keys across nodes?"`
    },
    {
      speaker: "you",
      text: `"Consistent hashing. Each key hashes to a position on the ring. The first node clockwise from that position owns the key."`
    },
    {
      speaker: "raj",
      text: `"A node fails. What happens to the keys it owned?"`
    },
    {
      speaker: "you",
      text: `"Replication. Each key should be stored on multiple nodes — not just the primary. So if the primary fails, a replica can serve reads and be promoted."`
    },
    {
      speaker: "raj",
      text: `"How many replicas? And how do you decide which nodes get the replicas?"`
    },
    {
      speaker: "you",
      text: `"Three total — one primary, two replicas. The replicas go on the next two nodes clockwise on the ring after the primary. That way a key is always on three physically different nodes."`
    },
    {
      speaker: "raj",
      text: `"A client writes a key. When is the write 'done'? Do you wait for all three nodes to confirm?"`
    },
    {
      speaker: "you",
      text: `"That depends on the consistency requirement. Wait for all three — strong consistency, but high latency and unavailable if any replica is down. Wait for one — available, but reads might return stale data. Wait for a majority — two out of three. You get a reasonable balance."`
    },
    {
      speaker: "raj",
      text: `"That's quorum reads and writes. W + R > N gives you strong consistency where N is the replication factor, W is the write quorum, R is the read quorum. If W=2, R=2, N=3 — every read is guaranteed to overlap with at least one node that has the latest write. You can tune this. W=3, R=1 — reads are fast, writes are slow. W=1, R=3 — writes are fast, reads are slow. The point is it's a dial, not a binary."`
    },
    {
      speaker: "you",
      text: `"What handles node failure detection and resharding?"`
    },
    {
      speaker: "raj",
      text: `"Gossip protocol for failure detection — each node periodically shares its view of cluster health with a few random peers. Failure information propagates through the cluster in O(log N) rounds without a central coordinator. When a node is detected as failed — missed heartbeats beyond a threshold — a coordinator or the other nodes initiate hinted handoff: temporarily store the failed node's writes on a neighbour, replay them when it recovers. That's how Cassandra and DynamoDB handle transient failures without losing writes."`
    },
    {
      type: "code",
      text: `// ── Distributed key-value store — the full design ──

// ── Architecture overview ──
//
//  Client
//    ↓
//  Coordinator node (any node can be coordinator — routes request to correct nodes)
//    ↓
//  N replica nodes (determined by consistent hash ring + replication factor)
//    ↓
//  Storage engine per node (LSM tree for write-heavy, B-tree for read-heavy)

// ── Storage engine choice ──
//
// B-tree (Postgres, MySQL, LMDB):
//   Reads: O(log n) — great
//   Writes: in-place updates — random I/O, slower for write-heavy workloads
//   Use when: read-heavy, small dataset fits in memory
//
// LSM tree — Log Structured Merge tree (LevelDB, RocksDB, Cassandra, HBase):
//   Writes: append-only to an in-memory buffer (MemTable) → flushed to disk as SSTable
//           sequential I/O → very fast writes even at high throughput
//   Reads: check MemTable → check SSTable levels → bloom filter to skip levels quickly
//          slightly more complex than B-tree reads
//   Compaction: background process merges SSTables → keeps read performance healthy
//   Use when: write-heavy (time series, event stores, KV stores)
//
// ── The coordinator — routing a write ──
const write = async (key, value, { w = 2 } = {}) => {
  const nodes  = ring.getNodes(key, REPLICATION_FACTOR);   // primary + 2 replicas
  const writes = nodes.map(node => replicaWrite(node, key, value));

  // Wait for W confirmations (quorum write)
  const results = await Promise.allSettled(writes);
  const success = results.filter(r => r.status === 'fulfilled').length;

  if (success < w) throw new Error(\`Write quorum not met: \${success}/\${w}\`);
  // W nodes confirmed — write is durable even if (N-W) nodes fail later
};

// ── Quorum read — handling version conflicts ──
const read = async (key, { r = 2 } = {}) => {
  const nodes = ring.getNodes(key, REPLICATION_FACTOR);
  const reads = await Promise.allSettled(nodes.map(n => replicaRead(n, key)));

  const responses = reads
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  if (responses.length < r) throw new Error('Read quorum not met');

  // Nodes may have different versions — take the highest vector clock
  return responses.reduce((latest, resp) =>
    vectorClockIsNewer(resp.clock, latest.clock) ? resp : latest
  );
  // Read repair: if replicas disagree, write the latest version back to the stale replica
};

// ── Vector clocks — resolving write conflicts ──
// Each value carries a vector clock: { nodeId: sequenceNumber }
// When a node writes: increment its own sequence number
// When comparing two versions: if one clock dominates the other → take the later one
//                               if neither dominates → conflict → return both, let client resolve
//
// Example: node A and node B both write to key "user:1" during a partition
// A's version: { A: 3 }   B's version: { B: 2 }
// Neither dominates — this is a true conflict
// DynamoDB: returns both versions with a ConditionalWriteException, application resolves
// Cassandra: last-write-wins (timestamp) — simpler but can lose data

// ── Failure detection with gossip ──
// Each node maintains a membership list: { nodeId: { lastSeen, status } }
// Every 1 second: pick 3 random peers, share your membership list
// If a node hasn't been seen for > heartbeat_timeout:
//   Mark it as SUSPECT, gossip the suspicion
//   If still unreachable after SUSPECT timeout: mark DEAD
//
// ── Hinted handoff — writes during node failure ──
const writeWithHintedHandoff = async (key, value) => {
  const nodes = ring.getNodes(key, REPLICATION_FACTOR);
  const results = [];

  for (const node of nodes) {
    try {
      await replicaWrite(node, key, value);
      results.push({ node, success: true });
    } catch (err) {
      // Node is down — write hint to a healthy neighbour
      const hintNode = ring.getNextHealthyNode(node);
      await hintNode.storeHint({ targetNode: node.id, key, value, timestamp: Date.now() });
      results.push({ node, success: false, hinted: hintNode.id });
    }
  }
  // When the failed node recovers, the hint node replays stored hints to it
  // This ensures no writes are lost during transient failures
};

// ── Anti-entropy: reconciling replicas ──
// Gossip and hinted handoff handle transient failures
// But replicas can diverge for other reasons (bugs, long partitions)
// Anti-entropy uses Merkle trees to detect and repair divergence efficiently
//
// Merkle tree: a hash tree where each leaf is hash(key, value)
//              each internal node is hash(left_child + right_child)
//              root hash summarises the entire dataset
//
// Reconciliation: two replicas exchange root hashes
//   Hashes match → data is identical → nothing to do
//   Hashes differ → recurse down the tree → find the differing leaves
//   Only transfer the differing key-value pairs — not the entire dataset
//   Used by: Cassandra, Riak, Amazon DynamoDB (internal)`
    },

    // ── Closing ──
    {
      speaker: "you",
      text: `"This is significantly harder than the first lesson. I don't know if I'll retain all of this."`
    },
    {
      speaker: "raj",
      text: `"You don't need to memorise it. You need to have thought through it deeply enough that when a thread appears in an interview, you can pull it. The distributed KV store touched consensus, consistent hashing, replication, quorums, vector clocks, gossip, and Merkle trees — all in one design. Those aren't separate topics. They're the same problem approached from different angles."`
    },
    {
      speaker: "you",
      text: `"What's the single most useful thing from all of this for an interview?"`
    },
    {
      speaker: "raj",
      text: `"Knowing what breaks first. In every system we discussed, the interesting part wasn't the happy path — it was the failure mode. The thundering herd when a cache expires. The split-brain when a network partitions. The hot partition when a shard key is wrong. The coordinator blocking when 2PC fails. If you can describe what breaks first in any component of your design and what the mitigation is — you're reasoning like someone who's actually run these systems in production. That's what a staff-level interview is evaluating."`
    },
    {
      speaker: "you",
      text: `"And observability — I keep forgetting to bring it up."`
    },
    {
      speaker: "raj",
      text: `"Add it to your mental checklist. Before you hand over to the interviewer at the end of the high-level design: 'I'd instrument this with the four golden signals — latency, traffic, errors, saturation — plus distributed tracing with a propagated trace ID on every cross-service call. Alerting on SLO breach rather than individual component health. That's one sentence. It takes ten seconds and it signals that you think about production, not just design."`
    },

    {
      type: "summary",
      points: [
        "Distributed consensus solves the problem of multiple nodes agreeing on a value when any of them can crash and messages can be delayed. Raft is the practical algorithm: nodes are followers, candidates, or leaders. A leader is elected when a node stops receiving heartbeats, calls an election, and wins a majority vote. A majority quorum — more than half — prevents split-brain: only one side of a network partition can form a majority and accept writes. Deploy in odd numbers (3, 5, 7). You can lose ⌊N/2⌋ nodes and maintain availability. In practice, use etcd or ZooKeeper for leader election rather than implementing Raft yourself.",
        "Distributed transactions require coordination across independent systems with no shared transaction log. Two-phase commit (2PC) achieves atomicity by having a coordinator collect 'prepared' votes from all participants before sending commit — but if the coordinator crashes after participants voted, they block holding locks indefinitely. The saga pattern avoids 2PC by making each step a local transaction with a compensating transaction for rollback — no distributed lock, but the system is in an intermediate state during execution. The outbox pattern solves the gap between writing to a database and publishing an event: write both in the same local transaction, publish from the outbox via a separate worker.",
        "Consistent hashing solves the resharding problem of naive modulo-based sharding. In a hash ring, keys map to the first node clockwise from their hash position. Adding a node moves only ~1/N keys (those between the new node and its predecessor). Removing a node moves only that node's keys to its successor. Virtual nodes — each physical node occupying many positions on the ring — smooth out uneven key distribution. Used by DynamoDB, Cassandra, Redis Cluster, and CDN edge routing.",
        "HTTP has evolved to address head-of-line blocking. HTTP/1.1 allows one in-flight request per connection — browsers open six parallel connections as a workaround. HTTP/2 multiplexes many streams over one TCP connection, but TCP itself still blocks all streams on a single lost packet. HTTP/3 uses QUIC over UDP, where each stream recovers independently. WebSockets provide full-duplex persistent connections for bidirectional real-time communication — scaling requires a pub/sub layer (Redis pub/sub) so messages from one server can reach sockets on another. SSE is simpler for one-directional server-to-client push. Long polling works over plain HTTP but has higher overhead per message.",
        "Observability has three pillars that answer different questions. Metrics (Prometheus, Datadog) tell you something is wrong — track the four golden signals: latency (p99, not average), traffic (requests/sec), errors (rate and count), saturation (CPU, queue depth, connection pool). Logs tell you what happened — structured JSON with trace ID on every line. Distributed traces (OpenTelemetry, Jaeger) tell you where time was spent across service boundaries — a waterfall of spans linked by trace ID. Alert on symptoms (p99 latency > 500ms, error rate > 1%) not causes (CPU > 80%). Define SLIs, SLOs, and error budgets — when the error budget is exhausted, reliability work takes priority over features.",
        "Kafka is a distributed append-only log, not a queue. Messages are retained after consumption — multiple consumer groups read the same messages independently, each tracking its own offset. Consumers can replay from any position. This enables: fan-out to many downstream systems without coupling, adding new consumers after the fact, and rebuilding derived state from the event history. Partition key choice determines both throughput (number of partitions = max parallelism per consumer group) and ordering (same key = same partition = ordered delivery). Use Kafka for event streaming, fan-out, and audit logs. Use SQS for simple task queues where messages are processed once. Use RabbitMQ for complex routing or low-latency task dispatch.",
        "Object storage (S3, GCS) splits large files into chunks (typically 64-128MB), uploads them independently in parallel, and stores them on distributed nodes with replication. Metadata lives separately from bytes. Pre-signed URLs let clients upload directly to the object store without routing bytes through your servers. CDNs cache responses at geographically distributed edge nodes — the first request goes to origin, subsequent requests are served from the nearest edge. Cache control headers govern freshness: long TTL with content-hashed filenames for immutable static assets; short TTL or explicit purge for content that changes. Stale-while-revalidate serves cached content while refreshing in the background — users never wait for a cache miss.",
        "Security in system design is about trust boundaries, not specific vulnerabilities. Authentication (who are you?) happens once at the API gateway — JWT validated, identity headers injected, original token stripped. Internal services trust gateway headers and verify a shared service key. Use RS256 (asymmetric) so only the auth service can mint tokens. Service-to-service calls use mutual TLS (handled by a service mesh) or short-lived service tokens. Never expose origin servers directly to the internet — all traffic through a CDN or load balancer, application servers on a private network. Secrets live in a secrets manager (Vault, AWS Secrets Manager) and are injected at runtime, never baked into images or committed to code.",
        "Search systems are built on inverted indexes: a mapping from terms to the documents containing them. A query finds the intersection of posting lists for each term. Text processing before indexing — tokenisation, lowercasing, stop word removal, stemming, synonym expansion — determines recall quality. TF-IDF ranks results: term frequency rewards documents where the query term appears often; inverse document frequency penalises terms that appear everywhere. Postgres full-text search (tsvector, GIN index) handles millions of products with complex ranking and is underused. Elasticsearch adds faceted search, fuzzy matching, and search-as-you-type at scale. Index new content asynchronously via an outbox pattern — writes land in search within seconds, not milliseconds, without risking silent gaps.",
        "A distributed key-value store combines consistent hashing (key routing), replication factor N (data on N nodes), and quorum reads/writes (W + R > N for strong consistency) into a coherent whole. The W and R values are a tunable dial: high W means durable writes, slow writes; high R means guaranteed fresh reads, slower reads. Failure detection uses gossip protocol — O(log N) propagation with no central coordinator. Hinted handoff preserves writes during node outages by temporarily storing them on a healthy neighbour and replaying on recovery. Anti-entropy uses Merkle trees to efficiently detect and repair divergence between replicas without transferring the entire dataset. The storage engine choice — LSM tree for write-heavy workloads, B-tree for read-heavy — affects the trade-off between write throughput and read latency at the single-node level."
      ]
    }
  ]
};

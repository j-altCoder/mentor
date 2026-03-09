// ─────────────────────────────────────────────────────────────────
//  LESSON: Real-Time Systems
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_REALTIME = {
  category: "Architecture & System Design",
  tag: "Real-Time Systems",
  title: "The Difference Between Asking and Being Told",
  intro: "The product manager drops a new requirement: live order tracking. Customers should see their delivery driver move on a map in real time. The current architecture is pure REST. Every engineer in the room looks at you.",
  scenes: [

    // ── Polling vs real-time ──
    {
      speaker: "raj",
      text: `"Before you reach for WebSockets — why is polling not good enough here?"`
    },
    {
      speaker: "you",
      text: `"You'd be making requests every second? That's a lot of traffic."`
    },
    {
      speaker: "raj",
      text: `"It's not just traffic — it's the wrong model. With polling, the client has to keep asking: 'anything new?' 'anything new?' 'anything new?' Most of those requests get a 'no'. You're paying full HTTP overhead — TCP handshake, headers, connection teardown — for every 'no'. At 10,000 active deliveries, each polling every second, that's 10,000 requests per second of pure noise. And even at one-second intervals you still have up to a second of latency. The real-time model inverts this: the server tells the client when something changes. Zero requests per 'no'. Latency measured in milliseconds."`
    },
    {
      type: "analogy",
      text: "Polling vs real-time = checking your letterbox every 10 minutes vs the postman knocking when a letter arrives. Both eventually deliver the letter. One wastes everyone's time on 143 empty checks per day. The real-time model only fires when there's actually something to say."
    },
    {
      speaker: "you",
      text: `"So when is polling the right answer?"`
    },
    {
      speaker: "raj",
      text: `"When updates are infrequent, when the data doesn't need to be truly live, or when you don't control the client. A dashboard that refreshes every 30 seconds is polling — and that's fine. A CI/CD status page that polls every 5 seconds is fine. The cost becomes unacceptable when you need sub-second latency, when millions of clients are watching, or when 'no change' is the dominant response. That's when you switch models."`
    },

    // ── The three technologies ──
    {
      speaker: "raj",
      text: `"Three technologies for real-time: WebSockets, Server-Sent Events, and long polling. Tell me what you know about each."`
    },
    {
      speaker: "you",
      text: `"WebSockets are bidirectional? And Server-Sent Events are one-way from server to client?"`
    },
    {
      speaker: "raj",
      text: `"Right. <em>WebSockets</em>: full-duplex persistent connection. Client and server can both send at any time after the initial handshake. Overhead after connection is minimal — small frame headers, no HTTP per message. Right for chat, multiplayer, collaborative editing, anything genuinely bidirectional. <em>Server-Sent Events</em>: one-way stream, server to client only, over a persistent HTTP connection. Simpler protocol, automatic reconnection built into the browser, works over HTTP/2 multiplexing. Right for notifications, live feeds, dashboards where the client only receives. <em>Long polling</em>: client sends a request, server holds it open until there's something to send, then closes it — client immediately opens another. Fake real-time via regular HTTP. Works everywhere, no special infrastructure. Right when you need broad compatibility and updates are infrequent enough that the reconnect overhead doesn't hurt."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// THE THREE PATTERNS — when to use each
// ─────────────────────────────────────────────────────

// SERVER-SENT EVENTS — simplest, server→client only
// Native browser EventSource, auto-reconnects, HTTP/2 friendly
app.get('/api/orders/:id/track', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders(); // send headers immediately, keep connection open

  // Send current position right away
  const send = (data) => res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);

  // Subscribe to location updates for this order
  const unsubscribe = locationBus.subscribe(req.params.id, send);

  // Heartbeat: keep connection alive through proxies/load balancers
  const heartbeat = setInterval(() => res.write(':heartbeat\\n\\n'), 25_000);

  req.on('close', () => {
    unsubscribe();
    clearInterval(heartbeat);
  });
});

// Client (browser):
// const es = new EventSource('/api/orders/ord_123/track');
// es.onmessage = (e) => updateMap(JSON.parse(e.data));
// es.onerror   = () => console.log('reconnecting...'); // auto-reconnects

// ─────────────────────────────────────────────────────
// WEBSOCKETS — bidirectional, use when client also sends
// ─────────────────────────────────────────────────────
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  const userId = authenticateWs(req); // extract token from query or cookie
  if (!userId) return ws.close(4001, 'Unauthorized');

  ws.userId = userId;
  ws.isAlive = true;

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    handleMessage(ws, msg); // route to handler by msg.type
  });

  ws.on('pong', () => { ws.isAlive = true; }); // heartbeat response

  ws.on('close', () => cleanup(ws));
});

// Heartbeat: detect dead connections (no TCP FIN on network drop)
const pingInterval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate(); // dead — terminate
    ws.isAlive = false;
    ws.ping();                              // will get a pong if alive
  });
}, 30_000);`
    },

    // ── The scaling problem ──
    {
      speaker: "you",
      text: `"This all works for one server. But we have four Node processes behind a load balancer. A message for user A arrives on server 1, but user A is connected to server 3. How does that work?"`
    },
    {
      speaker: "raj",
      text: `"This is the fundamental scaling problem of real-time systems. A WebSocket connection is sticky to a single server — the TCP connection lives on one machine. If your event arrives on a different machine from the one holding the connection, the event gets silently dropped. The solution is a <em>message broker</em> between your servers. When server 1 gets an event for user A, it publishes to a Redis Pub/Sub channel. All four servers are subscribed to that channel. Server 3 receives the message, finds user A's connection in its local map, and sends it. Every server sees every event, but only the server holding the relevant connection actually delivers it."`
    },
    {
      type: "analogy",
      text: "Redis Pub/Sub between servers = a PA system in a large office. If you want to reach Alice but you don't know which floor she's on, you broadcast over the PA: 'Message for Alice.' Every floor hears it. Alice's floor actually delivers it. The other floors ignore it. Without the PA, you'd have to check every floor yourself."
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SCALING WEBSOCKETS ACROSS MULTIPLE SERVERS
// Redis Pub/Sub as the inter-server message bus
// ─────────────────────────────────────────────────────
const Redis  = require('ioredis');
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = new Redis(process.env.REDIS_URL); // separate connection for subscribe

// Local connection registry — only connections on THIS server
const localConnections = new Map(); // userId → Set<WebSocket>

function registerConnection(userId, ws) {
  if (!localConnections.has(userId)) localConnections.set(userId, new Set());
  localConnections.get(userId).add(ws);
}

function removeConnection(userId, ws) {
  const conns = localConnections.get(userId);
  if (!conns) return;
  conns.delete(ws);
  if (conns.size === 0) localConnections.delete(userId);
}

// Subscribe to the global channel — every server does this at startup
subClient.subscribe('realtime:events');
subClient.on('message', (channel, raw) => {
  const { targetUserId, payload } = JSON.parse(raw);

  // Check if this user is connected to THIS server
  const conns = localConnections.get(targetUserId);
  if (!conns) return; // not on this server — ignore

  // Deliver to all of this user's connections on this server
  const serialised = JSON.stringify(payload);
  conns.forEach(ws => {
    if (ws.readyState === ws.OPEN) ws.send(serialised);
  });
});

// Any service can push to any user without knowing which server they're on
async function pushToUser(targetUserId, payload) {
  await pubClient.publish('realtime:events', JSON.stringify({ targetUserId, payload }));
}

// Usage — from any service, any server:
await pushToUser('usr_alice', { type: 'order_update', status: 'out_for_delivery' });

// ─────────────────────────────────────────────────────
// SOCKET.IO ADAPTER — production-grade alternative
// ─────────────────────────────────────────────────────
const { Server }       = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');

const io = new Server(httpServer);
io.adapter(createAdapter(pubClient, subClient)); // handles all the pub/sub routing

// Now emit to any user from any server — adapter handles routing automatically
io.to(userId).emit('order_update', { status: 'out_for_delivery' });
io.to('room:order-123').emit('driver_location', { lat, lng }); // rooms work cross-server too`
    },

    // ── Rooms and channels ──
    {
      speaker: "you",
      text: `"How do you handle the case where thousands of users are watching the same thing — like a live stock price or a sports score? You can't send one message per user."`
    },
    {
      speaker: "raj",
      text: `"<em>Rooms</em> or <em>channels</em>. Instead of addressing by user, you address by topic. All clients interested in AAPL stock join the 'stock:AAPL' room. When the price updates, you emit once to the room — the server fans it out to every connected client in that room. The publisher doesn't need to know or care how many clients are subscribed. The room is the unit of broadcast. At very large scale — millions of subscribers — you'd push this upstream to a dedicated service like Pusher, Ably, or a purpose-built pub/sub system. But the model is the same: topic-addressed broadcast, fan-out at the edge."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// ROOMS — broadcast to a topic, not a user
// ─────────────────────────────────────────────────────

// WebSocket server with manual room management
const rooms = new Map(); // roomId → Set<WebSocket>

function joinRoom(ws, roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);
  ws.rooms = ws.rooms || new Set();
  ws.rooms.add(roomId);
}

function leaveAllRooms(ws) {
  if (!ws.rooms) return;
  ws.rooms.forEach(roomId => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.delete(ws);
    if (room.size === 0) rooms.delete(roomId); // clean up empty rooms
  });
}

function broadcastToRoom(roomId, payload) {
  const room = rooms.get(roomId);
  if (!room) return;
  const serialised = JSON.stringify(payload);
  room.forEach(ws => {
    if (ws.readyState === ws.OPEN) ws.send(serialised);
  });
}

// Client subscribes to a stock
ws.on('message', (raw) => {
  const { type, symbol } = JSON.parse(raw);
  if (type === 'subscribe_stock') {
    joinRoom(ws, 'stock:' + symbol);
    ws.send(JSON.stringify({ type: 'subscribed', symbol }));
  }
  if (type === 'unsubscribe_stock') {
    leaveRoom(ws, 'stock:' + symbol);
  }
});

// Price update arrives — broadcast once to all watchers
stockFeed.on('price', ({ symbol, price, change }) => {
  broadcastToRoom('stock:' + symbol, { type: 'price_update', symbol, price, change });
});
// 50,000 clients watching AAPL → one broadcastToRoom call, single fan-out

// ─────────────────────────────────────────────────────
// CHAT ROOM — combining rooms with message persistence
// ─────────────────────────────────────────────────────
async function handleChatMessage(ws, { roomId, text }) {
  // 1. Authorise: is this user a member of the room?
  const isMember = await ChatRoom.exists({ _id: roomId, members: ws.userId });
  if (!isMember) return ws.send(JSON.stringify({ error: 'Not a member' }));

  // 2. Persist the message
  const message = await Message.create({
    roomId,
    senderId: ws.userId,
    text,
    sentAt:   new Date()
  });

  // 3. Broadcast to everyone in the room (including sender for confirmation)
  broadcastToRoom('chat:' + roomId, {
    type:     'new_message',
    id:       message._id,
    senderId: ws.userId,
    text:     message.text,
    sentAt:   message.sentAt
  });
}`
    },

    // ── Connection lifecycle and reliability ──
    {
      speaker: "you",
      text: `"What happens when a client disconnects and reconnects — say their phone drops signal for 30 seconds? How do they catch up on missed messages?"`
    },
    {
      speaker: "raj",
      text: `"This is one of the hardest parts of real-time systems. You need a <em>message replay</em> mechanism. Every message gets a monotonically increasing sequence number or a timestamp. The client stores the last sequence number it received. On reconnect, it sends that sequence number to the server: 'give me everything after seq 4821.' The server queries its message store — you've been persisting to a database or Redis Stream — and replays any missed messages. This is exactly how Socket.IO's connection state recovery works, and it's how Kafka consumers work: each consumer tracks its own offset and replays from there."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// MESSAGE REPLAY — catch up after reconnection
// ─────────────────────────────────────────────────────

// Redis Streams — perfect for ordered, replayable event logs
const redis = new Redis(process.env.REDIS_URL);

// Publish an event to a stream
async function publishEvent(streamKey, payload) {
  // XADD appends to stream and returns an auto-generated ID: "timestamp-seq"
  const id = await redis.xadd(streamKey, '*', 'data', JSON.stringify(payload));
  return id; // e.g. "1710532800000-0"
}

// Client reconnects with last seen ID
async function replayMissed(streamKey, lastSeenId, ws) {
  // XRANGE returns all messages after lastSeenId
  const messages = await redis.xrange(
    streamKey,
    lastSeenId ? '(' + lastSeenId : '-', // exclusive of lastSeenId if provided
    '+',                                  // up to latest
    'COUNT', 100                          // max 100 replayed messages
  );

  messages.forEach(([id, fields]) => {
    const payload = JSON.parse(fields[1]); // fields = ['data', '{"..."}']
    ws.send(JSON.stringify({ ...payload, _replayId: id }));
  });

  return messages.length > 0 ? messages.at(-1)[0] : lastSeenId;
}

// On WebSocket connection
wss.on('connection', async (ws, req) => {
  const { userId, lastSeenId, roomId } = parseQueryParams(req.url);

  // Register connection
  registerConnection(userId, ws);
  joinRoom(ws, roomId);

  // Replay any messages missed while disconnected
  if (lastSeenId) {
    await replayMissed('stream:' + roomId, lastSeenId, ws);
  }

  ws.on('message', (raw) => handleMessage(ws, JSON.parse(raw)));
  ws.on('close',   ()    => { removeConnection(userId, ws); leaveAllRooms(ws); });
});

// Client tracks last seen ID and sends on reconnect
// const ws = new WebSocket(\`wss://api.example.com/ws?lastSeenId=\${lastId}\`);

// ─────────────────────────────────────────────────────
// SOCKET.IO — connection state recovery built-in
// ─────────────────────────────────────────────────────
const io = new Server(httpServer, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // recover within 2 minutes
    skipMiddlewares: true,
  }
});

io.on('connection', (socket) => {
  if (socket.recovered) {
    // Socket.IO automatically replayed missed events — nothing to do
    console.log('Recovered session, missed events replayed automatically');
  } else {
    // New connection or recovery window expired — send full initial state
    sendInitialState(socket);
  }
});`
    },

    // ── Back-pressure and rate limiting ──
    {
      speaker: "raj",
      text: `"One more thing that trips people up in interviews: what happens if you're pushing updates faster than a slow client can consume them?"`
    },
    {
      speaker: "you",
      text: `"The buffer fills up? The client falls behind?"`
    },
    {
      speaker: "raj",
      text: `"The WebSocket send buffer fills up. If you keep pushing, Node starts buffering in memory. If you never drain, you get an OOM crash or the connection gets forcibly dropped. This matters for things like stock tickers — if prices update 100 times per second but your client only renders at 30fps, you're generating 70 redundant updates per second per client. The fix: <em>throttle or debounce at the server before sending</em>. For a price feed, coalesce updates — send the latest value on a fixed interval, drop intermediate values. Check <em>ws.bufferedAmount</em> before sending — if the buffer is growing, slow down or drop frames. For a chat message you'd never drop, but for a position update where only the latest value matters, intermediate values are genuinely useless."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// BACK-PRESSURE & THROTTLING
// ─────────────────────────────────────────────────────

// ❌ Naive: push every update immediately
stockFeed.on('price', (update) => {
  clients.forEach(ws => ws.send(JSON.stringify(update)));
  // At 100 updates/sec with 10k clients: 1M send calls/sec
  // Slow clients build up a backlog → OOM → crash
});

// ✅ Coalescing ticker: keep latest value, flush on interval
class ThrottledFeed {
  constructor(ws, intervalMs = 100) {
    this.ws       = ws;
    this.pending  = new Map(); // symbol → latest price
    this.interval = setInterval(() => this.flush(), intervalMs);
  }

  update(symbol, price) {
    this.pending.set(symbol, price); // overwrite — only latest matters
  }

  flush() {
    if (this.pending.size === 0) return;
    if (this.ws.readyState !== this.ws.OPEN) return;

    // Back-pressure check: if buffer is growing, skip this frame
    if (this.ws.bufferedAmount > 1024 * 64) { // > 64KB buffered
      console.warn('Client too slow — skipping frame', this.ws.userId);
      this.pending.clear();
      return;
    }

    this.ws.send(JSON.stringify({ type: 'price_batch', updates: Object.fromEntries(this.pending) }));
    this.pending.clear();
  }

  destroy() { clearInterval(this.interval); }
}

// Per-client throttled feed
wss.on('connection', (ws) => {
  const feed = new ThrottledFeed(ws, 100); // max 10 updates/sec per client

  stockFeed.on('price', ({ symbol, price }) => feed.update(symbol, price));

  ws.on('close', () => {
    feed.destroy();
    stockFeed.removeAllListeners('price'); // clean up listener
  });
});

// ─────────────────────────────────────────────────────
// PRESENCE — who is currently online
// ─────────────────────────────────────────────────────
// Common interview follow-up: how do you show who's online?

// Redis SET with TTL: each server registers its connected users
async function markOnline(userId) {
  await redis.setex('online:' + userId, 60, '1'); // expire in 60s
}

async function refreshPresence(userId) {
  await redis.expire('online:' + userId, 60); // reset TTL on activity
}

async function isOnline(userId) {
  return !!(await redis.exists('online:' + userId));
}

// Heartbeat refreshes presence — client sends ping every 30s
ws.on('message', async (raw) => {
  const msg = JSON.parse(raw);
  await refreshPresence(ws.userId); // any message counts as activity
  if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
});`
    },

    {
      type: "summary",
      points: [
        "Polling is the server being asked. Real-time is the server telling. Polling pays full HTTP overhead for every 'no change' response — unacceptable at scale or sub-second latency.",
        "Three technologies: WebSockets (bidirectional, persistent, low overhead — chat, games, collaboration), SSE (server→client only, auto-reconnect, HTTP/2 native — feeds, notifications), long polling (fake real-time over HTTP — broad compatibility, infrequent updates).",
        "The multi-server problem: WebSocket connections are sticky to one process. Redis Pub/Sub bridges them — every server publishes events, every server subscribes, only the server holding the connection delivers.",
        "Rooms/channels: address by topic, not by user. All clients watching the same stock join 'stock:AAPL' — one broadcast call fans out to all of them.",
        "Message replay on reconnect: assign monotonically increasing IDs, client sends its last-seen ID on reconnect, server replays missed messages from a Redis Stream or database. Socket.IO connection state recovery automates this.",
        "Back-pressure: if you push faster than a slow client can consume, the send buffer grows → OOM. Fix: coalesce updates (keep latest, discard intermediate), check ws.bufferedAmount before sending, throttle to a fixed interval.",
        "Presence: Redis key with a TTL per user, refreshed on any activity. Key expires when the client goes silent. Accurate online/offline without a central registry.",
        "Heartbeats serve two purposes: keep connections alive through proxies that time out idle TCP connections, and detect dead connections that didn't send a FIN (mobile network drops)."
      ]
    }
  ]
};

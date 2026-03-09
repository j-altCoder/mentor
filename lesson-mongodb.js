// ─────────────────────────────────────────────────────────────────
//  LESSON: Database & MongoDB
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_MONGODB = {
  category: "Language & Framework Fundamentals",
  tag: "Database & MongoDB",
  title: "How MongoDB Actually Stores, Finds, and Scales Your Data",
  intro: "Sprint review. You're presenting the new data model. The tech lead squints at the schema and asks one question that stops you cold: 'Why did you embed this instead of reference it?' Raj mouths two words from across the room: 'explain it.'",
  scenes: [

    // ── Document model vs relational ──
    {
      speaker: "raj",
      text: `"Before you answer that, let's back up. Why does MongoDB exist at all? What problem does the document model solve that SQL doesn't?"`
    },
    {
      speaker: "you",
      text: `"It's more flexible? You don't need a fixed schema?"`
    },
    {
      speaker: "raj",
      text: `"That's part of it. The deeper answer: <em>data locality</em>. In SQL, related data lives in separate tables — you JOIN them at query time. A blog post and its comments are in two tables. To read a post with its 10 comments is a JOIN across rows. In MongoDB, you can store the post and its comments as one document. One read from disk gives you everything. No JOIN. That's the fundamental performance trade. MongoDB trades the flexibility of ad-hoc relational queries for the speed of reading a whole entity in one shot. The schema flexibility is a consequence of that design — if your data is a document, it doesn't need to be forced into rigid columns."`
    },
    {
      type: "analogy",
      text: "SQL = a filing cabinet with separate drawers for every category. To assemble a complete record you pull from multiple drawers. MongoDB = a folder with everything about one subject already together inside it. One pull, complete picture — but you can't easily cross-reference drawers."
    },

    // ── Embed vs Reference ──
    {
      speaker: "you",
      text: `"So back to the tech lead's question — when do you embed and when do you reference?"`
    },
    {
      speaker: "raj",
      text: `"There are three questions to ask. One: <em>does this data belong to exactly one parent?</em> A user's address, an order's line items — those belong to one document. Embed them. Two: <em>how often do you read this data together?</em> If you almost always fetch a post with its comments, embedding is faster — one read. If you rarely need the comments, embedding wastes read bandwidth. Three: <em>will the embedded array grow unboundedly?</em> MongoDB documents have a 16MB limit. Embedding 10 line items in an order is fine. Embedding all posts a user has ever liked will eventually blow past 16MB and corrupt data in subtle ways."`
    },
    {
      speaker: "you",
      text: `"What about things like user → posts? The user didn't write the posts — the posts belong to the user. Should I embed?"`
    },
    {
      speaker: "raj",
      text: `"No — and this is where people go wrong. Posts are their own entity, they have their own lifecycle, they can be queried independently, and a prolific user could have thousands. Store posts as their own collection with a userId field. Reference, not embed. The rule of thumb: <em>embed for composition, reference for association</em>. A line item is part of an order — composition, embed. A post is associated with a user but is its own thing — association, reference."`
    },
    {
      type: "code",
      text: `// ✅ Embed — data belongs to exactly one parent, read together, bounded size
const orderSchema = new Schema({
  userId:    { type: ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['pending','paid','shipped'], default: 'pending' },
  lineItems: [{          // always read with order, bounded, belongs to order
    productId: ObjectId,
    name:      String,   // denormalized — store name at time of purchase
    price:     Number,
    qty:       Number
  }],
  shippingAddress: {     // belongs to this order specifically
    street: String, city: String, postcode: String
  },
  total: Number
});

// ✅ Reference — own lifecycle, queried independently, potentially unbounded
const postSchema = new Schema({
  userId:  { type: ObjectId, ref: 'User', required: true }, // reference
  title:   String,
  content: String,
  tags:    [String]
});

// ❌ Embed — will grow unboundedly, blows 16MB limit
const userSchema = new Schema({
  name:  String,
  posts: [postSchema]  // a user could have 100,000 posts
  // document grows forever → eventually hits 16MB → writes fail
});

// Hybrid — reference with denormalized hot data
const commentSchema = new Schema({
  postId:   { type: ObjectId, ref: 'Post' },
  authorId: { type: ObjectId, ref: 'User' },
  author: {            // denormalize just the display name — avoids JOIN on read
    name:   String,
    avatar: String
  },
  content: String
});`
      
    },

    // ── Indexes deep dive ──
    {
      speaker: "raj",
      text: `"Let's talk indexes properly — not just 'they make queries faster.' What does an index actually store?"`
    },
    {
      speaker: "you",
      text: `"A sorted copy of the field?"`
    },
    {
      speaker: "raj",
      text: `"Close. A B-tree. A balanced tree structure where each node holds a range of values and pointers. The tree stays balanced as documents are inserted so lookups are always O(log n) — you traverse from root to leaf to find the value, then get a pointer to the actual document. Without an index, MongoDB does a <em>collection scan</em> — reads every document in the collection to find matches — O(n). With a million documents, the difference between O(log n) and O(n) is the difference between microseconds and seconds. Every index comes with a cost though: inserts, updates, and deletes must update every index on the collection. An over-indexed collection writes slowly."`
    },
    {
      speaker: "you",
      text: `"What's a compound index and why does the order of fields matter?"`
    },
    {
      speaker: "raj",
      text: `"A compound index indexes multiple fields together in one B-tree. The field order determines what queries the index can serve. An index on <em>{ userId: 1, status: 1, createdAt: -1 }</em> can serve queries that filter on userId alone, or userId + status, or userId + status + createdAt — always left to right. It cannot efficiently serve a query that only filters on status without userId because the tree is sorted by userId first. This is the <em>ESR rule</em> — put Equality fields first, then Sort fields, then Range fields. Your equality filters narrow the result set the most — that goes first."`
    },
    {
      type: "code",
      text: `// Index types and when to use each

// Single field
db.orders.createIndex({ userId: 1 });           // ascending
db.orders.createIndex({ createdAt: -1 });        // descending (for newest first sorts)

// Compound — field order is critical (ESR rule: Equality, Sort, Range)
db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 });
// Serves: filter on userId                     ✓
//         filter on userId + status            ✓
//         filter on userId + status, sort by createdAt ✓
//         filter on status alone               ✗ (can't skip first field)

// Text index — full-text search
db.products.createIndex({ name: 'text', description: 'text' });
db.products.find({ $text: { $search: 'wireless keyboard' } },
                 { score: { $meta: 'textScore' } })
           .sort({ score: { $meta: 'textScore' } }); // sorted by relevance

// Sparse index — only indexes documents that HAVE the field
db.users.createIndex({ googleId: 1 }, { sparse: true });
// Doesn't index documents where googleId is null/missing — smaller index

// Partial index — only indexes documents that match a filter condition
db.orders.createIndex(
  { createdAt: -1 },
  { partialFilterExpression: { status: 'pending' } }
);
// Only indexes pending orders — much smaller, faster for pending-only queries

// TTL index — auto-deletes documents after a time period
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
// MongoDB background job deletes documents where createdAt > 24 hours ago

// Check index usage with explain
db.orders.find({ userId: 'abc', status: 'paid' })
         .sort({ createdAt: -1 })
         .explain('executionStats');
// Check: winningPlan.stage === 'IXSCAN' (good) vs 'COLLSCAN' (add an index)
// Check: totalKeysExamined vs nReturned — close = efficient, far apart = poor selectivity`
      
    },

    // ── Aggregation pipeline ──
    {
      speaker: "you",
      text: `"I always reach for find() but sometimes I need totals, groups, averages. When should I use the aggregation pipeline?"`
    },
    {
      speaker: "raj",
      text: `"Whenever find() doesn't give you the shape of data you need. <em>find()</em> returns documents as they are — filtered and projected. The <em>aggregation pipeline</em> transforms data — group it, sum it, join it, reshape it, compute derived values. Think of it as a sequence of stages where each stage takes the output of the previous. The most important stages: <em>$match</em> to filter early and use indexes, <em>$group</em> to aggregate by a field, <em>$lookup</em> to join with another collection, <em>$project</em> to reshape the output, <em>$sort</em> and <em>$limit</em> for ordering and pagination. Critical performance rule: <em>$match as early as possible</em>. If you filter after a $group, you've already aggregated millions of documents you then discard."`
    },
    {
      type: "code",
      text: `// Aggregation pipeline — real examples

// Revenue by month for the last 6 months
const revenue = await Order.aggregate([
  { $match: {                                    // filter FIRST — uses index
      status: 'paid',
      createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
  }},
  { $group: {
      _id: {                                     // group by year + month
        year:  { $year:  '$createdAt' },
        month: { $month: '$createdAt' }
      },
      total:  { $sum:  '$total' },               // sum order totals
      count:  { $sum:  1 },                      // count orders
      avgOrder: { $avg: '$total' }               // average order value
  }},
  { $sort: { '_id.year': 1, '_id.month': 1 } },
  { $project: {
      _id:       0,
      month:     { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }] },
      total:     { $round: ['$total', 2] },
      count:     1,
      avgOrder:  { $round: ['$avgOrder', 2] }
  }}
]);

// $lookup — join orders with user data (like SQL LEFT JOIN)
const ordersWithUsers = await Order.aggregate([
  { $match: { status: 'pending' } },
  { $lookup: {
      from:         'users',          // collection to join
      localField:   'userId',         // field in orders
      foreignField: '_id',            // field in users
      as:           'user',           // output field name
      pipeline: [                     // optional — project only needed fields
        { $project: { name: 1, email: 1 } }
      ]
  }},
  { $unwind: '$user' },               // flatten the array $lookup produces
  { $project: {
      orderId: '$_id', total: 1, status: 1,
      userName:  '$user.name',
      userEmail: '$user.email'
  }}
]);

// Faceted search — multiple aggregations in one pass
const searchResults = await Product.aggregate([
  { $match: { $text: { $search: 'laptop' } } },
  { $facet: {
    results: [
      { $sort: { score: { $meta: 'textScore' } } },
      { $limit: 20 }
    ],
    byBrand: [
      { $group: { _id: '$brand', count: { $sum: 1 } } }
    ],
    priceRange: [
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]
  }}
]);`
      
    },

    // ── Transactions ──
    {
      speaker: "you",
      text: `"MongoDB supports transactions now, right? When do I actually need them?"`
    },
    {
      speaker: "raj",
      text: `"MongoDB added multi-document ACID transactions in version 4.0, but you need a replica set for them to work — not a standalone server. You need transactions when you're making multiple writes that must all succeed or all fail together. Classic example: user buys a product. You deduct stock from inventory, create an order record, and deduct from the user's credit. If the order creation succeeds but the stock deduction fails, you've sold something you don't have. Wrap all three in a transaction — either all happen, or none do."`
    },
    {
      speaker: "you",
      text: `"Are there downsides to using transactions everywhere?"`
    },
    {
      speaker: "raj",
      text: `"Yes — they add overhead. The session object, the two-phase commit protocol under the hood, the locks held during the transaction. Single-document writes are atomic without a transaction in MongoDB — always have been. If your write touches one document, don't use a transaction. If you've modeled your data well with embedding, many operations that would need a SQL transaction can be done with a single atomic document update in MongoDB. Transactions are the escape hatch for the cases you can't avoid."`
    },
    {
      type: "code",
      text: `// MongoDB transactions — require replica set (even local dev: mongod --replSet rs0)
const session = await mongoose.startSession();

try {
  await session.withTransaction(async () => {
    // All operations in here are atomic — all succeed or all rollback

    // 1. Check and deduct stock
    const product = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: qty } }, // only if stock available
      { $inc: { stock: -qty } },
      { session, new: true }
    );
    if (!product) throw new Error('Insufficient stock'); // triggers rollback

    // 2. Create order
    const [order] = await Order.create([{
      userId, productId, qty, total: product.price * qty, status: 'paid'
    }], { session }); // ← must pass session to every operation

    // 3. Record payment
    await Payment.create([{
      orderId: order._id, userId, amount: order.total, status: 'completed'
    }], { session });

    // If any step throws — all three operations are rolled back
    return order;
  });
} finally {
  await session.endSession();
}

// Single-document atomicity — no transaction needed
// $inc, $push, $set are atomic on a single document
await User.findByIdAndUpdate(userId, {
  $inc:  { credits: -100 },      // atomic decrement
  $push: { purchaseHistory: orderId } // atomic array push
});
// Both operations happen atomically — no partial state possible`
      
    },

    // ── Change streams ──
    {
      speaker: "you",
      text: `"What are change streams? I've seen them mentioned but never used them."`
    },
    {
      speaker: "raj",
      text: `"<em>Change streams</em> let you listen to real-time changes in a MongoDB collection — inserts, updates, deletes — without polling. They're built on the <em>oplog</em>, which is MongoDB's internal log of every write operation used for replica set replication. When a change happens, MongoDB publishes it and your app receives it immediately. Use cases: real-time notifications — a user's order status changes, push a notification. Event sourcing — every DB change becomes an event your other services can react to. Cache invalidation — a document changes, bust the relevant cache key automatically."`
    },
    {
      type: "code",
      text: `// Change streams — real-time DB event listener
const Order = mongoose.model('Order', orderSchema);

// Watch all changes to the orders collection
const changeStream = Order.watch([
  { $match: {
    'operationType': { $in: ['insert', 'update'] },
    'fullDocument.status': 'shipped'              // only status=shipped changes
  }}
], { fullDocument: 'updateLookup' }); // include the full updated document

changeStream.on('change', async (change) => {
  const order = change.fullDocument;

  if (change.operationType === 'update' && order.status === 'shipped') {
    // Trigger downstream effects without polling
    await sendShippingNotification(order.userId, order._id);
    await emailQueue.add('shipping-confirmation', { orderId: order._id });
  }
});

changeStream.on('error', (err) => {
  logger.error('Change stream error', err);
  // Reconnect with resume token — don't miss events during reconnection
});

// Resume token — pick up from where you left off after disconnect
let resumeToken;
changeStream.on('change', (change) => {
  resumeToken = change._id; // save this to DB or Redis
  processChange(change);
});

// On reconnect — resume from saved token
const resumedStream = Order.watch(pipeline, { resumeAfter: resumeToken });`
      
    },

    // ── Mongoose vs native driver ──
    {
      speaker: "you",
      text: `"When would I use the native MongoDB driver instead of Mongoose?"`
    },
    {
      speaker: "raj",
      text: `"Mongoose gives you a lot for free — schema validation, type casting, virtuals, middleware hooks, populate, model methods. It's the right choice for 90% of applications. The native driver is lower level — you're closer to the wire, less magic, more control. Use the native driver when: you're building a script or tool that needs to work with arbitrary collections without predefined schemas. You're doing highly optimised bulk operations where Mongoose's overhead matters. You're using MongoDB features that Mongoose doesn't expose well — like very complex aggregation pipelines or native bulk write operations. Or you're building a library that shouldn't impose Mongoose as a dependency on users."`
    },
    {
      type: "code",
      text: `// Mongoose — schema-driven, validation, middleware, populate
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name:  { type: String, required: true, trim: true },
  role:  { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Schema middleware — runs automatically
userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

// Virtual — computed field not stored in DB
userSchema.virtual('displayName').get(function() {
  return this.name.split(' ')[0]; // first name only
});

const User = mongoose.model('User', userSchema);
await User.create({ email: 'test@example.com', name: 'Alice' }); // validated + cast

// Native driver — raw, no schema, no magic
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.DATABASE_URL);
const db     = client.db('myapp');

// Bulk write — faster than individual Mongoose saves for large batches
const bulkOps = users.map(user => ({
  insertOne: { document: user }
}));
await db.collection('users').bulkWrite(bulkOps, { ordered: false });
// ordered: false = continue even if some ops fail (faster, reports all errors)

// When Mongoose overhead matters — lean() closes the gap for reads
const users = await User.find({}).lean(); // plain JS objects, no Mongoose wrapping`
      
    },

    // ── Replica sets explained ──
    {
      speaker: "you",
      text: `"I know replica sets are for redundancy. But can you explain exactly how they work — how does data actually get from the primary to the replicas?"`
    },
    {
      speaker: "raj",
      text: `"Through the <em>oplog</em> — operations log. Every write to the primary gets recorded as an entry in the oplog — a special capped collection that acts as a circular buffer. Each secondary node has a background process that continuously tails the primary's oplog and applies the same operations to itself. It's like the secondaries are replaying everything the primary did, in order. The primary holds an election when it becomes unavailable — remaining nodes vote and the most up-to-date secondary becomes the new primary. This is why you need an odd number of nodes — to avoid split votes."`
    },
    {
      speaker: "you",
      text: `"What's a write concern and a read preference?"`
    },
    {
      speaker: "raj",
      text: `"<em>Write concern</em> controls how many nodes must acknowledge a write before MongoDB considers it successful. Write concern 1 means only the primary confirmed — fast but if the primary crashes before replication, that write is lost. Write concern 'majority' means more than half the nodes confirmed — survives primary failure because the new primary will have seen that write. <em>Read preference</em> controls which node reads go to. Primary only — fresh data, higher load. Secondary — might be slightly stale, but offloads the primary. secondaryPreferred — reads go to secondary when available, primary when not. Balance freshness against load distribution."`
    },
    {
      type: "code",
      text: `// Replica set connection — list all nodes, driver handles failover
mongoose.connect(
  'mongodb://primary:27017,secondary1:27017,secondary2:27017/myapp?replicaSet=rs0'
);

// Write concern — how many nodes must acknowledge before 'success'
await Order.create(orderData, {
  writeConcern: { w: 'majority', j: true }
  // w: 'majority' = more than half of nodes confirmed the write
  // j: true       = write must be on disk (journal) before acknowledging
  // Survives primary crash — guarantees data durability
});

// For less critical writes — faster, weaker guarantee
await Log.create(logEntry, {
  writeConcern: { w: 1 } // only primary confirmed — fast, slight risk
});

// Read preference — where reads go
// Primary reads — always fresh
const user = await User.findById(userId).read('primary');

// Secondary reads — might be slightly stale (ms to low seconds lag)
const stats = await AnalyticEvent.countDocuments().read('secondary');

// SecondaryPreferred — secondary if available, fallback to primary
const posts = await Post.find({ published: true }).read('secondaryPreferred');

// Check replica set status
db.adminCommand({ replSetGetStatus: 1 })
// Shows: primary, secondaries, each node's optime lag, who's healthy`
      
    },

    // ── Sharding mechanics ──
    {
      speaker: "you",
      text: `"When you shard a MongoDB collection, how does it actually know which shard to query?"`
    },
    {
      speaker: "raj",
      text: `"There are three components: <em>shards</em> — each a replica set holding a subset of data. <em>mongos</em> — a router process your app connects to instead of connecting to shards directly. <em>Config servers</em> — a replica set that holds the chunk map — which shard holds which range of data. When you run a query, mongos looks up the config servers to find which shard(s) hold matching documents, routes the query there, and merges the results. If your query includes the shard key, mongos routes to exactly one shard. If it doesn't include the shard key, mongos has to ask all shards — that's a <em>scatter-gather</em> query, which you want to avoid."`
    },
    {
      speaker: "you",
      text: `"How do you choose a good shard key?"`
    },
    {
      speaker: "raj",
      text: `"Three properties you want. <em>High cardinality</em> — enough unique values to spread data evenly. A boolean field has two values — all documents land on two shards, no scalability. <em>Even distribution</em> — data spread roughly equally across shards. If you shard by country and 80% of your users are in the US, the US shard is a hotspot doing all the work. <em>Query isolation</em> — the shard key appears in your most common queries so mongos can route to one shard. UserId is usually a good shard key — high cardinality, usually even distribution, and most queries are for a specific user. Sequential fields like ObjectId or timestamp are bad — all new inserts land on one shard until the range fills up."`
    },
    {
      type: "code",
      text: `// Sharding setup (admin commands)
// 1. Enable sharding on the database
sh.enableSharding('myapp');

// 2. Create index on shard key FIRST
db.orders.createIndex({ userId: 'hashed' }); // hashed = even distribution

// 3. Shard the collection
sh.shardCollection('myapp.orders', { userId: 'hashed' });
// Hashed sharding: MongoDB hashes userId value → distributes evenly
// Range sharding:  sh.shardCollection('myapp.orders', { userId: 1 })
//                  Pro: range queries efficient. Con: hotspots on sequential keys

// Your app connects to mongos — same Mongoose connection string, no code change
mongoose.connect('mongodb://mongos-host:27017/myapp');

// Queries WITH shard key — routed to ONE shard (fast)
const orders = await Order.find({ userId: req.user.userId });

// Queries WITHOUT shard key — broadcast to ALL shards (slow — avoid)
const allPending = await Order.find({ status: 'pending' }); // scatter-gather

// Check shard distribution
db.orders.getShardDistribution();
// Shows: which shards hold which chunks, document counts per shard
// Look for even distribution — if one shard has 80% of docs, re-shard or change key`
      
    },

    // ── Schema design patterns ──
    {
      speaker: "raj",
      text: `"Let me give you two schema design patterns interviewers love to ask about. The <em>Bucket Pattern</em> and the <em>Outlier Pattern</em>."`
    },
    {
      speaker: "you",
      text: `"Never heard of either. Go on."`
    },
    {
      speaker: "raj",
      text: `"<em>Bucket Pattern</em>: imagine IoT sensor data — a device reports temperature every second. Storing each reading as a document means billions of tiny documents, massive index overhead, terrible performance. Instead, bucket readings into hourly documents — one document per sensor per hour, with an array of 3600 readings. Dramatically fewer documents, index covers one lookup per hour instead of 3600. The <em>Outlier Pattern</em>: you embed an array of user IDs who liked a post — works great until a post goes viral and gets 10 million likes. The document hits 16MB. Solution: add a flag <em>hasOverflow: true</em> on the main document and store the excess likes in a separate overflow collection. Your code checks the flag and queries the overflow when needed. Normal posts — one document. Viral posts — main doc plus overflow. The common case stays fast."`
    },
    {
      type: "code",
      text: `// Bucket Pattern — IoT sensor readings
// ❌ One document per reading — billions of tiny docs
{ sensorId: 'sensor-1', temp: 22.4, timestamp: ISODate('2024-03-10T14:00:01') }
{ sensorId: 'sensor-1', temp: 22.5, timestamp: ISODate('2024-03-10T14:00:02') }
// ...3600 documents per sensor per hour

// ✅ Bucket Pattern — one document per sensor per hour
{
  sensorId:  'sensor-1',
  hour:      ISODate('2024-03-10T14:00:00'),
  readings:  [22.4, 22.5, 22.3, ...],  // up to 3600 values
  count:     3600,
  minTemp:   21.8,
  maxTemp:   23.1,
  avgTemp:   22.4                        // pre-computed — no aggregation needed
}
// 1 document instead of 3600 — index lookup 3600x cheaper

// Outlier Pattern — viral posts problem
// ❌ Embed all likes — hits 16MB on viral posts
{ _id: postId, likes: ['user1', 'user2', ..., 'user10000000'] }

// ✅ Outlier Pattern — cap embedded array, overflow to separate collection
const postSchema = new Schema({
  title:       String,
  likes:       [{ type: ObjectId, ref: 'User' }], // first 1000 likes embedded
  likeCount:   { type: Number, default: 0 },
  hasOverflow: { type: Boolean, default: false }   // flag for viral posts
});

// When a post exceeds 1000 likes:
await Post.findByIdAndUpdate(postId, {
  $push: likes.length < 1000 ? { likes: userId } : {},
  $inc:  { likeCount: 1 },
  $set:  likes.length >= 1000 ? { hasOverflow: true } : {}
});
if (likes.length >= 1000) {
  await LikesOverflow.create({ postId, userId });
}

// Query: if hasOverflow, also check overflow collection
const getLikes = async (postId) => {
  const post = await Post.findById(postId).select('likes likeCount hasOverflow');
  if (!post.hasOverflow) return post.likes;
  const overflow = await LikesOverflow.find({ postId }).select('userId');
  return [...post.likes, ...overflow.map(o => o.userId)];
};`
      
    },

    // ── Atlas Search ──
    {
      speaker: "you",
      text: `"Our search is just using a text index and $text queries. Is that good enough?"`
    },
    {
      speaker: "raj",
      text: `"$text search is basic — it splits on whitespace, does exact word matching with stemming. It doesn't handle typos, synonyms, relevance ranking beyond a simple score, or filtering facets efficiently. For real product search you want <em>Atlas Search</em> — MongoDB's Lucene-based full-text search. It handles fuzzy matching, autocomplete, synonym groups, custom scoring, and returns facets all in one aggregation stage. If you're not on Atlas, the equivalent is running Elasticsearch and syncing your MongoDB data to it with a change stream. Atlas Search is just Elasticsearch running beside your cluster without you managing it."`
    },
    {
      type: "code",
      text: `// Basic $text search — simple, limited
db.products.createIndex({ name: 'text', description: 'text' });
db.products.find(
  { $text: { $search: 'wirelss keyboard' } },  // no typo tolerance
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });

// Atlas Search — full-text search with fuzzy matching, facets, autocomplete
const results = await Product.aggregate([
  { $search: {
    index: 'products_search',
    compound: {
      must: [{
        text: {
          query: 'wireless keyboard',
          path:  ['name', 'description'],
          fuzzy: { maxEdits: 1 }           // handles 1-character typos
        }
      }],
      filter: [{
        range: { path: 'price', gte: 20, lte: 200 }
      }]
    }
  }},
  { $facet: {
    results: [
      { $addFields: { score: { $meta: 'searchScore' } } },
      { $sort: { score: -1 } },
      { $limit: 20 }
    ],
    brands: [
      { $sortByCount: '$brand' }          // count by brand for filter sidebar
    ],
    totalCount: [
      { $count: 'count' }
    ]
  }}
]);`
      
    },

    {
      type: "summary",
      points: [
        "Document model = data locality — read one document, get everything. SQL = JOIN at query time. Tradeoff: read speed vs query flexibility.",
        "Embed for composition (belongs to one parent, read together, bounded). Reference for association (own lifecycle, queried independently, potentially large).",
        "Never embed unboundedly growing arrays — MongoDB documents have a 16MB limit.",
        "Indexes are B-trees — O(log n) lookup vs O(n) full scan. Every index slows writes — don't over-index.",
        "Compound index field order: ESR rule — Equality first, Sort second, Range third. Left-to-right prefix matching.",
        "Partial and sparse indexes — index only the subset you query. Dramatically smaller and faster.",
        "TTL indexes — auto-delete documents after a time period. No cron job needed for session/token expiry.",
        "$match first in aggregation pipelines — uses indexes, eliminates documents before grouping.",
        "$lookup = MongoDB JOIN. $facet = multiple aggregations in one pipeline pass.",
        "Transactions needed for multi-document atomic writes. Single-document writes are always atomic — no transaction needed.",
        "Write concern 'majority' = survives primary failure. Write concern 1 = fast but risks data loss on crash.",
        "Read preference = primary (fresh) vs secondary (offload reads, slightly stale). Use secondaryPreferred for analytics.",
        "Oplog = MongoDB's internal write log. Replicas tail it to stay in sync. Change streams are built on the oplog.",
        "Shard key properties: high cardinality, even distribution, appears in common queries. Avoid sequential keys — causes hotspots.",
        "Queries without shard key = scatter-gather across all shards. Always include shard key in frequent queries.",
        "Mongoose = schema, validation, middleware, virtuals. Native driver = raw access, bulk ops, full control. lean() closes read overhead gap.",
        "Bucket pattern = aggregate time-series into hourly/daily documents. Outlier pattern = cap embedded arrays, overflow large cases."
      ]
    }
  ]
};

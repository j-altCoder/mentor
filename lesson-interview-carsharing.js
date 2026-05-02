// ─────────────────────────────────────────────────────────────────
//  MOCK INTERVIEW: System Design — Car-Sharing App
//  Category: System Design
//  Format: Technical Interview (45 minutes)
// ─────────────────────────────────────────────────────────────────

const INTERVIEW_CAR_SHARING_SYSTEM_DESIGN = {
  category: "Career & Interview Prep",
  tag: "Mock Interview",
  title: "Design a Car-Sharing App",
  intro: "You're in a conference room. Raj is your interviewer today. There's a whiteboard, a marker, and forty-five minutes. He slides a printed sheet across the table: 'Design a car-sharing application like Uber or Lyft.' He leans back. 'Walk me through it.'",
  scenes: [

    // ── 1. Clarifying requirements ──
    {
      speaker: "you",
      text: `"Before I jump in — can I ask a few questions to scope this?"`
    },
    {
      speaker: "raj",
      text: `"Please."`
    },
    {
      speaker: "you",
      text: `"Are we building the full thing — riders, drivers, payments, maps — or is there a specific part to focus on?"`
    },
    {
      speaker: "raj",
      text: `"Assume full scope. Rider requests a ride, driver accepts, trip happens, payment processes. What else do you want to know?"`
    },
    {
      speaker: "you",
      text: `"Scale. Are we talking a city, a country, global?"`
    },
    {
      speaker: "raj",
      text: `"Global. Think Uber-scale. What does that mean to you in numbers?"`
    },
    {
      speaker: "you",
      text: `"I'd estimate — maybe a hundred million registered users, a few million active drivers. At peak, maybe a million concurrent ride requests across all cities. Trip completion... probably ten million trips per day?"`
    },
    {
      speaker: "raj",
      text: `"Reasonable ballpark. Keep going."`
    },
    {
      speaker: "you",
      text: `"Driver location updates — if every active driver pings their location every few seconds, that's the highest-throughput part of the whole system. Say two million active drivers, one update every four seconds — that's five hundred thousand writes per second just for location data. That's going to drive a lot of architectural decisions."`
    },
    {
      speaker: "raj",
      text: `"Good instinct to flag that early. What are your non-functional requirements?"`
    },
    {
      speaker: "you",
      text: `"Low latency on matching — a rider shouldn't wait more than a few seconds to see drivers. High availability — the app going down during a trip is a real safety issue, not just a UX issue. Eventual consistency is probably acceptable for things like ratings and history. But trip state and payments need to be strongly consistent — you can't double-charge someone or show a trip as completed when it isn't."`
    },
    {
      speaker: "raj",
      text: `"Good. Anything else before you start drawing?"`
    },
    {
      speaker: "you",
      text: `"One more — real-time or polling? I'm assuming the rider's app shows live driver location on a map, which means we need a real-time communication channel, not just REST polling."`
    },
    {
      speaker: "raj",
      text: `"Correct. Proceed."`
    },
    {
      type: "code",
      text: `// ── Requirements summary ──

// FUNCTIONAL
// Rider:  request a ride, see nearby drivers, track driver in real time,
//         complete trip, pay, rate driver
// Driver: go online/offline, receive ride requests, accept/decline,
//         navigate to rider, complete trip, rate rider
// System: match rider to nearest available driver, calculate fare,
//         process payment, handle surge pricing

// NON-FUNCTIONAL
// Scale:
//   - 100M registered users, ~2M active drivers at peak
//   - 10M trips/day ≈ 115 trips/second average, ~500/second at peak
//   - Driver location updates: 2M drivers × 1 update/4s = 500K writes/second
//   - Ride requests: much lower volume than location updates
//
// Latency:
//   - Matching: < 3 seconds from request to driver notified
//   - Location update visible to rider: < 2 seconds lag
//   - Payment: async OK — confirm trip immediately, settle in background
//
// Availability:
//   - Core trip flow: 99.99% (4 minutes downtime/month)
//   - Ratings, history, promotions: 99.9% acceptable
//
// Consistency:
//   - Strong: trip state, payments (can't double-charge or lose a trip record)
//   - Eventual: driver ratings, trip history, analytics
//
// Key insight to flag early:
//   Location ingestion (500K writes/second) and matching (low-latency spatial query)
//   are the two hardest parts of this system. Everything else is important but solvable
//   with standard patterns. These two drive the architecture.`
    },

    // ── 2. High-level components ──
    {
      speaker: "you",
      text: `"Let me start with the high-level components. I'd break this into: a Rider Service, a Driver Service, a Location Service, a Matching Service, a Trip Service, a Payment Service, and a Notification Service. Each owns its domain."`
    },
    {
      speaker: "raj",
      text: `"Why not one big service?"`
    },
    {
      speaker: "you",
      text: `"The location update volume is so different from everything else that it needs to scale independently. You don't want your payment logic on the same instances absorbing five hundred thousand writes per second. Separating them lets each service have its own scaling policy and its own data store optimised for what it actually does."`
    },
    {
      speaker: "raj",
      text: `"Good. How does a rider's request flow through those services? Walk me through it."`
    },
    {
      speaker: "you",
      text: `"Rider opens the app — the Location Service is already tracking nearby driver positions. Rider taps 'Request'. The request hits the Trip Service, which creates a trip in a 'requested' state. The Trip Service calls the Matching Service to find the best available driver. Matching Service queries the Location Service for drivers near the pickup point, picks the closest available one, and notifies them via the Notification Service. Driver accepts — trip moves to 'accepted'. Driver arrives, rider gets in, driver starts trip — 'in progress'. Trip ends, fare is calculated, Payment Service is triggered. Both sides can rate each other."`
    },
    {
      speaker: "raj",
      text: `"What if the driver doesn't respond?"`
    },
    {
      speaker: "you",
      text: `"Timeout. If the driver doesn't accept within — say fifteen seconds — the Matching Service tries the next best candidate. If no driver accepts after a few rounds, the trip goes to a 'no drivers available' state and the rider is notified. The timeout window and retry count are tunable based on city density."`
    },
    {
      type: "code",
      text: `// ── High-level architecture ──
//
//  ┌─────────────┐     ┌─────────────┐
//  │  Rider App  │     │  Driver App │
//  └──────┬──────┘     └──────┬──────┘
//         │                   │
//         ▼                   ▼
//  ┌─────────────────────────────────┐
//  │           API Gateway           │  auth, rate limiting, routing
//  └──┬──────┬──────┬──────┬─────┬──┘
//     │      │      │      │     │
//     ▼      ▼      ▼      ▼     ▼
//  Rider  Driver  Trip  Location  Payment
//  Service Service Service Service Service
//     │      │      │      │
//     │      │      │      └──► Location DB (Redis + geospatial index)
//     │      │      │
//     │      │      └──► Trip DB (PostgreSQL — strong consistency)
//     │      │      └──► Matching Service (reads from Location Service)
//     │      │      └──► Notification Service (push, SMS, WebSocket)
//     │      │
//     └──────┴──► User DB (PostgreSQL — rider/driver profiles)
//
// ── Request flow: rider books a ride ──
//
// 1. Rider app → API Gateway → Trip Service
//    POST /trips { riderId, pickupLat, pickupLng, dropoffLat, dropoffLng }
//    Trip created: status = 'searching'
//
// 2. Trip Service → Matching Service
//    "Find best available driver near (lat, lng)"
//
// 3. Matching Service → Location Service
//    "Give me available drivers within X km of (lat, lng), sorted by distance"
//
// 4. Matching Service → Notification Service
//    "Notify driver D1 of new trip request"
//    Start 15-second acceptance timer
//
// 5a. Driver accepts → Trip Service updates status = 'accepted'
//     Rider notified. Driver location stream begins for this rider.
//
// 5b. Driver doesn't respond within 15s → try next candidate
//     After N failed attempts → status = 'no_drivers_available', rider notified
//
// ── Why each service is separate ──
// Location Service:  500K writes/second — needs its own infra, its own store
// Matching Service:  CPU-intensive spatial queries — needs its own scaling
// Payment Service:   PCI compliance scope — must be isolated
// Notification:      Fan-out pattern, spiky load — separate queue workers`
    },

    // ── 3. Data model ──
    {
      speaker: "raj",
      text: `"Tell me about your data model. What are the core entities?"`
    },
    {
      speaker: "you",
      text: `"Users — covering both riders and drivers since a person could be both. Vehicles — linked to a driver, with make, model, plate, and capacity. Trips — the central entity, linking rider, driver, vehicle, pickup and dropoff coordinates, status, timestamps, and fare. Driver location — the current position of every active driver, which is really more of a cache than a record. Payments — linked to a trip, with amount, method, and status. Ratings — one per trip per direction, rider rates driver and driver rates rider."`
    },
    {
      speaker: "raj",
      text: `"Where does the trip fare get calculated? On the client or the server?"`
    },
    {
      speaker: "you",
      text: `"Server, always. The client shows an estimate before the trip starts — calculated from the expected route. But the actual fare is calculated server-side at trip completion, based on actual distance travelled and time taken, plus any surge multiplier that applied when the request was made. You can't trust the client for anything that has a financial consequence."`
    },
    {
      speaker: "raj",
      text: `"What's the surge multiplier based on? When is it set?"`
    },
    {
      speaker: "you",
      text: `"Supply and demand in a geographic area. High demand, low supply — multiplier goes up. It's set at the moment the rider makes the request, not when the trip ends. The rider is shown the surge multiplier before they confirm — they accept it, it's locked to the trip. If surge drops after they confirm, they don't automatically get the lower price."`
    },
    {
      speaker: "raj",
      text: `"Why lock it at request time?"`
    },
    {
      speaker: "you",
      text: `"Fairness and predictability. A rider shouldn't finish a trip and find they were charged a different surge than what they agreed to. And it protects against gaming — you can't wait out surge by delaying confirmation."`
    },
    {
      type: "code",
      text: `// ── Core data model ──

// ── users table ──
// id            UUID        PK
// email         TEXT        unique, not null
// phone         TEXT        unique, not null
// full_name     TEXT
// role          TEXT[]      ['rider'], ['driver'], or ['rider','driver']
// rating_avg    DECIMAL     denormalised average, updated async
// created_at    TIMESTAMPTZ

// ── driver_profiles table ──
// driver_id     UUID        FK → users.id
// license_no    TEXT        unique
// status        TEXT        'offline' | 'available' | 'on_trip'
// vehicle_id    UUID        FK → vehicles.id (current active vehicle)

// ── vehicles table ──
// id            UUID        PK
// driver_id     UUID        FK → users.id
// make          TEXT
// model         TEXT
// plate         TEXT        unique
// category      TEXT        'economy' | 'comfort' | 'xl'
// capacity      INT

// ── trips table ──  (the central entity — strong consistency required)
// id               UUID        PK
// rider_id         UUID        FK → users.id
// driver_id        UUID        FK → users.id, nullable until matched
// vehicle_id       UUID        FK → vehicles.id
// status           TEXT        see state machine below
// pickup_lat       DECIMAL
// pickup_lng       DECIMAL
// dropoff_lat      DECIMAL
// dropoff_lng      DECIMAL
// pickup_address   TEXT        human-readable, stored at request time
// dropoff_address  TEXT
// requested_at     TIMESTAMPTZ
// accepted_at      TIMESTAMPTZ
// pickup_at        TIMESTAMPTZ
// dropoff_at       TIMESTAMPTZ
// distance_km      DECIMAL     calculated at completion
// duration_min     INT
// base_fare        DECIMAL     calculated at completion
// surge_multiplier DECIMAL     locked at request time
// final_fare       DECIMAL
// currency         TEXT

// ── payments table ──
// id              UUID        PK
// trip_id         UUID        FK → trips.id, unique (one payment per trip)
// rider_id        UUID        FK → users.id
// amount          DECIMAL
// currency        TEXT
// method          TEXT        'card' | 'wallet' | 'cash'
// status          TEXT        'pending' | 'completed' | 'failed' | 'refunded'
// processor_ref   TEXT        external payment processor transaction ID
// idempotency_key TEXT        unique — prevents double charge on retry
// charged_at      TIMESTAMPTZ

// ── ratings table ──
// id          UUID        PK
// trip_id     UUID        FK → trips.id
// rater_id    UUID        FK → users.id
// ratee_id    UUID        FK → users.id
// score       INT         1–5
// comment     TEXT
// created_at  TIMESTAMPTZ
// UNIQUE(trip_id, rater_id)   — one rating per trip per rater

// ── Trip status state machine ──
// searching → accepted → driver_arriving → in_progress → completed
//                                                      └→ cancelled
// Any state → cancelled (with rules: driver cancels = no charge,
//             rider cancels after driver en route = cancellation fee)`
    },

    // ── 4. Location tracking ──
    {
      speaker: "raj",
      text: `"Let's talk about driver location. Five hundred thousand writes per second. How do you handle that?"`
    },
    {
      speaker: "you",
      text: `"Standard database — PostgreSQL, MySQL — is out immediately. Even with optimistic writes, you'd saturate it. I'd use Redis as the primary store for live driver positions. Redis can handle that write volume, it supports geospatial data natively with the GEO commands, and reads are sub-millisecond. Each driver's current location is a single key — you just overwrite it on every update."`
    },
    {
      speaker: "raj",
      text: `"What if Redis goes down?"`
    },
    {
      speaker: "you",
      text: `"Redis Cluster with replication — multiple replicas, automatic failover. Driver location is inherently transient — if we lose a few seconds of location data in a failover, drivers just send their next ping and we're current again. The data isn't durable in the traditional sense. What matters is the live position, not the history. For the history — for analytics and route reconstruction — I'd have the location service also publish to a Kafka topic, which a separate consumer persists to a time-series store like Cassandra or ClickHouse asynchronously. The write path for live location doesn't touch the persistent store at all."`
    },
    {
      speaker: "raj",
      text: `"How does the driver app send location updates? One HTTP request per update?"`
    },
    {
      speaker: "you",
      text: `"No — HTTP has too much overhead per request. Establish a WebSocket or use MQTT. The driver app keeps a persistent connection open. Location updates flow as lightweight messages over that connection — no TCP handshake, no HTTP headers on every ping. At five hundred thousand updates per second, the overhead per message matters a lot."`
    },
    {
      speaker: "raj",
      text: `"And the rider watching their driver approach in real time — how does that work?"`
    },
    {
      speaker: "you",
      text: `"Once a trip is accepted, the rider's app opens a WebSocket connection to the server. When the Location Service receives a driver update, it publishes to a channel keyed by driver ID. The server-side WebSocket handler is subscribed to that channel and pushes the update to the rider's connection. The rider sees the driver dot moving on the map with under two seconds of lag."`
    },
    {
      type: "code",
      text: `// ── Location Service: high-throughput design ──

// ── Write path: driver → server ──
//
// Driver app maintains a persistent WebSocket connection
// Sends location every 4 seconds while active:
// { driverId: "d_123", lat: 37.7749, lng: -122.4194, heading: 270, speed: 35, ts: 1714300000 }
//
// Location Service receives the message and does two things in parallel:
//   1. Writes current position to Redis (overwrites previous)
//   2. Publishes to Kafka for async persistence and real-time fan-out

// ── Redis: live driver positions ──
// Redis GEO commands store lat/lng as a sorted set with geohash score
// Key structure: "drivers:available" → sorted set of driverId → geohash
//
// On each location update:
await redis.geoadd('drivers:available', lng, lat, driverId);
// Overwrites previous position. O(log N) — fast even at millions of drivers.
//
// Mark driver unavailable (on trip or offline):
await redis.zrem('drivers:available', driverId);
// Available drivers in the set = queryable for matching

// ── Kafka: fan-out and persistence ──
// Topic: driver-location-updates
// Partition key: driverId (same driver's updates always go to same partition, ordered)
//
// Consumer 1: Location History Service
//   Batches updates and writes to Cassandra / ClickHouse
//   Used for: route playback, analytics, billing verification
//
// Consumer 2: Trip Real-Time Service
//   Filters for drivers currently on a trip
//   Pushes update to rider's WebSocket via Redis Pub/Sub channel

// ── Read path: rider sees driver moving ──
//
// After trip accepted:
// 1. Rider app opens WebSocket to server
// 2. Server subscribes to Redis Pub/Sub channel: "trip:{tripId}:location"
// 3. Trip Real-Time Service (Kafka consumer) receives driver update
//    → checks if driver is on an active trip
//    → publishes to "trip:{tripId}:location"
// 4. Server pushes to rider's WebSocket
// Lag: Kafka publish → consumer → Redis Pub/Sub → WebSocket push ≈ 200–500ms

// ── Scaling the Location Service ──
// 500K writes/second → need multiple Location Service instances
// WebSocket connections are stateful — sticky routing required:
//   API Gateway routes by driverId hash → same server handles same driver
//   Prevents a driver's updates bouncing between servers
//
// Redis Cluster: shard by driverId
//   "drivers:available" as one key is a problem at scale (all writes to one shard)
//   Shard by city or geohash prefix:
//   "drivers:available:san_francisco", "drivers:available:new_york"
//   Matching Service queries the shard for the relevant city`
    },

    // ── 5. Matching algorithm ──
    {
      speaker: "raj",
      text: `"How does the matching algorithm work? How do you find the nearest driver?"`
    },
    {
      speaker: "you",
      text: `"Redis has a GEOSEARCH command — give it a centre point, a radius, and it returns members of the geo set within that radius, sorted by distance. So I'd query the 'drivers:available' set within, say, five kilometres of the pickup point. That gives me a list of available drivers sorted by distance. I take the closest one and offer them the trip."`
    },
    {
      speaker: "raj",
      text: `"Just closest? That's it?"`
    },
    {
      speaker: "you",
      text: `"In the naive version, yes. In reality, distance alone is a bad signal. A driver two kilometres away who's heading toward the rider is better than a driver one kilometre away who's pointing in the opposite direction. You'd also factor in estimated time of arrival — ETA — not raw distance, since roads aren't straight lines. And driver rating — all else being equal, a higher-rated driver gets priority. So it's more of a scoring function: ETA weighted most heavily, then direction of travel, then rating."`
    },
    {
      speaker: "raj",
      text: `"Where does the ETA come from?"`
    },
    {
      speaker: "you",
      text: `"A routing service — either an internal one or a third-party maps API like Google Maps. You pass it the driver's current position and the pickup coordinates, it returns an ETA. At matching time you're calling this for several candidate drivers, which can be slow. Common optimisation: precompute ETA zones. The maps API gives you isochrone data — a polygon of everywhere reachable within, say, four minutes. Any driver inside that polygon is a candidate. You use Redis geo for the initial spatial filter and the isochrone as a secondary filter, so you only call the routing API for a small set of finalists."`
    },
    {
      speaker: "raj",
      text: `"What happens in a dense city with hundreds of available drivers nearby? You're scoring all of them?"`
    },
    {
      speaker: "you",
      text: `"No — you cap the candidate set. Take the closest twenty by raw distance, score only those. The marginal benefit of considering driver twenty-one versus driver twenty is tiny. And you do this server-side in memory, not in the database, so it's fast."`
    },
    {
      type: "code",
      text: `// ── Matching Service: finding the right driver ──

const findBestDriver = async (pickupLat, pickupLng, category) => {

  // ── Step 1: spatial candidates from Redis ──
  // GEOSEARCH returns available drivers within 5km, sorted by distance
  const candidates = await redis.geosearch(
    \`drivers:available:\${getCity(pickupLat, pickupLng)}\`,
    'FROMLONLAT', pickupLng, pickupLat,
    'BYRADIUS', 5, 'km',
    'ASC',           // closest first
    'COUNT', 20,     // cap at 20 — don't score hundreds of drivers
    'WITHCOORD', 'WITHDIST'
  );
  // Returns: [{ driverId, distance, lat, lng }, ...]

  if (candidates.length === 0) return null;  // no drivers nearby

  // ── Step 2: filter by vehicle category ──
  const driverDetails = await Promise.all(
    candidates.map(c => getDriverDetails(c.driverId))
  );
  const eligible = driverDetails.filter(d =>
    d.vehicleCategory === category && d.status === 'available'
  );

  if (eligible.length === 0) return null;

  // ── Step 3: score each candidate ──
  const scored = await Promise.all(
    eligible.map(async (driver) => {
      // ETA from routing service (batched call — one request, many origins)
      const eta = await routingService.getETA(
        { lat: driver.lat, lng: driver.lng },
        { lat: pickupLat, lng: pickupLng }
      );

      // Direction bonus: is the driver heading toward the pickup?
      const headingScore = getHeadingScore(driver.heading, driver.lat, driver.lng, pickupLat, pickupLng);

      // Score: lower ETA = higher score. Heading and rating are tiebreakers.
      const score = (
        (1 / eta.minutes) * 0.7 +  // ETA is 70% of the score
        headingScore        * 0.2 +  // heading toward pickup: 20%
        (driver.rating / 5) * 0.1    // rating: 10%
      );

      return { ...driver, eta, score };
    })
  );

  // ── Step 4: return the best candidate ──
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
};

// ── Offer and fallback ──
const matchRiderToDriver = async (trip) => {
  const OFFER_TIMEOUT_MS = 15_000;
  const MAX_ATTEMPTS     = 5;
  let   attemptedDrivers = new Set();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const driver = await findBestDriver(
      trip.pickupLat, trip.pickupLng, trip.category, attemptedDrivers
    );

    if (!driver) {
      await updateTripStatus(trip.id, 'no_drivers_available');
      await notifyRider(trip.riderId, 'no_drivers_available');
      return;
    }

    // Mark driver as 'pending_acceptance' in Redis so they aren't matched elsewhere
    await redis.set(\`driver:pending:\${driver.driverId}\`, trip.id, 'EX', 20);

    await notifyDriver(driver.driverId, { type: 'trip_offer', trip });
    attemptedDrivers.add(driver.driverId);

    // Wait for driver response
    const accepted = await waitForDriverResponse(driver.driverId, trip.id, OFFER_TIMEOUT_MS);

    if (accepted) {
      await updateTripStatus(trip.id, 'accepted', { driverId: driver.driverId });
      await updateDriverStatus(driver.driverId, 'on_trip');
      await notifyRider(trip.riderId, { type: 'driver_assigned', driver });
      return;
    }

    // Driver didn't respond — clear pending lock, try next
    await redis.del(\`driver:pending:\${driver.driverId}\`);
  }

  // All attempts exhausted
  await updateTripStatus(trip.id, 'no_drivers_available');
  await notifyRider(trip.riderId, 'no_drivers_available');
};`
    },

    // ── 6. Geohashing ──
    {
      speaker: "raj",
      text: `"You mentioned geohash earlier. Explain what that is and why it matters here."`
    },
    {
      speaker: "you",
      text: `"A geohash is a way of encoding a latitude and longitude as a short string. The world gets divided into a grid — each cell of the grid gets a prefix, and each cell subdivides into smaller cells that share that prefix but with additional characters. So 9q8y is a cell covering part of San Francisco, and 9q8yy is a smaller cell inside it. Longer string, smaller area."`
    },
    {
      speaker: "raj",
      text: `"And the useful property?"`
    },
    {
      speaker: "you",
      text: `"Two locations that share a geohash prefix are geographically close. Which means you can index by geohash string in a regular database and do proximity queries as prefix searches — much cheaper than a trigonometric distance calculation across every row. Redis's GEO commands do something equivalent internally. The other useful property is that nearby cells share a common prefix, so you can find all points in a neighbourhood by searching one geohash cell and its eight neighbours — the cell above, below, left, right, and the four diagonals. That handles the edge case where a driver is just across a cell boundary."`
    },
    {
      speaker: "raj",
      text: `"What's the edge case you have to handle with geohash?"`
    },
    {
      speaker: "you",
      text: `"The boundary problem. If a driver is at the very edge of cell 9q8y, and a rider is just across the line in cell 9q8z, a naive search of only 9q8y misses the driver entirely even though they're fifty metres apart. You always search the target cell plus its eight neighbours to cover the boundary. Redis handles this internally, but if you're implementing geohash search yourself, that's the gotcha."`
    },
    {
      type: "code",
      text: `// ── Geohashing: how it works ──
//
// The earth is divided recursively into cells:
//
// Precision 1: 5,000km × 5,000km cells   (e.g. "9")
// Precision 2: 1,250km × 625km cells     (e.g. "9q")
// Precision 4: 39km × 20km cells         (e.g. "9q8y")
// Precision 6: 1.2km × 0.6km cells       (e.g. "9q8yy6")
// Precision 8: 38m × 19m cells           (e.g. "9q8yy6rz")
//
// Geohash "9q8yy6" → lat: 37.7749, lng: -122.4194 (San Francisco)
// All points within that ~1km cell share the prefix "9q8yy6"
//
// ── Why this matters for the matching query ──
//
// Without geohash: "Find all drivers within 2km of (37.77, -122.41)"
//   → calculate distance from every driver to this point
//   → expensive at 2M drivers
//
// With geohash: "Find all drivers whose geohash starts with 9q8yy"
//   → prefix scan on an indexed string column
//   → O(log N) or better, no trigonometry
//
// ── The neighbour problem ──
//
// Cell "9q8yy6" and its 8 neighbours:
//   ┌─────────┬─────────┬─────────┐
//   │ 9q8yy3  │ 9q8yy6  │ 9q8yyd  │
//   ├─────────┼─────────┼─────────┤
//   │ 9q8yy1  │  TARGET │ 9q8yy9  │
//   ├─────────┼─────────┼─────────┤
//   │ 9q8yy0  │ 9q8yy2  │ 9q8yy8  │
//   └─────────┴─────────┴─────────┘
//
// A driver at the very edge of the target cell might be closer than
// a driver in the middle of a neighbouring cell.
// Always search target cell + 8 neighbours.

// ── Implementation with ngeohash ──
import ngeohash from 'ngeohash';

const getNearbyDrivers = async (lat, lng, precision = 6) => {
  const centerHash  = ngeohash.encode(lat, lng, precision);
  const neighbours  = ngeohash.neighbors(centerHash);
  const searchCells = [centerHash, ...Object.values(neighbours)]; // 9 cells total

  // Query Redis or DB for drivers in any of these 9 cells
  const drivers = await Promise.all(
    searchCells.map(cell =>
      redis.smembers(\`drivers:geohash:\${cell}\`)  // drivers indexed by their geohash cell
    )
  );

  return [...new Set(drivers.flat())]; // deduplicate (corner cells appear in two neighbour queries)
};

// Redis GEO commands handle this automatically via GEOSEARCH + BYRADIUS
// Custom geohash implementation needs the 9-cell search explicitly`
    },

    // ── 7. Trip state machine ──
    {
      speaker: "raj",
      text: `"You mentioned a trip state machine. Draw it out."`
    },
    {
      speaker: "you",
      text: `"A trip starts in 'searching' — we're looking for a driver. Once a driver accepts it becomes 'accepted'. The driver drives to the pickup — 'driver_arriving'. The rider gets in and the driver starts the trip — 'in_progress'. The driver drops the rider off — 'completed'. At any point it can be cancelled, with different rules depending on who cancels and when."`
    },
    {
      speaker: "raj",
      text: `"Who can cancel and when?"`
    },
    {
      speaker: "you",
      text: `"Rider can cancel freely while it's still 'searching' — no driver has committed yet. Once a driver has accepted and is en route, the rider can still cancel but gets a cancellation fee after a grace period — say two minutes after acceptance. Driver can cancel at any point before pickup — but too many cancellations hurt their rating and their position in the matching algorithm. Once the trip is 'in_progress' — rider is in the car — neither side can cancel through the app. If something goes wrong, that's handled through support."`
    },
    {
      speaker: "raj",
      text: `"How do you prevent a driver from being in two trips at once?"`
    },
    {
      speaker: "you",
      text: `"Driver status is a state machine too — 'offline', 'available', 'on_trip'. When a trip offer is sent, the driver moves to a 'pending' state in Redis — a soft lock with a TTL matching the offer timeout. If they accept, status moves to 'on_trip' in the database. The matching service only queries drivers in 'available' state. That's an optimistic lock — there's a small window where two matching jobs could both see a driver as available and both offer them a trip. To handle that, the trip acceptance is a conditional update: only set driver to 'on_trip' if current status is 'available'. First acceptance wins, second gets rejected and falls back to the next candidate."`
    },
    {
      type: "code",
      text: `// ── Trip state machine ──
//
// searching ──► accepted ──► driver_arriving ──► in_progress ──► completed
//    │              │               │
//    └──────────────┴───────────────┴──► cancelled
//
// ── Valid transitions ──
// searching      → accepted          (driver accepts offer)
// searching      → cancelled         (rider cancels, or no driver found after N attempts)
// accepted       → driver_arriving   (driver taps "heading to pickup")
// accepted       → cancelled         (driver or rider cancels — rules apply)
// driver_arriving→ in_progress       (driver taps "start trip")
// driver_arriving→ cancelled         (driver cancels, or rider cancels + cancellation fee)
// in_progress    → completed         (driver taps "end trip")
// [no cancellation from in_progress — handled by support]

// ── Enforcing state transitions in the DB ──
const transitionTripStatus = async (tripId, fromStatus, toStatus, updates = {}) => {
  const result = await db('trips')
    .where({ id: tripId, status: fromStatus })  // conditional update — optimistic lock
    .update({ status: toStatus, ...updates, updated_at: new Date() });

  if (result === 0) {
    // Either the trip doesn't exist or it's already moved to a different state
    // Could be a duplicate request or a race condition — either way, no-op
    throw new ConflictError(\`Trip \${tripId} is not in status '\${fromStatus}'\`);
  }
  return result;
};

// Usage: driver accepts trip
await transitionTripStatus(tripId, 'searching', 'accepted', {
  driver_id:   driverId,
  accepted_at: new Date(),
});

// ── Driver status: the optimistic lock ──
const acceptTrip = async (driverId, tripId) => {
  // Atomically set driver to 'on_trip' only if they're still 'available'
  // Using a DB transaction to prevent two trips grabbing the same driver
  return await db.transaction(async (trx) => {

    const updated = await trx('driver_profiles')
      .where({ driver_id: driverId, status: 'available' })  // conditional
      .update({ status: 'on_trip', current_trip_id: tripId });

    if (updated === 0) {
      throw new ConflictError('Driver is no longer available');
      // Matching Service catches this and tries the next candidate
    }

    await transitionTripStatus(tripId, 'searching', 'accepted', { driver_id: driverId });

    return true;
  });
};

// ── Cancellation rules ──
const cancelTrip = async (tripId, cancelledBy) => {
  const trip = await db('trips').where({ id: tripId }).first();

  const GRACE_PERIOD_MS = 2 * 60 * 1000;  // 2 minutes

  let cancellationFee = 0;

  if (cancelledBy === 'rider') {
    const timeSinceAccepted = Date.now() - new Date(trip.accepted_at).getTime();
    const driverIsEnRoute   = ['accepted', 'driver_arriving'].includes(trip.status);

    if (driverIsEnRoute && timeSinceAccepted > GRACE_PERIOD_MS) {
      cancellationFee = 5.00;  // configurable per market
    }
  }

  await transitionTripStatus(tripId, trip.status, 'cancelled', {
    cancelled_by:      cancelledBy,
    cancelled_at:      new Date(),
    cancellation_fee:  cancellationFee,
  });

  if (cancellationFee > 0) {
    await paymentService.charge({
      riderId: trip.rider_id,
      amount:  cancellationFee,
      reason:  'late_cancellation',
      tripId,
    });
  }

  // Release driver back to available
  if (trip.driver_id) {
    await db('driver_profiles')
      .where({ driver_id: trip.driver_id })
      .update({ status: 'available', current_trip_id: null });
  }
};`
    },

    // ── 8. Fare calculation and surge pricing ──
    {
      speaker: "raj",
      text: `"Walk me through fare calculation and surge pricing."`
    },
    {
      speaker: "you",
      text: `"Base fare has three components: a flat booking fee, a per-kilometre rate, and a per-minute rate. At trip completion, the Trip Service calculates distance and duration from the route actually driven — not the estimated route, the actual one — and applies those rates. Final fare is base fare multiplied by the surge multiplier that was locked at request time."`
    },
    {
      speaker: "raj",
      text: `"How is the surge multiplier calculated?"`
    },
    {
      speaker: "you",
      text: `"Supply and demand in a geohash cell. Supply is the number of available drivers in the cell. Demand is the number of active ride requests in the cell in the last few minutes. The ratio goes through a lookup table — a demand-to-supply ratio of, say, 2:1 gives 1.2x, 4:1 gives 1.8x, 8:1 gives 2.5x, and so on. The lookup table is tuned per market. There's usually also a cap — surge doesn't go above 3x or 4x without human review."`
    },
    {
      speaker: "raj",
      text: `"How often is it recalculated?"`
    },
    {
      speaker: "you",
      text: `"Every thirty seconds or so. It's a background job — it reads from the same Redis geo data that powers matching, counts drivers and pending requests by geohash cell, computes the ratio, writes the surge multiplier for each cell back to Redis. When a rider opens the app, the app reads the surge multiplier for their geohash cell and shows it. When they confirm a ride, that multiplier is snapshotted into the trip record. Subsequent recalculations don't affect it."`
    },
    {
      speaker: "raj",
      text: `"What happens if there's a calculation error and a rider is overcharged?"`
    },
    {
      speaker: "you",
      text: `"The fare is always recalculated server-side before charging — never trusted from the client. Disputes go to a support flow. Support can query the raw trip data — exact route, timestamps, surge multiplier at request time — and recalculate the expected fare. If there's a discrepancy, the Payment Service has a refund endpoint. All charges have an idempotency key so a refund triggered twice doesn't double-refund."`
    },
    {
      type: "code",
      text: `// ── Fare calculation ──

// ── Pricing config (per market, per vehicle category) ──
const PRICING = {
  economy: {
    bookingFee:    1.50,   // flat fee per trip
    perKm:         0.90,   // per kilometre
    perMin:        0.15,   // per minute
    minimumFare:   4.00,
    cancellationFee: 5.00,
  },
  comfort: { bookingFee: 2.00, perKm: 1.40, perMin: 0.25, minimumFare: 6.00 },
  xl:      { bookingFee: 2.50, perKm: 1.80, perMin: 0.30, minimumFare: 8.00 },
};

const calculateFare = (distanceKm, durationMin, category, surgeMultiplier) => {
  const pricing    = PRICING[category];
  const baseFare   = pricing.bookingFee
                   + (distanceKm * pricing.perKm)
                   + (durationMin * pricing.perMin);

  const afterSurge = baseFare * surgeMultiplier;
  const finalFare  = Math.max(afterSurge, pricing.minimumFare);

  return {
    baseFare:        parseFloat(baseFare.toFixed(2)),
    surgeMultiplier,
    finalFare:       parseFloat(finalFare.toFixed(2)),
  };
};

// ── Surge multiplier calculation (background job, every 30 seconds) ──
const recalculateSurge = async () => {
  const activeCells = await redis.smembers('active_geohash_cells');  // cells with recent activity

  for (const cell of activeCells) {
    const availableDrivers  = await redis.scard(\`drivers:cell:\${cell}\`);
    const pendingRequests   = await redis.get(\`requests:cell:\${cell}:count\`) ?? 0;

    const ratio = pendingRequests / Math.max(availableDrivers, 1);

    const multiplier =
      ratio < 0.5 ? 1.0 :
      ratio < 1.0 ? 1.1 :
      ratio < 2.0 ? 1.3 :
      ratio < 3.0 ? 1.6 :
      ratio < 5.0 ? 2.0 :
      ratio < 8.0 ? 2.5 :
                    3.0;  // hard cap — above this, escalate to ops team

    await redis.setex(\`surge:\${cell}\`, 60, multiplier.toString());
    // TTL of 60s — if the job fails, surge decays to 1.0 automatically
  }
};

// ── Surge at request time: locked into the trip ──
const createTrip = async ({ riderId, pickupLat, pickupLng, ...rest }) => {
  const cell    = ngeohash.encode(pickupLat, pickupLng, 6);
  const surge   = parseFloat(await redis.get(\`surge:\${cell}\`) ?? '1.0');

  // Show rider the surge before they confirm
  const estimate = await estimateFare({ pickupLat, pickupLng, ...rest, surgeMultiplier: surge });

  // Rider confirms → surge is snapshotted, never changes for this trip
  const trip = await db('trips').insert({
    rider_id:         riderId,
    surge_multiplier: surge,  // locked here
    ...rest,
    status: 'searching',
  }).returning('*');

  return trip;
};`
    },

    // ── 9. Payments ──
    {
      speaker: "raj",
      text: `"Payments. How does the payment flow work and what are the failure cases?"`
    },
    {
      speaker: "you",
      text: `"At trip completion, the Trip Service emits a 'trip.completed' event. The Payment Service consumes it, calculates the final fare, and charges the rider's payment method on file. The charge happens asynchronously — the rider sees 'trip completed' immediately, the charge settles in the background. If the charge fails — card declined, network error — we retry with exponential backoff. If it fails permanently, the rider's account goes into a restricted state and they're prompted to update their payment method before their next trip."`
    },
    {
      speaker: "raj",
      text: `"What prevents a rider from being charged twice?"`
    },
    {
      speaker: "you",
      text: `"Idempotency key. Every charge request has a unique key — I'd use the trip ID since there's exactly one charge per trip. If the Payment Service sends the charge to Stripe and the network times out before we get the response, we don't know if Stripe processed it or not. When we retry with the same idempotency key, Stripe returns the original result without processing a second charge. Our own payments table also has a unique constraint on trip ID — so even if our own code retried without idempotency keys, the database would reject the duplicate insert."`
    },
    {
      speaker: "raj",
      text: `"What about driver payouts?"`
    },
    {
      speaker: "you",
      text: `"Separate flow. Drivers don't get paid per trip in real time — payouts are batched, usually weekly. The Payment Service accumulates driver earnings in a ledger table — a credit for each completed trip minus the platform's commission. At payout time, the total is transferred to the driver's bank account via ACH or a similar payment rail. Batch payouts are far cheaper per transaction than per-trip transfers, and drivers are generally fine with weekly pay cycles."`
    },
    {
      speaker: "raj",
      text: `"What if the platform commission changes? How do you avoid calculating the wrong commission on old trips?"`
    },
    {
      speaker: "you",
      text: `"Snapshot the commission rate at trip completion, same as the surge multiplier. Store it on the trip record. The ledger entry is calculated from the stored rate, not from a current config value. Commission rates are configuration, but their application to a specific trip is a fact — it gets recorded."`
    },
    {
      type: "code",
      text: `// ── Payment flow ──

// ── 1. Trip completes ──
// Trip Service emits event to Kafka:
// { type: 'trip.completed', tripId, riderId, driverId, fare: 18.50, surgeMultiplier: 1.3, ... }

// ── 2. Payment Service consumes event ──
messageQueue.subscribe('trip.completed', async (event) => {
  // Idempotency check — have we already processed this trip's payment?
  const existing = await db('payments').where({ trip_id: event.tripId }).first();
  if (existing) return;  // already processed (at-least-once delivery guard)

  await chargeRider(event);
});

// ── 3. Charge the rider ──
const chargeRider = async ({ tripId, riderId, fare }) => {
  const rider = await db('users').where({ id: riderId }).first();

  // Charge via payment processor (Stripe, Braintree, etc.)
  const charge = await stripe.charges.create({
    amount:   Math.round(fare * 100),  // in cents
    currency: 'usd',
    customer: rider.stripe_customer_id,
    metadata: { tripId },
  }, {
    idempotencyKey: \`trip-charge-\${tripId}\`,  // Stripe deduplicates on this key
  });

  // Record in our own payments table
  await db('payments').insert({
    trip_id:        tripId,
    rider_id:       riderId,
    amount:         fare,
    currency:       'usd',
    status:         'completed',
    processor_ref:  charge.id,
    idempotency_key: \`trip-charge-\${tripId}\`,
    charged_at:     new Date(),
  });
  // UNIQUE constraint on trip_id — database-level duplicate guard

  // Credit driver earnings ledger
  await creditDriverEarnings(tripId);
};

// ── 4. Driver earnings ledger ──
const creditDriverEarnings = async (tripId) => {
  const trip = await db('trips').where({ id: tripId }).first();

  const COMMISSION_RATE = trip.commission_rate;  // snapshotted at trip completion
  const driverEarnings  = trip.final_fare * (1 - COMMISSION_RATE);

  await db('driver_earnings').insert({
    trip_id:          tripId,
    driver_id:        trip.driver_id,
    gross_fare:       trip.final_fare,
    commission_rate:  COMMISSION_RATE,
    driver_amount:    parseFloat(driverEarnings.toFixed(2)),
    payout_status:    'pending',  // batched into weekly payout
    earned_at:        new Date(),
  });
};

// ── 5. Retry on failure ──
const chargeWithRetry = async (event, attempt = 0) => {
  try {
    await chargeRider(event);
  } catch (err) {
    if (attempt < 4) {
      const delay = Math.pow(2, attempt) * 1000;  // 1s, 2s, 4s, 8s
      await sleep(delay);
      return chargeWithRetry(event, attempt + 1);
    }
    // All retries failed — mark payment as failed, flag account
    await db('payments').insert({ trip_id: event.tripId, status: 'failed', ... });
    await flagAccountForPaymentIssue(event.riderId);
    await notifyRider(event.riderId, 'payment_failed');
  }
};`
    },

    // ── 10. Notifications ──
    {
      speaker: "raj",
      text: `"How do notifications work? The driver needs to know about a new trip request. The rider needs to know their driver is arriving. How do you handle all of that?"`
    },
    {
      speaker: "you",
      text: `"Two channels depending on urgency. For real-time in-app events — driver position updates, trip status changes — WebSocket. The app has a persistent connection while it's open and receives pushes instantly. For out-of-app events — driver is here and the rider's phone is locked — push notifications via APNs for iOS and FCM for Android. SMS as a fallback for critical things like 'your driver has arrived' when push isn't delivered within a few seconds."`
    },
    {
      speaker: "raj",
      text: `"What if the rider's app is backgrounded and the WebSocket has been killed by the OS?"`
    },
    {
      speaker: "you",
      text: `"Push notification. When the rider reconnects — opens the app — the app immediately requests the current trip state from the server and reconciles with what it has locally. It doesn't rely on having received every WebSocket message in sequence. The server is the source of truth; the client re-syncs on reconnect."`
    },
    {
      speaker: "raj",
      text: `"What if push notification delivery fails?"`
    },
    {
      speaker: "you",
      text: `"SMS as a last resort for the highest-priority events — driver arrived, trip completed with fare summary. SMS is more reliable but more expensive, so it's not used for every notification, only the ones where missing it causes real user pain. The Notification Service tracks delivery status from APNs and FCM — if a delivery failure comes back, it triggers the SMS fallback automatically."`
    },
    {
      type: "code",
      text: `// ── Notification Service ──

// ── Event → channel mapping ──
// trip_offer_received    → WebSocket (driver app, real-time)
// driver_assigned        → WebSocket + Push (rider)
// driver_location_update → WebSocket (rider, while app is open)
// driver_arriving        → WebSocket + Push + SMS fallback (rider)
// trip_started           → WebSocket + Push (rider)
// trip_completed         → WebSocket + Push (rider, includes fare)
// payment_failed         → Push + SMS (rider)

// ── Notification Service: fan-out ──
const sendNotification = async ({ userId, event, data, channels }) => {
  const user   = await getUserNotificationPrefs(userId);
  const device = await getDeviceToken(userId);

  const results = await Promise.allSettled([
    // WebSocket: only if app is open and connected
    channels.includes('websocket') && user.wsConnected
      ? sendWebSocket(userId, { event, data })
      : Promise.resolve(),

    // Push: iOS or Android
    channels.includes('push') && device?.token
      ? sendPush(device, { event, data })
      : Promise.resolve(),
  ]);

  // SMS fallback: if push failed and this event warrants it
  const pushFailed = results[1].status === 'rejected';
  const needsSms   = ['driver_arriving', 'payment_failed'].includes(event);

  if (pushFailed && needsSms && user.phone) {
    await sendSms(user.phone, getSmsTemplate(event, data));
  }
};

// ── Push: APNs / FCM ──
const sendPush = async (device, { event, data }) => {
  const payload = {
    title: PUSH_TITLES[event],
    body:  PUSH_BODIES[event](data),
    data:  { event, tripId: data.tripId },  // app reads this on tap to deep-link
  };

  if (device.platform === 'ios') {
    return apns.send(device.token, payload);
  } else {
    return fcm.send({ token: device.token, notification: payload });
  }
};

// ── Client-side: re-sync on reconnect ──
// When rider app reconnects (foreground, network restored):
//
// 1. App re-establishes WebSocket
// 2. Immediately calls GET /trips/active
//    → returns current trip state from server
// 3. App reconciles local UI with server truth
//    → driver moved while disconnected: position jumps to current location
//    → trip state changed: UI transitions to correct screen
//
// This means the real-time stream is best-effort.
// Missing a message doesn't corrupt state — reconnect re-syncs.
// The server is always authoritative.`
    },

    // ── 11. Ratings ──
    {
      speaker: "raj",
      text: `"Ratings. Simple feature — but what are the edge cases?"`
    },
    {
      speaker: "you",
      text: `"When to collect them is the first one. You don't want to force the rider to rate before they can book another trip — that's friction and they'll just tap five stars to get past it. But if you make it optional, most people don't rate. Most apps ask for the rating right after the trip ends, in the post-trip screen, but let you skip it. The rating gets collected for the next hour or so and then the window closes."`
    },
    {
      speaker: "raj",
      text: `"Both directions — driver rates rider too. What does a low rider rating mean?"`
    },
    {
      speaker: "you",
      text: `"Drivers can see a rider's rating before accepting a trip. A consistently low-rated rider — below 4.0 say — might not get matched as quickly, or drivers can choose to decline them. It also feeds into fraud detection — a rider who consistently gets low scores from drivers might be abusing cancellations or behaving badly. It's a two-sided accountability mechanism."`
    },
    {
      speaker: "raj",
      text: `"The average rating on a user profile — how do you calculate it? Recompute from all ratings every time?"`
    },
    {
      speaker: "you",
      text: `"No — that's expensive at scale. Denormalise it. When a new rating is inserted, update the user's rating_avg in place using the running average formula. You store the total number of ratings and the current average — new average is current average plus one over N plus one times the difference between the new score and the current average. It's O(1) and you never touch the ratings table to read a user's score."`
    },
    {
      speaker: "raj",
      text: `"What about fake ratings — someone creating accounts to boost their own rating?"`
    },
    {
      speaker: "you",
      text: `"A rating is only valid if it's linked to a completed trip where both parties were present. The trip record has the rider ID, driver ID, and a completion timestamp — you can't rate someone you never rode with. For collusion — a driver running fake trips with fake rider accounts to accumulate five-star ratings — you'd need anomaly detection: trips that complete unusually fast, trips with no GPS movement, trips where the same rider-driver pair completes an unusually high number of trips. That feeds into a trust and safety review queue rather than automatic action."`
    },
    {
      type: "code",
      text: `// ── Rating system ──

// ── Create a rating ──
const rateTrip = async ({ tripId, raterId, rateeId, score, comment }) => {
  // Guard 1: trip must be completed
  const trip = await db('trips').where({ id: tripId, status: 'completed' }).first();
  if (!trip) throw new BadRequestError('Trip not found or not completed');

  // Guard 2: rater must have been on this trip
  const isRider  = trip.rider_id === raterId;
  const isDriver = trip.driver_id === raterId;
  if (!isRider && !isDriver) throw new ForbiddenError('Not a participant in this trip');

  // Guard 3: ratee must be the other party
  const expectedRateeId = isRider ? trip.driver_id : trip.rider_id;
  if (rateeId !== expectedRateeId) throw new BadRequestError('Invalid ratee for this trip');

  // Guard 4: rating window — must be within 1 hour of trip completion
  const hourAfterCompletion = new Date(trip.dropoff_at).getTime() + 60 * 60 * 1000;
  if (Date.now() > hourAfterCompletion) throw new BadRequestError('Rating window has closed');

  // Insert rating — UNIQUE(trip_id, rater_id) prevents double-rating
  await db('ratings').insert({ trip_id: tripId, rater_id: raterId, ratee_id: rateeId, score, comment });

  // Update ratee's average rating (running average — O(1), no table scan)
  await updateUserRatingAvg(rateeId, score);
};

// ── Running average update ──
const updateUserRatingAvg = async (userId, newScore) => {
  // Atomic update using SQL — no race condition from read-then-write
  await db.raw(\`
    UPDATE users
    SET
      rating_count = rating_count + 1,
      rating_avg   = rating_avg + (? - rating_avg) / (rating_count + 1)
    WHERE id = ?
  \`, [newScore, userId]);
  // Formula: new_avg = old_avg + (new_score - old_avg) / new_count
  // Never reads rating_avg into application memory — avoids race condition
};

// ── Driver sees rider rating before accepting ──
// Trip offer notification includes rider's rating_avg and rating_count
// Driver can factor this into their accept/decline decision
//
// Platform policy: drivers cannot see the specific scores — only the average
// Specific score breakdown is internal only (fraud detection team)

// ── Fraud signals ──
// Flagged for review when:
//   - Same rider-driver pair completes more than 3 trips in 24 hours
//   - Trip duration < 90 seconds (likely a fake trip)
//   - Trip has no GPS movement (driver didn't move)
//   - New account rates 20+ drivers in first week (review farm)
//
// Action: human review queue, not automatic suspension`
    },

    // ── 12. Database choices ──
    {
      speaker: "raj",
      text: `"What databases are you using and why? You've mentioned Redis, Postgres, Cassandra — make the case for each."`
    },
    {
      speaker: "you",
      text: `"PostgreSQL for anything that needs ACID guarantees and relational integrity: users, trips, payments, ratings, driver profiles. Trips especially — you need transactional updates to trip status and the payment record in the same atomic operation. Postgres handles that cleanly."`
    },
    {
      speaker: "raj",
      text: `"And Redis?"`
    },
    {
      speaker: "you",
      text: `"Two roles. Primary store for live driver locations — the GEO commands are exactly what you need and the write throughput is unmatched. And a cache for anything that's read frequently but changes slowly: surge multipliers per geohash cell, active trip IDs per driver, driver status. Sub-millisecond reads matter for the matching hot path."`
    },
    {
      speaker: "raj",
      text: `"Cassandra?"`
    },
    {
      speaker: "you",
      text: `"Location history — every driver position update over time. Cassandra's write throughput at scale is better than Postgres, it handles time-series data naturally with time-based partition keys, and you can tune replication per region. The query pattern is almost always 'give me the location history for driver D between time T1 and T2' — that maps perfectly to a Cassandra partition key of driver ID and a clustering key of timestamp. You never need to join across drivers for this data."`
    },
    {
      speaker: "raj",
      text: `"What would you index in Postgres?"`
    },
    {
      speaker: "you",
      text: `"Trips: index on rider_id for a rider's trip history, driver_id for a driver's history, status for the matching service to find active trips, and a composite index on status plus requested_at for the operations dashboard. Payments: index on trip_id and rider_id. Ratings: index on ratee_id for fetching a user's received ratings. I'd also add partial indexes — for example, an index on trips where status is not 'completed' or 'cancelled', since the active trips are the hot query path but a tiny fraction of the total rows."`
    },
    {
      type: "code",
      text: `// ── Database responsibilities ──

// ── PostgreSQL: relational, ACID, strong consistency ──
// Tables: users, driver_profiles, vehicles, trips, payments, ratings, driver_earnings
//
// Why Postgres:
//   - Trip status transitions need atomic updates with constraints
//   - Payment records need ACID — can't half-write a charge
//   - Foreign key integrity between trips, users, payments, ratings
//   - Complex queries for operations (aggregate fares, driver hours, etc.)

// ── Key indexes on trips table ──
// CREATE INDEX ON trips (rider_id);                    -- rider's trip history
// CREATE INDEX ON trips (driver_id);                   -- driver's trip history
// CREATE INDEX ON trips (status);                      -- matching + ops queries
// CREATE INDEX ON trips (status, requested_at DESC)    -- active trips, sorted by recency
//   WHERE status NOT IN ('completed', 'cancelled');    -- partial index — only active rows
// CREATE INDEX ON trips (driver_id, status)
//   WHERE status = 'in_progress';                      -- "is this driver on a trip?"

// ── Redis: low-latency, high-throughput, ephemeral ──
// Use cases:
//   - Live driver positions:      GEOADD drivers:available:{city} lng lat driverId
//   - Driver status:              SET driver:status:{driverId} "available" EX 30
//   - Surge multipliers:          SET surge:{geohash} 1.8 EX 60
//   - Pending trip offers:        SET driver:pending:{driverId} tripId EX 20
//   - Active trip per driver:     SET driver:trip:{driverId} tripId
//   - Pub/Sub for real-time push: PUBLISH trip:{tripId}:location {lat, lng}
//   - Session tokens, rate limits
//
// NOT used for: anything that needs to survive a full Redis failure without reconstruction
// TTLs on everything: if Redis restarts, data regenerates from the source of truth (Postgres)

// ── Cassandra: write-heavy, time-series, append-only ──
// Table: driver_location_history
//   driver_id    UUID          partition key   -- all data for a driver on one node
//   recorded_at  TIMESTAMPTZ   clustering key  -- ordered within a partition
//   lat          DECIMAL
//   lng          DECIMAL
//   heading      INT
//   speed        INT
//   PRIMARY KEY (driver_id, recorded_at)
//
// Why Cassandra:
//   - 500K writes/second — Cassandra's append-only LSM tree handles this naturally
//   - Query pattern: always by driver_id + time range — maps perfectly to partition + cluster key
//   - No updates, no deletes, no joins — Cassandra's sweet spot
//   - Multi-region replication with tunable consistency per query
//
// Query: driver route playback for a trip
// SELECT * FROM driver_location_history
// WHERE driver_id = ? AND recorded_at >= ? AND recorded_at <= ?`
    },

    // ── 13. Caching ──
    {
      speaker: "raj",
      text: `"What are you caching beyond driver locations and surge? Where could you get into trouble with caching?"`
    },
    {
      speaker: "you",
      text: `"Driver profiles are read on every trip offer — I'd cache them in Redis with a short TTL, maybe five minutes. They change rarely — a driver's vehicle or rating doesn't change mid-shift. Pricing config per market and category — also rarely changes, cache aggressively. User payment methods — read on every payment, update infrequently, short TTL and invalidate on update."`
    },
    {
      speaker: "raj",
      text: `"Where would you get burned?"`
    },
    {
      speaker: "you",
      text: `"Driver status is the dangerous one. If a driver's cached status says 'available' but they just went offline or just accepted another trip, you'll offer them a trip they can't take. That's why driver status has a short TTL — thirty seconds — and is invalidated explicitly on any status change. The matching service always does a final validation against the real status before locking the driver. Cache for the shortlist, verify before commitment."`
    },
    {
      speaker: "raj",
      text: `"What about the trip history page — a rider scrolling through their last hundred trips?"`
    },
    {
      speaker: "you",
      text: `"That doesn't go through the main Postgres instance at all. Historical queries go to a read replica. Trip history is immutable once a trip completes — you don't need the primary for reads that old. For frequently accessed summaries — total trips, total spend, average rating — I'd pre-compute those on a daily batch job and store the aggregates, so the profile page is a single cache lookup rather than a GROUP BY across a million rows."`
    },
    {
      type: "code",
      text: `// ── Caching strategy ──

// ── What to cache and for how long ──

// Driver profile (vehicle, rating, name) — read on every trip offer
// TTL: 5 minutes. Invalidate on: profile update, vehicle change, rating recalculation.
const getDriverProfile = async (driverId) => {
  const cached = await redis.get(\`driver:profile:\${driverId}\`);
  if (cached) return JSON.parse(cached);

  const profile = await db('driver_profiles')
    .join('users', 'users.id', 'driver_profiles.driver_id')
    .join('vehicles', 'vehicles.id', 'driver_profiles.vehicle_id')
    .where('driver_profiles.driver_id', driverId)
    .first();

  await redis.setex(\`driver:profile:\${driverId}\`, 300, JSON.stringify(profile));
  return profile;
};

// Invalidate on any profile change
const updateDriverProfile = async (driverId, updates) => {
  await db('driver_profiles').where({ driver_id: driverId }).update(updates);
  await redis.del(\`driver:profile:\${driverId}\`);  // cache-aside invalidation
};

// ── Driver status — the dangerous cache ──
// Short TTL (30s) + explicit invalidation on every status change
// Matching service never trusts a cached status for the final lock

const getDriverStatus = async (driverId) => {
  // Check cache first
  const cached = await redis.get(\`driver:status:\${driverId}\`);
  if (cached) return cached;

  // Cache miss — query DB and repopulate
  const { status } = await db('driver_profiles').where({ driver_id: driverId }).first();
  await redis.setex(\`driver:status:\${driverId}\`, 30, status);
  return status;
};

const setDriverStatus = async (driverId, newStatus) => {
  await db('driver_profiles').where({ driver_id: driverId }).update({ status: newStatus });
  await redis.setex(\`driver:status:\${driverId}\`, 30, newStatus);  // update cache too
  // TTL ensures stale entries self-heal even if explicit invalidation misses
};

// ── Trip history — read replica + pre-computed aggregates ──
// Historical trips: query goes to Postgres READ REPLICA, not primary
const getRiderTripHistory = async (riderId, page, limit) => {
  return readReplica('trips')
    .where({ rider_id: riderId, status: 'completed' })
    .orderBy('dropoff_at', 'desc')
    .limit(limit)
    .offset(page * limit);
};

// Pre-computed rider stats (daily batch job)
// stats table: { user_id, total_trips, total_spend, avg_rating_given, computed_at }
const getRiderStats = async (riderId) => {
  const cached = await redis.get(\`rider:stats:\${riderId}\`);
  if (cached) return JSON.parse(cached);

  const stats = await db('rider_stats').where({ user_id: riderId }).first();
  await redis.setex(\`rider:stats:\${riderId}\`, 3600, JSON.stringify(stats));  // 1 hour
  return stats;
};`
    },

    // ── 14. Scaling bottlenecks ──
    {
      speaker: "raj",
      text: `"Where does this system break at scale? Walk me through the bottlenecks."`
    },
    {
      speaker: "you",
      text: `"Three main ones. The Location Service ingestion — half a million writes per second is the hardest number in the system. I've addressed that with Redis Cluster and Kafka, but you'd also need to be careful about hot spots — a city like New York has a very dense cluster of drivers, and if all of them map to the same Redis shard you have a hotspot. Sharding by geohash prefix prevents that."`
    },
    {
      speaker: "raj",
      text: `"Second?"`
    },
    {
      speaker: "you",
      text: `"The Matching Service at peak. During rush hour in a major city, you could have thousands of matching jobs running simultaneously, each making spatial queries to Redis. That's a lot of Redis reads. Mitigation: the matching service scales horizontally — each instance handles a subset of cities or regions. And the Redis geo query is fast, but you still want to keep the candidate set small so the scoring phase stays cheap."`
    },
    {
      speaker: "raj",
      text: `"Third?"`
    },
    {
      speaker: "you",
      text: `"The Trip table in Postgres. Ten million trips a day is a hundred and fifteen writes per second on average, which Postgres handles fine. But the table grows fast — a year of data is three-plus billion rows. Queries against that without partitioning get slow. I'd partition the trips table by month — a range partition on requested_at. Active trips are almost always in the current month's partition, so queries stay fast. Old partitions can be moved to cheaper storage or archived."`
    },
    {
      speaker: "raj",
      text: `"What about the WebSocket connections? Two million active drivers, potentially a million active riders — that's three million persistent connections."`
    },
    {
      speaker: "you",
      text: `"WebSocket servers are stateful, which means you can't just add instances and load balance freely — a driver's location updates need to always go to the same server instance that holds their connection, or you lose the connection. You'd run a fleet of WebSocket servers with sticky routing at the load balancer level — same driver ID always routes to the same server. Each server can hold tens of thousands of connections. Three million connections across a couple hundred WebSocket servers is manageable. The challenge is failover — if a WebSocket server goes down, all clients on it reconnect simultaneously, which is a thundering herd. You handle that with jittered exponential backoff on the client reconnect."`
    },
    {
      type: "code",
      text: `// ── Scaling: the three main bottlenecks ──

// ── 1. Location ingestion: Redis hotspots ──
//
// Problem: all drivers in Manhattan map to the same geohash prefix
//          → all writes to the same Redis node → hotspot
//
// Solution: shard the geo set by city AND geohash prefix
//   "drivers:available:nyc:dr5r"  (Manhattan geohash prefix)
//   "drivers:available:nyc:dr5q"  (Brooklyn geohash prefix)
//
// Matching service queries the relevant shards for the pickup's geohash area
// Hotspot disappears: Manhattan's 50K drivers spread across 20+ shards

// ── 2. Matching Service at peak ──
//
// Rush hour in NYC: 10,000 ride requests per minute = 167/second
// Each matching job: 1 Redis GEOSEARCH + ~20 Redis GET (driver details) + routing API calls
//
// Horizontal scaling:
//   - Partition cities by matching service instance
//   - NYC → instances A, B, C (by geohash quadrant)
//   - Chicago → instances D, E
//   - No state between matching instances — Redis is the shared store
//
// Optimisation: precompute ETAs
//   Background job every 30s: for each active driver, precompute ETA to
//   the nearest demand hotspot (major transit hubs, airports, event venues)
//   Store in Redis: "driver:eta:{driverId}:zone:{zoneId}"
//   Matching reads precomputed ETAs instead of calling routing API at match time
//   Routing API calls drop by 80%

// ── 3. Trips table: time-based partitioning ──
//
-- PostgreSQL range partitioning by month
CREATE TABLE trips (
  id            UUID,
  requested_at  TIMESTAMPTZ NOT NULL,
  -- ... other columns
) PARTITION BY RANGE (requested_at);

CREATE TABLE trips_2025_04 PARTITION OF trips
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE trips_2025_05 PARTITION OF trips
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
-- New partition created each month — automated with pg_partman
//
// Active queries (status IN ('searching','accepted','in_progress')):
//   almost always in current month's partition → full-table-scan avoided
//
// Old partitions (6+ months old):
//   move to read-only tablespace on cheaper storage
//   or archive to Parquet files in S3 + query via Athena for analytics

// ── 4. WebSocket servers: thundering herd on failover ──
//
// 3M connections across 150 WebSocket servers = 20K connections/server
//
// Sticky routing: API Gateway routes by hash(userId) → consistent server
// Failover: if WS server goes down, 20K clients reconnect simultaneously
//
// Jittered backoff prevents thundering herd:
// reconnect delay = min(base * 2^attempt, maxDelay) + random(0, jitter)
//
// Client reconnect pseudocode:
const reconnect = (attempt = 0) => {
  const base    = 1000;      // 1 second base
  const maxDelay = 30_000;   // 30 second ceiling
  const jitter  = 2000;      // up to 2s of random jitter

  const delay = Math.min(base * Math.pow(2, attempt), maxDelay)
              + Math.random() * jitter;

  setTimeout(() => {
    connect().catch(() => reconnect(attempt + 1));
  }, delay);
};
// 20,000 clients spread their reconnect attempts over 30 seconds
// instead of all hitting the server at the same millisecond`
    },

    // ── 15. Failure scenarios ──
    {
      speaker: "raj",
      text: `"Let's talk about failures. Driver goes offline in the middle of a trip — rider is in the car, GPS disappears. What happens?"`
    },
    {
      speaker: "you",
      text: `"The driver's location updates stop. The rider's map freezes. The system detects the driver has gone silent — if no location update is received for, say, thirty seconds, the Trip Service flags the trip as 'location_lost'. It doesn't cancel the trip — the rider is still physically in the car and the trip is still in progress. The rider sees a message: 'Location temporarily unavailable'. When the driver reconnects — they drove into a tunnel, their phone died and restarted — they re-establish the WebSocket and the location stream resumes. The trip continues. Fare is calculated on the actual route that was tracked plus an estimate for the gap if needed."`
    },
    {
      speaker: "raj",
      text: `"Payment fails at trip completion. Rider's card is declined."`
    },
    {
      speaker: "you",
      text: `"The rider sees the trip as complete — you don't block them in the car waiting for payment to settle. Payment happens asynchronously. If the charge fails, the rider's account is flagged. They're prompted to update their payment method the next time they open the app. They can still see their history, can still contact support. But they can't book a new trip until the outstanding balance is resolved. The failed payment amount is held as a debt on their account, and when they add a valid payment method it's charged immediately."`
    },
    {
      speaker: "raj",
      text: `"The Matching Service goes down entirely during peak hour."`
    },
    {
      speaker: "you",
      text: `"Ride requests queue up in Kafka. New requests are accepted — the API still works, the Trip Service still creates trips. They sit in 'searching' status. When the Matching Service comes back up, it processes the queue. Trips that have been searching for more than a few minutes get cancelled with a full message to the rider. The key is the API layer never knows the Matching Service is down — it decouples via the queue. Riders experience delay, not an error. If the Matching Service is down for long enough that the queue depth is alarming, auto-scaling and on-call alerts kick in."`
    },
    {
      speaker: "raj",
      text: `"The database goes down."`
    },
    {
      speaker: "you",
      text: `"Primary-replica setup with automatic failover. The primary Postgres instance has one or more synchronous replicas. If the primary goes down, a replica promotes automatically — Patroni or AWS RDS Multi-AZ handles this. In-flight transactions on the primary are lost — that's a small window of data loss, but trips that were mid-transaction get retried by the application layer. The failover takes thirty to sixty seconds. During that window, write operations queue or fail fast depending on the operation's tolerance. Payment operations fail fast — it's better to return an error than to queue a payment charge that might fire multiple times when the connection restores."`
    },
    {
      type: "code",
      text: `// ── Failure handling ──

// ── Driver goes silent mid-trip ──
// Location Service: if no update received from driverId for > 30 seconds
const monitorDriverHeartbeat = async () => {
  const activeTrips = await db('trips').where({ status: 'in_progress' });

  for (const trip of activeTrips) {
    const lastUpdate = await redis.get(\`driver:last_seen:\${trip.driver_id}\`);
    const silentFor  = Date.now() - parseInt(lastUpdate ?? '0');

    if (silentFor > 30_000) {
      await notifyRider(trip.rider_id, 'location_temporarily_unavailable');
      await updateTripStatus(trip.id, 'in_progress', { location_lost_at: new Date() });
      // Trip is NOT cancelled. Driver reconnects → stream resumes automatically.
    }
  }
};

// When driver reconnects:
ws.on('location_update', async (msg) => {
  await redis.set(\`driver:last_seen:\${msg.driverId}\`, Date.now(), 'EX', 60);
  // If trip had location_lost flag, clear it
  await db('trips')
    .where({ driver_id: msg.driverId, status: 'in_progress' })
    .update({ location_lost_at: null });
  await notifyRider(trip.rider_id, 'location_restored');
});

// ── Payment failure: account state ──
const handlePaymentFailure = async (tripId, riderId, amount) => {
  // Record the failed payment
  await db('payments').where({ trip_id: tripId }).update({ status: 'failed' });

  // Create an outstanding balance record
  await db('outstanding_balances').insert({
    rider_id:   riderId,
    amount,
    reason:     'trip_payment_failed',
    trip_id:    tripId,
    created_at: new Date(),
  });

  // Restrict new trip bookings (but don't kick them out of current session)
  await redis.set(\`rider:payment_restricted:\${riderId}\`, '1', 'EX', 86400 * 30);

  await notifyRider(riderId, 'payment_failed_update_method');
};

// On next app open: check for restriction before allowing a new booking
const canBookTrip = async (riderId) => {
  const restricted = await redis.get(\`rider:payment_restricted:\${riderId}\`);
  return !restricted;
};

// ── Matching Service outage: queue-backed resilience ──
//
// Trip request arrives → API creates trip in 'searching' status → publishes to Kafka
// Matching Service consumes from Kafka
//
// If Matching Service is down:
//   - Kafka retains messages (configured retention: 24 hours)
//   - Trip sits in 'searching' status
//   - Background job cancels trips searching > 5 minutes with: "no drivers available"
//   - When Matching Service recovers: resumes consuming from where it left off
//   - New trips get processed immediately; backlog drains in order

// ── DB failover: fail-fast on payment writes ──
const chargeWithCircuitBreaker = async (chargeArgs) => {
  try {
    return await paymentBreaker.fire(chargeArgs);
  } catch (err) {
    if (err.message === 'Circuit breaker is open') {
      // DB is down — fail immediately, do not queue, do not retry blindly
      // Payment will be retried when the consumer next processes this event
      throw new ServiceUnavailableError('Payment service temporarily unavailable');
    }
    throw err;
  }
};
// Circuit breaker on payment writes: if DB fails → open → requests fail fast
// Prevents multiple payment retries from all queuing up and firing simultaneously
// when the DB comes back (which would cause double-charges)`
    },

    // ── 16. API design ──
    {
      speaker: "raj",
      text: `"Let's wrap up with APIs. What are the key endpoints?"`
    },
    {
      speaker: "you",
      text: `"For the rider: get nearby drivers to populate the map before requesting, estimate a fare before confirming, create a trip, get the active trip status, cancel a trip, get trip history. For the driver: update their availability status, accept or decline a trip offer, update trip status as they go through the journey, get their earnings summary. Shared: the WebSocket endpoint for real-time location and trip updates, and the ratings endpoint."`
    },
    {
      speaker: "raj",
      text: `"What does the 'create trip' request and response look like?"`
    },
    {
      speaker: "you",
      text: `"Request carries the rider's pickup and dropoff coordinates, vehicle category, and — critically — the estimated fare and surge multiplier that was shown to them. The server recalculates the estimate independently and checks that what the client sent is within a small tolerance. If surge has changed significantly since the estimate was shown — more than, say, twenty percent — we return a specific error code telling the client to re-fetch the estimate and show the rider the updated price before confirming. We never silently charge a higher price than what was shown."`
    },
    {
      speaker: "raj",
      text: `"Last question. How do you handle the situation where a rider's app shows surge as 1.0 when they start requesting, but surge spikes to 2.0 by the time the server processes the request?"`
    },
    {
      speaker: "you",
      text: `"The server compares the client-sent surge against the current server-side surge at request processing time. If the difference exceeds a threshold — say 20% — we reject the request with a specific error: 'surge_changed'. The client re-fetches the estimate, shows the rider the new surge, and they confirm again with the updated price. If the difference is small — surge moved from 1.0 to 1.1 — we accept the request and lock the new surge into the trip. The threshold is a product decision, not a technical one. The technical guarantee is: no trip is ever created with a surge the rider didn't explicitly see and confirm."`
    },
    {
      type: "code",
      text: `// ── Key API endpoints ──

// ── Rider APIs ──

// GET /drivers/nearby?lat=37.77&lng=-122.41&category=economy
// Returns: list of driver positions for map display (anonymised — no driver ID)
// { drivers: [{ lat, lng, heading, eta_minutes }] }

// POST /trips/estimate
// Body:    { pickupLat, pickupLng, dropoffLat, dropoffLng, category }
// Returns: { estimatedFare, surgeMultiplier, estimatedDuration, estimatedDistance, expiresAt }
// Note:    estimate is valid for 60 seconds — client must confirm within that window

// POST /trips
// Body:    { pickupLat, pickupLng, dropoffLat, dropoffLng, category,
//            clientSurgeSeen: 1.8, clientEstimatedFare: 14.40 }
// Server:  re-fetches current surge, compares with clientSurgeSeen
//          if |currentSurge - clientSurgeSeen| / clientSurgeSeen > 0.20 → reject
// Returns 200: { tripId, status: 'searching', driver: null }
// Returns 409: { error: 'surge_changed', currentSurge: 2.4, newEstimate: 19.20 }

// GET /trips/active
// Returns: current trip status, driver location, ETA, fare estimate
// Called on reconnect to re-sync client state

// DELETE /trips/:tripId
// Cancel a trip — rules applied server-side (grace period, cancellation fee)

// GET /trips?page=0&limit=20
// Paginated trip history — read replica, immutable data

// POST /trips/:tripId/ratings
// Body: { score: 5, comment: "Great ride" }
// Returns: 200 or 400 (window closed, already rated, not a participant)

// ── Driver APIs ──

// PATCH /driver/status
// Body: { status: 'available' | 'offline' }
// Updates driver availability — starts/stops appearing in matching queries

// POST /trips/:tripId/accept
// Driver accepts a trip offer — optimistic lock on driver status
// Returns 200: trip details, rider pickup location
// Returns 409: trip was already taken (another driver accepted first)

// POST /trips/:tripId/decline
// Driver declines — Matching Service moves to next candidate

// PATCH /trips/:tripId/status
// Body: { status: 'driver_arriving' | 'in_progress' | 'completed' }
// Driver progresses the trip through stages
// 'completed' triggers fare calculation + async payment

// GET /driver/earnings?from=2025-04-01&to=2025-04-30
// Returns: earnings breakdown, trips count, payout status

// ── WebSocket events (bidirectional) ──
//
// Driver → Server:
//   { type: 'location_update', lat, lng, heading, speed }   (every 4 seconds)
//   { type: 'heartbeat' }                                   (every 30 seconds)
//
// Server → Rider:
//   { type: 'driver_location', lat, lng, heading, eta }     (every 4 seconds during trip)
//   { type: 'trip_status_changed', status, ... }            (on any trip state change)
//   { type: 'driver_arriving' }                             (when driver is < 1 min away)
//
// Server → Driver:
//   { type: 'trip_offer', tripId, rider, pickup, dropoff, estimatedFare, expiresAt }
//   { type: 'offer_expired' }                               (if 15s passes with no response)`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Good. Let's summarise what you covered. If you had to tell me the three decisions that matter most in this design, what are they?"`
    },
    {
      speaker: "you",
      text: `"First — the location service architecture. Five hundred thousand writes per second is the hardest constraint, and everything else flows from solving that correctly. Redis GEO for live positions, Kafka for fan-out and persistence, Cassandra for history. Get that wrong and the whole system falls over under its own weight. Second — the matching algorithm. Distance alone is a bad signal. ETA, heading, and rating produce a better driver experience and better utilisation. But you still need to cap the candidate set and do the scoring in memory, not in the database, or matching becomes a bottleneck during rush hour. Third — trip state as a strict state machine with conditional database updates. The trip is the contract between the rider and the driver. It touches matching, payments, notifications, and ratings. If the state machine has holes — if a trip can be in two states at once, or transition backwards — every downstream system breaks in subtle ways. Strict transitions enforced at the database level are non-negotiable."`
    },
    {
      speaker: "raj",
      text: `"And what would you do differently if you had more time in this interview?"`
    },
    {
      speaker: "you",
      text: `"I glossed over the maps and routing integration — specifically how you handle the case where your routing provider is slow or unavailable during matching. I'd want to talk through a fallback strategy there: straight-line distance as a degraded-mode estimate, with a circuit breaker on the external routing API. I also didn't go deep on multi-region — how driver data and trip data is replicated across regions, and how you handle a rider in one region whose driver crosses a regional boundary. And the driver onboarding and compliance side — background checks, vehicle inspection records, regulatory requirements by city — that's a whole system on its own that I treated as out of scope."`
    },
    {
      speaker: "raj",
      text: `"Fair. That's a good self-assessment."`
    },

    {
      type: "summary",
      points: [
        "Start every system design by clarifying functional requirements, non-functional requirements, and scale estimates before drawing anything. For a car-sharing app the critical numbers are: ~2M active drivers sending location every 4 seconds = 500K writes/second, and ~10M trips/day = ~500 writes/second at peak. The location ingestion number dwarfs everything else and drives the architecture. Non-functional requirements should separate what needs strong consistency (trip state, payments) from what tolerates eventual consistency (ratings, history, analytics).",
        "The core services are: Rider Service, Driver Service, Location Service, Matching Service, Trip Service, Payment Service, and Notification Service. Separate them not for microservices purity but because their scaling requirements are completely different — location needs to absorb 500K writes/second, payment needs ACID guarantees, matching needs low-latency spatial queries. A monolith would force the most demanding scaling constraint onto every feature.",
        "Driver location uses Redis GEO commands as the live store — geospatial operations are native, write throughput is unmatched, reads are sub-millisecond. Every location update also publishes to Kafka: one consumer persists history to Cassandra for analytics and route reconstruction, another pushes real-time updates to riders via WebSocket. The write path for live location never touches the persistent store. Shard Redis geo sets by city and geohash prefix to prevent hotspots in dense cities.",
        "The matching algorithm is a scoring function, not a simple nearest-driver query. Use Redis GEOSEARCH to get the closest 20 candidates by raw distance, then score each on ETA (70%), direction of travel toward pickup (20%), and driver rating (10%). ETA comes from a routing service — batch the calls for the candidate set rather than calling one at a time. To prevent race conditions, use an optimistic lock: set driver status to 'pending' in Redis when offering, confirm only if database status is still 'available'. Offer expires in 15 seconds, then fall back to next candidate.",
        "Geohash encodes latitude and longitude as a string where shared prefixes mean geographic proximity. It enables proximity queries as string prefix scans rather than trigonometric distance calculations across all rows. Always search the target geohash cell and its 8 neighbours — a driver just across a cell boundary would otherwise be invisible despite being 50 metres away. Redis GEO handles this internally; custom geohash implementations must handle the 9-cell search explicitly.",
        "The trip is a strict state machine: searching → accepted → driver_arriving → in_progress → completed, with cancellation possible from several states under defined rules. Every transition is a conditional database update — update only if current status matches the expected previous state. This is the optimistic lock that prevents a trip from being in two states simultaneously. Driver status is a matching state machine: offline → available → pending (soft lock during offer) → on_trip. Cancellation rules vary by who cancels and when: rider cancels after driver is en route past a 2-minute grace period = cancellation fee.",
        "Fare has three components: booking fee, per-kilometre rate, and per-minute rate — calculated at completion from actual distance and duration, not the estimate. Surge multiplier is calculated every 30 seconds by comparing pending requests to available drivers per geohash cell, mapped through a ratio-to-multiplier lookup table with a hard cap. The surge is locked into the trip record at request time — not at completion. If surge changes significantly between when the estimate was shown and when the request is confirmed, the server rejects the request with a 'surge_changed' error and the client re-fetches. No trip is created with a surge the rider didn't explicitly see and confirm.",
        "Payment is asynchronous — the rider sees 'trip completed' immediately; charging happens in the background via a Kafka consumer. Every charge has an idempotency key (the trip ID) to prevent double-charging on retry. The payments table has a unique constraint on trip_id as a database-level duplicate guard. Card declines flag the account — the rider can't book new trips until the outstanding balance is cleared, but they're not interrupted mid-session. Driver payouts are batched weekly into a ledger and transferred via ACH — per-trip transfers are too expensive. Commission rate is snapshotted at trip completion to prevent future rate changes from retroactively affecting old trips.",
        "Notifications use two channels: WebSocket for in-app real-time events (driver location, trip status changes), and push notifications (APNs/FCM) for out-of-app alerts. SMS is a fallback for the highest-priority events — driver arrived, payment failed — triggered automatically if push delivery fails. Clients must tolerate missing WebSocket messages: on reconnect, the app re-fetches current trip state from the server and reconciles. The server is always authoritative; the real-time stream is best-effort.",
        "Database responsibilities are divided by access pattern: PostgreSQL for users, trips, payments, and ratings — relational integrity and ACID transactions. Redis for live driver positions, driver status, surge multipliers, session tokens, and all ephemeral state — everything has a TTL so Redis restarts are self-healing. Cassandra for driver location history — append-only, time-series, partitioned by driver ID with timestamp as clustering key, handling 500K writes/second naturally. Read replicas handle trip history queries — the primary never serves reads for immutable historical data. Partition the trips table by month to keep active-trip queries fast as the table grows to billions of rows.",
        "The three most important failure scenarios: driver goes silent mid-trip — flag as 'location_lost', notify rider, do not cancel, resume when driver reconnects. Payment fails at completion — complete the trip, record outstanding balance, restrict future bookings until resolved. Matching Service goes down — trip requests queue in Kafka, trips sit in 'searching', background job cancels requests that have waited too long, Matching Service resumes from the queue when it recovers. The queue decouples the API layer from the Matching Service so riders get delays, not errors. WebSocket server failover causes thundering herd — mitigate with jittered exponential backoff on client reconnect."
      ]
    }
  ]
};

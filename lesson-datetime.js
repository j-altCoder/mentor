// ─────────────────────────────────────────────────────────────────
//  LESSON: Date & Time
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_DATETIME = {
  category: "Language & Framework Fundamentals",
  tag: "Date & Time",
  title: "The Invisible Complexity That Breaks Every App Eventually",
  intro: "A customer emails: their subscription renewed at the wrong time. Another customer: their appointment showed up an hour early. A third: their invoice is dated yesterday even though they paid today. Raj pulls up a chair.",
  scenes: [

    // ── Why time is hard ──
    {
      speaker: "raj",
      text: `"All three of those bugs have the same root cause. What do you think it is?"`
    },
    {
      speaker: "you",
      text: `"Time zones?"`
    },
    {
      speaker: "raj",
      text: `"Time zones are part of it — but the deeper problem is that most developers treat time as if it's a simple number, when it's actually a deeply contextual concept. 'Midnight on March 10th' means something completely different depending on where you are. Your server has a timezone. Your database has a timezone. Your user's browser has a timezone. If those three don't agree — and they usually don't — you get subtle, hard-to-reproduce bugs that only appear for users in specific regions or around daylight saving transitions. The fix isn't a trick — it's a discipline: <em>store UTC everywhere, convert to local time only at the moment of display</em>."`
    },
    {
      type: "analogy",
      text: "UTC is like measuring distances in metres. Everyone agrees on the unit. When you show the distance to a user in miles or kilometres — that's presentation, not storage. If you stored distances in 'miles from my office', different users would get different numbers for the same distance. UTC is the metres. Local time is the display format."
    },

    // ── JavaScript's Date object ──
    {
      speaker: "you",
      text: `"What's wrong with JavaScript's built-in Date? I've seen people say to never use it."`
    },
    {
      speaker: "raj",
      text: `"The underlying representation is fine — a Date is just milliseconds since Unix epoch, always in UTC internally. The problems are the API. Month indexing starts at 0 — January is 0, December is 11. Date parsing is inconsistent across environments — the same string parses differently in Node versus browsers, and some formats throw on some platforms but not others. There's no way to represent a date without a time, or a time without a date. And there's no built-in timezone support — you can't say 'give me this date in Tokyo timezone' without a third-party library. The object is also mutable — methods like setMonth modify the object in place, which causes subtle bugs when you pass Dates around."`
    },
    {
      speaker: "you",
      text: `"So what do you use instead?"`
    },
    {
      speaker: "raj",
      text: `"For new projects: the <em>Temporal</em> API — a TC39 proposal that's nearing full adoption. It has immutable date objects, explicit timezone handling, and separates concerns: PlainDate for dates without time, PlainTime for times without dates, ZonedDateTime for the full thing with timezone. For projects that need timezone support now: <em>date-fns</em> for pure date operations, or <em>Luxon</em> for a more complete datetime object. Avoid Moment.js — it's legacy, mutable, and enormous. The team themselves say to use something else for new projects."`
    },
    {
      type: "code",
      text: `// JavaScript Date — the gotchas

// ❌ Month is 0-indexed — classic source of off-by-one bugs
const date = new Date(2024, 2, 15); // March 15th — NOT February
console.log(date.getMonth()); // 2 — confusing

// ❌ String parsing — behaviour varies across environments
new Date('2024-03-15');           // UTC midnight in most environments
new Date('2024/03/15');           // Local midnight — different! (or Invalid Date)
new Date('March 15, 2024');       // Works in browsers, may fail in some Node envs
// ✅ Always use ISO 8601 format: 'YYYY-MM-DDTHH:mm:ssZ'
new Date('2024-03-15T00:00:00Z'); // unambiguous — UTC midnight, always

// ❌ Mutable — setX methods modify in place
const start = new Date('2024-03-15');
const end   = start; // not a copy — same object
end.setDate(end.getDate() + 7);
console.log(start.toISOString()); // 2024-03-22 — start was mutated!
// ✅ Always create a new Date when you want a different date
const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

// ❌ Date arithmetic with DST — adding "24 hours" ≠ "add 1 day" in local time
// During spring-forward (clocks skip an hour), one "day" is only 23 hours
// During fall-back, one "day" is 25 hours
// If you care about calendar days, not elapsed milliseconds, use a library

// ✅ date-fns — functional, immutable, tree-shakeable
const { addDays, format, parseISO, isAfter, startOfDay } = require('date-fns');
const tomorrow = addDays(new Date(), 1);        // correct calendar day addition
const formatted = format(tomorrow, 'PPP');      // "March 16th, 2024"
const parsed    = parseISO('2024-03-15');       // safe, consistent parsing

// ✅ Temporal API (modern, nearing full adoption)
// const today = Temporal.Now.plainDateISO();      // PlainDate — no time
// const meeting = Temporal.ZonedDateTime.from('2024-03-15T14:00[America/New_York]');
// const inTokyo = meeting.withTimeZone('Asia/Tokyo');
// Immutable: all operations return new instances, never mutate`
    },

    // ── UTC everywhere ──
    {
      speaker: "you",
      text: `"How does the 'store UTC, display local' rule actually work in a full stack? The database, the API, the frontend all need to be consistent."`
    },
    {
      speaker: "raj",
      text: `"Let's trace an event from creation to display. A user in New York creates an appointment for 3pm. The browser knows their local timezone via the Intl API. It converts 3pm New York to UTC before sending to the API — or it sends the ISO 8601 string with the timezone offset embedded: <em>2024-03-15T15:00:00-05:00</em>. The API stores that as UTC in the database — MongoDB stores Date objects as UTC milliseconds internally. When the API returns the appointment, it returns the UTC timestamp. The browser receives the UTC timestamp and converts to the user's local timezone for display using the Intl API or date-fns-tz. The server never needs to know the user's timezone — that's purely a presentation concern."`
    },
    {
      type: "code",
      text: `// UTC everywhere — the full-stack discipline

// DATABASE LAYER
// MongoDB: always stores Date objects as UTC milliseconds internally
// ✅ Let Mongoose handle it — always store as Date, never as string
const EventSchema = new Schema({
  title:     String,
  startsAt:  { type: Date, required: true },   // stored as UTC in MongoDB
  endsAt:    { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }  // Date.now() = UTC
});

// ❌ Never store timezone-local strings in the database
// startsAt: "2024-03-15T15:00:00"  ← ambiguous — what timezone?

// API LAYER
// Accept ISO 8601 strings with timezone info, always respond with UTC ISO strings
app.post('/api/events', asyncHandler(async (req, res) => {
  const { title, startsAt } = req.body;
  // '2024-03-15T15:00:00-05:00' → JavaScript parses → stored as UTC in DB
  const event = await Event.create({ title, startsAt: new Date(startsAt) });
  res.status(201).json(event); // MongoDB serialises Date → UTC ISO string automatically
}));

// Response: { startsAt: "2024-03-15T20:00:00.000Z" }  ← always Z (UTC)

// FRONTEND LAYER
// Convert UTC → local timezone for display only — never store local time
const formatEventTime = (utcIsoString, userTimeZone) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone:     userTimeZone,       // 'America/New_York', 'Asia/Tokyo', etc.
    dateStyle:    'long',
    timeStyle:    'short'
  }).format(new Date(utcIsoString));
};
// "2024-03-15T20:00:00.000Z" + 'America/New_York' → "March 15, 2024 at 3:00 PM"
// "2024-03-15T20:00:00.000Z" + 'Asia/Tokyo'       → "March 16, 2024 at 5:00 AM"

// Detect user's timezone automatically
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// 'America/New_York', 'Europe/London', 'Asia/Kolkata' — IANA timezone name

// Always send timezone-aware strings from the frontend
const toUTCForAPI = (localDateStr, userTimeZone) => {
  // date-fns-tz: converts local time + timezone → UTC Date object
  const { zonedTimeToUtc } = require('date-fns-tz');
  return zonedTimeToUtc(localDateStr, userTimeZone).toISOString();
};`
    },

    // ── Timestamps vs DateTimes ──
    {
      speaker: "you",
      text: `"When should I store a Unix timestamp versus an ISO datetime string versus a Date object?"`
    },
    {
      speaker: "raj",
      text: `"In the database: always store as the native Date type, never as a string or raw integer. MongoDB's Date type, Postgres's TIMESTAMPTZ — these are properly indexed, compared correctly, and serialise unambiguously. In your API responses: ISO 8601 strings — <em>2024-03-15T20:00:00.000Z</em>. Human-readable, timezone-unambiguous, parseable by every language's standard library, sortable as strings. In JavaScript code: Date objects or a library type. Never pass raw timestamp integers around in application code — you lose context about what the number means and it's easy to mix milliseconds with seconds. Unix timestamps are fine for inter-system communication where both sides agree on the unit — but document whether it's seconds or milliseconds."`
    },
    {
      type: "code",
      text: `// Timestamps — which format for which context

// ✅ Database: native Date type
// Mongoose: { createdAt: Date }           → proper indexing and sorting
// Postgres:  TIMESTAMPTZ (not TIMESTAMP)  → stores timezone offset, always unambiguous

// ✅ API responses: ISO 8601 strings
// "2024-03-15T20:00:00.000Z"
// Properties: human-readable, sortable as string, unambiguous (Z = UTC)
// Every language parses this: new Date(str), DateTime.parse(str), datetime.fromisoformat(str)

// ❌ API responses: Unix timestamps (integers)
// { expiresAt: 1710532800 }
// Problems: is that seconds or milliseconds? Not obvious without docs.
//           not human-readable during debugging
//           off-by-1000x bugs when seconds/ms mixed up

// ✅ If using Unix timestamps: always document the unit explicitly
// { expiresAtMs: 1710532800000 }    // suffix 'Ms' makes unit clear
// { expiresAtSec: 1710532800 }      // suffix 'Sec' makes unit clear

// Comparing dates safely
const now = new Date();
const expiresAt = new Date(token.expiresAt);

// ✅ Compare Date objects or their valueOf() (milliseconds)
if (expiresAt < now) throw new UnauthorizedError('Token expired');
if (expiresAt.getTime() < Date.now()) throw new UnauthorizedError('Token expired');

// ❌ Never compare formatted strings
if ('2024-03-15' < '2024-03-16') { ... }  // works for ISO dates by accident
if ('March 15' < 'March 16') { ... }      // does NOT work — lexicographic, not date order

// Sorting by date in MongoDB — always use Date type, not strings
const recent = await Event.find().sort({ startsAt: -1 }).limit(20);
// If startsAt were stored as "March 15, 2024" strings — sort would be wrong`
      
    },

    // ── Timezones in depth ──
    {
      speaker: "you",
      text: `"When do I actually need to care about timezones on the backend? Can't I just let the frontend handle it?"`
    },
    {
      speaker: "raj",
      text: `"Mostly yes — the backend stores UTC, the frontend displays local. But three cases force the backend to reason about timezones. <em>Scheduled jobs</em> — 'send the daily digest at 9am for each user'. You can't run that cron at a single UTC time — 9am UTC is 4am in New York and 10pm in Tokyo. You need to know each user's timezone to calculate the correct UTC time to trigger their job. <em>Business hours logic</em> — 'only allow bookings during 9-5 Monday to Friday for this clinic'. The clinic's timezone determines what counts as a valid booking time. <em>Reporting by calendar date</em> — 'show sales for today'. A transaction at 11pm New York time is 'today' for the user but 'tomorrow' at UTC. If you group by UTC date you get wrong totals for users in UTC-offset timezones."`
    },
    {
      type: "code",
      text: `// Backend timezone reasoning — the three cases

// 1. Scheduled job per user timezone
// ❌ Runs for everyone at the same UTC time — wrong local time for most users
// 0 9 * * * sendDailyDigest()  // 9am UTC — 4am in New York

// ✅ Calculate UTC fire time per user based on their timezone
const { zonedTimeToUtc } = require('date-fns-tz');
const { format, addDays }  = require('date-fns');

const scheduleDigestForUser = async (user) => {
  const tomorrow9am = format(addDays(new Date(), 1), 'yyyy-MM-dd') + 'T09:00:00';
  const utcFireTime = zonedTimeToUtc(tomorrow9am, user.timezone);
  await jobQueue.add('send-digest', { userId: user._id }, { delay: utcFireTime - Date.now() });
};
// User in New York: fires at 14:00 UTC
// User in Tokyo:    fires at 00:00 UTC next day

// 2. Business hours validation
const isWithinBusinessHours = (proposedUtc, businessTimezone, hours = { open: 9, close: 17 }) => {
  const { utcToZonedTime }  = require('date-fns-tz');
  const { getHours, getDay } = require('date-fns');

  const localTime = utcToZonedTime(proposedUtc, businessTimezone);
  const hour      = getHours(localTime);
  const dayOfWeek = getDay(localTime);   // 0 = Sunday, 6 = Saturday

  const isWeekday   = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isDuringDay = hour >= hours.open && hour < hours.close;
  return isWeekday && isDuringDay;
};

app.post('/api/bookings', asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.body.clinicId);
  if (!isWithinBusinessHours(new Date(req.body.startsAt), clinic.timezone)) {
    throw new ValidationError('Booking must be during business hours');
  }
  // ...
}));

// 3. Reporting by calendar date
// ❌ Groups by UTC date — off-by-one for users in non-UTC timezones
const sales = await Order.aggregate([
  { $group: {
    _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, // UTC date
    total: { $sum: '$total' }
  }}
]);

// ✅ Convert to user's local date before grouping
const salesForTimezone = await Order.aggregate([
  { $group: {
    _id: {
      $dateToString: {
        format:   '%Y-%m-%d',
        date:     '$createdAt',
        timezone: req.user.timezone    // 'America/New_York'
      }
    },
    total:  { $sum: '$total' },
    count:  { $sum: 1 }
  }},
  { $sort: { _id: -1 } }
]);`
      
    },

    // ── DST and edge cases ──
    {
      speaker: "you",
      text: `"Daylight saving time — I've seen it cause bugs even in codebases that seemed to do everything right. What are the actual traps?"`
    },
    {
      speaker: "raj",
      text: `"DST transitions create two categories of broken time. <em>Non-existent times</em>: when clocks spring forward at 2am, the times 2:00am to 2:59am don't exist. If a user books a recurring appointment at 2:30am and you apply that naively, you get an invalid datetime on the transition day. <em>Ambiguous times</em>: when clocks fall back at 2am, the times 1:00am to 1:59am occur twice. If a job fires at 1:30am, it might fire twice — or at the wrong one of the two 1:30ams. The safe approach: for recurring scheduled events, store in local wall clock time with the IANA timezone name, not as a UTC offset. UTC offsets change with DST — the timezone name stays stable and a good library handles the transition correctly."`
    },
    {
      type: "code",
      text: `// DST traps — and how to avoid them

// ❌ Store recurring schedule as a UTC offset
// User sets recurring meeting at 9am, timezone offset -05:00
// After spring-forward, offset is -04:00 — now it fires at 10am local time

// ✅ Store IANA timezone name, not offset
// The name 'America/New_York' always means New York local time
// A good library calculates the correct offset for any given date
const recurringMeeting = {
  wallClockTime: '09:00',          // 9am local
  timezone:      'America/New_York', // IANA name — not -05:00
  daysOfWeek:    ['Monday', 'Wednesday', 'Friday']
};

// ❌ "Add 24 hours" to get "tomorrow" — wrong on DST transition days
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
// On spring-forward day: "tomorrow" is 23 hours later in wall clock time

// ✅ Use calendar-aware day addition
const { addDays } = require('date-fns');
const tomorrow = addDays(today, 1); // always the next calendar day

// ❌ Naively converting local time to UTC around transition
// If user schedules 2:30am on a spring-forward night, this is invalid
// Date libraries differ on how they handle this — check yours explicitly
// ✅ Validate that the constructed time exists and isn't ambiguous
const { isValid } = require('date-fns');
const { zonedTimeToUtc } = require('date-fns-tz');
const utc = zonedTimeToUtc('2024-03-10T02:30:00', 'America/New_York');
if (!isValid(utc)) throw new ValidationError('This time does not exist due to DST');

// Node.js server timezone — always force UTC to prevent server timezone from
// contaminating Date operations when no timezone is specified
// In your startup script or Dockerfile:
// TZ=UTC node src/index.js
// Or in ecosystem.config.js: env: { TZ: 'UTC' }
// Without this: new Date().toLocaleDateString() uses the server's OS timezone`
      
    },

    // ── Date validation and parsing ──
    {
      speaker: "you",
      text: `"How do I validate a date that comes in from user input or an API request?"`
    },
    {
      speaker: "raj",
      text: `"Several layers. First: format validation — is it a string that looks like a date? Reject anything that isn't ISO 8601. Second: parse validation — does it produce a valid Date? <em>new Date('2024-02-30')</em> in JavaScript doesn't throw — it silently rolls over to March 1st. You need an explicit validity check. Third: business rules — is the date in the future? Within an acceptable range? Not on a weekend? Use a library like date-fns with Zod or Joi for the parsing and format validation, then apply your business rules against the parsed Date object. Never trust that a string that looks like a date actually represents a valid calendar date."`
    },
    {
      type: "code",
      text: `// Date validation — multiple layers

// 1. Schema-level validation with Zod
const { z } = require('zod');
const { parseISO, isValid, isFuture, isWeekend, addYears } = require('date-fns');

const appointmentSchema = z.object({
  startsAt: z.string()
    .datetime({ offset: true })          // must be ISO 8601 with timezone offset
    .transform(s => parseISO(s))         // string → Date object
    .refine(d => isValid(d), 'Invalid date')
    .refine(d => isFuture(d), 'Appointment must be in the future')
    .refine(d => !isWeekend(d), 'No weekend appointments')
    .refine(d => d < addYears(new Date(), 1), 'Cannot book more than 1 year ahead'),
  timezone: z.string().refine(tz => {
    try { Intl.DateTimeFormat(undefined, { timeZone: tz }); return true; }
    catch { return false; }
  }, 'Invalid timezone')
});

// 2. The silent roll-over problem
const date = new Date('2024-02-30'); // February doesn't have 30 days
console.log(date); // Fri Mar 01 2024 — silently rolled over!
console.log(isValid(date)); // true — isValid just checks it's a Date object, not semantics

// ✅ Strict date validation — detect roll-overs
const { parse, isValid, format } = require('date-fns');
const strictParse = (dateStr, fmt = 'yyyy-MM-dd') => {
  const parsed = parse(dateStr, fmt, new Date());
  // Round-trip check: re-format parsed date and compare to input
  if (!isValid(parsed) || format(parsed, fmt) !== dateStr) {
    throw new ValidationError('Invalid date: ' + dateStr);
  }
  return parsed;
};
strictParse('2024-02-30'); // throws — 2024-02-30 doesn't exist
strictParse('2024-02-29'); // returns Date — 2024 is a leap year, Feb 29 exists

// 3. Age calculation — common interview question done right
const calculateAge = (birthDate) => {
  const { differenceInYears } = require('date-fns');
  return differenceInYears(new Date(), birthDate);
  // differenceInYears accounts for whether this year's birthday has passed yet
};
// ❌ Never do: Math.floor((Date.now() - birthDate) / (365.25 * 24 * 60 * 60 * 1000))
// Breaks on leap years and near birthday boundaries`
      
    },

    // ── Practical patterns ──
    {
      speaker: "raj",
      text: `"Last thing — give me five date/time rules you'd put in every team's engineering handbook."`
    },
    {
      speaker: "you",
      text: `"Store UTC, display local..."`
    },
    {
      speaker: "raj",
      text: `"Good. And: always run your Node server with <em>TZ=UTC</em> so the OS timezone never contaminates your date calculations. Never store dates as strings in the database — use the native Date type so sorting, indexing, and comparisons work correctly. Always store the user's IANA timezone name alongside dates that will be displayed back to that user — you can't convert a stored UTC time to the right local time without knowing whose local time it was. And use a library for any arithmetic — adding days, comparing dates, formatting — the native Date API has too many footguns to trust for anything beyond construction and serialisation."`
    },
    {
      type: "code",
      text: `// The five rules in code

// Rule 1: Store UTC everywhere — convert to local only at display
// ✓ Database: native Date type (always UTC internally)
// ✓ API responses: ISO 8601 "Z" strings
// ✓ Frontend: convert with Intl.DateTimeFormat or date-fns-tz

// Rule 2: Force server timezone to UTC
// Dockerfile:           ENV TZ=UTC
// ecosystem.config.js:  env: { TZ: 'UTC' }
// Prevents: new Date().toLocaleDateString() using unexpected server OS timezone

// Rule 3: Never store dates as strings in the DB
// ❌ { scheduledAt: "2024-03-15T15:00:00" }  — unsortable, ambiguous
// ✅ { scheduledAt: ISODate("2024-03-15T15:00:00.000Z") }  — indexed, sortable

// Rule 4: Store IANA timezone name with user-contextual dates
const userEventSchema = new Schema({
  userId:   { type: ObjectId, required: true },
  startsAt: { type: Date, required: true },       // UTC
  timezone: { type: String, required: true },     // 'America/New_York' — for display
  // Without timezone, you can't reconstruct "3pm on Tuesday for this user"
});

// Rule 5: Use date-fns (or Temporal) for all arithmetic
const { addDays, subHours, differenceInMinutes, startOfDay, endOfDay } = require('date-fns');

// Common operations done right:
const nextWeek       = addDays(new Date(), 7);
const oneHourAgo     = subHours(new Date(), 1);
const minutesUntil   = differenceInMinutes(appointment.startsAt, new Date());
const todayStart     = startOfDay(new Date());   // midnight UTC (with TZ=UTC on server)
const todayEnd       = endOfDay(new Date());     // 23:59:59 UTC`
      
    },

    {
      type: "summary",
      points: [
        "The golden rule: store UTC everywhere, convert to local time only at the moment of display. The server never needs to know the user's timezone for storage.",
        "JavaScript Date month indexing is 0-based (January = 0). Always use ISO 8601 strings for parsing: 'YYYY-MM-DDTHH:mm:ssZ'. The native API is too inconsistent for anything else.",
        "Date objects are mutable — setX methods modify in place. Use date-fns (immutable, functional) or the Temporal API for all arithmetic.",
        "Store as native Date type in the DB (never strings). Respond from APIs as ISO 8601 'Z' strings. Never pass raw Unix timestamps without documenting seconds vs milliseconds.",
        "Run Node servers with TZ=UTC to prevent the OS timezone from contaminating date operations that don't specify a timezone explicitly.",
        "Backend needs to reason about timezones for: per-user scheduled jobs (9am local), business hours validation, and reporting by calendar date (not UTC date).",
        "Store IANA timezone names ('America/New_York'), not UTC offsets ('-05:00'). Offsets change with DST; names stay stable and libraries handle transitions correctly.",
        "DST spring-forward creates non-existent times (2:00-2:59am). Fall-back creates ambiguous times (1:00-1:59am occurs twice). Libraries handle this — raw arithmetic does not.",
        "Date validation needs multiple layers: format (ISO 8601 only), existence (Feb 30 silently rolls over — round-trip check catches it), and business rules.",
        "Age calculation: use differenceInYears from date-fns. Never divide milliseconds by 365.25 — breaks on leap years and near birthday boundaries.",
        "Five handbook rules: UTC in storage, TZ=UTC on server, native Date type in DB, IANA timezone name alongside user dates, library for all arithmetic."
      ]
    }
  ]
};

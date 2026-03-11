// ─────────────────────────────────────────────────────────────────
//  LESSON: Date Manipulation in JavaScript
//  Category: Language & Framework Fundamentals
// ─────────────────────────────────────────────────────────────────

const LESSON_DATE_MANIPULATION = {
  category: "Language & Framework Fundamentals",
  tag: "Date Manipulation",
  title: "Actually Working With Dates Without Breaking Things",
  intro: "A ticket lands in your queue: 'Show orders from the last 30 days.' Simple. You write three lines, it ships. Two weeks later: 'The 30-day filter is wrong for users in the US.' Then: 'Subscription renewals are firing a day early.' Then: 'The trial period calculator is off by one on leap years.' Raj pulls up your date code.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"For the 30-day filter I did Date.now() minus 30 times 24 times 60 times 60 times 1000. That's 30 days in milliseconds. What's wrong with it?"`
    },
    {
      speaker: "raj",
      text: `"Run it on the day clocks spring forward. How many milliseconds are in that day?"`
    },
    {
      speaker: "you",
      text: `"Oh. 23 hours. So it's actually 29 days and 23 hours, not 30 days."`
    },
    {
      speaker: "raj",
      text: `"And on the fall-back day it's 25 hours, so you'd get 30 days and 1 hour. Multiplying by 86400000 gives you elapsed milliseconds — that's not the same as calendar days. The moment you treat a day as a fixed number of milliseconds you're one DST transition away from an off-by-one. This is why date arithmetic belongs in a library that understands calendars, not in raw maths."`
    },

    // ── Tools ──
    {
      speaker: "you",
      text: `"Which library should I actually be using? I've seen date-fns, Luxon, Day.js, Moment — I don't know which one to pick."`
    },
    {
      speaker: "raj",
      text: `"Moment.js first: don't. The maintainers themselves say to use something else for new projects. It's mutable, enormous, and hasn't been actively developed in years. For new MERN projects: <em>date-fns</em> is the default choice. It's a collection of pure functions — immutable, tree-shakeable, works with native Date objects, has a timezone plugin. <em>Day.js</em> is a good lightweight alternative if bundle size is critical on the frontend. <em>Luxon</em> if you want a full DateTime object API instead of functions — built by the Moment team as the proper successor. The Temporal API is the future — nearing full browser support — but not production-ready everywhere yet. For this lesson we'll use date-fns because that's what you'll see in most MERN codebases today."`
    },
    {
      type: "code",
      text: `// Install
// npm install date-fns          ← core
// npm install date-fns-tz       ← timezone operations (separate package)

// ── Import only what you need — tree-shakeable ──
import { addDays, subDays, addMonths, addHours, addMinutes } from 'date-fns';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { isBefore, isAfter, isEqual, isWithinInterval }             from 'date-fns';
import { startOfDay, endOfDay, startOfMonth, endOfMonth }           from 'date-fns';
import { format, parseISO, isValid }                                 from 'date-fns';

// ── date-fns key property: immutable ──
// Every function returns a NEW Date — never modifies the original
const today    = new Date();
const tomorrow = addDays(today, 1);   // new Date — today is unchanged
console.log(today === tomorrow);      // false — different objects

// Compare to the native Date footgun:
const a = new Date();
const b = a;               // same object, not a copy
b.setDate(b.getDate() + 1); // mutates BOTH a and b
console.log(a.getDate() === b.getDate()); // true — a was also modified`
    },

    // ── Adding and subtracting ──
    {
      speaker: "you",
      text: `"Okay. How do I actually add time to a date — days, months, years, hours?"`
    },
    {
      speaker: "raj",
      text: `"date-fns has an add function for each unit. The ones that matter in a MERN context: <em>addDays</em> and <em>subDays</em> for relative dates. <em>addMonths</em> for subscription billing cycles — and that one has a subtlety. <em>addHours</em> and <em>addMinutes</em> for scheduling. The general <em>add</em> function if you need multiple units at once. What you don't use is raw millisecond arithmetic for anything that involves calendar units."`
    },
    {
      speaker: "you",
      text: `"What's the subtlety with addMonths?"`
    },
    {
      speaker: "raj",
      text: `"What's January 31st plus one month?"`
    },
    {
      speaker: "you",
      text: `"February 31st... which doesn't exist. So February 28th? Or March 3rd?"`
    },
    {
      speaker: "raj",
      text: `"date-fns gives you the last valid day of the target month — February 28th, or 29th in a leap year. That's almost always the right answer for billing: if someone subscribes on January 31st, their next billing date is February 28th, not March 3rd. Know what your library does at month-end boundaries before you ship subscription logic."`
    },
    {
      type: "code",
      text: `import { addDays, subDays, addWeeks, addMonths, addYears, addHours, addMinutes, add, sub } from 'date-fns';

const now = new Date('2024-01-31T12:00:00Z');

// ── Adding calendar units ──
addDays(now, 30)        // 2024-03-01 — 30 calendar days, not 2592000000ms
subDays(now, 7)         // 2024-01-24
addWeeks(now, 2)        // 2024-02-14
addMonths(now, 1)       // 2024-02-29 (2024 is leap year) — snaps to last valid day
addMonths(now, 2)       // 2024-03-31
addYears(now, 1)        // 2025-01-31

// ── Adding time units ──
addHours(now, 3)        // 2024-01-31T15:00:00Z
addMinutes(now, 90)     // 2024-01-31T13:30:00Z

// ── Multiple units at once ──
add(now, { days: 1, hours: 6, minutes: 30 })  // 2024-02-01T18:30:00Z

// ── Subtracting ──
sub(now, { months: 1, days: 3 })              // 2023-12-28T12:00:00Z

// ── Real examples ──

// Trial period: expires in 14 days
const trialEndsAt = addDays(new Date(), 14);

// Subscription: next billing in 1 month
const nextBillingDate = addMonths(subscription.billedAt, 1);

// Token expiry: 15 minutes from now
const tokenExpiresAt = addMinutes(new Date(), 15);

// Cache TTL: invalidate after 1 hour
const cacheExpiresAt = addHours(new Date(), 1);

// "Last 30 days" filter — correct version
const thirtyDaysAgo = subDays(new Date(), 30);
const recentOrders = await Order.find({
  createdAt: { $gte: thirtyDaysAgo }
});`
    },

    // ── Calculating differences ──
    {
      speaker: "you",
      text: `"What about going the other way — I have two dates and I need to know the gap between them. Like how many days until a trial expires, or how long ago an order was placed."`
    },
    {
      speaker: "raj",
      text: `"differenceIn functions — one per unit. They all take the same argument order: <em>differenceInDays(laterDate, earlierDate)</em>. Always later first, earlier second — result is positive if the first argument is in the future. Get it backwards and your 'days remaining' becomes negative when it shouldn't be. The other thing to understand: these functions truncate, they don't round. differenceInDays between 11:59pm Monday and 12:01am Wednesday is 1, not 2 — because it's just over 24 hours but less than 48."`
    },
    {
      speaker: "you",
      text: `"What if I want something like '3 hours ago' or '2 days ago' for a UI timestamp?"`
    },
    {
      speaker: "raj",
      text: `"<em>formatDistanceToNow</em> from date-fns. One line. It picks the right unit automatically — seconds, minutes, hours, days, months — and formats it as a human-readable string. Add the addSuffix option and you get 'about 3 hours ago' or 'in 2 days'. That covers 90% of relative time display in any UI."`
    },
    {
      type: "code",
      text: `import {
  differenceInSeconds, differenceInMinutes, differenceInHours,
  differenceInDays, differenceInMonths, differenceInYears,
  formatDistanceToNow, formatDistance
} from 'date-fns';

const start = new Date('2024-01-01T09:00:00Z');
const end   = new Date('2024-03-15T17:30:00Z');

// ── Calculate the gap ──
differenceInDays(end, start)       // 74
differenceInHours(end, start)      // 1784
differenceInMinutes(end, start)    // 107070
differenceInMonths(end, start)     // 2   ← truncated, not rounded

// ── Argument order matters — later date FIRST ──
differenceInDays(end, start)       //  74 ✓ (end is later)
differenceInDays(start, end)       // -74 ✗ (backwards — negative)

// ── Truncation vs rounding ──
const a = new Date('2024-01-01T00:00:00Z');
const b = new Date('2024-01-02T23:00:00Z');
differenceInDays(b, a)   // 1 — not 2, even though it's 47 hours
                         // because 47 < 48 (2 full days)

// ── Trial expiry display ──
const trialEndsAt = new Date('2024-03-20T00:00:00Z');
const daysLeft    = differenceInDays(trialEndsAt, new Date());
// daysLeft = 5 → "5 days left in your trial"
// daysLeft = 0 → "Your trial expires today"
// daysLeft < 0 → "Your trial has expired"

// ── "Time ago" for UI ──
const order = { createdAt: new Date('2024-03-10T14:30:00Z') };

formatDistanceToNow(order.createdAt, { addSuffix: true })
// "5 days ago"        (if today is March 15)
// "about 2 hours ago" (if placed 2 hours ago)
// "in 3 days"         (if scheduled in the future)

formatDistance(start, end)
// "2 months" — between two specific dates, no suffix

// ── Age calculation — the right way ──
import { differenceInYears } from 'date-fns';
const age = differenceInYears(new Date(), user.dateOfBirth);
// Accounts for whether this year's birthday has passed yet
// Never: Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000))
//        breaks on leap years and near birthday boundaries`
    },

    // ── Comparing dates ──
    {
      speaker: "you",
      text: `"Comparing dates — I usually just do date1 > date2. Is that wrong?"`
    },
    {
      speaker: "raj",
      text: `"It works because JavaScript coerces Date objects to their millisecond value when you use comparison operators. It's not wrong exactly — but it breaks the moment you compare dates for equality. What does date1 === date2 give you?"`
    },
    {
      speaker: "you",
      text: `"False, even if they represent the same moment. Because they're two different objects."`
    },
    {
      speaker: "raj",
      text: `"Right. So for less-than and greater-than the native operators work fine. For equality you need to compare the millisecond values, or use date-fns <em>isEqual</em>. The more useful functions are <em>isBefore</em> and <em>isAfter</em> — they read like English and remove any ambiguity about which argument is which. And <em>isWithinInterval</em> for range checks, which is cleaner than writing date >= start && date <= end everywhere."`
    },
    {
      type: "code",
      text: `import { isBefore, isAfter, isEqual, isWithinInterval, compareAsc, compareDesc } from 'date-fns';

const now       = new Date('2024-03-15T12:00:00Z');
const past      = new Date('2024-01-01T00:00:00Z');
const future    = new Date('2024-12-31T00:00:00Z');
const sameAsNow = new Date('2024-03-15T12:00:00Z');

// ── Comparison ──
isBefore(past, now)    // true  — past is before now
isAfter(future, now)   // true  — future is after now
isEqual(now, sameAsNow)// true  — same millisecond value, different objects

// ── Native operators — work for < > but not === ──
past < now             // true  ✓
now === sameAsNow      // false ✗ — different objects, not useful
now.getTime() === sameAsNow.getTime()  // true ✓ — compare milliseconds

// ── Range check ──
isWithinInterval(now, { start: past, end: future })  // true
// Cleaner than: past <= now && now <= future

// ── Token / subscription expiry check ──
const isExpired  = isBefore(token.expiresAt, new Date());
const isActive   = isAfter(subscription.endsAt, new Date());

// ── Sorting arrays of dates ──
const dates = [future, past, now];

// compareAsc: oldest first (ascending)
dates.sort(compareAsc);   // [past, now, future]

// compareDesc: newest first (descending)
dates.sort(compareDesc);  // [future, now, past]

// ── Sorting objects by date field ──
const orders = [
  { id: 1, createdAt: new Date('2024-03-10') },
  { id: 2, createdAt: new Date('2024-01-05') },
  { id: 3, createdAt: new Date('2024-02-20') },
];
orders.sort((a, b) => compareDesc(a.createdAt, b.createdAt));
// newest first: id 1, id 3, id 2

// ── min and max of date arrays ──
import { min, max } from 'date-fns';
const earliest = min([future, past, now]);  // past
const latest   = max([future, past, now]);  // future`
    },

    // ── Start and end of periods ──
    {
      speaker: "you",
      text: `"For date range queries I usually do something like 'greater than midnight today'. How do I get midnight reliably without hardcoding T00:00:00?"`
    },
    {
      speaker: "raj",
      text: `"<em>startOfDay</em> and <em>endOfDay</em>. They give you the absolute start and end of a calendar day — midnight to 23:59:59.999. There's a whole family of these for every period you'd query against: startOfWeek, startOfMonth, startOfYear. In a MERN codebase with TZ=UTC on the server, these give you UTC boundaries. If you need boundaries in the user's local timezone — a New York user's 'today' starts at midnight New York time — combine them with the timezone functions from date-fns-tz."`
    },
    {
      type: "code",
      text: `import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  startOfHour, endOfHour,
} from 'date-fns';
import { startOfDay as startOfDayTz } from 'date-fns-tz';

const now = new Date('2024-03-15T14:30:00Z');

// ── Period boundaries ──
startOfDay(now)    // 2024-03-15T00:00:00.000Z
endOfDay(now)      // 2024-03-15T23:59:59.999Z
startOfWeek(now)   // 2024-03-10T00:00:00.000Z  (Sunday by default)
startOfWeek(now, { weekStartsOn: 1 })  // 2024-03-11 (Monday start)
startOfMonth(now)  // 2024-03-01T00:00:00.000Z
endOfMonth(now)    // 2024-03-31T23:59:59.999Z
startOfYear(now)   // 2024-01-01T00:00:00.000Z

// ── MongoDB range queries using period boundaries ──

// Orders placed today (UTC)
const todayOrders = await Order.find({
  createdAt: {
    $gte: startOfDay(new Date()),
    $lte: endOfDay(new Date()),
  }
});

// Orders this month
const thisMonthOrders = await Order.find({
  createdAt: {
    $gte: startOfMonth(new Date()),
    $lte: endOfMonth(new Date()),
  }
});

// Orders in a custom date range (from a date picker)
const rangeOrders = await Order.find({
  createdAt: {
    $gte: startOfDay(parseISO(req.query.from)),
    $lte: endOfDay(parseISO(req.query.to)),
  }
});
// startOfDay/endOfDay ensures the whole day is included
// Without them: from=2024-03-01 would mean 00:00:00, to=2024-03-31 would miss the last day

// ── User-timezone-aware "today" boundaries ──
// A user in New York querying "today's orders" means midnight-midnight New York time
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

const getUserDayBounds = (userTimezone) => {
  const nowInUserTz  = utcToZonedTime(new Date(), userTimezone);
  const dayStartInTz = startOfDay(nowInUserTz);
  const dayEndInTz   = endOfDay(nowInUserTz);
  return {
    start: zonedTimeToUtc(dayStartInTz, userTimezone),
    end:   zonedTimeToUtc(dayEndInTz,   userTimezone),
  };
};

const { start, end } = getUserDayBounds('America/New_York');
const userTodayOrders = await Order.find({ createdAt: { $gte: start, $lte: end } });`
    },

    // ── Formatting ──
    {
      speaker: "you",
      text: `"Formatting — I usually just call .toLocaleDateString() or .toISOString(). Are there problems with those?"`
    },
    {
      speaker: "raj",
      text: `"<em>toISOString()</em> is fine — always gives you UTC, unambiguous, consistent. Use it for API responses and logging. <em>toLocaleDateString()</em> is the dangerous one. It formats in the server's locale and timezone. On your laptop in London you get one format. On a cloud server in US-East you get another. It's non-deterministic across environments. On the server, always use <em>date-fns format</em> with an explicit format string so the output is predictable regardless of where the code runs. On the frontend, use <em>Intl.DateTimeFormat</em> with the user's locale and timezone — that's the right tool for locale-aware display."`
    },
    {
      type: "code",
      text: `import { format, formatISO } from 'date-fns';
import { format as formatTz }  from 'date-fns-tz';

const date = new Date('2024-03-15T14:30:00Z');

// ── toISOString — good for APIs and logs ──
date.toISOString()          // "2024-03-15T14:30:00.000Z" — always UTC, always consistent

// ── toLocaleDateString — DO NOT use on the server ──
date.toLocaleDateString()   // "3/15/2024" (US locale) or "15/03/2024" (UK locale)
                            // depends on server OS locale — non-deterministic

// ── date-fns format — explicit, consistent, server-safe ──
format(date, 'yyyy-MM-dd')                    // "2024-03-15"
format(date, 'dd/MM/yyyy')                    // "15/03/2024"
format(date, 'MMMM do, yyyy')                 // "March 15th, 2024"
format(date, 'HH:mm')                         // "14:30"  (24-hour)
format(date, 'h:mm a')                        // "2:30 PM" (12-hour)
format(date, "yyyy-MM-dd'T'HH:mm:ss")        // "2024-03-15T14:30:00"
format(date, 'EEE, d MMM yyyy')              // "Fri, 15 Mar 2024"

// ── Common format tokens ──
// yyyy = 4-digit year      yy = 2-digit year
// MM   = 2-digit month     MMM = "Mar"    MMMM = "March"
// dd   = 2-digit day       d   = day without leading zero
// HH   = 24-hour hours     hh  = 12-hour hours
// mm   = minutes           ss  = seconds
// a    = AM/PM             EEE = "Mon"    EEEE = "Monday"
// Note: use yyyy not YYYY (YYYY = week year — different for edge weeks)
//       use dd not DD (DD = day of year — not what you want)

// ── Formatting in user's timezone ──
formatTz(date, 'h:mm a zzz', { timeZone: 'America/New_York' })
// "10:30 AM EST" — date is 14:30 UTC, which is 10:30 in New York

// ── Frontend: Intl.DateTimeFormat — locale and timezone aware ──
new Intl.DateTimeFormat('en-GB', {
  timeZone:  'Europe/London',
  dateStyle: 'long',
  timeStyle: 'short'
}).format(date)
// "15 March 2024 at 14:30"

new Intl.DateTimeFormat('en-US', {
  timeZone:  'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(date)
// "Mar 15, 2024, 10:30 AM"

// Detect user's timezone and locale automatically
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const userLocale   = navigator.language;`
    },

    // ── Parsing ──
    {
      speaker: "you",
      text: `"Parsing is something I always get wrong. I just do new Date(someString) and hope for the best."`
    },
    {
      speaker: "raj",
      text: `"new Date(string) has two problems. For ISO 8601 strings with a Z or offset — it works fine and consistently. For everything else — the behaviour is implementation-defined. <em>new Date('2024-03-15')</em> in Node gives you midnight UTC. In some browsers it gives you midnight local time. <em>new Date('15/03/2024')</em> gives you Invalid Date in Node and maybe works in Chrome. You're relying on whatever the engine decides to do. Use <em>parseISO</em> for ISO strings from an API. Use <em>parse</em> with an explicit format string for anything else — user input, CSV imports, legacy data."`
    },
    {
      speaker: "you",
      text: `"What about the silent roll-over problem — like February 30th becoming March 1st without throwing?"`
    },
    {
      speaker: "raj",
      text: `"That's where you need a round-trip validation. Parse the string, then re-format it back to the same format and compare with the original. If they don't match, the date rolled over — February 30th becomes March 1st, then re-formats as March 1st, which doesn't equal February 30th. That mismatch is your signal that the input was invalid. Libraries won't throw — you have to check."`
    },
    {
      type: "code",
      text: `import { parseISO, parse, isValid, format } from 'date-fns';

// ── parseISO — for ISO 8601 strings from APIs ──
parseISO('2024-03-15')                    // 2024-03-15T00:00:00.000Z  ✓ consistent
parseISO('2024-03-15T14:30:00Z')          // 2024-03-15T14:30:00.000Z  ✓
parseISO('2024-03-15T14:30:00+05:30')     // 2024-03-15T09:00:00.000Z  ✓ (converts to UTC)

// Never: new Date('2024-03-15') — UTC in Node, local midnight in some browsers

// ── parse — for strings with a known format ──
parse('15/03/2024', 'dd/MM/yyyy', new Date())    // 2024-03-15 ✓
parse('March 15, 2024', 'MMMM d, yyyy', new Date())  // 2024-03-15 ✓
parse('2024-03-15 14:30', 'yyyy-MM-dd HH:mm', new Date())  // 2024-03-15T14:30:00Z ✓

// The third argument is a reference date for filling in missing parts
// (e.g., if the format has no year, the reference date's year is used)

// ── Always validate after parsing ──
const raw    = '2024-02-30';
const parsed = parseISO(raw);
isValid(parsed)   // true — isValid only checks it's a Date object, not calendar validity!

// ── Round-trip check — catches roll-overs ──
const strictParseDate = (str, fmt = 'yyyy-MM-dd') => {
  const parsed = parse(str, fmt, new Date());
  if (!isValid(parsed)) throw new Error(\`Invalid date: \${str}\`);
  const roundTripped = format(parsed, fmt);
  if (roundTripped !== str) throw new Error(\`Date does not exist: \${str}\`);
  return parsed;
};

strictParseDate('2024-02-29');  // ✓ 2024 is a leap year
strictParseDate('2023-02-29');  // ✗ throws — 2023 is not a leap year
strictParseDate('2024-02-30');  // ✗ throws — rolled over to Mar 1

// ── Parsing in route handlers with Zod ──
import { z } from 'zod';
import { parseISO, isValid, isFuture } from 'date-fns';

const dateRangeSchema = z.object({
  from: z.string()
    .refine(s => isValid(parseISO(s)), 'Invalid from date')
    .transform(s => startOfDay(parseISO(s))),
  to: z.string()
    .refine(s => isValid(parseISO(s)), 'Invalid to date')
    .transform(s => endOfDay(parseISO(s))),
}).refine(({ from, to }) => isBefore(from, to), 'from must be before to');

const { from, to } = dateRangeSchema.parse(req.query);`
    },

    // ── Real-world patterns ──
    {
      speaker: "you",
      text: `"Can you show me some of the patterns that actually come up in a MERN app? Like subscription billing, trial periods, expiry checks."`
    },
    {
      speaker: "raj",
      text: `"Let's go through the ones that trip people up. Subscription renewal — you add one month to the last billing date, not one month to now. If billing was late, you don't punish the customer by shortening the next period. Trial expiry — store the absolute date, not a duration. You don't want 'is 14 days of usage over' — you want 'is today past the date we calculated when they signed up.' Rate limiting windows — the current window started at the most recent multiple of the window size, not when the first request came in. And 'business hours' logic — always validate in the business's timezone, not UTC, and account for weekends separately from hours."`
    },
    {
      type: "code",
      text: `import { addMonths, addDays, addMinutes, isBefore, isAfter,
         startOfHour, getDay, getHours, differenceInDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

// ── Subscription renewal — add to last billing date ──
const getNextBillingDate = (subscription) => {
  // ✓ Add 1 month to when they were LAST billed
  return addMonths(subscription.lastBilledAt, 1);
  // ✗ addMonths(new Date(), 1) — if billing was 3 days late,
  //   customer only gets a 27-day period next cycle
};

// ── Trial expiry — store the end date, check against now ──
const createTrial = async (userId) => {
  const trialEndsAt = addDays(new Date(), 14);  // calculated once at signup
  await User.findByIdAndUpdate(userId, { trialEndsAt });
};

const isTrialActive = (user) => isAfter(user.trialEndsAt, new Date());
const trialDaysLeft = (user) => Math.max(0, differenceInDays(user.trialEndsAt, new Date()));

// ── Token / session expiry ──
const createSession = async (userId) => {
  const expiresAt = addMinutes(new Date(), 15);   // 15-minute access token
  return await Session.create({ userId, expiresAt });
};

const isSessionValid = (session) => isAfter(session.expiresAt, new Date());

// ── Rate limit window: current window boundaries ──
const getRateLimitWindow = (windowMinutes = 15) => {
  const now      = new Date();
  const windowMs = windowMinutes * 60 * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const windowEnd   = new Date(windowStart.getTime() + windowMs);
  return { windowStart, windowEnd };
};
// At 14:37: window is 14:30–14:45, regardless of when first request came in

// ── Business hours validation ──
const isBusinessHours = (date, timezone, open = 9, close = 17) => {
  const local = utcToZonedTime(date, timezone);
  const hour  = getHours(local);
  const day   = getDay(local);            // 0=Sun, 1=Mon ... 6=Sat
  return day >= 1 && day <= 5            // weekday
      && hour >= open && hour < close;   // within hours
};

// ── Countdown display ──
const getCountdown = (targetDate) => {
  const now   = new Date();
  const total = differenceInDays(targetDate, now);
  if (total < 0)  return { status: 'expired',  display: 'Expired' };
  if (total === 0) return { status: 'today',   display: 'Expires today' };
  if (total === 1) return { status: 'urgent',  display: '1 day left' };
  if (total <= 7)  return { status: 'warning', display: \`\${total} days left\` };
  return               { status: 'active',  display: \`\${total} days left\` };
};`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Back to where you started — 'last 30 days' using Date.now() minus 30 times 86400000. How would you write it now?"`
    },
    {
      speaker: "you",
      text: `"subDays(new Date(), 30) for the cutoff, then query createdAt greater than or equal to that. And if it's the user's '30 days' rather than UTC 30 days, I'd use startOfDay on both ends with their timezone."`
    },
    {
      speaker: "raj",
      text: `"That's it. The raw millisecond version works most of the time, which is why it survives code review. It fails at the exact moment you can't easily reproduce it — DST transitions, leap years, month boundaries. A library call costs nothing and makes the intent explicit. The bugs you're avoiding aren't hypothetical."`
    },

    {
      type: "summary",
      points: [
        "Never use raw millisecond arithmetic for calendar units. Multiplying by 86400000 gives elapsed milliseconds, not calendar days — one DST transition makes it wrong. Use date-fns for all arithmetic.",
        "Library choice: date-fns is the default for MERN — immutable, tree-shakeable, works with native Dates. Don't use Moment.js in new projects. date-fns-tz is the companion package for timezone-aware operations.",
        "date-fns is immutable — every function returns a new Date, the original is never modified. addDays(today, 1) does not change today. This is unlike the native setDate() methods which mutate in place.",
        "addMonths snaps to the last valid day of the target month — January 31st plus one month gives February 28th (or 29th in a leap year). Always know what your library does at month-end boundaries before shipping billing logic.",
        "differenceIn functions: later date first, earlier date second — result is positive when the first argument is in the future. These functions truncate, not round — 47 hours is 1 day, not 2.",
        "formatDistanceToNow with addSuffix: true gives you '3 hours ago' or 'in 2 days' in one line. Use it for relative timestamps in any UI.",
        "isBefore and isAfter for comparisons — reads like English and removes argument order ambiguity. Use isEqual for date equality — never === on Date objects (always false, different object references).",
        "startOfDay and endOfDay give you the full-day boundaries for range queries. Always use them when querying by date range in MongoDB — without them you'll silently miss records at the start or end of the day.",
        "Never call toLocaleDateString() on the server — it uses the server's OS locale and timezone, which varies by environment. Use date-fns format with an explicit format string for deterministic output. Use yyyy not YYYY, dd not DD.",
        "parseISO for ISO 8601 strings from APIs. parse with an explicit format string for user input or CSV. Never trust new Date(arbitraryString) — behaviour is implementation-defined for non-ISO formats.",
        "Silent roll-over: new Date('2024-02-30') and parseISO('2024-02-30') don't throw — they silently become March 1st. Catch it with a round-trip check: parse → reformat → compare with original input. Mismatch means the date doesn't exist.",
        "Store subscription renewal dates by adding to the last billing date, not to now. Store trial expiry as an absolute date calculated at signup. Store rate limit windows as fixed boundaries, not relative to the first request."
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────
//  LESSON: HR, Managerial & Salary Negotiation
//  Category: Career & Interviews
// ─────────────────────────────────────────────────────────────────

const LESSON_HR_INTERVIEWS = {
  category: "Career & Interviews",
  tag: "HR & Salary Negotiation",
  title: "The Interview After the Technical Interview",
  intro: "You passed the technical round. The recruiter emails: 'Next step is a chat with HR and the engineering manager.' You think it's a formality. Raj has seen too many strong engineers lose offers in this round to let that stand.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"I'm not that worried about the HR round. It's just 'tell me about yourself' and 'where do you see yourself in five years', right? The technical is the hard part."`
    },
    {
      speaker: "raj",
      text: `"The technical round filters out people who can't do the job. The HR round filters out people they don't want to work with. Both are eliminators — just for different reasons."`
    },
    {
      speaker: "you",
      text: `"What are they actually looking for though? I can't prepare for a personality test."`
    },
    {
      speaker: "raj",
      text: `"It's not a personality test. They're checking three things. Can you communicate clearly — will meetings with you be useful or painful? Do you have self-awareness — do you know your gaps or will you be a surprise to manage? And are you a flight risk — will you leave in six months? Every question they ask maps to one of those three. Once you know that, every question becomes answerable."`
    },

    // ── Tell me about yourself ──
    {
      speaker: "you",
      text: `"Okay — 'tell me about yourself.' I always ramble. I don't know where to start or stop."`
    },
    {
      speaker: "raj",
      text: `"This question is a gift. It's two minutes where you control the narrative entirely. The mistake is treating it as a biography — starting from your first job and listing everything in order. Nobody needs the full history. They need a coherent story that ends with why you're sitting in this room. Three parts: where you've been in one sentence, what you've built or learned that's most relevant to this role in two or three sentences, and why this opportunity specifically. Then stop. Under two minutes. If they want more, they'll ask."`
    },
    {
      type: "code",
      text: `// ── Tell me about yourself — the three-part structure ──

// ── Part 1: Where you've been (1 sentence) ──
// Anchor them. What's your current context?
// "I'm a full-stack engineer with four years in Node and React,
//  currently at a fintech startup where I own the payments and
//  reporting APIs."

// ── Part 2: What you've built that's relevant (2–3 sentences) ──
// Pick the 1-2 things most relevant to THIS job, not your full CV.
// Research the role before — what problems do they actually have?
// "In the last year I led a migration of our auth system from
//  session-based to JWT with refresh token rotation, and built a
//  real-time dashboard using WebSockets that reduced our ops team's
//  manual reporting work by about 60%."

// ── Part 3: Why this role, now (1–2 sentences) ──
// Connect the dots — why does this make sense as your next move?
// "I'm looking to move into a team working at larger scale —
//  our current DAU is around 20k, and I want experience with
//  the architectural and reliability challenges that come
//  with 10x that."

// ── What to avoid ──
// ✗ Starting with "I was born in..." or "I graduated in..."
// ✗ Listing every job in order like you're reading a CV
// ✗ Saying "as my CV shows..." — they've read it
// ✗ Ending with "...and that's basically it" — land with purpose
// ✗ Going over 2 minutes without being asked a follow-up

// ── The test: can you say it out loud in under 90 seconds? ──
// If you can't, cut more. The goal is to make them curious, not informed.`
    },

    // ── Why are you leaving ──
    {
      speaker: "you",
      text: `"'Why are you leaving your current job?' My honest answer is that my manager is difficult and the codebase is a mess. Obviously I can't say that."`
    },
    {
      speaker: "raj",
      text: `"You can't say it in those words. But the underlying reasons are legitimate — they just need to be framed as what you're moving towards, not what you're running from. Running-from answers make interviewers nervous: if you badmouth a previous employer, they assume you'll badmouth them too. Moving-towards answers are compelling: you know what you want and you're being deliberate about getting it. Take the real reasons — difficult manager, bad codebase — and find the genuine positive version. Difficult manager means you want better engineering leadership and mentorship. Bad codebase means you want to work on systems that are built with quality as a default, not an afterthought."`
    },
    {
      speaker: "you",
      text: `"What if they push further and ask what specifically wasn't working?"`
    },
    {
      speaker: "raj",
      text: `"You can be honest without being damaging. 'The technical debt had accumulated to a point where most of our sprint was maintenance rather than new work, and I realised I needed to be somewhere where I could grow faster' — that's honest, specific, and professional. What you never do is name individuals, call people incompetent, or sound bitter. One sentence on what wasn't working, then pivot immediately to what you're excited about in this new role. The ratio should be one part past to three parts future."`
    },
    {
      type: "code",
      text: `// ── Why are you leaving — reframe the real reasons ──

// Real reason → Professional framing

// "My manager is difficult"
// → "I've learned a lot in my current role but I'm looking for
//    an environment with stronger engineering leadership —
//    someone I can learn from technically as well as professionally."

// "The codebase is a mess and nobody cares"
// → "I want to work somewhere where engineering quality is
//    treated as a first-class concern — code review culture,
//    proper testing, architectural decisions that are made
//    deliberately rather than reactively."

// "I'm bored / no challenging work"
// → "I've hit a ceiling in terms of the complexity of problems
//    I'm solving. I'm looking for work that pushes me harder."

// "I'm underpaid"
// → Don't say this in the HR round. It comes out in negotiation.
//    Acceptable: "Compensation is part of my decision, and I want
//    to make sure there's alignment there — but growth and the
//    quality of the work are the primary drivers."

// "I don't get along with the team"
// → This one is hardest. The safest answer is to focus on the
//    kind of team culture you're looking for:
//    "I work best in environments where there's a strong culture
//    of feedback and collaboration — I've realised that matters
//    more to me than I initially thought."

// ── The structure: 1 part past, 3 parts future ──
// "At my current company I've [one honest line about the limit].
//  What I'm really looking for in my next role is [specific thing
//  this company actually offers]. That's why this role caught my
//  attention — [specific detail about this company]."

// The specific detail matters. Generic answers ("I want to grow")
// sound like you applied everywhere. Specific answers ("I read your
// engineering blog post on your sharding approach — that's exactly
// the scale of problem I want to be working on") sound like you
// chose them deliberately.`
    },

    // ── Behavioural / STAR ──
    {
      speaker: "you",
      text: `"Behavioural questions trip me up the most. 'Tell me about a time you disagreed with a technical decision.' 'Tell me about a time you failed.' I never know how much detail to give or how to structure it."`
    },
    {
      speaker: "raj",
      text: `"STAR — Situation, Task, Action, Result. You probably know the acronym. Most people use it wrong. They spend 80% of the answer on the Situation — all the context and backstory — and rush through the Action and Result. The interviewer doesn't care about the context except as background. They care about what <em>you specifically did</em> and what happened because of it. Flip the ratio: one sentence of Situation, one sentence of Task, most of your time on your specific Actions, then a concrete Result. And the result has to be real — 'it went well' is not a result."`
    },
    {
      speaker: "you",
      text: `"What about 'tell me about a time you failed'? I feel like anything I say makes me look bad."`
    },
    {
      speaker: "raj",
      text: `"That question is specifically designed to see if you have self-awareness. Saying you can't think of a failure is the worst answer — nobody believes it and it signals you don't reflect. The pattern that works: pick a real failure, take genuine ownership of your part in it, explain specifically what you learned, and show that you've applied that learning since. The failure itself is almost irrelevant. They're watching whether you blame others, minimise it, or whether you own it and grew from it. Own it clearly and the question becomes an asset."`
    },
    {
      type: "code",
      text: `// ── Behavioural questions — STAR with the right ratio ──

// ── Example: "Tell me about a time you disagreed with a decision" ──

// ✗ Common mistake — too much Situation, weak Action and Result:
// "So we were building a new feature for our checkout flow and
//  there was a lot of back and forth between the team about whether
//  to use REST or GraphQL and the timeline was tight and the PM
//  kept changing requirements and eventually we decided to go with
//  REST because..."
// → This is rambling. What did YOU do?

// ✓ STAR with the right ratio:
const starExample = {
  Situation:
    "My team decided to use a third-party CMS for a new content feature " +
    "to move faster — one sentence.",

  Task:
    "I was responsible for the integration layer, and I had concerns " +
    "about vendor lock-in and the CMS's API rate limits — one sentence.",

  Action: // THIS is where you spend most of your time
    "I put together a short written proposal — not a Slack message, " +
    "an actual document — laying out the specific risks with data: " +
    "their API allows 1000 requests/hour and our peak traffic would " +
    "hit that in about 4 minutes. I proposed a caching layer as a " +
    "mitigation and offered to prototype it in two days to validate " +
    "the approach. The lead agreed to the prototype. " +
    "I built it, it worked, we shipped with the CMS plus caching.",

  Result:
    "We hit the rate limit in staging exactly as I'd predicted — " +
    "the cache absorbed it. That prototype became our standard " +
    "caching pattern for external APIs on the team.",
};

// What this shows:
// - You raised concerns constructively, not obstructively
// - You came with data and a solution, not just a complaint
// - You were willing to do the work to prove the point
// - Concrete outcome: the pattern is still used

// ── Example: "Tell me about a time you failed" ──
const failureExample = {
  Situation: "I underestimated the complexity of a DB migration on a live system.",
  Task:      "I owned the migration and the deployment plan.",
  Action:
    "I ran it during a 'low traffic' window without a rollback plan, " +
    "assuming it would take 10 minutes. It took 45 minutes and caused " +
    "read timeouts for users in that window. I should have tested the " +
    "migration duration on a production-size dataset first, " +
    "and I should have had a rollback script ready.",
  Result:
    "We had about 20 minutes of degraded service. Since then I've made " +
    "it a personal rule: every migration gets a timed dry-run on a " +
    "prod-size snapshot and a rollback script before it goes near " +
    "production. I've run six migrations since then without incident.",
  // What this shows: specific ownership, specific learning, evidence of change
};

// ── Questions to prepare before any interview ──
const behaviouralBank = [
  "Disagreed with a technical decision — and persuaded someone, or accepted theirs",
  "Handled a production incident under pressure",
  "Took ownership of something that failed",
  "Delivered something complex under a tight deadline",
  "Mentored or helped a less experienced colleague",
  "Had to work with incomplete or changing requirements",
  "Pushed back on scope or timeline with a PM or stakeholder",
  "Made a decision with incomplete information",
];
// Prepare 1-2 stories that can flex to cover multiple questions.
// One good complex project often covers 4-5 different behavioural questions.`
    },

    // ── Weakness question ──
    {
      speaker: "you",
      text: `"'What's your greatest weakness?' — everyone gives a fake answer like 'I work too hard' or 'I'm a perfectionist.' What's the right play?"`
    },
    {
      speaker: "raj",
      text: `"Those answers are so overused that hearing them is actively negative — it signals you're not willing to be honest. A real answer works better than you think, because almost nobody gives one. The structure: name a genuine weakness, show you're aware of its impact, explain what you're actively doing about it. The weakness itself should be real but not a core requirement of the job. Don't say 'I struggle with deadlines' for a role where delivery pressure is constant. Something like communication under pressure, or a tendency to over-engineer, or being slow to delegate — these are credible, self-aware, and not disqualifying."`
    },
    {
      type: "code",
      text: `// ── Weakness question — the honest structure ──

// ✗ Fake answers that damage credibility:
// "I'm a perfectionist" — reads as: unwilling to be honest
// "I work too hard"     — reads as: trying to disguise a strength as a weakness
// "I don't have any major ones"  — reads as: zero self-awareness

// ✓ The structure that works:
// 1. Name a real weakness (that isn't a core job requirement)
// 2. Show you know its impact
// 3. Show what you're actively doing about it

// ── Examples ──

// For someone who tends to over-engineer:
// "I have a tendency to want to build the 'right' solution when
//  sometimes the pragmatic one is what the situation needs.
//  I've shipped things that were more complex than they needed to be.
//  I've been working on this by setting a rule for myself: before
//  I design anything, I ask 'what's the simplest version that solves
//  this problem?' and default to that unless I have a specific reason
//  not to. It's helped — my last two features were noticeably leaner
//  than my usual output."

// For someone who struggles to delegate:
// "I find it hard to hand off work I care about — I'd rather do
//  it myself than risk it not being done the way I'd do it.
//  That's been a problem when I need to focus on higher-priority
//  things. I've been deliberately giving junior teammates ownership
//  of full pieces of work — not just tasks — and focusing my energy
//  on reviewing rather than doing. It's uncomfortable but I can see
//  it's the right habit to build."

// For someone who avoids conflict:
// "I'm conflict-averse by nature — I tend to let things slide
//  rather than raise a concern directly. I've seen it cost me
//  in situations where I should have pushed back sooner.
//  I've been practising being explicit: if I have a concern,
//  I write it down and raise it in the relevant forum rather
//  than waiting to see if it resolves itself."

// ── The tell: specificity ──
// A real weakness has a real example attached.
// A real mitigation has a real behaviour change attached.
// If you can't name the specific situation where it hurt you,
// the weakness isn't real enough to be credible.`
    },

    // ── Where do you see yourself ──
    {
      speaker: "you",
      text: `"'Where do you see yourself in five years?' I genuinely don't know. I don't have a five year plan."`
    },
    {
      speaker: "raj",
      text: `"Most people don't, and that's fine. The question isn't really about five years — it's checking two things: are you ambitious enough to be worth investing in, and are you going to stay long enough for that investment to pay off? You don't need a specific job title. You need to show direction. The answer structure: what you want to be better at, the kind of problems you want to be solving, and why this role is a step in that direction. That's more compelling than a fictional org chart position."`
    },
    {
      type: "code",
      text: `// ── Where do you see yourself — direction over destination ──

// ✗ Answers that raise flags:
// "I'd like to be in your position" — sounds like you want their job
// "I'm not sure, I take things one day at a time" — no ambition signal
// "Hopefully still here, growing with the company" — safe but hollow
// "I want to start my own company" — they'll wonder why they're hiring you

// ✓ The direction-based answer:

// "In five years I want to be the kind of engineer who can look at
//  a complex distributed system problem and lead the solution end to
//  end — from the architecture decision down to the operational
//  runbook. Right now I'm strong on the implementation side but I
//  want more experience owning the design decisions and the
//  cross-team coordination that comes with larger-scale systems.
//  This role is the right step for that — the scale you're working
//  at and the team structure here would push me into exactly those
//  problems."

// Why this works:
// - Shows ambition (wants to own bigger problems)
// - Shows self-awareness (knows where the gap is)
// - Connects to THIS role specifically (not generic)
// - Doesn't claim a specific title (doesn't box you in)

// ── If you genuinely want to move into management eventually ──
// "I'm open to a technical leadership or engineering management
//  path down the line, but right now I want to go deeper as an
//  individual contributor and really sharpen the technical
//  foundation first. I think the best engineering managers are
//  people who were strong engineers — so that's the priority."
// → Shows range without spooking a hiring manager who wants an IC`
    },

    // ── Questions to ask ──
    {
      speaker: "you",
      text: `"At the end they always ask 'do you have any questions for us?' I usually just ask about the tech stack because I don't know what else to say."`
    },
    {
      speaker: "raj",
      text: `"That question is another gift. It's your chance to interview them and to signal what you care about. Asking only about tech stack signals you care about tools more than the job itself. The questions that reveal genuine seniority: how does engineering quality get maintained under deadline pressure? What's the on-call rotation like and how are incidents handled? How does a feature go from idea to production — who's involved and where does engineering input happen? What's the biggest unsolved technical challenge right now? Those questions tell you whether this is a place you actually want to work, and they show the interviewer you're thinking seriously about the role."`
    },
    {
      type: "code",
      text: `// ── Questions to ask — what they signal ──

// ── Engineering quality and process ──
"When a deadline clashes with doing something properly —
 how does the team navigate that?"
// Signals: you care about quality, want to understand how they handle pressure

"What does a code review look like here?
 Who reviews, what are you typically looking for?"
// Signals: you take craft seriously

"How does technical debt get managed?
 Is there dedicated time for it or does it get worked in?"
// Signals: you're thinking long-term, not just about shipping features

// ── Team and culture ──
"What does the on-call rotation look like?
 How many incidents per month roughly?"
// Signals: you're practical, want to understand the operational reality

"How do engineers and product managers collaborate on scoping?
 Does engineering have input before requirements are finalised?"
// Signals: you want to be more than an executor

"What's something the team does well that you'd want to protect?
 And what's something you're actively trying to improve?"
// This is a great question — honest managers give honest answers
// and it gives you real signal about the culture

// ── Growth and learning ──
"What's the biggest technical challenge the team is facing
 in the next six months?"
// Signals: you want to understand what you're walking into
// Also: their answer tells you a lot about whether it's a place you'll grow

"How do engineers on the team grow?
 Is there formal mentorship, conference budget, internal tech talks?"
// Signals: you care about development, not just salary

// ── Questions to avoid ──
// "How much holiday do I get?" — save this for offer stage
// "Can I work remotely?" — ask recruiter, not hiring manager
// "What's the salary range?" — fine to ask recruiter, odd with the manager
// "What exactly does your company do?" — do your research first`
    },

    // ── Managerial round ──
    {
      speaker: "you",
      text: `"The engineering manager round feels different from HR. What are they specifically assessing that HR isn't?"`
    },
    {
      speaker: "raj",
      text: `"HR is checking culture fit and communication. The EM is checking whether they can manage you and whether you'll make their team better. They're asking themselves: will this person need a lot of hand-holding or can they operate independently? Will they be a positive force on the team dynamic? When they disagree with something, will they be constructive or difficult? And critically — will they grow, or will I have this same conversation with them in two years? They're hiring someone they'll be responsible for. That's a different kind of assessment."`
    },
    {
      speaker: "you",
      text: `"What questions do EMs typically ask that HR doesn't?"`
    },
    {
      speaker: "raj",
      text: `"More scenario-based and more specific. 'How do you handle a situation where you think the technical approach is wrong but the decision's been made?' 'What does your ideal working relationship with a manager look like?' 'How do you manage your own workload when you have competing priorities?' 'Tell me about a time you had to give difficult feedback to a peer.' They're building a model of what it's like to work with you day to day. Answer those with the same specificity as behavioural questions — real situations, real actions, real outcomes."`
    },
    {
      type: "code",
      text: `// ── Engineering Manager round — what they're assessing ──

// ── Question: "How do you handle competing priorities?" ──
// They're checking: do you ask for help or silently drown?
// Good answer structure:
// "I try to make the tradeoff visible rather than invisible.
//  If I have two things that both seem urgent I'll go to my manager
//  with a specific question — 'I have X and Y both marked priority,
//  and I can't do both well this week — which one matters more right now?'
//  I'd rather surface the conflict early than deliver both things late
//  or do one of them poorly."

// ── Question: "What do you need from a manager to do your best work?" ──
// They're checking: are you self-aware about how you work?
// ✗ "I just need to be left alone" — sounds unmanageable
// ✗ "I'm flexible, whatever works for you" — sounds like no self-knowledge
// ✓ Be specific:
// "I do best with clear context on why a piece of work matters —
//  not just the what, but the why and the constraints. I don't need
//  a lot of day-to-day check-ins once I understand the goal, but I
//  find it helpful to have a regular 1-on-1 where I can flag blockers
//  or concerns before they become problems."

// ── Question: "Where do you see room for growth in yourself?" ──
// Same as weakness question but from a management angle.
// They want to know: is this person coachable?
// ✓ "I want to get better at communicating technical risk to
//    non-technical stakeholders. I tend to explain things at the
//    wrong level — too technical for a PM, not enough context for
//    a business stakeholder. I've been working on this by asking
//    for feedback after presentations and adjusting."

// ── What signals you're coachable ──
// - You give specific examples of feedback you've received and acted on
// - You don't get defensive when the interviewer probes deeper
// - You frame learning as ongoing, not completed
// - You ask questions in return: "Is that something that comes up
//   often in this role? What does the team typically find hardest?"

// ── Red flags they're watching for ──
// - Blaming others in stories about failure
// - Vague answers when specifics are needed
// - No questions about the role or team
// - Inconsistency between what you say you want and the role you applied for`
    },

    // ── Salary negotiation intro ──
    {
      speaker: "you",
      text: `"Salary negotiation is the part I find most uncomfortable. I never know if I should give a number first or wait, and I'm scared of asking for too much or too little."`
    },
    {
      speaker: "raj",
      text: `"The discomfort is normal. The mistake is letting that discomfort make you passive — accepting the first number because negotiating feels rude. Negotiation is expected. Recruiters build in room for it. The first offer is almost never the best offer. And the framing matters: you're not asking for a favour, you're completing a professional transaction where both sides have information the other wants."`
    },
    {
      speaker: "you",
      text: `"Should I give a number first or make them go first?"`
    },
    {
      speaker: "raj",
      text: `"Make them go first if you can. Once you give a number you've anchored the conversation — if you went too low you've capped yourself. If they ask for your number before giving theirs, try to deflect once: 'I'd love to understand the full package before I give a number — what's the range for this role?' Most recruiters will give you a range. If they press again, give a researched range, not a point number — it keeps room to negotiate. Never give a number that's your actual minimum. Give a number that's your target."`
    },
    {
      type: "code",
      text: `// ── Salary negotiation — the mechanics ──

// ── Step 1: Research your market rate BEFORE any conversation ──
// Sources: Glassdoor, Levels.fyi (for tech), LinkedIn Salary,
//          Blind (anonymous), asking peers in similar roles
// Factors: role level, company size, location/remote, total comp (not just base)
// Know your number before you're on a call — emotions are bad at maths

// ── Step 2: Deflect the "what are you looking for?" question ──
// First attempt:
// "I'd love to understand the full package and level first —
//  what's the budgeted range for this role?"

// If they press:
// "Based on my research and experience level I'm targeting
//  somewhere in the [X–Y] range, but I'm open to discussing
//  the full package — base, equity, and benefits."

// ✗ Never say: "I'm currently on £X so I'm looking for a bit more"
//   → Anchors to your current salary, not your market value
//   → Some places now ask this legally — in those cases be honest,
//     but follow it immediately with "based on market research
//     I'm targeting X"

// ── Step 3: When they make an offer ──
// DO NOT accept or reject on the call. Always:
// "Thank you — I'm really excited about the role. Can I have
//  a day or two to look over the full package?"
// This is always acceptable and buys you time to think.

// ── Step 4: Counter ──
// Counter once, specifically, with a reason:
// "I've looked over the offer and I'm genuinely excited.
//  The base is below what I was targeting based on my research
//  for this level in this market. Would it be possible to get
//  to [specific number]?"

// You don't need an elaborate justification. Short is better.
// They know what market rate is. You're just signalling you do too.

// ── What's negotiable beyond base salary ──
const negotiableItems = [
  "Signing bonus       — often easier to flex than base (one-time cost)",
  "Equity / RSUs       — vesting schedule, cliff, amount",
  "Remote flexibility  — days in office, async expectations",
  "Start date          — a few extra weeks to finish projects cleanly",
  "Title / level       — affects future comp and exits",
  "Learning budget     — courses, conferences, books",
  "Equipment           — home office setup",
];
// If they won't move on base, ask about signing bonus or equity.
// Companies often have more flex there.

// ── If they say the offer is firm ──
// "I appreciate you checking. Can I ask — is there flexibility
//  on the signing bonus, or on the equity component?"
// → Most people stop at base. Going to other components often works.`
    },

    // ── Negotiation conversation ──
    {
      speaker: "you",
      text: `"What do I actually say when I counter? I'm worried about sounding greedy or damaging the relationship before I've even started."`
    },
    {
      speaker: "raj",
      text: `"The relationship is not at risk. Recruiters negotiate every day — it's their job. What damages a relationship is being aggressive or giving ultimatums. What's perfectly fine is being direct and specific. The counter should have three things: genuine enthusiasm for the role so they know you want this, the specific number you're asking for, and a one-line reason. Not a negotiating tactic — a real reason. 'Based on my research this is below market for this level' is a real reason. 'I have a competing offer' is a real reason if it's true. 'I just want more money' is also true but say it as market rate instead."`
    },
    {
      speaker: "you",
      text: `"What if I have a competing offer? Should I use it as leverage?"`
    },
    {
      speaker: "raj",
      text: `"Only if it's real and you'd genuinely consider taking it. Using a fictional competing offer is a bad idea — if they call your bluff and you fold, you've lost credibility before you've started. If the competing offer is real, you can absolutely mention it — not as a threat, but as honest context. 'I want to be transparent — I have another offer at X and I'd prefer to be here, but I need to make sure there's alignment on compensation.' That's professional. That's not an ultimatum — it's information."`
    },
    {
      type: "code",
      text: `// ── The counter conversation — word for word ──

// ── Scenario: offer came in at £70k, you want £80k ──

// Opening — enthusiasm first, counter second:
// "Thank you so much for the offer — I'm genuinely excited
//  about the role and the team. I've looked over everything
//  and the base salary is a bit lower than I was expecting
//  based on my research. Would you be able to get to £78–80k?"

// ── If they come back with £75k ──
// Option A — accept if it's acceptable:
// "That works for me. I'm happy to move forward."
// (Don't negotiate past a reasonable yes. They'll remember it.)

// Option B — ask about signing bonus:
// "I appreciate you going back to check. If base is the ceiling,
//  would there be flexibility on a signing bonus to bridge the gap?"

// ── Scenario: competing offer ──
// "I want to be transparent with you — I have an offer from
//  [Company] at £82k. I genuinely prefer this role for [specific
//  reason], but I need to make sure the compensation is in the
//  right range. Is there room to get closer to that number?"

// ── After accepting — confirm in writing ──
// Always get the offer letter before giving notice at your current job.
// Verbal offers have been rescinded. Get it in writing.
// "Great — I'm excited to officially accept. Could you send
//  over the offer letter so I can sign and return it?"

// ── What not to do ──
const negotiationMistakes = [
  "Accepting on the call before you've had time to think",
  "Apologising for countering ('Sorry to ask but...')",
  "Giving a very wide range ('between £60k and £90k')",
  "Negotiating against yourself ('I know it's a lot to ask but...')",
  "Threatening to walk over small amounts when you wouldn't",
  "Negotiating over text/email when a short call is faster",
  "Forgetting to negotiate total comp, not just base",
  "Giving notice before you have a signed offer letter",
];`
    },

    // ── When to walk away ──
    {
      speaker: "you",
      text: `"How do I know when the offer just isn't good enough and I should walk away?"`
    },
    {
      speaker: "raj",
      text: `"Know your walk-away number before the conversation starts — not during it. When you're in the middle of a negotiation and excited about a role, you'll rationalise accepting almost anything. Set a number in advance: below X, you won't take the role regardless of how much you want it. Not because of pride, but because resentment about compensation is one of the most reliable predictors of leaving early. An engineer who's underpaid knows it, and that knowledge erodes motivation in ways that are hard to recover from."`
    },
    {
      speaker: "you",
      text: `"How do I decline without burning the bridge?"`
    },
    {
      speaker: "raj",
      text: `"Short, warm, and unambiguous. Don't leave it open-ended if you've decided — it wastes their time and yours. Thank them specifically, be honest that it came down to compensation, and leave the door open. Industries are smaller than they seem. The recruiter who made you an offer today might be at a company you want to join in three years."`
    },
    {
      type: "code",
      text: `// ── Declining an offer — professionally ──

// ── If compensation is the reason ──
// "Thank you so much for the offer and for the time you and
//  the team spent with me throughout the process. After careful
//  consideration, I've decided not to move forward — the
//  compensation isn't quite where I need it to be at this stage.
//  I have a lot of respect for the team and the work you're doing,
//  and I hope our paths cross again."

// ── If you accepted another offer ──
// "I wanted to let you know that I've accepted another offer.
//  It was a genuinely difficult decision — I have a lot of respect
//  for your team and the role. Thank you for the time and
//  consideration. I hope we can stay in touch."

// ── What not to do ──
// ✗ Ghost them after the final round — word travels
// ✗ Give vague reasons ("something came up") — unnecessary and they know
// ✗ Explain at length — short is kinder for everyone
// ✗ Ask them to match after you've accepted elsewhere — don't

// ── Knowing your walk-away number ──
const offerDecisionFramework = {
  // Set these BEFORE you start interviewing, not during negotiation
  minimumBase:         70000,   // below this, I won't accept
  targetBase:          80000,   // what I'm aiming for
  dealBreakers: [
    "No remote flexibility when the job listing said remote-friendly",
    "Equity cliff longer than 1 year",
    "On-call rotation with no compensation",
    "Forced return to office within 6 months",
  ],
  niceToHave: [
    "Learning budget",
    "Flexible hours",
    "Strong 1-on-1 culture",
  ],
  // Having these written down means you evaluate the offer, not just your feelings
};`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Go back to where you started. 'The technical is the hard part, the HR round is a formality.' Where does that get you?"`
    },
    {
      speaker: "you",
      text: `"Unprepared for a round that can end the process. And leaving money on the table at the offer stage because I don't know how to negotiate."`
    },
    {
      speaker: "raj",
      text: `"The technical round proves you can do the job. The HR round decides whether they want you specifically. Salary negotiation determines the terms you'll live with for the next two or three years. None of those are formalities."`
    },

    {
      type: "summary",
      points: [
        "HR interviews test three things: can you communicate clearly, do you have self-awareness, and are you a flight risk. Every question maps to one of those three. Knowing this makes every question answerable.",
        "'Tell me about yourself' is a gift — control the narrative. Three parts: where you've been (1 sentence), what you've built that's relevant (2–3 sentences), why this role now (1–2 sentences). Under two minutes. End with purpose.",
        "'Why are you leaving?' — frame as moving towards, not running from. One sentence on the genuine limit, then pivot to what you're looking for. Never name individuals or sound bitter. Specific detail about this company signals deliberate choice.",
        "Behavioural questions follow STAR — but flip the ratio. Most of your answer goes on the Action (what you specifically did), not the Situation. Results must be concrete. For failure questions: own it clearly, name what you learned, show you've applied it since.",
        "Weakness questions reward honesty over performance. Pick a real weakness that isn't a core job requirement. Show you know its impact. Show what you're actively doing about it. Specificity makes it credible.",
        "'Where do you see yourself in 5 years?' — answer with direction, not destination. What do you want to be better at, what problems do you want to solve, and why is this role a step towards that. Connect it specifically to the role.",
        "Questions to ask the interviewer signal what you value. Ask about engineering quality under pressure, incident handling, product-engineering collaboration, and the biggest unsolved technical challenge. These also tell you whether the job is actually right for you.",
        "Engineering manager rounds assess whether you're coachable, whether you can operate independently, and whether you'll make the team better. Be specific about how you handle competing priorities, what you need from a manager, and where you're growing.",
        "Salary negotiation: research your market rate before any conversation. Try to make them give a number first. Counter once, specifically, with a short reason. Don't apologise for negotiating. If they won't move on base, ask about signing bonus or equity.",
        "Know your walk-away number before the negotiation starts — not during it. When you're excited and in the moment you'll rationalise anything. Set the minimum in advance and stick to it.",
        "Declining an offer: short, warm, and unambiguous. Thank them specifically, be honest it came down to compensation or another offer, and leave the door open. Industries are smaller than they look."
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────
//  LESSON: Versioning & Deployment Scenarios
//  Category: Engineering Practices & Team Workflows
// ─────────────────────────────────────────────────────────────────

const LESSON_VERSIONING_DEPLOYMENT = {
  category: "Architecture & System Design",
  tag: "Versioning & Deployment",
  title: "Shipping Without Breaking Each Other",
  intro: "You've been committing straight to main. It works fine — you're the only one. Then you join a team. There are six branches open, two haven't been touched in two weeks, someone just force-pushed to a shared branch and broke Chen's local environment, and there's a thread in Slack about whether it's safe to deploy today. Raj is looking at the git log like he's reading a crime scene.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"Okay, so — branches. I get the concept. You branch, you do your work, you merge back. What's actually hard about that?"`
    },
    {
      speaker: "raj",
      text: `"How long was your last branch open?"`
    },
    {
      speaker: "you",
      text: `"Like a week? Ten days maybe. Big refactor."`
    },
    {
      speaker: "raj",
      text: `"And the merge?"`
    },
    {
      speaker: "you",
      text: `"Nightmare. Conflicts everywhere. Took half a day."`
    },
    {
      speaker: "raj",
      text: `"That half-day isn't bad luck. Every day your branch is open, main is moving. By day ten you're not merging your work into main — you're untangling two separate histories that have been drifting apart for a week and a half. The problem isn't that you branched. It's how long you stayed away."`
    },

    // ── Branching strategies ──
    {
      speaker: "you",
      text: `"So what's the right way to do it? I've heard people talk about Gitflow, trunk-based — they sound completely different."`
    },
    {
      speaker: "raj",
      text: `"They are. What does your team's release schedule look like?"`
    },
    {
      speaker: "you",
      text: `"We ship... when things are ready? There's no fixed cadence."`
    },
    {
      speaker: "raj",
      text: `"Then Gitflow will frustrate you. It was designed for teams with a schedule — a release goes out every two weeks, you cut a release branch, stabilise it, merge to main. Structured, predictable. But if you're deploying whenever something's ready, you have five branch types and a merge ceremony every time you want to ship. Trunk-based is the other end: short-lived feature branches, one to three days max, merge directly to main, main is always deployable. The discipline moves out of branch management and into the code itself."`
    },
    {
      type: "analogy",
      text: "Gitflow is a film production schedule. Shoot, edit, final cut, release — each stage gates the next. Trunk-based is a live news broadcast. The feed is always on. You push an update, it goes out. A documentary crew doesn't benefit from treating every clip as a live segment. A breaking news team can't wait three weeks to correct a chyron. Neither model is wrong — they suit different realities."
    },
    {
      type: "code",
      text: `// ── Gitflow: scheduled releases ──
//
// main ─────────────────────────────────────────────► (production)
//   └── develop ──────────────────────────────────►
//         ├── feature/user-auth ──► merge to develop
//         ├── feature/checkout  ──► merge to develop
//         └── release/v2.3.0 ──────────────────────► merge to main + tag v2.3.0
//               └── hotfix/payment-bug ──────────────► merge to main AND develop
//
// Good for: versioned software, mobile apps, libraries with scheduled release cycles
// Cost:     5 branch types, long-lived develop, merge ceremonies on every release

// ── Trunk-based development: continuous deployment ──
//
// main ─────────────────────────────────────────────► (always deployable)
//   ├── feat/user-auth  (1-2 days) ──► PR ──► merge ──► auto-deploy
//   ├── feat/checkout   (1-3 days) ──► PR ──► merge ──► auto-deploy
//   └── fix/email-typo  (hours)    ──► PR ──► merge ──► auto-deploy
//
// Good for: SaaS, continuous deployment, teams shipping daily
// Cost:     requires feature flags for incomplete work, fast CI is mandatory

// ── The rule that applies to both ──
// Feature branches live for days, not weeks.
// A branch open for more than a week is a signal:
//   - the task is too large (break it down)
//   - you're blocked on a dependency (unblock it or work around it)
//   - the branch is abandoned (close it or explicitly park it)
// Merge debt compounds daily. It doesn't wait for you to be ready.`
    },

    // ── Merge conflicts and rebasing ──
    {
      speaker: "you",
      text: `"What about when someone else changes the same file you're working on? That just seems unavoidable on a big team."`
    },
    {
      speaker: "raj",
      text: `"It is unavoidable. The question is when you find out. After ten days: you're resolving conflicts across hundreds of lines of drift. After one day: you're resolving one conflict in a file you both just touched. Rebase onto main frequently — at least once a day while your branch is open. You pull the latest main into your branch, replay your commits on top of it. Conflicts appear immediately, while the context of both changes is still fresh."`
    },
    {
      speaker: "you",
      text: `"Rebase feels dangerous. I've heard you can lose work."`
    },
    {
      speaker: "raj",
      text: `"Rebasing your own local branch onto main is safe — you're replaying commits you wrote. The dangerous rebase is rewriting history that others have already based work on. The rule: never rebase a branch other people are working on. Rebase your private branch onto shared branches — never the reverse."`
    },
    {
      speaker: "you",
      text: `"And if there's a conflict mid-rebase?"`
    },
    {
      speaker: "raj",
      text: `"Git pauses at each conflicting commit. You see both sides, you resolve, you continue. The important thing: read both sides before you pick one. Most conflicts aren't one right answer and one wrong answer — they're two correct changes that need to coexist. If you're not sure what the other change was trying to do, look at the commit message or ask."`
    },
    {
      type: "code",
      text: `// ── Keeping your branch current with main ──

// Daily habit while your branch is open:
git fetch origin
git rebase origin/main
// Git replays your commits one by one on top of the latest main.
// If it finds a conflict, it pauses:
//   CONFLICT (content): Merge conflict in src/payments/charge.js
//   error: could not apply a1b2c3... feat(checkout): add price snapshot
// Fix the conflict in the file, then:
git add src/payments/charge.js
git rebase --continue
// If you've made a mess and want to start over:
git rebase --abort

// ── Reading a conflict ──
// <<<<<<< HEAD (what's now on origin/main)
// const timeout = options.timeout || 3000;
// =======
// const timeout = requestTimeout ?? 5000;
// >>>>>>> a1b2c3 (your commit)
//
// Main added options.timeout for external configurability.
// Your branch added nullish coalescing and a different default.
// Neither is wrong. The correct resolution combines the intent:
// const timeout = options.timeout ?? requestTimeout ?? 5000;

// ── Who owns conflict resolution ──
// The person whose branch has the conflict.
// Chen's branch conflicts with your recent merge to main → Chen resolves it.
// It's Chen's branch; Chen knows what Chen was trying to do.
// You can explain what your change did. The resolution is Chen's call.

// ── When two people share a branch ──
// One person rebases and force-pushes to the shared branch.
// The other must reset their local immediately:
git fetch origin
git reset --hard origin/feature/shared-branch
// This is why force-pushing to shared branches is dangerous.
// Communicate before you do it. Always.`
    },

    // ── Commit discipline ──
    {
      speaker: "you",
      text: `"Commits — I just write something when I save meaningful work. Sometimes it's 'wip', sometimes it's descriptive. Is there actually a standard?"`
    },
    {
      speaker: "raj",
      text: `"What does 'wip' tell the person reading git blame in six months?"`
    },
    {
      speaker: "you",
      text: `"...nothing."`
    },
    {
      speaker: "raj",
      text: `"Commits are documentation. The diff shows what changed. The message has to explain why — why this approach, what breaks if you revert it, what you considered and rejected. That context doesn't live anywhere else. Most teams settle on Conventional Commits: a type prefix, a scope, a subject. <em>feat(auth): add refresh token rotation</em>. The type is machine-readable — tools use it to automatically bump version numbers and write changelogs. The body is where the why lives."`
    },
    {
      speaker: "you",
      text: `"I do commit messily while I'm working — that's just how I think through a problem."`
    },
    {
      speaker: "raj",
      text: `"Fine. That's what interactive rebase is for. Clean it up before the PR. Squash the noise, reword the survivors, so the history tells a coherent story — not a recording of your debugging session."`
    },
    {
      type: "code",
      text: `// ── Conventional Commits ──
// <type>(<scope>): <subject>
//
// [optional body — the WHY]
//
// [optional footer — issue refs, BREAKING CHANGE notice]

// ── Types ──
// feat:     new feature           → triggers MINOR version bump
// fix:      bug fix               → triggers PATCH version bump
// chore:    tooling, deps, config → no version bump
// refactor: restructure without behaviour change
// docs:     documentation only
// test:     adding or fixing tests
// perf:     performance improvement
// ci:       pipeline changes
// BREAKING CHANGE: in footer, or ! after type → triggers MAJOR bump

// ── Bad — noise in the history ──
// "wip"
// "fix"
// "trying something"
// "fix for real this time"
// "asdfgh"

// ── Good — documentation ──
// feat(checkout): snapshot product price at cart creation
//
// Previously, Order Service fetched live price at checkout.
// If a price changed between cart and purchase, users were charged
// the new price without warning. Price is now captured when the item
// is added to cart and stored in cart_items.snapshot_price.
//
// Closes #412

// fix(auth): prevent session fixation on login
//
// Session ID was not rotated after successful authentication.
// An attacker who obtained a pre-auth session ID could hijack the
// authenticated session. Regenerate session on every successful login.
// Closes #389.

// ── Cleaning up before the PR ──
git rebase -i origin/main
//
// pick a1b2c3 feat(auth): scaffold refresh token endpoint
// squash d4e5f6 wip
// squash g7h8i9 fix tests
// reword j0k1l2 add token rotation logic
//
// The reviewer sees two clean commits that explain the work.
// The wip and fix-tests noise is gone from the permanent history.`
    },

    // ── Pull requests ──
    {
      speaker: "you",
      text: `"PRs — I open one when I'm done, link the ticket, ask for a review. What else is there?"`
    },
    {
      speaker: "raj",
      text: `"How big are your PRs?"`
    },
    {
      speaker: "you",
      text: `"Depends on the feature. Sometimes ten files, sometimes forty."`
    },
    {
      speaker: "raj",
      text: `"The forty-file PR is the problem. Below two hundred lines, reviewers catch real bugs. Above four hundred, they rubber-stamp. The cognitive load of holding a large change in your head is too high — you get LGTM on a PR that introduces a security hole because nobody could read the whole thing without losing the thread. Small PRs aren't a courtesy. They're how you actually get useful review."`
    },
    {
      speaker: "you",
      text: `"But some features are just big. I can't ship half an auth system."`
    },
    {
      speaker: "raj",
      text: `"You can ship the migration. Then the model. Then the API. Then the UI. Each behind a flag so nothing is exposed until the whole thing is ready. Five PRs of forty lines each, each reviewed properly. The flag comes down when the stack is done."`
    },
    {
      speaker: "you",
      text: `"What should the description actually say?"`
    },
    {
      speaker: "raj",
      text: `"Answer the questions the reviewer will have before they ask them. What changed. Why. Non-obvious decisions. How you tested it. What breaks if this goes wrong. A PR that answers those gets reviewed in twenty minutes. One that doesn't generates a clarification thread that takes two days."`
    },
    {
      type: "code",
      text: `// ── PR template: .github/pull_request_template.md ──
\`
## What
<!-- One paragraph. What does this change do? -->

## Why
<!-- What problem does this solve? Link to the ticket. -->

## How
<!-- Non-obvious decisions. Why this approach over alternatives? -->

## Testing
<!-- How was this tested? What should reviewers focus on? -->

## Risks / Rollback
<!-- What could this break? Is there a migration? How do you roll back? -->

## Screenshots (if UI change)
\`

// ── Stacking PRs for a large feature: OAuth login ──

// PR 1: database migration (~40 lines)
// Adds users.oauth_provider, users.oauth_id — nullable, no constraints yet
// Merges to main. Deploys. No user-facing change.

// PR 2: token exchange logic (~80 lines)
// lib/oauth.js — exchange code for tokens, fetch user profile from provider
// Unit tested in isolation. No routes yet.

// PR 3: API endpoints, behind flag (~90 lines)
// GET /auth/google, GET /auth/google/callback
// if (!flags.ENABLE_OAUTH) return res.status(404).end()
// Flag is off in all environments.

// PR 4: UI — "Sign in with Google" button (~50 lines)
// Doesn't render unless flag is on. Tested with flag manually toggled.

// PR 5: enable flag + cleanup (~20 lines)
// ENABLE_OAUTH=true in staging first. Monitor. Then production.
// Remove flag guard after two weeks of stable operation.

// Five reviewable PRs. Zero 400-line PRs. One complete feature.
// Any PR in the stack can be reverted independently if something breaks.`
    },

    // ── Branch protection ──
    {
      speaker: "you",
      text: `"What stops someone from just pushing straight to main and skipping all of this? It happened yesterday."`
    },
    {
      speaker: "raj",
      text: `"Nothing, if you haven't turned on branch protection. A team agreement to follow process isn't enforcement — it's trust, and trust breaks under deadline pressure. Branch protection makes the process structural."`
    },
    {
      speaker: "you",
      text: `"What does it actually lock down?"`
    },
    {
      speaker: "raj",
      text: `"At minimum: require a PR before merging, require CI to pass, require at least one approver. Once those are on, you can't push to main without a passing pipeline and a human sign-off. No exceptions for admins — admins especially. That's where accidental force-pushes come from."`
    },
    {
      type: "code",
      text: `// ── GitHub branch protection rules ──
// Settings → Branches → Add rule → Branch name pattern: main

// ── Minimum for any team ──
// ✓ Require a pull request before merging
//     Require approvals: 1 (2 for security/payments/auth paths)
//     Dismiss stale approvals when new commits are pushed
//       → an approval on an old version doesn't carry to a new commit
// ✓ Require status checks to pass before merging
//     Add: lint, test, build — all CI jobs that must be green
//     ✓ Require branches to be up to date before merging
//       → can't land a branch that's behind main
// ✓ Do not allow bypassing the above settings
//     → includes admins. Especially includes admins.

// ── Status checks to require ──
// lint          → zero lint errors, zero type errors
// test          → unit + integration pass, coverage threshold met
// build         → app builds cleanly
// security-scan → no new high/critical CVEs (Snyk, Dependabot)
// secrets-scan  → no credentials in the diff (truffleHog, git-secrets)
//
// If any check is red, the Merge button is greyed out.
// "It's urgent" is not a bypass. Fix the check or revert what broke it.

// ── Additional for critical branches ──
// ✓ Require conversation resolution before merging
//     → PR comments must be resolved, nothing silently ignored
// ✓ Restrict pushes to matching branches
//     → only the CI service account can push to main directly
//       (all human changes must go through a PR — no exceptions)
// ✓ Require signed commits
//     → every commit is cryptographically attributed to a verified author`
    },

    // ── Merge strategies ──
    {
      speaker: "you",
      text: `"When I merge a PR, GitHub gives three options — merge commit, squash, rebase. I've been picking squash. Is that right?"`
    },
    {
      speaker: "raj",
      text: `"For most feature work, yes. Squash collapses everything into one commit on main. Linear history, easy to revert the whole thing, branch noise is gone. Cost: if your branch had five meaningful commits telling a story, that story is gone. It's one commit now."`
    },
    {
      speaker: "you",
      text: `"When would I want to keep it?"`
    },
    {
      speaker: "raj",
      text: `"When the commits on the branch are themselves worth preserving — a refactor in four distinct logical stages, say. Rebase and merge replays each commit individually on top of main. Linear history, full granularity. It requires clean commits on the branch though. Merge commit almost never — it creates a non-linear history with merge nodes everywhere, and git bisect becomes archaeology."`
    },
    {
      speaker: "you",
      text: `"What's git bisect?"`
    },
    {
      speaker: "raj",
      text: `"Binary search through commit history to find which commit introduced a bug. You tell it a good commit and a bad commit, it checks out the midpoint, you run your test, you say good or bad, it halves the range. In a linear history it converges in seven or eight steps out of thousands. In a merge-commit history with hundreds of merge nodes it slows down badly. It matters when you're chasing a regression and the usual suspects aren't obvious."`
    },
    {
      type: "code",
      text: `// ── Three merge strategies ──

// SQUASH AND MERGE (recommended for most feature work)
// Before:  main ── A ── B
//          feature ──────── x ── y ── z  (however messy)
// After:   main ── A ── B ── [xyz]       (one commit, message = PR title)
//
// Pros: linear history, one commit to revert, branch noise gone
// Cons: individual commit story is lost
// Revert the whole PR: git revert abc123

// REBASE AND MERGE (when branch commits are clean and worth preserving)
// Before:  main ── A ── B
//          feature ──────── x ── y ── z  (clean, meaningful)
// After:   main ── A ── B ── x' ── y' ── z'
//
// Pros: linear history AND granular commits preserved
// Cons: requires well-structured commits — no wip/fix noise
// Revert: git revert HEAD~3..HEAD (reverse order)

// MERGE COMMIT (rarely correct outside Gitflow release merges)
// Before:  main ── A ── B
//          feature ──────── x ── y ── z
// After:   main ── A ── B ──────────────── M
//                          └── x ── y ── z ┘
//
// Pros: preserves branch topology, revert is git revert -m 1 M
// Cons: non-linear history, git log is a river delta, bisect slows down
// Use for: Gitflow merge of release/hotfix branches into main

// ── Enforce one strategy in repo settings ──
// GitHub: Settings → General → Pull Requests
// Allow only the strategy your team agreed on.
// Inconsistent strategy = inconsistent history = harder to debug everything.`
    },

    // ── Semantic versioning ──
    {
      speaker: "you",
      text: `"Version numbers — we bump the last number when we ship. I've never thought about it beyond that."`
    },
    {
      speaker: "raj",
      text: `"What does the number communicate to the people using your code?"`
    },
    {
      speaker: "you",
      text: `"That something changed?"`
    },
    {
      speaker: "raj",
      text: `"That's not enough information. Semver makes the number a contract. Three parts: MAJOR.MINOR.PATCH. Patch: you fixed something, nothing broke, safe to update automatically. Minor: you added something new, the old API still works, safe to update. Major: something existing broke — the consumer has to read the changelog and possibly update their code before upgrading. The number tells them what they're walking into."`
    },
    {
      speaker: "you",
      text: `"What actually counts as breaking? I changed a function signature last week and bumped the patch."`
    },
    {
      speaker: "raj",
      text: `"Breaking is anything that causes existing correct usage to fail without the consumer changing their code. Changed a function signature — any caller passing the old arguments is now broken. That's major. Removing a field from a response: major. Renaming a field: major. Changing a response from an array to a paginated object — even if the data is the same — major, because <em>response.forEach</em> now throws. Adding an optional parameter: minor. If you're unsure: can someone update without changing a single line of their code? If no — it's major."`
    },
    {
      type: "code",
      text: `// ── Semantic Versioning: MAJOR.MINOR.PATCH ──

// PATCH: 2.3.4 → 2.3.5
// Bug fixed, no API change
// ✓ Fixed crash when input is null
// ✓ Fixed rounding error in tax calculation
// ✓ Fixed race condition under high concurrency

// MINOR: 2.3.5 → 2.4.0
// New capability, fully backwards compatible
// ✓ Added optional timeout parameter to existing function
// ✓ Added new endpoint: GET /users/:id/preferences
// ✓ Added new field to response (additive, not replacing anything)

// MAJOR: 2.4.0 → 3.0.0
// Something existing broke — consumers need to act before upgrading
// ✓ Removed endpoint or exported function
// ✓ Renamed response field (email → emailAddress)
// ✓ Changed optional parameter to required
// ✓ Changed response shape (array → { data, meta, pagination })
// ✓ Changed authentication scheme

// ── Pre-release labels ──
// 3.0.0-alpha.1  unstable, API may still change
// 3.0.0-beta.2   feature complete, may have bugs
// 3.0.0-rc.1     release candidate, believed stable

// ── Automating with semantic-release ──
// Reads commit types, bumps version, tags the release, generates changelog.
// No human decides the version number. The commits decide.
//
// .releaserc.json:
// {
//   "branches": ["main"],
//   "plugins": [
//     "@semantic-release/commit-analyzer",
//     "@semantic-release/release-notes-generator",
//     "@semantic-release/npm",
//     "@semantic-release/github"
//   ]
// }
//
// fix: merged to main  → 2.4.0 → 2.4.1  (automatic)
// feat: merged to main → 2.4.1 → 2.5.0  (automatic)
// BREAKING CHANGE:     → 2.5.0 → 3.0.0  (automatic)
//
// The git tag is the release. No separate release ceremony.`
    },

    // ── Release notes ──
    {
      speaker: "you",
      text: `"Who actually reads the changelog though? Product and support are always asking what's in a release and I end up writing a separate Slack message explaining it anyway."`
    },
    {
      speaker: "raj",
      text: `"A changelog is for engineers consuming your code. A release note is for everyone else. Different documents, different audiences. The technical changelog writes itself — semantic-release handles it. The human summary is one paragraph, written once when you cut the release. Plain language, what changed from a user perspective, what to watch for. Lives in the GitHub release or your team wiki."`
    },
    {
      speaker: "you",
      text: `"That's two things to maintain."`
    },
    {
      speaker: "raj",
      text: `"One of them is automated. The other is a paragraph. The alternative is support fielding bug reports for a feature that quietly changed because nobody told them."`
    },
    {
      type: "code",
      text: `// ── Two documents, two audiences ──

// ── CHANGELOG.md (technical, auto-generated from commits) ──
// ## [2.5.0] - 2025-04-28
//
// ### Features
// - **checkout**: snapshot product price at cart creation (#412)
// - **auth**: add refresh token rotation (#389)
//
// ### Bug Fixes
// - **payment**: guard against null userId in charge handler (#891)
//
// ### BREAKING CHANGES
// - **api**: GET /orders now returns paginated { data, meta } instead of array.
//   Consumers must update to use response.data. See migration guide.

// ── GitHub Release description (human, written once per release) ──
// ## What's in v2.5.0
//
// **Checkout price lock**
// Prices in your cart are now locked at the time you add an item.
// If a price changes before you complete checkout, you pay what you saw.
//
// **Improved email reliability**
// Confirmation emails that fail to send are now retried automatically.
//
// **⚠ For API integrators: orders endpoint change**
// GET /orders now returns paginated results.
// If you use our API directly, see the migration guide [link].
//
// Rollback: v2.4.1 tag is pinned if needed.

// ── Where release notes live ──
// Internal teams:      GitHub Releases or team wiki "What shipped this week"
// External consumers:  Dedicated changelog page; email for major/breaking changes
// Support team:        #releases Slack channel with a two-line summary on every deploy`
    },

    // ── Environments ──
    {
      speaker: "you",
      text: `"We have local and production. I know there should be something in between — I just haven't set it up because it felt like overhead."`
    },
    {
      speaker: "raj",
      text: `"What's the last bug that made it to production that you wish hadn't?"`
    },
    {
      speaker: "you",
      text: `"A migration that locked a table for ninety seconds. Took the site down."`
    },
    {
      speaker: "raj",
      text: `"Would you have caught it in staging with realistic data volume?"`
    },
    {
      speaker: "you",
      text: `"...yeah, probably."`
    },
    {
      speaker: "raj",
      text: `"That's what environments are. Each one is a gate that catches a different class of bug. Local catches logic errors. A shared dev environment catches integration failures — things that work in isolation but break when they talk to each other. Staging catches infrastructure and data-volume problems — things that only appear against production-shaped reality. The further right a bug gets, the more expensive it is. Every environment between local and prod is a chance to stop it."`
    },
    {
      type: "code",
      text: `// ── Environment progression ──
//
// local → dev → staging → production
//   ↑        ↑         ↑          ↑
//   fast   shared   pre-prod    live
//   dirty  tested   mirror      users

// ── What each environment is and isn't ──

// LOCAL
// Purpose:   fast iteration, your own experiments
// Data:      seeded fake data, docker-compose for dependencies
// Broken:    fine — it's only you
// Config:    .env.local — relaxed settings, dev API keys, verbose logging

// DEVELOPMENT (auto-deploys on every merge to main)
// Purpose:   integration testing, QA review, team demos of in-progress work
// Data:      shared test database, wiped and reseeded on schedule
// Broken:    problematic — other people are using it; fix within the hour
// Config:    Stripe test keys, real auth service, test email provider

// STAGING (mirrors production)
// Purpose:   final verification — catch what dev missed
// Data:      anonymised production snapshot, or realistic synthetic data at prod volume
// Broken:    serious — nothing reaches prod without passing staging
// Config:    identical structure to production — same instance sizes, same config shape

// PRODUCTION
// Purpose:   live users, real data, real consequences
// Broken:    incident; page on-call, initiate hotfix process
// Deploys:   always via pipeline, never manually

// ── The config rule ──
// Anything that differs between environments is NOT in code. It's in env vars.
//
// In code (same everywhere):
//   const db = new Database(process.env.DATABASE_URL)
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
//
// .env.local:     DATABASE_URL=postgresql://localhost/myapp_dev
// .env.staging:   DATABASE_URL=postgresql://staging-db.internal/myapp
// Production:     DATABASE_URL injected by secrets manager at runtime
//
// .env files with real credentials: always in .gitignore
// .env.example with placeholder values: committed — it's the contract for what's needed`
    },

    // ── Branch-to-environment mapping ──
    {
      speaker: "you",
      text: `"So which branch actually deploys to which environment? Is it just main to dev and main to prod, or is there a mapping?"`
    },
    {
      speaker: "raj",
      text: `"Depends on the strategy, but most teams land on something like: every merge to main auto-deploys to dev. A release branch or a version tag promotes to staging. A manual approval on that staging deploy promotes the same build to production. The key word is <em>same build</em>."`
    },
    {
      speaker: "you",
      text: `"Same build — you mean you don't rebuild for each environment?"`
    },
    {
      speaker: "raj",
      text: `"Right. You build once, tag the image with the git SHA, and that exact image travels from dev to staging to prod. You're not running npm run build three times — you're promoting the same artifact. If you rebuild at each stage, you're not testing what you think you're testing. The staging build could be subtly different from the dev build if a dependency has a looser version pin. Promote the artifact, not the source code."`
    },
    {
      speaker: "you",
      text: `"What about feature branches — do they get their own environment? I've seen that on some teams."`
    },
    {
      speaker: "raj",
      text: `"<em>Preview environments</em>. Every open PR gets its own ephemeral deployment — its own URL, its own database, spun up automatically when the PR opens and torn down when it merges or closes. The reviewer can click a link and test the actual running change instead of pulling the branch locally. QA can sign off without touching their machine. Product can see the feature before it's merged. It sounds expensive but on modern platforms it's cheap — Vercel does it out of the box for frontend, and for backend you can script it on Kubernetes with namespaces."`
    },
    {
      speaker: "you",
      text: `"How do you make sure a preview environment doesn't accidentally touch real data?"`
    },
    {
      speaker: "raj",
      text: `"The preview gets its own throwaway database — spun up with seed data, completely isolated. It never knows production exists. You make that structural: the preview environment's config points at a different database URL, a different S3 bucket, test API keys. Same config rule as any other environment — no real credentials, ever. Tear it all down when the PR closes and nothing persists."`
    },
    {
      type: "code",
      text: `// ── Branch-to-environment mapping ──
//
// Branch / ref                  → Environment      → How
// ─────────────────────────────────────────────────────────────────
// Any PR branch (feat/*, fix/*) → Preview (per-PR) → auto on PR open, torn down on close
// Merge to main                 → Development       → auto on every merge
// release/* branch or tag       → Staging           → auto on branch push / tag
// Manual approval of staging    → Production        → same artifact, promoted

// ── Promote the artifact, not the source ──
//
// WRONG: rebuild at each stage
//   dev:     docker build → image A (built from commit abc at 9:00am)
//   staging: docker build → image B (built from same commit at 2:00pm, deps may differ)
//   prod:    docker build → image C (built again — what are we even testing?)
//
// RIGHT: build once, promote the SHA-tagged image
//   CI builds: registry.myapp.com/myapp:abc1234  ← one build, one artifact
//   Dev deploys:     kubectl set image ... myapp:abc1234
//   Staging deploys: kubectl set image ... myapp:abc1234  ← same image
//   Prod deploys:    kubectl set image ... myapp:abc1234  ← same image
//
// What changes between environments: the config (DATABASE_URL, API keys)
// What stays identical:             the code, the binary, the image

// ── Preview environments: per-PR ephemeral deployments ──

// GitHub Actions: create preview on PR open, destroy on PR close
// .github/workflows/preview.yml
\`
name: Preview Environment

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  deploy-preview:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy preview
        run: |
          PR_NUM=\${{ github.event.pull_request.number }}
          NAMESPACE="preview-pr-\${PR_NUM}"

          # Create isolated namespace
          kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

          # Deploy with PR-specific config
          helm upgrade --install myapp-pr-\${PR_NUM} ./helm/myapp \
            --namespace $NAMESPACE \
            --set image.tag=\${{ github.sha }} \
            --set ingress.host=pr-\${PR_NUM}.preview.myapp.com \
            --set database.url=\${{ secrets.PREVIEW_DB_URL }}/\${NAMESPACE} \
            --set stripe.key=\${{ secrets.STRIPE_TEST_KEY }}

      - name: Post preview URL to PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed: https://pr-\${{ github.event.pull_request.number }}.preview.myapp.com'
            })

  destroy-preview:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Tear down preview
        run: |
          PR_NUM=\${{ github.event.pull_request.number }}
          kubectl delete namespace preview-pr-\${PR_NUM} --ignore-not-found
          # Preview database is dropped with the namespace — nothing persists
\`

// ── What preview environments replace ──
// Before: "Can you pull my branch and test it locally?"
//   → reviewer sets up local env, installs deps, seeds db, spends 20 minutes
// After: reviewer clicks the PR link
//   → running in 3 minutes, isolated, disposable
//
// Before: QA runs a test suite against dev, which has 4 other PRs merged into it
//   → hard to know which PR caused a failure
// After: QA tests each PR's preview in isolation
//   → the failure belongs to exactly one change`
    },

    // ── CI/CD ──
    {
      speaker: "you",
      text: `"We have CI — runs tests on every PR. But deploys are still manual. I SSH in, git pull, restart the service. It works."`
    },
    {
      speaker: "raj",
      text: `"What did you do the last time you deployed?"`
    },
    {
      speaker: "you",
      text: `"Git pull, npm install, ran the migration, restarted the process."`
    },
    {
      speaker: "raj",
      text: `"And the time before that?"`
    },
    {
      speaker: "you",
      text: `"Same I think. Maybe I forgot npm install once and it broke."`
    },
    {
      speaker: "raj",
      text: `"<em>Maybe I forgot</em> is the problem. Manual deploys aren't consistent — they're whatever you remembered to do that day. A pipeline runs the same steps in the same order every single time. No decisions, no memory required. The deploy becomes a consequence of code landing on main — not a procedure someone performs. And when something goes wrong, the rollback is also in the pipeline."`
    },
    {
      speaker: "you",
      text: `"Setting up a full pipeline feels like a big investment for a small team."`
    },
    {
      speaker: "raj",
      text: `"A GitHub Actions pipeline that builds, tests, and deploys is about fifty lines of YAML and a few hours of setup. You pay it once. You recover it every time a manual deploy goes wrong."`
    },
    {
      type: "code",
      text: `// ── GitHub Actions: CI/CD pipeline ──
// .github/workflows/ci-cd.yml
\`
name: CI / CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test -- --coverage
      - run: npm run build

  deploy-dev:
    needs: ci
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: development
    steps:
      - uses: actions/checkout@v4
      - name: Build and push image
        run: |
          docker build -t registry.myapp.com/myapp:\${{ github.sha }} .
          docker push registry.myapp.com/myapp:\${{ github.sha }}
      - name: Deploy to dev
        run: |
          kubectl set image deployment/myapp \
            myapp=registry.myapp.com/myapp:\${{ github.sha }}
          kubectl rollout status deployment/myapp --timeout=120s
      - name: Smoke test
        run: curl --fail https://dev.myapp.com/health

  deploy-prod:
    needs: ci
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production   # requires manual approval in GitHub Environments
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/myapp \
            myapp=registry.myapp.com/myapp:\${{ github.sha }}
          kubectl rollout status deployment/myapp --timeout=300s
      - name: Verify health
        run: curl --fail https://myapp.com/health
      - name: Rollback on failure
        if: failure()
        run: kubectl rollout undo deployment/myapp
\`

// ── The pipeline is also the rollback ──
// Don't SSH in to roll back. That's another undocumented manual step.
//
// Option 1: revert the commit, push to main → pipeline deploys the revert
//   git revert HEAD --no-edit && git push origin main
//
// Option 2: kubectl rollout undo — built into the deploy job on failure
//
// Either way: documented, automated, auditable.`
    },

    // ── Deployment freezes ──
    {
      speaker: "you",
      text: `"We've started talking about not deploying on Fridays. Is that a real thing or superstition?"`
    },
    {
      speaker: "raj",
      text: `"It's real. Not because Friday code is worse, but because a broken Friday deploy has worse consequences. Something goes wrong at 4pm — do you fix it with a tired team before the weekend, or leave it broken for users for two days? Most teams formalise it: no non-critical deploys after Thursday afternoon. Critical security patches are the exception, and there's a named person with authority to call it."`
    },
    {
      speaker: "you",
      text: `"What about longer freezes — around the holidays or before a big launch?"`
    },
    {
      speaker: "raj",
      text: `"Same principle, longer window. Define it in writing, put a gate in the pipeline. During the freeze, a deploy needs explicit sign-off — not a Slack message, a documented approval. The purpose isn't to stop shipping. It's to make the decision deliberate instead of casual. 'Let me just quickly push this' at 9pm on December 23rd is how holiday incidents happen."`
    },
    {
      type: "code",
      text: `// ── Deployment freeze policy ──

// ── Daily pattern ──
// Safe deploy window:    Monday–Thursday, 10am–3pm (your timezone)
// Caution zone:          Thursday 3pm–5pm (give on-call time to react before evening)
// No-deploy zone:        Friday afternoon through Monday morning
//   Exception: critical security patches or data-loss bugs
//   Exception requires: named approver, written reason, rollback plan ready

// ── Holiday and launch freezes ──
// 1. Define the window in writing:
//    "Deployment freeze: Dec 22 – Jan 2. No production changes without CTO approval."
//
// 2. Add a pipeline gate that enforces it:
//
// - name: Check deployment freeze
//   run: |
//     FREEZE_START="2024-12-22"
//     FREEZE_END="2025-01-02"
//     TODAY=$(date +%Y-%m-%d)
//     if [[ "$TODAY" >= "$FREEZE_START" && "$TODAY" <= "$FREEZE_END" ]]; then
//       echo "Deployment freeze in effect until $FREEZE_END"
//       echo "Override requires explicit approval. See runbook link."
//       exit 1
//     fi

// ── Override process ──
// 1. Engineer opens a "freeze override" ticket: what, why, rollback plan
// 2. Named approver signs off in writing
// 3. Deploy proceeds via normal pipeline (not manually)
// 4. On-call stays available for 2 hours post-deploy
//
// "I just want to quickly push this" is not an override.
// "Payment processing is down and we have a fix" is an override.`
    },

    // ── Release branch stabilisation ──
    {
      speaker: "you",
      text: `"What happens when a release is in QA on staging, but main keeps moving? New features are being merged while the release is being tested. Do you just freeze main?"`
    },
    {
      speaker: "raj",
      text: `"You don't freeze main — that would block the whole team. You cut a <em>release branch</em> at the point you want to stabilise. Main keeps moving, new features keep landing there. The release branch is frozen to everything except bug fixes that are critical for this release."`
    },
    {
      speaker: "you",
      text: `"So the fix gets committed to the release branch directly?"`
    },
    {
      speaker: "raj",
      text: `"No — fix it on main first, then cherry-pick the commit onto the release branch. That order matters. If you fix it on the release branch first and forget to bring it back to main, the next release ships with the same bug. Main is always the source of truth. The release branch only receives cherry-picks from main, never original work."`
    },
    {
      speaker: "you",
      text: `"What if QA finds something that's only in this release — something that was introduced during the stabilisation window and isn't on main yet?"`
    },
    {
      speaker: "raj",
      text: `"That shouldn't happen if you're fixing on main first. But if it does — a config change specific to this release, say — the fix still goes into a PR, still gets reviewed, and you explicitly track that it needs to be ported to main as a follow-up. You don't let anything live only on a release branch without a corresponding main ticket. Release branches are temporary. Main is permanent."`
    },
    {
      type: "code",
      text: `// ── Release branch stabilisation ──
//
// Timeline:
//
// main ──── A ── B ── C ── D ── E ── F ──────────────────► (keeps moving)
//                └── release/v2.5.0 ──── C' ──────────────► (frozen, QA testing)
//
// A, B: features merged to main before release cut
// C:    bug found in QA — fix committed to main first
// C':   cherry-pick of C onto release branch
// D, E, F: new features on main — NOT in this release

// 1. Cut the release branch from main at the right commit
git checkout main && git pull origin main
git checkout -b release/v2.5.0
git push origin release/v2.5.0

// 2. Pipeline auto-deploys release/v2.5.0 to staging
// (branch pattern: release/* → deploy to staging)

// 3. QA finds a bug. Fix it on main first.
git checkout main
git checkout -b fix/checkout-price-rounding
// ... fix the bug ...
git commit -m "fix(checkout): correct rounding for tax-inclusive prices"
// Open PR against main, get it reviewed and merged to main

// 4. Cherry-pick the fix onto the release branch
git checkout release/v2.5.0
git cherry-pick <commit-sha-from-main>
git push origin release/v2.5.0
// Pipeline redeploys to staging automatically — QA retests the fix

// 5. Release approved — tag from the release branch
git tag v2.5.0
git push origin v2.5.0
// Pipeline deploys v2.5.0 tag to production

// 6. After release: the release branch is done
// It served its purpose. Archive or delete it.
git push origin --delete release/v2.5.0

// ── The rule ──
// Fix on main first, cherry-pick to release.
// Never the other way around.
// A fix that exists only on a release branch is a bug waiting to resurface.

// ── How many bugs is too many during stabilisation? ──
// No fixed number — but each cherry-pick restarts the QA confidence clock.
// If you're cherry-picking five fixes a day, the release isn't stable.
// That's a signal: either the release scope was too large,
// or the feature wasn't ready to be cut into a release branch yet.
// The fix is earlier feature flags and smaller, more frequent releases —
// not longer stabilisation windows.`
    },

    // ── Database migrations ──
    {
      speaker: "you",
      text: `"Migrations scare me more than anything else in a deploy. Running something against production and not being able to undo it easily — how do you make that not a white-knuckle moment every time?"`
    },
    {
      speaker: "raj",
      text: `"The fear is correct. A migration that does a full table lock on fifty million rows can take your site down for minutes. The mistake is treating the migration as part of the deploy — code ships, app starts, runs migrate up, continues. That ties your schema change to your code deploy. They succeed or fail together. And you can't roll back the code without rolling back the schema, which is often impossible if data was written in between."`
    },
    {
      speaker: "you",
      text: `"But the code needs the new column to be there before it can use it."`
    },
    {
      speaker: "raj",
      text: `"It needs to be written so it works whether the column exists yet or not. Expand-migrate-contract. Three separate deploys. First: add the column, nullable, no constraints — the old code ignores it completely. Second: backfill existing rows in batches, slowly, outside the migration file. Third: deploy the code that actually uses the column. The migration is never on the critical path of code going live."`
    },
    {
      speaker: "you",
      text: `"Why outside the migration file?"`
    },
    {
      speaker: "raj",
      text: `"A migration that does UPDATE users SET display_name = name on ten million rows acquires a lock for however long that query takes. Could be seconds, could be minutes. During that time, any query touching the users table waits — every login, every profile load. The batch job does the same work in chunks of a thousand rows with a small sleep between. The table is never locked for more than a millisecond at a time. Users never notice."`
    },
    {
      type: "code",
      text: `// ── Expand, Migrate, Contract ──

// ── PHASE 1: Expand (Deploy 1) ──
// Add the column. Nullable. No constraints. Old code is completely unaffected.

exports.up = async (knex) => {
  await knex.schema.alterTable('users', (t) => {
    t.string('display_name').nullable();  // near-instant on most databases
  });
};
// Risk: near zero. Adding a nullable column doesn't rewrite existing rows.
// Old code still reads/writes 'name'. Doesn't know display_name exists.

// ── PHASE 2: Backfill (background job, NOT in a migration) ──
const backfillDisplayNames = async () => {
  let lastId = 0;
  while (true) {
    const rows = await db('users')
      .where('id', '>', lastId)
      .whereNull('display_name')
      .orderBy('id')
      .limit(1000)
      .select('id', 'name');

    if (rows.length === 0) break;

    await db('users')
      .whereIn('id', rows.map(r => r.id))
      .update({ display_name: db.raw('name') });

    lastId = rows[rows.length - 1].id;
    await sleep(100);  // 100ms pause — be kind to the DB under production load
    logger.info({ event: 'backfill.progress', lastId });
  }
};
// Stoppable and resumable. Can run during business hours without user impact.

// ── PHASE 3: New code live (Deploy 2) ──
// Deploy code that reads and writes display_name.
// Old column still exists — backwards compatible during rolling deploy window.

// ── PHASE 4: Contract (Deploy 3) ──
exports.up = async (knex) => {
  await knex.schema.alterTable('users', (t) => {
    t.string('display_name').notNullable().alter();  // constraint safe now all rows filled
    t.dropColumn('name');                            // remove old column
  });
};

// ── Production migration rules ──
// NEVER in one migration:
//   ✗ Rename a column — looks like drop + add, breaks running code mid-deploy
//   ✗ UPDATE millions of rows — table lock, site impact
//   ✗ Add a NOT NULL column without a default to a large table — rewrites every row
//   ✗ Add a regular index synchronously to a large table — holds read lock for minutes
//
// ALWAYS:
//   ✓ Add new columns nullable first
//   ✓ CREATE INDEX CONCURRENTLY in Postgres (no read lock)
//   ✓ Test migrations against a production-sized data snapshot in staging first
//   ✓ Have a tested exports.down before you run exports.up on production
//   ✓ Know the estimated run time before you run it (EXPLAIN ANALYZE in staging)`
    },

    // ── Deployment strategies ──
    {
      speaker: "you",
      text: `"Zero-downtime deploys — right now I restart the process and there's a few seconds of downtime. How does that actually get fixed?"`
    },
    {
      speaker: "raj",
      text: `"The simplest fix is a rolling deploy. Instead of stopping the old process and starting a new one, you start a new instance alongside the old one, wait for it to be healthy, then terminate the old one. During the overlap, both versions run simultaneously. Fine as long as v1 and v2 can coexist — compatible API shape, compatible schema."`
    },
    {
      speaker: "you",
      text: `"What if the deploy isn't compatible? Like if I changed the response shape?"`
    },
    {
      speaker: "raj",
      text: `"Then you need a clean cutover. Blue-green: two full environments — blue is live, green is idle. You deploy to green, smoke test it while blue is still serving real traffic, then flip the load balancer. The switch is instant. If green is sick, you flip back to blue in seconds."`
    },
    {
      speaker: "you",
      text: `"That's running double the infrastructure."`
    },
    {
      speaker: "raj",
      text: `"It is. For uncertain changes, canary is cheaper. Deploy the new version to one or two instances, route five percent of real traffic there, watch your error rates and latency for fifteen minutes. If the canary looks healthy, you gradually shift more traffic over. If it looks sick, you pull it. Five percent of users hit the bug briefly. The rest never knew."`
    },
    {
      type: "code",
      text: `// ── Three zero-downtime strategies ──

// ── Rolling deploy ──
// Replace instances one at a time, health check before terminating any
//
// Kubernetes:
// spec:
//   strategy:
//     type: RollingUpdate
//     rollingUpdate:
//       maxSurge: 1         # spin up 1 extra before terminating old ones
//       maxUnavailable: 0   # never drop below desired replica count
//
// Safe when: change is backwards compatible (additive API, no schema conflicts)
// Risky when: v1 and v2 interpret the same data differently during overlap

// ── Blue-green deploy ──
//
//  Load Balancer
//       ├── BLUE (v1) ◄── 100% traffic  (currently live)
//       └── GREEN (v2) ◄── 0% traffic   (deploy target)
//
// Steps:
//   1. Deploy v2 to GREEN. Smoke test directly against GREEN.
//   2. Switch load balancer: 100% to GREEN.
//   3. Monitor for 10–30 minutes.
//   4. Healthy: decommission or reprovision BLUE as next GREEN.
//   5. Unhealthy: flip back to BLUE — instant rollback.
//
// Use when: breaking schema change, incompatible API, high-stakes release
// Cost:     double infrastructure, or provisioning time per release

// ── Canary deploy ──
//
//  Load Balancer
//       ├── v1 (19 instances) ◄── 95% traffic
//       └── v2  (1 instance) ◄──  5% traffic  ← the canary
//
// Watch for 15–60 minutes: error rate, p99 latency, conversion metrics
// Healthy: 5% → 25% → 50% → 100%
// Unhealthy: remove canary → ~5% of users were briefly affected
//
// Kubernetes with Argo Rollouts:
// spec:
//   strategy:
//     canary:
//       steps:
//         - setWeight: 5
//         - pause: { duration: 15m }
//         - setWeight: 25
//         - pause: { duration: 10m }
//         - setWeight: 100
//
// Use when: large user base, uncertain impact, new algorithm or ranking logic

// ── Decision guide ──
// Rolling:    most deploys — compatible change, low risk
// Blue-green: breaking schema, incompatible API, need instant clean rollback
// Canary:     uncertain impact, want real-traffic validation before full rollout`
    },

    // ── Feature flags ──
    {
      speaker: "you",
      text: `"Feature flags keep coming up. I've been avoiding them because it feels like scattering if-statements everywhere. How do you keep that manageable?"`
    },
    {
      speaker: "raj",
      text: `"The if-statements are real. What makes them manageable is where the value comes from. <em>const ENABLE_X = false</em> hardcoded in code is not a feature flag — it's commented-out code with extra steps. You still have to deploy to toggle it. A real flag's value comes from outside the code — so you can toggle it without deploying anything."`
    },
    {
      speaker: "you",
      text: `"What do you actually use them for beyond 'this isn't done yet'?"`
    },
    {
      speaker: "raj",
      text: `"Percentage rollouts — ship a new checkout flow to one percent of users, watch conversion, expand if it looks good. Kill switches — something's behaving badly in production, you turn it off for all users in thirty seconds. A/B experiments. Targeted access — internal users, beta testers, one specific enterprise customer who asked for early access. And they're your fastest rollback. A bad deploy takes minutes to revert through the pipeline. A flag takes seconds to toggle."`
    },
    {
      speaker: "you",
      text: `"I can already see these accumulating forever."`
    },
    {
      speaker: "raj",
      text: `"That's the one thing people skip and it matters most. A flag at 100% enabled for two weeks is dead code wearing a jacket. Create the cleanup ticket at the same time as the flag. Set the date. Make it part of definition of done."`
    },
    {
      type: "code",
      text: `// ── Feature flag implementation levels ──

// ── Level 1: Environment variable ──
// Toggleable without a code change, but not without a redeploy
const ENABLE_NEW_CHECKOUT = process.env.ENABLE_NEW_CHECKOUT === 'true';
// Good for: infrastructure flags during a migration
// Bad for:  instant toggle, per-user targeting

// ── Level 2: Database-backed flags ──
// Instant toggle from admin UI — no deploy required

// flags table: { name, enabled, enabled_user_ids, rollout_percentage }
const isEnabled = async (flagName, userId = null) => {
  const flag = await db.flags.findOne({ name: flagName });
  if (!flag) return false;
  if (flag.enabled) return true;
  if (userId && flag.enabled_user_ids?.includes(userId)) return true;
  return false;
};

// ── Level 3: Percentage rollout — deterministic, not random ──
// Same user always gets the same experience
const isEnabledForUser = (flagName, userId, rolloutPct) => {
  if (rolloutPct === 100) return true;
  if (rolloutPct === 0) return false;
  const bucket = cyrb53(flagName + userId) % 100;  // hash → consistent bucket
  return bucket < rolloutPct;
};
// userId 'u_123' hashes to bucket 7. rolloutPct=10 → enabled.
// rolloutPct changes from 10 to 25: same users who had it keep it, more added.

// ── LaunchDarkly (managed service — worth it at scale) ──
const show = await ldClient.variation(
  'new-checkout-flow',
  { key: req.userId, email: req.userEmail },
  false  // default if SDK can't reach LaunchDarkly
);
// Supports: % rollout, user targeting, A/B, scheduled expiry, audit log, kill switch

// ── Flag lifecycle — the part that gets skipped ──
// When you create the flag:
//   → Also create: cleanup ticket with a concrete date (e.g. "2 weeks after 100% rollout")
//
// States:
//   off (0%)         → code is dark
//   internal         → named user IDs only
//   canary (5%)      → small real-traffic test
//   gradual (25-75%) → expanding, watching metrics
//   full (100%)      → everyone — flag is now dead weight
//   removed          → if-statement deleted, cleanup ticket closed
//
// A flag at 100% for more than 2 weeks: create a cleanup PR this sprint.`
    },

    // ── Secrets management ──
    {
      speaker: "you",
      text: `"Secrets — right now they're in .env files that I manually copy to the server. I know that's not right but it works."`
    },
    {
      speaker: "raj",
      text: `"How many people have SSH access to that server?"`
    },
    {
      speaker: "you",
      text: `"Three of us."`
    },
    {
      speaker: "raj",
      text: `"So your production database password is in a file three people can read, probably in a Slack message from when you first shared it, maybe in someone's laptop Downloads folder. Secrets in files get copied — into chat history, old backups, laptops that leave the company. The risk accumulates quietly."`
    },
    {
      speaker: "you",
      text: `"So what replaces the .env file?"`
    },
    {
      speaker: "raj",
      text: `"A secrets manager. AWS Secrets Manager, HashiCorp Vault, Doppler for smaller teams. The secret lives in the manager. Your deployment platform fetches it and injects it as an environment variable at runtime. No human sees the raw value after it's stored. You rotate it in the manager; the next deploy picks up the new value. No SSH, no files on servers."`
    },
    {
      speaker: "you",
      text: `"What about rotating without downtime? If I change the database password, the running app immediately can't connect."`
    },
    {
      speaker: "raj",
      text: `"Two steps. Add the new credentials alongside the old — most databases support a brief dual-credential window. Deploy the app with the new credentials. Verify it's connecting. Then revoke the old credentials. No gap, no downtime."`
    },
    {
      type: "code",
      text: `// ── Secrets management ──

// ── What not to do ──
// .env file on the server  — readable by anyone with SSH, gets copied
// Hardcoded in code        — ends up in git history forever, even after deletion
// In Slack / email         — permanently in chat history, no rotation audit

// ── CI/CD secrets (good starting point) ──
// GitHub: Settings → Secrets → Actions
// Injected as env vars at pipeline runtime, never logged, masked in output
//
// env:
//   DATABASE_URL: \${{ secrets.DATABASE_URL }}
//   STRIPE_SECRET_KEY: \${{ secrets.STRIPE_SECRET_KEY }}

// ── Platform-injected secrets (recommended for production) ──
// Stored in AWS Secrets Manager / GCP Secret Manager / Vault
// Kubernetes fetches and mounts as env vars at pod start time
//
// apiVersion: external-secrets.io/v1beta1
// kind: ExternalSecret
// spec:
//   secretStoreRef: { name: aws-secrets-manager }
//   target: { name: app-secrets }
//   data:
//     - secretKey: DATABASE_URL
//       remoteRef: { key: production/myapp/database, property: url }
//
// Pod gets DATABASE_URL injected. Engineer who set it up may not remember the value.
// Rotation: update the secret in the manager → rolling restart → new pods pick it up.

// ── Zero-downtime rotation example: database password ──

// Step 1: Create new DB user with same permissions
//   CREATE USER myapp_v2 WITH PASSWORD 'new-password';
//   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO myapp_v2;

// Step 2: Update secret in manager to use new credentials
//   aws secretsmanager update-secret \
//     --secret-id production/myapp/database \
//     --secret-string '{"url":"postgresql://myapp_v2:new-password@db/myapp"}'

// Step 3: Rolling restart — new pods connect with new credentials, old pods still live
//   kubectl rollout restart deployment/myapp
//   kubectl rollout status deployment/myapp

// Step 4: Verify new connections in logs, then revoke old credentials
//   DROP USER myapp_v1;

// ── .env.example — the one env file that belongs in git ──
// DATABASE_URL=postgresql://localhost/myapp_dev
// STRIPE_SECRET_KEY=sk_test_your_key_here
// JWT_SECRET=your-secret-here
// REDIS_URL=redis://localhost:6379
//
// This is the contract: what env vars the app needs.
// Real values: never committed, always in .gitignore.`
    },

    // ── Shared libraries across teams ──
    {
      speaker: "you",
      text: `"We're starting to share internal libraries between teams. If I update a shared library and another team's service depends on it, how does that work without breaking them?"`
    },
    {
      speaker: "raj",
      text: `"This is where semver earns its keep. Backwards-compatible change — minor or patch bump. The other team's service picks it up on their next dependency update without touching anything. Breaking change — major bump. The number is the communication: you've made a deliberate statement that consumers need to update before upgrading."`
    },
    {
      speaker: "you",
      text: `"What if I need to make a breaking change but I can't coordinate with every team immediately?"`
    },
    {
      speaker: "raj",
      text: `"Deprecation window. Ship the new version alongside the old. The old function still works — it just logs a deprecation warning. Give teams a migration guide and a timeline: three months, say. After three months the old function is removed in the next major. Teams that updated are fine. Teams that didn't are stuck on the old major — that's their choice, and they knew it was coming."`
    },
    {
      speaker: "you",
      text: `"We've also been debating whether to put everything in a monorepo or keep separate repos. Does that change how this works?"`
    },
    {
      speaker: "raj",
      text: `"Significantly. In a monorepo you can change the shared library and every consumer in one PR — they're always in sync, there's no version to manage. Refactors are trivial. The cost is that CI runs more and the repo gets large. In a polyrepo, each service is genuinely independent — different deploy cadences, different review processes. The cost is version drift: ServiceA ends up on lib v1.2, ServiceB on lib v2.0, subtle incompatibilities creep in. No universal right answer. Tightly coupled teams tend toward monorepo. Genuinely independent teams with different schedules tend toward polyrepo."`
    },
    {
      type: "code",
      text: `// ── Shared library: versioning and deprecation ──

// ── Bumping versions ──
// npm version patch  → 1.4.2 → 1.4.3  (bug fix)
// npm version minor  → 1.4.3 → 1.5.0  (new function, old API intact)
// npm version major  → 1.5.0 → 2.0.0  (breaking change)

// ── Deprecation: old API survives the transition ──

// v1.5.0 — new function ships, old one deprecated (not removed)
export const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

/** @deprecated Use formatCurrency(amount, currency). Removed in v2.0.0. */
export const formatMoney = (amount) => {
  console.warn('[mylib] formatMoney is deprecated. Use formatCurrency. Removed in v2.0.0.');
  return formatCurrency(amount, 'USD');
};

// v2.0.0 — formatMoney removed, major bump
// Any consumer still calling it gets a build error.
// The major bump told them this was coming three months ago.

// ── Communicating the change ──
// 1. CHANGELOG.md entry with before/after migration example
// 2. Slack #engineering on release:
//    "mylib v1.5.0 out. formatMoney deprecated, use formatCurrency.
//     Removed in v2 — estimated Q3. Migration guide: [link]."
// 3. Three months later: v2.0.0. Teams still on v1.x are unaffected until they upgrade.

// ── Monorepo vs polyrepo ──
//
// MONOREPO (all services in one repo — Nx, Turborepo, Bazel)
// + Breaking change in shared lib: update all consumers in the same PR
// + Refactor across all consumers in one commit — always in sync
// + One place to run all tests, one CI config
// - CI scope grows with the repo — need selective test runs (affected packages only)
// - Clone and repo tooling get heavier over time
//
// POLYREPO (each service its own repo, library published to npm/private registry)
// + Each service fully independent — different deploy cadence, smaller CI
// + Teams move at their own pace without blocking each other
// - Breaking changes require coordinated updates across multiple repos
// - Version drift: subtle incompatibilities between teams on different library versions
// - More infrastructure: private npm registry or GitHub Packages to host internal libs
//
// Heuristic:
//   Tightly coupled teams with shared domain logic → lean toward monorepo
//   Genuinely independent teams with different release schedules → lean toward polyrepo`
    },

    // ── Hotfixes ──
    {
      speaker: "you",
      text: `"When something breaks in production right now — do you still go through the whole PR process? That feels slow when things are on fire."`
    },
    {
      speaker: "raj",
      text: `"Yes. Faster, but yes. What's the impulse when things are on fire?"`
    },
    {
      speaker: "you",
      text: `"SSH in, fix it directly, figure out the proper way later."`
    },
    {
      speaker: "raj",
      text: `"And then what happens on the next deploy?"`
    },
    {
      speaker: "you",
      text: `"...it overwrites the fix."`
    },
    {
      speaker: "raj",
      text: `"You've fixed the incident and planted the next one. The live edit disappears, nobody reviewed it, there's no record of what you did. The post-mortem asks what changed at 14:32 and nobody knows. A hotfix branch, one approver, fast-track pipeline — that's fifteen minutes. In most incidents, the time between identifying the fix and deploying it isn't the bottleneck. Understanding what broke is."`
    },
    {
      type: "code",
      text: `// ── Hotfix process ──
// Production is broken. Do NOT edit live servers. Do NOT push to main directly.

// 1. Branch from main
git checkout main && git pull origin main
git checkout -b hotfix/payment-null-pointer

// 2. Smallest possible fix — resist cleaning up nearby code
git add -p  // stage only what's relevant
git commit -m "fix(payment): guard against null userId in charge handler

Fixes NullPointerException when requests arrive without a userId in session.
Introduced in session refactor PR #412.

Closes #891"

// 3. Open PR — label [HOTFIX], request expedited review, one approver is enough
// Description: what broke, what the fix does, how verified, link to incident

// 4. CI must still pass. One failing unrelated test is not waived.
//    If CI is red for an unrelated reason, fix it or skip that specific job
//    with written justification — do not bypass the whole pipeline.

// 5. Fast-track deploy job — separate job for hotfix/** branches:
// on:
//   push:
//     branches: ['hotfix/**']
// jobs:
//   hotfix-deploy-prod:
//     needs: ci
//     environment: production
//     steps:
//       - run: kubectl set image deployment/myapp ...

// 6. Merge back and tag
git checkout main
git merge --no-ff hotfix/payment-null-pointer
git tag v2.4.1 && git push origin main --tags

// ── Post-mortem (within 48 hours — not optional) ──
//
// TIMELINE:      when did the incident start, when detected, when resolved
// ROOT CAUSE:    the actual technical cause — "human error" is never a root cause
// CONTRIBUTING:  what made it worse or harder to detect
// RESPONSE:      what we did and in what order
// ACTION ITEMS:  specific tickets assigned to specific people
//   → Add test for null userId path (ticket #892, assigned: you)
//   → Add alert for NullPointerException rate spike (ticket #893, assigned: Chen)
//   → Audit session refactor for similar patterns (ticket #894, assigned: Raj)
//
// Blameless means: we identify systemic causes, not people to assign fault to.
// A bug in production is a process gap or a coverage gap — fix the process.`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Go back to the beginning. Committing to main, git pull to deploy, local and production with nothing in between. What does all of this structure actually cost you?"`
    },
    {
      speaker: "you",
      text: `"Some upfront setup — branch protection, a pipeline, a staging environment. And ongoing discipline around short branches, decent commit messages, small PRs."`
    },
    {
      speaker: "raj",
      text: `"And what does it buy?"`
    },
    {
      speaker: "you",
      text: `"Deploys that are the same every time. Bugs caught before production. A record of what changed and when, so rollback isn't guesswork. Teams that can work in parallel without stepping on each other."`
    },
    {
      speaker: "raj",
      text: `"The goal isn't process for its own sake. It's making decisions visible and repeatable, so you spend your time shipping instead of cleaning up the aftermath of undocumented calls made under pressure. The structure is what lets you move fast with confidence — not what slows you down."`
    },

    {
      type: "summary",
      points: [
        "Branches are not free — every day a branch is open, it's drifting from main. Feature branches should live for days, not weeks. Rebase onto main frequently while your branch is open to find conflicts while the context is fresh. Rebasing your own private branch is safe; rebasing a branch other people have based work on rewrites shared history and breaks them. When conflicts arise, read both sides before resolving — most conflicts are two correct changes that need to coexist, not one right answer.",
        "Commits are documentation. The diff shows what changed. The commit message explains why — the decision made, alternatives considered, what breaks on revert. Conventional Commits (feat:, fix:, chore:, BREAKING CHANGE:) makes type machine-readable, enabling semantic-release to automate version bumps and changelog generation. Messy in-progress commits belong on your branch; interactive rebase produces a coherent story before the PR reaches reviewers.",
        "Small PRs get real review. Above 400 lines of diff, reviewers rubber-stamp. Large features decompose into stacked PRs — migration, model, API, UI — each behind a feature flag, each under 200 lines, each independently reviewable and revertable. PR descriptions answer what changed, why, how it was tested, and what breaks if it goes wrong. Branch protection rules make the process structural: require a PR, require CI to pass, require an approver, dismiss stale approvals — and apply these to admins too.",
        "Semantic versioning is a contract. Patch: bug fixed, nothing broke. Minor: new capability added, old code still works. Major: something existing broke — consumers must act before upgrading. Breaking is any change that causes existing correct usage to fail without modification: renaming a field, changing a response shape, making a parameter required. The changelog is technical and auto-generated; the release note is human-written, one paragraph, for product and support.",
        "Environments are gates. Local catches logic errors. Development catches integration failures. Staging catches infrastructure and data-volume problems against production-shaped reality. Production is live users. Each gate stops a different class of bug, and bugs get more expensive the further right they travel. Configuration that changes between environments lives in environment variables, never in code. Credentials belong in a secrets manager — injected at runtime, rotated in two steps so there's no gap between old and new.",
        "Branch-to-environment mapping makes the pipeline explicit: feature branches deploy to per-PR preview environments, merges to main auto-deploy to dev, release branches or tags promote to staging, and a manual approval on staging promotes to production. The critical discipline is artifact promotion — build the Docker image once, tag it with the git SHA, and move that same image through every environment. Rebuilding at each stage means staging is testing a different artifact than dev, which defeats the purpose. Preview environments give every open PR its own ephemeral deployment with its own isolated database — reviewers click a link instead of pulling the branch, QA tests in isolation, product sees the feature before it's merged. They spin up on PR open and are destroyed on close, leaving nothing behind.",
        "CI/CD pipelines make deploys non-events. The pipeline runs lint, test, build, deploy, smoke test, and rollback-on-failure in the same order every time. Manual deploys introduce variance — the step someone forgot, the install that got skipped. Deployment freeze policies make shipping decisions deliberate: no non-critical deploys on Friday afternoons, documented freeze windows around holidays and launches, a named approver with the authority to override and the obligation to stay available after. When a release needs to stabilise, cut a release branch from main at the right commit — main keeps moving, the release branch receives only cherry-picks of bug fixes from main, never original work. Fix on main first, cherry-pick to the release branch. A fix that lives only on a release branch is a bug waiting to resurface in the next release.",
        "Deployment strategies trade safety for cost. Rolling deploys replace instances one at a time — cheap, sufficient for compatible changes, risky when v1 and v2 can't coexist during the overlap. Blue-green keeps a full idle environment and cuts over instantly — right for breaking changes, costs double the infrastructure. Canary routes a small slice of real traffic to the new version, watches error rates and business metrics before expanding — right for uncertain impact and large user bases.",
        "Database migrations decouple from code deploys via expand-migrate-contract. Phase one: add the column nullable — near-instant, old code ignores it. Phase two: backfill in batches via a background job, never a table-locking single UPDATE. Phase three: deploy the code that uses the new column. Phase four: add constraints and drop the old column once stable. Never rename a column in one step. Never add an index without CONCURRENTLY on Postgres. Always test against a production-sized staging snapshot and know the estimated run time before touching production.",
        "Feature flags decouple deployment from release. Code ships continuously; features go live when ready. Flags enable percentage rollouts, per-user targeting, kill switches, and A/B experiments without a code deploy — and they're the fastest rollback for application-level problems. Their cost is accumulation: every flag at 100% for more than two weeks is dead code with extra indirection. Create the cleanup ticket at the same time as the flag. Secrets follow the same discipline — managed centrally, injected at runtime, never in files on servers or chat history, rotated without downtime by adding new credentials before revoking old ones.",
        "Shared libraries across teams need explicit versioning contracts and deprecation windows. Ship the new version alongside the old — the deprecated function logs a warning, not an error, and gives teams a timeline and migration path before the next major removes it. Monorepos keep shared code and all consumers in sync at the cost of CI complexity. Polyrepos give teams genuine independence at the cost of version drift and coordination overhead. Hotfixes follow the same process as normal changes, just faster — smallest possible fix, one approver, CI must pass, deploy via pipeline. Post-mortems within 48 hours are not optional: timeline, root cause, contributing factors, and concrete action items assigned to specific people. The incident is a learning event. The post-mortem is the deliverable."
      ]
    }
  ]
};

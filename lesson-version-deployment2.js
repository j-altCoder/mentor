// ─────────────────────────────────────────────────────────────────
//  LESSON: Versioning & Deployment Scenarios
//  Category: Engineering Practices & Team Workflows
//  Level: Beginner — Raj explains it all from scratch
// ─────────────────────────────────────────────────────────────────

const LESSON_VERSIONING_DEPLOYMENT_NOOB = {
  category: "Architecture & System Design",
  tag: "Versioning & Deployment",
  title: "How Teams Actually Ship Code (Without Breaking Each Other)",
  intro: "You just pushed straight to main, refreshed the production URL, and it worked. You're pretty proud of yourself. Then Raj looks over your shoulder and goes quiet for a second — that specific kind of quiet. 'Come sit with me for a bit,' he says. This is that conversation.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "raj",
      text: `"Okay, quick question. How do you save your work right now?"`
    },
    {
      speaker: "you",
      text: `"I write my code, I do git add, git commit, git push. It goes to main. Done."`
    },
    {
      speaker: "raj",
      text: `"Right. And that works perfectly fine — when you're the only person on the project. But let me ask you something. What happens if I'm also on this project, and I'm changing the same file you're changing, and we both push to main at the same time?"`
    },
    {
      speaker: "you",
      text: `"One of us... overwrites the other?"`
    },
    {
      speaker: "raj",
      text: `"Git would actually catch that and refuse the push — but yeah, you'd have a conflict. And more importantly, what if my changes break something in your code without either of us realising it? We both pushed to the same place. We're both on production now. Something's broken and we don't even know whose code caused it. That's the problem we're solving today."`
    },

    // ── What is a branch ──
    {
      speaker: "you",
      text: `"Okay so... branches are the solution? I've heard the word but I've always just worked on main."`
    },
    {
      speaker: "raj",
      text: `"Think of main as the official, live copy of your project. A branch is like your own personal copy that you work on separately. You make all your changes there, mess around, break things, fix them — and none of that touches main until you're ready. Only when you're done and things look good do you merge your copy back in."`
    },
    {
      speaker: "you",
      text: `"So it's like... making a duplicate of the project?"`
    },
    {
      speaker: "raj",
      text: `"Kind of, except it's not a full duplicate — git is smart enough to only track what changed. But yes, conceptually: your own space to work, without affecting anyone else. I can have my branch. You can have yours. We're not tripping over each other."`
    },
    {
      type: "analogy",
      text: "Imagine a shared Google Doc that everyone is editing at the same time. That's working directly on main — chaotic. Branches are like everyone making their own copy, doing their edits, and then one at a time, carefully adding those edits back into the shared doc. Much more controlled."
    },
    {
      type: "code",
      text: `// ── Creating and using a branch ──

// Step 1: create a new branch and switch to it
git checkout -b feature/add-login-page
// You're now on your own branch. main is untouched.

// Step 2: do your work, commit as usual
git add .
git commit -m "add login form UI"

// Step 3: push YOUR branch to GitHub (not main)
git push origin feature/add-login-page

// Step 4: open a Pull Request on GitHub — this is how you
// ask for your changes to be reviewed and merged into main.

// At any time you can check which branch you're on:
git branch
// The branch with * next to it is your current branch.

// To switch back to main (without merging anything):
git checkout main`
    },

    // ── Branch strategies ──
    {
      speaker: "you",
      text: `"This makes sense. But I've seen people talk about 'Gitflow' and 'trunk-based development' online and I have no idea what those mean."`
    },
    {
      speaker: "raj",
      text: `"Don't stress about those yet — they're just different opinions on how teams should organise their branches. Gitflow has a lot of structure: a develop branch, feature branches, release branches, hotfix branches. It works well for teams that ship on a set schedule, like 'we release every two weeks.' For beginners it can feel like a lot of ceremony."`
    },
    {
      speaker: "you",
      text: `"What's the simpler option?"`
    },
    {
      speaker: "raj",
      text: `"Trunk-based. You work on short-lived feature branches — one to three days max — and merge directly into main. Main is always in a state where you could deploy it at any time. It sounds scary but it actually forces good habits: small changes, frequent merges, no giant branches that diverge for weeks."`
    },
    {
      speaker: "you",
      text: `"Why is a giant branch bad? What's the harm in working on a branch for, like, two weeks?"`
    },
    {
      speaker: "raj",
      text: `"While you're sitting on your branch for two weeks, main keeps moving. Other people are merging their work in. By the time you come back, main and your branch have totally different histories. Merging them becomes a nightmare — you're not just adding your changes, you're untangling two weeks of divergence. We call that merge debt, and it compounds every day you wait."`
    },
    {
      type: "code",
      text: `// ── Short-lived branches: the goal ──
//
// main ──────────────────────────────────────────────►
//   ├── feat/login    (2 days) ──► merge ──► done
//   ├── feat/signup   (1 day)  ──► merge ──► done
//   └── fix/email-bug (3 hrs)  ──► merge ──► done
//
// Each branch is small, focused, and merges back quickly.
// Nobody is sitting on a branch for two weeks.

// ── What NOT to do ──
//
// main ──────────────────────────────────────────────►
//   └── feat/big-refactor (open for 3 weeks...) ──► NIGHTMARE merge
//
// By day 21, main has moved so far that merging
// this branch takes half a day of fixing conflicts.
// The longer you wait, the worse it gets.`
    },

    // ── Pull Requests ──
    {
      speaker: "you",
      text: `"Okay so I make a branch, I do my work, and then I open a 'pull request.' I've seen that on GitHub. What actually IS a pull request?"`
    },
    {
      speaker: "raj",
      text: `"A pull request — or PR — is just you saying: 'Hey, here are the changes I made on my branch. Can someone look at them before they go into main?' It's a code review request, wrapped in a nice interface. Someone on your team reads through your changes, leaves comments, maybe asks questions or spots bugs. When they're happy with it, they approve it. Then it gets merged."`
    },
    {
      speaker: "you",
      text: `"What should I write in the description? I've been leaving it blank."`
    },
    {
      speaker: "raj",
      text: `"Imagine the reviewer knows nothing about what you were trying to do. Explain what changed, why you changed it, and how you tested it. That's it. A good description saves everyone from asking clarifying questions back and forth for two days. A blank description means the reviewer has to read every line of code and guess."`
    },
    {
      speaker: "you",
      text: `"And how big should a PR be?"`
    },
    {
      speaker: "raj",
      text: `"As small as possible. Seriously — small PRs get real, thoughtful review. When a PR is huge, reviewers get overwhelmed and just click approve without actually reading it. If your PR is changing forty files, it's probably doing too many things at once. Can you split it up?"`
    },
    {
      type: "code",
      text: `// ── A good PR description ──
// You don't need a fancy template to start. Just answer these:

// ## What changed?
// Added a login form to /src/pages/Login.jsx.
// Users can now enter email + password and submit.

// ## Why?
// Part of the user auth feature. Ticket: #42.

// ## How did I test it?
// Manually tested in the browser — form submits, errors show correctly.
// Also ran: npm test (all passing).

// ## Anything reviewers should focus on?
// Not sure if the error handling in handleSubmit is the right approach —
// would appreciate a second pair of eyes on that.

// That's it. Four questions. Two minutes to write.
// Saves twenty minutes of back-and-forth in the comments.`
    },

    // ── Commit messages ──
    {
      speaker: "you",
      text: `"Can I ask about commit messages? Mine are usually just like 'fix' or 'wip' or 'changes.' Is that actually a problem?"`
    },
    {
      speaker: "raj",
      text: `"Okay, picture this: something breaks in production six months from now. You go into the git history to figure out when it broke and what changed. Every commit just says 'fix.' How helpful is that?"`
    },
    {
      speaker: "you",
      text: `"Not at all."`
    },
    {
      speaker: "raj",
      text: `"Right. A commit message is a note to your future self — and your teammates. The code shows what changed. The message explains why. Why did you make this change? What did it fix? That's what you need to know in six months, not a summary of the diff."`
    },
    {
      speaker: "you",
      text: `"Is there a format I should follow?"`
    },
    {
      speaker: "raj",
      text: `"Most teams use Conventional Commits. It starts with a type — 'feat' if you added something new, 'fix' if you fixed a bug, 'chore' for boring maintenance stuff. Then an optional scope in parentheses, then a short description. Like: feat(login): add password visibility toggle. Short, clear, machine-readable. Some tools can even auto-generate changelogs from commit messages formatted this way."`
    },
    {
      type: "code",
      text: `// ── Conventional Commits format ──
// <type>(<scope>): <short description>
//
// types:
//   feat     → you added something new
//   fix      → you fixed a bug
//   chore    → maintenance, deps, config — nothing the user sees
//   refactor → reorganised code, no new features or bug fixes
//   docs     → documentation only
//   test     → added or fixed tests

// ── Bad commit messages ──
// "fix"
// "wip"
// "changes"
// "asdfgh"
// "trying something"
// "ok this works now"

// ── Good commit messages ──
// feat(login): add password visibility toggle
// fix(signup): show error when email is already taken
// chore: update eslint to v9
// feat(cart): save items to localStorage so they persist on refresh

// If your commit needs more explanation, add a body:
// fix(checkout): use price at cart creation, not at purchase
//
// Previously the order was charged the live price at checkout time.
// This meant if a price changed, users saw one price and paid another.
// Now price is captured when the item is added to cart.
//
// Closes #45`
    },

    // ── Branch protection ──
    {
      speaker: "you",
      text: `"Wait — if everyone's supposed to use branches and PRs, what stops someone from just pushing straight to main and skipping all of that?"`
    },
    {
      speaker: "raj",
      text: `"Nothing, unless you set up branch protection. Right now on your repo, nothing is stopping you — or anyone — from pushing directly to main. Branch protection is a setting on GitHub that enforces the rules. With it on, GitHub will literally refuse to let anyone push to main without going through a PR. No exceptions."`
    },
    {
      speaker: "you",
      text: `"What else can it enforce?"`
    },
    {
      speaker: "raj",
      text: `"At minimum, you want: a PR is required before merging, CI tests have to pass before you can merge, and at least one person has to approve it. Those three rules alone stop a lot of accidents. The key thing: make it apply to admins too. The people most likely to bypass the process under deadline pressure are admins — because they can. Don't give yourself that escape hatch."`
    },
    {
      type: "code",
      text: `// ── Setting up branch protection on GitHub ──
// Go to: Your repo → Settings → Branches → Add rule
// Branch name pattern: main

// ── The three rules you want from day one ──

// 1. ✓ Require a pull request before merging
//       Require approvals: 1
//       (Someone has to actually read your code before it goes in)

// 2. ✓ Require status checks to pass before merging
//       Add your CI job names here — e.g. "test", "lint", "build"
//       (Tests have to be green. Can't merge a broken branch.)

// 3. ✓ Do not allow bypassing the above settings
//       (Yes, this includes repo admins. Especially admins.)

// That's it. Three checkboxes and you've made the process structural.
// Now "I'll just quickly push to main" is literally impossible.
// The rules enforce themselves — you don't have to rely on everyone
// remembering to do the right thing.`
    },

    // ── CI/CD basics ──
    {
      speaker: "you",
      text: `"I keep seeing 'CI/CD' everywhere. I know it means something about automated testing but I don't really get what it does in practice."`
    },
    {
      speaker: "raj",
      text: `"CI stands for Continuous Integration. Every time you push code, it automatically runs your tests. So if you broke something, you find out immediately — not two days later when someone else is trying to use your code. CD stands for Continuous Deployment — automatically deploying the code if the tests pass. So the pipeline is: push code → tests run → if green, deploy. No manual steps."`
    },
    {
      speaker: "you",
      text: `"How is that different from me just running tests on my laptop?"`
    },
    {
      speaker: "raj",
      text: `"A few ways. First, it runs on a clean environment — not your laptop with all your personal settings and packages. Second, it runs every time, not just when you remember. And third, everyone can see the result. If CI is red, the whole team knows the branch is broken. Nobody merges a red branch — the branch protection rule stops them even if they try."`
    },
    {
      speaker: "you",
      text: `"How do I set it up? Is it complicated?"`
    },
    {
      speaker: "raj",
      text: `"For a basic setup — maybe fifty lines of YAML. GitHub Actions is the easiest place to start. You create a file in your repo and tell it what to do when someone pushes code. Run install, run lint, run tests, done. The first time you set it up it takes an afternoon. After that it runs forever without you touching it."`
    },
    {
      type: "code",
      text: `// ── A simple GitHub Actions CI pipeline ──
// Create this file: .github/workflows/ci.yml

\`
name: CI

on:
  pull_request:        # runs when someone opens or updates a PR
    branches: [main]
  push:
    branches: [main]   # also runs when something merges to main

jobs:
  test:
    runs-on: ubuntu-latest   # a clean Linux machine, every time

    steps:
      - uses: actions/checkout@v4        # pulls your code
      - uses: actions/setup-node@v4      # installs Node
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci                      # install dependencies
      - run: npm run lint                # check code style
      - run: npm test                    # run your tests

      # That's it. If any step fails, the whole job fails.
      # GitHub shows a red X on the PR and blocks merging.
\`

// When this is set up and branch protection requires it to pass,
// broken code literally cannot get merged into main.
// It's automatic, it's consistent, and it catches mistakes
// before they become anyone else's problem.`
    },

    // ── Environments ──
    {
      speaker: "you",
      text: `"Right now I only have two things: my laptop and the live site. I push to main, it goes straight to production. Should there be something in between?"`
    },
    {
      speaker: "raj",
      text: `"Yes. What's the last bug that made it to your live site that you wish you'd caught first?"`
    },
    {
      speaker: "you",
      text: `"I pushed a typo in a database column name and the whole app crashed."`
    },
    {
      speaker: "raj",
      text: `"Would you have caught that if you'd deployed to a test environment first and checked that it worked?"`
    },
    {
      speaker: "you",
      text: `"...yes, immediately."`
    },
    {
      speaker: "raj",
      text: `"That's what environments are. Each one is a safety net before the real thing. You have at least three in a healthy setup: local on your laptop, staging which is a close copy of production, and production which is the live site real users are on. Every bug you catch in staging saves you an incident in production."`
    },
    {
      type: "analogy",
      text: "Think of it like a dress rehearsal before opening night. You wouldn't do your first run-through in front of a paying audience. Staging is the rehearsal space — same setup as the real thing, but if something goes wrong, nobody's watching."
    },
    {
      type: "code",
      text: `// ── The three environments you need ──

// LOCAL (your laptop)
// Purpose:   write code, try things, break things freely
// Data:      fake test data — never real user data on your machine
// Broken:    totally fine, it's just you
// Config:    relaxed settings, test API keys, lots of logging

// STAGING (a server that mirrors production)
// Purpose:   test that things actually work before going live
// Data:      either fake data at realistic volume, or anonymised production data
// Broken:    bad — fix it before pushing to production
// Config:    same structure as production, using test keys for payments etc.

// PRODUCTION (the real site)
// Purpose:   real users, real data, real consequences
// Broken:    incident — you need to fix this NOW
// Deploys:   always through CI/CD pipeline, never by hand

// ── The config rule ──
// Anything that changes between environments goes in an environment variable.
// NEVER hardcode URLs, API keys, or database names in your code.

// In your code:
const db = new Database(process.env.DATABASE_URL)

// .env on your laptop:
// DATABASE_URL=postgresql://localhost/myapp_dev

// Staging server:
// DATABASE_URL=postgresql://staging-db/myapp_staging

// Production:
// DATABASE_URL=postgresql://prod-db/myapp_production

// Same code. Different config per environment. Clean.`
    },

    // ── Secrets ──
    {
      speaker: "you",
      text: `"About those environment variables — I've been putting my API keys in a .env file and committing it to git. That's bad, isn't it."`
    },
    {
      speaker: "raj",
      text: `"...yes. Very. Once something is in git history, it's there forever — even if you delete the file. Anyone who can see your repo can see your keys. If it's a public repo, those keys are out in the open right now."`
    },
    {
      speaker: "you",
      text: `"Okay. What do I do about it?"`
    },
    {
      speaker: "raj",
      text: `"Two things. First: add .env to your .gitignore right now. That stops it from ever being committed. Second: if you've already committed .env to git at any point, rotate all those API keys — assume they're compromised. For sharing what keys your app needs without sharing the actual values, create a .env.example file that has the variable names but placeholder values, and commit that. Anyone who clones the repo knows what they need to fill in."`
    },
    {
      speaker: "you",
      text: `"And how do I get the real secrets onto the server if I can't commit them?"`
    },
    {
      speaker: "raj",
      text: `"For a small project: GitHub repository secrets. You store the values in GitHub's settings, and they get injected into your CI pipeline as environment variables. Nobody can read them in plaintext — not even you, after you set them. For bigger setups there are dedicated tools like AWS Secrets Manager or Doppler, but GitHub secrets is the right starting point."`
    },
    {
      type: "code",
      text: `// ── Secrets: do this today ──

// Step 1: Add .env to .gitignore (create this file if it doesn't exist)
// .gitignore:
.env
.env.local
.env.production

// Step 2: Create .env.example and commit IT (not .env)
// .env.example — this goes in git, safe to share:
DATABASE_URL=postgresql://localhost/your_app_dev
STRIPE_SECRET_KEY=sk_test_your_key_here
JWT_SECRET=your-secret-here

// .env — this stays local, NEVER in git:
DATABASE_URL=postgresql://localhost/myapp_dev
STRIPE_SECRET_KEY=sk_test_abc123
JWT_SECRET=supersecretvalue

// Step 3: Add real secrets to GitHub
// Go to: Your repo → Settings → Secrets and variables → Actions → New secret
// Add each key/value pair. GitHub masks them in logs.

// Step 4: Use them in your pipeline
// In .github/workflows/ci.yml:
// env:
//   DATABASE_URL: \${{ secrets.DATABASE_URL }}
//   STRIPE_SECRET_KEY: \${{ secrets.STRIPE_SECRET_KEY }}

// Step 5: If you've already committed .env at any point —
//         rotate all those API keys. Today. Don't wait.`
    },

    // ── Semantic versioning ──
    {
      speaker: "you",
      text: `"Version numbers — I see them everywhere: 1.0.0, 2.4.1. I've never actually assigned a version to anything I've built. What's the point?"`
    },
    {
      speaker: "raj",
      text: `"A version number is a message to anyone using your code. It tells them: is it safe to update? Did something break? Do they need to change anything on their end? Without version numbers, every update is a mystery. With them, the number itself communicates what kind of change happened."`
    },
    {
      speaker: "you",
      text: `"How do you know what number to use?"`
    },
    {
      speaker: "raj",
      text: `"There's a standard called Semantic Versioning — semver. Three numbers: MAJOR dot MINOR dot PATCH. Patch goes up when you fix a bug and nothing else changed — safe to update, nothing will break. Minor goes up when you added something new but the existing stuff still works exactly the same — also safe to update. Major goes up when something that worked before will no longer work — this is the warning sign: 'hey, read the changelog before you upgrade.'"`
    },
    {
      speaker: "you",
      text: `"What counts as 'breaking'? How do I know if I need to bump the major?"`
    },
    {
      speaker: "raj",
      text: `"Simple test: can someone update to the new version without changing a single line of their own code? If yes, it's minor or patch. If no — if they have to update their code because you changed something — it's major. Renamed a function? Major. Changed what a function returns? Major. Removed something? Major. Added a new function that didn't exist before? Minor — their existing code still works."`
    },
    {
      type: "code",
      text: `// ── Semantic Versioning: MAJOR.MINOR.PATCH ──

// PATCH: 1.2.3 → 1.2.4
// "I fixed a bug, nothing else changed."
// Safe to update. Users don't need to change anything.
// Examples:
//   fixed crash when the input is null
//   fixed typo in error message
//   fixed calculation that was rounding wrong

// MINOR: 1.2.4 → 1.3.0
// "I added something new, but I didn't break anything."
// Safe to update. Old code still works exactly the same.
// Examples:
//   added a new optional parameter to an existing function
//   added a new API endpoint
//   added a new field to the response (existing fields unchanged)

// MAJOR: 1.3.0 → 2.0.0
// "Something that used to work might not work anymore."
// Do NOT auto-update. Read the changelog. You might need to update your code.
// Examples:
//   renamed a function (old name no longer exists)
//   changed what a function returns
//   removed an endpoint
//   changed the shape of a response

// ── The simple test ──
// "Can my users update without touching their own code?"
//   Yes → minor or patch
//   No  → major`
    },

    // ── Feature flags intro ──
    {
      speaker: "you",
      text: `"I've heard people talk about 'feature flags' but I don't really understand what they are or why you'd use them."`
    },
    {
      speaker: "raj",
      text: `"A feature flag is basically an on/off switch for a feature in your app. Instead of 'this code is deployed, therefore this feature is live,' you can deploy the code but keep the feature turned off. Then you turn it on whenever you're ready — without a new deployment."`
    },
    {
      speaker: "you",
      text: `"Why would you deploy code that's not turned on yet?"`
    },
    {
      speaker: "raj",
      text: `"A few reasons. One: you can ship code to production frequently in small pieces — even before a feature is finished — without showing half-baked work to users. Two: if something goes wrong, you can turn off just that feature in seconds, without rolling back the whole deploy. Three: you can turn it on for just yourself first, test it in production with real data, then turn it on for everyone when you're sure it works."`
    },
    {
      speaker: "you",
      text: `"That sounds really useful actually. How do I implement one?"`
    },
    {
      speaker: "raj",
      text: `"Start simple. An environment variable is the most basic form. Not perfect — you still need to redeploy to change it — but it's fine to start. As you get more serious, you move to a database-backed flag that you can toggle instantly from an admin panel. The concept is the same either way: check the flag before showing the feature."`
    },
    {
      type: "code",
      text: `// ── Feature flags: starting simple ──

// Level 1: environment variable
// Good enough when you're starting out.
// Downside: you need to redeploy to change the value.

const SHOW_NEW_DASHBOARD = process.env.SHOW_NEW_DASHBOARD === 'true';

// In your component:
if (SHOW_NEW_DASHBOARD) {
  return <NewDashboard />;
} else {
  return <OldDashboard />;
}

// Level 2: database-backed flag
// Toggle it from an admin panel without deploying anything.
// This is where it gets really useful.

const isEnabled = async (flagName) => {
  const flag = await db.flags.findOne({ name: flagName });
  return flag?.enabled === true;
};

// In your route:
const showNewCheckout = await isEnabled('new-checkout-flow');
if (showNewCheckout) {
  return renderNewCheckout();
}
return renderOldCheckout();

// ── IMPORTANT: clean up your flags ──
// A flag that's been 100% enabled for two weeks is just
// dead code with extra steps. Once a feature is fully live:
//   1. Delete the if/else — keep only the new code path
//   2. Delete the flag from the database
//   3. Delete the environment variable
// Set a reminder when you create the flag: "clean this up in 2 weeks."`
    },

    // ── Database migrations ──
    {
      speaker: "you",
      text: `"Okay, migrations. I've been just editing the database directly in production when I need to add a column. I'm guessing that's bad."`
    },
    {
      speaker: "raj",
      text: `"Very. What if you make a typo and drop the wrong column? What if two people both run changes on the database at the same time? And how does anyone else on the team — or your staging environment — know what changes you made? If you edited production directly, none of that is tracked anywhere."`
    },
    {
      speaker: "you",
      text: `"So a migration is just... a script that makes the database change?"`
    },
    {
      speaker: "raj",
      text: `"Exactly. A migration file is code that describes a database change — add this column, create this table, rename this field. You commit it to git like any other code. When you deploy, the migration runs automatically. Your staging environment runs the same migration. Your teammates run the same migration. Everyone's database is in sync."`
    },
    {
      speaker: "you",
      text: `"What if the migration goes wrong? Can I undo it?"`
    },
    {
      speaker: "raj",
      text: `"That's exactly why migration files have two parts: an 'up' function that makes the change, and a 'down' function that undoes it. If something goes wrong, you run the down migration to roll back. You need to write both — not just the up. The down is your safety net."`
    },
    {
      type: "code",
      text: `// ── A migration file (using Knex.js as an example) ──
// File: migrations/20240415_add_display_name_to_users.js

exports.up = async (knex) => {
  // This is what happens when you deploy (or run 'knex migrate:latest')
  await knex.schema.alterTable('users', (table) => {
    table.string('display_name').nullable();
    // nullable() means existing rows can have NULL here — important!
    // If you add NOT NULL without a default, it will fail on a table with data.
  });
};

exports.down = async (knex) => {
  // This is how you undo it (run 'knex migrate:rollback')
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('display_name');
  });
};

// ── Running migrations ──
// Run all pending migrations:
npx knex migrate:latest

// Undo the most recent migration:
npx knex migrate:rollback

// ── The golden rules for migrations ──
// 1. Always write a 'down' function — it's your rollback
// 2. Add new columns as nullable() first — don't add NOT NULL to a table with existing data
// 3. Never edit an old migration file — write a new one
// 4. Test your migration on staging before running it on production
// 5. Know how to undo it before you apply it`
    },

    // ── Hotfixes ──
    {
      speaker: "you",
      text: `"Last question — what do I do when something breaks in production right now? Like, a bug is live and users are affected. Do I still have to go through the whole branch and PR process?"`
    },
    {
      speaker: "raj",
      text: `"Yes. Still a branch. Still a PR. But faster. I know that feels counterintuitive when things are on fire, but here's what happens when you SSH in and edit directly: you fix it, you breathe a sigh of relief — and then the next time you deploy, the pipeline deploys from main, which doesn't have your live fix. You've just reintroduced the bug. And now nobody knows what you changed or when."`
    },
    {
      speaker: "you",
      text: `"Okay. So what's the actual process?"`
    },
    {
      speaker: "raj",
      text: `"Make a branch called hotfix/whatever. Make the smallest possible fix — don't refactor nearby code, don't clean things up, just fix the specific bug. Open a PR, label it hotfix, ask one person to review it quickly. CI has to pass. Merge it. It deploys via the pipeline. Done. It takes maybe fifteen minutes more than the cowboy fix. And this time it actually sticks."`
    },
    {
      speaker: "you",
      text: `"What about after the fire is out?"`
    },
    {
      speaker: "raj",
      text: `"Write a post-mortem. Doesn't have to be long — just: when did it break, when did you notice, what caused it, what did you do to fix it, and most importantly, what will you do so it doesn't happen again. That last part is the only part that matters in the long run. The bug is a symptom. The post-mortem is how you fix the underlying cause."`
    },
    {
      type: "code",
      text: `// ── The hotfix process ──

// 1. Branch from the latest main
git checkout main
git pull origin main
git checkout -b hotfix/login-page-crash

// 2. Make the smallest possible fix
// Don't refactor. Don't 'clean up nearby code while you're here.'
// Fix only the bug. Nothing else.
git add src/pages/Login.jsx
git commit -m "fix(login): handle missing user session on page load

Session was undefined when user visited /login directly.
Added null check before accessing session.user.

Closes #89"

// 3. Push and open a PR
git push origin hotfix/login-page-crash
// Label it [HOTFIX], explain what broke and what the fix does.
// Ask one person to review. One is enough in an emergency.

// 4. CI still has to pass. No exceptions.
//    "It's urgent" doesn't mean tests stop mattering.

// 5. Merge → pipeline deploys → check that it's fixed.

// ── After the hotfix: write a post-mortem ──
// Keep it short. Answer these:
//
// WHAT HAPPENED:    Login page crashed for all users for ~20 minutes
// WHEN:             Noticed at 3:15pm, resolved at 3:42pm
// ROOT CAUSE:       Missing null check when session doesn't exist
// WHY IT GOT PAST REVIEW: No test for the direct /login navigation case
// ACTION ITEMS:
//   → Add test for unauthenticated direct page access (ticket #90)
//   → Add monitoring alert for 5xx error rate spike (ticket #91)
//
// The point isn't to blame anyone. It's to make sure
// this specific class of bug can't happen again.`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Alright — let's come back to where you started. Committing straight to main, no CI, deploying by SSH-ing in and doing git pull. What do you think about that now?"`
    },
    {
      speaker: "you",
      text: `"It works when it's just me. But the moment there are other people, or the stakes go up, it falls apart really fast."`
    },
    {
      speaker: "raj",
      text: `"Exactly. None of this stuff — branches, PRs, CI, staging environments — is bureaucracy for its own sake. Each piece solves a specific, real problem. Branches so you don't overwrite each other. PRs so someone catches your bugs before they ship. CI so you find out immediately when something breaks. Staging so production surprises are rare. Version numbers so people know what they're getting."`
    },
    {
      speaker: "you",
      text: `"It sounds like a lot to set up."`
    },
    {
      speaker: "raj",
      text: `"Do it in order. This week: .gitignore for your .env, start using branches, write better commit messages. Next week: set up a basic CI pipeline with GitHub Actions. After that: branch protection, staging environment. You don't have to do it all at once. You just have to start. Each piece pays off the first time it catches a mistake before it becomes an incident."`
    },

    {
      type: "summary",
      points: [
        "A branch is your own copy of the codebase to work on separately. You do all your changes there without touching main — the official, live version — until your work is done and reviewed. Branches should be short-lived: days, not weeks. The longer a branch stays open, the more main moves away from it, and the harder the eventual merge becomes. This is called merge debt and it compounds daily.",
        "A pull request (PR) is how your branch gets reviewed and merged into main. Write a description that answers four questions: what changed, why, how you tested it, and what reviewers should focus on. Keep PRs small — big PRs don't get real review. If your feature is large, break it into multiple small PRs, each focused on one thing. When the PR is approved and CI passes, it merges into main.",
        "Commit messages are documentation. The diff already shows what changed — the message has to explain why. Use Conventional Commits: feat: for new features, fix: for bug fixes, chore: for maintenance. A good message is 'fix(login): handle missing session on direct page load.' A bad message is 'fix' or 'wip'. The person reading the history in six months — probably you — will thank you.",
        "Branch protection rules make the process automatic. Turn them on in GitHub under Settings → Branches → Add rule. At minimum: require a PR before merging, require CI to pass, require one approval, and apply these rules to admins too. Once these are on, nobody can push directly to main — the rules enforce themselves without relying on anyone's memory or willpower.",
        "CI (Continuous Integration) runs your tests automatically every time someone pushes code. Set it up with GitHub Actions — a YAML file in your repo that says 'on every push, run install, lint, and test.' If any step fails, the PR shows a red X and can't be merged. This catches broken code before it ever reaches main. CD (Continuous Deployment) extends this by automatically deploying when tests pass — no manual steps, no 'I forgot to restart the server.'",
        "Environments are safety nets between your code and real users. Local is your laptop — break things freely here. Staging is a server that mirrors production — deploy here first and verify things work. Production is the live site — real users, real data, real consequences. Every bug you catch in staging is one that never hits users. Configuration that changes between environments (database URLs, API keys) always goes in environment variables, never hardcoded in the code.",
        "Secrets — API keys, database passwords, JWT secrets — never belong in git. Add .env to .gitignore immediately, and if you've already committed it, rotate every key it contained. Commit a .env.example with placeholder values so teammates know what variables the app needs. Store real secrets in GitHub's repository secrets settings and inject them into your pipeline as environment variables. Once stored, no one reads the raw value — it's masked in logs and injected only at runtime.",
        "Database migrations are scripts that make database changes in a trackable, reversible, repeatable way. Instead of editing the database directly, you write a migration file with an 'up' function (make the change) and a 'down' function (undo it). Commit it to git. Run it via your deploy pipeline. Now staging runs the same migration, teammates run the same migration, and everything stays in sync. Add new columns as nullable first — adding NOT NULL to a column on an existing table with data will fail.",
        "Feature flags are on/off switches for features in your running app. You deploy the code but keep the feature hidden behind a flag. When you're ready, you flip the flag — no new deployment needed. This lets you ship code continuously in small pieces without exposing unfinished work to users, and gives you a fast rollback if something goes wrong (turn the flag off in seconds, without reverting a deploy). Start with environment variables; graduate to database-backed flags you can toggle from an admin panel. Always delete flags once the feature is fully live — a flag at 100% is dead code with extra steps.",
        "Hotfixes need to go through the same branch and PR process as normal changes — just faster. Skipping it to edit production directly means your fix disappears on the next deploy, nothing is reviewed, and no one knows what changed at what time. Branch from main, make the smallest possible fix, get one person to review it, let CI run, merge via pipeline. It takes fifteen more minutes than the cowboy fix, but it actually sticks. After the incident is resolved, write a short post-mortem: what happened, root cause, and specific action items to prevent it happening again. The incident is a symptom; the post-mortem fixes the cause."
      ]
    }
  ]
};

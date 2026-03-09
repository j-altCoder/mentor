// ─────────────────────────────────────────────────────────────────
//  LESSON: Dependency Risk & Security
//  Category: Security & Production Operations
// ─────────────────────────────────────────────────────────────────

const LESSON_DEPENDENCY_SECURITY = {
  category: "Security & Production Operations",
  tag: "Dependency Risk & Security",
  title: "You Didn't Write 97% of Your Code",
  intro: "Raj opens your package.json on his screen. '38 direct dependencies,' he says. 'npm tells me you have 847 total.' He lets that sit for a second. 'You wrote maybe 3% of what ships to your users. How do you think about the security of the other 97%?'",
  scenes: [

    // ── The supply chain problem ──
    {
      speaker: "raj",
      text: `"Before we get into tools — what makes the npm ecosystem specifically risky?"`
    },
    {
      speaker: "you",
      text: `"Deep transitive trees? You pull in one package and it drags in twenty others."`
    },
    {
      speaker: "raj",
      text: `"And the trust model. When you npm install a package, you're not just trusting that author. You're trusting every maintainer of every transitive dependency, for every version they've ever published. Do you know the left-pad incident?"`
    },
    {
      speaker: "you",
      text: `"The developer who unpublished it and broke builds everywhere?"`
    },
    {
      speaker: "raj",
      text: `"Eleven lines of code. Pad a string with spaces. React, Babel, every major project in the ecosystem — all broken because one person decided to unpublish a utility. That was availability. But the scarier story is event-stream, 2018. Popular package with millions of weekly downloads. Maintainer burned out, transferred ownership to a stranger. The stranger added a malicious dependency that specifically targeted Bitcoin wallet credentials. It was in production for weeks before anyone noticed. You didn't install a malicious package. You installed a legitimate package whose maintainer handed the keys to an attacker. That's the threat model."`
    },
    {
      type: "analogy",
      text: "Your node_modules is a restaurant kitchen staffed by 847 people. You hired 38 of them — you checked their references, read their CVs. Each of those 38 hired their own staff, who hired their own staff. You've never met most of them, and they all have access to the food going out to your customers. You wouldn't accept that in a real kitchen. But most teams npm install without a second thought."
    },

    // ── npm audit ──
    {
      speaker: "raj",
      text: `"npm audit. What does it actually check?"`
    },
    {
      speaker: "you",
      text: `"Compares your installed packages against a database of known CVEs."`
    },
    {
      speaker: "raj",
      text: `"And what can't it see?"`
    },
    {
      speaker: "you",
      text: `"Anything that hasn't been reported yet. A new malicious publish wouldn't be in the database."`
    },
    {
      speaker: "raj",
      text: `"Right. npm audit tells you about known, disclosed vulnerabilities. The event-stream attack wouldn't have triggered it for weeks — the database only knows about things after someone reports them. Think of audit as the floor, not the ceiling. It's the minimum check. Run it on every CI pipeline, fail builds on high and critical severity. But don't mistake passing npm audit for being secure."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// NPM AUDIT — USAGE AND CI INTEGRATION
// ─────────────────────────────────────────────────────

// Basic audit — lists all vulnerabilities with severity and fix availability
// npm audit

// Audit production dependencies only (skip devDependencies — they don't ship)
// npm audit --omit=dev

// Fail CI on high or critical severity (the right threshold for most teams)
// npm audit --audit-level=high --omit=dev

// JSON output — pipe to tools or parse in CI
// npm audit --json

// Fix what can be fixed automatically (patch/minor updates only)
// npm audit fix

// Fix including breaking changes — use carefully, test everything after
// npm audit fix --force

// ── CI integration ──
// package.json:
{
  "scripts": {
    "audit:ci": "npm audit --audit-level=high --omit=dev"
  }
}
// Exits non-zero if high/critical found → CI step fails → blocks deploy

// ── Reading severity levels ──
const severityGuide = {
  critical: 'Block everything. Typically RCE or auth bypass. Fix before next deploy.',
  high:     'Fix this sprint. Data exposure, privilege escalation.',
  moderate: 'Requires unusual conditions to exploit. Schedule fix.',
  low:      'Theoretical. Fix when you\'re touching that package anyway.',
};

// ── The devDependency trap ──
// A vulnerability in webpack or jest doesn't ship to users.
// But it can compromise your CI/CD pipeline or developer machines.
// A compromised build tool could inject malicious code into your production bundle.
// Treat build tool vulnerabilities seriously too — they own your supply chain.`
    },

    // ── Lock files ──
    {
      speaker: "raj",
      text: `"package-lock.json. I've seen developers .gitignore it. Why is that a security problem, not just a reproducibility problem?"`
    },
    {
      speaker: "you",
      text: `"Without the lock file, npm install resolves fresh each time — you might get different versions on different machines."`
    },
    {
      speaker: "raj",
      text: `"That's the reproducibility argument. The security argument is the integrity hashes. Every entry in the lock file includes an SHA-512 hash of the package tarball. When you run npm ci — which you should be using in CI, not npm install — it verifies every downloaded package against those hashes. If a package was tampered with on the registry after your last install — bytes changed, malicious code injected — the hash won't match and the install fails hard. Without the lock file, you don't have those hashes. npm install re-resolves the full tree and takes whatever the registry serves today. Committing the lock file is like signing a manifest: these exact bits were here when we tested. Without it you have no manifest to verify against."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// LOCK FILES — SECURITY PROPERTIES
// ─────────────────────────────────────────────────────

// npm install:  resolves versions, may update lock file, installs packages
// npm ci:       reads lock file exactly, fails if it doesn't match package.json,
//               deletes and reinstalls node_modules fresh, NEVER modifies lock file

// Always use npm ci in CI/CD — never npm install:
// .github/workflows/deploy.yml
// steps:
//   - name: Install
//     run: npm ci   # guaranteed exact reproducibility + integrity check

// ── What the lock file actually stores ──
// package-lock.json (excerpt):
{
  "node_modules/lodash": {
    "version":   "4.17.21",
    "resolved":  "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
    "integrity": "sha512-v2kDE8oqrmuH..."  // SHA-512 of the tarball
  }
}
// If registry serves different bytes: "npm ERR! integrity check failed for lodash"
// The install fails. You don't silently get tampered code.

// ── Detecting lock file drift ──
// If package.json and package-lock.json are out of sync, npm ci fails:
// "npm ERR! cipm can only install packages when your package.json and
//  package-lock.json are in sync."
// This is intentional — it forces someone to deliberately update the lock file
// before a deployment can proceed.

// ── .npmrc: point to private registry mirror ──
// Large orgs proxy the npm registry through Artifactory or Verdaccio
// Packages are scanned before entering the mirror — supply chain control
// .npmrc:
// registry=https://npm.yourcompany.com
// //npm.yourcompany.com/:_authToken=\${NPM_TOKEN}`
    },

    // ── Snyk ──
    {
      speaker: "raj",
      text: `"Snyk. You've heard of it. What does it add that npm audit doesn't?"`
    },
    {
      speaker: "you",
      text: `"A bigger vulnerability database? And it opens fix PRs automatically?"`
    },
    {
      speaker: "raj",
      text: `"Those are true but the one I care most about is reachability analysis. npm audit reports every vulnerable package in your tree whether or not your code actually calls the vulnerable function. A critical vulnerability in a package you import but never invoke the affected code path — Snyk can mark it unreachable and de-prioritise it. That's a massive signal-to-noise improvement. When you're triaging ten 'critical' vulnerabilities at 5pm on a Friday, knowing which ones are actually reachable in your code versus which are theoretical saves you from the wrong panic. The other meaningful addition: it scans beyond npm. Dockerfiles, GitHub Actions workflows, Terraform configs. A vulnerable base image in your Dockerfile is as much a supply chain risk as a vulnerable package — npm audit doesn't know Dockerfiles exist."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SNYK — SETUP AND CI INTEGRATION
// ─────────────────────────────────────────────────────

// npm install -g snyk
// snyk auth        → authenticates via browser

// ── Scan commands ──
// snyk test                              → scan dependencies
// snyk test --severity-threshold=high    → only high/critical
// snyk container test my-image:latest    → scan Docker image layers
// snyk iac test                          → scan Terraform / k8s manifests
// snyk monitor                           → upload snapshot for ongoing monitoring

// ── GitHub Actions integration ──
// .github/workflows/security.yml
name: Security
on: [push, pull_request]
jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

// ── .snyk policy — document accepted risks ──
// When you've assessed a vuln and confirmed it's not reachable:
// snyk ignore --id=SNYK-JS-LODASH-567746 --reason="template fn not called" --expiry=2025-12-31
// Committed to repo as .snyk file — reviewed when it expires

// ── Snyk vs npm audit ──
const toolChoice = {
  'npm audit': 'Built in, no account, run on every project as the baseline',
  'snyk':      'Production apps, reachability analysis, Docker/IaC scanning, fix PRs',
};`
    },

    // ── Dependabot ──
    {
      speaker: "raj",
      text: `"Dependabot. What's the idea behind it?"`
    },
    {
      speaker: "you",
      text: `"It automatically opens PRs to update dependencies — for both vulnerabilities and regular version updates."`
    },
    {
      speaker: "raj",
      text: `"What's the security insight behind keeping dependencies current — beyond just getting bug fixes?"`
    },
    {
      speaker: "you",
      text: `"The longer you go without updating, the bigger the delta when you finally do update — which makes it riskier."`
    },
    {
      speaker: "raj",
      text: `"Exactly. Vulnerabilities are almost always fixed in newer versions. If you're three major versions behind, every CVE in those versions is a CVE in your app. Staying current means the window between 'vulnerability published' and 'you're protected' is measured in days, not months. Small patch updates are low-risk and easy to review. Jumping three majors at once because you let things drift is high-risk and often breaks things. The problem with Dependabot if you don't configure it carefully: it floods your PR queue. 847 packages, each with its own release cadence — you'll drown. Group related packages into single PRs and set a reasonable schedule."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// DEPENDABOT CONFIGURATION
// ─────────────────────────────────────────────────────

// .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"

    # Cap open PRs — without this you'll have 30 PRs open at once
    open-pull-requests-limit: 5

    # Group related packages into one PR — massive noise reduction
    groups:
      react-ecosystem:
        patterns: ["react", "react-*", "@types/react*"]
      testing:
        patterns: ["jest*", "vitest*", "@testing-library/*"]
      linting:
        patterns: ["eslint*", "prettier*", "@typescript-eslint/*"]

    # Don't auto-open PRs for major version bumps — those need manual review
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]

    reviewers: ["your-team"]
    labels: ["dependencies"]

  # Also keep GitHub Actions up to date — they're supply chain too
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  # And Docker base images
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"

// ── Auto-merge patches after CI passes (reduces review burden) ──
// .github/workflows/auto-merge.yml
name: Auto-merge Dependabot patches
on: pull_request
jobs:
  merge:
    if: github.actor == 'dependabot[bot]'
    runs-on: ubuntu-latest
    steps:
      - uses: dependabot/fetch-metadata@v1
        id: meta
      - if: steps.meta.outputs.update-type == 'version-update:semver-patch'
        run: gh pr merge --auto --squash "\${{ github.event.pull_request.number }}"
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}`
    },

    // ── Supply chain attacks ──
    {
      speaker: "raj",
      text: `"Hardest scenario. A package you depend on hasn't got a CVE — the maintainer's npm account was just hacked. A new version with malicious code was published 20 minutes ago. npm audit shows nothing. Snyk shows nothing. What are your layers of defence against that?"`
    },
    {
      speaker: "you",
      text: `"The lock file helps — we won't pick up the new version automatically since we're on a pinned version."`
    },
    {
      speaker: "raj",
      text: `"That's the most important one. You're insulated from new malicious versions until you explicitly run an update. What else?"`
    },
    {
      speaker: "you",
      text: `"Behaviour-based scanning? Something that looks at what the package actually does rather than just matching CVE IDs?"`
    },
    {
      speaker: "raj",
      text: `"Socket.dev does exactly that. It analyses package behaviour at publish time — flags packages that suddenly start making outbound network calls, accessing environment variables at install time, or that transferred ownership recently. It's not CVE matching, it's anomaly detection. It would have caught event-stream. And then there's the runtime layer: if a compromised package runs in a container that has no outbound network access except to your database, it can't exfiltrate your credentials anywhere. Principle of least privilege. The malicious code runs but it can't do anything useful. Defence in depth again — you're not counting on any single layer."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// SUPPLY CHAIN HARDENING
// ─────────────────────────────────────────────────────

// ── Socket.dev — behaviour-based analysis ──
// GitHub app: scans every PR that adds or updates a dependency
// Flags packages that:
//   • Added install scripts (postinstall/preinstall) since last version
//   • Started making outbound network requests
//   • Access process.env at install time
//   • Changed ownership or maintainers recently
//   • Contain obfuscated code or base64-encoded payloads
// CLI: npx socket npm install <package>  (scans before installing)

// ── Restrict install scripts — common attack vector ──
// Supply chain attacks often use postinstall scripts to run on npm install
// .npmrc:
// ignore-scripts=true   (breaks some packages but safest)
// Or per-install: npm install --ignore-scripts

// ── Pin GitHub Actions to commit SHAs, not tags ──
// Tags are mutable — an attacker who compromises the action repo can push
// new code to the v3 tag. The SHA is immutable.

// UNSAFE — tag is mutable:
uses: actions/checkout@v4

// SAFE — SHA is immutable:
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

// ── Limit blast radius at runtime ──
// If a dependency IS compromised, make sure it can't do much damage

// Docker — run as non-root:
// FROM node:20-alpine
// RUN addgroup -S app && adduser -S app -G app
// USER app
// Even if malicious code runs, it can't write to system directories

// Kubernetes — restrict egress:
// NetworkPolicy that only allows your pod to reach your DB and HTTPS
// Compromised package tries to phone home → network policy blocks it

// ── Reproducible build checklist ──
const checklist = [
  '✓ package-lock.json committed, never .gitignored',
  '✓ npm ci in all CI/CD pipelines — never npm install',
  '✓ npm audit --omit=dev --audit-level=high on every CI run',
  '✓ Snyk scanning PRs that change dependencies',
  '✓ Socket.dev GitHub app installed on the repo',
  '✓ Dependabot enabled with grouped PRs and open-PRs cap',
  '✓ GitHub Actions pinned to SHA not tags',
  '✓ Containers run as non-root with egress network policy',
];`
    },

    // ── Responding to a vulnerability ──
    {
      speaker: "raj",
      text: `"Last one. It's 4pm Friday. npm audit flags a critical vulnerability in a transitive dependency. What do you actually do?"`
    },
    {
      speaker: "you",
      text: `"Read the CVE. Check if it's actually reachable in our code. If a fix exists, update. If not..."`
    },
    {
      speaker: "raj",
      text: `"Before you update anything — what's the first question?"`
    },
    {
      speaker: "you",
      text: `"Is it in production? Or only devDependencies?"`
    },
    {
      speaker: "raj",
      text: `"That. A critical severity in a devDependency doesn't ship to users. Still matters for CI pipeline security, but it's a different urgency. If it's production: read the CVE, not just the severity score. CVSS critical doesn't mean it's exploitable in your context. Does the attack require user input you sanitise? Does it require a code path you don't call? Document your assessment. If it's reachable and there's a fix — update, test, ship. If there's no fix yet: patch-package for a local fix committed to your repo, snyk ignore with a documented rationale and an expiry date so you revisit it. Never ignore without a written-down reason and a deadline to reassess."`
    },
    {
      type: "code",
      text: `// ─────────────────────────────────────────────────────
// RESPONDING TO A VULNERABILITY
// ─────────────────────────────────────────────────────

// Step 1: Scope it
// • Production dependency or devDependency? (npm audit --omit=dev filters correctly)
// • Is the vulnerable code path reachable? (Snyk reachability, read the CVE)
// • What does exploitation actually require? User input? Network access? Root?

// Step 2: Choose response
// Case A — fix available:
//   npm audit fix          (if patch/minor update)
//   npm audit fix --force  (if semver-breaking — check changelog, test fully)

// Case B — no fix yet, vulnerability is reachable:
//   Use patch-package to apply a local fix:
//   1. Edit the file in node_modules/vulnerable-pkg/index.js
//   2. npx patch-package vulnerable-pkg
//      → creates patches/vulnerable-pkg+1.2.3.patch (committed to git)
//   3. package.json:  "postinstall": "patch-package"
//      → patch applied on every npm ci automatically
//   4. Open upstream issue — this is temporary

// Case C — vulnerability is not reachable in your code:
//   snyk ignore --id=CVE-XXXX --reason="function not called in this project" --expiry=2025-06-01
//   → committed to .snyk file, expires and forces reassessment

// ── The Friday afternoon calculus ──
// Critical severity + reachable + fix available → deploy the fix, even on Friday
// Critical severity + devOnly                  → note it, fix Monday
// Critical severity + not reachable            → document assessment, revisit in 30 days
// Critical severity + no fix + reachable       → patch-package or replace the package
//
// "Never deploy on Fridays" is less important than "never leave a reachable critical vuln
// in production over the weekend unaddressed". Assess first. Then decide.`
    },

    {
      type: "summary",
      points: [
        "You wrote about 3% of what ships. Every transitive dependency is code from authors you've never vetted, running with your app's privileges. The threat model includes maintainer account takeovers, not just known CVEs.",
        "npm audit compares against known, disclosed vulnerabilities. It's the floor. It would not have caught the event-stream attack for weeks. Run it on every CI build, fail on high and critical, but don't mistake passing audit for being secure.",
        "package-lock.json stores cryptographic integrity hashes for every package. npm ci verifies those hashes on install — tampered packages cause a hard failure. Never .gitignore it. Always use npm ci in pipelines, never npm install.",
        "Snyk adds reachability analysis — the difference between 'this vulnerable function exists in your tree' and 'your code actually calls it'. Massive signal-to-noise improvement. Also scans Dockerfiles and GitHub Actions.",
        "Dependabot keeps you current. Small frequent updates are low-risk. Letting dependencies drift means large risky catch-up migrations when you eventually do update. Group related packages to manage PR noise.",
        "Supply chain attacks that bypass CVE databases: lock files protect you from new malicious versions being auto-installed. Socket.dev catches anomalous package behaviour (new network calls, env var access, ownership changes).",
        "Pin GitHub Actions to commit SHAs, not tags. Tags are mutable — a compromised action repo can push malicious code to the v3 tag with no change in your workflow file.",
        "Runtime least-privilege limits blast radius: non-root containers, network egress policies. If compromised code can't reach the internet, it can't exfiltrate credentials even if it runs.",
        "When a vulnerability is found: scope it (production vs dev, reachable vs not), read the actual CVE, then choose fix / patch-package / snyk-ignore with documented rationale and expiry."
      ]
    }
  ]
};

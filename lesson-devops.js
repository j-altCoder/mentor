// ─────────────────────────────────────────────────────────────────
//  LESSON: DevOps & Deployment
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_DEVOPS = {
  category: "Architecture & System Design",
  tag: "DevOps & Deployment",
  title: "How Code Gets From Your Laptop to Production Without Breaking Everything",
  intro: "3pm on a Friday. You've just merged a big feature. Someone asks 'so how do we deploy this?' You realise you've never actually thought about what happens between git push and the app being live. Raj has a whiteboard marker in his hand.",
  scenes: [

    // ── What CI/CD actually is ──
    {
      speaker: "raj",
      text: `"Before we touch deployment — what does CI/CD actually stand for and why does it exist?"`
    },
    {
      speaker: "you",
      text: `"Continuous Integration and Continuous Deployment? Automating deploys?"`
    },
    {
      speaker: "raj",
      text: `"Right, but the <em>why</em> matters more than the name. Before CI/CD, teams would work in isolation for weeks, then try to merge everything at once — integration hell. Tests would fail, environments would differ, deploying was a manual ceremony that took hours and had to happen at 2am to avoid users. CI means every code change is integrated into the main branch frequently — at least daily — and automatically tested. CD means every passing change can be deployed to production automatically, or with a single click. The goal: make deployments boring. Small, frequent, automated. A deploy should be a non-event, not a production incident waiting to happen."`
    },
    {
      type: "analogy",
      text: "CI/CD = a car assembly line with quality checks at every stage. Each component is tested as it's added, not all at once when the car is finished. If something fails, you catch it at the bolt, not when the whole car falls apart. And the finished cars roll off the line continuously — not in one panicked batch at 2am."
    },

    // ── GitHub Actions pipeline ──
    {
      speaker: "you",
      text: `"How do you actually set up a CI pipeline? We use GitHub — where do I start?"`
    },
    {
      speaker: "raj",
      text: `"GitHub Actions. You create a YAML file in <em>.github/workflows/</em> and GitHub runs it automatically on whatever triggers you define — push, pull request, a schedule. The file describes <em>jobs</em> — each job runs on a fresh virtual machine. Inside jobs are <em>steps</em> — each step runs a command or a pre-built action. A typical CI pipeline for a Node app: trigger on every pull request, install dependencies with npm ci, run the linter, run the tests with coverage, build the app. If any step fails, the pipeline fails, the PR is blocked, and the developer gets an email. Nothing broken reaches main."`
    },
    {
      type: "code",
      text: `# .github/workflows/ci.yml
name: CI

on:
  pull_request:         # runs on every PR
  push:
    branches: [main]    # and on every push to main

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongo:            # spin up a real MongoDB for integration tests
        image: mongo:7
        ports: ['27017:27017']

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'          # cache node_modules between runs (faster)

      - run: npm ci             # deterministic install from lock file

      - run: npm run lint       # fail fast on lint errors

      - run: npm test -- --coverage --ci
        env:
          DATABASE_URL: mongodb://localhost:27017/test
          JWT_SECRET:   test-secret-not-real

      - uses: codecov/codecov-action@v4  # upload coverage report
        with:
          token: \${{ secrets.CODECOV_TOKEN }}

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit --audit-level=high`
      }
    },

    // ── What Docker actually does ──
    {
      speaker: "you",
      text: `"I've heard Docker explained a hundred ways. What's the simplest accurate explanation?"`
    },
    {
      speaker: "raj",
      text: `"Docker packages your application and everything it needs to run — the Node version, npm packages, OS libraries, config — into a single <em>image</em>. You run that image and get a <em>container</em> — an isolated process that thinks it has its own filesystem and network. The key insight: the image runs identically everywhere. Your laptop, your CI server, your production cloud — same image, same behaviour. No more 'it works on my machine'. The image is immutable. You don't patch a running container — you build a new image and replace the container. That's what makes rollbacks trivial and deployments predictable."`
    },
    {
      speaker: "you",
      text: `"How is a container different from a virtual machine?"`
    },
    {
      speaker: "raj",
      text: `"A VM virtualises the entire hardware stack and runs a full operating system inside. Heavy — a VM with Ubuntu takes gigabytes of disk and seconds to start. A container shares the host OS kernel — only the application layer is isolated. Lightweight — an Alpine-based Node container is 50MB and starts in milliseconds. The isolation is lighter than a VM, but for 99% of web applications that's perfectly fine and far more practical."`
    },
    {
      type: "code",
      text: `# Dockerfile — production-ready multi-stage build
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production    # only production deps

# Stage 2: Build (if TypeScript or bundling needed)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build               # compile TypeScript → dist/

# Stage 3: Final image — as small as possible
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user (security best practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]

# Multi-stage = final image has NO dev tools, NO source files, NO TypeScript compiler
# Result: 80-100MB instead of 800MB

# .dockerignore — never copy these into the image
node_modules
.env
.env.*
dist
coverage
.git
*.test.js`
      }
    },

    // ── Docker Compose ──
    {
      speaker: "you",
      text: `"What's Docker Compose for? How is it different from just running Docker?"`
    },
    {
      speaker: "raj",
      text: `"Docker runs one container at a time. <em>Docker Compose</em> defines and runs multiple containers as a single application — your API container, a MongoDB container, a Redis container, all configured together in one YAML file. One command — <em>docker compose up</em> — starts everything, creates a shared network so containers can reach each other by service name, and mounts volumes. It's not a production orchestration tool — that's Kubernetes. Compose is for local development and simple single-server deployments. It solves 'I need to run my full stack locally without installing MongoDB and Redis on my machine'."`
    },
    {
      type: "code",
      text: `# docker-compose.yml — full local dev stack
services:
  api:
    build: .                      # build from local Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=mongodb://mongo:27017/myapp  # 'mongo' = service name below
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./src:/app/src             # mount source — changes reflect without rebuild
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_started
    command: npm run dev           # override CMD for dev (nodemon)

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db        # persist data between restarts
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:

# Commands
# docker compose up -d          — start all services in background
# docker compose logs -f api    — follow API logs
# docker compose down           — stop and remove containers
# docker compose down -v        — also delete volumes (wipe data)`
      }
    },

    // ── PM2 ──
    {
      speaker: "you",
      text: `"We still use PM2 on some servers instead of Docker. What does PM2 actually give us that just running node doesn't?"`
    },
    {
      speaker: "raj",
      text: `"Four things node alone can't do. <em>Process management</em> — if your Node process crashes, PM2 restarts it automatically within seconds. Without it, a crash means the server is down until someone manually restarts it. <em>Clustering</em> — PM2 forks your app across all CPU cores. A 4-core server running one Node process uses 25% of available CPU. PM2 with <em>-i max</em> runs 4 workers and a master process, using all 4 cores. <em>Zero-downtime reloads</em> — pm2 reload sends SIGINT to each worker one at a time, waits for it to drain existing connections, starts a fresh worker, then moves to the next. Users never hit a dead worker. <em>Log management</em> — aggregates logs from all workers, rotates log files, timestamps everything."`
    },
    {
      type: "code",
      text: `# PM2 — process manager for Node in production

# Basic usage
pm2 start src/index.js --name api   # start with name
pm2 list                             # show running processes
pm2 logs api                         # tail logs
pm2 restart api                      # hard restart (brief downtime)
pm2 reload api                       # zero-downtime reload (rolling restart)
pm2 stop api                         # stop without removing
pm2 delete api                       # stop and remove

# Cluster mode — use all CPU cores
pm2 start src/index.js --name api -i max
# max = number of logical CPU cores
# With 4 cores: 4 worker processes + 1 master

# ecosystem.config.js — version-controlled PM2 config
module.exports = {
  apps: [{
    name:         'api',
    script:       'dist/index.js',
    instances:    'max',           // cluster across all CPU cores
    exec_mode:    'cluster',
    watch:        false,           // never watch in production
    max_memory_restart: '500M',    // restart if process exceeds 500MB
    env_production: {
      NODE_ENV:  'production',
      PORT:      3000
    },
    error_file:  './logs/error.log',
    out_file:    './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};

# Deploy with ecosystem file
pm2 start ecosystem.config.js --env production

# Survive server reboots
pm2 startup    # generates a systemd/init script to auto-start PM2
pm2 save       # saves current process list to be restored on reboot`
      }
    },

    // ── Rolling vs Blue-Green deployments ──
    {
      speaker: "you",
      text: `"Rolling deployments, blue-green deployments — what are these actually and when do you use each?"`
    },
    {
      speaker: "raj",
      text: `"These are strategies for deploying new code without downtime. <em>Rolling deployment</em>: you have N servers. You take one offline, update it, bring it back, then repeat for the next. At any point, some servers run the old code and some run the new. Traffic keeps flowing. The risk: during the rollout there are two versions of your app running simultaneously — if your new code changes the API response shape or the database schema, old and new servers might behave differently for the same request. You need to design your changes to be backwards-compatible during the transition window."`
    },
    {
      speaker: "you",
      text: `"And blue-green?"`
    },
    {
      speaker: "raj",
      text: `"<em>Blue-green</em> maintains two identical production environments — blue is live, green is idle. You deploy your new code to green. Run your smoke tests against green while blue still serves all traffic. When you're confident, flip the load balancer to send traffic to green. Green is now live. Blue sits idle as an instant rollback target — if something breaks, one command flips traffic back to blue. No rollback-by-redeployment scramble at 3am. The cost: you need double the infrastructure running at all times. The benefit: zero-downtime, instant rollback, full environment tested before any user touches it."`
    },
    {
      type: "analogy",
      text: "Rolling deployment = repainting a bridge one lane at a time while traffic still flows. Blue-green = building a completely new bridge beside the old one, testing it empty, then redirecting all traffic at once. You can re-open the old bridge instantly if the new one has problems."
    },
    {
      type: "code",
      text: `# Rolling deployment — Kubernetes example
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge:       1   # add 1 extra pod during update
      maxUnavailable: 1   # allow 1 pod to be down during update
  template:
    spec:
      containers:
        - name: api
          image: myapp/api:v2.0.0   # new version
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 3
# Kubernetes updates pods one by one
# Only marks pod ready when /health returns 200
# Never removes old pod until new pod is ready

# Blue-green deployment — Nginx config switch
# Deploy v2 to green servers (api-green:3000)
# Test: curl https://staging-green.myapp.com/api/health

# When confident — switch upstream in Nginx
upstream api_servers {
  server api-green:3000;  # was: api-blue:3000
}
nginx -s reload  # zero-downtime config reload

# Instant rollback
upstream api_servers {
  server api-blue:3000;   # flip back to blue
}
nginx -s reload`
      }
    },

    // ── Canary deployments ──
    {
      speaker: "you",
      text: `"I've also heard of canary deployments. Is that different again?"`
    },
    {
      speaker: "raj",
      text: `"Yes — canary is a hybrid. Instead of switching all traffic at once, you send a small percentage — say 5% — to the new version and watch for errors, latency spikes, and business metrics. If everything looks good, gradually increase to 10%, 25%, 50%, 100%. If something looks wrong at 5%, you cut it back to 0% and only 5% of users were affected, not everyone. Canary is powerful because it tests real production traffic against real data — things that staging environments miss. The name comes from the old mining practice of using canary birds to detect poisonous gas — the canary dies, the miners know to get out."`
    },
    {
      type: "code",
      text: `# Canary deployment — Nginx weighted traffic split
upstream api_stable {
  server api-v1-1:3000;
  server api-v1-2:3000;
}

upstream api_canary {
  server api-v2-1:3000;
}

# Split traffic: 95% stable, 5% canary
split_clients "\${remote_addr}\${http_user_agent}" $upstream_pool {
  5%   api_canary;    # 5% of users go to new version
  *    api_stable;    # 95% go to stable version
}

server {
  location /api/ {
    proxy_pass http://$upstream_pool;
  }
}

# Feature flags — another canary approach (in-app, not infrastructure)
const isCanaryUser = (userId) => {
  // Use consistent hash so same user always gets same experience
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  const bucket = parseInt(hash.slice(0, 8), 16) % 100;
  return bucket < 5; // 5% of users
};

app.get('/api/feed', asyncHandler(async (req, res) => {
  const feed = isCanaryUser(req.user.userId)
    ? await newFeedAlgorithm(req.user.userId)    // 5% get new version
    : await stableFeedAlgorithm(req.user.userId); // 95% get stable
  res.json(feed);
}));`
      }
    },

    // ── Environment management ──
    {
      speaker: "you",
      text: `"How should environments be structured? We just have dev and production right now."`
    },
    {
      speaker: "raj",
      text: `"Two environments is risky — you're testing in production or not at all. The standard is three: <em>development</em> — local machines, mocked or local services, fast feedback. <em>staging</em> — a mirror of production infrastructure with production-like data (anonymised). This is where you run integration tests, QA sign-off, load tests, and smoke tests before anything touches users. <em>production</em> — real users, real data. The critical rule: staging must actually resemble production. A staging environment running a single Docker container when production runs 10 servers behind a load balancer won't catch concurrency bugs, race conditions, or load-dependent failures."`
    },
    {
      type: "code",
      text: `# Environment-specific config — no hardcoding
# Each environment gets its own values via env vars or secrets manager

# .env.development (local only, never committed)
DATABASE_URL=mongodb://localhost:27017/myapp_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
NODE_ENV=development

# Staging and production — injected by platform (never a file)
# AWS ECS task definition, Kubernetes Secret, Heroku config vars, etc.

# Code that adapts to environment
const config = {
  db: {
    url:      process.env.DATABASE_URL,
    poolSize: process.env.NODE_ENV === 'production' ? 10 : 2
  },
  logging: {
    level:  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug'),
    format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty'
  },
  rateLimit: {
    max: process.env.NODE_ENV === 'production' ? 100 : 10000 // strict in prod, loose in dev
  }
};

# Validate all required env vars at startup — fail loudly with clear message
const required = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(\`Missing required environment variable: \${key}\`);
  }
}`
      }
    },

    // ── Database migrations ──
    {
      speaker: "you",
      text: `"What happens to the database when we deploy a new version? How do schema changes work?"`
    },
    {
      speaker: "raj",
      text: `"This is one of the trickiest parts of deployments and the most often skipped. <em>Database migrations</em> are versioned scripts that modify your schema — add a column, rename a field, create an index, backfill data. You commit them alongside your code. In CI, migrations run automatically before the new code deploys. The challenge: during a rolling deployment, old and new code run simultaneously. If your migration drops a column that the old code still reads, the old servers crash. The rule: <em>expand then contract</em>. First migration: add the new column, keep the old one. Deploy the code that writes both columns. Second migration: backfill old data into the new column. Third migration: remove the old column once the old code is gone."`
    },
    {
      type: "code",
      text: `# migrate-mongo — migration tool for MongoDB
npm install migrate-mongo

# migrate-mongo-config.js
module.exports = {
  mongodb: { url: process.env.DATABASE_URL, databaseName: 'myapp' },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog' // tracks which migrations have run
};

# Create a migration file
npx migrate-mongo create add-user-phone-field
# Creates: migrations/20240310143022-add-user-phone-field.js

# migrations/20240310143022-add-user-phone-field.js
module.exports = {
  async up(db) {
    // Add new field with default (safe — old code ignores unknown fields in MongoDB)
    await db.collection('users').updateMany(
      { phone: { $exists: false } },
      { $set: { phone: null, phoneVerified: false } }
    );
    // Create index on new field
    await db.collection('users').createIndex({ phone: 1 }, { sparse: true });
  },

  async down(db) {
    // Rollback — remove the field and index
    await db.collection('users').updateMany({}, { $unset: { phone: '', phoneVerified: '' } });
    await db.collection('users').dropIndex({ phone: 1 });
  }
};

# Run migrations in CI/CD before deploying new code
npx migrate-mongo up       # apply pending migrations
npx migrate-mongo status   # which migrations have/haven't run
npx migrate-mongo down     # rollback last migration (use with caution in production)`
      }
    },

    // ── Health checks and graceful shutdown ──
    {
      speaker: "you",
      text: `"I know we need a health check endpoint — but what should it actually check, and what's graceful shutdown?"`
    },
    {
      speaker: "raj",
      text: `"Health check should verify that the process can actually serve requests — not just that it's running. Check DB connectivity, Redis connectivity, any critical external service. A process that's up but can't reach the database should fail its health check so the load balancer stops sending it traffic. Two types: <em>liveness</em> — is the process alive at all? Should never restart a healthy app. <em>Readiness</em> — is the app ready to serve traffic? Used by load balancers and Kubernetes. A starting app isn't ready yet even if it's alive."`
    },
    {
      speaker: "you",
      text: `"And graceful shutdown?"`
    },
    {
      speaker: "raj",
      text: `"When you deploy new code, the old process gets a <em>SIGTERM</em> signal — 'please shut down'. Without graceful shutdown, the process dies immediately — any in-flight requests are cut off, database connections are abandoned. With graceful shutdown: stop accepting new connections, wait for in-flight requests to complete, close DB connections, then exit cleanly. Kubernetes and PM2 both send SIGTERM and wait a configurable timeout before force-killing with SIGKILL."`
    },
    {
      type: "code",
      text: `// Health check endpoints — liveness vs readiness
app.get('/health/live', (req, res) => {
  // Liveness — just: is the process running?
  res.json({ status: 'alive' });
});

app.get('/health/ready', asyncHandler(async (req, res) => {
  // Readiness — can it actually serve requests?
  const checks = await Promise.allSettled([
    mongoose.connection.db.admin().ping(),
    redis.ping(),
  ]);

  const dbOk    = checks[0].status === 'fulfilled';
  const redisOk = checks[1].status === 'fulfilled';

  if (!dbOk || !redisOk) {
    return res.status(503).json({
      status:  'not ready',
      db:      dbOk    ? 'ok' : 'error',
      redis:   redisOk ? 'ok' : 'error'
    });
  }

  res.json({ status: 'ready', db: 'ok', redis: 'ok' });
}));

// Graceful shutdown — handle SIGTERM from Kubernetes/PM2/Docker
const server = app.listen(3000);

const shutdown = async (signal) => {
  logger.info(\`\${signal} received — starting graceful shutdown\`);

  // 1. Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    // 2. Close DB connections after in-flight requests complete
    await mongoose.connection.close();
    await redis.quit();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // 3. Force exit after timeout (if requests don't drain fast enough)
  setTimeout(() => {
    logger.error('Graceful shutdown timeout — forcing exit');
    process.exit(1);
  }, 30000); // 30 second deadline
};

process.on('SIGTERM', () => shutdown('SIGTERM')); // Kubernetes, PM2, Docker stop
process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl+C in development`
      }
    },

    // ── Full CD pipeline ──
    {
      speaker: "raj",
      text: `"Put it all together. Walk me through a complete deployment pipeline — from git push to the app being live."`
    },
    {
      speaker: "you",
      text: `"Push to main, CI runs tests, then... deploy somehow?"`
    },
    {
      speaker: "raj",
      text: `"Let's be specific. Push to main triggers the CI pipeline: install, lint, test, security audit. All pass. Pipeline builds a Docker image, tags it with the commit SHA — not 'latest', never 'latest' — and pushes it to a container registry like ECR or Docker Hub. Then the CD pipeline triggers: run database migrations on staging, deploy the new image to staging with a rolling update, run smoke tests against staging. All pass? Deploy to production: run migrations, rolling deploy to production, automated health check monitoring for 10 minutes. Any spike in errors — automatic rollback to previous image tag. No human needed in the happy path. Human only needed when something fails."`
    },
    {
      type: "code",
      text: `# .github/workflows/deploy.yml — full CI/CD pipeline
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --ci
      - run: npm audit --audit-level=high

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image_tag: \${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id:     \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region:            us-east-1

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        id: meta
        run: |
          IMAGE=123456.dkr.ecr.us-east-1.amazonaws.com/myapp
          TAG=\${{ github.sha }}           # commit SHA as tag — never 'latest'
          docker build -t \$IMAGE:\$TAG .
          docker push \$IMAGE:\$TAG
          echo "tags=\$IMAGE:\$TAG" >> \$GITHUB_OUTPUT

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: npx migrate-mongo up         # migrations first
        env:
          DATABASE_URL: \${{ secrets.STAGING_DATABASE_URL }}

      - name: Rolling deploy to staging ECS
        run: |
          aws ecs update-service \
            --cluster staging \
            --service api \
            --force-new-deployment

      - name: Smoke test staging
        run: |
          sleep 30   # wait for deploy
          curl -f https://staging.myapp.com/health/ready

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production   # requires manual approval gate in GitHub
    steps:
      - run: npx migrate-mongo up
        env: { DATABASE_URL: \${{ secrets.PROD_DATABASE_URL }} }

      - name: Rolling deploy to production
        run: aws ecs update-service --cluster production --service api --force-new-deployment`
      }
    },

    // ── Kubernetes basics ──
    {
      speaker: "you",
      text: `"When does someone need Kubernetes? It seems like overkill for most apps."`
    },
    {
      speaker: "raj",
      text: `"It often is overkill. A single server with PM2 and Nginx handles most apps perfectly well up to millions of requests per day. You need Kubernetes when: you have many microservices that each need independent scaling. You need automatic bin-packing — efficiently distributing many small services across a fleet of servers. You need self-healing — automatically replacing crashed pods, rescheduling on failed nodes. You need sophisticated deployment strategies built in — rolling updates, canary, automatic rollback on health check failure. The honest answer: most companies are better off with a managed platform like AWS ECS, Railway, Render, or even a well-configured EC2 with PM2 before they're ready for the operational overhead of Kubernetes."`
    },
    {
      type: "code",
      text: `# Kubernetes — the core concepts you need to know for interviews

# Pod — the smallest unit, one or more containers that share network/storage
# Deployment — manages pods, handles rolling updates and rollbacks
# Service — stable network endpoint for a set of pods (pods come and go, service stays)
# Ingress — HTTP routing rules, SSL termination, load balancing into services
# ConfigMap — non-secret config (env vars, config files) separate from the image
# Secret — sensitive config (passwords, tokens) — stored encrypted in etcd

# deployment.yaml — rolling deploy with health checks
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }  # never go below 3 pods
  template:
    spec:
      containers:
        - name: api
          image: myapp/api:abc1234       # always pin to commit SHA
          ports: [{ containerPort: 3000 }]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: api-secrets, key: database-url }
          livenessProbe:
            httpGet: { path: /health/live, port: 3000 }
            failureThreshold: 3
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /health/ready, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 3
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits:   { cpu: 500m, memory: 512Mi }

# kubectl commands for interviews
# kubectl get pods                    — list running pods
# kubectl logs api-pod-xyz -f         — stream logs
# kubectl describe pod api-pod-xyz    — debug why pod won't start
# kubectl rollout undo deployment/api — instant rollback to previous version
# kubectl scale deployment/api --replicas=5  — scale up`
      }
    },

    {
      type: "summary",
      points: [
        "CI = integrate and test every change automatically. CD = deploy every passing change automatically. Goal: make deploys boring and frequent.",
        "GitHub Actions: trigger on PR/push, jobs run on fresh VMs, steps run commands. Fail CI = block merge. Nothing broken reaches main.",
        "Docker: image = app + dependencies + OS libs. Container = running instance of an image. Same image runs identically everywhere.",
        "Multi-stage Dockerfile: deps stage → build stage → minimal runtime stage. Final image has no dev tools or source files.",
        "Docker Compose: run multi-container stack locally with one command. Not for production orchestration — that's Kubernetes or ECS.",
        "PM2: auto-restart on crash, cluster mode for all CPU cores, zero-downtime reload, log aggregation. survives reboots with pm2 startup.",
        "Rolling deploy: update servers one at a time, traffic flows throughout. New and old code run together — must be backwards-compatible.",
        "Blue-green: full parallel environment, switch traffic atomically, instant rollback. Cost: double infrastructure.",
        "Canary: send 5% of traffic to new version, watch metrics, gradually increase. Catches issues before they affect all users.",
        "Expand-then-contract for DB migrations: add column first, deploy code that writes both, then remove old column. Never break running code.",
        "Liveness probe: is the process alive? Readiness probe: can it serve traffic? Fail readiness = removed from load balancer rotation.",
        "Graceful shutdown: SIGTERM → stop accepting connections → drain in-flight requests → close DB connections → exit. 30s timeout then SIGKILL.",
        "Image tagging: always use commit SHA as tag. Never use 'latest' in production — it's not reproducible and breaks rollbacks.",
        "Kubernetes: needed for many independent microservices, auto-scaling, self-healing. Most apps are better served with ECS, PM2+Nginx first."
      ]
    }
  ]
};

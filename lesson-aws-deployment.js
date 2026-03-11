// ─────────────────────────────────────────────────────────────────
//  LESSON: MERN Production Deployment on AWS EC2
//  Category: Architecture & System Design
// ─────────────────────────────────────────────────────────────────

const LESSON_AWS_DEPLOYMENT = {
  category: "Architecture & System Design",
  tag: "MERN Deployment on AWS",
  title: "Shipping Your MERN App to AWS EC2 Without Winging It",
  intro: "You've built the app locally. It works on your machine. Someone asks: 'okay, when can we put this in production?' You realise you've never actually owned a deployment end to end. Raj pulls up his terminal.",
  scenes: [

    // ── Cold open ──
    {
      speaker: "you",
      text: `"I was thinking I'd SSH in, git clone the repo, run npm start, and point a domain at the IP. That should work, right?"`
    },
    {
      speaker: "raj",
      text: `"It works once. Then you push a fix — same manual steps. The server crashes at 3am — nothing restarts it. A bot hits the API with ten thousand requests — no rate limiting. Your React build is being served from Node instead of a CDN. That's not a deployment, that's a fragile demo."`
    },
    {
      speaker: "you",
      text: `"So what's missing? I thought npm start was fine for production."`
    },
    {
      speaker: "raj",
      text: `"<em>npm start</em> is a single process that dies permanently on the first unhandled error. No automatic restart, no use of multiple CPU cores, no zero-downtime deploys. Those three things alone are why production setups use <em>PM2</em> instead. Then there's everything around it — automated deploys, secrets management, HTTPS termination. Let's build the full picture."`
    },

    // ── Architecture overview ──
    {
      speaker: "you",
      text: `"Okay. What does the full setup actually look like?"`
    },
    {
      speaker: "raj",
      text: `"Three parts that never touch each other. Your Express API lives on an <em>EC2 instance</em> managed by PM2 — PM2 keeps it alive, restarts on crash, and runs one process per CPU core. <em>GitHub Actions</em> SSHes into that instance on every push to main, pulls latest code, and reloads PM2 with zero downtime. Your React build never touches the server at all — it goes to <em>S3 and CloudFront CDN</em>. Static files to a CDN, dynamic API to a server. Those two things scale completely differently, so they should never be tied together."`
    },
    {
      type: "analogy",
      text: "Think of it like a restaurant. The kitchen (Express API on EC2) handles orders — it needs a manager (PM2) who rehires staff instantly if someone quits mid-shift. The menu boards (React on CloudFront) are printed once and distributed to every location — no point bothering the kitchen every time a customer reads a menu. GitHub Actions is the delivery driver who restocks the kitchen automatically when new supplies arrive, without you lifting a finger."
    },

    // ── EC2 setup ──
    {
      speaker: "you",
      text: `"Right, I'll spin up the EC2. I was going to use the default Ubuntu and just install Node from apt."`
    },
    {
      speaker: "raj",
      text: `"apt's Node is ancient — usually two or three major versions behind. Use <em>nvm</em> instead: it installs any version you want and lets you switch. Before you touch Node though — assign an <em>Elastic IP</em> immediately. A regular EC2 IP changes every time the instance stops. You'll point DNS at it, it'll change, your domain will go dead. Elastic IP pins it permanently. And lock the Security Group to SSH on 22 and HTTPS on 443. Nothing else exposed directly."`
    },
    {
      type: "code",
      text: `# ── First-time EC2 server setup (run once via SSH) ──

# 1. Update & install system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx ufw

# 2. Install Node via nvm (never use apt's Node — it's ancient)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20   # important: makes 'node' available in non-interactive shells
node -v                # confirm: v20.x.x

# 3. Install PM2 globally
npm install -g pm2

# 4. Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # ports 80 and 443
sudo ufw enable
sudo ufw status

# 5. Create deployment directory
sudo mkdir -p /var/www/api
sudo chown ubuntu:ubuntu /var/www/api

# 6. Install PM2 log rotation (prevents disk filling up silently over time)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7      # keep 7 days of logs
pm2 set pm2-logrotate:compress true`
    },

    // ── First deploy ──
    {
      speaker: "you",
      text: `"Okay, server is up. Now I need to get the code on it. The repo is private — I was just going to use my GitHub username and password."`
    },
    {
      speaker: "raj",
      text: `"Don't do that. Your personal credentials go on the server, you leave the project or rotate your password — deployments break overnight. Two better options. A <em>Personal Access Token</em> with read-only repo scope — you embed it in the clone URL and it works without prompting. Or an <em>SSH Deploy Key</em>: a key pair where the public key lives in the repo's Deploy Keys settings and the private key lives only on the server. Either works. Token is faster to set up for a single server."`
    },
    {
      type: "code",
      text: `# ── First-time clone of a private repo onto the server ──

# Option A: Personal Access Token (simpler for single-server setups)
# 1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
# 2. Create token: Contents = Read-only on your repo. Set an expiry date.
# 3. On the server:

cd /var/www
git clone https://<YOUR_TOKEN>@github.com/yourusername/your-repo.git api
cd api

# The token is baked into the origin URL — git pull works without prompting
git remote -v   # confirm origin URL includes the token

npm ci --omit=dev

# Copy your .env manually — never via git
# From your local machine:
# scp -i ~/.ssh/your-key.pem .env ubuntu@YOUR_ELASTIC_IP:/var/www/api/.env

# Option B: SSH Deploy Key (better for teams, no token expiry)
# 1. On the server:
ssh-keygen -t ed25519 -C "ec2-deploy" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub   # copy this output

# 2. GitHub → repo → Settings → Deploy keys → Add deploy key
#    Paste the public key. Read access only.

# 3. Add to ~/.ssh/config on the server:
# Host github.com
#   IdentityFile ~/.ssh/github_deploy
#   StrictHostKeyChecking no

# 4. Clone:
git clone git@github.com:yourusername/your-repo.git /var/www/api`
    },

    // ── Nginx ──
    {
      speaker: "you",
      text: `"Do I actually need Nginx? I was going to run Express directly on port 443."`
    },
    {
      speaker: "raj",
      text: `"Ports below 1024 require root. You don't want Node running as root — one RCE exploit and the attacker owns the machine. Nginx runs as root to grab port 443, <em>terminates TLS</em> there, then forwards plain HTTP to Node on port 3001. Your Express process never touches SSL. That also means <em>Certbot</em> can manage certificate renewal automatically by talking to Nginx — you set it up once and forget it."`
    },
    {
      speaker: "you",
      text: `"What about WebSocket support? We use Socket.io."`
    },
    {
      speaker: "raj",
      text: `"You need two extra headers in the Nginx proxy block — <em>Upgrade</em> and <em>Connection</em>. Without those, Nginx swallows the WebSocket handshake and the upgrade silently fails. Every Socket.io tutorial skips this because it doesn't affect regular HTTP at all — you only find out it's missing when WebSockets don't connect."`
    },
    {
      type: "code",
      text: `# /etc/nginx/sites-available/api.yourdomain.com

server {
    listen 80;
    server_name api.yourdomain.com;
    # Certbot will patch this file and add the SSL block automatically

    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;

        # Required for WebSocket support (Socket.io)
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection 'upgrade';

        # Pass the real client IP through to Express
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        proxy_read_timeout    30s;
        proxy_connect_timeout 10s;

        gzip on;
        gzip_types application/json text/plain;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;   # don't pollute logs with health check noise
    }
}

# ── Enable the site ──
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t          # always test config before reloading
sudo systemctl reload nginx

# ── SSL via Certbot ──
sudo certbot --nginx -d api.yourdomain.com
# Certbot verifies domain, issues cert, patches the Nginx config with listen 443 ssl,
# and sets up a cron job for auto-renewal every 60 days.
sudo certbot renew --dry-run   # verify auto-renewal works before you need it`
    },

    // ── Express hardening ──
    {
      speaker: "you",
      text: `"I've got Express running. I don't have any special security middleware — is that actually a problem?"`
    },
    {
      speaker: "raj",
      text: `"Three things are missing that tutorials never mention. <em>Helmet</em> sets secure HTTP headers in one line — kills X-Powered-By, adds Content-Security-Policy, prevents clickjacking. Without it you're advertising your stack and missing a dozen headers that take 30 seconds to add. <em>CORS</em> needs to be locked to your actual domain — not a wildcard star. A wildcard CORS policy means any site on the internet can make authenticated requests to your API using a logged-in user's cookies. And <em>express-rate-limit</em> — without it a single script can hammer your API until the server keels over."`
    },
    {
      speaker: "you",
      text: `"What's the trust proxy setting for? I keep seeing that mentioned."`
    },
    {
      speaker: "raj",
      text: `"Nginx sits in front of Express and forwards requests. From Express's view, every request comes from 127.0.0.1 — localhost. Your rate limiter sees a single IP for every user and throttles everyone as if they're the same person. <em>app.set('trust proxy', 1)</em> tells Express to read the real client IP from Nginx's <em>X-Forwarded-For</em> header instead."`
    },
    {
      type: "code",
      text: `// src/app.js — production Express hardening

import express   from 'express';
import helmet    from 'helmet';
import cors      from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Trust Nginx's X-Forwarded-For header so rate limiting sees real client IPs
// Without this, every request looks like it comes from 127.0.0.1
app.set('trust proxy', 1);

// ── 1. Security headers (first middleware) ──
app.use(helmet());
// Sets: X-Content-Type-Options, X-Frame-Options, HSTS, Content-Security-Policy
// Removes: X-Powered-By (stops advertising your stack)

// ── 2. CORS locked to your frontend domain ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(\`CORS blocked: \${origin}\`));
  },
  credentials: true,  // required if you send cookies or Authorization headers
}));

// ── 3. Rate limiting ──
// Global: 100 requests per IP per 15 minutes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// Stricter limiter on auth routes — 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts.' },
});
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── 4. Body parsers with size limits ──
app.use(express.json({ limit: '10kb' }));  // reject oversized JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

export default app;`
    },

    // ── PM2 config ──
    {
      speaker: "you",
      text: `"I've only ever used pm2 start index.js. I didn't know there was more to it."`
    },
    {
      speaker: "raj",
      text: `"<em>pm2 start index.js</em> runs one process on one CPU core. A t3.small has two vCPUs — you're leaving half the server idle. <em>ecosystem.config.js</em> lets you define everything properly. The critical setting is <em>cluster mode</em> — PM2 forks one worker per core and load-balances between them. Double throughput, same machine, zero code changes."`
    },
    {
      speaker: "you",
      text: `"And pm2 reload is different from pm2 restart?"`
    },
    {
      speaker: "raj",
      text: `"<em>pm2 restart</em> kills everything and restarts — there's a gap where no workers are running. <em>pm2 reload</em> is rolling: starts a new worker, waits for it to signal ready, then kills one old worker, repeats. No dropped requests. But it only works if your app actually sends a <em>ready signal</em> to PM2 after startup, and handles <em>SIGINT</em> to drain in-flight requests before exiting. Skip those two things and reload is just a slower restart."`
    },
    {
      type: "code",
      text: `// ecosystem.config.js  (committed to git — no secrets here)

module.exports = {
  apps: [
    {
      name: 'api',
      script: './src/index.js',

      instances: 'max',        // one process per CPU core
      exec_mode: 'cluster',

      max_memory_restart: '512M',       // auto-restart if a worker leaks past 512MB
      exp_backoff_restart_delay: 100,   // exponential backoff on crash loops

      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Secrets come from the .env file on the server, not here
      },

      out_file:        '/var/log/pm2/api-out.log',
      error_file:      '/var/log/pm2/api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      wait_ready:     true,   // wait for process.send('ready') signal
      listen_timeout: 5000,   // if not ready in 5s, count as failed start
    }
  ]
};

// ── src/index.js — graceful startup + shutdown signals ──

const server = app.listen(process.env.PORT, () => {
  console.log(\`API running on port \${process.env.PORT}\`);
  // Tell PM2 this worker is ready to receive traffic
  // process.send only exists in cluster/fork mode — guard it
  if (process.send) process.send('ready');
});

// Graceful shutdown: drain in-flight requests before exiting
// PM2 sends SIGINT on pm2 reload — handle it cleanly
process.on('SIGINT', () => {
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  // Force exit if drain takes longer than 10s
  setTimeout(() => process.exit(1), 10_000);
});

// ── PM2 commands ──
// pm2 start ecosystem.config.js --env production   ← first start
// pm2 reload ecosystem.config.js --env production  ← zero-downtime redeploy
// pm2 status                                        ← see all processes
// pm2 logs api --lines 100                          ← tail logs
// pm2 monit                                         ← live CPU/mem dashboard
// pm2 startup                                       ← generate systemd boot script
// pm2 save                                          ← persist process list across reboots`
    },

    // ── nvm PATH gotcha ──
    {
      speaker: "you",
      text: `"I set up the deploy script in GitHub Actions. First run, it SSHed in fine but pm2 wasn't found. I had to SSH in manually and run it myself."`
    },
    {
      speaker: "raj",
      text: `"Classic. When you SSH in manually your shell loads <em>.bashrc</em>, which loads nvm, which puts node and pm2 on your PATH. GitHub Actions opens a <em>non-interactive shell</em> — .bashrc doesn't run. So when the deploy script hits pm2, the shell says 'command not found', the step exits with an error, and the old process keeps running with the old code. You just deployed nothing."`
    },
    {
      speaker: "you",
      text: `"So the deploy reported success?"`
    },
    {
      speaker: "raj",
      text: `"Depends on whether you had <em>set -e</em> at the top. Without it, the shell swallows the error and the next command runs anyway. With set -e, any failure immediately aborts the script — which is what you want. The fix for nvm: source it explicitly at the top of the deploy script before any npm or pm2 commands. One export and one source line. That's it."`
    },
    {
      type: "code",
      text: `# ── The nvm problem in non-interactive SSH shells ──

# What works in your terminal (interactive shell, .bashrc loaded):
pm2 reload ecosystem.config.js    # works fine

# What GitHub Actions sees (non-interactive shell, .bashrc NOT loaded):
# pm2: command not found  ← step may silently pass without set -e

# ── Fix 1: Source nvm at the top of every deploy script ──
script: |
  set -e
  export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
  cd /var/www/api
  git fetch origin main && git reset --hard origin/main
  npm ci --omit=dev
  pm2 reload ecosystem.config.js --env production

# ── Fix 2: Use the absolute path (most reliable, no shell tricks) ──
# Find the paths on the server first (during a normal SSH session):
which pm2    # → /home/ubuntu/.nvm/versions/node/v20.19.0/bin/pm2
which npm    # → /home/ubuntu/.nvm/versions/node/v20.19.0/bin/npm

# Then in the deploy script, use full paths:
script: |
  set -e
  cd /var/www/api
  git fetch origin main && git reset --hard origin/main
  /home/ubuntu/.nvm/versions/node/v20.19.0/bin/npm ci --omit=dev
  /home/ubuntu/.nvm/versions/node/v20.19.0/bin/pm2 reload ecosystem.config.js --env production

# ── Fix 3: Add nvm init to ~/.profile (loaded by non-interactive SSH) ──
# Add to the END of ~/.profile on the server:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
# After this, non-interactive SSH sessions also have nvm on PATH`
    },

    // ── Environment variables ──
    {
      speaker: "you",
      text: `"For secrets — I was going to put the MongoDB URI and JWT secret in the ecosystem.config.js since it's already managing env vars."`
    },
    {
      speaker: "raj",
      text: `"ecosystem.config.js is committed to git. Everything in it is visible to everyone with repo access, and in your git history forever. Secrets go in a <em>.env file on the server</em> — at /var/www/api/.env, never in the repo. <em>dotenv</em> loads it at startup. One critical detail: dotenv must be the <em>very first import</em> in your entry file — before mongoose, before anything that reads process.env. If mongoose connects before dotenv runs, MONGODB_URI is undefined and the connection silently uses the wrong string or fails."`
    },
    {
      speaker: "you",
      text: `"What about when I need to rotate a secret?"`
    },
    {
      speaker: "raj",
      text: `"SSH in, edit the .env file with the new value, run <em>pm2 reload</em>. Workers restart one at a time picking up the new values. No downtime. dotenv only sets a variable if it isn't already in process.env — so if PM2's env_production block sets NODE_ENV, dotenv leaves it alone. That's the right behaviour: PM2 controls runtime, .env fills in secrets."`
    },
    {
      type: "code",
      text: `# /var/www/api/.env  (server only — never committed to git)

NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/myapp?retryWrites=true&w=majority
JWT_SECRET=generate-with-openssl-rand-hex-64
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ── .gitignore (repo root) ──
.env
.env.*
!.env.example

# ── .env.example (committed — documents required vars, no real values) ──
NODE_ENV=
PORT=3001
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=

# ── src/index.js — load dotenv as the FIRST import ──
import 'dotenv/config';          // must be line 1, before mongoose or anything else
import mongoose from 'mongoose';
import app      from './app.js';

// Now process.env.MONGODB_URI is available when mongoose.connect() runs
await mongoose.connect(process.env.MONGODB_URI);

# ── Rotate a secret ──
# 1. SSH into the server
# 2. Edit /var/www/api/.env with the new value
# 3. pm2 reload ecosystem.config.js --env production
# Workers restart one at a time — no downtime, new secret picked up`
    },

    // ── MongoDB Atlas ──
    {
      speaker: "you",
      text: `"The Atlas cluster is set up and the URI is in .env. But the app keeps timing out when it tries to connect. The URI looks right."`
    },
    {
      speaker: "raj",
      text: `"<em>Atlas Network Access</em>. Before you dig into anything else — check that first. Every Atlas cluster has an IP allowlist that defaults to blocking everything. Your EC2 Elastic IP needs to be in that list or connections are silently dropped at the network level before they reach MongoDB. It's not an auth error, it's not a DNS error — just a timeout with no useful message. This is the single most common silent failure on a first MERN deploy."`
    },
    {
      speaker: "you",
      text: `"Can I just set it to 0.0.0.0/0 to allow everything while I debug?"`
    },
    {
      speaker: "raj",
      text: `"You can, and everyone does while debugging. But don't leave it. 0.0.0.0/0 means your MongoDB cluster accepts connections from anywhere on the internet — the only thing protecting it is the username and password in the URI. Add the specific Elastic IP with <em>/32</em> and remove the wildcard before you go live. While you're in Atlas, also create a <em>dedicated DB user</em> with readWrite on your specific database only — not the atlas admin account, not any cluster-wide role."`
    },
    {
      type: "code",
      text: `# ── MongoDB Atlas Network Access — where to configure ──
# Atlas Dashboard → Project → Security → Network Access → + Add IP Address
#
# EC2 Elastic IP:  13.234.56.78/32    (/32 = exact single IP, not a range)
# Local dev IP:    your.home.ip/32
# Never leave:     0.0.0.0/0          (allows entire internet — debugging only)

# ── Test the connection from the server before starting the app ──
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('Atlas connected OK'); process.exit(0); })
  .catch(err => { console.error('FAILED:', err.message); process.exit(1); });
"
# Timeout = IP not in Atlas allowlist
# Auth error = wrong username/password in the URI
# Success = you're good to start PM2

# ── Create a dedicated DB user for production ──
# Atlas → Database Access → Add New Database User
# Method: Password
# Role: readWrite on your specific database ONLY
# NOT: Atlas admin or any cluster-wide role
# Username: myapp-prod  (not your Atlas login account)

# ── URI format reminder ──
# mongodb+srv://USERNAME:PASSWORD@cluster0.abc12.mongodb.net/DBNAME?retryWrites=true&w=majority
# Encode special chars in password: @ → %40   # → %23   : → %3A`
    },

    // ── GitHub Actions deploy workflow ──
    {
      speaker: "you",
      text: `"Okay — I've been running deploys manually over SSH. How do I wire up GitHub Actions to do it automatically?"`
    },
    {
      speaker: "raj",
      text: `"Three jobs. <em>test</em> runs first — if anything fails, the other two jobs never start. You never deploy broken code. Then <em>deploy-backend</em> and <em>deploy-frontend</em> run in parallel. Backend: SSH into EC2, source nvm, hard reset to latest main, npm ci without dev deps, pm2 reload, curl the health endpoint. If that curl returns non-200, the job fails and you get notified immediately. Frontend: build React with the production API URL baked in, sync to S3, invalidate CloudFront. Both parallel jobs finish in 60 to 90 seconds from the moment you push."`
    },
    {
      type: "code",
      text: `# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:    # also adds a manual "Run workflow" button in GitHub UI

jobs:
  # ── Job 1: Tests must pass before anything deploys ──
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm test -- --ci

  # ── Job 2: Deploy Express API to EC2 ──
  deploy-backend:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: SSH deploy
        uses: appleboy/ssh-action@v1.0.3
        with:
          host:     \${{ secrets.EC2_HOST }}
          username: \${{ secrets.EC2_USER }}
          key:      \${{ secrets.EC2_SSH_KEY }}
          port:     22
          script: |
            set -e
            export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"

            cd /var/www/api
            git fetch origin main
            git reset --hard origin/main

            npm ci --omit=dev

            pm2 reload ecosystem.config.js --env production

            # Wait for workers, then confirm the app is healthy
            sleep 5
            curl --fail http://localhost:3001/health \\
              || (pm2 logs api --lines 30 --nostream && exit 1)

  # ── Job 3: Build React and deploy to S3 + CloudFront ──
  deploy-frontend:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }

      - name: Build React app
        run: |
          cd client
          npm ci
          npm run build
        env:
          VITE_API_URL: https://api.yourdomain.com

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id:     \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region:            ap-south-1

      - name: Sync to S3
        run: |
          # Hashed assets (main.abc123.js) — cache for 1 year
          aws s3 sync client/dist s3://your-bucket-name \\
            --delete \\
            --exclude "index.html" \\
            --cache-control "max-age=31536000,immutable"

          # index.html — never cache (must always be fresh so users load latest bundles)
          aws s3 cp client/dist/index.html s3://your-bucket-name/index.html \\
            --cache-control "no-cache,no-store,must-revalidate"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \\
            --distribution-id \${{ secrets.CF_DISTRIBUTION_ID }} \\
            --paths "/*"`
    },

    // ── SSH key + GitHub Secrets ──
    {
      speaker: "you",
      text: `"For the SSH key in Actions — I was going to reuse my personal key. Is that a problem?"`
    },
    {
      speaker: "raj",
      text: `"Your personal key can access every server you've ever set it up on. If a GitHub Secret leaks, that's your entire SSH history compromised. Generate a <em>dedicated deploy key</em> — it goes on this server only, for this purpose only. The <em>private key</em> content, including both BEGIN and END lines, goes into a GitHub Secret called EC2_SSH_KEY. The <em>public key</em> gets appended to the server's authorized_keys. Test it manually with ssh -i before adding to Actions — don't discover it doesn't work mid-deploy."`
    },
    {
      speaker: "you",
      text: `"What about the AWS credentials? I was going to use my root account keys."`
    },
    {
      speaker: "raj",
      text: `"Never put root account keys anywhere. Create a dedicated <em>IAM user</em> with only the permissions the deploy actually needs — PutObject, DeleteObject, ListBucket on the specific S3 bucket, and CreateInvalidation on the specific CloudFront distribution. That's it. If those credentials leak, the blast radius is one bucket and one distribution — not your entire AWS account."`
    },
    {
      type: "code",
      text: `# ── Generate deploy key (run locally, not on the server) ──
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key
# Creates:
#   ~/.ssh/deploy_key      ← private key — paste into GitHub Secret: EC2_SSH_KEY
#   ~/.ssh/deploy_key.pub  ← public key  — add to server's authorized_keys

# ── Add public key to the server ──
ssh-copy-id -i ~/.ssh/deploy_key.pub ubuntu@YOUR_ELASTIC_IP
# or manually:
cat ~/.ssh/deploy_key.pub | ssh ubuntu@YOUR_ELASTIC_IP "cat >> ~/.ssh/authorized_keys"

# ── Test before adding to Actions ──
ssh -i ~/.ssh/deploy_key ubuntu@YOUR_ELASTIC_IP "echo SSH works"

# ── GitHub Secrets to add ──
# Repo → Settings → Secrets and variables → Actions → New repository secret
#
# EC2_HOST              → 13.234.56.78   (Elastic IP)
# EC2_USER              → ubuntu
# EC2_SSH_KEY           → full content of ~/.ssh/deploy_key
#                         MUST include: -----BEGIN OPENSSH PRIVATE KEY-----
#                         and:          -----END OPENSSH PRIVATE KEY-----
# AWS_ACCESS_KEY_ID     → IAM user access key ID
# AWS_SECRET_ACCESS_KEY → IAM user secret access key
# CF_DISTRIBUTION_ID    → CloudFront distribution ID (starts with E, e.g. EABC12345)

# ── IAM policy for deploy user (least privilege) ──
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DIST_ID"
    }
  ]
}`
    },

    // ── S3 + CloudFront ──
    {
      speaker: "you",
      text: `"For the React build — I enabled S3 static website hosting. That's the right setting, isn't it?"`
    },
    {
      speaker: "raj",
      text: `"That's the old way and it requires the bucket to be public. Don't. Keep the bucket <em>completely private</em> and use <em>Origin Access Control</em> so only your CloudFront distribution can read from it. In CloudFront, two settings will silently break React Router if you miss them: set the <em>default root object</em> to index.html, and configure 403 and 404 errors to return /index.html with a 200 status code."`
    },
    {
      speaker: "you",
      text: `"Why does that matter for React Router?"`
    },
    {
      speaker: "raj",
      text: `"When a user refreshes /dashboard, CloudFront asks S3 for a file at that path. There is no file — S3 returns a 403. React Router never gets a chance to handle it. Without the custom error response, every non-root route returns a 403 on refresh. With it, S3's 403 gets intercepted, /index.html is served instead, React loads, Router reads the URL, renders the right component. The user sees nothing wrong."`
    },
    {
      type: "code",
      text: `# ── Create S3 bucket ──
aws s3api create-bucket \\
  --bucket your-bucket-name \\
  --region ap-south-1 \\
  --create-bucket-configuration LocationConstraint=ap-south-1

# Block ALL public access — bucket stays private, CloudFront reads via OAC
aws s3api put-public-access-block \\
  --bucket your-bucket-name \\
  --public-access-block-configuration \\
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# ── S3 bucket policy (CloudFront reads via Origin Access Control) ──
# CloudFront generates this exact policy in the console — paste it into:
# S3 → your-bucket → Permissions → Bucket policy
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DIST_ID"
        }
      }
    }
  ]
}

# ── CloudFront distribution settings ──
# Origin:                S3 bucket via Origin Access Control (NOT the website endpoint URL)
# Origin Access:         Create new OAC — signing behaviour: Always
# Default root object:   index.html
# Viewer protocol:       Redirect HTTP to HTTPS
#
# Custom error responses (CRITICAL — without this React Router breaks on refresh):
#   Error code 403 → Response path /index.html → HTTP response code 200
#   Error code 404 → Response path /index.html → HTTP response code 200
#
# Cache behaviour for index.html:   CachingDisabled policy (always fetch fresh)
# Cache behaviour for /assets/*:    CachingOptimized policy (cache at edge)
#
# Alternate domain names (CNAMEs): yourdomain.com, www.yourdomain.com
# SSL certificate: select from ACM (must be in us-east-1 — see DNS section)`
    },

    // ── Health endpoint ──
    {
      speaker: "you",
      text: `"My deploy script curls /health at the end. Right now /health just returns 200 always — does that matter?"`
    },
    {
      speaker: "raj",
      text: `"It defeats the point. A health endpoint that always returns 200 will pass even when MongoDB is disconnected and every API request is failing. The one thing worth checking: <em>mongoose.connection.readyState</em>. That single check catches 90% of post-deploy failures — wrong URI, Atlas IP allowlist not updated, credentials rotated but .env not updated. Return 503 if it's not 1. The deploy script then catches real failures instead of green-lighting a broken deployment."`
    },
    {
      type: "code",
      text: `// src/routes/health.js

import express  from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbOk = dbState === 1;

  res.status(dbOk ? 200 : 503).json({
    status:  dbOk ? 'ok' : 'degraded',
    db:      dbOk ? 'connected' : \`state:\${dbState}\`,
    uptime:  Math.floor(process.uptime()),   // seconds since Node started
    env:     process.env.NODE_ENV,
  });
});

export default router;

// src/app.js — register before other routes, no auth middleware
import healthRouter from './routes/health.js';
app.use('/health', healthRouter);

// ── What the response looks like ──
// GET https://api.yourdomain.com/health
//
// 200 OK  { "status": "ok", "db": "connected", "uptime": 3842, "env": "production" }
// 503     { "status": "degraded", "db": "state:0", ... }  ← DB disconnected

// ── In Nginx config — suppress health check access logs ──
// location /health {
//     proxy_pass http://localhost:3001/health;
//     access_log off;   ← stops monitoring tools from spamming your logs
// }`
    },

    // ── Rollback ──
    {
      speaker: "you",
      text: `"What if something slips through tests and breaks in production? How do I roll back?"`
    },
    {
      speaker: "raj",
      text: `"Backend first. PM2's rolling reload means old workers kept running until new ones were healthy — so if the bad code crashed on startup, PM2 never fully swapped over and you may still have degraded-but-alive workers. SSH in, git log to find the last good SHA, <em>git reset --hard</em> to it, npm ci, pm2 reload. Under a minute. Frontend: find the last successful run in GitHub Actions, hit <em>Re-run all jobs</em> — it rebuilds and syncs from that commit without you touching anything locally."`
    },
    {
      speaker: "you",
      text: `"So I should be keeping main deployable at all times."`
    },
    {
      speaker: "raj",
      text: `"That's the actual lesson. Rollback should be something you've practised, not something you figure out at 2am. Small PRs, feature flags for risky changes, and test your rollback once before you ever need it for real."`
    },
    {
      type: "code",
      text: `# ── Manual backend rollback (SSH into server) ──

ssh -i ~/.ssh/deploy_key ubuntu@YOUR_ELASTIC_IP
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"

cd /var/www/api

# Find the last working commit
git log --oneline -10

# Roll back to it
git reset --hard abc1234    # last known good SHA
npm ci --omit=dev
pm2 reload ecosystem.config.js --env production

# Confirm
sleep 5
curl http://localhost:3001/health

# ── Frontend rollback — re-run last good Actions workflow ──
# GitHub → your repo → Actions → "Deploy to Production"
# Find the last successful run → "Re-run all jobs"
# This rebuilds and deploys from that exact commit — no local steps needed

# ── Manual frontend rollback if Actions history is gone ──
git checkout abc1234   # last known good commit, locally
cd client
npm ci && npm run build
# Then sync to S3 manually (set env vars first):
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
aws s3 sync dist s3://your-bucket-name --delete \\
  --exclude "index.html" --cache-control "max-age=31536000,immutable"
aws s3 cp dist/index.html s3://your-bucket-name/index.html \\
  --cache-control "no-cache,no-store,must-revalidate"
aws cloudfront create-invalidation \\
  --distribution-id YOUR_DIST_ID --paths "/*"`
    },

    // ── DNS ──
    {
      speaker: "you",
      text: `"Last thing — DNS. I pointed the root domain at the EC2 IP with a CNAME and it's not resolving."`
    },
    {
      speaker: "raj",
      text: `"<em>CNAMEs don't work on apex domains</em>. That's a DNS spec restriction — the root domain can't be a CNAME because it would conflict with SOA and NS records. Use an <em>ALIAS</em> record in Route 53, or an ANAME if your registrar supports it — they behave like CNAMEs but are valid on the apex. For the SSL certificate on CloudFront: request it from <em>ACM in us-east-1</em>. Not your app's region — specifically us-east-1. CloudFront is a global service that only reads certificates from that one region. Create it anywhere else and it simply won't appear in CloudFront's certificate dropdown."`
    },
    {
      type: "code",
      text: `# ── DNS records (set in your registrar or Route 53) ──

# Express API on EC2
Type:  A
Name:  api
Value: 13.234.56.78        ← Elastic IP (doesn't change when instance stops/starts)
TTL:   300

# React frontend on CloudFront
Type:  CNAME
Name:  www
Value: d1abc123xyz.cloudfront.net

# Root domain apex — CNAME not valid here, use ALIAS / ANAME
Type:  ALIAS  (Route 53) or ANAME (most other registrars)
Name:  @
Value: d1abc123xyz.cloudfront.net

# ── SSL for the API: Let's Encrypt via Certbot ──
sudo certbot --nginx -d api.yourdomain.com
# Verifies domain ownership, issues cert, patches Nginx config,
# sets up auto-renewal cron. Run this after DNS A record propagates.
sudo certbot renew --dry-run   # verify auto-renewal works

# ── SSL for CloudFront: AWS Certificate Manager ──
# Step 1: Switch region to us-east-1 in the AWS console
#         (THIS IS REQUIRED — CloudFront only reads certs from us-east-1)
# Step 2: ACM → Request certificate → Public
# Step 3: Add domain names: yourdomain.com AND www.yourdomain.com
# Step 4: DNS validation → ACM gives you CNAME records
# Step 5: Add those CNAMEs to your DNS, wait ~5 minutes for "Issued" status
# Step 6: CloudFront → your distribution → Edit → Custom SSL certificate → select it
# Step 7: Add Alternate domain names: yourdomain.com and www.yourdomain.com

# ── Check DNS propagation ──
dig api.yourdomain.com +short        # should return your Elastic IP
dig www.yourdomain.com CNAME +short  # should return cloudfront.net URL`
    },

    // ── Closing ──
    {
      speaker: "raj",
      text: `"Okay — go back to where you started. 'SSH in, git clone, npm start.' What's actually wrong with that now?"`
    },
    {
      speaker: "you",
      text: `"One process on one core, dies permanently on any crash, manual redeploy every time, no rate limiting, secrets in the wrong place, React being served from Node, no HTTPS termination, and no way to roll back cleanly."`
    },
    {
      speaker: "raj",
      text: `"Right. The goal isn't complexity — it's making every one of those problems not your problem anymore. When this is set up, the only things you're manually touching are the .env file when secrets rotate and the Atlas IP allowlist when you change servers. Everything else is automated and recoverable."`
    },

    {
      type: "summary",
      points: [
        "Architecture: EC2 + PM2 for Express API, S3 + CloudFront for React build, GitHub Actions automates both. API and frontend deploy independently and scale independently.",
        "EC2 first-time setup: Ubuntu 22.04, Elastic IP before any DNS, UFW firewall (SSH + HTTPS only), Node via nvm with 'nvm alias default 20', pm2-logrotate to prevent silent disk fill.",
        "Private repo first deploy: Personal Access Token embedded in the clone URL, or an SSH Deploy Key in repo Deploy Keys settings. Never use personal GitHub credentials on a server.",
        "nvm + non-interactive SSH: GitHub Actions shells don't load .bashrc so pm2 is not on PATH. Fix: source nvm explicitly at the top of the deploy script, or use absolute paths from 'which pm2'. Always use set -e so failures abort the script.",
        "Express hardening before first deploy: Helmet for security headers, CORS locked to ALLOWED_ORIGINS env var, express-rate-limit globally and stricter on auth routes, app.set('trust proxy', 1) so rate limiting sees real IPs through Nginx.",
        "PM2 ecosystem.config.js: cluster mode for all CPU cores, max_memory_restart, wait_ready + listen_timeout for clean startup signal, pm2 startup + pm2 save to survive reboots. Express must call process.send('ready') and handle SIGINT to drain requests.",
        "Secrets: dotenv loaded as the very first import in index.js, .env on the server never in git, .env.example committed as a template. dotenv only sets variables not already in process.env — PM2 env_production controls runtime, .env fills in secrets.",
        "MongoDB Atlas network access: add the EC2 Elastic IP to the Atlas IP allowlist — the most common silent failure on a first MERN deploy. Use a dedicated DB user with readWrite on the specific database only, not the Atlas admin account.",
        "GitHub Actions: test job runs first, deploy-backend and deploy-frontend run in parallel after. Health check curl at end of backend deploy — non-200 fails the job immediately. Total time: 60–90 seconds from push to live.",
        "S3 setup: block all public access, no static website hosting. CloudFront reads via Origin Access Control. Hashed assets cached 1 year, index.html no-cache. 403 and 404 error pages must redirect to /index.html with 200 — required for React Router on refresh.",
        "Health endpoint at /health: checks mongoose.connection.readyState, returns 503 if DB disconnected, no auth middleware, access_log off in Nginx. An endpoint that always returns 200 is not a health check.",
        "Rollback: git reset --hard SHA + npm ci + pm2 reload on the server for backend. For frontend: re-run the previous successful Actions workflow from the GitHub UI.",
        "DNS: A record api → Elastic IP, CNAME www → CloudFront URL, ALIAS or ANAME @ → CloudFront URL. CNAMEs are invalid on apex domains. ACM certificate for CloudFront must be created in us-east-1 regardless of your app's region.",
        "IAM least privilege: deploy user has only s3:PutObject, DeleteObject, ListBucket, GetObject on the specific bucket, and cloudfront:CreateInvalidation on the specific distribution. Never use root account keys."
      ]
    }
  ]
};

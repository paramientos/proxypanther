# ProxyPanther

> **Beta Notice:** ProxyPanther is currently in beta. It works and is actively used, but you may encounter bugs. Please [open an issue](https://github.com/paramientos/proxypanther/issues) to report them — your feedback directly shapes the roadmap.

![ProxyPanther Dashboard](/public/ss.png)

ProxyPanther is an enterprise-grade reverse proxy and web application firewall (WAF) platform built for professionals who demand control, security, and performance. It brings Cloudflare-like capabilities on-premise, powered by modern infrastructure and a clean, enterprise-focused interface.

## Why ProxyPanther?

Traditional reverse proxy tools like Nginx Proxy Manager handle traffic forwarding but fall short on security and modern protocol support. Cloudflare is powerful, but your data lives on their infrastructure and control is limited. ProxyPanther bridges this gap by delivering advanced security, automatic SSL, and traffic management on your own servers.

## Core Capabilities

### Reverse Proxy with Automatic SSL
- Powered by Caddy for zero-configuration Let's Encrypt SSL certificates
- HTTP/3 support out of the box for maximum performance
- Multiple backend routing with health checks and failover

### Web Application Firewall (WAF)
- SQL Injection and XSS attack prevention before requests reach your application
- Custom WAF rule configuration per site
- Bot fight mode and automated threat detection
- GeoIP-based access control and country blocking

### Rate Limiting & Traffic Control
- Configurable request rate limits per IP or endpoint
- Bandwidth monitoring and request analytics
- Advanced rate limiting rules per proxy site

### Security & Access Control
- IP banning with automated suspicious activity detection
- Basic authentication and custom header-based access rules
- Under-attack mode for DDoS mitigation

### Monitoring & Analytics
- Real-time traffic analytics with Apache ECharts
- Uptime monitoring with event logging
- Security event tracking with GeoIP enrichment
- Daily metrics aggregation and reporting

### Enterprise Features
- Multi-team support with role-based access
- Configuration audit logging for compliance
- Custom error pages per site
- Page rules for advanced request handling and redirects
- Environment variable injection per backend

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend | React 18 + Inertia.js |
| UI Framework | Mantine UI |
| Build Tool | Vite |
| Charts | Apache ECharts |
| Package Manager | Yarn |
| Runtime | Laravel Octane + RoadRunner |
| Proxy / SSL | Caddy (xcaddy + GeoIP module) |
| Queue | Redis + Laravel Horizon |
| Realtime | Laravel Reverb |
| Database | PostgreSQL (Docker) / SQLite (local) |

## Architecture

```
internet
    │
    ▼
[caddy] :80 / :443
    │  xcaddy binary with GeoIP module
    │  /etc/caddy/Caddyfile  ── shared volume ──┐
    │  /etc/caddy/GeoLite2-Country.mmdb          │
    │                                            │
    ▼ (reverse proxy to dashboard)               │
[app] :8000 → exposed :3434                      │
    │  Laravel + Octane/RoadRunner               │
    │  writes Caddyfile ─────────────────────────┘
    │  reloads via Caddy Admin API (POST /load)
    │
    ├── [horizon]    Redis queue workers
    ├── [scheduler]  schedule:work (health checks, log ingestion)
    └── [reverb]     WebSocket :8080

[postgres] :5432 → exposed :5656
[redis]    :6379
```

---

## Installation

### Option 1 — Docker (Recommended)

The fastest path. One command sets everything up including Caddy with GeoIP, PostgreSQL, Redis, Horizon, and the scheduler.

**Requirements:** Docker 24+ and Docker Compose v2

```bash
curl -fsSL https://raw.githubusercontent.com/paramientos/proxypanther/main/install.sh | bash
```

That's it. The script will:
- Install Docker automatically if not present (Ubuntu/Debian)
- Pull pre-built images from GitHub Container Registry — no local build needed
- Generate a secure `APP_KEY`, `DB_PASSWORD`, and `ADMIN_PASSWORD` automatically
- Download the DB-IP GeoLite2 country database
- Run all database migrations
- Start all services under `/opt/proxypanther`

**After install, the script will print your credentials:**

```
  Dashboard:   http://<your-ip>:3434
  DB Password: <generated>

  Default Login Credentials:
  Email:    admin@proxypanther.com
  Password: <randomly generated — shown once>
  ⚠  Save this password — it won't be shown again!
```

**Ports after install:**

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3434 |
| Caddy HTTP | http://localhost:80 |
| Caddy HTTPS | https://localhost:443 |
| Caddy Admin API | http://localhost:2019 |
| PostgreSQL | localhost:5656 |

**Useful commands:**

```bash
# View logs
docker compose -f /opt/proxypanther/docker-compose.yml logs -f app

# Stop everything
docker compose -f /opt/proxypanther/docker-compose.yml down

# Update to latest version
cd /opt/proxypanther && docker compose pull && docker compose up -d

# Run artisan commands
docker compose -f /opt/proxypanther/docker-compose.yml exec app php artisan <command>

# Reset admin password (generates a new random password)
docker compose -f /opt/proxypanther/docker-compose.yml exec app php artisan admin:reset-password

# Reset password for a specific user
docker compose -f /opt/proxypanther/docker-compose.yml exec app php artisan admin:reset-password user@example.com

# Set a specific password
docker compose -f /opt/proxypanther/docker-compose.yml exec app php artisan admin:reset-password --password=MyNewPass123
```

---

### Option 1b — Single `docker run` (Quick Test)

No Compose needed. Spins up just the app against an external or existing database.

```bash
docker run -d \
  --name proxypanther \
  -p 3434:8000 \
  -e APP_KEY="base64:$(openssl rand -base64 32)" \
  -e APP_ENV=production \
  -e APP_DEBUG=false \
  -e DB_CONNECTION=pgsql \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5656 \
  -e DB_DATABASE=proxypanther \
  -e DB_USERNAME=proxypanther \
  -e DB_PASSWORD=your_db_password \
  -e QUEUE_CONNECTION=sync \
  -e CACHE_STORE=file \
  -e SESSION_DRIVER=file \
  -e CADDY_ADMIN_API=http://host.docker.internal:2019 \
  -e CADDYFILE_PATH=/etc/caddy/Caddyfile \
  ghcr.io/paramientos/proxypanther-app:latest
```

> This mode uses `QUEUE_CONNECTION=sync` and file-based cache/session — suitable for evaluation only. For production use Option 1 (Compose) which includes Redis, Horizon, Reverb, and Caddy.

---

### Option 2 — Manual (Ubuntu / Debian)

**Requirements:**

- PHP 8.3+
- Composer
- Node.js 20+ and Yarn
- Redis
- PostgreSQL (or SQLite for local dev)
- Go 1.21+ (for building Caddy with GeoIP module)

#### 1. Clone and install dependencies

```bash
git clone https://github.com/paramientos/proxypanther
cd proxypanther

composer install
yarn install
yarn build
```

#### 2. Configure environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set your database connection:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=proxypanther
DB_USERNAME=proxypanther
DB_PASSWORD=your_password

QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
CACHE_STORE=redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

#### 3. Run migrations

```bash
php artisan migrate
```

#### 4. Build Caddy with GeoIP module

```bash
# Install Go (Ubuntu/Debian via snap)
sudo snap install go --classic

# Install xcaddy
go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
export PATH=$PATH:$(go env GOPATH)/bin

# Build Caddy with GeoIP support
xcaddy build \
    --with github.com/porech/caddy-maxmind-geolocation \
    --output /usr/local/bin/caddy

sudo chmod +x /usr/local/bin/caddy
```

#### 5. Download GeoIP database

```bash
sudo mkdir -p /etc/caddy

YEAR_MONTH=$(date +%Y-%m)
sudo wget -O /etc/caddy/GeoLite2-Country.mmdb.gz \
    "https://download.db-ip.com/free/dbip-country-lite-${YEAR_MONTH}.mmdb.gz"

sudo gunzip /etc/caddy/GeoLite2-Country.mmdb.gz
sudo chmod 644 /etc/caddy/GeoLite2-Country.mmdb
```

#### 6. Configure environment for Caddy

Add to your `.env`:

```dotenv
CADDY_ADMIN_API=http://localhost:2019
CADDYFILE_PATH=/etc/caddy/Caddyfile
GEOIP_DB_PATH=/etc/caddy/GeoLite2-Country.mmdb
```

#### 7. Start Caddy

```bash
sudo caddy start --config /etc/caddy/Caddyfile
```

Or as a systemd service:

```bash
sudo caddy run --config /etc/caddy/Caddyfile &
```

#### 8. Start application services

Run each in a separate terminal or configure as systemd services:

```bash
# Application server (Octane + RoadRunner)
php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000

# Queue worker
php artisan horizon

# WebSocket server
php artisan reverb:start

# Scheduler (keep running)
php artisan schedule:work
```

---

## Tips

### Proxying to a service running on the host machine

When ProxyPanther runs inside Docker and you want to proxy traffic to a service running directly on the host (e.g. a local app on port 3535), use `host.docker.internal` as the backend URL instead of `localhost`:

```
http://host.docker.internal:3535
```

`localhost` inside the Caddy container refers to the container itself, not the host machine. `host.docker.internal` is automatically resolved to the host's gateway IP via the `extra_hosts` setting in `docker-compose.yml`.

---

## Key Differences

| Feature | Nginx Proxy Manager | Cloudflare | ProxyPanther |
|---------|-------------------|------------|--------------|
| Reverse Proxy | ✓ | ✓ | ✓ |
| Automatic SSL | ✓ | ✓ | ✓ |
| WAF / Security | Limited | ✓ | ✓ |
| On-Premise Control | ✓ | ✗ | ✓ |
| Bot Protection | ✗ | ✓ | ✓ |
| Rate Limiting | Basic | ✓ | ✓ |
| GeoIP Blocking | ✗ | ✓ | ✓ |
| Uptime Monitoring | ✗ | ✓ | ✓ |
| Modern Protocols (HTTP/3) | ✗ | ✓ | ✓ |
| Zero Data to Third Parties | ✓ | ✗ | ✓ |

## License

MIT License

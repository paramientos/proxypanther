# ProxyPanther

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
| Backend | Laravel 13 (PHP 8.4+) |
| Frontend | React 19 + Inertia.js |
| UI Framework | Manticore UI |
| Build Tool | Vite |
| Charts | Apache ECharts |
| Package Manager | Yarn |
| Runtime | FrankenPHP / Caddy |
| Queue | Redis + Laravel Horizon |
| Realtime | Laravel Reverb |
| Database | SQLite (default) / MySQL / PostgreSQL |

## Architecture Highlights

- **Caddy Integration**: Custom Caddyfile generation with dynamic reloading for instant configuration changes
- **GeoIP Support**: MaxMind / DB-IP GeoLite2 database for country-level traffic analysis and blocking
- **Health Checks**: Automated backend health monitoring with failover routing
- **Log Ingestion**: Structured log parsing and security event detection from Caddy access logs
- **SSL Automation**: Fully automatic certificate provisioning and renewal via Let's Encrypt

## Quick Start

### Requirements

- PHP 8.4+
- Composer
- Node.js 20+
- Yarn
- Redis
- Go (for custom Caddy build with GeoIP module)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd deploypanther

# Install PHP dependencies
composer install

# Install JavaScript dependencies
yarn install

# Build frontend assets
yarn build

# Configure environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Build Caddy with GeoIP support
sudo snap install go --classic
go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
export PATH=$PATH:$(go env GOPATH)/bin
xcaddy build --with github.com/porech/caddy-maxmind-geolocation

# Download GeoIP database
sudo mkdir -p /etc/caddy
sudo wget -O /etc/caddy/GeoLite2-Country.mmdb.gz https://download.db-ip.com/free/dbip-country-lite-$(date +%Y-%m).mmdb.gz
sudo gunzip /etc/caddy/GeoLite2-Country.mmdb.gz
sudo chmod 644 /etc/caddy/GeoLite2-Country.mmdb

# Start services
php artisan serve
php artisan horizon
php artisan reverb:start
```

### Caddy Configuration

ProxyPanther generates a dynamic `Caddyfile` based on your configured sites. To apply changes:

```bash
php artisan sync:caddy
```

For log ingestion and health checks, schedule the following commands:

```bash
php artisan schedule:run
```

## Key Differences

| Feature | Nginx Proxy Manager | Cloudflare | ProxyPanther |
|---------|-------------------|------------|--------------|
| Reverse Proxy | Yes | Yes | Yes |
| Automatic SSL | Yes | Yes | Yes |
| WAF / Security | Limited | Yes | Yes |
| On-Premise Control | Yes | No | Yes |
| Bot Protection | No | Yes | Yes |
| Rate Limiting | Basic | Yes | Yes |
| GeoIP Blocking | No | Yes | Yes |
| Uptime Monitoring | No | Yes | Yes |
| Modern Protocols (HTTP/3) | No | Yes | Yes |
| Zero Data to Third Parties | Yes | No | Yes |

## Integration with PingPanther

ProxyPanther works seamlessly alongside PingPanther for a complete infrastructure monitoring and protection stack. When PingPanther detects a service outage, ProxyPanther can automatically route traffic to failover backends, ensuring high availability without manual intervention.

## License

MIT License

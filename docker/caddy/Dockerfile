FROM golang:1.23-alpine AS xcaddy-builder

RUN apk add --no-cache git curl

RUN go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest

RUN xcaddy build \
    --with github.com/porech/caddy-maxmind-geolocation \
    --output /usr/local/bin/caddy

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata curl

COPY --from=xcaddy-builder /usr/local/bin/caddy /usr/local/bin/caddy
RUN chmod +x /usr/local/bin/caddy

RUN mkdir -p /etc/caddy /data/caddy /config/caddy /var/log/caddy

COPY docker/caddy/download-geoip.sh /download-geoip.sh
RUN chmod +x /download-geoip.sh

COPY docker/caddy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443 2019

ENTRYPOINT ["/entrypoint.sh"]

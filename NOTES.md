
sudo snap install go --classic

go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
# Go path'ini aktif et (veya ~/go/bin/xcaddy olarak kullan)
export PATH=$PATH:$(go env GOPATH)/bin


xcaddy build --with github.com/porech/caddy-maxmind-geolocation

./caddy list-modules | grep maxmind

sudo mkdir -p /etc/caddy
sudo wget -O /etc/caddy/GeoLite2-Country.mmdb.gz https://download.db-ip.com/free/dbip-country-lite-2026-04.mmdb.gz
sudo gunzip /etc/caddy/GeoLite2-Country.mmdb.gz

sudo chmod 644 /etc/caddy/GeoLite2-Country.mmdb



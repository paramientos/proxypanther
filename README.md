
sudo snap install go --classic

go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
# Go path'ini aktif et (veya ~/go/bin/xcaddy olarak kullan)
export PATH=$PATH:$(go env GOPATH)/bin


xcaddy build --with github.com/porech/caddy-maxmind-geolocation

./caddy list-modules | grep maxmind
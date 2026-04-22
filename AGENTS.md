ProxyPanther, sunucunun kapısındaki "güvenlik görevlisi" ve "trafik polisi"dir. Modern web dünyasında artık Nginx'in karmaşık konfigürasyon dosyalarıyla uğraşmak yerine, her şeyi bir arayüzden ve otomatik halletmek isteyenler için bir çözümdür.

İşte ProxyPanther'in kalbindeki özellikler:

1. Neden FrankenPHP / Caddy?
Otomatik SSL: Caddy'nin en büyük gücü Let's Encrypt ile konuşup SSL sertifikalarını saniyeler içinde, hiçbir ayar yapmadan otomatik almasıdır.
Hız: FrankenPHP sayesinde PHP uygulamalarınla (PingPanther gibi) en yüksek performansta konuşur.
Modern Protokoller: HTTP/3 desteğiyle gelir, web sitelerin uçak gibi hızlanır.
2. Ne İşe Yarar? (Reverse Proxy)
Diyelim ki bir sunucunda 5 tane Docker container'ı var:

blog.com -> Port 8001
app.com -> Port 8002
pingpanther.com -> Port 8080
Normalde bunları dış dünyaya açmak zordur. ProxyPanther önüne geçer: "Gelen istek blog.com ise onu 8001'e gönder, SSL'ini ben hallederim" der. Her şeyi tek bir arayüzden, tek tıkla yaparsın.

3. WAF (Web Application Firewall) - "Güvenlik Duvarı"
Sıradan proxy araçlarından (Nginx Proxy Manager gibi) farkı budur:

Saldırı Engelleme: SQL Injection, Cross-Site Scripting (XSS) gibi saldırıları daha uygulamana ulaşmadan engeller.
IP Ban: Şüpheli görünen IP'leri otomatik bloklar.
Bot Koruması: Kötü niyetli botların siteni sömürmesini engeller.
4. Rate Limiting (Hız Sınırı)
"Bu IP adresinden saniyede en fazla 5 istek gelebilir" kuralı koyabilirsin. Böylece birisi sitene saldırdığında veya çok hızlı veri çekmeye çalıştığında sistemin çökmez.

5. Neden PingPanther ile Harika Bir İkili?
Entegrasyon: PingPanther bir servisin çöktüğünü fark ettiğinde, ProxyPanther'e "Bu trafiği yedek (failover) sunucuya yönlendir" komutu verebilir.
Dashboard: Sunucunun ne kadar trafik aldığını, hangi ülkelerden gelindiğini ve kaç saldırının engellendiğini tek bir panelden görürsün.
Özetle Farkı:
Nginx Proxy Manager: Sadece trafiği yönlendirir, güvenliği (WAF) zayıftır, arayüzü eskidir.
Cloudflare: Harikadır ama verin onların elindedir ve her şeyi kontrol edemezsin.
ProxyPanther: Cloudflare'in gücünü kendi sunucuna (On-Prem) getirir. Hem her şey senin kontrolündedir hem de en modern teknolojiyi (Caddy) kullanırsın.
Senaryo: PingPanther'i kuran birisi, hemen yanına ProxyPanther'i de kurar. Böylece hem servislerini izler (Ping), hem de onları dış dünyaya güvenli ve hızlı bir şekilde açar (Proxy).
schedule command çağırırken command ismini değil class ismini yaz

Bu fikir, özellikle "Siber Güvenlik" ve "Altyapı" konularına önem veren profesyonel kullanıcı kitlesini kendine çeker. 

Laravel 13 + Inertia.js + React + manticore UI + Yarn + Vite + Apache E-Charts
nvm use 20.19.0
laravel breeze vs kullanma
socket olacaksa laravel reverb kullan
queue işlemleri için redis + horizon kullan
tasarım için manticore ui kullan
dizayna sadık kal
enterprise bir hava olsun uida
schedule command çağırırken command ismini değil class ismini yaz
cıvık renkler kullanma enterprise-grade ürün yap
tüm butonlar aynı boyutta olmalı ve kesinlikle ikonlu olmalı

kod yazarken yorum satırı yazma

tasarım olarak CISCO ISE gibi görünsün
tasarım renkleri orange olsn cloudflare gibi

kaliteli kod yaz. PSR kurallarına uy.
N+1 işlemlerinden kaçın.
Sistemi yormayacak kod yaz.
DB sorguların optimize olsun
Tablolarda daima indexleme kullan

platfrmda tıklanıp gidilecek nav varsa git ya da modalda bilgi ver

# RTK - Rust Token Killer (Windsurf)

**Usage**: Token-optimized CLI proxy for shell commands.

## Rule

Always prefix shell commands with `rtk` to minimize token consumption.

Examples:

```bash
rtk git status
rtk cargo test
rtk ls src/
rtk grep "pattern" src/
rtk find "*.rs" .
rtk docker ps
rtk gh pr list
```

## Meta Commands

```bash
rtk gain              # Show token savings
rtk gain --history    # Command history with savings
rtk discover          # Find missed RTK opportunities
rtk proxy <cmd>       # Run raw (no filtering, for debugging)
```

## Why

RTK filters and compresses command output before it reaches the LLM context, saving 60-90% tokens on common operations. Always use `rtk <cmd>` instead of raw commands.

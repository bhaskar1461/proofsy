#!/usr/bin/env bash
set -e

echo "=== 1. Setting up 2GB Swap for memory safety on t3.micro ==="
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=128M count=16
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
fi

echo "=== 2. Installing Node.js 20 LTS ==="
if ! command -v node &>/dev/null; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
fi

echo "=== 3. Installing PM2 & Certbot ==="
npm install -g pm2
dnf install -y certbot python3-certbot-nginx

echo "=== 4. Starting Docker & Configuring User ==="
systemctl enable --now docker
usermod -aG docker ec2-user || true

echo "=== 5. Starting MongoDB Container ==="
if ! docker ps -a --format "{{.Names}}" | grep -q "^proofsy-mongo$"; then
  mkdir -p /data/mongo
  docker run -d --name proofsy-mongo \
    --restart unless-stopped \
    -p 127.0.0.1:27017:27017 \
    -v /data/mongo:/data/db \
    mongo:7.0
fi

echo "=== 6. Starting Redis Container ==="
if ! docker ps -a --format "{{.Names}}" | grep -q "^proofsy-redis$"; then
  docker run -d --name proofsy-redis \
    --restart unless-stopped \
    -p 127.0.0.1:6379:6379 \
    redis:7-alpine
fi

echo "=== 7. System & Services Status ==="
docker ps
node -v
npm -v
pm2 -v
free -m
echo "=== PROVISIONING_COMPLETE ==="

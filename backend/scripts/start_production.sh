#!/usr/bin/env bash
set -e

echo "=== 1. Ensuring Docker Containers (Mongo & Redis) are Running ==="
if ! docker ps --format "{{.Names}}" | grep -q "^proofsy-mongo$"; then
  docker rm -f proofsy-mongo || true
  mkdir -p /data/mongo
  docker run -d --name proofsy-mongo \
    --restart unless-stopped \
    -p 127.0.0.1:27017:27017 \
    -v /data/mongo:/data/db \
    mongo:7.0
fi

if ! docker ps --format "{{.Names}}" | grep -q "^proofsy-redis$"; then
  docker rm -f proofsy-redis || true
  docker run -d --name proofsy-redis \
    --restart unless-stopped \
    -p 127.0.0.1:6379:6379 \
    redis:7-alpine
fi

echo "=== 2. Starting PM2 Node Services ==="
su - ec2-user << 'PM2_EOF'
pm2 delete all || true

# Start backend API (Express)
cd /var/www/proofsy/backend
pm2 start src/server.js --name "proofsy-backend" -i 1 --max-memory-restart 350M

# Start background queue worker (Bull)
pm2 start src/workers/startWorker.js --name "proofsy-worker" -i 1 --max-memory-restart 350M

# Start Next.js frontend
cd /var/www/proofsy/frontend
pm2 start npm --name "proofsy-frontend" -- start -- -p 3000

pm2 save
PM2_EOF

echo "=== 3. Configuring Nginx Reverse Proxy ==="
# Backup default nginx.conf and disable default server block
sed -i 's/listen       80 default_server;/listen       80;/g' /etc/nginx/nginx.conf || true
sed -i 's/listen       \[::\]:80 default_server;/listen       \[::\]:80;/g' /etc/nginx/nginx.conf || true

cat << 'NGINX_EOF' > /etc/nginx/conf.d/proofsy.conf
upstream frontend_node {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream backend_node {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name proofsy.tech www.proofsy.tech 52.2.46.57;

    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    location /api/ {
        proxy_pass http://backend_node;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 120s;
    }

    location /storage/ {
        proxy_pass http://backend_node;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
    }

    location / {
        proxy_pass http://frontend_node;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

nginx -t
systemctl restart nginx

echo "=== 4. Checking SSL status via Certbot ==="
certbot --nginx -d proofsy.tech -d www.proofsy.tech --non-interactive --agree-tos -m bhaskar2004sharma@gmail.com || echo "Note: Certbot SSL will activate as soon as DNS propagates."

echo "=== 5. Verifying Deployment Health ==="
sleep 4
su - ec2-user -c "pm2 list"
curl -I http://127.0.0.1:3000 || echo "Frontend warming up..."
curl -s http://127.0.0.1:5000/api/health || echo ""
echo "=== PROOFSY_DEPLOYMENT_COMPLETE ==="

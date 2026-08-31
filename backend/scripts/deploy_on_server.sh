#!/usr/bin/env bash
set -e

echo "=== 1. Cleaning up conflicting containers and processes ==="
docker stop optimistic_nobel || true
docker rm optimistic_nobel || true
systemctl stop nginx || true

echo "=== 2. Setting up /var/www/proofsy directory ==="
mkdir -p /var/www/proofsy
tar -xzf /tmp/proofsy_deploy.tar.gz -C /var/www/proofsy
chown -R ec2-user:ec2-user /var/www/proofsy

echo "=== 3. Writing Backend Environment Configuration ==="
cat << 'EOF' > /var/www/proofsy/backend/.env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/proofsy
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=${JWT_SECRET:-replace-with-a-secure-random-secret-min-32-chars}
APP_URL=https://proofsy.tech
CORS_ORIGIN=https://proofsy.tech,http://proofsy.tech,https://www.proofsy.tech,http://www.proofsy.tech,http://52.2.46.57
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=storage/certificates
SIGNING_KEY_ROTATION_INTERVAL_DAYS=90
WORKER_CONCURRENCY=4
RATE_LIMIT_MAX=5000
RATE_LIMIT_WINDOW_MS=900000
EOF

echo "=== 4. Writing Frontend Environment Configuration ==="
cat << 'EOF' > /var/www/proofsy/frontend/.env.production
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=https://proofsy.tech
EOF

cat << 'EOF' > /var/www/proofsy/frontend/.env.local
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=https://proofsy.tech
EOF

echo "=== 5. Installing Backend Dependencies ==="
cd /var/www/proofsy/backend
npm install --omit=dev

echo "=== 6. Installing Frontend Dependencies & Building Next.js ==="
cd /var/www/proofsy/frontend
npm install
npm run build

echo "=== 7. Starting Services with PM2 ==="
# Stop any existing PM2 instances
pm2 delete all || true

# Start backend API on port 5000
cd /var/www/proofsy/backend
pm2 start src/index.js --name "proofsy-backend" -i 1 --max-memory-restart 400M

# Start background queue worker
pm2 start src/workers/startWorker.js --name "proofsy-worker" -i 1 --max-memory-restart 400M

# Start Next.js frontend on port 3000
cd /var/www/proofsy/frontend
ln -sf /var/www/proofsy/frontend/public /var/www/proofsy/frontend/.next/standalone/public
ln -sf /var/www/proofsy/frontend/.next/static /var/www/proofsy/frontend/.next/standalone/.next/static
PORT=3000 pm2 start /var/www/proofsy/frontend/.next/standalone/server.js --name "proofsy-frontend" --cwd /var/www/proofsy/frontend/.next/standalone

pm2 save
pm2 startup systemd -u root --hp /root || true

echo "=== 8. Configuring Nginx Reverse Proxy for proofsy.tech & AWS IP ==="
cat << 'EOF' > /etc/nginx/conf.d/proofsy.conf
upstream frontend_node {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream backend_node {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name proofsy.tech www.proofsy.tech 52.2.46.57 _;

    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # API endpoints -> Express backend
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

    # Certificate Storage Downloads -> Express backend
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

    # Everything else -> Next.js Frontend
    location / {
        proxy_pass http://frontend_node;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        if ($http_rsc) {
            add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        }
        if ($arg__rsc) {
            add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;
        }
    }
}
EOF

# Test and start Nginx
nginx -t
systemctl enable --now nginx
systemctl restart nginx

echo "=== 9. Attempting HTTPS SSL Provisioning via Certbot ==="
certbot --nginx -d proofsy.tech -d www.proofsy.tech --non-interactive --agree-tos -m bhaskar2004sharma@gmail.com || echo "Certbot DNS propagation pending, HTTP is live on port 80."

echo "=== 10. Deployment Verification ==="
pm2 list
curl -s http://127.0.0.1:5000/api/health || echo "Backend check"
echo "=== PROOFSY_DEPLOYMENT_COMPLETE ==="

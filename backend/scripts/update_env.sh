#!/usr/bin/env bash
set -e

cat << 'EOF' > /var/www/proofsy/backend/.env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/proofsy
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=${JWT_SECRET:-replace-with-a-secure-random-secret-min-32-chars}
APP_URL=https://proofsy.tech
FRONTEND_URL=https://proofsy.tech
PUBLIC_APP_URL=https://proofsy.tech
CORS_ORIGIN=https://proofsy.tech,http://proofsy.tech,https://www.proofsy.tech,http://52.2.46.57
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=storage/certificates
ALLOW_LOCAL_STORAGE=true
SIGNING_KEY_ROTATION_INTERVAL_DAYS=90
WORKER_CONCURRENCY=4
RATE_LIMIT_MAX=5000
RATE_LIMIT_WINDOW_MS=900000

# SMTP Configuration (Configure with your credentials)
SMTP_HOST=${SMTP_HOST:-smtp.example.com}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_SECURE=${SMTP_SECURE:-false}
SMTP_USER=${SMTP_USER:-certificates@proofsy.tech}
SMTP_PASS=${SMTP_PASS:-your-smtp-password}
EMAIL_FROM=${EMAIL_FROM:-certificates@proofsy.tech}
EMAIL_FROM_NAME="Proofsy Verifications"

# AI Configuration (Optional)
AI_PROVIDER=${AI_PROVIDER:-groq}
GROQ_API_KEY=${GROQ_API_KEY:-your-groq-api-key}
GROQ_MODEL=${GROQ_MODEL:-qwen/qwen3.6-27b}
EOF

su - ec2-user -c "pm2 restart all --update-env"
echo "=== ENV_UPDATED_AND_SERVICES_RESTARTED ==="

#!/usr/bin/env bash
set -e

cd /var/www/proofsy/frontend
tar -xzf /tmp/next_clean.tar.gz
chown -R ec2-user:ec2-user /var/www/proofsy

su - ec2-user << 'EOF'
pm2 restart all --update-env
sleep 2
pm2 list
EOF

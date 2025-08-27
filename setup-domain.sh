#!/bin/bash

# Setup domain chat.vinagpu.com with SSL
# Run as root: sudo ./setup-domain.sh

set -e

DOMAIN="chat.vinagpu.com"
EMAIL="admin@vinagpu.com"  # Change this to your email
FRONTEND_PORT=3000
BACKEND_PORT=3001
SERVER_IP="160.250.54.23"

echo "🚀 Setting up domain $DOMAIN with SSL..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo ./setup-domain.sh"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Nginx
echo "🌐 Installing Nginx..."
apt install nginx -y
systemctl enable nginx
systemctl start nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL..."
apt install snapd -y
snap install core; snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

# Create Nginx configuration
echo "⚙️ Creating Nginx configuration..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Backend API (NestJS)
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket (Socket.IO)
    location /socket.io/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Enable the site
echo "🔗 Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Get SSL certificate
echo "🔒 Getting SSL certificate from Let's Encrypt..."
certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

# Setup auto-renewal
echo "⏰ Setting up SSL auto-renewal..."
systemctl enable snap.certbot.renew.timer

# Create systemd services for the applications
echo "🔧 Creating systemd services..."

# Backend service
cat > /etc/systemd/system/chatgpt-backend.service << EOF
[Unit]
Description=ChatGPT Clone Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/chat-vinagpuv1/backend
Environment=NODE_ENV=production
Environment=PORT=$BACKEND_PORT
Environment=FRONTEND_URL=https://$DOMAIN
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
cat > /etc/systemd/system/chatgpt-frontend.service << EOF
[Unit]
Description=ChatGPT Clone Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/chat-vinagpuv1/frontend
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=https://$DOMAIN
Environment=NEXT_PUBLIC_WS_URL=https://$DOMAIN
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
echo "🚀 Enabling and starting services..."
systemctl daemon-reload
systemctl enable chatgpt-backend
systemctl enable chatgpt-frontend

# Update environment files
echo "📝 Updating environment files..."

# Backend environment
cat > /root/chat-vinagpuv1/backend/.env << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatgpt_clone?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="gemma3:latest"
PORT=$BACKEND_PORT
NODE_ENV="production"
FRONTEND_URL="https://$DOMAIN"
EOF

# Frontend environment
cat > /root/chat-vinagpuv1/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN
NEXT_PUBLIC_WS_URL=https://$DOMAIN
EOF

# Build applications
echo "🔨 Building applications..."
cd /root/chat-vinagpuv1

# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build

# Start services
echo "▶️ Starting services..."
systemctl start chatgpt-backend
systemctl start chatgpt-frontend

# Setup firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "✅ Domain setup completed!"
echo ""
echo "🌐 Your ChatGPT Clone is now available at:"
echo "   https://$DOMAIN"
echo ""
echo "📊 Service status:"
systemctl status chatgpt-backend --no-pager -l
systemctl status chatgpt-frontend --no-pager -l
echo ""
echo "📝 Useful commands:"
echo "   Check backend logs: journalctl -u chatgpt-backend -f"
echo "   Check frontend logs: journalctl -u chatgpt-frontend -f"
echo "   Restart backend: systemctl restart chatgpt-backend"
echo "   Restart frontend: systemctl restart chatgpt-frontend"
echo "   Check SSL: certbot certificates"
echo "   Renew SSL: certbot renew"
echo ""
echo "🔒 SSL certificate will auto-renew every 60 days"
echo ""
echo "⚠️  Make sure to:"
echo "   1. Point $DOMAIN DNS A record to $SERVER_IP"
echo "   2. Ensure Ollama is running: ollama serve"
echo "   3. Check that PostgreSQL is running"

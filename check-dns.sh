#!/bin/bash

# DNS and connectivity checker for chat.vinagpu.com

DOMAIN="chat.vinagpu.com"
SERVER_IP="160.250.54.23"

echo "🔍 Checking DNS and connectivity for $DOMAIN"
echo "================================================"

# Check DNS resolution
echo "📡 DNS Resolution:"
dig +short $DOMAIN
echo ""

# Check if domain points to correct IP
RESOLVED_IP=$(dig +short $DOMAIN | head -n1)
if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS correctly points to $SERVER_IP"
else
    echo "❌ DNS issue: $DOMAIN resolves to $RESOLVED_IP, should be $SERVER_IP"
    echo ""
    echo "🔧 To fix DNS:"
    echo "   1. Go to your domain registrar (GoDaddy, Namecheap, etc.)"
    echo "   2. Add/Update A record:"
    echo "      Name: chat"
    echo "      Type: A"
    echo "      Value: $SERVER_IP"
    echo "      TTL: 300 (5 minutes)"
fi
echo ""

# Check HTTP connectivity
echo "🌐 HTTP Connectivity:"
if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200\|301\|302"; then
    echo "✅ HTTP connection successful"
else
    echo "❌ HTTP connection failed"
fi

# Check HTTPS connectivity
echo "🔒 HTTPS Connectivity:"
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    echo "✅ HTTPS connection successful"
else
    echo "❌ HTTPS connection failed"
fi
echo ""

# Check SSL certificate
echo "🔐 SSL Certificate:"
if command -v openssl &> /dev/null; then
    SSL_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate is valid"
        echo "$SSL_INFO"
    else
        echo "❌ SSL certificate issue"
    fi
else
    echo "⚠️  OpenSSL not available for certificate check"
fi
echo ""

# Check ports
echo "🔌 Port Connectivity:"
for port in 80 443; do
    if nc -z $DOMAIN $port 2>/dev/null; then
        echo "✅ Port $port is open"
    else
        echo "❌ Port $port is closed"
    fi
done
echo ""

# Check local services
echo "🏠 Local Services:"
for port in 3000 3001; do
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ Local port $port is running"
    else
        echo "❌ Local port $port is not running"
    fi
done
echo ""

# Performance test
echo "⚡ Performance Test:"
if command -v curl &> /dev/null; then
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" https://$DOMAIN 2>/dev/null || echo "failed")
    if [ "$RESPONSE_TIME" != "failed" ]; then
        echo "✅ Response time: ${RESPONSE_TIME}s"
    else
        echo "❌ Performance test failed"
    fi
fi

echo ""
echo "🔧 Troubleshooting Tips:"
echo "   - If DNS fails: Update A record at domain registrar"
echo "   - If HTTP fails: Check nginx status and firewall"
echo "   - If HTTPS fails: Check SSL certificate with 'sudo certbot certificates'"
echo "   - If local services fail: Check with './manage-domain.sh status'"

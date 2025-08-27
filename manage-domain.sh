#!/bin/bash

# Domain management script for chat.vinagpu.com
# Usage: ./manage-domain.sh [start|stop|restart|status|logs|ssl]

DOMAIN="chat.vinagpu.com"

case "$1" in
    start)
        echo "🚀 Starting ChatGPT Clone services..."
        sudo systemctl start chatgpt-backend
        sudo systemctl start chatgpt-frontend
        sudo systemctl start nginx
        echo "✅ Services started"
        ;;
    
    stop)
        echo "🛑 Stopping ChatGPT Clone services..."
        sudo systemctl stop chatgpt-backend
        sudo systemctl stop chatgpt-frontend
        echo "✅ Services stopped"
        ;;
    
    restart)
        echo "🔄 Restarting ChatGPT Clone services..."
        sudo systemctl restart chatgpt-backend
        sudo systemctl restart chatgpt-frontend
        sudo systemctl reload nginx
        echo "✅ Services restarted"
        ;;
    
    status)
        echo "📊 Service Status:"
        echo ""
        echo "Backend:"
        sudo systemctl status chatgpt-backend --no-pager -l
        echo ""
        echo "Frontend:"
        sudo systemctl status chatgpt-frontend --no-pager -l
        echo ""
        echo "Nginx:"
        sudo systemctl status nginx --no-pager -l
        ;;
    
    logs)
        echo "📝 Service Logs (Press Ctrl+C to exit):"
        echo ""
        if [ "$2" = "backend" ]; then
            sudo journalctl -u chatgpt-backend -f
        elif [ "$2" = "frontend" ]; then
            sudo journalctl -u chatgpt-frontend -f
        elif [ "$2" = "nginx" ]; then
            sudo journalctl -u nginx -f
        else
            echo "Usage: $0 logs [backend|frontend|nginx]"
            echo "Example: $0 logs backend"
        fi
        ;;
    
    ssl)
        echo "🔒 SSL Certificate Status:"
        sudo certbot certificates
        echo ""
        echo "To renew SSL certificate:"
        echo "sudo certbot renew"
        ;;
    
    update)
        echo "🔄 Updating application..."
        cd /root/chat-vinagpuv1
        
        # Stop services
        sudo systemctl stop chatgpt-backend
        sudo systemctl stop chatgpt-frontend
        
        # Pull latest code (if using git)
        # git pull
        
        # Install dependencies
        cd backend && npm install
        cd ../frontend && npm install
        
        # Build applications
        cd ../backend && npm run build
        cd ../frontend && npm run build
        
        # Start services
        sudo systemctl start chatgpt-backend
        sudo systemctl start chatgpt-frontend
        
        echo "✅ Application updated and restarted"
        ;;
    
    backup)
        echo "💾 Creating backup..."
        BACKUP_DIR="/root/backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p $BACKUP_DIR
        
        # Backup database
        sudo -u postgres pg_dump chatgpt_clone > $BACKUP_DIR/database.sql
        
        # Backup application files
        cp -r /root/chat-vinagpuv1 $BACKUP_DIR/
        
        # Backup nginx config
        cp /etc/nginx/sites-available/$DOMAIN $BACKUP_DIR/nginx.conf
        
        echo "✅ Backup created at $BACKUP_DIR"
        ;;
    
    monitor)
        echo "📊 System Monitor (Press Ctrl+C to exit):"
        watch -n 2 "
        echo '=== Service Status ==='
        systemctl is-active chatgpt-backend chatgpt-frontend nginx
        echo ''
        echo '=== System Resources ==='
        free -h
        echo ''
        df -h /
        echo ''
        echo '=== Network ==='
        ss -tlnp | grep -E ':(80|443|3000|3001)'
        "
        ;;
    
    *)
        echo "🔧 ChatGPT Clone Domain Management"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start     - Start all services"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  status    - Show service status"
        echo "  logs      - Show logs [backend|frontend|nginx]"
        echo "  ssl       - Show SSL certificate status"
        echo "  update    - Update and restart application"
        echo "  backup    - Create backup"
        echo "  monitor   - Real-time system monitor"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs backend"
        echo "  $0 ssl"
        ;;
esac

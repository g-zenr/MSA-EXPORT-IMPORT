#!/bin/bash

# EC2 User Data Script for Data Export Service
# This script runs when the EC2 instance first boots up

# Update system
yum update -y

# Install essential packages
yum install -y git curl wget unzip

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
yum install -y nginx
systemctl enable nginx

# Create application directory
mkdir -p /opt/data-export-service
cd /opt/data-export-service

# Clone the repository (replace with your actual repo URL)
git clone https://github.com/g-zenr/MSA-EXPORT-IMPORT.git .

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
EOF

# Build and start the application with Docker
docker-compose up -d --build

# Configure Nginx
cat > /etc/nginx/conf.d/data-export.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Start Nginx
systemctl start nginx

# Create a simple health check script
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy"
    exit 1
fi
EOF

chmod +x /opt/health-check.sh

# Setup log rotation
cat > /etc/logrotate.d/data-export << 'EOF'
/opt/data-export-service/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
}
EOF

echo "EC2 instance setup completed!" 
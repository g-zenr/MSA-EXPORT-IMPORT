# AWS EC2 Setup Guide for Data Export Service

This guide will help you deploy your Node.js data export service to AWS EC2.

## Prerequisites

1. **AWS Account**: You'll need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure AWS CLI
3. **SSH Key Pair**: Create or use an existing EC2 key pair
4. **Domain Name** (optional): For custom domain setup

## Step 1: Create EC2 Instance

### Option A: Using AWS Console

1. **Launch EC2 Instance**:

   - Go to AWS Console → EC2 → Launch Instance
   - Choose Amazon Linux 2023 (recommended)
   - Select t3.micro (free tier) or t3.small for production
   - Configure Security Group (see below)
   - Create or select existing key pair

2. **Security Group Configuration**:
   ```
   Inbound Rules:
   - SSH (22): Your IP or 0.0.0.0/0
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Custom TCP (3000): 0.0.0.0/0 (for your app)
   ```

### Option B: Using AWS CLI

```bash
# Create security group
aws ec2 create-security-group \
    --group-name data-export-sg \
    --description "Security group for data export service"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-name data-export-sg \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name data-export-sg \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-name data-export-sg \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0

# Launch EC2 instance
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --count 1 \
    --instance-type t3.micro \
    --key-name your-key-pair-name \
    --security-group-ids sg-xxxxxxxxx \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=DataExportService}]'
```

## Step 2: Connect to EC2 Instance

```bash
# Connect via SSH
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for docker group to take effect
exit
```

## Step 3: Deploy Application

### Option A: Deploy with Docker (Recommended)

1. **Clone your repository**:

```bash
git clone https://github.com/your-username/MSA-EXPORT-IMPORT.git
cd MSA-EXPORT-IMPORT
```

2. **Create environment file**:

```bash
cp .env.example .env
# Edit .env with your production settings
```

3. **Build and run with Docker**:

```bash
docker-compose up -d --build
```

### Option B: Deploy without Docker

1. **Install dependencies**:

```bash
npm install
npm run build
```

2. **Install PM2 for process management**:

```bash
npm install -g pm2
```

3. **Start the application**:

```bash
pm2 start dist/app.js --name "data-export-service"
pm2 startup
pm2 save
```

## Step 4: Setup Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo yum install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/conf.d/data-export.conf > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 5: Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 6: Monitoring and Logs

### Setup CloudWatch Agent (Optional)

```bash
# Install CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### View Application Logs

```bash
# If using Docker
docker-compose logs -f

# If using PM2
pm2 logs

# If using systemd
sudo journalctl -u your-service-name -f
```

## Step 7: Backup and Maintenance

### Create AMI Backup

```bash
# In AWS Console or CLI
aws ec2 create-image \
    --instance-id i-xxxxxxxxx \
    --name "data-export-service-backup-$(date +%Y%m%d)" \
    --description "Backup of data export service"
```

### Setup Auto Scaling (Optional)

1. Create Launch Template with your AMI
2. Create Auto Scaling Group
3. Configure scaling policies

## Troubleshooting

### Common Issues

1. **Port 3000 not accessible**:

   - Check security group rules
   - Verify application is running: `netstat -tlnp | grep 3000`

2. **Docker permission issues**:

   - Logout and login again after adding user to docker group
   - Or run: `newgrp docker`

3. **Memory issues**:

   - Monitor with: `free -h`
   - Consider upgrading instance type

4. **Application crashes**:
   - Check logs: `docker-compose logs` or `pm2 logs`
   - Verify environment variables

### Useful Commands

```bash
# Check system resources
htop
df -h
free -h

# Check running processes
ps aux | grep node
docker ps

# Check network
netstat -tlnp
curl localhost:3000/health

# Restart services
sudo systemctl restart nginx
docker-compose restart
pm2 restart all
```

## Cost Optimization

1. **Use Spot Instances** for non-critical workloads
2. **Reserved Instances** for predictable usage
3. **Auto Scaling** to scale down during low usage
4. **CloudWatch** to monitor and optimize costs

## Security Best Practices

1. **Use IAM roles** instead of access keys
2. **Regular security updates**: `sudo yum update -y`
3. **Firewall rules**: Restrict SSH access to your IP
4. **SSL/TLS**: Always use HTTPS in production
5. **Backup strategy**: Regular AMI snapshots
6. **Monitoring**: Set up CloudWatch alarms

## Next Steps

1. **Domain Setup**: Configure your domain DNS
2. **CDN**: Consider CloudFront for global distribution
3. **Database**: Add RDS if needed
4. **Load Balancer**: Add ALB for high availability
5. **CI/CD**: Setup GitHub Actions or AWS CodePipeline

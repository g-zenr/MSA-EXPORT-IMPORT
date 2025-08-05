#!/bin/bash

# AWS EC2 Deployment Script for Data Export Service
# This script automates the deployment of your application to AWS EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="data-export-service"
REGION="us-east-1"
INSTANCE_TYPE="t3.micro"

echo -e "${GREEN}🚀 Starting AWS EC2 deployment for Data Export Service${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get VPC and Subnet information
echo -e "${YELLOW}📋 Getting VPC and Subnet information...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[?IsDefault==`true`].VpcId' --output text --region $REGION)
SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text --region $REGION)

echo "VPC ID: $VPC_ID"
echo "Subnet ID: $SUBNET_ID"

# Check if key pair exists, if not create one
KEY_PAIR_NAME="data-export-key"
if ! aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}🔑 Creating key pair: $KEY_PAIR_NAME${NC}"
    aws ec2 create-key-pair --key-name $KEY_PAIR_NAME --query 'KeyMaterial' --output text --region $REGION > $KEY_PAIR_NAME.pem
    chmod 400 $KEY_PAIR_NAME.pem
    echo -e "${GREEN}✅ Key pair created and saved to $KEY_PAIR_NAME.pem${NC}"
else
    echo -e "${GREEN}✅ Key pair $KEY_PAIR_NAME already exists${NC}"
fi

# Deploy CloudFormation stack
echo -e "${YELLOW}☁️  Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
    --template-file aws/cloudformation-template.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        KeyPairName=$KEY_PAIR_NAME \
        InstanceType=$INSTANCE_TYPE \
        VpcId=$VPC_ID \
        SubnetId=$SUBNET_ID \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

# Get stack outputs
echo -e "${YELLOW}📊 Getting stack outputs...${NC}"
INSTANCE_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' \
    --output text \
    --region $REGION)

PUBLIC_IP=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue' \
    --output text \
    --region $REGION)

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}📋 Deployment Summary:${NC}"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "Application URL: http://$PUBLIC_IP"
echo "SSH Command: ssh -i $KEY_PAIR_NAME.pem ec2-user@$PUBLIC_IP"
echo ""
echo -e "${YELLOW}⏳ Waiting for instance to be ready...${NC}"

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Wait a bit more for the user data script to complete
echo -e "${YELLOW}⏳ Waiting for application to start (this may take a few minutes)...${NC}"
sleep 120

# Test the application
echo -e "${YELLOW}🧪 Testing application...${NC}"
if curl -f http://$PUBLIC_IP/health &> /dev/null; then
    echo -e "${GREEN}✅ Application is running successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Application might still be starting up. Please check manually in a few minutes.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo "Your Data Export Service is now running at: http://$PUBLIC_IP"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test the API endpoints"
echo "2. Configure your domain (optional)"
echo "3. Setup SSL certificate (optional)"
echo "4. Monitor the application logs"
echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "SSH into instance: ssh -i $KEY_PAIR_NAME.pem ec2-user@$PUBLIC_IP"
echo "View logs: docker-compose logs -f"
echo "Restart app: docker-compose restart"
echo "Check status: docker-compose ps" 
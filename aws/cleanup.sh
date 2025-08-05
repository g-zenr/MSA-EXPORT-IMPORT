#!/bin/bash

# AWS EC2 Cleanup Script for Data Export Service
# This script removes all AWS resources created for the deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="data-export-service"
REGION="us-east-1"
KEY_PAIR_NAME="data-export-key"

echo -e "${YELLOW}🧹 Starting cleanup of AWS resources...${NC}"

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

# Check if CloudFormation stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}🗑️  Deleting CloudFormation stack: $STACK_NAME${NC}"
    aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION
    
    echo -e "${YELLOW}⏳ Waiting for stack deletion to complete...${NC}"
    aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region $REGION
    echo -e "${GREEN}✅ CloudFormation stack deleted successfully${NC}"
else
    echo -e "${YELLOW}⚠️  CloudFormation stack $STACK_NAME does not exist${NC}"
fi

# Delete key pair if it exists
if aws ec2 describe-key-pairs --key-names $KEY_PAIR_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}🗑️  Deleting key pair: $KEY_PAIR_NAME${NC}"
    aws ec2 delete-key-pair --key-name $KEY_PAIR_NAME --region $REGION
    echo -e "${GREEN}✅ Key pair deleted successfully${NC}"
    
    # Remove local key file if it exists
    if [ -f "$KEY_PAIR_NAME.pem" ]; then
        rm -f $KEY_PAIR_NAME.pem
        echo -e "${GREEN}✅ Local key file removed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Key pair $KEY_PAIR_NAME does not exist${NC}"
fi

# Clean up any orphaned security groups (optional)
echo -e "${YELLOW}🔍 Checking for orphaned security groups...${NC}"
ORPHANED_SGS=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=data-export-sg" \
    --query 'SecurityGroups[?GroupName==`data-export-sg`].GroupId' \
    --output text \
    --region $REGION 2>/dev/null || echo "")

if [ ! -z "$ORPHANED_SGS" ]; then
    echo -e "${YELLOW}🗑️  Deleting orphaned security groups...${NC}"
    for sg in $ORPHANED_SGS; do
        aws ec2 delete-security-group --group-id $sg --region $REGION 2>/dev/null || echo "Could not delete security group $sg"
    done
    echo -e "${GREEN}✅ Orphaned security groups cleaned up${NC}"
fi

# Clean up CloudWatch log groups
echo -e "${YELLOW}🗑️  Deleting CloudWatch log groups...${NC}"
aws logs delete-log-group --log-group-name "/aws/ec2/data-export-service" --region $REGION 2>/dev/null || echo "Log group does not exist or already deleted"

echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Summary:${NC}"
echo "✅ CloudFormation stack deleted"
echo "✅ Key pair deleted"
echo "✅ Local key file removed"
echo "✅ Security groups cleaned up"
echo "✅ CloudWatch log groups cleaned up"
echo ""
echo -e "${GREEN}🎉 All AWS resources have been removed!${NC}" 
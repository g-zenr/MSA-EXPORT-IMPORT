#!/bin/bash

# Bash Deployment Script for AWS Lambda
# This script sets up AWS credentials and deploys your application

echo "🚀 MSA Export/Import - AWS Lambda Deployment"
echo "============================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   # macOS: brew install awscli"
    echo "   # Linux: curl \"https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip\" -o \"awscliv2.zip\""
    exit 1
else
    echo "✅ AWS CLI is installed"
fi

# Set AWS credentials
echo "🔑 Setting up AWS credentials..."
export AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="us-east-1"

# Test AWS credentials
echo "🔍 Testing AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS credentials are valid"
    aws sts get-caller-identity --output table
else
    echo "❌ AWS credentials are invalid. Please check your credentials."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to AWS
echo "🚀 Deploying to AWS Lambda..."
npm run deploy

echo "✅ Deployment completed!"
echo "📋 Check the output above for your API endpoint URL" 
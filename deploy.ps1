# PowerShell Deployment Script for AWS Lambda
# This script sets up AWS credentials and deploys your application

Write-Host "🚀 MSA Export/Import - AWS Lambda Deployment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   winget install AWS.AWSCLI" -ForegroundColor Yellow
    exit 1
}

# Set AWS credentials
Write-Host "🔑 Setting up AWS credentials..." -ForegroundColor Yellow
$env:AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
$env:AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
$env:AWS_DEFAULT_REGION="us-east-1"

# Test AWS credentials
Write-Host "🔍 Testing AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ AWS credentials are valid" -ForegroundColor Green
    Write-Host "   Account: $($identity.Account)" -ForegroundColor Cyan
    Write-Host "   User: $($identity.Arn)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ AWS credentials are invalid. Please check your credentials." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Deploy to AWS
Write-Host "🚀 Deploying to AWS Lambda..." -ForegroundColor Yellow
npm run deploy

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "📋 Check the output above for your API endpoint URL" -ForegroundColor Cyan 
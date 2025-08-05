@echo off
REM AWS EC2 Deployment Script for Data Export Service (Windows Version)
REM This script automates the deployment of your application to AWS EC2

echo 🚀 Starting AWS EC2 deployment for Data Export Service

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo ❌ AWS CLI is not installed. Please install it first.
    exit /b 1
)

REM Check if AWS credentials are configured
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ❌ AWS credentials are not configured. Please run 'aws configure' first.
    exit /b 1
)

REM Configuration
set STACK_NAME=data-export-service
set REGION=us-east-1
set INSTANCE_TYPE=t3.micro

echo 📋 Getting VPC and Subnet information...
for /f "tokens=*" %%i in ('aws ec2 describe-vpcs --query "Vpcs[?IsDefault==`true`].VpcId" --output text --region %REGION%') do set VPC_ID=%%i
for /f "tokens=*" %%i in ('aws ec2 describe-subnets --filters "Name=vpc-id,Values=%VPC_ID%" --query "Subnets[0].SubnetId" --output text --region %REGION%') do set SUBNET_ID=%%i

echo VPC ID: %VPC_ID%
echo Subnet ID: %SUBNET_ID%

REM Check if key pair exists, if not create one
set KEY_PAIR_NAME=data-export-key
aws ec2 describe-key-pairs --key-names %KEY_PAIR_NAME% --region %REGION% >nul 2>&1
if errorlevel 1 (
    echo 🔑 Creating key pair: %KEY_PAIR_NAME%
    aws ec2 create-key-pair --key-name %KEY_PAIR_NAME% --query "KeyMaterial" --output text --region %REGION% > %KEY_PAIR_NAME%.pem
    echo ✅ Key pair created and saved to %KEY_PAIR_NAME%.pem
) else (
    echo ✅ Key pair %KEY_PAIR_NAME% already exists
)

REM Deploy CloudFormation stack
echo ☁️  Deploying CloudFormation stack...
aws cloudformation deploy ^
    --template-file aws/cloudformation-template.yml ^
    --stack-name %STACK_NAME% ^
    --parameter-overrides KeyPairName=%KEY_PAIR_NAME% InstanceType=%INSTANCE_TYPE% VpcId=%VPC_ID% SubnetId=%SUBNET_ID% ^
    --capabilities CAPABILITY_NAMED_IAM ^
    --region %REGION%

REM Get stack outputs
echo 📊 Getting stack outputs...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --query "Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue" --output text --region %REGION%') do set INSTANCE_ID=%%i
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --query "Stacks[0].Outputs[?OutputKey==`PublicIP`].OutputValue" --output text --region %REGION%') do set PUBLIC_IP=%%i

echo ✅ Deployment completed successfully!
echo.
echo 📋 Deployment Summary:
echo Instance ID: %INSTANCE_ID%
echo Public IP: %PUBLIC_IP%
echo Application URL: http://%PUBLIC_IP%
echo SSH Command: ssh -i %KEY_PAIR_NAME%.pem ec2-user@%PUBLIC_IP%
echo.
echo ⏳ Waiting for instance to be ready...

REM Wait for instance to be running
aws ec2 wait instance-running --instance-ids %INSTANCE_ID% --region %REGION%

REM Wait a bit more for the user data script to complete
echo ⏳ Waiting for application to start (this may take a few minutes)...
timeout /t 120 /nobreak >nul

REM Test the application
echo 🧪 Testing application...
curl -f http://%PUBLIC_IP%/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Application might still be starting up. Please check manually in a few minutes.
) else (
    echo ✅ Application is running successfully!
)

echo.
echo 🎉 Deployment completed!
echo Your Data Export Service is now running at: http://%PUBLIC_IP%
echo.
echo 📝 Next steps:
echo 1. Test the API endpoints
echo 2. Configure your domain (optional)
echo 3. Setup SSL certificate (optional)
echo 4. Monitor the application logs
echo.
echo 🔧 Useful commands:
echo SSH into instance: ssh -i %KEY_PAIR_NAME%.pem ec2-user@%PUBLIC_IP%
echo View logs: docker-compose logs -f
echo Restart app: docker-compose restart
echo Check status: docker-compose ps

pause 
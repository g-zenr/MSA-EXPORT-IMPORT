# ✅ Deployment Checklist

## Pre-Deployment Checklist

### ☐ Prerequisites
- [ ] Node.js 18+ installed
- [ ] AWS CLI installed
- [ ] Git installed
- [ ] AWS account created
- [ ] IAM user created with proper permissions
- [ ] AWS credentials obtained

### ☐ Environment Setup
- [ ] AWS CLI configured (`aws configure`)
- [ ] Serverless Framework installed (`npm install -g serverless`)
- [ ] Project dependencies installed (`npm install`)
- [ ] Environment variables set (if using)

## Deployment Steps

### ☐ Step 1: Build Application
```bash
npm run build
```

### ☐ Step 2: Deploy to AWS
```bash
npm run deploy
```

### ☐ Step 3: Verify Deployment
- [ ] Check deployment output for endpoint URL
- [ ] Test health endpoint
- [ ] Test export endpoint
- [ ] Check Lambda logs for errors

## Post-Deployment Verification

### ☐ API Testing
- [ ] Health endpoint returns 200 OK
- [ ] Export endpoint converts JSON to CSV
- [ ] Import endpoint accepts CSV files
- [ ] CORS headers are present
- [ ] Rate limiting is working

### ☐ Monitoring Setup
- [ ] CloudWatch logs are accessible
- [ ] Lambda metrics are visible
- [ ] API Gateway metrics are available
- [ ] Error rate is acceptable (< 1%)

### ☐ Security Verification
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] No sensitive data in logs

## Troubleshooting Checklist

### ☐ If Deployment Fails
- [ ] Check AWS credentials
- [ ] Verify IAM permissions
- [ ] Check serverless logs
- [ ] Verify Node.js version
- [ ] Check TypeScript compilation

### ☐ If API Returns 500 Errors
- [ ] Check Lambda logs
- [ ] Verify environment variables
- [ ] Check file permissions
- [ ] Test locally with `npm run offline`

### ☐ If Performance Issues
- [ ] Check memory usage
- [ ] Monitor cold start times
- [ ] Verify timeout settings
- [ ] Check concurrent execution limits

## Success Criteria

### ☐ Deployment Successful
- [ ] API endpoint is live
- [ ] All endpoints respond correctly
- [ ] Performance is acceptable
- [ ] Cost is within budget
- [ ] Security is properly configured

### ☐ Ready for Production
- [ ] Monitoring is set up
- [ ] Logs are accessible
- [ ] Error handling is working
- [ ] Rate limiting is active
- [ ] CORS is configured

## Quick Commands

### Deployment
```bash
# Full deployment
npm run deploy

# Production deployment
npm run deploy:prod

# Local testing
npm run offline
```

### Monitoring
```bash
# View logs
aws logs tail /aws/lambda/msa-export-import-dev-api --since 5m

# Serverless logs
serverless logs -f api -t

# Deployment info
serverless info
```

### Testing
```bash
# Health check
curl https://l5po3ikb3l.execute-api.us-east-1.amazonaws.com/health

# Export test
curl -X POST https://l5po3ikb3l.execute-api.us-east-1.amazonaws.com/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{"format":"csv","data":[{"name":"John","age":30}]}'
```

## Emergency Rollback

### ☐ If Rollback Needed
```bash
# Remove deployment
serverless remove

# Deploy previous version
git checkout <previous-commit>
npm run deploy
```

---

**🎯 Checklist completed? Your deployment is ready for production!** 
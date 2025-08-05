# 🚀 Quick Start Guide

## Deploy in 5 Minutes

### 1. Install Dependencies
```bash
npm install
npm install -g serverless
```

### 2. Set AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID and Secret Access Key
```

### 3. Deploy
```bash
npm run deploy
```

### 4. Test Your API
```bash
# Health check
curl https://l5po3ikb3l.execute-api.us-east-1.amazonaws.com/health

# Export data
curl -X POST https://l5po3ikb3l.execute-api.us-east-1.amazonaws.com/api/v1/export \
  -H "Content-Type: application/json" \
  -d '{"format":"csv","data":[{"name":"John","age":30}]}'
```

## 🎯 Your API is Live!

**Base URL:** `https://l5po3ikb3l.execute-api.us-east-1.amazonaws.com/`

**Endpoints:**
- `GET /health` - Health check
- `POST /api/v1/export` - Export JSON to CSV
- `POST /api/v1/import` - Import CSV files

## 📊 Monitor Your API

```bash
# View logs
aws logs tail /aws/lambda/msa-export-import-dev-api --since 5m

# Deployment info
serverless info
```

## 🆘 Need Help?

- **Full Guide:** See `DEPLOYMENT-GUIDE.md`
- **Checklist:** See `DEPLOYMENT-CHECKLIST.md`
- **Troubleshooting:** Check Lambda logs for errors

---

**🎉 Your serverless API is ready for production!** 
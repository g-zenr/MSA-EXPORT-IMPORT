# AWS Lambda Deployment Guide

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up AWS credentials:**

   - Edit `deploy.ps1` (Windows) or `deploy.sh` (Linux/macOS)
   - Replace `YOUR_AWS_ACCESS_KEY_ID` and `YOUR_AWS_SECRET_ACCESS_KEY` with your actual credentials

3. **Deploy:**

   ```bash
   # Windows
   .\deploy.ps1

   # Linux/macOS
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Manual Deployment

```bash
npm run build
npm run deploy
```

## Local Testing

```bash
npm run offline
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/v1/export` - Export data to CSV
- `POST /api/v1/import` - Import CSV files

## Configuration

See `serverless.yml` for Lambda configuration details.

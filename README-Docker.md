# Docker Setup for MSA Application

This repository includes a professional Docker setup with multiple environments and optimizations.

## Quick Start

### Production

```bash
# Build and run production container
docker-compose up app --build

# Run in background
docker-compose up app -d --build

# Run all services (if you have multiple)
docker-compose up --build
```

### Development

```bash
# Run development service with hot reload
docker-compose --profile dev up app-dev

# Run development service in background
docker-compose --profile dev up app-dev -d
```

### Benchmark

```bash
# Run performance benchmarks
docker-compose --profile benchmark up benchmark
```

### Production with Nginx

```bash
# Run production with nginx reverse proxy
docker-compose --profile production up -d
```

## Services

### Production Service (`app`)

- **Port**: 3000
- **Environment**: Production
- **Features**:
  - Multi-stage build optimization
  - Non-root user for security
  - Health checks
  - Resource limits
  - Automatic restarts

### Development Service (`app-dev`)

- **Port**: 3001
- **Environment**: Development
- **Features**:
  - Hot reload with nodemon
  - Volume mounting for live code changes
  - Debug logging enabled

### Nginx Reverse Proxy (`nginx`)

- **Ports**: 80, 443
- **Profile**: production
- **Features**:
  - Load balancing
  - SSL termination ready
  - Health check endpoint

## Docker Commands

### Build

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build app

# Build with no cache
docker-compose build --no-cache
```

### Management

```bash
# View logs
docker-compose logs -f app

# Execute commands in container
docker-compose exec app sh

# Stop all services
docker-compose down

# Remove volumes
docker-compose down -v
```

### Health Checks

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect msa-app | grep -A 10 Health
```

## Environment Variables

Set these in your environment or `.env` file:

- `NODE_ENV`: production/development
- `PORT`: Application port (default: 3000)
- `DEBUG`: Debug logging (development only)

## Performance Optimizations

1. **Multi-stage builds**: Reduces final image size
2. **Alpine Linux**: Minimal base image
3. **Non-root user**: Security best practice
4. **Resource limits**: Prevents resource exhaustion
5. **Health checks**: Automatic container monitoring
6. **Volume mounting**: Persistent logs and development

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check health status
docker-compose ps

# Check if service is running
docker-compose ps app
```

### Build issues

```bash
# Clean build
docker-compose build --no-cache

# Remove all images
docker system prune -a
```

### Port conflicts

```bash
# Check what's using port 3000
netstat -tulpn | grep :3000

# Use different port
docker-compose up -p 3002:3000
```

## Production Deployment

For production deployment with nginx:

```bash
docker-compose --profile production up -d
```

This will start:

- App service on port 3000
- Nginx reverse proxy on ports 80/443
- Health monitoring
- Resource management

## Current Status

✅ **Working Commands:**
- `docker-compose up app --build` - Production service
- `docker-compose --profile dev up app-dev` - Development with hot reload
- `docker-compose --profile benchmark up benchmark` - Performance testing
- `docker-compose --profile production up -d` - Full production stack

✅ **Features:**
- Multi-stage Docker builds
- Security with non-root user
- Health checks and monitoring
- Resource limits and optimization
- Hot reload for development
- Nginx reverse proxy for production

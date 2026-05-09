# 🚀 Proofsy Upgrades - Quick Reference

## What Was Upgraded?

### 🔷 Core Changes
- **Runtime**: Node.js 22 LTS (from 20)
- **Packages**: 5 new, 11 updated
- **Security**: Helmet + Rate Limiting + Input Validation
- **Logging**: Winston structured logs
- **Docker**: Full multi-service setup

### 🔷 New Features
✅ Security headers (Helmet)  
✅ API rate limiting (100 req/15min per IP)  
✅ Request validation (Joi schemas)  
✅ Structured logging (Winston)  
✅ Health check endpoints (K8s ready)  
✅ Request compression (Gzip)  
✅ Docker with resource limits  
✅ GitHub Actions CI/CD  
✅ MongoDB & Redis services  
✅ Nginx reverse proxy  

---

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Setup Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env if needed
```

### 3. Start Services
```bash
docker-compose up --build
```

### 4. Verify
```bash
# In another terminal:
curl http://localhost:5000/api/health
# Should see: { "success": true, "data": { "status": "ok", ... } }
```

### 5. Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## File Locations

### New Middleware Files
```
src/middleware/
  ├── errorHandler.js     - Global error handling + async wrapper
  └── validation.js       - Joi-based request validation

src/utils/
  ├── logger.js           - Winston logging setup
  ├── envValidator.js     - Environment validation
  └── swagger.js          - API docs setup (install swagger-ui-express)
```

### Updated Files
```
backend/
  ├── Dockerfile          - Updated to Node 22
  ├── package.json        - New security packages
  ├── .env.example        - Enhanced variables
  └── src/server.js       - Enhanced middleware
  
frontend/
  ├── Dockerfile          - Updated to Node 22
  └── package.json        - Next.js 15.1.3

docker-compose.yml       - Full multi-service setup
.github/workflows/ci-cd.yml  - GitHub Actions
```

### Documentation
```
UPGRADES.md              - Detailed upgrade guide
UPGRADE_SUMMARY.md       - Executive summary
IMPLEMENTATION_CHECKLIST.md  - Features & options
setup.sh                 - Automated setup
```

---

## Key Improvements

### Security 🔒
```javascript
// Helmet security headers
app.use(helmet());

// Rate limiting
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Input validation
app.use("/api/users", validate(userSchema));
```

### Logging 📊
```bash
# Structured logs in logs/combined.log
# JSON format with timestamps
# Separate error logs in logs/error.log
```

### Health Checks ✅
```
GET /api/health        # Full application health
GET /api/live          # Kubernetes liveness
GET /api/ready         # Kubernetes readiness
```

### Docker Resources
```yaml
backend:
  limits: 0.5 CPU, 512MB RAM
  reserves: 0.25 CPU, 256MB RAM

worker:
  limits: 1 CPU, 1024MB RAM
  reserves: 0.5 CPU, 512MB RAM
```

---

## Available Scripts

### Backend
```bash
npm run dev              # Start dev server
npm run worker           # Start certificate worker
npm test                 # Run tests with coverage
```

### Frontend
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm start                # Start production server
```

### Docker
```bash
docker-compose up        # Start all services
docker-compose up -d     # Start in background
docker-compose down      # Stop all services
docker-compose logs -f   # Follow logs
docker-compose ps        # List containers
```

---

## Common Tasks

### View Logs
```bash
# Combined logs
tail -f backend/logs/combined.log

# Error logs
tail -f backend/logs/error.log

# Docker logs
docker-compose logs backend
docker-compose logs -f worker
```

### Test the API
```bash
# Health check
curl http://localhost:5000/api/health

# Get events
curl http://localhost:5000/api/events

# See rate limit headers
curl -i http://localhost:5000/api/health
```

### Debug Issues
```bash
# Check services are running
docker-compose ps

# Check service logs
docker-compose logs backend

# Verify MongoDB connection
docker-compose exec backend npm run test

# Check .env configuration
cat backend/.env
```

### Deploy Changes
```bash
# Local testing
docker-compose down && docker-compose up --build

# Rebuild images
docker-compose build --no-cache

# Push to registry (if configured)
docker build -t myregistry/backend:latest ./backend
docker push myregistry/backend:latest
```

---

## Optional Features to Enable

### 🔵 API Documentation (Swagger)
```bash
cd backend
npm install swagger-ui-express swagger-jsdoc

# Then add to server.js (commented example in src/utils/swagger.js)
# Visit: http://localhost:5000/api/docs
```

### 🟢 JWT Authentication
```bash
npm install jsonwebtoken bcryptjs

# Create src/middleware/auth.js
# Add to server.js
```

### 🟡 Email Service
```bash
# Already configured in .env
# Set SMTP_* variables
# Update certificateWorker.js to send emails
```

### 🟠 Monitoring (Prometheus)
```bash
npm install prom-client

# Add /metrics endpoint
# Setup Prometheus + Grafana in docker-compose
```

### 🔴 Error Tracking (Sentry)
```bash
npm install @sentry/node

# Add SENTRY_DSN to .env
# Initialize in server.js
```

---

## Performance Tips

### 1. Enable Caching
```javascript
// Redis caching for frequently accessed data
app.use(redis.middleware());
```

### 2. Monitor Slow Endpoints
```bash
# Check logs for duration
tail -f backend/logs/combined.log | grep "api"
```

### 3. Scale Workers
```yaml
# Increase replicas in docker-compose.yml
worker:
  deploy:
    replicas: 4  # Increase for more throughput
```

### 4. Database Optimization
```javascript
// Already pooled: min 5, max 10 connections
// Add indexes to schemas for frequently queried fields
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Change PORT in .env or kill process |
| MongoDB not connecting | Check docker-compose is running: `docker-compose ps` |
| High memory usage | Reduce worker replicas or set memory limits |
| Tests failing | Run `docker-compose up -d` first for services |
| Logs not appearing | Check `LOG_LEVEL` in .env (set to `info` or `debug`) |
| CORS errors | Update `CORS_ORIGIN` in .env |

---

## Next Steps (Choose Your Path)

### Path A: Deploy to Production
1. ✅ Update environment variables
2. ✅ Build Docker images: `docker-compose build`
3. ✅ Push to registry: `docker push ...`
4. ✅ Deploy to K8s or Docker Swarm

### Path B: Add Authentication
1. Install JWT packages
2. Create auth middleware
3. Protect routes
4. Add login endpoint

### Path C: Scale Infrastructure
1. Add load balancer (Nginx already ready)
2. Use database replicas
3. Scale workers with more replicas
4. Add caching layer

### Path D: Enhance Monitoring
1. Add Prometheus metrics
2. Setup Grafana dashboards
3. Configure Sentry for errors
4. Enable log aggregation

---

## Documentation Map

```
Start here → UPGRADE_SUMMARY.md (what was done)
           → UPGRADES.md (detailed guide)
           → IMPLEMENTATION_CHECKLIST.md (features & options)
           → This file (quick reference)
```

---

## Support Resources

- 📖 **Main Docs**: See `UPGRADES.md`
- ✅ **Checklist**: See `IMPLEMENTATION_CHECKLIST.md`
- 🐳 **Docker**: Check `docker-compose.yml`
- 🔄 **CI/CD**: Review `.github/workflows/ci-cd.yml`
- 💻 **Code**: Browse `src/middleware/` and `src/utils/`

---

## Version Info

**Project**: Proofsy v1.1.0 (Post-Upgrade)  
**Node.js**: 22 LTS  
**Express**: 5.x  
**Next.js**: 15.x  
**MongoDB**: 7 (optional, in-memory fallback)  
**Redis**: 7 (for Bull queues)  
**Docker**: Latest stable  
**Status**: 🟢 Production Ready  

**Last Updated**: May 6, 2026  

---

🎉 **You're all set!** Start with `docker-compose up` and explore the new features.

# Docker & Temporal Setup Fixes - Summary

**Date**: November 14, 2024  
**Issues Fixed**: 3 critical Docker configuration problems

---

## 🔧 Issues Fixed

### 1. **Temporal Database Driver Error** ✅ FIXED

**Error**:
```
Unsupported driver specified: 'DB=postgresql'. 
Valid drivers are: mysql8, postgres12, postgres12_pgx, cassandra.
```

**Root Cause**: Temporal expects `postgres12` but we had `DB=postgresql`

**Fix**: Changed environment variable in `docker-compose.yml`:
```yaml
environment:
  - DB=postgres12  # Was: DB=postgresql
  - DBNAME=temporal  # Added this
```

---

### 2. **Init Script Permission Error** ✅ FIXED

**Error**:
```
/docker-entrypoint-initdb.d/init-db.sh: /bin/bash: bad interpreter: Permission denied
```

**Root Cause**: `init-db.sh` didn't have execute permissions

**Fix**: Made script executable:
```bash
chmod +x infrastructure/docker/init-db.sh
```

---

### 3. **Temporal Health Check Too Strict** ✅ FIXED

**Problem**: Health check was failing even though Temporal server was running

**Fix**: Updated health check configuration:
```yaml
healthcheck:
  test: ["CMD", "sh", "-c", "sleep 5 && tctl --address localhost:7233 cluster health 2>&1 | grep -q 'SERVING' || exit 1"]
  interval: 15s      # Was: 10s
  timeout: 10s       # Was: 5s
  retries: 20        # Was: 10
  start_period: 60s  # NEW: Gives Temporal 60s to fully start before checking
```

---

### 4. **Docker Compose Version Warning** ✅ FIXED

**Warning**:
```
the attribute `version` is obsolete, it will be ignored
```

**Fix**: Removed `version: '3.8'` from docker-compose.yml (no longer needed in modern Docker Compose)

---

## 🚀 How to Start Services

### **Clean Start** (Recommended after fixes):
```bash
# Navigate to project root
cd /Users/kaeytee/Desktop/CODES/Volteryde/volteryde-platform

# Stop and remove all containers & volumes
docker-compose down -v

# Start Temporal stack
docker-compose up -d postgres temporal temporal-ui

# Wait ~60 seconds for Temporal to initialize
# Then check status:
docker-compose ps
```

### **Check if Services are Running**:
```bash
docker-compose ps

# Expected output:
# NAME                    STATUS                    PORTS
# volteryde-postgres      Up (healthy)              0.0.0.0:5432->5432/tcp
# volteryde-temporal      Up (healthy)              0.0.0.0:7233->7233/tcp  
# volteryde-temporal-ui   Up                        0.0.0.0:8080->8080/tcp
```

### **View Logs**:
```bash
# Temporal server logs
docker-compose logs temporal -f

# Postgres logs
docker-compose logs postgres -f

# All services
docker-compose logs -f
```

---

## 🎯 Access Points

Once all services are healthy:

| Service | URL | Purpose |
|---------|-----|---------|
| **Temporal UI** | http://localhost:8080 | Web interface to view workflows |
| **Temporal Server** | localhost:7233 | gRPC endpoint for workers & clients |
| **PostgreSQL** | localhost:5432 | Database (user: `postgres`, pass: `postgres`) |

---

## ✅ Verification Steps

### 1. Check Temporal Server is Running:
```bash
docker exec volteryde-temporal tctl --address localhost:7233 cluster health
```

**Expected Output**:
```
SERVING
```

### 2. Check Databases Were Created:
```bash
docker exec volteryde-postgres psql -U postgres -c "\l"
```

**Should see**:
- `volteryde` (main database)
- `temporal` (Temporal system database)
- `temporal_visibility` (Temporal visibility database)

### 3. Access Temporal UI:
Open browser → http://localhost:8080

You should see the Temporal Web UI dashboard.

---

## 🔍 Troubleshooting

### **If Temporal is stuck "unhealthy":**

The new health check has a 60-second grace period. Wait up to 2 minutes for the status to become healthy.

```bash
# Watch the logs
docker-compose logs temporal -f

# You should see:
# - "Search attributes have been added" (initialization complete)
# - Task queue managers starting
```

### **If containers keep restarting:**

1. Check logs for specific errors:
```bash
docker-compose logs temporal
```

2. Ensure PostgreSQL is healthy first:
```bash
docker-compose ps postgres
# Should show "(healthy)"
```

3. If needed, do a complete reset:
```bash
docker-compose down -v
docker system prune -f
docker-compose up -d postgres temporal temporal-ui
```

### **If you see "connection refused":**

This is normal during the first 30-60 seconds. Temporal needs time to:
1. Connect to PostgreSQL
2. Create/update database schemas
3. Initialize namespaces
4. Start gRPC server

---

## 📝 What Changed in docker-compose.yml

```diff
- version: '3.8'  # Removed (obsolete)

  temporal:
    environment:
-     - DB=postgresql
+     - DB=postgres12
+     - DBNAME=temporal
-     - DYNAMIC_CONFIG_FILE_PATH=config/dynamicconfig/development.yaml
    healthcheck:
-     test: ["CMD", "tctl", "--address", "localhost:7233", "cluster", "health"]
-     interval: 10s
-     timeout: 5s
-     retries: 10
+     test: ["CMD", "sh", "-c", "sleep 5 && tctl --address localhost:7233 cluster health 2>&1 | grep -q 'SERVING' || exit 1"]
+     interval: 15s
+     timeout: 10s
+     retries: 20
+     start_period: 60s
```

---

## ✨ Next Steps

Once Temporal is running (status shows "healthy"):

### 1. **Test the Temporal Worker**:
```bash
cd workers/temporal-workers
pnpm install
pnpm dev
```

### 2. **Test the NestJS Backend**:
```bash
cd services/volteryde-nest
pnpm install
pnpm dev
```

### 3. **Create a Test Booking**:
```bash
curl -X POST http://localhost:3000/api/v1/booking \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-123",
    "startLocation": {"latitude": 5.6037, "longitude": -0.187},
    "endLocation": {"latitude": 5.6137, "longitude": -0.207}
  }'
```

### 4. **View Workflow in Temporal UI**:
- Open http://localhost:8080
- Click on "Workflows"
- You should see your booking workflow executing!

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ All three containers show "(healthy)" status  
✅ Temporal UI loads at http://localhost:8080  
✅ `tctl cluster health` returns "SERVING"  
✅ Worker connects without errors  
✅ Booking workflow appears in Temporal UI  

---

**Status**: All fixes applied ✅  
**Ready for testing**: Yes! 🚀

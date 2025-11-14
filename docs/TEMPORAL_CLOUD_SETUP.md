# Temporal Cloud Setup Guide

**Date**: November 14, 2024  
**Purpose**: Configure Volteryde Platform to use Temporal Cloud instead of local Docker

---

## 🎯 Overview

You're using **Temporal Cloud** (temporal.io) instead of running a local Temporal server. This is the **recommended** approach for production as it provides:

✅ Managed infrastructure  
✅ High availability  
✅ Automatic scaling  
✅ Built-in monitoring  
✅ No need to manage Temporal servers yourself  

---

## 📋 Prerequisites

Temporal Cloud supports **TWO authentication methods**. Choose ONE:

### **Method 1: API Key** (RECOMMENDED - Simpler) ⭐

From your Temporal Cloud account at https://cloud.temporal.io/:

1. **Namespace URL**: `your-namespace.a2b3c.tmprl.cloud:7233`
2. **Namespace ID**: `your-namespace.a2b3c`
3. **API Key**: Generated from cloud console

### **Method 2: mTLS Certificates** (Traditional)

From your Temporal Cloud account:

1. **Namespace URL**: `your-namespace.a2b3c.tmprl.cloud:7233`
2. **Namespace ID**: `your-namespace.a2b3c`
3. **Client Certificate**: `client.pem` file
4. **Client Key**: `client-key.key` file

---

## ⚙️ Configuration Steps

Choose **ONE** configuration method based on what you selected above:

---

### **Configuration A: Using API Key** (RECOMMENDED) ⭐

#### **Step 1: Update Your `.env` File**

Edit `/Users/kaeytee/Desktop/CODES/Volteryde/volteryde-platform/.env`:

```bash
# Temporal Cloud with API Key
TEMPORAL_ADDRESS=your-namespace.a2b3c.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace.a2b3c
TEMPORAL_API_KEY=your-api-key-from-cloud-console
TEMPORAL_TASK_QUEUE=volteryde-booking
```

**Important**: Replace with YOUR actual values from https://cloud.temporal.io/

That's it! API key method is simpler - no certificates needed. ✅

---

### **Configuration B: Using mTLS Certificates** (Traditional)

#### **Step 1: Place Your Certificates**

Create a secure directory for your Temporal Cloud certificates:

```bash
mkdir -p ~/temporal-certs
chmod 700 ~/temporal-certs

# Copy your certificates (replace with your actual files)
cp /path/to/downloaded/client.pem ~/temporal-certs/
cp /path/to/downloaded/client-key.key ~/temporal-certs/
chmod 600 ~/temporal-certs/*
```

#### **Step 2: Update Your `.env` File**

Edit `/Users/kaeytee/Desktop/CODES/Volteryde/volteryde-platform/.env`:

```bash
# Temporal Cloud with mTLS Certificates
TEMPORAL_ADDRESS=your-namespace.a2b3c.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace.a2b3c
TEMPORAL_CLIENT_CERT=/Users/kaeytee/temporal-certs/client.pem
TEMPORAL_CLIENT_KEY=/Users/kaeytee/temporal-certs/client-key.key
TEMPORAL_TASK_QUEUE=volteryde-booking
```

**Important**: Replace the values with YOUR actual:
- Namespace address
- Namespace name
- Certificate paths

---

### **Step 3: Run ONLY Local Databases**

Since you're using Temporal Cloud, you DON'T need to run the Temporal Docker containers:

```bash
# ✅ Run ONLY these services locally
docker-compose up -d postgres redis

# ❌ DON'T run these (you're using Temporal Cloud instead)
# docker-compose up temporal temporal-ui
```

---

## 🚀 Testing Your Setup

### **1. Start the Temporal Worker**

The worker connects to Temporal Cloud and processes workflows:

```bash
cd workers/temporal-workers
pnpm install
pnpm dev
```

**Expected Output (API Key)**:
```
======================================================================
Volteryde Temporal Worker - Starting...
======================================================================
Temporal Server: your-namespace.a2b3c.tmprl.cloud:7233
Task Queue: volteryde-booking
Namespace: your-namespace.a2b3c

🔒 Using API Key for Temporal Cloud connection
✓ Connected to Temporal server
✓ Worker created successfully

======================================================================
Worker is ready and polling for tasks...
Press Ctrl+C to stop
======================================================================
```

**Expected Output (mTLS Certificates)**:
```
======================================================================
Volteryde Temporal Worker - Starting...
======================================================================
Temporal Server: your-namespace.a2b3c.tmprl.cloud:7233
Task Queue: volteryde-booking
Namespace: your-namespace.a2b3c

🔒 Using mTLS (certificates) for Temporal Cloud connection
✓ Connected to Temporal server
✓ Worker created successfully

======================================================================
Worker is ready and polling for tasks...
Press Ctrl+C to stop
======================================================================
```

### **2. Start the NestJS Backend**

```bash
cd services/volteryde-nest
pnpm install
pnpm dev
```

**Expected Output**:
```
[Nest] LOG [TemporalService] Connecting to Temporal server at your-namespace.a2b3c.tmprl.cloud:7233
[Nest] LOG [TemporalService] 🔒 Using TLS for Temporal Cloud connection
[Nest] LOG [TemporalService] ✓ Successfully connected to Temporal server
[Nest] LOG [NestApplication] Nest application successfully started
```

### **3. Create a Test Booking**

```bash
curl -X POST http://localhost:3000/api/v1/booking \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "startLocation": {"latitude": 5.6037, "longitude": -0.187},
    "endLocation": {"latitude": 5.6137, "longitude": -0.207}
  }'
```

**Expected Response**:
```json
{
  "workflowId": "booking-test-user-123-1234567890",
  "runId": "abc123...",
  "status": "PROCESSING",
  "message": "Booking workflow started successfully"
}
```

### **4. View Workflow in Temporal Cloud UI**

1. Open https://cloud.temporal.io/
2. Log in to your account
3. Select your namespace
4. Click on "Workflows"
5. You should see your `bookRideWorkflow` executing!

---

## 🔍 Troubleshooting

### **Issue: "Failed to connect to Temporal server"**

**Possible causes**:
1. **Wrong namespace URL** - Check your Temporal Cloud dashboard
2. **Certificate path is wrong** - Verify the paths in `.env`
3. **Certificate permissions** - Run `chmod 600 ~/temporal-certs/*`
4. **Firewall blocking port 7233** - Check your network settings

**Fix**:
```bash
# Verify certificates exist
ls -la ~/temporal-certs/

# Test connection manually
cd workers/temporal-workers
TEMPORAL_ADDRESS=your-namespace.a2b3c.tmprl.cloud:7233 \
TEMPORAL_CLIENT_CERT=~/temporal-certs/client.pem \
TEMPORAL_CLIENT_KEY=~/temporal-certs/client-key.key \
pnpm dev
```

### **Issue: "TLS handshake failed"**

**Possible causes**:
- Certificate files are corrupted
- Using wrong certificate files
- Certificate expired

**Fix**:
1. Re-download certificates from Temporal Cloud
2. Verify certificate format:
```bash
openssl x509 -in ~/temporal-certs/client.pem -text -noout
```

### **Issue: Worker connects but no workflows execute**

**Possible causes**:
- Task queue name mismatch
- Namespace name mismatch

**Fix**:
Ensure your `.env` has the correct values:
```bash
# These MUST match exactly what you configure in your workflow
TEMPORAL_TASK_QUEUE=volteryde-booking
TEMPORAL_NAMESPACE=your-namespace.a2b3c
```

---

## 📊 Architecture with Temporal Cloud

```
┌─────────────────┐
│  Passenger App  │
└────────┬────────┘
         │ HTTP POST /api/v1/booking
         ▼
┌─────────────────┐
│  NestJS Backend │──────┐
└─────────────────┘      │
                         │ Start Workflow
                         ▼
                  ┌──────────────────┐
                  │  Temporal Cloud  │ ← Managed by temporal.io
                  │  (temporal.io)   │
                  └────────┬─────────┘
                           │ Assign Task
                           ▼
                  ┌──────────────────┐
                  │  Temporal Worker │ ← Running on your server
                  │  (Your machine)  │
                  └────────┬─────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐    ┌──────────────┐   ┌──────────┐
   │ Booking  │    │   Payment    │   │  Fleet   │
   │ Service  │    │   Service    │   │  Service │
   └──────────┘    └──────────────┘   └──────────┘
```

**Key Points**:
- ✅ Temporal server runs in the cloud (managed)
- ✅ Your worker runs locally (or on your server)
- ✅ Worker connects to cloud via TLS
- ✅ Workflows execute durably in the cloud
- ✅ Activities call your local services

---

## 🔐 Security Best Practices

### **1. Never Commit Certificates**

Your `.gitignore` already includes:
```
# Temporal certificates
*.pem
*.key
temporal-certs/
```

### **2. Use Environment Variables**

Never hardcode certificate paths:
```typescript
// ❌ BAD
const cert = readFileSync('/Users/kaeytee/temporal-certs/client.pem');

// ✅ GOOD
const certPath = process.env.TEMPORAL_CLIENT_CERT;
const cert = readFileSync(certPath);
```

### **3. Restrict Certificate Permissions**

```bash
chmod 600 ~/temporal-certs/*.pem
chmod 600 ~/temporal-certs/*.key
chmod 700 ~/temporal-certs
```

### **4. Rotate Certificates Regularly**

Temporal Cloud allows you to generate new certificates. Rotate them every 90 days.

---

## 📝 What We Changed

### **1. Worker (`workers/temporal-workers/src/workers/booking.worker.ts`)**

Added TLS support:
```typescript
// Detect Temporal Cloud vs Local
const clientCertPath = process.env.TEMPORAL_CLIENT_CERT;
const clientKeyPath = process.env.TEMPORAL_CLIENT_KEY;

const connectionOptions: any = { address: temporalAddress };

if (clientCertPath && clientKeyPath) {
  console.log('🔒 Using TLS for Temporal Cloud connection');
  connectionOptions.tls = {
    clientCertPair: {
      crt: readFileSync(clientCertPath),
      key: readFileSync(clientKeyPath),
    },
  };
}

const connection = await NativeConnection.connect(connectionOptions);
```

### **2. NestJS Service (`services/volteryde-nest/src/shared/temporal/temporal.service.ts`)**

Added the same TLS support for the client connection.

### **3. Environment Variables (`.env.example`)**

Added cloud configuration example:
```bash
TEMPORAL_ADDRESS=your-namespace.a2b3c.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace.a2b3c
TEMPORAL_CLIENT_CERT=/path/to/client.pem
TEMPORAL_CLIENT_KEY=/path/to/client-key.key
```

---

## ✅ Verification Checklist

Before deploying to production, verify:

- [ ] Worker connects to Temporal Cloud successfully
- [ ] NestJS backend connects to Temporal Cloud
- [ ] Test booking workflow executes and appears in Temporal Cloud UI
- [ ] Workflow completes successfully (check in cloud UI)
- [ ] Certificates are NOT committed to git
- [ ] Certificate permissions are restrictive (`600`)
- [ ] `.env` file is in `.gitignore`
- [ ] Task queue names match between worker and client

---

## 🎉 You're All Set!

You now have:

✅ Temporal Cloud connected  
✅ TLS encryption enabled  
✅ Worker polling for tasks  
✅ NestJS backend starting workflows  
✅ Secure certificate management  

**Next Step**: Test your booking workflow and monitor it in the Temporal Cloud UI!

---

## 📞 Need Help?

- **Temporal Cloud Docs**: https://docs.temporal.io/cloud
- **Temporal Community**: https://community.temporal.io/
- **Your Temporal Cloud Dashboard**: https://cloud.temporal.io/

---

**Status**: Temporal Cloud Configuration Complete ✅  
**Ready for Production**: Yes! 🚀

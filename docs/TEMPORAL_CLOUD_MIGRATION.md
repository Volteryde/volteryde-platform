# Temporal Cloud Migration Guide

## Overview

The Volteryde Platform has been migrated from self-hosted Temporal to **Temporal Cloud** for improved reliability, scalability, and reduced operational overhead.

## Configuration Changes

### Environment Variables

The following environment variables are now configured for Temporal Cloud:

```bash
TEMPORAL_ADDRESS=sa-east-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=quickstart-volteryde.svqe2
TEMPORAL_API_KEY=<your-api-key>
TEMPORAL_TASK_QUEUE=volteryde-booking
```

### Files Updated

1. **`.env`** - Production credentials configured
2. **`.env.example`** - Template updated with Temporal Cloud as recommended option
3. **`docker-compose.yml`** - Self-hosted Temporal services commented out
4. **`docker-compose.prod.yml`** - Self-hosted Temporal services commented out
5. **`infrastructure/kubernetes/base/configmap.yaml`** - Cloud endpoint configured
6. **`infrastructure/kubernetes/base/secrets.yaml`** - API key template added
7. **`infrastructure/kubernetes/base/temporal-workers-deployment.yaml`** - Environment variables updated
8. **`infrastructure/kubernetes/base/nestjs-deployment.yaml`** - Environment variables updated

## Local Development

### Running Services Locally

The Temporal services in `docker-compose.yml` are now commented out. Your local services will connect directly to Temporal Cloud.

```bash
# Start local infrastructure (without Temporal)
docker-compose up -d

# The workers and NestJS services will connect to Temporal Cloud
cd services/volteryde-nest
pnpm dev

cd workers/temporal-workers
pnpm dev
```

### Testing with Local Temporal (Optional)

If you need to test with a local Temporal instance:

1. Uncomment the `temporal` and `temporal-ui` services in `docker-compose.yml`
2. Update your `.env.local`:
   ```bash
   TEMPORAL_ADDRESS=localhost:7233
   TEMPORAL_NAMESPACE=default
   # Comment out TEMPORAL_API_KEY for local development
   ```
3. Restart services

## Kubernetes Deployment

### Prerequisites

1. Ensure you have the Temporal Cloud API key
2. Update the Kubernetes secret with the actual API key

### Deploy Secrets

```bash
# Create or update the secret with your Temporal API key
kubectl create secret generic volteryde-secrets \
  --from-literal=TEMPORAL_API_KEY='eyJhbGciOiJFUzI1NiIsImtpZCI6Ild2dHdhQSJ9...' \
  --dry-run=client -o yaml | kubectl apply -f -

# Or use AWS Secrets Manager / External Secrets Operator
```

### Deploy Services

```bash
# Apply ConfigMap (contains Temporal Cloud endpoint)
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml

# Apply Secrets
kubectl apply -f infrastructure/kubernetes/base/secrets.yaml

# Deploy NestJS services
kubectl apply -f infrastructure/kubernetes/base/nestjs-deployment.yaml

# Deploy Temporal workers
kubectl apply -f infrastructure/kubernetes/base/temporal-workers-deployment.yaml
```

### Verify Connection

```bash
# Check NestJS service logs
kubectl logs -l app=nestjs-service --tail=100

# Check Temporal workers logs
kubectl logs -l app=temporal-workers --tail=100

# You should see: "✓ Connected to Temporal server"
```

## Temporal Cloud Dashboard

Access your Temporal Cloud dashboard at:
- **URL**: https://cloud.temporal.io
- **Namespace**: `quickstart-volteryde.svqe2`
- **Region**: `sa-east-1` (AWS South America - São Paulo)

### Monitoring Workflows

1. Navigate to https://cloud.temporal.io/namespaces/quickstart-volteryde.svqe2
2. View active workflows, task queues, and worker status
3. Monitor workflow execution history and errors

## Security Best Practices

### API Key Rotation

The Temporal API key expires on **January 21, 2026**. To rotate:

1. Generate a new API key in Temporal Cloud dashboard
2. Update the key in:
   - `.env` file (local development)
   - Kubernetes secrets (production)
   - CI/CD pipeline secrets
3. Restart all workers and services

### Secrets Management

**Production deployments should use:**
- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes External Secrets Operator

**Never commit** `.env` files with real credentials to version control.

## Troubleshooting

### Connection Errors

If you see `Failed to connect to Temporal server`:

1. **Check API key**: Ensure `TEMPORAL_API_KEY` is set correctly
2. **Verify endpoint**: Confirm `TEMPORAL_ADDRESS=sa-east-1.aws.api.temporal.io:7233`
3. **Check namespace**: Ensure `TEMPORAL_NAMESPACE=quickstart-volteryde.svqe2`
4. **Network access**: Verify outbound HTTPS (port 7233) is allowed

### Worker Not Picking Up Tasks

1. **Verify task queue**: Check `TEMPORAL_TASK_QUEUE=volteryde-booking`
2. **Check worker logs**: Look for "Worker started successfully"
3. **Temporal dashboard**: Verify workers are registered in the UI

### Authentication Errors

If you see `Unauthorized` or `Invalid credentials`:

1. Verify the API key hasn't expired
2. Check the key format (should be a JWT starting with `eyJ...`)
3. Ensure no extra whitespace in the environment variable

## Code Changes Required

The existing Temporal client code in NestJS services and workers already supports API key authentication. No code changes are needed - the services will automatically use the API key if `TEMPORAL_API_KEY` is set.

### Connection Logic (Already Implemented)

```typescript
// services/volteryde-nest/*/src/shared/temporal/temporal.service.ts
const apiKey = this.configService.get<string>('TEMPORAL_API_KEY');

if (apiKey) {
  // Use API key authentication (Temporal Cloud)
  connectionOptions.apiKey = apiKey;
  connectionOptions.tls = true;
} else {
  // Use insecure connection (local development)
  connectionOptions.tls = false;
}
```

## Migration Checklist

- [x] Update `.env` with Temporal Cloud credentials
- [x] Update `.env.example` template
- [x] Comment out self-hosted Temporal in docker-compose files
- [x] Update Kubernetes ConfigMaps
- [x] Update Kubernetes Secrets template
- [x] Update deployment manifests with environment variables
- [ ] Deploy secrets to Kubernetes cluster
- [ ] Test local development connection
- [ ] Deploy to staging environment
- [ ] Verify workflows execute successfully
- [ ] Deploy to production
- [ ] Monitor Temporal Cloud dashboard
- [ ] Set up API key rotation reminder (before Jan 21, 2026)

## Support

For Temporal Cloud issues:
- **Documentation**: https://docs.temporal.io/cloud
- **Support**: https://community.temporal.io
- **Status**: https://status.temporal.io

For Volteryde Platform issues:
- Contact the platform team
- Check internal documentation at `/docs`

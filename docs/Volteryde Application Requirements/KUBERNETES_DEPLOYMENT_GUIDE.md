# Kubernetes Deployment Guide
## Container Orchestration with AWS EKS

---

## Overview

This guide covers deploying Volteryde microservices to Kubernetes using:
- **Docker** for containerization
- **Kubernetes** (AWS EKS) for orchestration
- **Kustomize** for environment-specific configuration
- **Helm** for complex applications (Temporal, Kafka)

---

## Dockerfile Templates

### NestJS Service Dockerfile (Multi-Stage Build)

**`services/telematics-domain/Dockerfile`**:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Prune dev dependencies
RUN pnpm prune --production

# Stage 2: Production
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

USER nestjs

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]
```

**Build and Push**:
```bash
# Build
docker build -t volteryde/telematics-domain:v1.0.0 .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag volteryde/telematics-domain:v1.0.0 ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/volteryde/telematics-domain:v1.0.0

# Push to ECR
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/volteryde/telematics-domain:v1.0.0
```

### Java Spring Boot Dockerfile

**`services/authentication-domain/Dockerfile`**:
```dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml ./
RUN mvn dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production
FROM eclipse-temurin:17-jre-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S spring && adduser -S spring -u 1001

WORKDIR /app

# Copy JAR from builder
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

USER spring

EXPOSE 8080

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

---

## Kubernetes Manifests

### Namespace

**`infrastructure/kubernetes/base/namespaces/volteryde-dev.yaml`**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: volteryde-dev
  labels:
    environment: dev
    project: volteryde
```

### Deployment - Telematics Domain

**`infrastructure/kubernetes/apps/telematics-domain/deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telematics-domain
  namespace: volteryde-dev
  labels:
    app: telematics-domain
    domain: telematics
spec:
  replicas: 2
  selector:
    matchLabels:
      app: telematics-domain
  template:
    metadata:
      labels:
        app: telematics-domain
        domain: telematics
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: telematics-service-account
      
      # Anti-affinity: spread pods across nodes
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - telematics-domain
              topologyKey: kubernetes.io/hostname
      
      containers:
      - name: telematics
        image: ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/volteryde/telematics-domain:v1.0.0
        imagePullPolicy: IfNotPresent
        
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: INFLUXDB_URL
          valueFrom:
            secretKeyRef:
              name: telematics-secrets
              key: influxdb-url
        - name: INFLUXDB_TOKEN
          valueFrom:
            secretKeyRef:
              name: telematics-secrets
              key: influxdb-token
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: redis-url
        - name: KAFKA_BROKERS
          value: "kafka-service.infrastructure.svc.cluster.local:9092"
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
      
      # Init container to wait for dependencies
      initContainers:
      - name: wait-for-redis
        image: busybox:1.36
        command: ['sh', '-c', 'until nc -z redis-service.infrastructure.svc.cluster.local 6379; do echo waiting for redis; sleep 2; done;']
```

### Service

**`infrastructure/kubernetes/apps/telematics-domain/service.yaml`**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: telematics-service
  namespace: volteryde-dev
  labels:
    app: telematics-domain
spec:
  type: ClusterIP
  selector:
    app: telematics-domain
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  sessionAffinity: None
```

### Ingress (ALB)

**`infrastructure/kubernetes/apps/telematics-domain/ingress.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: volteryde-ingress
  namespace: volteryde-dev
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID
spec:
  rules:
  - host: api-dev.volteryde.com
    http:
      paths:
      - path: /api/v1/telematics
        pathType: Prefix
        backend:
          service:
            name: telematics-service
            port:
              number: 80
      - path: /api/v1/booking
        pathType: Prefix
        backend:
          service:
            name: booking-service
            port:
              number: 80
      - path: /api/v1/payments
        pathType: Prefix
        backend:
          service:
            name: payment-service
            port:
              number: 80
```

### Secret Management (AWS Secrets Manager)

**`infrastructure/kubernetes/apps/telematics-domain/external-secret.yaml`** (using External Secrets Operator):
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: telematics-secrets
  namespace: volteryde-dev
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: telematics-secrets
    creationPolicy: Owner
  data:
  - secretKey: influxdb-url
    remoteRef:
      key: volteryde/dev/telematics/influxdb
      property: url
  - secretKey: influxdb-token
    remoteRef:
      key: volteryde/dev/telematics/influxdb
      property: token
```

### HorizontalPodAutoscaler

**`infrastructure/kubernetes/apps/telematics-domain/hpa.yaml`**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: telematics-hpa
  namespace: volteryde-dev
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: telematics-domain
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max
```

---

## Kustomize for Environment Management

### Base Configuration

**`infrastructure/kubernetes/apps/telematics-domain/kustomization.yaml`**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: volteryde-dev

commonLabels:
  app.kubernetes.io/name: telematics-domain
  app.kubernetes.io/part-of: volteryde

resources:
- deployment.yaml
- service.yaml
- hpa.yaml
- external-secret.yaml
```

### Dev Overlay

**`infrastructure/kubernetes/overlays/dev/kustomization.yaml`**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: volteryde-dev

bases:
- ../../apps/telematics-domain
- ../../apps/booking-domain
- ../../apps/payment-domain
- ../../apps/authentication-domain

replicas:
- name: telematics-domain
  count: 2
- name: booking-domain
  count: 2

images:
- name: ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/volteryde/telematics-domain
  newTag: dev-latest

commonAnnotations:
  environment: development
```

### Production Overlay

**`infrastructure/kubernetes/overlays/production/kustomization.yaml`**:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: volteryde-prod

bases:
- ../../apps/telematics-domain
- ../../apps/booking-domain
- ../../apps/payment-domain
- ../../apps/authentication-domain

replicas:
- name: telematics-domain
  count: 6
- name: booking-domain
  count: 6

images:
- name: ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/volteryde/telematics-domain
  newTag: v1.2.3

commonAnnotations:
  environment: production

patches:
- target:
    kind: Deployment
  patch: |-
    - op: replace
      path: /spec/template/spec/containers/0/resources/requests/memory
      value: 512Mi
    - op: replace
      path: /spec/template/spec/containers/0/resources/limits/memory
      value: 1Gi
```

---

## Service Mesh (Istio) - Optional but Recommended for Production

### Install Istio

```bash
# Download Istio
curl -L https://istio.io/downloadIstio | sh -
cd istio-1.20.0

# Install Istio with minimal profile
istioctl install --set profile=minimal

# Enable sidecar injection for namespace
kubectl label namespace volteryde-dev istio-injection=enabled
```

### VirtualService (Traffic Management)

**`infrastructure/kubernetes/apps/telematics-domain/virtual-service.yaml`**:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: telematics-vs
  namespace: volteryde-dev
spec:
  hosts:
  - telematics-service
  http:
  - match:
    - headers:
        x-api-version:
          exact: "v2"
    route:
    - destination:
        host: telematics-service
        subset: v2
      weight: 100
  - route:
    - destination:
        host: telematics-service
        subset: v1
      weight: 100
```

### DestinationRule (Load Balancing)

**`infrastructure/kubernetes/apps/telematics-domain/destination-rule.yaml`**:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: telematics-dr
  namespace: volteryde-dev
spec:
  host: telematics-service
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpHeaderName: x-user-id
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

---

## Network Policies (Security)

**`infrastructure/kubernetes/base/network-policies/default-deny.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: volteryde-dev
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

**`infrastructure/kubernetes/base/network-policies/allow-telematics-to-redis.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-telematics-to-redis
  namespace: volteryde-dev
spec:
  podSelector:
    matchLabels:
      app: telematics-domain
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: infrastructure
      podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

---

## Deployment Commands

### Apply Kustomize Overlays

```bash
# Dev environment
kubectl apply -k infrastructure/kubernetes/overlays/dev

# Staging environment
kubectl apply -k infrastructure/kubernetes/overlays/staging

# Production environment
kubectl apply -k infrastructure/kubernetes/overlays/production
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n volteryde-dev

# Check services
kubectl get svc -n volteryde-dev

# Check ingress
kubectl get ingress -n volteryde-dev

# View logs
kubectl logs -f deployment/telematics-domain -n volteryde-dev

# Port forward for local testing
kubectl port-forward svc/telematics-service 3000:80 -n volteryde-dev
```

### Rollout Management

```bash
# Update image
kubectl set image deployment/telematics-domain telematics=ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/volteryde/telematics-domain:v1.1.0 -n volteryde-dev

# Check rollout status
kubectl rollout status deployment/telematics-domain -n volteryde-dev

# Rollback to previous version
kubectl rollout undo deployment/telematics-domain -n volteryde-dev

# View rollout history
kubectl rollout history deployment/telematics-domain -n volteryde-dev
```

---

## Health Checks Implementation

### NestJS Health Check

**`services/telematics-domain/src/health/health.controller.ts`**:
```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  checkLiveness() {
    // Liveness: is the app running?
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  checkReadiness() {
    // Readiness: can the app serve traffic?
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.http.pingCheck('redis', 'http://redis-service:6379'),
    ]);
  }
}
```

---

## ConfigMap for Application Configuration

**`infrastructure/kubernetes/apps/telematics-domain/configmap.yaml`**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: telematics-config
  namespace: volteryde-dev
data:
  LOG_LEVEL: "info"
  TELEMETRY_BATCH_SIZE: "100"
  TELEMETRY_FLUSH_INTERVAL: "5000"
  KAFKA_TOPIC: "telematics.vehicle-location"
  METRICS_ENABLED: "true"
```

---

## Resource Quotas (Prevent Resource Exhaustion)

**`infrastructure/kubernetes/base/resource-quotas/dev-quota.yaml`**:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: volteryde-dev-quota
  namespace: volteryde-dev
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 40Gi
    limits.cpu: "40"
    limits.memory: 80Gi
    persistentvolumeclaims: "10"
    services.loadbalancers: "2"
```

---

## Summary

✅ Multi-stage Docker builds for small images  
✅ Kubernetes Deployment, Service, Ingress manifests  
✅ Kustomize overlays for environment-specific config  
✅ HorizontalPodAutoscaler for auto-scaling  
✅ External Secrets Operator for AWS Secrets Manager  
✅ Network Policies for security  
✅ Health checks (liveness, readiness)  
✅ Resource requests and limits  
✅ Istio service mesh (optional)

**Next**: See `TEMPORAL_IMPLEMENTATION_GUIDE.md` for workflow orchestration

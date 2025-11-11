#!/bin/bash

# ============================================================================
# Volteryde Platform - Kubernetes Deployment Script
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment not specified!"
    echo "Usage: $0 [dev|staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, staging, production"
    exit 1
fi

print_info "Deploying to $ENVIRONMENT environment..."

# Set namespace based on environment
case $ENVIRONMENT in
    dev)
        NAMESPACE="volteryde-dev"
        ;;
    staging)
        NAMESPACE="volteryde-staging"
        ;;
    production)
        NAMESPACE="volteryde-prod"
        ;;
esac

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found. Please install kubectl."
    exit 1
fi

# Check if kustomize is installed
if ! command -v kustomize &> /dev/null; then
    print_warning "kustomize not found. Using kubectl kustomize..."
    KUSTOMIZE_CMD="kubectl kustomize"
else
    KUSTOMIZE_CMD="kustomize"
fi

# Check kubectl connection
print_info "Checking kubectl connection..."
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi
print_success "Connected to Kubernetes cluster"

# Create namespace if it doesn't exist
print_info "Ensuring namespace $NAMESPACE exists..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
print_success "Namespace $NAMESPACE ready"

# Production confirmation
if [ "$ENVIRONMENT" == "production" ]; then
    print_warning "You are about to deploy to PRODUCTION!"
    read -p "Type 'DEPLOY TO PRODUCTION' to continue: " confirmation
    if [ "$confirmation" != "DEPLOY TO PRODUCTION" ]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Build and apply manifests
print_info "Building manifests with Kustomize..."
cd "$(dirname "$0")/../infrastructure/kubernetes/overlays/$ENVIRONMENT"

if [ "$KUSTOMIZE_CMD" == "kubectl kustomize" ]; then
    kubectl kustomize . > /tmp/volteryde-$ENVIRONMENT.yaml
else
    kustomize build . > /tmp/volteryde-$ENVIRONMENT.yaml
fi

print_success "Manifests built successfully"

# Show diff (optional)
if [ "$2" == "--diff" ]; then
    print_info "Showing differences..."
    kubectl diff -f /tmp/volteryde-$ENVIRONMENT.yaml || true
fi

# Apply manifests
print_info "Applying manifests to $NAMESPACE..."
kubectl apply -f /tmp/volteryde-$ENVIRONMENT.yaml

print_success "Manifests applied successfully"

# Wait for deployments to be ready
print_info "Waiting for deployments to be ready..."

DEPLOYMENTS=("nestjs-service" "springboot-service" "temporal-workers")

for deployment in "${DEPLOYMENTS[@]}"; do
    print_info "Waiting for $deployment..."
    if kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=5m; then
        print_success "$deployment is ready"
    else
        print_error "$deployment failed to become ready"
        exit 1
    fi
done

# Check pod status
print_info "Checking pod status..."
kubectl get pods -n $NAMESPACE

# Show services
print_info "Services:"
kubectl get svc -n $NAMESPACE

# Show ingress
print_info "Ingress:"
kubectl get ingress -n $NAMESPACE

print_success "Deployment to $ENVIRONMENT completed successfully!"

# Cleanup
rm -f /tmp/volteryde-$ENVIRONMENT.yaml

# Display helpful information
echo ""
print_info "Useful commands:"
echo "  View logs: kubectl logs -f deployment/nestjs-service -n $NAMESPACE"
echo "  Get pods: kubectl get pods -n $NAMESPACE"
echo "  Describe pod: kubectl describe pod <pod-name> -n $NAMESPACE"
echo "  Port-forward: kubectl port-forward svc/nestjs-service 3000:80 -n $NAMESPACE"
echo "  Rollback: kubectl rollout undo deployment/nestjs-service -n $NAMESPACE"

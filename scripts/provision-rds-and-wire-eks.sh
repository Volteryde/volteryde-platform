#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-sa-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-volteryde-production}"
NAMESPACE="${NAMESPACE:-production}"

DB_ID="${DB_ID:-volteryde-prod-postgres}"
DB_NAME="${DB_NAME:-volteryde}"
DB_USER="${DB_USER:-volteryde_admin}"
DB_PASS="${DB_PASS:-}"

DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t4g.medium}"
DB_ALLOCATED_STORAGE_GB="${DB_ALLOCATED_STORAGE_GB:-50}"
DB_ENGINE_VERSION="${DB_ENGINE_VERSION:-17}"

SG_NAME="${SG_NAME:-volteryde-rds-postgres-sg}"
SUBNET_GROUP="${SUBNET_GROUP:-volteryde-rds-subnet-group}"

generate_db_pass() {
  # AWS RDS master password constraints (common): 8-41 chars; printable ASCII
  # Excludes: '/', '@', '"', and spaces.
  # We generate a password without those characters.
  local pw
  pw=$(LC_ALL=C tr -dc 'A-Za-z0-9!#$%&()*+,-.:;<=>?[]^_{|}~' </dev/urandom | head -c 32)
  echo "$pw"
}

is_invalid_db_pass() {
  local pw="$1"
  if [[ -z "$pw" ]]; then
    return 0
  fi
  if (( ${#pw} < 8 || ${#pw} > 41 )); then
    return 0
  fi
  if [[ "$pw" == *" "* || "$pw" == *"/"* || "$pw" == *"@"* || "$pw" == *'"'* ]]; then
    return 0
  fi
  return 1
}

if is_invalid_db_pass "$DB_PASS"; then
  DB_PASS="$(generate_db_pass)"
fi

aws sts get-caller-identity >/dev/null
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME" >/dev/null
kubectl get ns "$NAMESPACE" >/dev/null

CLUSTER_JSON=$(aws eks describe-cluster --region "$AWS_REGION" --name "$CLUSTER_NAME" --output json)
VPC_ID=$(echo "$CLUSTER_JSON" | jq -r '.cluster.resourcesVpcConfig.vpcId')
SUBNET_IDS=$(echo "$CLUSTER_JSON" | jq -r '.cluster.resourcesVpcConfig.subnetIds | join(" ")')

if [[ -z "$VPC_ID" || "$VPC_ID" == "null" ]]; then
  echo "Unable to discover VPC ID from EKS cluster" >&2
  exit 1
fi

SG_ID=$(aws ec2 create-security-group \
  --region "$AWS_REGION" \
  --group-name "$SG_NAME" \
  --description "Volteryde RDS Postgres access" \
  --vpc-id "$VPC_ID" \
  --query 'GroupId' \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --region "$AWS_REGION" \
    --filters Name=vpc-id,Values="$VPC_ID" Name=group-name,Values="$SG_NAME" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

aws ec2 authorize-security-group-ingress \
  --region "$AWS_REGION" \
  --group-id "$SG_ID" \
  --ip-permissions 'IpProtocol=tcp,FromPort=5432,ToPort=5432,IpRanges=[{CidrIp=10.0.0.0/16,Description="VPC access"}]' \
  >/dev/null 2>&1 || true

aws rds create-db-subnet-group \
  --region "$AWS_REGION" \
  --db-subnet-group-name "$SUBNET_GROUP" \
  --db-subnet-group-description "Volteryde RDS subnet group" \
  --subnet-ids $SUBNET_IDS \
  >/dev/null 2>&1 || true

if aws rds describe-db-instances --region "$AWS_REGION" --db-instance-identifier "$DB_ID" >/dev/null 2>&1; then
  aws rds modify-db-instance \
    --region "$AWS_REGION" \
    --db-instance-identifier "$DB_ID" \
    --master-user-password "$DB_PASS" \
    --apply-immediately \
    >/dev/null
else
  aws rds create-db-instance \
    --region "$AWS_REGION" \
    --db-instance-identifier "$DB_ID" \
    --db-instance-class "$DB_INSTANCE_CLASS" \
    --engine postgres \
    --engine-version "$DB_ENGINE_VERSION" \
    --allocated-storage "$DB_ALLOCATED_STORAGE_GB" \
    --storage-type gp3 \
    --storage-encrypted \
    --db-name "$DB_NAME" \
    --master-username "$DB_USER" \
    --master-user-password "$DB_PASS" \
    --vpc-security-group-ids "$SG_ID" \
    --db-subnet-group-name "$SUBNET_GROUP" \
    --backup-retention-period 7 \
    --no-multi-az \
    --no-publicly-accessible \
    --deletion-protection \
    --auto-minor-version-upgrade \
    --tags Key=Project,Value=Volteryde Key=Environment,Value=production \
    >/dev/null
fi

aws rds wait db-instance-available --region "$AWS_REGION" --db-instance-identifier "$DB_ID"

RDS_ENDPOINT=$(aws rds describe-db-instances \
  --region "$AWS_REGION" \
  --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

RDS_PORT=$(aws rds describe-db-instances \
  --region "$AWS_REGION" \
  --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[0].Endpoint.Port' \
  --output text)

echo "RDS available: ${RDS_ENDPOINT}:${RDS_PORT}"

if kubectl get secret volteryde-secrets -n "$NAMESPACE" >/dev/null 2>&1; then
  kubectl patch secret volteryde-secrets \
    -n "$NAMESPACE" \
    --type merge \
    -p "{\"stringData\":{\"DATABASE_HOST\":\"${RDS_ENDPOINT}\",\"DATABASE_PORT\":\"5432\",\"DATABASE_NAME\":\"${DB_NAME}\",\"DATABASE_USER\":\"${DB_USER}\",\"DATABASE_PASSWORD\":\"${DB_PASS}\"}}" \
    >/dev/null
else
  CREATE_ARGS=(
    --from-literal=DATABASE_HOST="${RDS_ENDPOINT}"
    --from-literal=DATABASE_PORT="5432"
    --from-literal=DATABASE_NAME="${DB_NAME}"
    --from-literal=DATABASE_USER="${DB_USER}"
    --from-literal=DATABASE_PASSWORD="${DB_PASS}"
  )

  if [[ -n "${TEMPORAL_API_KEY:-}" ]]; then
    CREATE_ARGS+=(--from-literal=TEMPORAL_API_KEY="${TEMPORAL_API_KEY}")
  fi
  if [[ -n "${JWT_SECRET:-}" ]]; then
    CREATE_ARGS+=(--from-literal=JWT_SECRET="${JWT_SECRET}")
  fi

  kubectl create secret generic volteryde-secrets \
    -n "$NAMESPACE" \
    "${CREATE_ARGS[@]}" \
    --dry-run=client \
    -o yaml | kubectl apply -f - >/dev/null
fi

kubectl patch configmap volteryde-config \
  -n "$NAMESPACE" \
  --type merge \
  -p "{\"data\":{\"DATABASE_HOST\":\"${RDS_ENDPOINT}\",\"DATABASE_PORT\":\"5432\",\"DATABASE_NAME\":\"${DB_NAME}\"}}" \
  >/dev/null

kubectl rollout restart deployment -n "$NAMESPACE" >/dev/null

kubectl wait --for=condition=available deployment --all -n "$NAMESPACE" --timeout=10m

kubectl run volteryde-healthcheck \
  -n "$NAMESPACE" \
  --rm -i \
  --restart=Never \
  --image=curlimages/curl:8.10.1 \
  --command -- sh -c 'curl -sf http://nestjs-service:3000/health >/dev/null && echo OK'

# Infrastructure Setup Guide
## AWS + Terraform - Production-Grade Cloud Architecture

---

## Overview

This guide describes the complete AWS infrastructure for Volteryde, provisioned via **Terraform**. The architecture spans three environments (**dev**, **staging**, **production**) with proper isolation and security.

### Infrastructure Components

- **VPC** with public/private subnets across 3 Availability Zones
- **EKS** (Kubernetes) cluster for container orchestration
- **RDS PostgreSQL** (Multi-AZ) for transactional data
- **ElastiCache Redis** for caching and sessions
- **TimescaleDB** (on EC2 or RDS) for time-series telemetry
- **S3** for object storage (documents, logs, backups)
- **CloudFront** CDN for static assets
- **Route53** for DNS management
- **ALB** (Application Load Balancer) for ingress
- **Secrets Manager** for sensitive configuration
- **CloudWatch** for monitoring and logging
- **KMS** for encryption at rest

---

## AWS Account Structure

### Multi-Account Strategy (Best Practice)

```
Root AWS Organization
├── volteryde-dev (AWS Account)
├── volteryde-staging (AWS Account)
└── volteryde-production (AWS Account)
```

**Why Separate Accounts?**
- ✅ Blast radius containment (dev experiments don't affect prod)
- ✅ Cost allocation and billing separation
- ✅ IAM isolation (developers can have admin in dev, read-only in prod)
- ✅ Compliance requirements (PCI DSS for payments)

---

## Terraform State Management

### Remote Backend (S3 + DynamoDB)

**`infrastructure/terraform/shared/backend.tf`**:
```hcl
terraform {
  backend "s3" {
    bucket         = "volteryde-terraform-state"
    key            = "environments/${terraform.workspace}/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID"
  }
}

# S3 bucket for state storage
resource "aws_s3_bucket" "terraform_state" {
  bucket = "volteryde-terraform-state"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name        = "Terraform State Storage"
    Environment = "shared"
  }
}

# Enable versioning for state history
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encrypt state at rest
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform.arn
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Terraform State Lock"
    Environment = "shared"
  }
}
```

### Terraform Workspaces

```bash
# Initialize Terraform
terraform init

# Create and select workspace
terraform workspace new dev
terraform workspace select dev

# List workspaces
terraform workspace list

# Current workspace is used in state path:
# s3://volteryde-terraform-state/environments/dev/terraform.tfstate
```

---

## VPC Networking Architecture

### Network Design

```
VPC: 10.0.0.0/16 (65,536 IPs)
│
├── Availability Zone A (us-east-1a)
│   ├── Public Subnet A:    10.0.1.0/24 (256 IPs)  → ALB, NAT Gateway
│   ├── Private Subnet A:   10.0.11.0/24 (256 IPs) → EKS worker nodes
│   └── Database Subnet A:  10.0.21.0/24 (256 IPs) → RDS, ElastiCache
│
├── Availability Zone B (us-east-1b)
│   ├── Public Subnet B:    10.0.2.0/24
│   ├── Private Subnet B:   10.0.12.0/24
│   └── Database Subnet B:  10.0.22.0/24
│
└── Availability Zone C (us-east-1c)
    ├── Public Subnet C:    10.0.3.0/24
    ├── Private Subnet C:   10.0.13.0/24
    └── Database Subnet C:  10.0.23.0/24
```

### VPC Module

**`infrastructure/terraform/modules/vpc-networking/main.tf`**:
```hcl
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name                                        = "volteryde-${var.environment}-vpc"
    Environment                                 = var.environment
    "kubernetes.io/cluster/volteryde-${var.environment}" = "shared"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "volteryde-${var.environment}-igw"
    Environment = var.environment
  }
}

# Public Subnets (for ALB, NAT Gateways)
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "volteryde-${var.environment}-public-${count.index + 1}"
    Environment                                 = var.environment
    Type                                        = "public"
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/volteryde-${var.environment}" = "shared"
  }
}

# Private Subnets (for EKS worker nodes)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 11)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name                                        = "volteryde-${var.environment}-private-${count.index + 1}"
    Environment                                 = var.environment
    Type                                        = "private"
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/volteryde-${var.environment}" = "shared"
  }
}

# Database Subnets (for RDS, ElastiCache)
resource "aws_subnet" "database" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 21)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "volteryde-${var.environment}-database-${count.index + 1}"
    Environment = var.environment
    Type        = "database"
  }
}

# NAT Gateways (one per AZ for high availability)
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name        = "volteryde-${var.environment}-nat-eip-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "volteryde-${var.environment}-nat-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "volteryde-${var.environment}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "volteryde-${var.environment}-private-rt-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  value = aws_subnet.database[*].id
}
```

---

## EKS Cluster Module

**`infrastructure/terraform/modules/eks-cluster/main.tf`**:
```hcl
variable "environment" {}
variable "vpc_id" {}
variable "private_subnet_ids" {
  type = list(string)
}

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster" {
  name = "volteryde-${var.environment}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "volteryde-${var.environment}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"] # Restrict to office IP in production
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Name        = "volteryde-${var.environment}-eks"
    Environment = var.environment
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

# Node Group IAM Role
resource "aws_iam_role" "eks_node_group" {
  name = "volteryde-${var.environment}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "volteryde-${var.environment}-node-group"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = var.private_subnet_ids

  instance_types = var.environment == "production" ? ["m5.large", "m5.xlarge"] : ["t3.medium"]

  scaling_config {
    desired_size = var.environment == "production" ? 6 : 2
    max_size     = var.environment == "production" ? 20 : 5
    min_size     = var.environment == "production" ? 3 : 1
  }

  update_config {
    max_unavailable = 1
  }

  tags = {
    Name        = "volteryde-${var.environment}-eks-nodes"
    Environment = var.environment
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
}

# KMS Key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key for ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "volteryde-${var.environment}-eks-kms"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/volteryde-${var.environment}-eks"
  target_key_id = aws_kms_key.eks.key_id
}

# Outputs
output "cluster_id" {
  value = aws_eks_cluster.main.id
}

output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  value = aws_eks_cluster.main.certificate_authority[0].data
}
```

---

## RDS PostgreSQL Module

**`infrastructure/terraform/modules/rds-postgres/main.tf`**:
```hcl
variable "environment" {}
variable "vpc_id" {}
variable "database_subnet_ids" {
  type = list(string)
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "volteryde-${var.environment}-db-subnet-group"
  subnet_ids = var.database_subnet_ids

  tags = {
    Name        = "volteryde-${var.environment}-db-subnet-group"
    Environment = var.environment
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "volteryde-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Allow from VPC
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "volteryde-${var.environment}-rds-sg"
    Environment = var.environment
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "volteryde-${var.environment}-postgres"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.environment == "production" ? "db.r6g.xlarge" : "db.t3.medium"

  allocated_storage     = var.environment == "production" ? 100 : 20
  max_allocated_storage = var.environment == "production" ? 1000 : 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = "volteryde"
  username = "admin"
  password = random_password.rds_password.result

  multi_az               = var.environment == "production" ? true : false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  deletion_protection = var.environment == "production" ? true : false
  skip_final_snapshot = var.environment != "production"

  tags = {
    Name        = "volteryde-${var.environment}-postgres"
    Environment = var.environment
  }
}

# Random password for RDS
resource "random_password" "rds_password" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "rds_password" {
  name                    = "volteryde/${var.environment}/rds/password"
  recovery_window_in_days = 7

  tags = {
    Name        = "volteryde-${var.environment}-rds-password"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "rds_password" {
  secret_id = aws_secretsmanager_secret.rds_password.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.rds_password.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

# KMS Key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "RDS encryption key for ${var.environment}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "volteryde-${var.environment}-rds-kms"
    Environment = var.environment
  }
}

# Outputs
output "db_instance_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "db_instance_name" {
  value = aws_db_instance.main.db_name
}

output "db_secret_arn" {
  value = aws_secretsmanager_secret.rds_password.arn
}
```

---

## ElastiCache Redis Module

**`infrastructure/terraform/modules/elasticache-redis/main.tf`**:
```hcl
variable "environment" {}
variable "vpc_id" {}
variable "private_subnet_ids" {
  type = list(string)
}

# Redis Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "volteryde-${var.environment}-redis-subnet"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "volteryde-${var.environment}-redis-subnet"
    Environment = var.environment
  }
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  name        = "volteryde-${var.environment}-redis-sg"
  description = "Security group for Redis"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "volteryde-${var.environment}-redis-sg"
    Environment = var.environment
  }
}

# ElastiCache Redis Replication Group
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "volteryde-${var.environment}-redis"
  replication_group_description = "Redis cluster for ${var.environment}"

  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.environment == "production" ? "cache.r6g.large" : "cache.t3.micro"
  num_cache_clusters   = var.environment == "production" ? 3 : 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  automatic_failover_enabled = var.environment == "production" ? true : false
  multi_az_enabled           = var.environment == "production" ? true : false

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result

  snapshot_retention_limit = var.environment == "production" ? 5 : 1
  snapshot_window          = "03:00-05:00"

  tags = {
    Name        = "volteryde-${var.environment}-redis"
    Environment = var.environment
  }
}

# Random auth token
resource "random_password" "redis_auth_token" {
  length  = 32
  special = false
}

# Store auth token in Secrets Manager
resource "aws_secretsmanager_secret" "redis_auth" {
  name                    = "volteryde/${var.environment}/redis/auth-token"
  recovery_window_in_days = 7

  tags = {
    Name        = "volteryde-${var.environment}-redis-auth"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    primary_endpoint = aws_elasticache_replication_group.main.primary_endpoint_address
    auth_token       = random_password.redis_auth_token.result
    port             = 6379
  })
}

# Outputs
output "redis_endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "redis_secret_arn" {
  value = aws_secretsmanager_secret.redis_auth.arn
}
```

---

## Environment Configuration Example

**`infrastructure/terraform/environments/dev/main.tf`**:
```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "volteryde-terraform-state"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      ManagedBy   = "Terraform"
      Project     = "Volteryde"
    }
  }
}

variable "aws_region" {
  default = "us-east-1"
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc-networking"

  environment        = "dev"
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# EKS Module
module "eks" {
  source = "../../modules/eks-cluster"

  environment        = "dev"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
}

# RDS PostgreSQL Module
module "rds" {
  source = "../../modules/rds-postgres"

  environment         = "dev"
  vpc_id              = module.vpc.vpc_id
  database_subnet_ids = module.vpc.database_subnet_ids
}

# ElastiCache Redis Module
module "redis" {
  source = "../../modules/elasticache-redis"

  environment        = "dev"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
}

# Outputs
output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  value = module.redis.redis_endpoint
}
```

---

## Terraform Commands

```bash
# Initialize
cd infrastructure/terraform/environments/dev
terraform init

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan

# Destroy (careful!)
terraform destroy

# Format code
terraform fmt -recursive

# Validate
terraform validate
```

---

## Security Groups Strategy

| Resource | Allowed Inbound | Allowed Outbound |
|----------|-----------------|------------------|
| **ALB** | 443 (HTTPS) from 0.0.0.0/0 | All to EKS worker nodes |
| **EKS Worker Nodes** | All from ALB, NodePort from VPC | All |
| **RDS PostgreSQL** | 5432 from VPC | All |
| **ElastiCache Redis** | 6379 from VPC | All |
| **TimescaleDB (EC2)** | 5432 from VPC | All |

---

## Cost Estimation (Dev Environment)

| Resource | Type | Monthly Cost |
|----------|------|-------------|
| **EKS Cluster** | Control plane | $73 |
| **EKS Worker Nodes** | 2 × t3.medium | $60 |
| **RDS PostgreSQL** | db.t3.medium | $65 |
| **ElastiCache Redis** | cache.t3.micro | $12 |
| **NAT Gateways** | 3 × NAT Gateway | $96 |
| **S3** | Storage + transfers | $10 |
| **CloudWatch** | Logs + metrics | $20 |
| **ALB** | Application Load Balancer | $22 |
| **Total** | | **~$358/month** |

**Production** (with Multi-AZ, larger instances): **~$1,200-2,000/month**

---

## Next Steps

✅ VPC with 3-AZ architecture  
✅ EKS cluster with node groups  
✅ RDS PostgreSQL (Multi-AZ in production)  
✅ ElastiCache Redis (clustered in production)  
✅ Secrets Manager for credentials  
✅ KMS encryption at rest

**Next**: See `KUBERNETES_DEPLOYMENT_GUIDE.md` for container orchestration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# EKS Cluster Module
module "eks" {
  source = "./modules/eks"

  project_name       = var.project_name
  environment        = var.environment
  cluster_version    = var.eks_cluster_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  # Node groups configuration
  nestjs_instance_type = var.nestjs_node_instance_type
  nestjs_min_size      = var.nestjs_node_min_size
  nestjs_max_size      = var.nestjs_node_max_size

  springboot_instance_type = var.springboot_node_instance_type
  springboot_min_size      = var.springboot_node_min_size
  springboot_max_size      = var.springboot_node_max_size
}

# ElastiCache Redis Module
module "elasticache" {
  source = "./modules/elasticache"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  node_type          = var.redis_node_type
  num_cache_nodes    = var.redis_num_cache_nodes
  security_group_ids = [module.eks.cluster_security_group_id]
}

# Amazon MSK (Managed Kafka) Module
module "msk" {
  source = "./modules/msk"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  instance_type      = var.msk_instance_type
  number_of_brokers  = var.msk_number_of_brokers
  security_group_ids = [module.eks.cluster_security_group_id]
}

# Amazon Timestream Module
module "timestream" {
  source = "./modules/timestream"

  project_name = var.project_name
  environment  = var.environment
}

# ECR (Container Registry) Module
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment

  repositories = [
    "nestjs-booking",
    "nestjs-charging",
    "nestjs-fleet",
    "nestjs-telematics",
    "nestjs-notifications",
    "nestjs-api",
    "springboot-auth",
    "springboot-payment",
    "springboot-user-management",
    "springboot-client-auth",
    "temporal-workers",
    "admin-dashboard",
    "support-app",
    "dispatcher-app",
    "landing-page",
    "auth-frontend",
    "bi-partner-app"
  ]
}

# S3 Buckets Module
module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  environment  = var.environment
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_ids = [module.eks.cluster_security_group_id]
}

# Monitoring & Logging Module
module "monitoring" {
  source = "./modules/monitoring"

  project_name     = var.project_name
  environment      = var.environment
  eks_cluster_name = module.eks.cluster_name
}

# IAM Roles & Policies Module
module "iam" {
  source = "./modules/iam"

  project_name          = var.project_name
  environment           = var.environment
  eks_cluster_name      = module.eks.cluster_name
  eks_oidc_provider_arn = module.eks.oidc_provider_arn
}

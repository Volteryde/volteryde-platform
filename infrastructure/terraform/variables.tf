variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "volteryde"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for the region"
  type        = list(string)
  default     = ["sa-east-1a", "sa-east-1b", "sa-east-1c"]
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "nestjs_node_instance_type" {
  description = "EC2 instance type for NestJS services"
  type        = string
  default     = "t3.medium"
}

variable "nestjs_node_min_size" {
  description = "Minimum number of nodes for NestJS node group"
  type        = number
  default     = 3
}

variable "nestjs_node_max_size" {
  description = "Maximum number of nodes for NestJS node group"
  type        = number
  default     = 10
}

variable "springboot_node_instance_type" {
  description = "EC2 instance type for Spring Boot services"
  type        = string
  default     = "t3.large"
}

variable "springboot_node_min_size" {
  description = "Minimum number of nodes for Spring Boot node group"
  type        = number
  default     = 2
}

variable "springboot_node_max_size" {
  description = "Maximum number of nodes for Spring Boot node group"
  type        = number
  default     = 6
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes for Redis"
  type        = number
  default     = 2
}

variable "msk_instance_type" {
  description = "MSK Kafka broker instance type"
  type        = string
  default     = "kafka.t3.small"
}

variable "msk_number_of_brokers" {
  description = "Number of Kafka brokers"
  type        = number
  default     = 3
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Volteryde"
    ManagedBy   = "Terraform"
    Environment = "production"
  }
}

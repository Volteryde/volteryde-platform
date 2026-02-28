# ============================================================================
# RDS PostgreSQL Module - Production-Grade Configuration
# ============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ============================================================================
# Variables
# ============================================================================

variable "identifier" {
  description = "Identifier for the RDS instance"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for RDS subnet group"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling"
  type        = number
  default     = 500
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "database_name" {
  description = "Name of the default database"
  type        = string
  default     = "volteryde"
}

variable "master_username" {
  description = "Master username"
  type        = string
  default     = "postgres"
}

variable "allowed_security_group_ids" {
  description = "Security group IDs allowed to access RDS"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# ============================================================================
# Random Password Generation
# ============================================================================

resource "random_password" "master" {
  length  = 32
  special = true
}

# ============================================================================
# Secrets Manager for Database Credentials
# ============================================================================

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.identifier}-db-credentials"
  description             = "Database credentials for ${var.identifier}"
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = merge(
    var.tags,
    {
      Name        = "${var.identifier}-db-credentials"
      Environment = var.environment
    }
  )
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = var.database_name
    engine   = "postgres"
  })
}

# ============================================================================
# DB Subnet Group
# ============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name        = "${var.identifier}-subnet-group"
      Environment = var.environment
    }
  )
}

# ============================================================================
# Security Group
# ============================================================================

resource "aws_security_group" "rds" {
  name        = "${var.identifier}-rds-sg"
  description = "Security group for RDS ${var.identifier}"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from allowed security groups"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.identifier}-rds-sg"
      Environment = var.environment
    }
  )
}

# ============================================================================
# RDS Instance
# ============================================================================

resource "aws_db_instance" "main" {
  identifier     = var.identifier
  engine         = "postgres"
  engine_version = "15.4"

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = var.database_name
  username = var.master_username
  password = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  multi_az               = var.multi_az
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = var.environment == "production"
  performance_insights_retention_period = var.environment == "production" ? 7 : 0

  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.identifier}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true

  tags = merge(
    var.tags,
    {
      Name        = var.identifier
      Environment = var.environment
    }
  )
}

# ============================================================================
# KMS Key for RDS Encryption
# ============================================================================

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS ${var.identifier}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name        = "${var.identifier}-rds-key"
      Environment = var.environment
    }
  )
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.identifier}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# ============================================================================
# CloudWatch Alarms
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.identifier}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "free_storage_space" {
  alarm_name          = "${var.identifier}-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = var.tags
}

# ============================================================================
# Outputs
# ============================================================================

output "db_instance_endpoint" {
  description = "Connection endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
}

output "db_instance_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "db_instance_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "db_security_group_id" {
  description = "Security group ID of the RDS instance"
  value       = aws_security_group.rds.id
}

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

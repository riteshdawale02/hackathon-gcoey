terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "PulseQueue"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}

# 1. VPC Module
module "vpc" {
  source             = "./modules/vpc"
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# 2. ECR Module
module "ecr" {
  source      = "./modules/ecr"
  environment = var.environment
}

# 3. EKS Cluster Module
module "eks" {
  source              = "./modules/eks"
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  node_instance_types = var.node_instance_types
}

# 4. RDS PostgreSQL Module
module "rds" {
  source                = "./modules/rds"
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  eks_security_group_id = module.eks.node_security_group_id
  db_username           = var.db_username
  db_password           = var.db_password
}

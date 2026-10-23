variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "eks_security_group_id" { type = string }
variable "db_username" { default = "postgres" }
variable "db_password" { type = string }

resource "aws_db_subnet_group" "rds" {
  name       = "pulsequeue-${var.environment}-db-subnets"
  subnet_ids = var.private_subnet_ids
  tags       = { Name = "pulsequeue-${var.environment}-db-subnet-group" }
}

resource "aws_security_group" "rds_sg" {
  name        = "pulsequeue-${var.environment}-rds-sg"
  description = "Allow inbound postgres from EKS nodes"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.eks_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "pulsequeue-${var.environment}-rds-sg" }
}

resource "aws_db_instance" "postgres" {
  identifier             = "pulsequeue-${var.environment}-db"
  allocated_storage      = 20
  max_allocated_storage  = 50
  engine                 = "postgres"
  engine_version         = "15.5"
  instance_class         = "db.t3.micro" # Cost-effective tier for hackathons
  db_name                = "postgres"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true # Ensures clean terraform destroy after presentation!
  publicly_accessible    = false
  deletion_protection    = false

  tags = {
    Name        = "pulsequeue-${var.environment}-db"
    Environment = var.environment
  }
}

output "endpoint" { value = aws_db_instance.postgres.endpoint }
output "address" { value = aws_db_instance.postgres.address }
output "port" { value = aws_db_instance.postgres.port }

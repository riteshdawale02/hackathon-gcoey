output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "EKS Cluster Name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS Cluster API Endpoint"
  value       = module.eks.cluster_endpoint
}

output "ecr_repositories" {
  description = "ECR Repository URLs"
  value       = module.ecr.repository_urls
}

output "rds_endpoint" {
  description = "RDS PostgreSQL Database Endpoint"
  value       = module.rds.endpoint
}

output "kubectl_config_command" {
  description = "Command to configure kubectl for this EKS cluster"
  value       = "aws eks --region ${var.aws_region} update-kubeconfig --name ${module.eks.cluster_name}"
}

output "cost_savings_note" {
  description = "Reminder to destroy resources after hackathon demo"
  value       = "⚠️ HACKATHON COST SAVINGS: Run 'terraform destroy' immediately after the demo to avoid ongoing AWS charges!"
}

variable "project_name" {
  type        = string
  default     = "parvaah-landslide"
  description = "Project identifier"
}

variable "environment" {
  type        = string
  default     = "staging"
  description = "Deployment environment"
}

variable "aws_region" {
  type        = string
  default     = "ap-south-1"
  description = "AWS region (Asia Pacific - Mumbai)"
}

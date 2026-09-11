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
}

# S3 Bucket for Satellite Imagery & InSAR Products
resource "aws_s3_bucket" "satellite_products" {
  bucket = "${var.project_name}-satellite-products-${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Region      = "NER-India"
  }
}

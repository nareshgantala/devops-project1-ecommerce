variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "ecommerce"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "db_name" {
  default = "ecommerce"
}

variable "db_username" {
  default = "postgres"
}

variable "db_password" {
  type      = string
  sensitive = true
}
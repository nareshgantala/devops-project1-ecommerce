# Terraform Learning Guide for E-Commerce Platform

Based on your application code review, this guide outlines the specific Terraform concepts and AWS services you need to learn to complete the infrastructure modules.

## 📋 Application Infrastructure Requirements Analysis

### **Backend Requirements (app.js:1-414)**

- Node.js application on port 8000
- PostgreSQL database connection (port 5432)
- Redis cache connection (port 6379)
- HTTP endpoints for REST API
- Health check endpoint at `/health`
- Environment variables for configuration
- Connection pooling (max 20 connections)
- Graceful shutdown handling

### **Frontend Requirements (App.js)**

- React SPA requiring Nginx server
- Static files served on port 80/443
- Environment variable: `REACT_APP_API_URL`
- Needs to communicate with backend API
- No direct database access

### **Database Schema Requirements**

- PostgreSQL database named "ecommerce"
- Tables: products, orders, order_items
- Requires automated initialization (init.sql)
- Transaction support needed
- Connection timeout: 2 seconds

### **Caching Requirements**

- Redis for caching products and stats
- TTL: 300s for products, 600s for individual products
- Cache invalidation on mutations
- Reconnection strategy with retries

---

## 🎯 Terraform Learning Roadmap

### **Phase 1: Terraform Basics (Days 1-2)**

#### 1.1 Core Terraform Concepts

**What to Learn:**

- HCL (HashiCorp Configuration Language) syntax
- Resources, data sources, and providers
- Variables (input and output)
- State management and backends
- Terraform workflow: init, plan, apply, destroy

**Practice Exercise:**

```hcl
# Create a simple S3 bucket to understand syntax
resource "aws_s3_bucket" "example" {
  bucket = "my-test-bucket"
  tags = {
    Environment = "dev"
  }
}
```

**Resources:**

- [Terraform Language Documentation](https://developer.hashicorp.com/terraform/language)
- [Get Started - AWS Tutorial](https://developer.hashicorp.com/terraform/tutorials/aws-get-started)

#### 1.2 Project Structure

**What to Learn:**

- Organizing .tf files by service
- Using variables.tf and outputs.tf
- terraform.tfvars for environment-specific values
- Modules vs root configuration

**For Your Project:**

```
terraform/
├── provider.tf      # AWS provider configuration
├── variables.tf     # Input variables
├── vpc.tf          # Network resources
├── ecr.tf          # Container registry
├── ecs.tf          # Container orchestration
├── alb.tf          # Load balancer
├── rds.tf          # Database
├── elasticache.tf  # Cache layer
├── security-groups.tf  # Firewall rules
├── iam.tf          # Permissions
└── outputs.tf      # Export values
```

---

### **Phase 2: Networking (Days 3-4)**

#### 2.1 VPC (Virtual Private Cloud)

**Why You Need It:** Your application needs isolated network infrastructure

**What to Learn:**

- VPC CIDR blocks (e.g., 10.0.0.0/16)
- Subnets (public vs private)
- Availability Zones for high availability
- Internet Gateway for public internet access
- NAT Gateway for private subnet outbound traffic
- Route tables and associations

**Key Resources for Your Project:**

```hcl
# vpc.tf structure you need:
- aws_vpc
- aws_internet_gateway
- aws_subnet (public x2, private x2)
- aws_nat_gateway (x2 for HA)
- aws_eip (for NAT gateways)
- aws_route_table
- aws_route_table_association
```

**Your Application Needs:**

- **Public Subnets (2 AZs):** For ALB to receive internet traffic
- **Private Subnets (2 AZs):** For ECS tasks, RDS, and Redis (security)
- **Internet Gateway:** ALB needs to be accessible from internet
- **NAT Gateway:** ECS tasks in private subnets need outbound internet (for npm packages, ECR pulls)

**Learning Resources:**

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [Terraform AWS VPC Module](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/)

**Practice:**

- Create a VPC with CIDR 10.0.0.0/16
- Create 2 public subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs
- Create 2 private subnets (10.0.10.0/24, 10.0.11.0/24) in different AZs
- Set up Internet Gateway for public subnets
- Set up NAT Gateways in each public subnet for private subnet outbound traffic

---

### **Phase 3: Security Groups (Day 5)**

#### 3.1 Security Groups (Firewall Rules)

**Why You Need It:** Control network access between your services

**What to Learn:**

- Ingress rules (inbound traffic)
- Egress rules (outbound traffic)
- Port numbers and protocols
- CIDR notation for IP ranges
- Security group references (instead of CIDR)

**Key Resource:**

```hcl
resource "aws_security_group" "name" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

**Your Application Security Requirements:**

1. **ALB Security Group:**

   - Ingress: Port 80 (HTTP) from 0.0.0.0/0 (internet)
   - Ingress: Port 443 (HTTPS) from 0.0.0.0/0 (internet)
   - Egress: All traffic to ECS tasks

2. **ECS Tasks Security Group:**

   - Ingress: Port 8000 from ALB security group (backend)
   - Ingress: Port 80 from ALB security group (frontend)
   - Egress: Port 5432 to RDS security group
   - Egress: Port 6379 to Redis security group
   - Egress: Port 443 to 0.0.0.0/0 (for ECR, AWS APIs)

3. **RDS Security Group:**

   - Ingress: Port 5432 (PostgreSQL) from ECS security group ONLY
   - Egress: Not typically needed

4. **ElastiCache Security Group:**
   - Ingress: Port 6379 (Redis) from ECS security group ONLY
   - Egress: Not typically needed

**Why This Matters:** Your backend (app.js:18-27) connects to PostgreSQL on port 5432 and Redis (app.js:30-38) on port 6379. Without proper security group rules, these connections will fail.

---

### **Phase 4: Container Services (Days 6-8)**

#### 4.1 ECR (Elastic Container Registry)

**Why You Need It:** Store your Docker images

**What to Learn:**

- Repository creation
- Image scanning configuration
- Lifecycle policies
- Repository policies (permissions)

**Key Resources:**

```hcl
# ecr.tf
resource "aws_ecr_repository" "backend"
resource "aws_ecr_repository" "frontend"
```

**Your Application Needs:**

- Backend repository for Node.js image
- Frontend repository for Nginx/React image
- Image scanning enabled for security

#### 4.2 ECS (Elastic Container Service)

**Why You Need It:** Run your containerized applications

**What to Learn:**

- ECS Cluster
- Task Definitions (container specs)
- Container definitions (CPU, memory, ports, environment variables)
- ECS Services (maintains desired count of tasks)
- Launch types: Fargate vs EC2
- Task networking (awsvpc mode)
- Service discovery
- Auto-scaling policies

**Key Resources:**

```hcl
# ecs.tf
resource "aws_ecs_cluster"
resource "aws_ecs_task_definition" (backend, frontend)
resource "aws_ecs_service" (backend, frontend)
resource "aws_appautoscaling_target"
resource "aws_appautoscaling_policy"
```

**Your Task Definition Requirements:**

**Backend Task:**

```json
{
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ecr-url>/backend:latest",
      "portMappings": [{ "containerPort": 8000 }],
      "environment": [
        { "name": "PORT", "value": "8000" },
        { "name": "DB_HOST", "value": "<rds-endpoint>" },
        { "name": "DB_PORT", "value": "5432" },
        { "name": "DB_NAME", "value": "ecommerce" },
        { "name": "REDIS_URL", "value": "redis://<elasticache-endpoint>:6379" }
      ],
      "secrets": [
        { "name": "DB_PASSWORD", "valueFrom": "<secrets-manager-arn>" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ecommerce-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ],
  "cpu": "256",
  "memory": "512",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"]
}
```

**Frontend Task:**

- Similar structure but port 80
- Environment variable: REACT_APP_API_URL (ALB DNS)
- No database/Redis configuration needed

**Why This Matters:** Your backend needs all these environment variables (app.js:1-22) to connect to services.

---

### **Phase 5: Load Balancing (Days 9-10)**

#### 5.1 Application Load Balancer (ALB)

**Why You Need It:** Distribute traffic and provide single entry point

**What to Learn:**

- ALB vs NLB vs CLB
- Listeners (port 80, 443)
- Target groups
- Health checks
- Path-based routing
- SSL/TLS certificates (ACM)

**Key Resources:**

```hcl
# alb.tf
resource "aws_lb" (Application Load Balancer)
resource "aws_lb_listener" (HTTP, HTTPS)
resource "aws_lb_target_group" (backend, frontend)
resource "aws_lb_listener_rule" (routing rules)
```

**Your Application Routing:**

```
Internet → ALB (port 80/443)
  ├─ /api/* → Backend Target Group → ECS Backend Tasks (port 8000)
  └─ /*     → Frontend Target Group → ECS Frontend Tasks (port 80)
```

**Health Check Configuration:**

- **Backend Target Group:**

  - Path: `/health` (matches app.js:41)
  - Port: 8000
  - Healthy threshold: 2
  - Unhealthy threshold: 3
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Expected: 200 status code

- **Frontend Target Group:**
  - Path: `/`
  - Port: 80
  - Similar thresholds

**Why This Matters:** Your backend has a health check endpoint (app.js:41-59) that ALB must use to determine if tasks are healthy.

---

### **Phase 6: Databases (Days 11-12)**

#### 6.1 RDS PostgreSQL

**Why You Need It:** Managed PostgreSQL database for your application data

**What to Learn:**

- DB instance classes (e.g., db.t3.micro)
- Storage types (gp2, gp3, io1)
- Multi-AZ deployments
- Automated backups and snapshots
- DB subnet groups
- Parameter groups
- Encryption at rest

**Key Resources:**

```hcl
# rds.tf
resource "aws_db_subnet_group"
resource "aws_db_parameter_group"
resource "aws_db_instance"
```

**Your Database Requirements:**

- **Engine:** postgres
- **Version:** 14 or higher
- **Database name:** ecommerce (app.js:21)
- **Username:** postgres (configurable)
- **Password:** Store in Secrets Manager, reference in ECS task
- **Port:** 5432 (default PostgreSQL)
- **Subnets:** Private subnets ONLY (security)
- **Security group:** Only allow ECS tasks on port 5432
- **Storage:** Start with 20GB gp2
- **Multi-AZ:** false for dev, true for production
- **Backup retention:** 7 days minimum

**Connection Configuration:**
Your backend (app.js:18-27) creates a connection pool with:

- Max connections: 20
- Connection timeout: 2 seconds
- Idle timeout: 30 seconds

**Important:** RDS endpoint must be passed as `DB_HOST` environment variable to ECS tasks.

#### 6.2 Database Initialization

**What to Learn:**

- Using user_data or AWS Lambda to run init.sql
- DB parameter for initialization
- Manual initialization via bastion host

**Challenge:** Your `init.sql` needs to run after RDS is created to set up tables.

---

### **Phase 7: Caching (Day 13)**

#### 7.1 ElastiCache Redis

**Why You Need It:** Managed Redis for caching and performance

**What to Learn:**

- Cluster mode vs non-cluster mode
- Node types (cache.t3.micro, etc.)
- Subnet groups
- Automatic failover
- Parameter groups
- Encryption in-transit and at-rest

**Key Resources:**

```hcl
# elasticache.tf
resource "aws_elasticache_subnet_group"
resource "aws_elasticache_parameter_group"
resource "aws_elasticache_cluster" (or replication_group)
```

**Your Cache Requirements:**

- **Engine:** redis
- **Version:** 6.x or higher
- **Node type:** cache.t3.micro (for dev)
- **Number of nodes:** 1 (for dev), 2+ for production with automatic failover
- **Port:** 6379 (default Redis)
- **Subnets:** Private subnets ONLY
- **Security group:** Only allow ECS tasks on port 6379
- **Encryption in-transit:** Recommended

**Cache Usage in Your App (app.js:65-96, 100-134):**

- Products cached for 300 seconds (5 minutes)
- Individual products cached for 600 seconds (10 minutes)
- Cache keys: `products:all`, `product:{id}`, `stats`
- Reconnection strategy implemented (app.js:30-38)

**Important:** ElastiCache endpoint must be passed as `REDIS_URL` environment variable to ECS tasks in format: `redis://<endpoint>:6379`

---

### **Phase 8: IAM & Permissions (Days 14-15)**

#### 8.1 IAM Roles and Policies

**Why You Need It:** Grant permissions to ECS tasks

**What to Learn:**

- IAM roles vs users vs policies
- Trust relationships (assume role)
- Managed policies vs inline policies
- Task execution role vs task role
- Principle of least privilege

**Key Resources:**

```hcl
# iam.tf
resource "aws_iam_role" (task_execution_role, task_role)
resource "aws_iam_role_policy_attachment"
resource "aws_iam_policy"
data "aws_iam_policy_document"
```

**Your IAM Requirements:**

**1. ECS Task Execution Role:**
Allows ECS to:

- Pull images from ECR
- Write logs to CloudWatch
- Retrieve secrets from Secrets Manager

```hcl
# Required policies:
- AmazonECSTaskExecutionRolePolicy (AWS managed)
- Custom policy for Secrets Manager access
```

**2. ECS Task Role:**
Allows your application to:

- Access AWS services (if needed)
- For this app: Minimal permissions (could be empty initially)

**Trust Relationship:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

---

### **Phase 9: Monitoring & Logging (Day 16)**

#### 9.1 CloudWatch Logs

**What to Learn:**

- Log groups and log streams
- Retention policies
- Log insights queries

**Key Resources:**

```hcl
resource "aws_cloudwatch_log_group" "/ecs/ecommerce-backend"
resource "aws_cloudwatch_log_group" "/ecs/ecommerce-frontend"
```

**Your Logging Needs:**

- Backend logs: console.log statements (app.js:37, 94, 162, etc.)
- Frontend Nginx access and error logs
- Retention: 7 days (dev), 30+ days (production)

---

### **Phase 10: Advanced Concepts (Days 17-18)**

#### 10.1 Variables and Outputs

**What to Learn:**

- Input variable types (string, number, list, map)
- Variable validation
- Sensitive variables
- Output values for sharing between modules

**Your variables.tf Structure:**

```hcl
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "ecommerce"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  type      = string
  sensitive = true
}
```

**Your outputs.tf Structure:**

```hcl
output "alb_dns_name" {
  description = "ALB DNS name for accessing the application"
  value       = aws_lb.main.dns_name
}

output "ecr_backend_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "rds_endpoint" {
  description = "RDS endpoint for database connection"
  value       = aws_db_instance.main.endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}
```

#### 10.2 Terraform State Management

**What to Learn:**

- Local vs remote state
- S3 backend with DynamoDB locking
- State locking
- Sensitive data in state

**Recommended Setup:**

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-terraform-state-bucket"
    key            = "ecommerce/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

#### 10.3 Data Sources

**What to Learn:**

- Querying existing resources
- AWS-managed resources (AMIs, availability zones)

**Example for Your Project:**

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
}
```

---

## 🔧 Step-by-Step Implementation Order

### Week 1: Foundations

**Day 1-2:** Terraform basics + provider setup
**Day 3-4:** VPC and networking
**Day 5:** Security groups

### Week 2: Core Services

**Day 6-7:** ECR repositories
**Day 8-9:** ECS cluster, task definitions, services
**Day 10:** Application Load Balancer

### Week 3: Data Layer & Polish

**Day 11-12:** RDS PostgreSQL + initialization
**Day 13:** ElastiCache Redis
**Day 14-15:** IAM roles and policies
**Day 16:** CloudWatch logs
**Day 17-18:** Variables, outputs, testing, troubleshooting

---

## 📚 Critical Learning Resources

### Official Documentation

1. **Terraform:** https://developer.hashicorp.com/terraform/docs
2. **Terraform AWS Provider:** https://registry.terraform.io/providers/hashicorp/aws/latest/docs
3. **AWS ECS:** https://docs.aws.amazon.com/ecs/
4. **AWS VPC:** https://docs.aws.amazon.com/vpc/

### Hands-On Tutorials

1. **Terraform AWS Get Started:** https://developer.hashicorp.com/terraform/tutorials/aws-get-started
2. **ECS Workshop:** https://ecsworkshop.com/
3. **Terraform ECS Examples:** https://github.com/terraform-aws-modules/terraform-aws-ecs

### Video Courses

1. **Terraform on AWS (FreeCodeCamp):** https://www.youtube.com/watch?v=SLB_c_ayRMo
2. **AWS ECS Deep Dive:** Search YouTube for "AWS ECS tutorial"

---

## 🎯 Key Concepts Summary

### For Your Specific Application:

1. **Network Isolation:** Backend, RDS, and Redis in private subnets; only ALB in public
2. **Service Discovery:** ECS tasks find RDS and Redis via endpoint environment variables
3. **Security:** Security groups act as virtual firewalls controlling all traffic
4. **High Availability:** Multi-AZ deployment for ALB, ECS, RDS (optional), Redis (optional)
5. **Auto-scaling:** ECS services scale based on CPU/memory metrics
6. **Health Monitoring:** ALB health checks ensure only healthy tasks receive traffic
7. **Secrets Management:** Database password stored in Secrets Manager, not hardcoded
8. **Logging:** All container logs streamed to CloudWatch for debugging

---

## ✅ Pre-Implementation Checklist

Before writing Terraform code, ensure you understand:

- [ ] VPC CIDR blocks and subnet sizing
- [ ] Public vs private subnet routing
- [ ] Security group ingress/egress rules
- [ ] ECS task definition structure
- [ ] Environment variable passing in ECS
- [ ] ALB target groups and health checks
- [ ] RDS subnet groups and security
- [ ] ElastiCache cluster configuration
- [ ] IAM roles and trust relationships
- [ ] CloudWatch log group configuration

---

## 🚀 Quick Start Commands

Once you write your Terraform files:

```bash
# Initialize Terraform (downloads providers)
terraform init

# Validate syntax
terraform validate

# Format files
terraform fmt -recursive

# Plan (dry-run, see what will be created)
terraform plan

# Apply (create infrastructure)
terraform apply

# Show current state
terraform show

# List all resources
terraform state list

# Destroy everything
terraform destroy
```

---

## 💡 Tips for Success

1. **Start Small:** Don't try to build everything at once. Start with VPC, then add one service at a time.
2. **Use Variables:** Avoid hardcoding values. Use variables for reusability.
3. **Test Incrementally:** Run `terraform plan` after adding each resource.
4. **Check Dependencies:** Some resources depend on others (e.g., ECS service needs ALB target group).
5. **Read Error Messages:** Terraform errors usually point to the exact issue.
6. **Use Comments:** Document why you're doing something, not just what.
7. **Security First:** Never put secrets in Terraform files. Use Secrets Manager.
8. **Cost Awareness:** Use t3.micro/t3.small instances for dev to minimize costs.

---

## 🔗 Application-Specific Notes

### Backend Dependencies (from app.js analysis):

```javascript
// Your backend REQUIRES these to start:
✅ PostgreSQL accessible on port 5432
✅ Redis accessible on port 6379
✅ Environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, REDIS_URL
✅ Port 8000 exposed and accessible from ALB
✅ /health endpoint for health checks
```

### Frontend Dependencies (from App.js analysis):

```javascript
// Your frontend REQUIRES:
✅ Environment variable: REACT_APP_API_URL (ALB DNS name)
✅ Nginx serving on port 80
✅ Backend API accessible for REST calls
```

---

Good luck with your Terraform learning journey! Focus on understanding the "why" behind each resource, not just the "how." This will make troubleshooting much easier later.

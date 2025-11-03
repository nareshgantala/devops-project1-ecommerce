# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack e-commerce application designed for DevOps practice with CI/CD pipelines, containerization, and cloud deployment on AWS ECS.

**Tech Stack:**
- Frontend: React 18 with Nginx
- Backend: Node.js + Express
- Database: PostgreSQL
- Cache: Redis
- Infrastructure: AWS ECS, Terraform, Jenkins CI/CD

## Common Development Commands

### Local Development with Docker Compose

```bash
# Start all services (frontend, backend, postgres, redis)
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

**Service URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/health

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Run locally (requires PostgreSQL and Redis running)
npm start

# Test backend health
curl http://localhost:8000/health

# Test API endpoints
curl http://localhost:8000/api/products
curl http://localhost:8000/api/orders
curl http://localhost:8000/api/stats
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build
```

### Docker Operations

```bash
# Build backend image
docker build -t ecommerce-backend:latest ./backend

# Build frontend image
docker build -t ecommerce-frontend:latest ./frontend

# Scan images for vulnerabilities
trivy image ecommerce-backend:latest
trivy image ecommerce-frontend:latest
```

### Terraform Operations

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure
terraform destroy

# Format Terraform files
terraform fmt -recursive

# Validate configuration
terraform validate
```

### AWS Operations

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Push images to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/frontend:latest

# Update ECS service (force new deployment)
aws ecs update-service --cluster ecommerce-cluster --service backend-service --force-new-deployment
aws ecs update-service --cluster ecommerce-cluster --service frontend-service --force-new-deployment

# Wait for deployment to stabilize
aws ecs wait services-stable --cluster ecommerce-cluster --services backend-service frontend-service

# View ECS logs
aws logs tail /ecs/ecommerce-backend --follow
aws logs tail /ecs/ecommerce-frontend --follow
```

## Architecture Overview

### Application Architecture

**Backend (Node.js/Express):**
- RESTful API with CRUD operations for products and orders
- PostgreSQL connection pool for database operations
- Redis client for caching frequently accessed data (products, stats)
- Health check endpoint monitoring database and Redis connectivity
- Transaction support for order creation with inventory management
- Error handling middleware
- Security: helmet.js, CORS, input validation

**Frontend (React):**
- Component-based architecture: ProductList, OrderList, CreateOrder, Dashboard
- REST API integration with backend
- Built as SPA, served by Nginx in production
- Environment-based configuration for API URL

**Database Schema:**
- `products` table: id, name, description, price, category, stock, image_url, is_active, timestamps
- `orders` table: id, customer info, status, total_amount, timestamps
- `order_items` table: order_id, product_id, quantity, price

**Caching Strategy:**
- Products list cached for 60 seconds
- Individual products cached for 60 seconds
- Statistics cached for 30 seconds
- Cache invalidation on product updates/deletions and order creation

### Infrastructure Architecture (AWS)

**Network Layer:**
- VPC with public and private subnets across 2 availability zones
- Internet Gateway for public subnet access
- NAT Gateways for private subnet outbound traffic
- Route tables for subnet routing

**Compute Layer:**
- ECS Cluster with Fargate launch type
- Frontend service (Nginx container on port 80)
- Backend service (Node.js container on port 8000)
- Auto-scaling based on CPU/memory metrics

**Data Layer:**
- RDS PostgreSQL instance in private subnet
- ElastiCache Redis cluster in private subnet
- Automated backups enabled

**Load Balancing:**
- Application Load Balancer in public subnets
- Target groups for frontend and backend services
- Health checks configured for each service

**Security:**
- Security groups with least-privilege rules
- ALB: allows HTTP/HTTPS from internet
- ECS tasks: allow traffic only from ALB
- RDS: allows PostgreSQL (5432) only from ECS tasks
- Redis: allows Redis (6379) only from ECS tasks

**Container Registry:**
- ECR repositories for frontend and backend images
- Image scanning on push enabled

**IAM:**
- ECS task execution role (pull images, write logs)
- ECS task role (application permissions)

### CI/CD Pipeline (Jenkins)

**Pipeline Stages:**
1. Checkout - Pull code from Git
2. SonarQube Analysis - Code quality scan
3. Quality Gate - Enforce quality standards
4. Build Docker Images - Parallel builds for frontend/backend
5. Scan Images - Trivy vulnerability scanning
6. Push to ECR - Upload images with build number and latest tags
7. Deploy to ECS - Update services with new images
8. Verify Deployment - Wait for services to stabilize

**Security Scanning:**
- SonarQube for code quality and security issues
- Trivy for container vulnerability scanning (HIGH and CRITICAL severity)

## API Endpoints

### Health & Monitoring
- `GET /health` - Health check with database, Redis, uptime, version

### Products
- `GET /api/products` - List all products (cached)
- `GET /api/products/:id` - Get single product (cached)
- `POST /api/products` - Create product (invalidates cache)
- `PUT /api/products/:id` - Update product (invalidates cache)
- `DELETE /api/products/:id` - Soft delete product (invalidates cache)

### Orders
- `GET /api/orders` - List all orders with items
- `POST /api/orders` - Create order (validates stock, uses transactions, invalidates cache)
- `PATCH /api/orders/:id/status` - Update order status

### Statistics
- `GET /api/stats` - Dashboard stats (cached): total orders, products, revenue, pending orders

## Key Configuration

### Backend Environment Variables (.env)
```
PORT=8000
NODE_ENV=production
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=<secure-password>
REDIS_URL=redis://<elasticache-endpoint>:6379
AWS_REGION=us-east-1
```

### Frontend Environment Variables
```
REACT_APP_API_URL=http://<alb-dns-name>
```

**Note:** Use AWS Secrets Manager or Parameter Store for production secrets, not .env files.

## Important Implementation Details

### Backend Caching Logic
- Cache keys: `products:all`, `product:{id}`, `stats`
- TTL: 60s for products, 30s for stats
- Cache invalidation on mutations (create/update/delete)
- Graceful fallback to database if Redis unavailable

### Order Creation Flow
1. Begin database transaction
2. Validate all products exist and have sufficient stock
3. Calculate total amount
4. Create order record
5. Create order_items records
6. Update product stock quantities
7. Commit transaction (or rollback on error)
8. Invalidate stats cache

### Frontend Nginx Configuration
- SPA routing: all routes fall back to index.html
- Dockerfile uses multi-stage build (Node.js build stage + Nginx production stage)

### Dockerfile Best Practices Applied
- Backend: Node.js 18 Alpine, npm ci for production dependencies, health check included
- Frontend: Multi-stage build, optimized production bundle, Nginx Alpine

## Troubleshooting Common Issues

### Database Connection Failures
- Check PostgreSQL is running: `docker ps | grep postgres`
- Verify security group allows port 5432 from ECS tasks
- Test connection: `psql -h <rds-endpoint> -U postgres -d ecommerce`

### Redis Connection Issues
- Check Redis is running: `docker ps | grep redis`
- Verify security group allows port 6379 from ECS tasks
- Test connection: `redis-cli -h <elasticache-endpoint> ping`

### ECS Task Restarts
- Check CloudWatch logs: `aws logs tail /ecs/ecommerce-backend --follow`
- Verify environment variables are set correctly
- Check task definition has sufficient memory/CPU
- Verify health check configuration

### Frontend Can't Reach Backend
- Verify REACT_APP_API_URL is correct
- Check CORS configuration in backend
- Verify ALB target group health status
- Check backend service is running and healthy

## DevOps Tasks Checklist

The project requires completing these infrastructure tasks:

1. **Dockerfiles** - Create production-ready Dockerfiles for backend and frontend (with nginx.conf for frontend)
2. **Terraform** - Write complete IaC for VPC, ECS, RDS, ElastiCache, ALB, security groups, IAM roles
3. **Jenkins Pipeline** - Create Jenkinsfile with build, test, scan, and deploy stages
4. **SonarQube** - Setup code quality scanning with sonar-project.properties
5. **Trivy** - Integrate container vulnerability scanning into pipeline

Refer to README.md for detailed requirements and examples for each task.

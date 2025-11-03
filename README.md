# E-Commerce Platform - DevOps Practice Project

A full-stack e-commerce application designed for DevOps practice with CI/CD pipelines, containerization, and cloud deployment.

## 🏗️ Architecture

### **Technology Stack**

**Frontend:**

- React 18
- Modern responsive UI
- REST API integration

**Backend:**

- Node.js + Express
- PostgreSQL database
- Redis caching
- RESTful API architecture

**Infrastructure:**

- Docker & Docker Compose
- AWS ECS (Elastic Container Service)
- Terraform for IaC
- Jenkins for CI/CD

## 📁 Project Structure

```
devops-ecs-project/
├── backend/
│   ├── app.js                 # Main server file
│   ├── package.json           # Dependencies
│   ├── init.sql               # Database schema
│   ├── .env.example           # Environment variables
│   └── Dockerfile             # Backend container (you'll create)
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js             # Main app component
│   │   ├── App.css            # Styles
│   │   ├── index.js           # Entry point
│   │   └── components/
│   │       ├── ProductList.js
│   │       ├── OrderList.js
│   │       ├── CreateOrder.js
│   │       └── Dashboard.js
│   ├── package.json
│   └── Dockerfile             # Frontend container (you'll create)
├── terraform/                 # IaC files (you'll create)
├── jenkins/
│   └── Jenkinsfile           # CI/CD pipeline (you'll create)
├── docker-compose.yml        # Local development
└── README.md
```

## 🚀 Quick Start - Local Development

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone and Setup

```bash
# Create project directory
mkdir devops-ecs-project
cd devops-ecs-project

# Create frontend and backend directories
mkdir frontend backend
```

### 2. Backend Setup

```bash
cd backend

# Copy the backend files provided into this directory
# - app.js
# - package.json
# - init.sql
# - .env.example

# Create .env file
cp .env.example .env

# Install dependencies
npm install

# Run locally (requires PostgreSQL and Redis)
npm start
```

### 3. Frontend Setup

```bash
cd ../frontend

# Copy all frontend files into this directory
# - package.json
# - public/index.html
# - src/ (all files)

# Install dependencies
npm install

# Run locally
npm start
```

### 4. Docker Compose (Recommended for Local Testing)

```bash
# From project root
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Backend Health: http://localhost:8000/health
```

## 📝 API Endpoints

### Health Check

- `GET /health` - Application health status
  - Response: `{ status, timestamp, database, redis, uptime, version }`

### Products

- `GET /api/products` - Get all products (with caching)
  - Response: `{ source: 'cache'|'database', data: [...] }`
- `GET /api/products/:id` - Get single product
  - Response: `{ source: 'cache'|'database', data: {...} }`
- `POST /api/products` - Create new product
  - Body: `{ name, description, price, category, stock, image_url }`
  - Response: `{ message, data: {...} }`
- `PUT /api/products/:id` - Update product
  - Body: `{ name?, description?, price?, category?, stock?, image_url? }`
  - Response: `{ message, data: {...} }`
- `DELETE /api/products/:id` - Delete product (soft delete)
  - Response: `{ message }`

### Orders

- `GET /api/orders` - Get all orders with items
  - Response: `{ data: [...] }`
- `POST /api/orders` - Create new order
  - Body: `{ customer_name, customer_email, items: [{ product_id, quantity }] }`
  - Response: `{ message, data: {...} }`
  - Note: Uses transactions, validates stock, updates inventory
- `PATCH /api/orders/:id/status` - Update order status
  - Body: `{ status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled' }`
  - Response: `{ message, data: {...} }`

### Statistics

- `GET /api/stats` - Get dashboard statistics
  - Response: `{ data: { total_orders, total_products, total_revenue, pending_orders } }`

### Example API Calls

```bash
# Health Check
curl http://localhost:8000/health

# Get all products
curl http://localhost:8000/api/products

# Get single product
curl http://localhost:8000/api/products/1

# Create new product
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "price": 99.99,
    "category": "Electronics",
    "stock": 50,
    "image_url": "https://example.com/image.jpg"
  }'

# Create order
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 3, "quantity": 1}
    ]
  }'

# Update order status
curl -X PATCH http://localhost:8000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'

# Get statistics
curl http://localhost:8000/api/stats
```

## 🛠️ Your DevOps Tasks

### Task 1: Create Dockerfiles

#### Backend Dockerfile (`backend/Dockerfile`)

Requirements:

- Use Node.js 18 slim/alpine base image
- Multi-stage build (optional but recommended)
- Install dependencies efficiently
- Copy application code
- Expose port 8000
- Add health check
- Run with `npm start`

Example structure:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["npm", "start"]
```

#### Frontend Dockerfile (`frontend/Dockerfile`)

Requirements:

- Use multi-stage build
- Build stage: Node.js 18
- Production stage: Nginx alpine
- Build React application
- Copy build to Nginx
- Configure Nginx for React Router (SPA)
- Expose port 80

Example structure:

```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri /index.html;
    }
}
```

### Task 2: Create Terraform Configuration

Create these files in `terraform/` directory:

#### 1. `provider.tf`

```hcl
terraform {
  required_version = ">= 1.0"
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
```

#### 2. `variables.tf`

Define input variables:

- aws_region
- project_name
- environment
- vpc_cidr
- availability_zones
- db_username
- db_password (sensitive)

#### 3. `vpc.tf`

Create:

- VPC with CIDR block
- Public subnets (2 AZs)
- Private subnets (2 AZs)
- Internet Gateway
- NAT Gateways
- Route tables

#### 4. `ecr.tf`

Create ECR repositories:

- frontend-repo
- backend-repo

#### 5. `ecs.tf`

Create:

- ECS Cluster
- Task definitions (frontend, backend)
- ECS Services
- Auto-scaling policies

#### 6. `alb.tf`

Create:

- Application Load Balancer
- Target groups (frontend, backend)
- Listeners (HTTP/HTTPS)
- Health checks

#### 7. `rds.tf`

Create:

- RDS PostgreSQL instance
- Subnet group
- Parameter group

#### 8. `elasticache.tf`

Create:

- ElastiCache Redis cluster
- Subnet group

#### 9. `security-groups.tf`

Create security groups for:

- ALB (allow 80, 443)
- ECS tasks (allow ALB traffic)
- RDS (allow ECS traffic on 5432)
- Redis (allow ECS traffic on 6379)

#### 10. `iam.tf`

Create:

- ECS task execution role
- ECS task role
- Policies for ECR, CloudWatch, Secrets Manager

#### 11. `outputs.tf`

Output:

- ALB DNS name
- ECR repository URLs
- RDS endpoint
- Redis endpoint

### Task 3: Create Jenkins Pipeline

Create `jenkins/Jenkinsfile` with these stages:

```groovy
pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = 'YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com'
        FRONTEND_REPO = "${ECR_REGISTRY}/frontend"
        BACKEND_REPO = "${ECR_REGISTRY}/backend"
        ECS_CLUSTER = 'ecommerce-cluster'
        ECS_SERVICE_FRONTEND = 'frontend-service'
        ECS_SERVICE_BACKEND = 'backend-service'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        sh "docker build -t ${FRONTEND_REPO}:${BUILD_NUMBER} ./frontend"
                    }
                }
                stage('Build Backend') {
                    steps {
                        sh "docker build -t ${BACKEND_REPO}:${BUILD_NUMBER} ./backend"
                    }
                }
            }
        }

        stage('Scan Images') {
            parallel {
                stage('Scan Frontend') {
                    steps {
                        sh "trivy image --severity HIGH,CRITICAL ${FRONTEND_REPO}:${BUILD_NUMBER}"
                    }
                }
                stage('Scan Backend') {
                    steps {
                        sh "trivy image --severity HIGH,CRITICAL ${BACKEND_REPO}:${BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Push to ECR') {
            steps {
                sh """
                    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    docker push ${FRONTEND_REPO}:${BUILD_NUMBER}
                    docker tag ${FRONTEND_REPO}:${BUILD_NUMBER} ${FRONTEND_REPO}:latest
                    docker push ${FRONTEND_REPO}:latest
                    docker push ${BACKEND_REPO}:${BUILD_NUMBER}
                    docker tag ${BACKEND_REPO}:${BUILD_NUMBER} ${BACKEND_REPO}:latest
                    docker push ${BACKEND_REPO}:latest
                """
            }
        }

        stage('Deploy to ECS') {
            steps {
                sh """
                    aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE_FRONTEND} --force-new-deployment --region ${AWS_REGION}
                    aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE_BACKEND} --force-new-deployment --region ${AWS_REGION}
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh "aws ecs wait services-stable --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE_FRONTEND} ${ECS_SERVICE_BACKEND} --region ${AWS_REGION}"
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
```

### Task 4: Setup SonarQube

```bash
# Run SonarQube locally
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Access: http://localhost:9000
# Default credentials: admin/admin
```

Create `sonar-project.properties`:

```properties
sonar.projectKey=ecommerce-app
sonar.projectName=E-Commerce Platform
sonar.projectVersion=1.0
sonar.sources=.
sonar.exclusions=**/node_modules/**,**/build/**,**/dist/**
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### Task 5: Image Scanning with Trivy

```bash
# Install Trivy (Ubuntu/Debian)
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy

# Scan images
trivy image your-backend-image:latest
trivy image your-frontend-image:latest

# Generate HTML report
trivy image --format template --template "@contrib/html.tpl" -o report.html your-image:latest

# Fail pipeline on HIGH/CRITICAL
trivy image --severity HIGH,CRITICAL --exit-code 1 your-image:latest
```

## 🔧 Environment Variables

### Backend (.env)

```bash
PORT=8000
NODE_ENV=production

# Database
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your-secure-password

# Redis
REDIS_URL=redis://your-elasticache-endpoint:6379

# AWS (optional, use IAM roles in production)
AWS_REGION=us-east-1
```

### Frontend Environment

```bash
REACT_APP_API_URL=http://your-alb-dns-name
```

For production, use AWS Secrets Manager or Parameter Store instead of .env files.

## 🧪 Testing

### Manual Testing

```bash
# Test backend health
curl http://localhost:8000/health

# Test database connection
curl http://localhost:8000/api/products

# Test Redis caching (run twice, second should be from cache)
curl http://localhost:8000/api/products
curl http://localhost:8000/api/products

# Create test order
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "items": [{"product_id": 1, "quantity": 2}]
  }'
```

### Load Testing (Optional)

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Simple load test
ab -n 1000 -c 10 http://localhost:8000/api/products
```

## 📊 Monitoring & Logging

### CloudWatch Logs

- ECS task logs: `/ecs/ecommerce-backend` and `/ecs/ecommerce-frontend`
- Application logs are automatically streamed

### Key Metrics to Monitor

- **API Performance:**
  - Response time
  - Error rate (5xx errors)
  - Request count
- **Database:**
  - Connection count
  - Query performance
  - Deadlocks
- **Cache:**
  - Hit rate
  - Memory usage
  - Evictions
- **ECS:**
  - CPU utilization
  - Memory utilization
  - Task count

### Setting up CloudWatch Alarms

Create alarms for:

- High CPU usage (>80%)
- High memory usage (>80%)
- High error rate (>5%)
- Low cache hit rate (<70%)

## 🔐 Security Best Practices

### 1. Secrets Management

- ✅ Use AWS Secrets Manager for sensitive data
- ✅ Never commit .env files to Git
- ✅ Use IAM roles instead of access keys
- ✅ Rotate credentials regularly

### 2. Network Security

- ✅ Use private subnets for ECS tasks
- ✅ Restrict security group rules (least privilege)
- ✅ Enable VPC flow logs
- ✅ Use NAT Gateway for outbound traffic

### 3. Container Security

- ✅ Scan images with Trivy before deployment
- ✅ Use minimal base images (alpine)
- ✅ Run containers as non-root user
- ✅ Keep dependencies updated

### 4. Application Security

- ✅ Use prepared statements (SQL injection prevention)
- ✅ Implement rate limiting
- ✅ Enable CORS properly
- ✅ Use helmet.js for security headers
- ✅ Validate all inputs

### 5. Code Quality

- ✅ Run SonarQube scans
- ✅ Enforce quality gates
- ✅ Write unit tests
- ✅ Code reviews via pull requests

## 🎯 DevOps Best Practices Demonstrated

This project demonstrates:

✅ **Infrastructure as Code** - Terraform for reproducible infrastructure
✅ **Containerization** - Docker for consistent environments
✅ **CI/CD Pipeline** - Automated testing and deployment
✅ **Code Quality** - SonarQube integration
✅ **Security Scanning** - Trivy for vulnerability detection
✅ **Container Orchestration** - AWS ECS for production workloads
✅ **Caching Strategy** - Redis for performance optimization
✅ **Database Management** - PostgreSQL with proper schema design
✅ **Load Balancing** - ALB for high availability
✅ **Health Checks** - Application and infrastructure monitoring
✅ **Logging** - Centralized logs in CloudWatch
✅ **Secret Management** - Secure credential handling
✅ **Multi-stage Builds** - Optimized Docker images
✅ **Auto Scaling** - Based on CPU/memory metrics

## 🆘 Troubleshooting

### Issue: Database connection fails

**Symptoms:**

- Backend health check shows database: 'disconnected'
- Errors about ECONNREFUSED

**Solutions:**

1. Check PostgreSQL is running: `docker ps | grep postgres`
2. Verify credentials in .env file
3. Check security group rules (port 5432)
4. Verify network connectivity between ECS and RDS
5. Check RDS endpoint is correct

```bash
# Test database connection
psql -h your-rds-endpoint -U postgres -d ecommerce
```

### Issue: Redis connection timeout

**Symptoms:**

- Slow API responses
- Health check shows redis: 'disconnected'

**Solutions:**

1. Verify Redis is running: `docker ps | grep redis`
2. Check REDIS_URL format: `redis://host:6379`
3. Verify security group allows port 6379
4. Check ElastiCache cluster status

```bash
# Test Redis connection
redis-cli -h your-elasticache-endpoint ping
```

### Issue: Frontend can't reach backend

**Symptoms:**

- Network errors in browser console
- CORS errors

**Solutions:**

1. Verify REACT_APP_API_URL is correct
2. Check CORS configuration in backend (cors middleware)
3. Verify ALB security group allows traffic
4. Check ALB target group health
5. Verify backend service is running

```bash
# Test backend from frontend container
docker exec -it ecommerce-frontend sh
wget -O- http://backend:8000/health
```

### Issue: ECS task keeps restarting

**Symptoms:**

- Tasks start then immediately stop
- Service never reaches steady state

**Solutions:**

1. Check CloudWatch logs for errors
2. Verify task role has required permissions
3. Check health check configuration (too strict?)
4. Verify container has enough memory/CPU
5. Check if environment variables are set correctly

```bash
# View ECS task logs
aws logs tail /ecs/ecommerce-backend --follow

# Check task stopped reason
aws ecs describe-tasks --cluster ecommerce-cluster --tasks TASK_ID
```

### Issue: Docker build fails

**Symptoms:**

- Build errors during docker build
- Dependency installation fails

**Solutions:**

1. Check Dockerfile syntax
2. Verify base image is accessible
3. Check network connectivity during build
4. Clear Docker cache: `docker builder prune`
5. Check disk space: `df -h`

### Issue: Terraform apply fails

**Symptoms:**

- Resource creation errors
- Permission denied errors

**Solutions:**

1. Verify AWS credentials: `aws sts get-caller-identity`
2. Check IAM permissions
3. Verify resource names are unique
4. Check quotas/limits: `aws service-quotas list-service-quotas`
5. Review terraform plan before applying

### Issue: Jenkins pipeline fails

**Symptoms:**

- Pipeline stops at specific stage
- Build artifacts not created

**Solutions:**

1. Check Jenkins console output
2. Verify credentials are configured
3. Check plugin installations
4. Verify Docker is available in Jenkins
5. Check AWS CLI is installed

### Issue: High response times

**Symptoms:**

- API responses > 1 second
- Slow page loads

**Solutions:**

1. Check database query performance
2. Verify Redis cache is working
3. Check ECS CPU/memory utilization
4. Review slow query logs
5. Add database indexes if needed
6. Increase ECS task count (auto-scaling)

## 📚 Additional Resources

### AWS Documentation

- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [ElastiCache Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/)
- [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)

### Tools & Technologies

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)

### Learning Paths

- [AWS ECS Workshop](https://ecsworkshop.com/)
- [Terraform Tutorials](https://learn.hashicorp.com/terraform)
- [Jenkins Tutorials](https://www.jenkins.io/doc/tutorials/)

## 🤝 Contributing

This is a learning project. Feel free to:

- Enhance features (add authentication, payments, etc.)
- Improve DevOps pipeline (add more stages, better error handling)
- Add more tests (unit, integration, e2e)
- Improve documentation
- Add monitoring dashboards

## 📄 License

MIT License - Free to use for learning and educational purposes.

## 🎓 What You'll Learn

By completing this project, you will gain hands-on experience with:

1. **Containerization** - Building efficient Docker images
2. **Infrastructure as Code** - Managing cloud resources with Terraform
3. **CI/CD** - Automating build, test, and deployment processes
4. **Security** - Implementing security scanning and best practices
5. **Monitoring** - Setting up logging and metrics
6. **Cloud Services** - Working with AWS ECS, RDS, ElastiCache, ALB
7. **Networking** - Configuring VPCs, subnets, security groups
8. **Database Management** - Working with PostgreSQL in the cloud
9. **Caching Strategies** - Implementing Redis for performance
10. **Problem Solving** - Debugging and troubleshooting production issues

---

## 🚀 Ready to Start?

1. ✅ Copy all code files to your project structure
2. ✅ Test locally with `docker-compose up`
3. ✅ Create your Dockerfiles
4. ✅ Write Terraform configuration
5. ✅ Build Jenkins pipeline
6. ✅ Deploy to AWS!

Good luck with your DevOps journey! 🎉

For questions or issues, refer to the Troubleshooting section above.

---

**Project Version:** 1.0.0  
**Last Updated:** 2025  
**Maintained by:** DevOps Learning Team

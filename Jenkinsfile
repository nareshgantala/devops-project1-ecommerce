pipeline {
    agent any
    
    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        FRONTEND_REPO = "${ECR_REGISTRY}/ecommerce-frontend"
        BACKEND_REPO = "${ECR_REGISTRY}/ecommerce-backend"
        ECS_CLUSTER = 'ecommerce-cluster'
        ECS_SERVICE_FRONTEND = 'ecommerce-frontend-service'
        ECS_SERVICE_BACKEND = 'ecommerce-backend-service'
        BUILD_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('1. Checkout') {
            steps {
                echo '========== STAGE 1: Checking out code =========='
                checkout scm
            }
        }
        
        // stage('2. SonarQube Scan') {
        //     steps {
        //         echo '========== STAGE 2: Running code quality scan =========='
        //         script {
        //             def scannerHome = tool 'SonarQubeScanner'
        //             withSonarQubeEnv('SonarQube') {
        //                 sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=ecommerce-app -Dsonar.sources=."
        //             }
        //         }
        //     }
        // }
        
        // stage('3. Quality Gate') {
        //     steps {
        //         echo '========== STAGE 3: Checking quality gate =========='
        //         timeout(time: 5, unit: 'MINUTES') {
        //             waitForQualityGate abortPipeline: true
        //         }
        //     }
        // }
        
        stage('4. Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        echo '========== Building Backend Image =========='
                        dir('backend') {
                            sh "docker build -t ${BACKEND_REPO}:${BUILD_TAG} -t ${BACKEND_REPO}:latest ."
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        echo '========== Building Frontend Image =========='
                        dir('frontend') {
                            sh "docker build -t ${FRONTEND_REPO}:${BUILD_TAG} -t ${FRONTEND_REPO}:latest ."
                        }
                    }
                }
            }
        }
        
        // stage('5. Security Scan') {
        //     parallel {
        //         stage('Scan Backend') {
        //             steps {
        //                 echo '========== Scanning Backend Image =========='
        //                 sh "trivy image --severity HIGH,CRITICAL ${BACKEND_REPO}:${BUILD_TAG}"
        //             }
        //         }
        //         stage('Scan Frontend') {
        //             steps {
        //                 echo '========== Scanning Frontend Image =========='
        //                 sh "trivy image --severity HIGH,CRITICAL ${FRONTEND_REPO}:${BUILD_TAG}"
        //             }
        //         }
        //     }
        // }
        
        stage('6. Push to ECR') {
            steps {
                echo '========== STAGE 6: Pushing to ECR =========='
                script {
                    withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                        sh """
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                            docker push ${BACKEND_REPO}:${BUILD_TAG}
                            docker push ${BACKEND_REPO}:latest
                            docker push ${FRONTEND_REPO}:${BUILD_TAG}
                            docker push ${FRONTEND_REPO}:latest
                        """
                    }
                }
            }
        }
        
        stage('7. Deploy to ECS') {
            steps {
                echo '========== STAGE 7: Deploying to ECS =========='
                script {
                    withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                        sh """
                            aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE_BACKEND} --force-new-deployment
                            aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE_FRONTEND} --force-new-deployment
                        """
                    }
                }
            }
        }
        
        stage('8. Wait for Stability') {
            steps {
                echo '========== STAGE 8: Waiting for deployment =========='
                script {
                    withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                        sh "aws ecs wait services-stable --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE_BACKEND} ${ECS_SERVICE_FRONTEND}"
                    }
                }
            }
        }
        
        stage('9. Health Check') {
            steps {
                echo '========== STAGE 9: Checking application health =========='
                script {
                    withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                        sh """
                            ALB_DNS=\$(aws elbv2 describe-load-balancers --names ecommerce-alb --query 'LoadBalancers[0].DNSName' --output text)
                            echo "Application URL: http://\$ALB_DNS"
                            sleep 30
                            curl -f http://\$ALB_DNS/health || echo "Health check warning"
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ DEPLOYMENT SUCCESSFUL!'
        }
        failure {
            echo '❌ DEPLOYMENT FAILED!'
        }
    }
}
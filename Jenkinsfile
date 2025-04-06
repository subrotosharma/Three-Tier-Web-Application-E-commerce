pipeline {
    agent any
    tools {
        jdk 'jdk17'
        nodejs 'node16'
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
    }
    stages {

        stage('Checkout from Git') {
            steps {
                git branch: 'main', url: 'https://github.com/subrotosharma/Three-Tier-Web-Application-E-commerce.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    dir('backend') {
                        sh 'npm install'
                    }
                    dir('frontend') {
                        sh 'npm install'
                    }
                }
            }
        }

        stage('Prepare Env Files') {
            steps {
                script {
                    sh '''
                        [ ! -f frontend/.env.sample ] || cp frontend/.env.sample frontend/.env.local
                    '''
                }
            }
        }

        stage("Sonarqube Analysis") {
            steps {
                withSonarQubeEnv('sonar-server') {
                    sh '''$SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectName=docker-compose \
                        -Dsonar.projectKey=docker-compose'''
                }
            }
        }

        stage("Quality Gate") {
            steps {
                script {
                    waitForQualityGate abortPipeline: false, credentialsId: 'sonar-token'
                }
            }
        }

        stage('OWASP FS SCAN') {
            steps {
                dependencyCheck additionalArguments: '--scan ./ --disableYarnAudit --disableNodeAudit', odcInstallation: 'DP-Check'
                dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
            }
        }

        stage('TRIVY FS SCAN') {
            steps {
                sh 'trivy fs . > trivyfs.json'
            }
        }

        stage('Docker-compose Build') {
            steps {
                script {
                    timeout(time: 2, unit: 'MINUTES') {
                        sh '''
                            echo "Cleaning up containers if they exist..."
                            docker-compose down
                            docker rm -f mongo || true
                            docker rm -f frontend || true
                            docker rm -f backend || true

                            echo "Building and starting containers..."
                            docker-compose up -d --build --remove-orphans --force-recreate
                        '''
                    }
                }
            }
        }

        stage('Docker-compose Push') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred', toolName: 'docker') {
                        sh '''
                            echo "Tagging and pushing images to Docker Hub..."
                            docker tag devpipeline-backend subrotosharma/devpipeline-backend:latest
                            docker tag devpipeline-frontend subrotosharma/devpipeline-frontend:latest

                            docker push subrotosharma/devpipeline-backend:latest
                            docker push subrotosharma/devpipeline-frontend:latest
                        '''
                    }
                }
            }
        }

        stage('TRIVY Image Scan') {
            steps {
                sh '''
                    trivy image subrotosharma/devpipeline-backend > trivy_backend.json
                    trivy image subrotosharma/devpipeline-frontend > trivy_frontend.json
                '''
            }
        }
    }
}

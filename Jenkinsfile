pipeline {
    agent any

   environment {
    PATH = "/usr/local/bin:/opt/homebrew/bin:${env.PATH}"
    IMAGE = "lavanyapc/bluegreen-node-app"
}

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                sh 'npm install'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE:$BUILD_NUMBER .'
                sh 'docker tag $IMAGE:$BUILD_NUMBER $IMAGE:latest'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push $IMAGE:$BUILD_NUMBER
                        docker push $IMAGE:latest
                    '''
                }
            }
        }

        stage('Detect Live / Idle') {
            steps {
                script {
                    def active = sh(
                        script: "docker exec nginx-proxy cat /etc/nginx/active.inc | grep -o 'app-[a-z]*' | cut -d- -f2",
                        returnStdout: true
                    ).trim()

                    env.ACTIVE = active
                    env.IDLE = active == 'blue' ? 'green' : 'blue'
                    env.IDLE_PORT = env.IDLE == 'blue' ? '3001' : '3002'

                    echo "Live environment: ${env.ACTIVE}"
                    echo "Idle environment: ${env.IDLE}"
                }
            }
        }

        stage('Deploy to Idle') {
            steps {
                sh '''
                    docker rm -f app-$IDLE 2>/dev/null || true

                    docker run -d \
                      --name app-$IDLE \
                      --network bluegreen-net \
                      -p $IDLE_PORT:3000 \
                      -e APP_COLOR=$IDLE \
                      -e APP_VERSION=$BUILD_NUMBER \
                      $IMAGE:$BUILD_NUMBER
                '''
            }
        }

        stage('Health Check Idle') {
            steps {
                sh '''
                    for i in {1..15}; do
                        if curl -fs http://localhost:$IDLE_PORT/health; then
                            echo "Idle environment is healthy."
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "Health check failed."
                    exit 1
                '''
            }
        }

        stage('Approve Switch') {
            steps {
                input message: "Switch traffic from $ACTIVE to $IDLE?", ok: 'Switch Traffic'
            }
        }

        stage('Switch Traffic') {
            steps {
                sh '''
                    docker exec nginx-proxy sh -c "echo 'server app-$IDLE:3000;' > /etc/nginx/active.inc"
                    docker exec nginx-proxy nginx -t
                    docker exec nginx-proxy nginx -s reload

                    echo "Traffic switched to $IDLE"
                '''
            }
        }
    }
}
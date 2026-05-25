pipeline {
    agent any
    tools {
        nodejs 'node20'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }
        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }
        stage('Deploy Backend') {
            steps {
                sh 'curl -X POST https://api.render.com/deploy/srv-xxxxxxxxxxxx' 
            }
        }
    }
    post {
        failure {
            echo 'Build failed — check the logs above.'
        }
    }
}
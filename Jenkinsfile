pipeline {
  agent {
    label 'docker'
  }
  options {
    disableConcurrentBuilds()
    timeout(time: 60, unit: 'MINUTES')
  }
  stages {
    stage ('build') {
        environment {
        RAILS_ENV="test"
        TEST_FILE='test/results.xml'
        }
      steps {
        script {
          sh 'echo "js-sdk-sc"'       
        }
      }     
    }
  }
}


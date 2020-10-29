pipeline {
  agent {
    label 'docker'
  }
  options {
    disableConcurrentBuilds()
    timeout(time: 60, unit: 'MINUTES')
  }
  tools {
    nodejs '14'
  }
  stages {
    stage ('build') {
        environment {
        RAILS_ENV="test"
        TEST_FILE='test/results.xml' 
        }
      steps {        

        script {          

         docker.image('nikolaik/python-nodejs').inside ("--user=root") {
             sh """
              npm install;                        
              git submodule init;
              git submodule update; 
              sudo pip3 install -y yq;                            
            """

             sh """
              cd packages/cli/
              ./test.sh;
           """ 
          }           
          
        }     
      }     
    }
  }
}


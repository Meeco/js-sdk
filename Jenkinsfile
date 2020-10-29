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
    stage ('build and test e2e') {
        environment {
        RAILS_ENV="test"
        TEST_FILE='test/results.xml' 
        }
      steps {        

        script {          

         docker.image('nikolaik/python-nodejs').inside ("--user=root") {
             sh """
              npm install;
              npm run bootstrap;                        
              git submodule init;
              git submodule update;
              apt-get update;
              apt-get install -y jq; 
              pip3 install yq;              
              cd packages/cli/;
              cat example.environment.yaml | yq -y '(.vault.url) = "https://vault-stage.meeco.me/"'|  yq -y '(.keystore.url) = "https://keystore-stage.meeco.me/"' > .environment.yaml;      
              ./test.sh;
            """
          }           
          
        }     
      }     
    }
  }
}


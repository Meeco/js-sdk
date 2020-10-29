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
         sh """
              npm install;                        
              git submodule init;
              git submodule update;                            
            """      

         sh """
            sudo add-apt-repository ppa:deadsnakes/ppa;
            sudo apt update;
            sudo apt install -y python3.8; 
            sudo apt install -y python3-pip;   
            sudo pip3 install -y yq;          
         """
         
        withPythonEnv('python3'){
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


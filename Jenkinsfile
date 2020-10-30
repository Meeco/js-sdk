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

      steps {
        script {          

        echo "The STAGE_VAULT_URL is ${env.STAGE_VAULT_URL}"
        echo "The STAGE_VAULT_SUBSCRIPTION_KEY is ${env.STAGE_VAULT_SUBSCRIPTION_KEY}"
        echo "The STAGE_KEYSTORE_URL is ${env.STAGE_KEYSTORE_URL}"
        echo "The STAGE_KEYSTORE_SUBSCRIPTION_KEY is ${env.STAGE_KEYSTORE_SUBSCRIPTION_KEY}"

        echo "Output environment file"
        cat example.environment.yaml | yq -y '(.vault.url) = "${env.STAGE_VAULT_URL}"' | yq -y '(.vault.subscription_key) = "${env.STAGE_VAULT_SUBSCRIPTION_KEY}"' |  yq -y '(.keystore.url) = "${env.STAGE_KEYSTORE_URL}"' | yq -y '(.keystore.subscription_key) = "${env.STAGE_KEYSTORE_SUBSCRIPTION_KEY}"'

        //  docker.image('nikolaik/python-nodejs').inside ("--user=root") {
        //      sh """
        //       npm install;
        //       npm run bootstrap;                        
        //       git submodule init;
        //       git submodule update;
        //       apt-get update;
        //       apt-get install -y jq; 
        //       pip3 install yq;              
        //       cd packages/cli/;
        //       cat example.environment.yaml | yq -y '(.vault.url) = "${env.STAGE_VAULT_URL}"' | yq -y '(.vault.subscription_key) = "${env.STAGE_VAULT_SUBSCRIPTION_KEY}"' |  yq -y '(.keystore.url) = "${env.STAGE_KEYSTORE_URL}"' | yq -y '(.keystore.subscription_key) = "${env.STAGE_KEYSTORE_SUBSCRIPTION_KEY}"' | > .environment.yaml;      
        //       ./test.sh;
        //     """
        //   }           
          
        }     
      }     
    }
  }
}


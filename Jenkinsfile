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

        echo "running test for following env"
        echo "The STAGE_VAULT_URL is ${env.STAGE_VAULT_URL}"
        echo "The STAGE_KEYSTORE_URL is ${env.STAGE_KEYSTORE_URL}"

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
              cat example.environment.yaml | yq -y '(.vault.url) = "https://vault-dev.meeco.me"' |  yq -y '(.keystore.url) = "https://keystore-dev.meeco.me"' > .environment.yaml;
              ./test.sh;
            """
         }
        }
      }
    }
  }
}

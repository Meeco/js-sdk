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

          if (env.CHANGE_TARGET == 'master') {
            env.VAULT_URL = env.SANDBOX_VAULT_URL
            env.KEYSTORE_URL = env.SANDBOX_KEYSTORE_URL
          } else if (env.CHANGE_TARGET == 'stage') {
            env.VAULT_URL = env.STAGE_VAULT_URL
            env.KEYSTORE_URL = env.STAGE_KEYSTORE_URL
          } else {
            // assumes target is develop by default
            env.VAULT_URL = env.DEV_VAULT_URL
            env.KEYSTORE_URL = env.DEV_KEYSTORE_URL
          }

          echo "The VAULT_URL is ${env.VAULT_URL}"
          echo "The KEYSTORE_URL is ${env.KEYSTORE_URL}"
          echo "The SUBSCRIPTION_KEY is ${env.SANDBOX_VAULT_SUBSCRIPTION_KEY}"

          image = docker.image('nikolaik/python-nodejs:python3.10-nodejs16')
          
          image.inside("-v $WORKSPACE") {
            sh """
              npm install;
              npm run bootstrap;
              npm run build -- --ignore @meeco/cli
              npx lerna run prepack --scope @meeco/cli
            """
          }

          image.inside("-v $WORKSPACE --user=root") {
            sh """
              apt-key adv --refresh-keys --keyserver keyserver.ubuntu.com;
              apt-get update;
              apt-get install -y jq;
              pip3 install yq;
              git submodule init;
              git submodule update;
              cd packages/cli/;
              yq -y '(.vault.url) = "${env.VAULT_URL}" | (.keystore.url) = "${env.KEYSTORE_URL}" | (.vault,.keystore).subscription_key = "${env.SANDBOX_VAULT_SUBSCRIPTION_KEY}"' example.environment.yaml > .environment.yaml;
              cat .environment.yaml;
              ./test.sh;
            """
          }
        }
      }
    }
  }
}

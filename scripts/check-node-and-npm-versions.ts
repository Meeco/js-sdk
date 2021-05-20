const semverSatisfies = require('semver/functions/satisfies');
const packagejson = require('../package.json');

const requiredNodeVersion = packagejson['engines']['node'].trim();

const { exec } = require('child_process');

exec('node -v', (error, stdout: string, stderr) => {
  if (error) {
    console.error(`ERROR error: ${error.message}`);
    process.exit(1);
  }
  if (stderr) {
    console.error(`ERROR stderr: ${stderr}`);
    process.exit(1);
  }
  // if (!stdout.match('v' + requiredNodeVersion)) {
  const currentVersion = stdout.replace('v', '').trim();
  if (!semverSatisfies(currentVersion, requiredNodeVersion)) {
    console.error(
      `ERROR node version must be '${requiredNodeVersion}' but got '${currentVersion}'`
    );
    console.error('TO fix this if you are using nvm run:');
    console.error('nvm use');
    console.error('at the root of this repository');
    console.error('if you want to upgrade the version of node used for every package in this repo');
    console.error(
      'change both the package.json>engines>node and the .nvmrc file to the updated version'
    );
    process.exit(1);
  }
});

const semverSatisfies = require('semver/functions/satisfies');
const packagejson = require('../package.json');

const requiredNodeVersion = packagejson['engines']['node'].trim();

const { exec } = require('child_process');

const currentVersion = process.version.replace('v', '').trim();

console.log(`the current version of node that is running is ${currentVersion}`);
if (!semverSatisfies(currentVersion, requiredNodeVersion)) {
  console.error(`ERROR node version must be '${requiredNodeVersion}' but got '${currentVersion}'`);
  console.error('TO fix this if you are using nvm run:');
  console.error('nvm use');
  console.error('at the root of this repository');
  console.error('if you want to upgrade the version of node used for every package in this repo');
  console.error(
    'change both the package.json>engines>node and the .nvmrc file to the updated version'
  );
  process.exit(1);
}

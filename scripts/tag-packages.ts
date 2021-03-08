import { getProjectList, PackageMap, writePackages } from './get-project-list';
const semver = require('semver');

// note arg[0] = 'node' and arg[1] is the script name
const tag = process.argv[2];
if (tag !== 'alpha' && tag !== 'beta') {
  console.error('Expected tag of "alpha" or "beta"');
  process.exit(1);
}

/**
 * For every package in the repo:
 * - Tag the version with "-beta" pre-release tag
 * - Update inter-dependant packages to list "beta" as the version
 */
(function main() {
  const { packageList, packageDetails } = getProjectList();

  updateDependentPackages(packageList, packageDetails);
  writePackages(packageList, packageDetails);
})();

function updateDependentPackages(packageList: string[], packageDetails: PackageMap) {
  packageList.forEach((name) => {
    const packageName = packageDetails[name].package.name;
    packageDetails[name].package.version =
      semver.coerce(packageDetails[name].package.version) + `-${tag}`;

    // Update all dependant packages
    packageList.forEach((subPackage) => {
      const pkg = packageDetails[subPackage].package;
      if (pkg.dependencies && pkg.dependencies[packageName]) {
        // Specify any "beta" which will just always get the latest published one
        pkg.dependencies[packageName] = tag;
      }
    });
  });
}

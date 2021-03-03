import { getProjectList, PackageMap } from './get-project-list';

const semver = require('semver');

/**
 * Run some sanity checks on all package files.
 */
(function main() {
  const { packageList, packageDetails } = getProjectList();
  checkPackageNames(packageList, packageDetails);
  checkPackageVersions(packageList, packageDetails);
  checkDependencies(packageList, packageDetails);
  checkApiSdkDependencies(packageList, packageDetails);
})();

/**
 * Ensure that for every package in `packages/*` that any other packages
 * that depend on it have an applicable version in the repo.
 */
function checkDependencies(packageList: string[], packageDetails: PackageMap) {
  console.log(`Check package dependencies`);
  packageList.forEach((name) => {
    const packageName = `@meeco/${name}`;
    const version = packageDetails[name].package.version;
    packageList.forEach((testPackage) => {
      const pkg = packageDetails[testPackage].package;
      const requiredVersion =
        (pkg.dependencies || {})[packageName] || (pkg.devDependencies || {})[packageName];

      if (requiredVersion === 'beta') {
        console.error(`${packageName} requires ${testPackage}@beta - this should not be committed`);
        process.exit(1);
      }

      if (requiredVersion) {
        if (!semver.satisfies(version, requiredVersion)) {
          console.error(
            `Package "@meeco/${testPackage}" expected version ${requiredVersion} of ${packageName} but the repo has ${version}`
          );
          console.error(
            `All package dependencies *must* be able to be resolved from within the repo`
          );
          process.exit(1);
        }
      }
    });
  });
  console.log(`All package dependencies can be satisfied`);
}

/**
 * Ensure that all versions conform to semver
 */
function checkPackageVersions(packageList: string[], packageDetails: PackageMap) {
  console.log(`Check package versions`);
  packageList.forEach((name) => {
    const version = packageDetails[name].package.version;
    const { version: coerced } = semver.coerce(version);
    if (version !== coerced) {
      console.error(
        `Package ${packageDetails[name].name} version is listed as "${version}" which coerced to ${coerced} which is invalid`
      );
      console.error(
        `Packages should use valid semver versions without any pre-release tags (try just using "${coerced}")`
      );
      process.exit(1);
    }
  });
  console.log(`All packages versioned ok`);
}

/**
 * Ensure that all package.json files in package/[package-name] are named
 * `@meeco/[package-name]`
 */
function checkPackageNames(packageList: string[], packageDetails: PackageMap) {
  console.log(`Check package names`);
  packageList.forEach((name) => {
    const packageFileName = packageDetails[name].package.name;
    if (packageFileName !== `@meeco/${name}`) {
      console.error(
        `Package folder ${name} package.json expected name "@meeco/${name}" but got "${packageFileName}"`
      );
      process.exit(1);
    }
  });
  console.log(`All packages named ok`);
}

/**
 * Ensure that all dependents on `@meeco/vault-api-sdk` or `@meeco/keystore-api-sdk` are compatible
 */
function checkApiSdkDependencies(packageList: string[], packageDetails: PackageMap) {
  const apiPackages = [`@meeco/vault-api-sdk`, `@meeco/keystore-api-sdk`];

  apiPackages.forEach((api) => {
    const requiredVersions: string[] = [];
    packageList.forEach((pkg) => {
      const requiredVersion = (packageDetails[pkg].package.dependencies || {})[api];
      if (!requiredVersion) {
        return;
      }
      if (!requiredVersion.startsWith('^')) {
        console.error(`Package ${pkg} depends on ${api}@${requiredVersion} which is too specific`);
        console.error(
          `To avoid duplicate installs - packages should depend on ^ versions of API SDK's`
        );
        process.exit(1);
      }
      requiredVersions.push(requiredVersion.replace('^', ''));
    });
    const min = semver.minSatisfying(requiredVersions, '>=0.0.0');
    const max = semver.maxSatisfying(requiredVersions, '>=0.0.0');
    if (!semver.satisfies(min, max)) {
      console.error(
        `One or more packages requires "${api}" version "^${min}" which would conflict with "^${max}"`
      );
      console.error(`Dependencies on API SDK's should be kept in sync to avoid duplicate installs`);
      process.exit(1);
    }
  });
}

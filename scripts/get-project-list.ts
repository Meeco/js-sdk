import { readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

const packagesRoot = join(__dirname, '../', 'packages');

export function getProjectList(): { packageList: string[]; packageDetails: PackageMap } {
  const packageList = readdirSync(packagesRoot).filter((dir) =>
    statSync(join(packagesRoot, dir)).isDirectory()
  );

  const packageDetails = packageList.reduce(
    (prev, name) => ({
      ...prev,
      [name]: {
        name,
        package: require(join(packagesRoot, name, 'package.json')),
      },
    }),
    {}
  );

  return {
    packageList,
    packageDetails,
  };
}

/**
 * Write modified packages back down to package.json files
 */
export function writePackages(packageList: string[], packageDetails: PackageMap) {
  packageList.forEach((name) => {
    writeFileSync(
      join(packagesRoot, name, 'package.json'),
      JSON.stringify(packageDetails[name].package, null, 2) + '\n'
    );
  });
}

export interface PackageMap {
  [name: string]: {
    name: string;
    package: any;
  };
}

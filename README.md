# Meeco TypeScript Tools

<img width="100px" src="https://uploads-ssl.webflow.com/5cd5168c6c861f4fc7cfe969/5ddcaba04d724676d8758927_Meeco-Logo-2019-Circle-RGB.svg">

## Main packages

### CLI

- [Documentation](./packages/cli)

### SDK

- [Documentation](./packages/sdk)
- [TypeDoc docs](https://meeco.github.io/js-sdk/)
- [SDK Demo page](https://meeco.github.io/js-sdk/sdk-demo/)

## Style Kit

- [Documentation](./packages/style-kit)
- [Storybook online](https://meeco.github.io/js-sdk/style-kit/)

## Adding a Package to this Typescript Monorepo

In order to allow developers to import only the components they need we prefer to split up our libraries into multiple smaller ones. This
is especially true when we are going to be adding a new (potentially large) dependency to a package.

For example, the large file handling library requires a dependency of Azure's storage package. If we were to add this to the main Meeco SDK
might end up importing importing the storage package regardless of if they need to handle large files or not. Tree-shaking may help alleviate
some of the issues but it does still mean that the dependency that gets pulled in is significantly bigger. It also means the SDK becomes a
lot more complex and has a more polluted global scope.

![Dependency Tree diagram](/docs/static-assets/dependency-tree-example.png)

Where possible all packages/apps should be written in typescript.  
If this is the case to get started with a new package.

1. Create a directory in the packages directory.
2. Copy the contents from the `/examples/example-package` directory into the newly created directory.
3. Change the name of the package in the `package.json`, preferable to something starting with `@meeco/` for most scenarios.
4. Run `npm install` from the root of this project
5. Run `npm build` from inside the directory of the new package to make sure it's all working.
6. Add the name of the package along with the directory of the src to the root's tsconfig.json under `"paths"`. e.g. `"@meeco/example-package": ["packages/example-package/src"]`

The above is just a basic guide to get started, feel free, if you're know what you're doing, to go off the rails a bit.

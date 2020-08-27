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

In order to allow developers both internal and external to add packages only for the things they need we prefer to split up our libraries
into multiple smaller ones. This is especially true when we are going to be adding a new dependency to a package. For example, the large file
handling library, it requires us to add a dependency of Azure's storage package, if we were to add this to the main Meeco SDK apps would end up
having a dependency on the Azure storage package regardless of if they need to handle large files or not. Sure tree-shaking can help alleviate
some of the issues caused by this but it would still mean that the dependency tree when developing is significantly bigger than it needs to be
and the package would need to be downloaded to every developer's device.

![Dependency Tree diagram](/docs/static-assets/dependency-tree-example.png)

Where possible all packages/apps should be written in typescript.  
If this is the case to get started with a new package.

1. Create a directory in the packages directory.
2. Copy the contents from the `/docs/static-assets/example-package` directory into the newly created directory.
3. Change the name of the package in the `package.json`, preferable to something starting with `@meeco/` for most scenarios.
4. Run `npm install` from the root of this project
5. Run `npm build` from inside the directory of the new package to make sure it's all working.

The above is just a basic guide to get started, feel free, if you're know what you're doing, to go off the rails a bit.

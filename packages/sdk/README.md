# Meeco TypeScript SDK

<img width="100px" src="https://uploads-ssl.webflow.com/5cd5168c6c861f4fc7cfe969/5ddcaba04d724676d8758927_Meeco-Logo-2019-Circle-RGB.svg">

### API Docs

For SDK API Docs (TypeDoc docs) [See Here](https://meeco.github.io/js-sdk/)

## Installation

```sh
$ npm install -S @meeco/sdk
```

### Usage in Angular

Since Angular 6, the following polyfills are required to be added to your `polyfills.ts` (in order)

```ts
// required for bson library
(window as any).global = window;
// Required for JSRP
const buffer = require('buffer');
(window as any).Buffer = buffer;
(window as any).process = {
  browser: true,
};
```

You will also need to configure your `compilerOptions` in your `tsconfig.base.json` as follows:

```json
{
  "compilerOptions": {
    "paths": {
      "stream": ["./node_modules/readable-stream"]
    }
    // ...
  }
}
```

## Usage Basics

This is not an exhaustive list of functionatlity - just some basic use-cases. For full usage [see the API docs](https://meeco.github.io/js-sdk/)

All examples expect you have your environment configured.

An environment configuration looks something like this:

```js
// Note this can also be an instance of Environment from `@meeco/sdk` for type safety
const environment = {
  vault: {
    url: '<target vault environment url>',
    subscription_key: '<your Meeco subscription key>
  }
  keystore: {
    url: '<target keystore environment url>',
    subscription_key: '<your Meeco subscription key>'
  }
}
```

### TypeScript / JavaScript

All examples in this Readme use TypeScript. However, JavaScript should also work mostly the same, just replace any `import` statements with `require` statements depending on your module system.

e.g.

```ts
// TypeScript style imports
import { UserService } from '@meeco/sdk';
const service = new UserService();
```

```js
// Node/JavaScript style imports
const Meeco = require('@meeco/sdk');
const service = new Meeco.UserService();

// or
const UserService = require('@meeco/sdk').UserService;
const service = new Meeco.UserService();

// or
const { UserService } = require('@meeco/sdk');
const service = new Meeco.UserService();
```

### Configuring Fetch

The library requires a library that conforms to the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). Many modern browsers have this already but if you intend to support browsers that don't you will need to provide your own polyfill for it.

Likewise current LTS NodeJS does not have fetch built-in. We have tested the library to be working with the [`node-fetch` polyfill](https://www.npmjs.com/package/node-fetch)

To configure the fetch library to be used for all library requests calls the `configureFetch(fetch)` method:

```ts
import { configureFetch } from '@meeco/sdk';
import * as fetchPolyfill from 'some-fetch-polyfill-library';

configureFetch(fetchPolyfill);

// Continue to use the Meeco SDK as normal...
```

### Loggers

Most services allow a logger to be configured. The default for this is a no-op function (`() => {}`). If you would like to log message to the console, you can pass in `console.log` as the logger. You can pass in any function that takes strings as an argument (for exmaple, if you want to update a progress bar message).

### API Factories

The SDK offers wrappers around the Meeco Vault API SDK and Keystore API SDK. These attach on common required headers for convenience when making requests. To use them, simply call the API factory with your environment configuration. You can then create factory instances by calling the factory with a user's authentication data and, finally, get the desired Model API off the result:

```ts
import { vaultAPIFactory, keystoreAPIFactory } from '@meeco/sdk';

const vaultFactory = vaultAPIFactory(environment);
const keystoreFactory = keystoreAPIFactory(environment);
const aliceVault = vaultFactory(aliceUser);
const bobKeystore = keystoreFactory(bobUser);

// Get api's off the factory instance
const UserApi = bobKeystore.UserApi;

// Alternatively, use object destructuring
const { ItemApi } = aliceVault;
```

### Creating and Fetching Users

To perform most actions with Meeco we need a User - either an existing one or a new one we create.

In order to create a user we need a username (requested from the Keystore API), a secret (derived from the username) and a passphrase/password (entered by the user for account creation).

```ts
import { UserService, SecretService } from '@meeco/sdk';

const userService = new UserService(environment);
const secretService = new SecretService();

const username = await userService.generateUsername();
// This secret should be returned to the user for safe keeping
const secret = await secretService.generateSecret(username);
const user = await userService.create(password, secret);
// We now have the Meeco user `AuthData` to use for future calls and encryption.
```

In future, if we want to retrieve the user's `AuthData` we need them to provide their secret (which contains their username) and the passphrase.

```ts
import { UserService } from '@meeco/sdk';

const userService = new UserService(environment);
const user = await userService.get(password, secret);
// We have logged the user back in again and have the encryption keys we need
```

### Dealing with Items

Items are typically created from a template (although you can create ones from a blank template as well). We can get a list of the available templates with the `TemplateService`

```ts
import { TemplateService } from '@meeco/sdk';

// Using a User we created or logged in with as above
const templatesService = new TemplatesService(environment, user.vault_access_token);
const availableTemplates = await templatesService.listTemplates();

/**
 * We now have a list of the available templates.
 * We can also view more information about one of the templates (such
 * as the slots that it provides)
 */

const templateDetails = await service.getTemplate(availableTemplates.item_templates[0].name);
```

Once we've selected a template we can create our first item.

```ts
import { ItemService } from '@meeco/sdk';

const service = new ItemService(environment);
const item = await service.create(user.vault_access_token, user.data_encryption_key, {
  item: {
    label: 'My Car'
  },
  templateName: availableTemplates.item_templates[0].name,
  slots: [
    {
      name: 'make_model',
      value: 'Ford Focus'
    },
    {
      name: 'year',
      value: '2017'
    }
  ]
});
```

We can also fetch a list of a user's items or get details about a specific item in a manner similar to templates:

```ts
import { ItemService } from '@meeco/sdk';

const service = new ItemService(environment);
// Get the user's items
const items = await service.list(user.vault_access_token);
// Get more details about a particular item
const itemDetails = await service.get(
  items[0].id,
  user.vault_access_token,
  user.data_encryption_key
);
```

### Connecting Users and Sharing Data

A big part of Meeco is securely sharing data. In order to share data the users sharing the data must first be Connected.

```ts
import { ConnectionService } from '@meeco/sdk';

const connectionService = new ConnectionService(environment);

// Alice's Interaction, sending a connection invitation to Bob
const invitation = await connectionService.createInvitation('Bob', aliceUser);
// It is up to Alice to share `invitation.token` with Bob so he can accept it (e.g. via Email or SMS)

// Bob's interaction - accepting the invitation (providing the token he got from Alice)
const connection = await connectionService.acceptInvitation('Alice', invitationToken, bobUser);
```

Alice and Bob are now connected and can share data. Let's share one of Alice's items with Bob.

```ts
import { ShareService } from '@meeco/sdk';

const shareService = new ShareService(environment);

/**
 * Assuming we have connectionWithBob from ConnectionService.listConnections
 * and an aliceItem from ItemService.list
 */
const share = await shareService.shareItem(alice, connetionWithBob.id, aliceItem.id);

// Bob should now be able to fetch this item
const item = await shareService.getSharedItem(bob, sharedItem.id);
```

## SDK Development

### Generating Documentation

`npm run docs` to run TypeDoc. _Note_ at time of writing we use the "library" `mode` for typedoc which requires the beta version (`npm i typedoc@next`)

### Running the demo

There is a sample website that uses cryppo to perform various functions.

1. Bootstrap the root project (`npm run bootstrap` in project root)
2. `npm run demo`
3. Visit `http://localhost:1234`

Note environment settings are saved to local storage for convenience

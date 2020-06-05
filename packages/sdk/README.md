# Meeco TypeScript SDK

<img width="100px" src="https://uploads-ssl.webflow.com/5cd5168c6c861f4fc7cfe969/5ddcaba04d724676d8758927_Meeco-Logo-2019-Circle-RGB.svg">

## Running the demo

Setup your environment file:

1. `cp demo/.environment.example.json demo/.environment.json`
2. Update URLs and subscription keys as necessary

`npm install && npm run demo`

## Installation

```sh
$ npm install @meeco/sdk
```

## Configuration

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

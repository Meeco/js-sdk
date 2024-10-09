# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project (loosely) adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 7.3.0

### Fixed

- Fix `import` of `bs58` dependency that crashes the build

## 7.2.0

### Changed

- `tsup` configured to include types

## 7.1.0

### Changed

- Upgraded `@meeco/vc-api-sdk` version to `10.0.0-develop.20241007093232.e3e28ab`

## 7.0.0

### Changed

- Upgraded `@meeco/vc-api-sdk` version to `10.0.0-develop.20241004122546.1da229b`

## 6.0.0

### Changed

- Minimum required NodeJS version changed to `18.0.0`
- Minimum required `npm` version changed to 10.0.0"
- `bili` bundling package replaced with `tsup`

### Removed

- `node-fetch` dependency

###

## 5.3.2

### Changed

- Upgraded `@meeco/vc-api-sdk` version to `9.2.0-develop.20240802135616.d69cf66`

## 5.3.1

### Changed

- Fix the missing `organisation_id` in `presentationRequestService`

## 5.3.0

### Changed

- Add `getPresentationRequestResponseItem`,`getPresentationRequestResponseItems` and `deletePresentationRequestResponseItem` methods to `PresentationRequestResponseService`

## 5.2.4

### Changed

- Upgraded `@meeco/vc-api-sdk` version to `9.1.1-develop.20240624043012.077ea3e`

## 5.2.3

### Changed

- Upgraded `@meeco/vc-api-sdk` version to `9.1.0-stage.20240623232328.d567e44`

## 5.2.2

### Changed

- Upgraded `@meeco/vc-api-sdk` version to `8.9.0-develop.20240611234855.046306d`

## 5.2.1

### Changed

- Upgraded `@meeco/vc-api-sdk` version to `8.9.0-develop.20240604235456.ef99be2`

## 5.2.0

### Changed

- Export SVX API types

## 5.1.0 (2024-05-16)

### Changed

- `presentationSubmission` is accepted and stored to Vault via `createPresentationRequestResponseItem`

### Security

- Upgraded `@meeco/vc-api-sdk` version to `8.9.0-stage.20240515182527.8dee922`
- Upgraded `@noble/curves` to `1.4.0`
- Upgraded `@noble/hashes` to `1.4.0`
- Upgraded `uuid` to `9.0.1`

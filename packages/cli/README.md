<!-- IMPORTANT -->
<!-- Blocks of this readme are auto-generated -->
<!-- run `npx oclif-dev readme` to update -->

# Meeco CLI

<img width="100px" src="https://uploads-ssl.webflow.com/5cd5168c6c861f4fc7cfe969/5ddcaba04d724676d8758927_Meeco-Logo-2019-Circle-RGB.svg">

A CLI tool for interacting with [Meeco](https://dev.meeco.me/) services and databases

# Table of Contents

<!-- toc -->

- [Meeco CLI](#meeco-cli)
- [Table of Contents](#table-of-contents)
- [Setup](#setup)
- [Reporting Errors](#reporting-errors)
- [Dev Set up](#dev-set-up)
- [Usage](#usage)
- [Commands](#commands)
- [Config File Specifications](#config-file-specifications)
  <!-- tocstop -->

# Setup

1. Download the latest release from the [releases](https://github.com/Meeco/cli/releases) page
1. Run `meeco` command out of the `./bin` folder

# Reporting Errors

1. Always make sure you are running the [latest release](https://github.com/Meeco/cli/releases) of the CLI.
1. Include any stack traces if possible (re-run your command with `MEECO_DEBUG=1` environment variable)

# Dev Set up

After cloning the repo, run `npm install` to install dependencies. You can then run the meeco command as below.

## The `meeco` command

If you want to run `meeco <command>` and have it point to your dev environment - run `npm link .` to hook up a global `meeco` to the current workspace.

Alternatively, just run `./bin/run` when developing (e.g. `/bin/run users:create`)

# Usage

```sh-session
$ meeco COMMAND
running command...
$ meeco (-v|--version|version)
cli/<verion> darwin-x64 node-v12.4.0
$ meeco --help [COMMAND]
USAGE
  $ meeco COMMAND
...
```

# Commands

**NOTE** for all commands, an environment yaml file should be specified using `-e path/to/environment.yaml` - See the [Environment](#Environment) section of File Specifications for information. The default for the environment is `.environment.yaml`.

**NOTE** Most commands require authentication data from one or more users. This can be specified with the `-a <path/to/auth file.yaml>` flag. However, since it is required by almost all commands you can place your auth file at `.user.yaml` and it will be read automatically.

All yaml files beginning with a `.` in the root of the project are git ignored.

## Basic Flow

A simple end-to-end script is available in test/e2e.sh which shows setting up two
users, (Alice and Bob) creating a connection between them and sharing a card between them.

You can open it and step through the commands yourself or run the entire script.

### 1. Account and Authorization Setup

Create your first user:

- `meeco users:create -p <password> > .user.yaml`

Note: this will open a browser with a Captcha to be solved.

Or - if you have an existing account (e.g if you would like to set up on a new computer) - you can fetch your user by providing your password and secret

- `meeco users:get -p <password> -s <secret>` (or `meeco users:get` to be prompted for these).

If you would prefer to provide a configuration file with your credentials, supply a [User Config](#User) file i.e.

- `meeco users:get -c path/to/my-user-config.yaml`

### 2. Create an Item

1. Get a list of item templates you can use `meeco templates:list` - you can view more details on a template with `meeco templates:info <template>`
1. Create an item template file from an item template `meeco items:create-config <template_name> > .my_item_config.yaml`
   - Edit this file to add values for fields as applicable
1. Create your first item: `meeco items:create -i .my_item_config.yaml -a .user.yaml`
1. You can check the item was created with `meeco items:list` or `meeco items:get <itemId>`

## 3. Create a Second User and Connect

1. Create your second user: `meeco users:create -p <password> > .user_2.yaml`
1. Make a connection config file between your two users: `meeco connections:create-config --from .user.yaml --to .user_2.yaml > .connection_config.yaml`
   - Edit this file to add connection names as appropriate
1. Create the connection between the two users: `meeco connections:create -c .connection_config.yaml`

## 4. Share an Item Between Connected Users

1. Ensure users are connected first (see above)
2. Select an item from user 1 to share to user 2
3. Create the share template: `meeco shares:create-config --from .user.yaml --to .user_2.yaml -i <item_id_to_share> > .share_config.yaml`
4. Create the share: `meeco shares:create -c .share_config.yaml`

This will setup a private encryption space between the two users (if it does not exist already) and then share the item.

You can fetch the shared item as the second user with `meeco shares:list -a .user_2.yaml` / `meeco shares:get -a .user_2.yaml <share_id>`

<!-- commands -->

- [`meeco help [COMMAND]`](#meeco-help-command)

## `meeco help [COMMAND]`

display help for meeco

```
USAGE
  $ meeco help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

<!-- commandsstop -->

# Config File Specifications

**Note** For consistency with API responses, all config files developed should use `snake_case` for properties.

## Authentication

```yaml
kind: Authentication
metadata:
  keystore_access_token: <string>
  vault_access_token: <string>
  passphrase_derived_key: <string> # url-safe base64
  key_encryption_key: <string> # url-safe base64
  data_encryption_key: <string> # url-safe base64
```

## Connection

```yaml
kind: Connection
metadata:
  fromName: <string> # name of the 'from' user
  fromEmail: <string> # email of the 'from' user
  toName: <string> # name of the 'to' user
  toEmail: <string> # email of the 'to' user
spec:
  from:
    keystore_access_token: <string>
    vault_access_token: <string>
    passphrase_derived_key: <string> # url-safe base64
    key_encryption_key: <string> # url-safe base64
    data_encryption_key: <string> # url-safe base64
  to:
    keystore_access_token: <string>
    vault_access_token: <string>
    passphrase_derived_key: <string> # url-safe base64
    key_encryption_key: <string> # url-safe base64
    data_encryption_key: <string> # url-safe base64
```

## Environment

```yaml
vault:
  url: https://sandbox.meeco.me/vault
  subscription_key: my_api_subscription_key
keystore:
  url: https://sandbox.meeco.me/keystore
  subscription_key: my_api_subscription_key
downloader:
  url: https://sandbox.meeco.me/downloader
  subscription_key: my_api_subscription_key
passphrase:
  url: https://sandbox.meeco.me/passphrasestore
  subscription_key: my_api_subscription_key
```

## File Attachment

```yaml
kind: FileAttachment
metadata:
  item_id: <target item id>
spec:
  label: 'My Secret File'
  file: './path/to/file.txt'
```

## Item

```yaml
kind: Item
metadata:
  template: <template name>
spec:
  label: My Account
  name: my_account # Optional as the API will auto-generate based on 'label'
  slots:
    - name: url # copied slot template
      value: https://www.example.com
    - name: account
      value: 'jsmith@example.com'
    - name: password
      value: mySecretPassword1
    - label: 'My Custom Field'
      name: my_custom # Optional as the API will auto-generated based on 'label'
      value: 'Some Value'
```

## Share

```yaml
kind: Share
metadata:
spec:
  item_id: <string> # id of the item to be shared (all slots will be shard)
  from:
    keystore_access_token: <string>
    vault_access_token: <string>
    passphrase_derived_key: <string> # url-safe base64
    key_encryption_key: <string> # url-safe base64
    data_encryption_key: <string> # url-safe base64
  to:
    keystore_access_token: <string>
    vault_access_token: <string>
    passphrase_derived_key: <string> # url-safe base64
    key_encryption_key: <string> # url-safe base64
    data_encryption_key: <string> # url-safe base64
```

## User

```yaml
kind: User
metadata:
spec:
  password: <string>
  secret: <string>
```

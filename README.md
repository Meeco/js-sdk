<!-- IMPORTANT -->
<!-- Blocks of this readme are auto-generated -->
<!-- run `npx oclif-dev readme` to update -->

# Meeco CLI

A CLI tool for interacting with Meeco services and databases

# Table of Contents

<!-- toc -->

- [Meeco CLI](#meeco-cli)
- [Table of Contents](#table-of-contents)
- [Setup](#setup)
- [Dev Set up](#dev-set-up)
- [Usage](#usage)
- [Commands](#commands)
- [File Specifications](#file-specifications)
  <!-- tocstop -->

# Setup

1. Download the latest release from the [releases](https://github.com/Meeco/cli/releases) page
1. Run `meeco` command out of the `./bin` folder

# Dev Set up

Note - because the API SDK's are not currently publicly published, the `.npmrc.grpg` needs to be decrypted to `.npmrc` to install dependencies. This is likely to change in future.

After cloning the repo, run `npm install` to install dependencies.

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

**Note** Most commands require authentication data from one or more users. This can be specified with the `-a <path/to/auth file.yaml>` flag. However, since it is required by almost all commands you can place your auth file at `.user.yaml` and it will be read automatically.

## Basic Flow

### 1. Create an Account

1. Create your first user: `meeco users:create -p <password> > user_1.yaml`

### 2. Create an Item

1. Get a list of item templates you can use `meeco templates:list` - you can view more details on a template with `meeco templates:info <template>`
1. Create an item template file from an item template `meeco items:create-config <template_name> > my_item_config.yaml`
   - Edit this file to add values for fields as applicable
1. Create your first item: `meeco items:create -i my_item_config.yaml -a user_1.yaml`
1. You can check the item was created with `meeco items:list` or `meeco items:get <itemId>`

## 3. Create a Second User and Connect

1. Create your second user: `meeco users:create -p <password> > user_2.yaml`
1. Make a connection config file between your two users: `meeco connections:create-config --from user_1.yaml --to user_2.yaml > connection_config.yaml`
   - Edit this file to add connection names as appropriate
1. Create the connection between the two users: `meeco connections:create -c connection_config.yaml`

## 4. Share an Item Between Connected Users

1. Ensure users are connected first (see above)
2. Select an item from user 1 to share to user 2
3. Create the share template: `meeco shares:create-config -f user_1.yaml -t user2.yaml -i <item_id_to_share> > share_config.yaml`
4. Create the share: `meeco shares:create -c share_config.yaml`

This will setup a private encryption space between the two users (if it does not exist already) and then share the item.

<!-- commands -->

- [`meeco connections:create`](#meeco-connectionscreate)
- [`meeco connections:create-config`](#meeco-connectionscreate-config)
- [`meeco connections:list`](#meeco-connectionslist)
- [`meeco help [COMMAND]`](#meeco-help-command)
- [`meeco items:create`](#meeco-itemscreate)
- [`meeco items:create-config TEMPLATENAME`](#meeco-itemscreate-config-templatename)
- [`meeco items:get ITEMID`](#meeco-itemsget-itemid)
- [`meeco items:list`](#meeco-itemslist)
- [`meeco shares:create [FILE]`](#meeco-sharescreate-file)
- [`meeco shares:create-config`](#meeco-sharescreate-config)
- [`meeco shares:info [FILE]`](#meeco-sharesinfo-file)
- [`meeco templates:info TEMPLATENAME`](#meeco-templatesinfo-templatename)
- [`meeco templates:list`](#meeco-templateslist)
- [`meeco users:create`](#meeco-userscreate)
- [`meeco users:get`](#meeco-usersget)

## `meeco connections:create`

Create a new connection between two users

```
USAGE
  $ meeco connections:create

OPTIONS
  -c, --config=config            (required) Connection config file to use for the creation
  -e, --environment=environment  [default: .environment.yaml] environment config file
```

_See code: [src/commands/connections/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/connections/create.ts)_

## `meeco connections:create-config`

Scaffold a connection config file when given two users

```
USAGE
  $ meeco connections:create-config

OPTIONS
  -e, --environment=environment  [default: .environment.yaml] environment config file
  -f, --from=from                (required) User config file for the 'from' user
  -t, --to=to                    (required) User config file for the 'to' user
```

_See code: [src/commands/connections/create-config.ts](https://github.com/Meeco/cli/blob/master/src/commands/connections/create-config.ts)_

## `meeco connections:list`

List connections for an authenticated user

```
USAGE
  $ meeco connections:list

OPTIONS
  -a, --auth=auth                (required) [default: .user.yaml] auth yaml file
  -e, --environment=environment  [default: .environment.yaml] environment config file
```

_See code: [src/commands/connections/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/connections/list.ts)_

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

## `meeco items:create`

Create a new item for a user from a template

```
USAGE
  $ meeco items:create

OPTIONS
  -a, --auth=auth                (required) [default: .user.yaml] auth yaml file
  -e, --environment=environment  [default: .environment.yaml] environment config file
  -i, --item=item                (required) item yaml file

EXAMPLE
  meeco items:create -i path/to/item-config.yaml -a path/to/auth.yaml
```

_See code: [src/commands/items/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/create.ts)_

## `meeco items:create-config TEMPLATENAME`

Provide a template name to construct an item config file

```
USAGE
  $ meeco items:create-config TEMPLATENAME

ARGUMENTS
  TEMPLATENAME  Name of the template to use for the item

OPTIONS
  -a, --auth=auth                (required) [default: .user.yaml] auth yaml file
  -e, --environment=environment  [default: .environment.yaml] environment config file
```

_See code: [src/commands/items/create-config.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/create-config.ts)_

## `meeco items:get ITEMID`

Get an item from the vault and decrypt its values

```
USAGE
  $ meeco items:get ITEMID

OPTIONS
  -a, --auth=auth                (required) [default: .user.yaml] auth yaml file
  -e, --environment=environment  [default: .environment.yaml] environment config file
```

_See code: [src/commands/items/get.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/get.ts)_

## `meeco items:list`

describe the command here

```
USAGE
  $ meeco items:list

OPTIONS
  -a, --auth=auth                (required) [default: .user.yaml] auth yaml file
  -e, --environment=environment  [default: .environment.yaml] environment config file

EXAMPLE
  meeco items:list -a path/to/auth.yaml
```

_See code: [src/commands/items/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/list.ts)_

## `meeco shares:create [FILE]`

Share an item between two users

```
USAGE
  $ meeco shares:create [FILE]

OPTIONS
  -c, --config=config            (required) Share config file to use for setting up the share
  -e, --environment=environment  [default: .environment.yaml] environment config file
```

_See code: [src/commands/shares/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/create.ts)_

## `meeco shares:create-config`

Provide two users and an item id to construct a share config file

```
USAGE
  $ meeco shares:create-config

OPTIONS
  -e, --environment=environment  [default: .environment.yaml] environment config file
  -f, --from=from                (required) User config file for the 'from' user
  -i, --itemId=itemId            (required) Item id of the 'from' user to share with the 'to' use
  -t, --to=to                    (required) User config file for the 'to' user
```

_See code: [src/commands/shares/create-config.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/create-config.ts)_

## `meeco shares:info [FILE]`

View information about the shared encryption space of two users

```
USAGE
  $ meeco shares:info [FILE]

OPTIONS
  -c, --config=config            (required) Connection config file to use getting share information
  -e, --environment=environment  [default: .environment.yaml] environment config file
```

_See code: [src/commands/shares/info.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/info.ts)_

## `meeco templates:info TEMPLATENAME`

Get more information about an item template

```
USAGE
  $ meeco templates:info TEMPLATENAME

OPTIONS
  -a, --auth=auth                (required) [default: .user.yaml] auth yaml file
  -e, --environment=environment  [default: .environment.yaml] environment config file

EXAMPLE
  meeco templates:info password
```

_See code: [src/commands/templates/info.ts](https://github.com/Meeco/cli/blob/master/src/commands/templates/info.ts)_

## `meeco templates:list`

List all the available item templates

```
USAGE
  $ meeco templates:list

OPTIONS
  -a, --auth=auth                (required) [default: .user.yaml] auth yaml file
  -e, --environment=environment  [default: .environment.yaml] environment config file
```

_See code: [src/commands/templates/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/templates/list.ts)_

## `meeco users:create`

Create a new Meeco user against the various microservices

```
USAGE
  $ meeco users:create

OPTIONS
  -e, --environment=environment  [default: .environment.yaml] environment config file
  -p, --password=password        Password to use for the new user

EXAMPLE
  meeco users:create -c path/to/user-config.yaml
```

_See code: [src/commands/users/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/users/create.ts)_

## `meeco users:get`

Fetch details about Meeco user from the various microservices

```
USAGE
  $ meeco users:get

OPTIONS
  -c, --user=user                user config file
  -e, --environment=environment  [default: .environment.yaml] environment config file
  -p, --password=password        the password of the user
  -s, --secret=secret            the secret key of the user

EXAMPLE
  meeco users:get -c path/to/user-config.yaml
```

_See code: [src/commands/users/get.ts](https://github.com/Meeco/cli/blob/master/src/commands/users/get.ts)_

<!-- commandsstop -->

# File Specifications

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
  url: https://api-sandbox-test.meeco.me
keystore:
  url: https://keystore-sandbox-test.meeco.me
  provider_api_key: my_provider_api_key
downloader:
  url: https://downloader-sandbox-test.meeco.me
passphrase:
  url: https://passphrasestore-sandbox-test.meeco.me
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
```

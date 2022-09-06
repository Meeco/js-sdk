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
- [Running Meeco CLI From Sources](#running-meeco-cli-from-sources)
- [Usage](#usage)
- [Commands](#commands)
- [Snippet of .my_item.yaml](#snippet-of-my_itemyaml)
- [Config File Specifications](#config-file-specifications)
<!-- tocstop -->

# Setup

1. Download the latest release from the [releases](https://github.com/Meeco/cli/releases) page
1. Run `meeco` command out of the `./bin` folder

# Reporting Errors

1. Always make sure you are running the [latest release](https://github.com/Meeco/cli/releases) of the CLI.
1. Include any stack traces if possible (re-run your command with `MEECO_DEBUG=1` environment variable)

# Running Meeco CLI From Sources

```sh-session
$ git clone git@github.com:Meeco/js-sdk.git
$ cd js-sdk
$ npm install
$ cd ./packages/cli
$ cp example.environment.yaml .environment.yaml
```

Edit `.environment.yaml` and add URLs to the vault and the keystore, as well as the subscription key
which you can request here: https://dev.meeco.me/signup

Meeco CLI is now ready:

```sh-session
$ node --require tsconfig-paths/register ./bin/run
A CLI tool for interacting with the Meeco APIs

VERSION
  @meeco/cli/3.0.1 darwin-x64 node-v16.2.0

USAGE
  $ meeco [COMMAND]

TOPICS
  client-task-queue      Commands related client-side jobs for the user
  connections            Commands related to connections between Meeco users
  delegations            Accept a delegation inivitation aka create a delegation connection
  items                  Commands related to a Meeco vault items
  organization-members   Commands related to managing members of an organizations within Meeco
  organization-services  Commands related to managing services for an organizations within Meeco
  organizations          Commands related to managing Organizations within Meeco
  shares                 Commands related to shared data between connected Meeco users
  templates              Commands related to vault item templates
  users                  Commands related to a meeco user account

COMMANDS
  help  display help for meeco
```

You might want to set up an alias for this to make your life easier in your shell environment config (e.g. `.zshrc`)
`alias meeco="node --inspect --require tsconfig-paths/register /PATH/TO/WORKDIR/js-sdk/packages/cli/bin/run"` so you can simply run `meeco` when developing.

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

**NOTE** Commands of the form `command:list` are paginated: they will return up to 200 (current default page size) results. To get more than that, use the flag `--all`.

All yaml files beginning with a `.` in the root of the project are git ignored.

## Basic Flow

A simple end-to-end script is available in test/e2e.sh which shows setting up two
users, (Alice and Bob) creating a connection between them and sharing a card between them.

You can open it and step through the commands yourself or run the entire script.

### 1. Account and Authorization Setup

Create your first user:

- `meeco users:create -p <password> > .user.yaml`

Note: this will open a browser with a Captcha to be solved if captcha is enabled for the environment you are working against.

Or - if you have an existing account (e.g if you would like to set up on a new computer) - you can fetch your user credentials by providing your password and secret

- `meeco users:login -p <password> -s <secret>` (or `meeco users:login` to be prompted for these).

This also works if your Vault or Keystore token has expired.

If you need to get your Vault User Id use:

- `meeco users:get -p <password> -s <secret>`

### 2. Create an Item

1. Get a list of item templates you can use `meeco templates:list` - you can view more details on a template with `meeco templates:info <template>`
1. Create an item template file from an item template `meeco items:create-config <template_name> > .my_item_config.yaml`
   - Edit this file to add values for fields as applicable
1. Create your first item: `meeco items:create -i .my_item_config.yaml -a .user.yaml > my_item.yaml`
1. You can check the item was created with `meeco items:list` or `meeco items:get <itemId>`

### 3. Create a Second User and Connect

1. Create your second user: `meeco users:create -p <password> > .user_2.yaml`
1. Make a connection config file between your two users: `meeco connections:create-config --from .user.yaml --to .user_2.yaml > .connection_config.yaml`
   - Edit this file to add connection names as appropriate
1. Create the connection between the two users: `meeco connections:create -c .connection_config.yaml > .connection.yaml`

### 4. Share an Item Between Connected Users

1. Ensure users are connected first (see above)
2. Select an item from user 1 to share to user 2
3. Create the share template: `meeco shares:create-config --from .user.yaml --connection .connection.yaml -i my_item.yaml > .share_config.yaml`
   (If you only want to share one slot, also add `-s <slot_name>`).
4. Create the share: `meeco shares:create -c .share_config.yaml`

You can fetch the share and shared item as the second user with `meeco shares:get-incoming -a .user_2.yaml <share_id>`

You can fetch the incoming and outgoing shares info with `meeco shares:list incoming -a .user_2.yaml` / `meeco shares:list outgoing`

You can delete shared item as either first or second user with `meeco shares:delete -a .user_2.yaml <share_id>`

### 5. Update an Item

Items can be updated in a similar way they are created. The best way to get a starting template file
is to fetch your existing item and pipe it to a file

1. `meeco items:get <item_id> > .my_item.yaml`

2. Next, we can edit that item file to, for example, change one of the slot values and remove a slot

```yaml
# Snippet of .my_item.yaml
kind: Item
spec:
  id: 26a76712-4822-40c2-9172-8703228cdc6a # This is Required
  slots:
    # We only need to include the slots that we wish to change
    # Existing slots and values will remain as they are.
    - name: password
      value: mySecretPassword1 # Updated Value
    - name: my_custom
      _destroy: true # Flag a slot for deletion
```

3. Now we can run the update:

`meeco items:update -i .my_item.yaml`

4. We can verify the slots contain the correct values by fetching the item again

`meeco items:get <item_id> > .my_item.yaml`

```yaml
#...
slots:
  - id: 0ead9dcf-1750-463d-b92c-ba6d77085b45
    #...
    name: password
    encrypted_value: Aes256Gcm.jGwjQHR8-O4H45z3n2s4-dE=.QUAAAAAFaXYADAAAAAAIYpy9UBbXkfoYLRkFYXQAEAAAAACtE9tB059YdBLAybmx6lmDAmFkAAUAAABub25lAAA=
    value: mySecretPassword1 # We have the Updated value
  #...
```

### 6. Attach file to an Item slot

1. create a file attachment config yaml.

```yaml
kind: FileAttachment
metadata:
  item_id: 1b20e75f-d0da-4f9c-ae19-257ba802ab94 # item id
spec:
  label: 'My Secret File' # slot lable
  file: './image.jpg' # file to attach location
```

2. Now we can run attach file command with file-attachment-config:

`meeco items:attach-file -c ./file-attachment-config.yaml`

3. We can verify the attachment slot by fetching the item again

`meeco items:get <item_id> > .my_item.yaml`

4. We can also download uploaded attachment

`meeco items:get-attachment my-attachment-item-id my-attachment-slot-id -o ./image.jpg`

### 7. Attach Thumbnail to Attachment

1. create a thumbnail attachment config config yaml.

```yaml
kind: Thumbnail
metadata:
  itemId: 794989f6-9de3-48f6-a379-32373e3e4a73 # item id
  slotId: 79277a11-ad81-4f86-afda-8ac1b9b72079 # slot id
spec:
  label: 'Thumbnail of My Secret File' # slot lable
  file: 'p.png' # file to attach location
  sizeType: 128x128/jpg
```

2. Now we can run attach file command with file-attachment-config:

`meeco items:create-thumbnail -c ./.thumbnail-config.yaml`

3. We can verify the thumbnail slot by fetching the item again

`meeco items:get <item_id> > .my_item.yaml`

4. We can also download uploaded thumbnail

`meeco items:get-thumbnail <ItemId> <SlotId> <AttachmentId> -o ./`

### 8. Review Client Task Queue - A ClientTask represents a task the client is supposed to perform

1. You can retrive all TODO tasks with `meeco client-task-queue:list`.
2. You can also retrive different taks are in different state. e.g. Todo, InProgress, Done, Failed by providing STATE input. e.g `meeco client-task-queue:list -s InProgress`

## 9. Perform tasks in the Client Task Queue

1. You can run a batch of tasks in the client-task queue by running the command `meeco client-task-queue:run-batch`
   - if you add a number to the end of the command like `meeco client-task-queue:run-batch 20` it will run up to that many tasks in a batch otherwise it will default to the
     server page default of 200.

## Organization Flow

### 1. Organization Creation

Create your first organization:

Provide a configuration file with your credentials, supply a [Organization Config](#Organization) file i.e.

- `meeco organizations:create -c .my-organization-config.yaml > .my-created-organization.yaml`

you can check organization was created and in requested state waiting for approval

- `meeco organizations:list -m requested`

once approved it can be access with follwoing command

- `meeco organizations:list`

### 2. Retrive organization credential

1. Ensure organization is created and validated first (see above)
2. You can retrive organization credential using follwoing command
   `meeco organizations:login -o .my-created-organization.yaml > .my-org-login.yaml`

### 3. Invite members to organization

1. Ensure organization is created and validated first (see above)
2. First create an invitation to invite new member to organization. you need to provide created organization yml & organization credential as input.
   `meeco organization-members:create-invitation -o .my-created-organization.yaml -a .my-org-login.yaml > .my-org-member-invitation.yaml`

### 4. Accept membership invitation and become member

1. Ensure organization invitation is created and saved in ymal file. `.my-org-member-invitation.yaml` (see above)
2. Accept invitation. you need to provide created invitation yml & accept invitation as existing vault user.
   `meeco organization-members:accept-invitation -i .my-org-member-invitation.yaml -a .user_who_accepting_invite.yaml > .my-org-membership.yaml`

## All Commands

<!-- commands -->

- [`meeco client-task-queue:list`](#meeco-client-task-queuelist)
- [`meeco client-task-queue:run-batch`](#meeco-client-task-queuerun-batch)
- [`meeco client-task-queue:update TASKS_FILE`](#meeco-client-task-queueupdate-tasks_file)
- [`meeco connections:accept TOKEN`](#meeco-connectionsaccept-token)
- [`meeco connections:create`](#meeco-connectionscreate)
- [`meeco connections:create-config`](#meeco-connectionscreate-config)
- [`meeco connections:list`](#meeco-connectionslist)
- [`meeco delegations:accept-invitation RECIPIENT_NAME`](#meeco-delegationsaccept-invitation-recipient_name)
- [`meeco delegations:accept-kek CONNECTIONID`](#meeco-delegationsaccept-kek-connectionid)
- [`meeco delegations:create-invitation RECIPIENT_NAME [DELEGATION_ROLE]`](#meeco-delegationscreate-invitation-recipient_name-delegation_role)
- [`meeco delegations:load-auth-config`](#meeco-delegationsload-auth-config)
- [`meeco delegations:share-kek CONNECTIONID`](#meeco-delegationsshare-kek-connectionid)
- [`meeco help [COMMAND]`](#meeco-help-command)
- [`meeco items:attach-file`](#meeco-itemsattach-file)
- [`meeco items:create`](#meeco-itemscreate)
- [`meeco items:create-config TEMPLATENAME`](#meeco-itemscreate-config-templatename)
- [`meeco items:create-thumbnail`](#meeco-itemscreate-thumbnail)
- [`meeco items:get ITEMID`](#meeco-itemsget-itemid)
- [`meeco items:get-attachment ITEMID SLOTID`](#meeco-itemsget-attachment-itemid-slotid)
- [`meeco items:get-thumbnail ITEMID SLOTID THUMBNAILID`](#meeco-itemsget-thumbnail-itemid-slotid-thumbnailid)
- [`meeco items:list`](#meeco-itemslist)
- [`meeco items:remove-slot SLOTID`](#meeco-itemsremove-slot-slotid)
- [`meeco items:update`](#meeco-itemsupdate)
- [`meeco organization-members:accept-invitation`](#meeco-organization-membersaccept-invitation)
- [`meeco organization-members:create-invitation [MEMBER_ROLE]`](#meeco-organization-memberscreate-invitation-member_role)
- [`meeco organization-members:delete ORGANIZATION_ID ID`](#meeco-organization-membersdelete-organization_id-id)
- [`meeco organization-members:list ORGANIZATION_ID`](#meeco-organization-memberslist-organization_id)
- [`meeco organization-members:update`](#meeco-organization-membersupdate)
- [`meeco organization-services:create ORGANIZATION_ID`](#meeco-organization-servicescreate-organization_id)
- [`meeco organization-services:get ORGANIZATION_ID SERVICE_ID`](#meeco-organization-servicesget-organization_id-service_id)
- [`meeco organization-services:list ORGANIZATION_ID`](#meeco-organization-serviceslist-organization_id)
- [`meeco organization-services:login`](#meeco-organization-serviceslogin)
- [`meeco organization-services:update ORGANIZATION_ID`](#meeco-organization-servicesupdate-organization_id)
- [`meeco organizations:create`](#meeco-organizationscreate)
- [`meeco organizations:delete ID`](#meeco-organizationsdelete-id)
- [`meeco organizations:get ID`](#meeco-organizationsget-id)
- [`meeco organizations:list`](#meeco-organizationslist)
- [`meeco organizations:login`](#meeco-organizationslogin)
- [`meeco organizations:update`](#meeco-organizationsupdate)
- [`meeco shares:accept SHAREID`](#meeco-sharesaccept-shareid)
- [`meeco shares:create [FILE]`](#meeco-sharescreate-file)
- [`meeco shares:create-config`](#meeco-sharescreate-config)
- [`meeco shares:delete SHAREID`](#meeco-sharesdelete-shareid)
- [`meeco shares:get-incoming SHAREID`](#meeco-sharesget-incoming-shareid)
- [`meeco shares:list`](#meeco-shareslist)
- [`meeco shares:update ITEMID`](#meeco-sharesupdate-itemid)
- [`meeco templates:info TEMPLATENAME`](#meeco-templatesinfo-templatename)
- [`meeco templates:list`](#meeco-templateslist)
- [`meeco users:create`](#meeco-userscreate)
- [`meeco users:get`](#meeco-usersget)
- [`meeco users:login`](#meeco-userslogin)
- [`meeco users:logout`](#meeco-userslogout)
- [`meeco version`](#meeco-version)

## `meeco client-task-queue:list`

Read Client Tasks assigned to the user

```
USAGE
  $ meeco client-task-queue:list -a <value> [-e <value>] [--delegationId <value>] [-l <value> | --all] [--update] [-s
    <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -l, --limit=<value>        Get at most 'limit' many Client Tasks
  -s, --state=<value>        Filter Client Tasks by execution state. Can take multiple values separated by commas.
                             Values can be (todo|in_progress|done|failed)
  --all                      Get all possible results from web API, possibly with multiple calls.
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of
  --update                   Set the state of retrieved "todo" Client Tasks to "in_progress" in the API

DESCRIPTION
  Read Client Tasks assigned to the user

EXAMPLES
  $ meeco client-task-queue:list --state failed --all

  $ meeco client-task-queue:list --update --state todo --limit 5
```

_See code: [src/commands/client-task-queue/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/client-task-queue/list.ts)_

## `meeco client-task-queue:run-batch`

Load and run Client Tasks from the queue

```
USAGE
  $ meeco client-task-queue:run-batch -a <value> [-e <value>] [--delegationId <value>] [-l <value> | --all] [-s
  todo|failed]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -l, --limit=<value>        Run at most 'limit' many Client Tasks. Defaults to the API page size (200)
  -s, --state=(todo|failed)  [default: todo] Run only Client Tasks with the given state
  --all                      Get all possible results from web API, possibly with multiple calls.
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Load and run Client Tasks from the queue

EXAMPLES
  $ meeco client-task-queue:run-batch --limit 10

  $ meeco client-task-queue:run-batch --all --state failed
```

_See code: [src/commands/client-task-queue/run-batch.ts](https://github.com/Meeco/cli/blob/master/src/commands/client-task-queue/run-batch.ts)_

## `meeco client-task-queue:update TASKS_FILE`

Set Client Task states using YAML file

```
USAGE
  $ meeco client-task-queue:update [TASKS_FILE] -a <value> [-e <value>] [--delegationId <value>] [--set
    todo|in_progress|done|failed]

ARGUMENTS
  TASKS_FILE  YAML file with a list of Client Tasks to update. Matches output format of client-task-queue:list

FLAGS
  -a, --auth=<value>                    (required) [default: .user.yaml] Authorization config yaml file (if not using
                                        the default .user.yaml)
  -e, --environment=<value>             [default: .environment.yaml] environment config file
  --delegationId=<value>                delegation id of the connection to perform the task on behalf of
  --set=(todo|in_progress|done|failed)  Set all Client Tasks to this state

DESCRIPTION
  Set Client Task states using YAML file

EXAMPLES
  $ meeco client-task-queue:update updated_tasks.yaml

  $ meeco client-task-queue:update --set done tasks.yaml
```

_See code: [src/commands/client-task-queue/update.ts](https://github.com/Meeco/cli/blob/master/src/commands/client-task-queue/update.ts)_

## `meeco connections:accept TOKEN`

Create a new connection from an invitation token

```
USAGE
  $ meeco connections:accept [TOKEN] -a <value> [-e <value>] [--delegationId <value>] [-n <value>]

ARGUMENTS
  TOKEN  Connection Invitation Token

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -n, --name=<value>         [default: anonymous] Name for new Connection
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Create a new connection from an invitation token
```

_See code: [src/commands/connections/accept.ts](https://github.com/Meeco/cli/blob/master/src/commands/connections/accept.ts)_

## `meeco connections:create`

Create a new connection between two users

```
USAGE
  $ meeco connections:create -c <value> [-e <value>]

FLAGS
  -c, --config=<value>       (required) Config file describing new connection
  -e, --environment=<value>  [default: .environment.yaml] environment config file

DESCRIPTION
  Create a new connection between two users
```

_See code: [src/commands/connections/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/connections/create.ts)_

## `meeco connections:create-config`

Scaffold a connection config file when given two users

```
USAGE
  $ meeco connections:create-config -f <value> -t <value> [-e <value>]

FLAGS
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -f, --from=<value>         (required) User config file for the 'from' user
  -t, --to=<value>           (required) User config file for the 'to' user

DESCRIPTION
  Scaffold a connection config file when given two users
```

_See code: [src/commands/connections/create-config.ts](https://github.com/Meeco/cli/blob/master/src/commands/connections/create-config.ts)_

## `meeco connections:list`

List connections for an authenticated user

```
USAGE
  $ meeco connections:list -a <value> [-e <value>] [--delegationId <value>] [--all]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --all                      Get all possible results from web API, possibly with multiple calls.
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  List connections for an authenticated user
```

_See code: [src/commands/connections/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/connections/list.ts)_

## `meeco delegations:accept-invitation RECIPIENT_NAME`

Accept a delegation inivitation aka create a delegation connection

```
USAGE
  $ meeco delegations:accept-invitation [RECIPIENT_NAME] -a <value> -c <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  RECIPIENT_NAME  Name of the user which the invitation is from

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -c, --config=<value>       (required) Delegation Invitation Config
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Accept a delegation inivitation aka create a delegation connection
```

_See code: [src/commands/delegations/accept-invitation.ts](https://github.com/Meeco/cli/blob/master/src/commands/delegations/accept-invitation.ts)_

## `meeco delegations:accept-kek CONNECTIONID`

Accept a shared KEK (key encryption key) with the from the user you are becoming a delegate for

```
USAGE
  $ meeco delegations:accept-kek [CONNECTIONID] -a <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  CONNECTIONID  id of the delegate connection

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Accept a shared KEK (key encryption key) with the from the user you are becoming a delegate for
```

_See code: [src/commands/delegations/accept-kek.ts](https://github.com/Meeco/cli/blob/master/src/commands/delegations/accept-kek.ts)_

## `meeco delegations:create-invitation RECIPIENT_NAME [DELEGATION_ROLE]`

Create a delegation inivitation for another user to become a delegate connection

```
USAGE
  $ meeco delegations:create-invitation [RECIPIENT_NAME] [DELEGATION_ROLE] -a <value> [-e <value>] [--delegationId
  <value>]

ARGUMENTS
  RECIPIENT_NAME   Name of the user which the invitation is to be sent to
  DELEGATION_ROLE  [default: reader] delegation roles available are: owner, admin, and reader (default: reader)

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Create a delegation inivitation for another user to become a delegate connection
```

_See code: [src/commands/delegations/create-invitation.ts](https://github.com/Meeco/cli/blob/master/src/commands/delegations/create-invitation.ts)_

## `meeco delegations:load-auth-config`

Create a delegation inivitation for another user to become a delegate connection

```
USAGE
  $ meeco delegations:load-auth-config -a <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Create a delegation inivitation for another user to become a delegate connection
```

_See code: [src/commands/delegations/load-auth-config.ts](https://github.com/Meeco/cli/blob/master/src/commands/delegations/load-auth-config.ts)_

## `meeco delegations:share-kek CONNECTIONID`

Share Users KEK (key encryption key) with the delegate user

```
USAGE
  $ meeco delegations:share-kek [CONNECTIONID] -a <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  CONNECTIONID  id of the delegate connection

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Share Users KEK (key encryption key) with the delegate user
```

_See code: [src/commands/delegations/share-kek.ts](https://github.com/Meeco/cli/blob/master/src/commands/delegations/share-kek.ts)_

## `meeco help [COMMAND]`

Display help for meeco.

```
USAGE
  $ meeco help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for meeco.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `meeco items:attach-file`

Encrypt and attach a file to an item

```
USAGE
  $ meeco items:attach-file -a <value> -c <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -c, --config=<value>       (required) file attachment config yaml
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Encrypt and attach a file to an item

EXAMPLES
  $ meeco items:attach-file -c ./file-attachment-config.yaml
```

_See code: [src/commands/items/attach-file.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/attach-file.ts)_

## `meeco items:create`

Create a new item for a user from a template

```
USAGE
  $ meeco items:create -a <value> -i <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -i, --item=<value>         (required) item yaml file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Create a new item for a user from a template

EXAMPLES
  $ meeco items:create -i path/to/item-config.yaml -a path/to/auth.yaml
```

_See code: [src/commands/items/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/create.ts)_

## `meeco items:create-config TEMPLATENAME`

Provide a template name to construct an item config file

```
USAGE
  $ meeco items:create-config [TEMPLATENAME] -a <value> [-e <value>] [--delegationId <value>] [-s <value>] [-n <value>]

ARGUMENTS
  TEMPLATENAME  Name of the template to use for the item

FLAGS
  -a, --auth=<value>                  (required) [default: .user.yaml] Authorization config yaml file (if not using the
                                      default .user.yaml)
  -e, --environment=<value>           [default: .environment.yaml] environment config file
  -n, --classificationName=<value>    Scope templates to a particular classification name
  -s, --classificationScheme=<value>  Scope templates to a particular classification scheme
  --delegationId=<value>              delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Provide a template name to construct an item config file

EXAMPLES
  $ meeco items:create-config password
```

_See code: [src/commands/items/create-config.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/create-config.ts)_

## `meeco items:create-thumbnail`

Encrypt and attach a thumbnail to an attachment

```
USAGE
  $ meeco items:create-thumbnail -a <value> -c <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -c, --config=<value>       (required) thumbnail config yaml
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Encrypt and attach a thumbnail to an attachment

EXAMPLES
  $ meeco items:create-thumbnail -c ./thumbnail-config.yaml
```

_See code: [src/commands/items/create-thumbnail.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/create-thumbnail.ts)_

## `meeco items:get ITEMID`

Get an item from the vault and decrypt its values

```
USAGE
  $ meeco items:get [ITEMID] -a <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Get an item from the vault and decrypt its values
```

_See code: [src/commands/items/get.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/get.ts)_

## `meeco items:get-attachment ITEMID SLOTID`

Download and decrypt an attachment by id

```
USAGE
  $ meeco items:get-attachment [ITEMID] [SLOTID] -a <value> -o <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  ITEMID  ID of the item the attachment slot is a part of
  SLOTID  ID of the slot the attachment is attached to

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -o, --outputPath=<value>   (required) output file path
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Download and decrypt an attachment by id

EXAMPLES
  $ meeco items:get-attachment my-attachment-item-id my-attachment-slot-id -o ./my-attachment.txt
```

_See code: [src/commands/items/get-attachment.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/get-attachment.ts)_

## `meeco items:get-thumbnail ITEMID SLOTID THUMBNAILID`

Download and decrypt an thumbnail by id

```
USAGE
  $ meeco items:get-thumbnail [ITEMID] [SLOTID] [THUMBNAILID] -a <value> -o <value> [-e <value>] [--delegationId
  <value>]

ARGUMENTS
  ITEMID       Id of item containing the slot of the attachment containing the thumbnail
  SLOTID       Id of the the slot of the attachment containing the thumbnail
  THUMBNAILID  ID of the thumbnail to download

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -o, --outputPath=<value>   (required) output file path
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Download and decrypt an thumbnail by id

EXAMPLES
  $ meeco items:get-thumbnail itemId slotId thumbnailId -o ./
```

_See code: [src/commands/items/get-thumbnail.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/get-thumbnail.ts)_

## `meeco items:list`

List the items that a user has in their vault

```
USAGE
  $ meeco items:list -a <value> [-e <value>] [--delegationId <value>] [--all] [--templateId <value>] [--scheme
    <value>] [--classification <value>] [--sharedWith <value>]

FLAGS
  -a, --auth=<value>           (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                               .user.yaml)
  -e, --environment=<value>    [default: .environment.yaml] environment config file
  --all                        Get all possible results from web API, possibly with multiple calls.
  --classification=<value>...  items with the given classification are fetched
  --delegationId=<value>       delegation id of the connection to perform the task on behalf of
  --scheme=<value>             items with the given scheme are fetched
  --sharedWith=<value>         item shared with provided user id are fetched. Works for items owned by the current user
                               as well as for items owned by someone else and on-shared by the current user.
  --templateId=<value>...      items with the given template ids are fetched

DESCRIPTION
  List the items that a user has in their vault

EXAMPLES
  $ meeco items:list -a path/to/auth.yaml

  $ meeco items:list --templateId e30a36a5-6cd3-4d58-b838-b3a96384beab --templateId e30a36a5-6cd3-4d58-b838-b3a96384beab -a path/to/auth.yaml

  $ meeco items:list --scheme esafe -a path/to/auth.yaml

  $ meeco items:list --classification pets --classification vehicles -a path/to/auth.yaml

  $ meeco items:list --sharedWith e30a36a5-6cd3-4d58-b838-b3a96384beab -a path/to/auth.yaml
```

_See code: [src/commands/items/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/list.ts)_

## `meeco items:remove-slot SLOTID`

Remove a slot from its associated item

```
USAGE
  $ meeco items:remove-slot [SLOTID] -a <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Remove a slot from its associated item

EXAMPLES
  $ meeco items:remove-slot slotId
```

_See code: [src/commands/items/remove-slot.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/remove-slot.ts)_

## `meeco items:update`

Update an item from the vault. For more detail, refers to README.md Update an Item section

```
USAGE
  $ meeco items:update -a <value> -i <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -i, --item=<value>         (required) Updated item yaml file. For more detail, refers to README.md Update an Item
                             section
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Update an item from the vault. For more detail, refers to README.md Update an Item section

EXAMPLES
  $ meeco items:update -i path/to/updated-item-config.yaml -a path/to/auth.yaml
```

_See code: [src/commands/items/update.ts](https://github.com/Meeco/cli/blob/master/src/commands/items/update.ts)_

## `meeco organization-members:accept-invitation`

Accept Invitation to become organization member.

```
USAGE
  $ meeco organization-members:accept-invitation -a <value> -i <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>              (required) [default: .user.yaml] Authorization config yaml file (if not using the
                                  default .user.yaml)
  -e, --environment=<value>       [default: .environment.yaml] environment config file
  -i, --invitationConfig=<value>  (required) member invitation yaml file
  --delegationId=<value>          delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Accept Invitation to become organization member.

EXAMPLES
  $ meeco organization-members:accept-invitation -i .my-member-invitation.yaml -a .user_2.yaml > .my-org-member-connection.yaml
```

_See code: [src/commands/organization-members/accept-invitation.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-members/accept-invitation.ts)_

## `meeco organization-members:create-invitation [MEMBER_ROLE]`

Create Invitation to invite other vault users as member of organization. This command is only accessible to organization agent.

```
USAGE
  $ meeco organization-members:create-invitation [MEMBER_ROLE] -a <value> -o <value> [-e <value>] [--delegationId
  <value>]

ARGUMENTS
  MEMBER_ROLE  [default: admin] Organization member avalible roles: Admin,Owner

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -o, --org=<value>          (required) organization yaml file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Create Invitation to invite other vault users as member of organization. This command is only accessible to
  organization agent.

EXAMPLES
  $ meeco organization-members:create-invitation -o .my-created-organization.yaml -a .my-org-login.yaml > .my-org-member-invitation.yaml
```

_See code: [src/commands/organization-members/create-invitation.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-members/create-invitation.ts)_

## `meeco organization-members:delete ORGANIZATION_ID ID`

Delete a member of an organization. This command is only accessible to organization owners. The system will not allow to delete the last owner of the organization.

```
USAGE
  $ meeco organization-members:delete [ORGANIZATION_ID] [ID] -a <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  ORGANIZATION_ID  ID of the Organization
  ID               user ID of the Member

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Delete a member of an organization. This command is only accessible to organization owners. The system will not allow
  to delete the last owner of the organization.

EXAMPLES
  $ meeco organization-members:delete <organization_id> <id>
```

_See code: [src/commands/organization-members/delete.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-members/delete.ts)_

## `meeco organization-members:list ORGANIZATION_ID`

List all members of an organization. This command is only accessible to organization owners.

```
USAGE
  $ meeco organization-members:list [ORGANIZATION_ID] -a <value> [-e <value>] [--delegationId <value>] [--all]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --all                      Get all possible results from web API, possibly with multiple calls.
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  List all members of an organization. This command is only accessible to organization owners.

EXAMPLES
  $ meeco organization-members:list <organization_id>
```

_See code: [src/commands/organization-members/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-members/list.ts)_

## `meeco organization-members:update`

Change the role of a member. This command is only accessible to organization owners. The system will not allow to demote the last owner of the organization.

```
USAGE
  $ meeco organization-members:update -a <value> -m <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>                      (required) [default: .user.yaml] Authorization config yaml file (if not using
                                          the default .user.yaml)
  -e, --environment=<value>               [default: .environment.yaml] environment config file
  -m, --organizationMemberConfig=<value>  (required) org member yaml file
  --delegationId=<value>                  delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Change the role of a member. This command is only accessible to organization owners. The system will not allow to
  demote the last owner of the organization.

EXAMPLES
  $ meeco organization-members:update -m .my-created-org-member.yaml
```

_See code: [src/commands/organization-members/update.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-members/update.ts)_

## `meeco organization-services:create ORGANIZATION_ID`

Request the creation of a new organization service. The organization service will remain in the 'requested' state until validated or rejected by meeco

```
USAGE
  $ meeco organization-services:create [ORGANIZATION_ID] -a <value> -c <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>                       (required) [default: .user.yaml] Authorization config yaml file (if not using
                                           the default .user.yaml)
  -c, --organizationServiceConfig=<value>  (required) organization service config file
  -e, --environment=<value>                [default: .environment.yaml] environment config file
  --delegationId=<value>                   delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Request the creation of a new organization service. The organization service will remain in the 'requested' state
  until validated or rejected by meeco

EXAMPLES
  $ meeco organization-services:create <organization_id> -c .my-service-config.yaml > .my-created-service.yaml
```

_See code: [src/commands/organization-services/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-services/create.ts)_

## `meeco organization-services:get ORGANIZATION_ID SERVICE_ID`

Retrieve a validated organization service. Only validated services are accessible.

```
USAGE
  $ meeco organization-services:get [ORGANIZATION_ID] [SERVICE_ID] -a <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Retrieve a validated organization service. Only validated services are accessible.

EXAMPLES
  $ meeco organization-services:get <organization_id> <service_id> > .my-created-service.yaml
```

_See code: [src/commands/organization-services/get.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-services/get.ts)_

## `meeco organization-services:list ORGANIZATION_ID`

List requested services for a given organization. Members of the organization with roles owner and admin can use this command to list the requested services for this organization.

```
USAGE
  $ meeco organization-services:list [ORGANIZATION_ID] -a <value> [-e <value>] [--delegationId <value>] [--all]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --all                      Get all possible results from web API, possibly with multiple calls.
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  List requested services for a given organization. Members of the organization with roles owner and admin can use this
  command to list the requested services for this organization.

EXAMPLES
  $ meeco organization-services:list <organization_id>
```

_See code: [src/commands/organization-services/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-services/list.ts)_

## `meeco organization-services:login`

Login as a service agent. An organization owner or admin can use this command to obtain a session token for the service agent.

```
USAGE
  $ meeco organization-services:login -a <value> -s <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>                       (required) [default: .user.yaml] Authorization config yaml file (if not using
                                           the default .user.yaml)
  -e, --environment=<value>                [default: .environment.yaml] environment config file
  -s, --organizationServiceConfig=<value>  (required) service yaml file
  --delegationId=<value>                   delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Login as a service agent. An organization owner or admin can use this command to obtain a session token for the
  service agent.

EXAMPLES
  $ meeco organization-services:login -s .my-created-service.yaml
```

_See code: [src/commands/organization-services/login.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-services/login.ts)_

## `meeco organization-services:update ORGANIZATION_ID`

Modify a requested organization service. Members of the organization with roles owner and admin can use this command to modify the requested service.

```
USAGE
  $ meeco organization-services:update [ORGANIZATION_ID] -a <value> -s <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>                       (required) [default: .user.yaml] Authorization config yaml file (if not using
                                           the default .user.yaml)
  -e, --environment=<value>                [default: .environment.yaml] environment config file
  -s, --organizationServiceConfig=<value>  (required) service yaml file
  --delegationId=<value>                   delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Modify a requested organization service. Members of the organization with roles owner and admin can use this command
  to modify the requested service.

EXAMPLES
  $ meeco organization-services:update <organization_id> -s .my-created-service.yaml
```

_See code: [src/commands/organization-services/update.ts](https://github.com/Meeco/cli/blob/master/src/commands/organization-services/update.ts)_

## `meeco organizations:create`

Request the creation of a new organization. The organization will remain in the 'requested' state until validated or rejected by meeco

```
USAGE
  $ meeco organizations:create -a <value> -c <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>                (required) [default: .user.yaml] Authorization config yaml file (if not using the
                                    default .user.yaml)
  -c, --organizationConfig=<value>  (required) organization config file
  -e, --environment=<value>         [default: .environment.yaml] environment config file
  --delegationId=<value>            delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Request the creation of a new organization. The organization will remain in the 'requested' state until validated or
  rejected by meeco

EXAMPLES
  $ meeco organizations:create -c .my-organization-config.yaml > .my-created-organization.yaml
```

_See code: [src/commands/organizations/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/organizations/create.ts)_

## `meeco organizations:delete ID`

Delete a requested organization. The user who requested the organization can use this command to delete the requested organization.

```
USAGE
  $ meeco organizations:delete [ID] -a <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  ID  ID of the Organization

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Delete a requested organization. The user who requested the organization can use this command to delete the requested
  organization.

EXAMPLES
  $ meeco organizations:delete <organization_id>
```

_See code: [src/commands/organizations/delete.ts](https://github.com/Meeco/cli/blob/master/src/commands/organizations/delete.ts)_

## `meeco organizations:get ID`

Retrieve a validated organization or requested organization by logged in user. Only all validated organizations or requested organization requested by logged in user are accessible.

```
USAGE
  $ meeco organizations:get [ID] -a <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Retrieve a validated organization or requested organization by logged in user. Only all validated organizations or
  requested organization requested by logged in user are accessible.

EXAMPLES
  $ meeco organizations:get <organization_id>
```

_See code: [src/commands/organizations/get.ts](https://github.com/Meeco/cli/blob/master/src/commands/organizations/get.ts)_

## `meeco organizations:list`

List organization. There are three modes: validated, requested and member

```
USAGE
  $ meeco organizations:list -a <value> [-e <value>] [--delegationId <value>] [--all] [-m validated|requested|member]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -m, --mode=<option>        [default: validated] There are three modes: validated, requested and member
                             validated - return all validated organizations
                             requested - list organizations in the requested state that the current user has requested
                             member - list organizations in which the current user is a member.
                             <options: validated|requested|member>
  --all                      Get all possible results from web API, possibly with multiple calls.
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  List organization. There are three modes: validated, requested and member

EXAMPLES
  $ meeco organizations:list -m requested
```

_See code: [src/commands/organizations/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/organizations/list.ts)_

## `meeco organizations:login`

Login as an organization agent. An organization agent is a non-human Vault user account acting on behalf of the organization. An organization owner can use this command to obtain a session token for the organization agent.

```
USAGE
  $ meeco organizations:login -a <value> -o <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -o, --org=<value>          (required) organization yaml file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Login as an organization agent. An organization agent is a non-human Vault user account acting on behalf of the
  organization. An organization owner can use this command to obtain a session token for the organization agent.

EXAMPLES
  $ meeco organizations:login -o .my-created-organization.yaml > .my-org-login.yaml
```

_See code: [src/commands/organizations/login.ts](https://github.com/Meeco/cli/blob/master/src/commands/organizations/login.ts)_

## `meeco organizations:update`

Modify a requested organization. The user who requested the organization can use this endpoint to modify the requested organization.

```
USAGE
  $ meeco organizations:update -a <value> -o <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -o, --org=<value>          (required) organization yaml file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Modify a requested organization. The user who requested the organization can use this endpoint to modify the requested
  organization.

EXAMPLES
  $ meeco organizations:update -o .my-updated-organization
```

_See code: [src/commands/organizations/update.ts](https://github.com/Meeco/cli/blob/master/src/commands/organizations/update.ts)_

## `meeco shares:accept SHAREID`

Accept an incoming share

```
USAGE
  $ meeco shares:accept [SHAREID] -a <value> [-e <value>] [--delegationId <value>] [-y]

ARGUMENTS
  SHAREID  ID of the share to accept

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -y, --yes                  Automatically agree to any terms required by the sharer
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Accept an incoming share
```

_See code: [src/commands/shares/accept.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/accept.ts)_

## `meeco shares:create [FILE]`

Share an item between two users

```
USAGE
  $ meeco shares:create [FILE] -c <value> [-e <value>] [--onshare] [--terms <value>] [-d <value>]

FLAGS
  -c, --config=<value>       (required) Share config file to use for setting up the share
  -d, --expiry_date=<value>  Share expiry date either ISO-8601 or yyyy-MM-dd short format e.g. 2020-12-31
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --onshare                  Allow all recipients of this share to share it again
  --terms=<value>            Share recipient must accept terms before viewing shared item.

DESCRIPTION
  Share an item between two users

EXAMPLES
  $ meeco shares:create -c share.yaml --terms "Don't tell Mum!" --expiry_date "2020-12-31"
```

_See code: [src/commands/shares/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/create.ts)_

## `meeco shares:create-config`

Provide two users and either an item id to construct a share config file

```
USAGE
  $ meeco shares:create-config -i <value> -f <value> -c <value> [-e <value>] [-s <value>]

FLAGS
  -c, --connection=<value>   (required) Connection config file
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -f, --from=<value>         (required) User config file for the 'from' user
  -i, --item=<value>         (required) Config file for the Item to share with the 'to' user. This may be a shared Item.
  -s, --slotName=<value>     Name of slot to share, if sharing a single slot

DESCRIPTION
  Provide two users and either an item id to construct a share config file
```

_See code: [src/commands/shares/create-config.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/create-config.ts)_

## `meeco shares:delete SHAREID`

Delete a share. Both the owner of the shared data and the recipient of the share can delete the share

```
USAGE
  $ meeco shares:delete [SHAREID] -a <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  SHAREID  ID of the share to delete

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Delete a share. Both the owner of the shared data and the recipient of the share can delete the share
```

_See code: [src/commands/shares/delete.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/delete.ts)_

## `meeco shares:get-incoming SHAREID`

Read an incoming share together with shared item, slots, and associated other data

```
USAGE
  $ meeco shares:get-incoming [SHAREID] -a <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  SHAREID  ID of the share to fetch

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Read an incoming share together with shared item, slots, and associated other data
```

_See code: [src/commands/shares/get-incoming.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/get-incoming.ts)_

## `meeco shares:list`

Get a list of incoming or outgoing shares for the specified user

```
USAGE
  $ meeco shares:list -a <value> [-e <value>] [--delegationId <value>] [--all] [-t incoming|outgoing]

FLAGS
  -a, --auth=<value>              (required) [default: .user.yaml] Authorization config yaml file (if not using the
                                  default .user.yaml)
  -e, --environment=<value>       [default: .environment.yaml] environment config file
  -t, --type=(incoming|outgoing)  [default: incoming] There are two types: incoming and outgoing
                                  incoming - Items shared with you
                                  outgoing - Items you have shared
  --all                           Get all possible results from web API, possibly with multiple calls.
  --delegationId=<value>          delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Get a list of incoming or outgoing shares for the specified user
```

_See code: [src/commands/shares/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/list.ts)_

## `meeco shares:update ITEMID`

Update all shared copies of an Item with the data in the original

```
USAGE
  $ meeco shares:update [ITEMID] -a <value> [-e <value>] [--delegationId <value>]

ARGUMENTS
  ITEMID  ID of the shared Item to update

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Update all shared copies of an Item with the data in the original
```

_See code: [src/commands/shares/update.ts](https://github.com/Meeco/cli/blob/master/src/commands/shares/update.ts)_

## `meeco templates:info TEMPLATENAME`

Get more information about an item template

```
USAGE
  $ meeco templates:info [TEMPLATENAME] -a <value> [-e <value>] [--delegationId <value>] [-s <value>] [-n <value>]

FLAGS
  -a, --auth=<value>                  (required) [default: .user.yaml] Authorization config yaml file (if not using the
                                      default .user.yaml)
  -e, --environment=<value>           [default: .environment.yaml] environment config file
  -n, --classificationName=<value>    Scope templates to a particular classification name
  -s, --classificationScheme=<value>  Scope templates to a particular classification scheme
  --delegationId=<value>              delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Get more information about an item template

EXAMPLES
  $ meeco templates:info password
```

_See code: [src/commands/templates/info.ts](https://github.com/Meeco/cli/blob/master/src/commands/templates/info.ts)_

## `meeco templates:list`

List all the available item templates

```
USAGE
  $ meeco templates:list -a <value> [-e <value>] [--delegationId <value>] [--all] [-s <value>] [-n <value>] [-l
    <value>]

FLAGS
  -a, --auth=<value>                  (required) [default: .user.yaml] Authorization config yaml file (if not using the
                                      default .user.yaml)
  -e, --environment=<value>           [default: .environment.yaml] environment config file
  -l, --label=<value>                 Search label text
  -n, --classificationName=<value>    Scope templates to a particular classification name
  -s, --classificationScheme=<value>  Scope templates to a particular classification scheme
  --all                               Get all possible results from web API, possibly with multiple calls.
  --delegationId=<value>              delegation id of the connection to perform the task on behalf of

DESCRIPTION
  List all the available item templates
```

_See code: [src/commands/templates/list.ts](https://github.com/Meeco/cli/blob/master/src/commands/templates/list.ts)_

## `meeco users:create`

Create a new Meeco user against the various microservices using only a password. Outputs an Authorization config file for use with future commands.

```
USAGE
  $ meeco users:create [-e <value>] [-p <value>] [--port <value>]

FLAGS
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -p, --password=<value>     Password to use for the new user (will be prompted for if not provided)
  --port=<value>             [default: 5210] Port to listen on for captcha response (optional - use if 5210 is reserved)

DESCRIPTION
  Create a new Meeco user against the various microservices using only a password. Outputs an Authorization config file
  for use with future commands.

EXAMPLES
  $ meeco users:create -p My$ecretPassword1
```

_See code: [src/commands/users/create.ts](https://github.com/Meeco/cli/blob/master/src/commands/users/create.ts)_

## `meeco users:get`

Fetch details about Meeco user from the various microservices.

```
USAGE
  $ meeco users:get [-e <value>] [-c <value> | -p <value> | -s <value>] [-a <value>]

FLAGS
  -a, --auth=<value>         [default: .user.yaml] Authorization config file (if not using the default .user.yaml or
                             password)
  -c, --user=<value>         [Deprecated] User config file (if not providing secret and password)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -p, --password=<value>     the password of the user (will be prompted for if not provided)
  -s, --secret=<value>       the secret key of the user (will be prompted for if not provided)

DESCRIPTION
  Fetch details about Meeco user from the various microservices.

EXAMPLES
  $ meeco users:get -p My$ecretPassword1 -s 1.xxxxxx.xxxx-xxxxx-xxxxxxx-xxxxx
```

_See code: [src/commands/users/get.ts](https://github.com/Meeco/cli/blob/master/src/commands/users/get.ts)_

## `meeco users:login`

Refresh tokens for Keystore and Vault for the given user. Outputs an Authorization config file for use with future commands.

```
USAGE
  $ meeco users:login [-e <value>] [-p <value> | ] [-s <value> | ] [-a <value>]

FLAGS
  -a, --auth=<value>         [default: .user.yaml] Authorization config file (if not using the default .user.yaml or
                             password)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  -p, --password=<value>     the password of the user (will be prompted for if not provided)
  -s, --secret=<value>       the secret key of the user (will be prompted for if not provided)

DESCRIPTION
  Refresh tokens for Keystore and Vault for the given user. Outputs an Authorization config file for use with future
  commands.

EXAMPLES
  $ meeco users:login -a path/to/stale-user-auth.yaml

  $ meeco users:login -p My$ecretPassword1 -s 1.xxxxxx.xxxx-xxxxx-xxxxxxx-xxxxx
```

_See code: [src/commands/users/login.ts](https://github.com/Meeco/cli/blob/master/src/commands/users/login.ts)_

## `meeco users:logout`

Log the given user out of both keystore and vault.

```
USAGE
  $ meeco users:logout -a <value> [-e <value>] [--delegationId <value>]

FLAGS
  -a, --auth=<value>         (required) [default: .user.yaml] Authorization config yaml file (if not using the default
                             .user.yaml)
  -e, --environment=<value>  [default: .environment.yaml] environment config file
  --delegationId=<value>     delegation id of the connection to perform the task on behalf of

DESCRIPTION
  Log the given user out of both keystore and vault.

EXAMPLES
  $ meeco users:logout -a path/to/user-auth.yaml
```

_See code: [src/commands/users/logout.ts](https://github.com/Meeco/cli/blob/master/src/commands/users/logout.ts)_

## `meeco version`

```
USAGE
  $ meeco version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v1.1.1/src/commands/version.ts)_

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

### Create

```yaml
kind: Item
metadata:
  template_name: <template name>
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

### Edit / Update

```yaml
kind: Item
spec:
  id: aaaaaaaa-bbbb-cccc-dddd-000000000000
  label: My Account
  name: my_account
  slots:
    # We only need to include the slots that we wish to change
    - name: password
      value: mySecretPassword1
    - name: my_custom
      _destroy: true # Flag a slot for deletion
```

## Organization

```yaml
kind: Organization
metadata:
spec:
  name: SuperData Inc.
  description: My super data handling organization
  url: https://superdata.example.com
  email: admin@superdata.example.com
```

## Share

```yaml
kind: Share
metadata:
spec:
  item_id: <string> # id of the item to be shared (all slots will be shared)
  connection_id: <string> # id of the connection the item will be shared with
  from:
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

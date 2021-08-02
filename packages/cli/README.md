# @subquery/cli

cli for polkagraph

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@subquery/cli.svg)](https://npmjs.org/package/@subquery/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@subquery/cli.svg)](https://npmjs.org/package/@subquery/cli)
[![License](https://img.shields.io/npm/l/@subquery/cli.svg)](https://github.com/packages/cli/blob/master/package.json)

<!-- toc -->
* [@subquery/cli](#subquerycli)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @subquery/cli
$ subquery COMMAND
running command...
$ subquery (-v|--version|version)
@subquery/cli/0.9.7 linux-x64 node-v16.0.0
$ subquery --help [COMMAND]
USAGE
  $ subquery COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`subquery build`](#subquery-build)
* [`subquery codegen`](#subquery-codegen)
* [`subquery help [COMMAND]`](#subquery-help-command)
* [`subquery init [PROJECTNAME]`](#subquery-init-projectname)
* [`subquery validate`](#subquery-validate)

## `subquery build`

Pack this SubQuery project

```
USAGE
  $ subquery build

OPTIONS
  -f, --force
  --file=file
```

_See code: [lib/commands/build.js](https://github.com/packages/cli/blob/v0.9.7/lib/commands/build.js)_

## `subquery codegen`

Generate schemas for graph node

```
USAGE
  $ subquery codegen

OPTIONS
  -f, --force
  --file=file
```

_See code: [lib/commands/codegen.js](https://github.com/packages/cli/blob/v0.9.7/lib/commands/codegen.js)_

## `subquery help [COMMAND]`

display help for subquery

```
USAGE
  $ subquery help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `subquery init [PROJECTNAME]`

Init a scaffold subquery project

```
USAGE
  $ subquery init [PROJECTNAME]

ARGUMENTS
  PROJECTNAME  Give the starter project name

OPTIONS
  -f, --force
  --starter
```

_See code: [lib/commands/init.js](https://github.com/packages/cli/blob/v0.9.7/lib/commands/init.js)_

## `subquery validate`

check a folder or github repo is a validate subquery project

```
USAGE
  $ subquery validate

OPTIONS
  -l, --location=location  local folder or github repo url
  --silent
```

_See code: [lib/commands/validate.js](https://github.com/packages/cli/blob/v0.9.7/lib/commands/validate.js)_
<!-- commandsstop -->

# @nexhub/vite-rspc-plugin

<span class="badge-githubworkflow">
<span class="badge-ci"><a href="https://npmjs.org/package/badges" title="CI Passing Status"><img src="https://github.com/NexRX/vite-rspc-plugin/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a></span>
<span class="badge-npmversion"><a href="https://npmjs.org/package/@nexhub/vite-rspc-plugin" title="View this project on NPM"><img src="https://img.shields.io/npm/v/%40nexhub%2Fvite-rspc-plugin" alt="NPM version" /></a></span>
<span class="badge-jsrversion"><a href="https://jsr.io/@nexhub/vite-rspc-plugin" title="View this project on JSR"><img src="https://img.shields.io/jsr/v/%40nexhub/vite-rspc-plugin" alt="JSR Version" /></a></span>
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/@nexhub/vite-rspc-plugin" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/%40nexhub%2Fvite-rspc-plugin" alt="NPM downloads" /></a></span>
<span class="badge-codeql"><a href="https://github.com/NexRX/vite-rspc-plugin/actions/workflows/github-code-scanning/codeql" title="CodeQL"><img src="https://github.com/NexRX/vite-rspc-plugin/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" /></a></span>
</span>

A Vite plugin for auto-generating dedicated functions for RSPC per query, mutation, and subscription with TypeScript.

## Description

This plugin simplifies the process of generating RPC (Remote Procedure Call) code from RSPC. It automatically generates TypeScript functions for each query, mutation, and subscription defined in your RSPC configuration. This ensures type safety and reduces boilerplate code in your Vite projects.

## Why

- **Type Safety**: Automatically generates TypeScript functions with proper types.
- **Reduce Boilerplate**: No need to manually write RPC functions.
- **Easy Integration**: Seamlessly integrates with Vite and RSPC.

## Getting Started

### Installation

To install the plugin, use one of the following command for your package manager:

```sh
# One of the following 
npm install -D @nexhub/vite-rspc-plugin

pnpm add -D @nexhub/vite-rspc-plugin

yarn add -D @nexhub/vite-rspc-plugin

bun add -D @nexhub/vite-rspc-plugin

deno install -D jsr:@nexhub/vite-rspc-plugin
```

### Usage

Next, in your vite.config.ts, you'll need to add and configure your plugin like so

```ts
import { defineConfig } from "vite";
import RSPC from "./vite-plugin-rspc";

export default defineConfig({
  plugins: [
    RSPC({
      input: "./src/types/backend.d.ts",
      client: {
        // Where your rspc is being served
        transport: "http://localhost:4000/rspc"
      },
      output: "./src/logic/backend.ts",
    }),
  ],
});
```

## Generated

The output in your configuration will look something like the following:

```ts

/* Auto-generated file - do not edit */
/* eslint-disable */

import type * as rpc from '/absolute/path/to/src/types/backend.d.ts';
import { createClient, FetchTransport, type Client } from "@rspc/client";

// Generated Client and Config
const transport = new FetchTransport("http://localhost:4000/rspc");
const clientConfig = {...{}, transport};
export const client = createClient<rpc.Procedures>(clientConfig);

/** 
 * query RPC call to `hello`
 * @param input {rpc.Info}
 * @returns {string}
 */
export function hello(input: rpc.Info) {
  return client.query(["hello", input]);
}

/** 
 * query RPC call to `user.list`
 * Takes no input
 * @returns {void}
 */
export function userList() {
  return client.query(["user.list"]);
}

/** 
 * query RPC call to `version`
 * Takes no input
 * @returns {string}
 */
export function version() {
  return client.query(["version"]);
}
```

Each RPC is its own function that can be imported and used however you like. If there is an overlap in names then you can specific a prefix or a default one will be used (query, mutation, subscribeTo)

It is recommened to *NOT* commit the generated file as it contains the aboslute path to the input file. At some point I may make it relative which will change this recommenedation.

## Configuration

The plugin accepts the following configuration options:

| Option                      | Type      | Description                                    | Default Value            |
|-----------------------------|-----------|------------------------------------------------|--------------------------|
| `input`                     | `string`  | The path to the RSPC types file.               | `undefined`              |
| `output`                    | `string`  | The path where the generated RPC code.         | `undefined`              |
| `client.transport`          | `string`  | The transport URL for the RPC client.          | `"http://localhost:4000/rspc"` (dev) or `"/rspc"` (prod) |
| `func.prefix.query`         | `string`  | Prefix for query functions.                    | `"query"`                |
| `func.prefix.mutation`      | `string`  | Prefix for mutation functions.                 | `"mutate"`               |
| `func.prefix.subscription`  | `string` | Prefix for subscription functions.              | `"subscribeTo"`          |
| `func.prefixDuplicatesOnly` | `boolean` | Whether to prefix only duplicate function names. | `true`                 |

These are only bespoke types. Client for example has more fields since it extends type `Client` in `@rspc/client`.
See `src/types.d.ts` for more insight if needed.

### Example Configuration

```ts
createRSPCPlugin({
  input: './path/to/rspc/types.d.ts',
  output: './path/to/generated/rpc.ts',
  client: {
    transport: '/api/rpc',
  },
  func: {
    prefix: {
      query: 'query',
      mutation: 'mutate',
      subscription: 'subscribeTo',
    },
    prefixDuplicatesOnly: true,
  },
});
```

## Contributing

Feel free to make a PR to main without asking,. I'm unlike to say no if its useful changes to someone. Security and linting checks will take place automatically via CI.

## Licence

This project is licensed under the MIT License
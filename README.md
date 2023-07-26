# @ryanccn/gql

A tiny GraphQL querying library.

## Installation

```console
$ npm install @ryanccn/gql
$ yarn add @ryanccn/gql
$ pnpm add @ryanccn/gql
```

## Usage

```typescript
import { createGql } from "@ryanccn/gql";

const gql = createGql("https://countries.trevorblades.com/");

const { success, data } = await gql`
	query {
		continents {
			name
		}
	}
`();
```

If your GraphQL client is named something else, you can also do

```typescript
import { createGql } from "@ryanccn/gql";

const gqlClient = createGql("https://countries.trevorblades.com/");

const { success, data } = await gqlClient.gql`
	query {
		continents {
			name
		}
	}
`();
```

to retain the DX benefits of the `gql` tag.

## License

MIT

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

## License

MIT

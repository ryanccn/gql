import { it, expect, vi, beforeAll } from "vitest";

import {
	graphql,
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLString,
} from "graphql";
import { createGql } from "./index.ts";

beforeAll(() => {
	const schema = new GraphQLSchema({
		query: new GraphQLObjectType({
			name: "RootQueryType",
			fields: {
				hello: {
					type: GraphQLString,
					args: {
						override: {
							type: GraphQLString,
						},
					},
					resolve(_, { override }: { override: string }) {
						if (override === "__vitest_error")
							throw new Error("__vitest_error");

						return override ?? "world";
					},
				},
			},
		}),
	});

	vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
		const request = new Request(input, init);

		switch (request.headers.get("x-vitest-behavior")) {
			case "server-error": {
				return new Response(null, { status: 500 });
			}

			case "malformed-response": {
				return new Response(null);
			}

			case "malformed-data": {
				return new Response(JSON.stringify({ __vitest_malformed_data: true }), {
					headers: {
						"content-type": "application/json;charset=utf-8",
					},
				});
			}
		}

		const { query, variables } = (await request.json()) as {
			query: string;
			variables?: Record<string, unknown>;
		};

		const result = await graphql({
			schema,
			source: query,
			variableValues: variables,
		});

		return new Response(JSON.stringify(result), {
			headers: {
				"content-type": "application/json;charset=utf-8",
			},
		});
	});
});

it("succeeds", async () => {
	const gql = createGql("http://vitest.local/graphql");

	const result = await gql`
		query {
			hello
		}
	`();

	expect(result).toMatchInlineSnapshot(`
		{
		  "data": {
		    "hello": "world",
		  },
		  "success": true,
		}
	`);
});

it("succeeds with `gql` key", async () => {
	const { gql } = createGql("http://vitest.local/graphql");

	const result = await gql`
		query {
			hello
		}
	`();

	expect(result).toMatchInlineSnapshot(`
		{
		  "data": {
		    "hello": "world",
		  },
		  "success": true,
		}
	`);
});

it("succeeds with variables", async () => {
	const { gql } = createGql("http://vitest.local/graphql");

	const result = await gql`
		query ($override: String!) {
			hello(override: $override)
		}
	`({ override: "vitest" });

	expect(result).toMatchInlineSnapshot(`
		{
		  "data": {
		    "hello": "vitest",
		  },
		  "success": true,
		}
	`);
});

it("fails with malformed query", async () => {
	const { gql } = createGql("http://vitest.local/graphql");

	const result = await gql`
		__vitest_malformed
	`();

	expect(result).toMatchInlineSnapshot(`
		{
		  "errors": [
		    {
		      "locations": [
		        {
		          "column": 3,
		          "line": 2,
		        },
		      ],
		      "message": "Syntax Error: Unexpected Name "__vitest_malformed".",
		    },
		  ],
		  "success": false,
		}
	`);
});

it("fails with GraphQL error", async () => {
	const { gql } = createGql("http://vitest.local/graphql");

	const result = await gql`
		query {
			hello(override: "__vitest_error")
		}
	`();

	expect(result).toMatchInlineSnapshot(`
		{
		  "data": {
		    "hello": null,
		  },
		  "errors": [
		    {
		      "locations": [
		        {
		          "column": 4,
		          "line": 3,
		        },
		      ],
		      "message": "__vitest_error",
		      "path": [
		        "hello",
		      ],
		    },
		  ],
		  "success": false,
		}
	`);
});

it("fails with server error", async () => {
	const { gql } = createGql("http://vitest.local/graphql", {
		headers: {
			"x-vitest-behavior": "server-error",
		},
	});

	const promise = gql`
		query {
			hello
		}
	`();

	await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
		`[Error: Received unexpected response from GraphQL API: 500]`,
	);
});

it("fails with malformed response", async () => {
	const { gql } = createGql("http://vitest.local/graphql", {
		headers: {
			"x-vitest-behavior": "malformed-response",
		},
	});

	const promise = gql`
		query {
			hello
		}
	`();

	await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
		`[SyntaxError: Unexpected end of JSON input]`,
	);
});

it("fails with malformed data", async () => {
	const { gql } = createGql("http://vitest.local/graphql", {
		headers: {
			"x-vitest-behavior": "malformed-data",
		},
	});

	const promise = gql`
		query {
			hello
		}
	`();

	await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
		`[Error: Received unexpected data from GraphQL API: {"__vitest_malformed_data":true}]`,
	);
});

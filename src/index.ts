export interface CreateGQLOptions {
	/**
	 * The HTTP method to use when sending the query
	 * @default POST
	 */
	method?: string;

	/**
	 * The headers to add to the query request.
	 *
	 * For instance, you can use this to add `Authorization` headers to make authenticated requests.
	 */
	headers?: HeadersInit;
}

/** A successful GraphQL response */
export interface GraphQLResponseSuccess<D, E> {
	/** Whether the request was successful */
	success: true;
	/** The data returned from the GraphQL API */
	data: D;
	/** The errors returned from the GraphQL API, if any */
	errors?: E;
}

/** A failed GraphQL response */
export interface GraphQLResponseFailure<D, E> {
	/** Whether the request was successful */
	success: false;
	/** The data returned from the GraphQL API */
	data?: D;
	/** The errors returned from the GraphQL API, if any */
	errors?: E;
}

/**
 * A GraphQL response, either successful or not
 *
 * Discriminate via the `success` key.
 */
export type GraphQLResponse<D, E> =
	| GraphQLResponseSuccess<D, E>
	| GraphQLResponseFailure<D, E>;

type MakeRecursiveGQL<F> = F & { gql: MakeRecursiveGQL<F> };

const never = (message: string) => {
	throw new Error(message);
};

/**
 * Creates a GraphQL template literal tag from a URL endpoint
 *
 * @param url The URL endpoint of the GraphQL API
 * @param options Options for the GraphQL instance
 * @returns A GraphQL template literal tag
 */
export const createGql = (url: string, options?: CreateGQLOptions) => {
	/**
	 * Creates a request function from a query template literal that can be called to get a response
	 *
	 * @param query The GraphQL query
	 * @param substitutions Substitutions (this is a template literal internal)
	 * @returns An async function for making the request
	 */
	const gqlFactory = (
		query: TemplateStringsArray,
		...substitutions: unknown[]
	) => {
		const interpolatedQuery = String.raw({ raw: query }, ...substitutions);

		/**
		 * Send the GraphQL request
		 *
		 * @param variables GraphQL variables to send to the GraphQL API
		 * @returns The response from the API
		 */
		const makeRequest = async (
			variables?: Record<string, unknown>,
		): Promise<GraphQLResponse<unknown, unknown>> => {
			const headers = new Headers(options?.headers);
			headers.set("content-type", "application/json;charset=utf-8");

			const response = await fetch(url, {
				method: options?.method ?? "POST",
				headers,
				body: JSON.stringify({
					query: interpolatedQuery,
					...(variables ? { variables } : {}),
				}),
			});

			if (!response.ok) {
				never(
					`Received unexpected response from GraphQL API: ${response.status}`,
				);
			}

			const result = (await response.json()) as {
				data?: unknown;
				errors?: unknown;
			};

			return "data" in result && (!("errors" in result) || !result.errors)
				? {
						success: true,
						data: result.data,
					}
				: "data" in result || "errors" in result
					? {
							success: false,
							...("data" in result ? { data: result.data } : {}),
							...("errors" in result ? { errors: result.errors } : {}),
						}
					: never(
							`Received unexpected data from GraphQL API: ${JSON.stringify(result)}`,
						);
		};

		return makeRequest;
	};

	Object.assign(gqlFactory, { gql: gqlFactory });
	return gqlFactory as MakeRecursiveGQL<typeof gqlFactory>;
};

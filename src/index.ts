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

/** A successful GraphQL response (i.e. 2xx status code) */
export interface GraphQLResponseSuccess<D> {
	/** Whether the request was successful */
	success: true;
	/** The data returned from the GraphQL API */
	data: D;
}

/** A failed GraphQL response */
export interface GraphQLResponseFailure<E> {
	/** Whether the request was successful */
	success: false;
	/** The parsed error returned, if any */
	error?: E;
	/** The raw Response returned from `fetch` */
	response?: Response;
}

/**
 * A GraphQL response, either successful or not
 *
 * Discriminate via the `success` key.
 */
export type GraphQLResponse<D, E> =
	| GraphQLResponseSuccess<D>
	| GraphQLResponseFailure<E>;

/**
 * Creates a GraphQL template literal tag from a URL endpoint and an optional set of options
 *
 * @param url The URL endpoint of the GraphQL API
 * @param options Options for the GraphQL instance
 * @returns A GraphQL template literal tag
 */
export const createGql = (url: string, options?: CreateGQLOptions) => {
	/**
	 * Creates a request async function from a query template literal that can be called to get a response
	 *
	 * @param query The GraphQL query
	 * @param substitutions Substitutions (this is a template literal internal)
	 * @returns An async function for making the request
	 */
	const gqlFactory = (
		query: TemplateStringsArray,
		...substitutions: unknown[]
	) => {
		const parsedQuery = String.raw({ raw: query }, ...substitutions);

		/**
		 * Makes the actual GraphQL request
		 *
		 * @param variables GraphQL variables to send additionally to the GraphQL API
		 * @returns The response from the API
		 */
		const makeRequest = async (
			variables?: Record<string, unknown>,
		): Promise<GraphQLResponse<unknown, unknown>> => {
			const res = await fetch(url, {
				method: options?.method ?? "POST",
				headers: { "Content-Type": "application/json", ...options?.headers },
				body: JSON.stringify({
					query: parsedQuery,
					...(variables ? { variables } : {}),
				}),
			});

			if (!res.ok) {
				return { success: false, response: res };
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const data = await res.json();

			return "data" in data
				? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					{ success: true, data: data.data }
				: // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					{ success: false, error: data.error };
		};

		return makeRequest;
	};

	const patchedGqlFactory = new Proxy(gqlFactory, {
		get: (target, key) => {
			if (key === "gql") return target;
			return key in target ? target[key as keyof typeof target] : undefined;
		},
	}) as typeof gqlFactory & { gql: typeof gqlFactory };

	return patchedGqlFactory;
};

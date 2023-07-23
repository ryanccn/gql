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
export interface GraphQLResponseSuccess<D extends unknown> {
	/** Whether the request was successful */
	success: true;
	/** The data returned from the GraphQL API */
	data: D;
}

/** A failed GraphQL response */
export interface GraphQLResponseFailure {
	/** Whether the request was successful */
	success: false;
	/** The raw Response returned from `fetch` */
	response: Response;
}

/**
 * A GraphQL response, either successful or not
 *
 * Discriminate via the `success` key.
 */
export type GraphQLResponse<D extends unknown> =
	| GraphQLResponseSuccess<D>
	| GraphQLResponseFailure;

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
	const h = (query: TemplateStringsArray, ...substitutions: unknown[]) => {
		const query2 = String.raw({ raw: query }, ...substitutions);

		/**
		 * Makes the actual GraphQL request
		 *
		 * @param variables GraphQL variables to send additionally to the GraphQL API
		 * @returns The response from the API
		 */
		const f = async (
			variables?: Record<string, unknown>,
		): Promise<GraphQLResponse<unknown>> => {
			const res = await fetch(url, {
				method: options?.method ?? "POST",
				headers: { "Content-Type": "application/json", ...options?.headers },
				body: JSON.stringify({
					query: query2,
					...(variables ? { variables } : {}),
				}),
			});

			if (!res.ok) {
				return { success: false, response: res };
			}

			return { success: true, data: (await res.json()) as unknown };
		};

		return f;
	};

	return h;
};

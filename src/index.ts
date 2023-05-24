interface CreateGQLOptions {
	method?: string;
	headers?: HeadersInit;
}

interface GraphQLResponseSuccess {
	success: true;
	data: unknown;
}
interface GraphQLResponseFailure {
	success: false;
	response: Response;
}
type GraphQLResponse = GraphQLResponseSuccess | GraphQLResponseFailure;

export const createGql = (url: string, options?: CreateGQLOptions) => {
	return async (
		a: TemplateStringsArray,
		...b: unknown[]
	): Promise<GraphQLResponse> => {
		const query = String.raw({ raw: a }, ...b);

		const res = await fetch(url, {
			method: options?.method ?? "POST",
			headers: { "Content-Type": "application/json", ...options?.headers },
			body: JSON.stringify({ query }),
		});

		if (!res.ok) {
			return { success: false, response: res };
		}

		return { success: true, data: (await res.json()) as unknown };
	};
};

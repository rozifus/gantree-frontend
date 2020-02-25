//https://www.apollographql.com/docs/react/v3.0-beta/api/core/ApolloClient/
// TODO: pending request mddleware.
import ApolloClient from "apollo-client";
import { gql as ApolloGQL } from 'apollo-boost';
import { createHttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { setContext } from 'apollo-link-context';
import { replace, location } from 'svelte-spa-router'

let client = null
let onGraphQLError
let onNetworkError

export const gql = ApolloGQL

export const configure = ({uri, token, ...props}) => {

	onGraphQLError = props.onGraphQLError
	onNetworkError = props.onNetworkError

	const httpLink = createHttpLink({ uri: uri || "/graphql"});
	
	const errorLink = onError(({ networkError, graphQLErrors}) => {
		if(graphQLErrors){
			//onGraphQLError && onGraphQLError(graphQLErrors[0])
		}

		if(networkError){
			//onNetworkError && onNetworkError(networkError)
		}
	});

	const authLink = setContext((_x, { headers }) => {
		let _token = token()

		return {
			headers: {
				...headers,
				authorization: _token ? `Bearer ${_token}` : "",
			}
		}
	});

	client = new ApolloClient({
		link: authLink.concat(errorLink.concat(httpLink)),
		cache: new InMemoryCache({addTypename: false}),
		defaultOptions: {
			watchQuery: {
				fetchPolicy: 'no-cache',
				errorPolicy: 'all',
			},
			query: {
				fetchPolicy: 'no-cache'
			}
		}
	});
}

export const awaitQuery = (q, options={}) => {
	return async () => {
		let result = await client.query({ query: ApolloGQL`${q}`, ...options})
		return Object.values(result.data)[0]
	}
};

export const query = async (q, variables={}, options={}) => new Promise(async (resolve, reject) => {
	try {
		let result = await client.query({ 
			query: ApolloGQL`${q}`, 
			variables: variables, 
			...options
		})

		if(result.errors){
			let error = {
				message: result.errors[0].message,
				code: result.errors[0].extensions.code
			}
			onGraphQLError && onGraphQLError(error)
			reject(error)
		}

		resolve(Object.values(result.data)[0])
	} 
	catch(e) {
		//console.log(e)
	}
});

export const mutation = async (q, options={}) => {
	let result = await client.mutate({ mutation: ApolloGQL`${q}`, ...options})
	return Object.values(result.data)[0]
};

export const queryOld = (q, options={}) => client.query({query: ApolloGQL`${q}`, ...options})

export default {
	//configure: configureGraphQL,
	query: query,
	queryOld: queryOld
}
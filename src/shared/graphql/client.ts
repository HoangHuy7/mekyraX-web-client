import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { getGraphqlEndpoint } from '@/shared/config/runtimeConfig';

const httpLink = new HttpLink({
  uri: () => getGraphqlEndpoint(),
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('casdoor_access_token');

  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

import type { DocumentNode, OperationVariables } from '@apollo/client/core';
import { apolloClient } from '@/shared/graphql/client';

const defaultErrorMessage = 'GraphQL request failed';

const getGraphQLError = (errors?: readonly { message: string }[]): string | null => {
  if (!errors || errors.length === 0) {
    return null;
  }
  return errors[0]?.message || defaultErrorMessage;
};

export const runQuery = async <
  TData,
  TVariables extends OperationVariables = OperationVariables
>(
  query: DocumentNode,
  variables?: TVariables
): Promise<TData> => {
  const response = await apolloClient.query<TData, TVariables>({
    query,
    variables,
    fetchPolicy: 'network-only',
  });

  const gqlError = getGraphQLError(response.errors);
  if (gqlError) {
    throw new Error(gqlError);
  }

  if (!response.data) {
    throw new Error(defaultErrorMessage);
  }

  return response.data;
};

export const runMutation = async <
  TData,
  TVariables extends OperationVariables = OperationVariables
>(
  mutation: DocumentNode,
  variables?: TVariables
): Promise<TData> => {
  const response = await apolloClient.mutate<TData, TVariables>({
    mutation,
    variables,
  });

  const gqlError = getGraphQLError(response.errors);
  if (gqlError) {
    throw new Error(gqlError);
  }

  if (!response.data) {
    throw new Error(defaultErrorMessage);
  }

  return response.data;
};

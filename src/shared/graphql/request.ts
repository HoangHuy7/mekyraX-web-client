import type { DocumentNode, OperationVariables } from '@apollo/client/core';
import { ElMessage } from 'element-plus';
import { apolloClient } from '@/shared/graphql/client';

const defaultErrorMessage = 'GraphQL request failed';

const getGraphQLError = (errors?: readonly { message: string }[]): string | null => {
  if (!errors || errors.length === 0) {
    return null;
  }
  return errors[0]?.message || defaultErrorMessage;
};

const isNetworkError = (err: unknown): boolean => {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('network') || msg.includes('failed to fetch') || msg.includes('load failed');
  }
  return false;
};

const handleError = (err: unknown): never => {
  if (isNetworkError(err)) {
    ElMessage.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  } else if (err instanceof Error) {
    ElMessage.error(err.message);
  } else {
    ElMessage.error(defaultErrorMessage);
  }
  throw err;
};

export const runQuery = async <
  TData,
  TVariables extends OperationVariables = OperationVariables
>(
  query: DocumentNode,
  variables?: TVariables
): Promise<TData> => {
  try {
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
  } catch (err) {
    return handleError(err);
  }
};

export const runMutation = async <
  TData,
  TVariables extends OperationVariables = OperationVariables
>(
  mutation: DocumentNode,
  variables?: TVariables
): Promise<TData> => {
  try {
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
  } catch (err) {
    return handleError(err);
  }
};

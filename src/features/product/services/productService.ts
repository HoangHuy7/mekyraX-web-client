import { gql } from '@apollo/client/core';
import { mapProduct, type GraphQLProduct, type PaginationInfo } from '@/shared/graphql/mappers';
import { runMutation, runQuery } from '@/shared/graphql/request';
import type { Product, ProductFilter, ProductMutationInput } from '@/features/product/types/product.types';

const PRODUCT_FRAGMENT = gql`
  fragment ProductFields on Product {
    id
    name
    category
    unit
    price
    cost_price
    stock_quantity
    barcode
    created_at
    updated_at
    img_url
  }
`;

const PRODUCTS_QUERY = gql`
  query Products($filter: ProductFilter, $pagination: PaginationInput) {
    products(filter: $filter, pagination: $pagination) {
      data {
        ...ProductFields
      }
      page_info {
        total
        page
        page_size
        has_next
      }
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_QUERY = gql`
  query Product($id: ID!) {
    product(id: $id) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

interface ProductsQueryResponse {
  products: {
    data: GraphQLProduct[];
    page_info: {
      total: number;
      page: number;
      page_size: number;
      has_next: boolean;
    };
  };
}

interface ProductQueryResponse {
  product: GraphQLProduct | null;
}

interface ProductMutationResponse {
  createProduct?: GraphQLProduct;
  updateProduct?: GraphQLProduct;
  deleteProduct?: boolean;
}

interface FetchProductsResult {
  items: Product[];
  pageInfo: PaginationInfo;
}

interface FetchProductsOptions {
  page?: number;
  pageSize?: number;
}

const toGraphQLDecimal = (value: number): string => value.toString();

const toCreateProductInput = (input: ProductMutationInput) => ({
  name: input.name,
  price: toGraphQLDecimal(input.price),
  category: input.category || null,
  unit: input.unit || null,
  cost_price: input.costPrice !== undefined ? toGraphQLDecimal(input.costPrice) : null,
  stock_quantity: input.stockQuantity ?? 0,
  barcode: input.barcode || null,
});

const toUpdateProductInput = (id: string, input: Partial<ProductMutationInput>) => ({
  id,
  ...(input.name !== undefined ? { name: input.name } : {}),
  ...(input.price !== undefined ? { price: toGraphQLDecimal(input.price) } : {}),
  ...(input.category !== undefined ? { category: input.category || null } : {}),
  ...(input.unit !== undefined ? { unit: input.unit || null } : {}),
  ...(input.costPrice !== undefined ? { cost_price: toGraphQLDecimal(input.costPrice) } : {}),
  ...(input.stockQuantity !== undefined ? { stock_quantity: input.stockQuantity } : {}),
  ...(input.barcode !== undefined ? { barcode: input.barcode || null } : {}),
});

export const productService = {
  async fetchProducts(
    filter?: ProductFilter,
    options: FetchProductsOptions = {}
  ): Promise<FetchProductsResult> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 10;
    const offset = Math.max(0, (page - 1) * pageSize);

    const data = await runQuery<ProductsQueryResponse>(PRODUCTS_QUERY, {
      filter: {
        search: filter?.search || null,
        min_price: filter?.minPrice !== undefined ? toGraphQLDecimal(filter.minPrice) : null,
        max_price: filter?.maxPrice !== undefined ? toGraphQLDecimal(filter.maxPrice) : null,
        category: filter?.category || null,
      },
      pagination: {
        offset,
        limit: pageSize,
      },
    });

    const items = (data.products?.data || []).map(mapProduct);

    return {
      items,
      pageInfo: {
        total: data.products?.page_info?.total ?? 0,
        page: data.products?.page_info?.page ?? 1,
        pageSize: data.products?.page_info?.page_size ?? items.length,
        hasNext: data.products?.page_info?.has_next ?? false,
      },
    };
  },

  async getProductById(id: string): Promise<Product | null> {
    const data = await runQuery<ProductQueryResponse>(PRODUCT_QUERY, { id });
    if (!data.product) {
      return null;
    }
    return mapProduct(data.product);
  },

  async createProduct(input: ProductMutationInput): Promise<Product> {
    const data = await runMutation<ProductMutationResponse>(CREATE_PRODUCT_MUTATION, {
      input: toCreateProductInput(input),
    });

    if (!data.createProduct) {
      throw new Error('Create product failed');
    }

    return mapProduct(data.createProduct);
  },

  async updateProduct(id: string, input: Partial<ProductMutationInput>): Promise<Product> {
    const data = await runMutation<ProductMutationResponse>(UPDATE_PRODUCT_MUTATION, {
      input: toUpdateProductInput(id, input),
    });

    if (!data.updateProduct) {
      throw new Error('Update product failed');
    }

    return mapProduct(data.updateProduct);
  },

  async deleteProduct(id: string): Promise<boolean> {
    const data = await runMutation<ProductMutationResponse>(DELETE_PRODUCT_MUTATION, { id });
    return Boolean(data.deleteProduct);
  },
};

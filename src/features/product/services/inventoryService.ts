import { gql } from '@apollo/client/core';
import { runMutation, runQuery } from '@/shared/graphql/request';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryLog {
  id: string;
  productId: string;
  type: 'import' | 'sale' | 'adjust';
  quantity: number;
  note?: string;
  createdAt?: string;
}

interface GQLInventoryLog {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  note?: string;
  created_at?: string;
}

// ─── Queries & Mutations ──────────────────────────────────────────────────────

const INVENTORY_LOGS_QUERY = gql`
  query InventoryLogs($filter: InventoryLogFilter, $pagination: PaginationInput) {
    inventoryLogs(filter: $filter, pagination: $pagination) {
      id
      product_id
      type
      quantity
      note
      created_at
    }
  }
`;

const CREATE_INVENTORY_LOG_MUTATION = gql`
  mutation CreateInventoryLog($input: CreateInventoryLogInput!) {
    createInventoryLog(input: $input) {
      id
      product_id
      type
      quantity
      note
      created_at
    }
  }
`;

// ─── Mapper ───────────────────────────────────────────────────────────────────

const mapLog = (g: GQLInventoryLog): InventoryLog => ({
  id: g.id,
  productId: g.product_id,
  type: g.type as InventoryLog['type'],
  quantity: g.quantity,
  note: g.note,
  createdAt: g.created_at,
});

// ─── Service ──────────────────────────────────────────────────────────────────

export const inventoryService = {
  async fetchLogs(productId?: string, limit = 20): Promise<InventoryLog[]> {
    const data = await runQuery<{ inventoryLogs: GQLInventoryLog[] }>(INVENTORY_LOGS_QUERY, {
      filter: productId ? { product_id: productId } : {},
      pagination: { offset: 0, limit },
    });
    return (data.inventoryLogs || []).map(mapLog);
  },

  async importStock(productId: string, quantity: number, note?: string): Promise<InventoryLog> {
    const data = await runMutation<{ createInventoryLog: GQLInventoryLog }>(
      CREATE_INVENTORY_LOG_MUTATION,
      {
        input: {
          product_id: productId,
          type: 'import',
          quantity,
          note: note || null,
        },
      }
    );
    if (!data.createInventoryLog) throw new Error('Nhập hàng thất bại');
    return mapLog(data.createInventoryLog);
  },
};

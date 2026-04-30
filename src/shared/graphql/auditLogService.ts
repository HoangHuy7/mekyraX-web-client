import { gql } from '@apollo/client/core';
import { runQuery } from '@/shared/graphql/request';
import {
  mapPageInfo,
  type GraphQLPageInfo,
  type PaginationInfo,
} from '@/shared/graphql/mappers';

export interface AuditLog {
  id: string;
  action: string;
  status?: string;
  feature?: string;
  entityType?: string;
  entityId?: string;
  oldData?: string;
  newData?: string;
  createdAt?: string;
  createdBy?: string;
  ipAddress?: string;
  requestId?: string;
}

export interface AuditLogFilter {
  entityType?: string;
  entityId?: string;
  feature?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

interface GraphQLAuditLog {
  id: string;
  action: string;
  status?: string | null;
  feature?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  old_data?: string | null;
  new_data?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  ip_address?: string | null;
  request_id?: string | null;
}

const AUDIT_LOGS_QUERY = gql`
  query AuditLogs($filter: AuditLogFilter, $pagination: PaginationInput) {
    auditLogs(filter: $filter, pagination: $pagination) {
      data {
        id
        action
        status
        feature
        entity_type
        entity_id
        old_data
        new_data
        created_at
        created_by
        ip_address
        request_id
      }
      pagination {
        total
        page
        page_size
        has_next
      }
    }
  }
`;

const toFilter = (f?: AuditLogFilter) => {
  if (!f) return undefined;
  return {
    entity_type: f.entityType,
    entity_id: f.entityId,
    feature: f.feature,
    action: f.action,
    from_date: f.fromDate,
    to_date: f.toDate,
  };
};

const mapLog = (l: GraphQLAuditLog): AuditLog => ({
  id: l.id,
  action: l.action,
  status: l.status ?? undefined,
  feature: l.feature ?? undefined,
  entityType: l.entity_type ?? undefined,
  entityId: l.entity_id ?? undefined,
  oldData: l.old_data ?? undefined,
  newData: l.new_data ?? undefined,
  createdAt: l.created_at ?? undefined,
  createdBy: l.created_by ?? undefined,
  ipAddress: l.ip_address ?? undefined,
  requestId: l.request_id ?? undefined,
});

interface FetchOpts {
  page?: number;
  pageSize?: number;
}

export const auditLogService = {
  async fetch(
    filter: AuditLogFilter,
    opts: FetchOpts = {}
  ): Promise<{ items: AuditLog[]; pageInfo: PaginationInfo }> {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const data = await runQuery<{
      auditLogs: { data: GraphQLAuditLog[]; pagination: GraphQLPageInfo };
    }>(AUDIT_LOGS_QUERY, {
      filter: toFilter(filter),
      pagination: { offset, limit: pageSize },
    });

    return {
      items: (data.auditLogs.data ?? []).map(mapLog),
      pageInfo: mapPageInfo(data.auditLogs.pagination),
    };
  },
};

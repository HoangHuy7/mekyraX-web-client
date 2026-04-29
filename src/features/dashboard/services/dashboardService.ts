import { gql } from '@apollo/client/core';
import { runQuery } from '@/shared/graphql/request';
import type { DashboardStats } from '@/features/dashboard/types/dashboard.types';

const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      total_products
      total_customers
      total_revenue
      total_debt
      debt_orders
      today_revenue
      today_orders
    }
  }
`;

interface GraphQLDashboardStats {
  total_products: number;
  total_customers: number;
  total_revenue: string | number;
  total_debt: string | number;
  debt_orders: number;
  today_revenue: string | number;
  today_orders: number;
}

function mapStats(raw: GraphQLDashboardStats): DashboardStats {
  return {
    totalProducts: raw.total_products,
    totalCustomers: raw.total_customers,
    totalRevenue: Number(raw.total_revenue),
    totalDebt: Number(raw.total_debt),
    debtOrders: raw.debt_orders,
    todayRevenue: Number(raw.today_revenue),
    todayOrders: raw.today_orders,
  };
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats | null> {
    const result = await runQuery<{ dashboardStats: GraphQLDashboardStats }>(
      DASHBOARD_STATS_QUERY,
    );
    if (!result?.dashboardStats) return null;
    return mapStats(result.dashboardStats);
  },
};

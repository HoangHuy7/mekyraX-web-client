import { gql } from '@apollo/client/core';
import { runQuery } from '@/shared/graphql/request';
import type { DashboardStats, DailySalesPoint, MonthlySalesPoint } from '@/features/dashboard/types/dashboard.types';

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

const SALES_BY_DAY_QUERY = gql`
  query SalesByDay($filter: SalesFilter, $pagination: PaginationInput) {
    salesByDay(filter: $filter, pagination: $pagination) {
      data {
        sale_date
        quantity
        total
      }
    }
  }
`;

const SALES_BY_MONTH_QUERY = gql`
  query SalesByMonth($filter: SalesFilter, $pagination: PaginationInput) {
    salesByMonth(filter: $filter, pagination: $pagination) {
      data {
        sale_month
        quantity
        total
      }
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

  async getSalesByDay(fromDate: Date, toDate: Date): Promise<DailySalesPoint[]> {
    const result = await runQuery<{
      salesByDay: { data: { sale_date: string; quantity: number; total: string }[] };
    }>(SALES_BY_DAY_QUERY, {
      filter: { from_date: fromDate.toISOString(), to_date: toDate.toISOString() },
      pagination: { limit: 30, offset: 0 },
    });
    return (result?.salesByDay?.data ?? []).map((d) => ({
      date: d.sale_date,
      quantity: d.quantity,
      total: Number(d.total),
    }));
  },

  async getSalesByMonth(year: number): Promise<MonthlySalesPoint[]> {
    const fromDate = new Date(year, 0, 1);
    const toDate = new Date(year, 11, 31);
    const result = await runQuery<{
      salesByMonth: { data: { sale_month: string; quantity: number; total: string }[] };
    }>(SALES_BY_MONTH_QUERY, {
      filter: { from_date: fromDate.toISOString(), to_date: toDate.toISOString() },
      pagination: { limit: 12, offset: 0 },
    });
    return (result?.salesByMonth?.data ?? []).map((d) => ({
      month: d.sale_month,
      quantity: d.quantity,
      total: Number(d.total),
    }));
  },
};

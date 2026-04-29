export interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  totalDebt: number;
  debtOrders: number;
  todayRevenue: number;
  todayOrders: number;
}

export interface DailySalesPoint {
  date: string;
  quantity: number;
  total: number;
}

export interface MonthlySalesPoint {
  month: string;
  quantity: number;
  total: number;
}

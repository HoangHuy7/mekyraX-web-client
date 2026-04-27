export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  totalDebt: number;
  createdAt?: string;
}

export interface CustomerFilter {
  search?: string;
  phone?: string;
}

export interface CustomerMutationInput {
  name: string;
  phone?: string;
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  idCard?: string;
  email?: string;
  imgUrl?: string;
  note?: string;
  totalDebt: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerFilter {
  search?: string;
  phone?: string;
  email?: string;
  idCard?: string;
  hasDebt?: boolean;
}

export interface CustomerMutationInput {
  name: string;
  phone?: string;
  address?: string;
  idCard?: string;
  email?: string;
  imgUrl?: string;
  note?: string;
}

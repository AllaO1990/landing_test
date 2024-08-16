export interface IdeaTarget {
  id: string;
  date: string | null;
  price: number;
  profit: number;
  profitPercent: number;
  amount: number;
  amountPercent: number;
  depositShare: number;
  checked: boolean;
}

export interface IdeaEntry {
  id: string;
  date: string | null;
  depositShare: number;
  price: number;
  quantity: number;
  totalPrice: number;
  checked: boolean;
}

export interface IdeaTotalTarget {
  profitPercent: number;
  profit: number;
  depositShare: number;
  amount: number;
}

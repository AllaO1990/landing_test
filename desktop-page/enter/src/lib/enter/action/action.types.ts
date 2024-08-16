export interface ActionEntryItem {
  id: string;
  date: string | null;
  price: number;
  quantity: number;
  totalPrice: number;
  depositShare: number;
}

export interface ActionTotalEntry {
  price: number;
  quantity: number;
  totalPrice: number;
  depositShare: number;
}

export interface ActionOutItem {
  id: string;
  date: string | null;
  price: number;
  quantity: number;
  totalPrice: number;
  profit: number;
  profitPercent: number;
  depositShare: number;
  broker: string | null;
}

export interface ActionTotalOut {
  price: number;
  quantity: number;
  totalPrice: number;
  profit: number;
  profitPercent: number;
  depositShare: number;
}

export interface ActionRemainder {
  price: number;
  totalPrice: number;
  quantity: number;
  profit: number;
  profitPercent: number;
  totalProfit: number;
  depositShare: number;
  broker: string | null;
}

export interface ActionResult {
  price: number;
  totalPrice: number;
  quantity: number;
  profit: number;
  profitPercent: number;
  totalProfit: number;
  depositShare: number;
  broker: string | null;
}

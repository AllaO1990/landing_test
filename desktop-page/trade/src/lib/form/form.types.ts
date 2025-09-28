export interface ControlValue {
  direction: boolean;
  instrumentId: string;
  orderType: { id: number; type: string } | null;
  price: number;
  total: number;
  commission: number;
  status: number;
  orderId: string | null;
  lot: number;
  lots: number;
  quantity: number;
  date: string | null;
}

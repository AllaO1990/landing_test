export interface ControlValue {
  direction: boolean;
  instrumentId: string;
  orderType: number | null;
  price: number;
  total: number;
  commission: number;
  status: number;
  orderId: string | null;
  lot: number;
  quantity: number;
  date: string | null;
}

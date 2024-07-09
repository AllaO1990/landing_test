export interface ResponsePositions {
  items: ResponsePosition[];
  total: number;
}

export interface ResponsePosition {
  id: number;
  createdAt: string;
  updatedAt: string;
  positionType: string;
  inPosition: boolean;
  inPositionQuantity: number;
  inPositionDepositShare: number;
  instrument: {
    id: string;
    source: string;
    ticker: string;
    name: string;
    type: string;
    exchange: string;
    realExchange: string;
    inSub: true;
    sector: string;
    currency: string;
  };
  lastPrice: number;
  minPriceIncrement: number;
  entry: { price: number; quantity: number; totalPrice: number; depositShare: number };
  targets: { price: number; amount: number; profitPercent: number; depositShare: number }[];
  stop: {
    price: number;
    lossPercent: number;
    depositShare: number;
    stopCandleDate: string;
  };
  strategy: { successProbability: number; type: string };
  author: string;
}

export interface Position extends ResponsePosition {
  priceIncrement: number;
  profit: number;
}

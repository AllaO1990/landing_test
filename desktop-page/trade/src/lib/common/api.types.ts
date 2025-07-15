export interface TradeSource {
  id: number;
  name: string;
}

export type TradeSources = TradeSource[];

export interface TradeAccount {
  accessLevel: string;
  accountId: string;
  availableMoney: [
    {
      currency: string;
      value: number;
    }
  ];
  name: string;
  status: string;
  type: string;
}

export type TradeAccounts = TradeAccount[];

export interface TradeTokenSource {
  name: string;
  sourceId: number;
  token: string;
}

export interface TradeToken {
  name: string;
  sourceId: number;
  tokenId: number;
}

export interface TradeOrderType {
  id: number;
  name: string;
}

export type TradeOrderTypes = TradeOrderType[];

export interface TradeOrder {
  orderId: string;
  requestId: string;
  orderRequestId: string;
  executionReportStatus: number;
  executionReportStatusText: string;
  lotsRequested: number;
  initialOrderPrice: {
    value: number;
    currency: string;
  };
  executedOrderPrice: {
    value: number;
    currency: string;
  };
  totalOrderAmount: {
    value: number;
    currency: string;
  };
  averagePositionPrice: {
    value: number;
    currency: string;
  };
  initialComission: {
    value: number;
    currency: string;
  };
  executedComisiion: {
    value: number;
    currency: string;
  };
  direction: number;
  directionText: string;
  initialSecurityPrice: {
    value: number;
    currency: string;
  };
  serviceComission: {
    value: number;
    currency: string;
  };
  currency: string;
  orderType: number;
  orderTypeText: string;
  orderDate: string;
  instrumentUid: string;
}

export type TradeOrders = TradeOrder[];

export interface TradeDirection {
  id: boolean;
  name: string;
}

export type TradeDirections = TradeDirection[];

export interface TradeOperation {
  cancelDate: string;
  cancelReason: string;
  comission: {
    currency: string;
    value: number;
  };
  currency: string;
  date: string;
  description: string;
  instrumentUid: string;
  name: string;
  operationId: string;
  payment: {
    currency: string;
    value: number;
  };
  positionUid: string;
  price: {
    currency: string;
    value: number;
  };
  quantity: number;
  quantityRest: number;
  state: number;
  stateText: string;
  type: number;
  typeText: string;
  yield: {
    currency: string;
    value: number;
  };
}

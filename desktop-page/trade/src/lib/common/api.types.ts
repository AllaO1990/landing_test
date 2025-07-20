export interface TradeSource {
  id: number;
  name: string;
}

export type TradeSources = TradeSource[];

export interface TradeAccount {
  accessLevel: string;
  accountId: string;
  availableMoney: TradeValue[];
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
  initialOrderPrice: TradeValue;
  executedOrderPrice: TradeValue;
  totalOrderAmount: TradeValue;
  averagePositionPrice: TradeValue;
  initialComission: TradeValue;
  executedComisiion: TradeValue;
  direction: number;
  directionText: string;
  initialSecurityPrice: TradeValue;
  serviceComission: TradeValue;
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
  comission: { currency: string; value: number };
  currency: string;
  date: string;
  description: string;
  instrumentUid: string;
  name: string;
  operationId: string;
  payment: { currency: string; value: number };
  positionUid: string;
  price: { currency: string; value: number };
  quantity: number;
  quantityRest: number;
  state: number;
  stateText: string;
  type: number;
  typeText: string;
  yield: { currency: string; value: number };
}

export type TradeOperations = TradeOperation[];

export interface TradePortfolio {
  totalAmountShares: TradeValue;
  totalAmountBonds: TradeValue;
  totalAmountEtf: TradeValue;
  totalAmountCurrencies: TradeValue;
  totalAmountFutures: TradeValue;
  expectedYield: number;
  positions: TradePosition[];
  accountId: string;
  totalAmountOptions: TradeValue;
  totalAmountSp: TradeValue;
  totalAmountPortfolio: TradeValue;
  virtualPositions: [];
}

export interface TradePosition {
  instrumentType: string;
  quantity: number;
  averagePositionPrice: TradeValue;
  expectedYield: number;
  currentNkd: null;
  currentPrice: TradeValue;
  averagePositionPriceFifo: TradeValue;
  blocked: boolean;
  blockedLots: number;
  positionUid: string;
  instrumentUid: string;
  varMargin: null;
  expectedYieldFifo: number;
}

export interface TradeValue {
  value: number;
  currency: string;
}

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

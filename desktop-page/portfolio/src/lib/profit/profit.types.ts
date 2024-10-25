export enum ProfitInfoEnum {
  TODAY = 'today',
  DEPOSITED = 'deposited',
  WITHDRAWN = 'withdrawn',
  COMMISSIONS = 'commissions',
  TURNOVER = 'turnover',
  TRANSACTIONS_COUNT = 'transactionsCount',
  PROFITABLE = 'profitable',
  UNPROFITABLE = 'unprofitable',
}

export type ProfitInputData = {
  info: {
    today: number | null;
    deposited: number | null;
    withdrawn: number | null;
    commissions: number | null;
    turnover: number | null;
    transactionsCount: number | null;
    profitable: number | null;
    unprofitable: number | null;
  };
  chart: {
    date: string;
    value: number;
  }[];
};

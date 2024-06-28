import { StockTimingEnums } from '../types/stock-timing';

export const STOCK_TIMING: { [key in StockTimingEnums]: string } = {
  [StockTimingEnums.INTRADAY]: 'Intraday',
  [StockTimingEnums.SWING]: 'Swing',
  [StockTimingEnums.INVESTING]: 'Investing',
};

export const STOCK_TIMING_LIST = [
  {
    id: StockTimingEnums.INTRADAY,
    name: STOCK_TIMING[StockTimingEnums.INTRADAY],
  },
  {
    id: StockTimingEnums.SWING,
    name: STOCK_TIMING[StockTimingEnums.SWING],
  },
  {
    id: StockTimingEnums.INVESTING,
    name: STOCK_TIMING[StockTimingEnums.INVESTING],
  },
];

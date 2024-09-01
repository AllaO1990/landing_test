import { Timeframe } from './timeframe';

export enum ColorIndicator {
  EMA10 = 'rgb(137, 14, 79)',
  EMA20 = 'rgb(106, 57, 181)',
  EMA30 = 'rgb(120, 122, 134)',
  EMA50 = 'rgb(0, 0, 0)',
  EMA100 = 'rgb(40, 99, 254)',
  EMA200 = 'rgb(242, 54, 69)',
  SMA10 = 'rgb(255, 151, 0)',
  SMA200 = 'rgb(247, 124, 128)',
}

export enum ColorConsolidation {
  CANDLE_INTERVAL_DAY = 'rgb(56,97,246)',
  CANDLE_INTERVAL_WEEK = 'rgb(144,49,170)',
  CANDLE_INTERVAL_MONTH = 'rgb(94,96,106)',
}

export const MAP_COLOR_CONSOLIDATION = {
  [Timeframe.CANDLE_INTERVAL_DAY]: ColorConsolidation.CANDLE_INTERVAL_DAY,
  [Timeframe.CANDLE_INTERVAL_WEEK]: ColorConsolidation.CANDLE_INTERVAL_WEEK,
  [Timeframe.CANDLE_INTERVAL_MONTH]: ColorConsolidation.CANDLE_INTERVAL_MONTH,
};

import { Timeframe } from 'types/timeframe';

export const CHART_EMA_LIST = [
  {
    name: 'EMA 10',
    value: 'ema10',
    order: 1,
    disabled: false,
  },
  {
    name: 'EMA 20',
    value: 'ema20',
    order: 2,
    disabled: false,
  },
  {
    name: 'EMA 30',
    value: 'ema30',
    order: 3,
    disabled: false,
  },
  {
    name: 'EMA 50',
    value: 'ema50',
    order: 4,
    disabled: false,
  },
  {
    name: 'EMA 100',
    value: 'ema100',
    order: 5,
    disabled: false,
  },
  {
    name: 'EMA 200',
    value: 'ema200',
    order: 6,
    disabled: false,
  },
];

export const CHART_SMA_LIST = [
  {
    name: 'SMA 10',
    value: 'sma10',
    order: 11,
    disabled: false,
  },
  {
    name: 'SMA 200',
    value: 'sma200',
    order: 12,
    disabled: false,
  },
];

export const CHART_ZONE_LIST = [
  {
    name: 'День',
    value: Timeframe.CANDLE_INTERVAL_DAY,
    order: 21,
    disabled: false,
  },
  {
    name: 'Неделя',
    value: Timeframe.CANDLE_INTERVAL_WEEK,
    order: 22,
    disabled: false,
  },
  {
    name: 'Месяц',
    value: Timeframe.CANDLE_INTERVAL_MONTH,
    order: 23,
    disabled: false,
  },
];

export const CHART_EMA_ICON = `'data:image/svg+xml,<svg viewBox="0 0 16 16" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"><text text-anchor="middle" x="50%" y="10px" fill="currentColor" style="font: 6px Tahoma">EMA</text></svg>'`;

export const CHART_SMA_ICON = `'data:image/svg+xml,<svg viewBox="0 0 16 16" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"><text text-anchor="middle" x="50%" y="10px" fill="currentColor" style="font: 6px Tahoma">SMA</text></svg>'`;

export const CHART_ATR_ICON = `'data:image/svg+xml,<svg viewBox="0 0 16 16" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"><text text-anchor="middle" x="50%" y="10px" fill="currentColor" style="font: 6px Tahoma">ATR</text></svg>'`;

export const CHART_ZONE_ICON = `'data:image/svg+xml,<svg viewBox="0 0 16 16" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"><text text-anchor="middle" x="50%" y="10px" fill="currentColor" style="font: 6px Tahoma">ZONE</text></svg>'`;

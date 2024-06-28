import { StockPositionType } from '../types/stock-position-type';

export const STOCK_POSITION_TYPE: { [key in StockPositionType]: string } = {
  [StockPositionType.LONG]: 'Лонг',
  [StockPositionType.SHORT]: 'Шорт',
};

export const STOCK_POSITION_TYPE_LIST: {
  id: StockPositionType;
  name: string;
}[] = [
  {
    id: StockPositionType.LONG,
    name: STOCK_POSITION_TYPE[StockPositionType.LONG],
  },
  {
    id: StockPositionType.SHORT,
    name: STOCK_POSITION_TYPE[StockPositionType.SHORT],
  },
];

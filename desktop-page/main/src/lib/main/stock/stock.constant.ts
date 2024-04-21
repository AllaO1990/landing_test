import {StockGroup, StockGroupType} from "types/stock";

export const STOCK_LIST_HEADER: { name: string; label: string }[] = [
  {name: 'ticker', label: 'Тикер'},
  {name: 'sector', label: 'Сектор'},
  {name: 'price', label: 'Цена'},
  {name: 'change', label: 'Изм.'},
  {name: 'change-percent', label: 'Изм. в %'},
];

export const STOCK_GROUPS: StockGroup[] = [
  {
    id: 'moex',
    name: 'Акции Московской биржи',
    type: StockGroupType.DEFAULT,
  },
  {
    id: 'futures',
    name: 'Фьючерсы Московской биржи',
    type: StockGroupType.DEFAULT,
  },
  {
    id: 'currency',
    name: 'Валюта Московской биржи',
    type: StockGroupType.DEFAULT,
  },
  {
    id: 'metal',
    name: 'Металлы Московской биржи',
    type: StockGroupType.DEFAULT,
  },
];

export const STOCK_MAPPER: { [key: string]: string } = {
  // 'moex_close': 'moex',
  MOEX_WEEKEND: 'moex',
  MOEX_EVENING_WEEKEND: 'moex',
  FORTS_EVENING: 'futures',
  FX: 'currency',
  FX_MTL: 'metal',
  MOEX_PLUS: 'moex',
  MOEX: 'moex',
};

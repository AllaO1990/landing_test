export const STOCK_LIST_HEADER: { name: string; label: string }[] = [
  { name: 'ticker', label: 'Тикер' },
  // { name: 'sector', label: 'Сектор' },
  { name: 'price', label: 'Цена' },
  { name: 'change', label: 'Изм.' },
  { name: 'change-percent', label: 'Изм. в %' },
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
  binance: 'crypto',
};

const item = {
  symbol: 'IMOEX',
  price: 2734.83,
  change: -0.0008,
  percent: -0.01,
  sector: 'it',
};

export const DATA_INPUT = Array.from({ length: 100 }, () => item);

export const STOCK_LIST_HEADER: { name: string; label: string }[] = [
  { name: 'ticker', label: 'Тикер' },
  { name: 'sector', label: 'Сектор' },
  { name: 'cost', label: 'Цена' },
];

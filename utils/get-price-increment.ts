import { getNumberFromE } from './get-number-from-e';

export const getPriceIncrement = (minPriceIncrement: number): number => {
  const split = getNumberFromE(minPriceIncrement).split('.');

  return split[1] ? split[1].length : 0;
};

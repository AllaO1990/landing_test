import { Position } from 'types/position';

export const searchPosition = (list: Position[] | null, search: string | null): Position[] | null => {
  if (list === null) {
    return list;
  }

  if (!search) {
    return list;
  }

  return list.filter((item: Position) => {
    const concat = [item.instrument.ticker, item.instrument.name].map((item: string) => item.toLowerCase()).join('⁂');

    return concat.indexOf(search) !== -1;
  });
};

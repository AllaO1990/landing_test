export const breakArray = <T>(list: T[], limit: number = 10): T[][] => {
  let row: T[] = [];
  return list.reduce((acc: T[][], item: T, index: number) => {
    if (index === 0) {
      row.push(item);
      return acc;
    }

    if (index % limit !== 0) {
      row.push(item);
    } else {
      acc.push(row);
      row = [item];
    }

    if (index === list.length - 1) {
      acc.push(row);
    }

    return acc;
  }, []);
};

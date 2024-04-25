export const sortText = (a: string, b: string): -1 | 0 | 1 => {
  const nameA: string = (a).toUpperCase();
  const nameB: string = (b).toUpperCase();

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0;
};

export const sortNumber = (a: number, b: number): number => {
  return b - a;
};

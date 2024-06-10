export const getNumberFromE = (numb: number): string => {
  const numbString: string = numb.toString(10);

  if (numbString.indexOf('e') !== -1) {
    const exponent = parseInt(numbString.split('-')[1], 10);
    return numb.toFixed(exponent);
  }

  return numbString;
};

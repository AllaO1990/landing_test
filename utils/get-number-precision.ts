export const getNumberPrecision = (number: number, precision: number): number => {
  if (number === 0) {
    return +number.toFixed(precision);
  }

  const d = Math.pow(10, precision);

  return +(Math.round(number * d) / d).toFixed(precision);
};

export const getNumberPrecision = (number: number, precision: number): number => {
  const d = Math.pow(10, precision);

  return +(Math.round(number * d) / d).toFixed(precision);
};

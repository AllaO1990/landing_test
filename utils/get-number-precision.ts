export const getNumberPrecision = (
	number: number,
	precision: number,
	method: 'round' | 'ceil' | 'floor' = 'round'
): number => {
	if (number === 0) {
		return +number.toFixed(precision);
	}

	const d = Math.pow(10, precision);

	return +(Math[method](number * d) / d).toFixed(precision);
};

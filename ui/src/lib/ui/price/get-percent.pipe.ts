import {Pipe, PipeTransform} from '@angular/core';
import {WithLastPrice} from 'types/stock';
import {getNumberPrecision} from 'utils/get-number-precision';

@Pipe({
	name: 'getPercentFromWithLastPrice',
	standalone: true,
})
export class GetPercent implements PipeTransform {
	transform(value: WithLastPrice, precision = 2, method: 'round' | 'ceil' | 'floor' = 'round'): number {
		return getNumberPrecision((100 * (value.last - value.prev)) / value.prev, precision, method);
	}
}

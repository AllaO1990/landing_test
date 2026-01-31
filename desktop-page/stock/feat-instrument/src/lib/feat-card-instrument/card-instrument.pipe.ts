import { Pipe, PipeTransform } from '@angular/core';
import { getPriceIncrement } from 'utils/get-price-increment';

@Pipe({
	name: 'getPriceIncrement',
	standalone: true,
})
export class GetPriceIncrement implements PipeTransform {
	transform(value: number, ...args: any[]): number {
		return getPriceIncrement(value);
	}
}

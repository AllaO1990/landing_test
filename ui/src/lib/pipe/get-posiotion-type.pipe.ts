import { Pipe, PipeTransform } from '@angular/core';
import { STOCK_POSITION_TYPE } from 'constants/stock-position-type';
import { StockPositionType } from 'types/stock-position-type';

@Pipe({
	name: 'getNamePositionType',
	standalone: true,
})
export class GetPositionTypePipe implements PipeTransform {
	positionType = STOCK_POSITION_TYPE;

	transform(value: string): string {
		if (value === StockPositionType.LONG || value === StockPositionType.SHORT) {
			return this.positionType[value as StockPositionType];
		}

		return '';
	}
}

import { Pipe, PipeTransform } from '@angular/core';
import { STOCK_POSITION_TYPE } from 'constants/stock-position-type';
import { StockPosition } from 'types/position';

@Pipe({
	name: 'getPositionDirection',
	standalone: true,
})
export class GetPositionDirectionPipe implements PipeTransform {
	transform(position: StockPosition | null): boolean {
		if (!position) {
			return true;
		}

		return position.idea.positionType === STOCK_POSITION_TYPE.long;
	}
}

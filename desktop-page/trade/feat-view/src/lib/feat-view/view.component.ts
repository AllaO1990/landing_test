import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TradeOrders } from '@data-access-trade/types';

@Component({
	selector: 'trade-view',
	imports: [],
	templateUrl: './view.component.html',
	styleUrl: './view.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent {
	readonly orders$: Observable<TradeOrders> = of([]);
}

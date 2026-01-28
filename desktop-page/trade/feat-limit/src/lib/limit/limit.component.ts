import { ChangeDetectionStrategy, Component, effect, inject, input, InputSignal } from '@angular/core';
import { LimitStore } from './limit.store';
import { ApiTradeService } from '@data-access-trade/api.service';
import { filter, map, Observable, switchMap } from 'rxjs';
import { TuiAppearance } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TradeLimit } from '@data-access-trade/types';
import { AsyncPipe } from '@angular/common';
import { TuiSkeleton } from '@taiga-ui/kit';
import { LoaderComponent } from '@ui/components/loader';

@Component({
	selector: 'trade-limit',
	imports: [TuiAppearance, TuiCardLarge, AsyncPipe, TuiSkeleton, LoaderComponent],
	templateUrl: './limit.component.html',
	styleUrl: './limit.component.scss',
	providers: [
		ApiTradeService,
		{
			provide: LimitStore,
			useFactory: (api: ApiTradeService) => new LimitStore(api),
			deps: [ApiTradeService],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LimitComponent {
	readonly #store: LimitStore = inject(LimitStore);

	readonly limit$: Observable<TradeLimit | null> = this.#store.limit$;
	readonly isLoading$: Observable<boolean | null> = this.#store.isLoaded$.pipe(
		filter((isLoaded: boolean | null) => isLoaded === true),
		switchMap(() => this.#store.isLoading$),
		map((isLoading: boolean | null) => !isLoading)
	);
	readonly isLoaded$: Observable<boolean | null> = this.#store.isLoaded$.pipe(
		map((isLoaded: boolean | null) => !isLoaded)
	);

	readonly currency: InputSignal<number | null> = input<number | null>(null);

	constructor() {
		effect(() => {
			const currency = this.currency();

			if (currency !== null) {
				this.#store.loadLimit(currency);
			}
		});
	}
}

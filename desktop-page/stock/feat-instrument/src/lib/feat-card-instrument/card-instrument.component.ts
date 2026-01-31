import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	input,
	InputSignal,
	Signal,
} from '@angular/core';
import { StockInstrument, StockPrice, WithLastPrice } from 'types/stock';
import { IconTickerComponent } from '@ui/components/icon-ticker';
import { TuiFormatNumberPipe, TuiHint } from '@taiga-ui/core';
import { ApiStockService } from '@data-access-stock/api.service';
import { filter, map, Observable, startWith, switchMap, timer } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Response } from 'types/response';
import { AsyncPipe } from '@angular/common';
import { getPriceIncrement } from 'utils/get-price-increment';
import { TuiSkeleton } from '@taiga-ui/kit';
import { GetPriceIncrement } from './card-instrument.pipe';

const INTERVAL = 60 * 1000;

@Component({
	selector: 'stock-card-instrument',
	imports: [IconTickerComponent, TuiHint, AsyncPipe, TuiFormatNumberPipe, TuiSkeleton, GetPriceIncrement],
	templateUrl: './card-instrument.component.html',
	styleUrl: './card-instrument.component.scss',
	providers: [ApiStockService],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockCardInstrument {
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #api: ApiStockService = inject(ApiStockService);

	readonly instrument: InputSignal<StockInstrument | null> = input<StockInstrument | null>(null);

	readonly skeleton: Signal<boolean> = computed(() => !this.instrument());
	readonly currency: Signal<string | null> = computed(() => {
		const instrument = this.instrument();

		return instrument ? instrument.currencySymbol : null;
	});
	readonly ticker: Signal<string | null> = computed(() => {
		const instrument = this.instrument();

		return instrument ? instrument.ticker : null;
	});
	readonly name: Signal<string | null> = computed(() => {
		const instrument = this.instrument();

		return instrument ? instrument.name : null;
	});
	readonly sector: Signal<string | null> = computed(() => {
		const instrument = this.instrument();

		return instrument ? instrument.sector : null;
	});
	readonly precision: Signal<number | null> = computed(() => {
		const instrument = this.instrument();

		return instrument ? getPriceIncrement(instrument.minPriceIncrement) : null;
	});

	readonly price$: Observable<WithLastPrice | null> = toObservable(this.instrument).pipe(
		takeUntilDestroyed(this.#destroyRef),
		filter((instrument: StockInstrument | null) => instrument !== null),
		switchMap((instrument: StockInstrument) =>
			timer(0, INTERVAL)
				.pipe(switchMap(() => this.#api.getStockPrice([instrument.id])))
				.pipe(map((response: Response<StockPrice<WithLastPrice>>) => response.data[instrument.id]))
		),
		startWith({ prev: 0, minPriceIncrement: 0, last: 0 })
	);
}

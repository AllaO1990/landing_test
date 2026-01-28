import { DestroyRef, inject, Pipe, PipeTransform } from '@angular/core';
import { TradeStore } from './store';
import { map, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeDirection, TradeDirections } from '@data-access-trade/types';

@Pipe({
	name: 'tradeDirectionType',
	standalone: true,
})
export class DirectionTypePipe implements PipeTransform {
	readonly #store: TradeStore = inject(TradeStore);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly #directionTypes = this.#store.directionTypes$.pipe();

	transform(value: boolean | number, ...args: any[]): Observable<string | null> {
		return this.#directionTypes.pipe(
			takeUntilDestroyed(this.#destroyRef),
			map((list: TradeDirections | null) => {
				if (!list) {
					return null;
				}

				const type = list.find((item: TradeDirection) => item.id === !!value);

				return type ? type.name : null;
			})
		);
	}
}

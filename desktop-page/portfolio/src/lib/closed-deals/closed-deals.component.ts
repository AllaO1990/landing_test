import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { WrapperTableComponent } from './table/table.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { StockInstrument } from 'types/stock';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { AsyncPipe } from '@angular/common';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { combineLatest, debounceTime, filter, Observable, of, shareReplay, startWith, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { CLOSED_DEALS_CONSTANTS } from './constants';
import { Params } from '@angular/router';

type ListItem = { value: string; id: string | null };

@Component({
	selector: 'portfolio-closed-deals',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiTextfield,
		TuiChevron,
		TuiSelect,
		TuiDataListWrapper,
		AsyncPipe,
		TuiButton,
		SearchDialogDirective,
		WrapperTableComponent,
	],
	templateUrl: './closed-deals.component.html',
	styleUrl: './closed-deals.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedDealsComponent {
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);

	protected readonly constants = CLOSED_DEALS_CONSTANTS;
	readonly size = 's';
	readonly formControl: FormControl = new FormControl(null);
	readonly controlSearch: FormControl = new FormControl(null);
	readonly controlTransaction: FormControl = new FormControl(null);

	readonly params$: Observable<Params> = combineLatest([
		this.controlSearch.valueChanges.pipe(
			startWith(this.controlSearch.value),
			map((value: string | null) => ({ query: value }))
		),
		this.controlTransaction.valueChanges.pipe(
			startWith(this.controlTransaction.value),
			filter((value) => value !== null),
			map((value: { id: string }) => ({ dealType: value.id }))
		),
	]).pipe(
		debounceTime(0),
		map(([search, transaction]) => ({ ...search, ...transaction }))
	);

	readonly transaction$: Observable<ListItem[]> = of([
		{ value: 'Все', id: 'all' },
		{ value: 'Открытые', id: 'open' },
		{ value: 'Закрытые', id: 'closed' },
	]).pipe(
		tap((list: ListItem[]) => {
			if (list !== null && list.length > 0 && this.controlTransaction.value === null) {
				this.controlTransaction.patchValue(list[0]);
			}
		}),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	readonly stringifyTransaction = signal((x: ListItem) => x.value);
	readonly identityMatcherTransaction = signal((a: ListItem, b: ListItem) => a.id === b.id);

	onOpenDialog(event: StockInstrument | null): void {
		if (event) {
			this.#queryParams.update({
				type: EventSelected.STOCK_LIST,
				id: event.id,
				dialog: 'visible',
			});
		}
	}
}

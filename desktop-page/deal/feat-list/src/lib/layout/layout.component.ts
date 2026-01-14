import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	input,
	InputSignal,
	Signal,
	signal,
	WritableSignal,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ACTION_EVENTS } from 'tokens/desktop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterDealListComponent } from '../filter/filter.component';
import { debounceTime, distinctUntilChanged, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockInstrument } from 'types/stock';
import {
	TuiButton,
	TuiDataList,
	TuiDropdown,
	TuiFormatNumberPipe,
	TuiHint,
	TuiIcon,
	TuiNumberFormatSettings,
	TuiPopup,
	TuiTextfield,
} from '@taiga-ui/core';
import { TuiBadgedContent, TuiBadgeNotification, TuiDrawer, TuiSkeleton } from '@taiga-ui/kit';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { UiList, UiListItem } from '@ui/components/list';
import {
	AccountBroker,
	AccountCurrency,
	AccountDealType,
	AccountRange,
	AccountStrategy,
	AccountType,
} from 'types/account';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColorPriceDirective } from '@ui/components/price';
import { DataAccessDealState } from '@data-access-deal/store';
import { DEAL_CONSTANTS } from '@data-access-deal/constants';
import { GetDatePassedPipe } from '@ui/pipes/get-date-passed.pipe';
import { DataAccessDealService } from '@data-access-deal/data-access.service';
import { Params } from '@angular/router';
import { PortfolioPosition } from 'types/portfolio';
import { LoaderComponent } from '@ui/components/loader';
import { TuiDayRange } from '@taiga-ui/cdk';
import { getListOfRange } from 'utils/get-list-of-range';
import { TODAY } from 'tokens/desktop/today';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { ContextAction } from 'types/context-action';
import { getContextAction } from 'utils/get-context-action';
import { SelectItemPipe } from './layout.directive';
import { DEAL_CONSTANTS_LIST_OF_BUTTON } from './layout.constants';
import { ActionDealDeletePosition } from '@data-access-deal/plugins/action-delete-portfolio';
import { ActionShowTrade } from '../../../../../lk/src/lib/common/plugins/action-show-trade';
import { ActionNewIdea } from '../../../../../lk/src/lib/common/plugins/action-new-idea';
import { ActionSelectTransaction } from '../../../../../lk/src/lib/common/plugins/action-select-transaction';
import { ActionShowTransaction } from '../../../../../lk/src/lib/common/plugins/action-show-transaction';
import { ActionNewPosition } from '../../../../../lk/src/lib/common/plugins/action-new-position';

interface FilterValue {
	type: AccountType;
	strategy: AccountStrategy;
	dealType: AccountDealType;
	broker: AccountBroker;
	currency: AccountCurrency;
	range: AccountRange;
}

type ActionButton = {
	text: string;
	icon: string;
	type: string;
	disabled: boolean;
};

@Component({
	selector: 'deal-layout',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiButton,
		TuiHint,
		TuiDrawer,
		TuiPopup,
		SearchDialogDirective,
		FilterDealListComponent,
		TuiTextfield,
		AsyncPipe,
		UiList,
		UiListItem,
		WithPaginationComponent,
		TuiSkeleton,
		GetDatePassedPipe,
		DatePipe,
		NgTemplateOutlet,
		TuiFormatNumberPipe,
		ColorPriceDirective,
		TuiBadgeNotification,
		TuiBadgedContent,
		LoaderComponent,
		SelectItemPipe,
		TuiDropdown,
		TuiDataList,
		TuiIcon,
	],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss',
	providers: [
		{
			provide: ACTION_EVENTS,
			useClass: ActionDealDeletePosition,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionShowTrade,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionNewIdea,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionSelectTransaction,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionShowTransaction,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionNewPosition,
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
	readonly #today: Date = inject(TODAY);
	readonly #actions: ContextActionPlugin[] = inject(ACTION_EVENTS);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #dataAccess: DataAccessDealService = inject(DataAccessDealService);
	readonly #map: Map<string, ContextAction> = new Map();
	readonly #rangeList: { text: string; range: TuiDayRange }[] = getListOfRange(this.#today);
	readonly #valueDefault = {
		dealType: FilterDealListComponent.valueDefaultDealType,
		type: FilterDealListComponent.valueDefaultType,
		strategy: FilterDealListComponent.valueDefaultStrategy,
		broker: FilterDealListComponent.valueDefaultBroker,
		currency: FilterDealListComponent.valueDefaultCurrency,
		range: this.#rangeList[5].range,
	};

	protected readonly formatNumberSettings: Partial<TuiNumberFormatSettings> = { precision: 2, decimalMode: 'always' };
	protected readonly size = 's';
	protected readonly listPagination = [10, 50, 100];
	protected readonly listOfButtonConstants = DEAL_CONSTANTS_LIST_OF_BUTTON;
	protected readonly constants = DEAL_CONSTANTS;
	protected readonly filterControl: FormControl = new FormControl(this.#valueDefault);
	protected readonly searchControl: FormControl<string | null> = new FormControl('', { nonNullable: true });
	protected readonly paginationControl: FormControl = new FormControl({
		limit: this.listPagination[1],
		page: 0,
	});
	protected readonly openFilter: WritableSignal<boolean> = signal(false);

	readonly isActiveFilter$: Observable<boolean> = this.filterControl.valueChanges.pipe(
		startWith(this.filterControl.value),
		map(
			(value: FilterValue) =>
				value.dealType.id !== null ||
				value.strategy.id !== null ||
				value.type.id !== null ||
				value.broker.brokerId !== null ||
				value.currency.currencyId !== null ||
				value.range.to !== null
		),
		distinctUntilChanged()
	);

	readonly data: InputSignal<DataAccessDealState> = input.required();
	readonly isLoaded = computed(() => !this.data().isLoaded);
	readonly isLoading = computed(() => this.data().isLoaded && !this.data().isLoading);
	readonly list: Signal<PortfolioPosition[]> = computed(() => {
		const data = this.data().data;

		return data ? data.items : [];
	});
	readonly total = computed(() => {
		const data = this.data().data;

		return data ? data.total : 0;
	});

	ngAfterViewInit(): void {
		this.paginationControl.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef))
			.subscribe((value: Params) =>
				this.#dataAccess.params.update((params: Params | null) => ({ ...params, ...value, ...this._getParams() }))
			);

		this.searchControl.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(250))
			.subscribe((value: string | null) =>
				this.#dataAccess.params.update((params: Params | null) => ({
					...params,
					query: value,
				}))
			);
	}

	onClose(event: Event): void {
		event.preventDefault();

		this.openFilter.set(false);
	}

	onOpenDialog(event: StockInstrument | null): void {
		if (event) {
			const context = this._getAction('newIdea');

			if (context) {
				context.action(event);
			}
		}
	}

	onReset(event: Event): void {
		event.preventDefault();

		this.openFilter.set(false);
		this.filterControl.reset(this.#valueDefault);
		this.#dataAccess.params.update((params: Params | null) => ({ ...params, ...this._getParams() }));
	}

	onSubmit(event: Event): void {
		event.preventDefault();

		this.openFilter.set(false);
		this.#dataAccess.params.update((params: Params | null) => ({ ...params, ...this._getParams() }));
	}

	onTrade(event: Event, item: PortfolioPosition): void {
		event.preventDefault();

		const context = this._getAction('showTrade');

		if (context) {
			context.action(item);
		}
	}

	onClick(event: Event, item: PortfolioPosition): void {
		event.preventDefault();

		const context = this._getAction('selectTransaction');

		if (context) {
			context.action(item);
		}
	}

	onDblclick(event: Event, item: PortfolioPosition): void {
		event.preventDefault();

		const context = this._getAction('showTransaction');

		if (context) {
			context.action(item);
		}
	}

	onContextClick(event: Event, item: PortfolioPosition, button: ActionButton): void {
		event.preventDefault();

		const context = this._getAction(button.type);

		if (context) {
			context.action(item);
		}
	}

	private _getParams(): Params {
		const { dealType, type, strategy, broker, currency, range } = this.filterControl.value;
		let rangeValue = null;

		if (range) {
			rangeValue = {
				from: (range as TuiDayRange).from.toUtcNativeDate().toISOString(),
				to: new Date((range as TuiDayRange).to.toUtcNativeDate().setUTCHours(23, 59, 59)).toISOString(),
			};
		}

		return {
			brokerId: broker.brokerId,
			dealType: dealType.id,
			instrumentType: type.id,
			strategyId: strategy.id,
			currencyId: currency.currencyId,
			...rangeValue,
		};
	}

	private _getAction(type: string): ContextAction | null {
		return getContextAction(this.#actions, this.#map, type);
	}
}

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
} from '@angular/core';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ACTION_EVENTS } from 'tokens/desktop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockInstrument } from 'types/stock';
import {
	TuiBreakpointMediaKey,
	TuiBreakpointService,
	TuiButton,
	TuiDataList,
	TuiDropdown,
	TuiFormatNumberPipe,
	TuiHint,
	TuiIcon,
	TuiNumberFormatSettings,
	TuiTextfield,
} from '@taiga-ui/core';
import { TuiBadgedContent, TuiBadgeNotification, TuiSkeleton } from '@taiga-ui/kit';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { UiList, UiListItem } from '@ui/components/list';
import { AccountBroker, AccountCurrency, AccountDealType, AccountStrategy, AccountType } from 'types/account';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColorPriceDirective } from '@ui/components/price';
import { DEAL_CONSTANTS } from '@data-access-idea/deals/constants';
import { GetDatePassedPipe } from '@ui/pipes/get-date-passed.pipe';
import { DataAccessDealService } from '@data-access-idea/deals/data-access.service';
import { Params } from '@angular/router';
import { PortfolioPosition } from 'types/portfolio';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { ContextAction } from 'types/context-action';
import { getContextAction } from 'utils/get-context-action';
import { SelectItemPipe } from './layout.directive';
import { DEAL_CONSTANTS_LIST_OF_BUTTON } from './layout.constants';
import { ActionDealDeletePosition } from '@data-access-idea/deals/plugins/action-delete-portfolio';
import { ActionShowTrade } from 'ui-common/lib/plugins/plugins/action-show-trade';
import { ActionNewIdea } from 'ui-common/lib/plugins/plugins/action-new-idea';
import { ActionSelectTransaction } from 'ui-common/lib/plugins/plugins/action-select-transaction';
import { ActionShowTransaction } from 'ui-common/lib/plugins/plugins/action-show-transaction';
import { ActionNewPosition } from 'ui-common/lib/plugins/plugins/action-new-position';
import { DataAccess } from '@data-access-idea/store';
import { DataList } from 'types/response';
import { DealFilterDialogService, FilterDealValue } from '@feat-deals-filter';
import { TuiDayRange } from '@taiga-ui/cdk';

interface FilterValue {
	type: AccountType;
	strategy: AccountStrategy;
	dealType: AccountDealType;
	broker: AccountBroker;
	currency: AccountCurrency;
	range: TuiDayRange;
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
		SearchDialogDirective,
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
	readonly #breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);
	readonly #actions: ContextActionPlugin[] = inject(ACTION_EVENTS);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #dataAccess: DataAccessDealService = inject(DataAccessDealService);
	readonly #dealFilterDialogService: DealFilterDialogService = inject(DealFilterDialogService);
	readonly #map: Map<string, ContextAction> = new Map();

	protected readonly formatNumberSettings: Partial<TuiNumberFormatSettings> = { precision: 2, decimalMode: 'always' };
	protected readonly size = 's';
	protected readonly listPagination = [10, 50, 100];
	protected readonly listOfButtonConstants = DEAL_CONSTANTS_LIST_OF_BUTTON;
	protected readonly constants = DEAL_CONSTANTS;
	protected readonly searchControl: FormControl<string | null> = new FormControl('', { nonNullable: true });
	protected readonly paginationControl: FormControl = new FormControl({
		limit: this.listPagination[1],
		page: 0,
	});

	readonly isMobile$: Observable<boolean> = this.#breakpoint$.pipe(
		map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile'),
		shareReplay({ refCount: true, bufferSize: 1 })
	);

	readonly value: Signal<FilterDealValue> = this.#dealFilterDialogService.value;
	readonly isActiveFilter: Signal<boolean> = computed(() => {
		const value = this.#dealFilterDialogService.value();

		return (
			value.portfolio.portfolioId !== null ||
			value.dealType.id !== null ||
			value.strategy.id !== null ||
			value.type.id !== null ||
			value.broker.brokerId !== null ||
			value.currency.currencyId !== null
		);
	});

	readonly data: InputSignal<DataAccess<DataList<PortfolioPosition>>> = input.required();
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
		this.paginationControl.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((value: Params) =>
			this.#dataAccess.params.update((params: Params | null) => ({
				...params,
				...value,
				...this.#dealFilterDialogService.getParams(this.#dealFilterDialogService.value()),
			}))
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

	onOpenFilter(event: Event): void {
		event.preventDefault();

		this.#dealFilterDialogService.open();
	}

	onOpenDialog(event: StockInstrument | null): void {
		if (event) {
			const context = this._getAction('newIdea');

			if (context) {
				context.action(event);
			}
		}
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

	private _getAction(type: string): ContextAction | null {
		return getContextAction(this.#actions, this.#map, type);
	}
}

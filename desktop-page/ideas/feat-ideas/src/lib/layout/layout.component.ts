import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	input,
	InputSignal,
	signal,
	WritableSignal,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ACTION_EVENTS } from 'tokens/desktop';
import { IDEA_CONSTANTS } from '@data-access-idea/ideas/constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterIdeaListComponent } from '../filter/filter.component';
import { debounceTime, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockInstrument } from 'types/stock';
import {
	TuiButton,
	TuiDataList,
	TuiDataListComponent,
	TuiDropdown,
	TuiDropdownContext,
	TuiFormatNumberPipe,
	TuiHint,
	TuiIcon,
	TuiPopup,
	TuiTextfield,
} from '@taiga-ui/core';
import { TuiBadgedContent, TuiBadgeNotification, TuiDrawer, TuiSkeleton } from '@taiga-ui/kit';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { UiList, UiListItem } from '@ui/components/list';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataAccess } from '@data-access-idea/store';
import { LoaderComponent } from '@ui/components/loader';
import { Position, Positions } from 'types/position';
import { GetColorToPositionPipe } from '@ui/pipes/get-color-to-position.pipe';
import { Params } from '@angular/router';
import { DataAccessIdeaService } from '@data-access-idea/ideas/data-access.service';
import { ContextAction } from 'types/context-action';
import { getContextAction } from 'utils/get-context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { SelectItemIdeaPipe } from './layout.directive';
import { LocalStorage } from 'storage/local.storage';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';
import { IDEA_CONSTANTS_LIST_OF_BUTTON } from './layout.constants';
import { ActionNewPosition } from 'ui-common/lib/plugins/plugins/action-new-position';
import { ActionCopyIdea } from 'ui-common/lib/plugins/plugins/action-copy-idea';
import { ActionSelectIdea } from 'ui-common/lib/plugins/plugins/action-select-idea';
import { ActionIdeaDeletePosition } from '@data-access-idea/ideas/plugins/action-delete-portfolio';
import { ActionShowTrade } from 'ui-common/lib/plugins/plugins/action-show-trade';
import { ActionNewIdea } from 'ui-common/lib/plugins/plugins/action-new-idea';
import { ActionShowIdea } from 'ui-common/lib/plugins/plugins/action-show-idea';

interface FilterValue {
	type: AccountType;
	strategy: AccountStrategy;
	currency: AccountCurrency;
}

type ActionButton = {
	text: string;
	icon: string;
	type: string;
	disabled: boolean;
};

@Component({
	selector: 'idea-layout',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TuiButton,
		TuiHint,
		TuiDrawer,
		TuiPopup,
		SearchDialogDirective,
		TuiTextfield,
		AsyncPipe,
		UiList,
		UiListItem,
		WithPaginationComponent,
		TuiSkeleton,
		LoaderComponent,
		DatePipe,
		NgTemplateOutlet,
		TuiFormatNumberPipe,
		GetColorToPositionPipe,
		TuiBadgeNotification,
		TuiBadgedContent,
		SelectItemIdeaPipe,
		TuiDropdownContext,
		TuiDropdown,
		TuiDataListComponent,
		TuiIcon,
		TuiDataList,
	],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss',
	providers: [
		{
			provide: ACTION_EVENTS,
			useClass: ActionIdeaDeletePosition,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionShowIdea,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionNewPosition,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionCopyIdea,
			multi: true,
		},
		{
			provide: ACTION_EVENTS,
			useClass: ActionSelectIdea,
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
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
	readonly #localStorage: LocalStorage = inject(LOCAL_STORAGE);
	readonly #actions: ContextActionPlugin[] = inject(ACTION_EVENTS);
	readonly #dataAccess: DataAccessIdeaService = inject(DataAccessIdeaService);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #map: Map<string, ContextAction> = new Map();
	readonly #valueDefault = {
		type: FilterIdeaListComponent.valueDefaultType,
		strategy: FilterIdeaListComponent.valueDefaultStrategy,
		currency: FilterIdeaListComponent.valueDefaultCurrency,
	};

	protected readonly size = 's';
	protected readonly listOfButtonConstants = IDEA_CONSTANTS_LIST_OF_BUTTON;
	protected readonly listPagination = [10, 50, 100];
	protected readonly constants = IDEA_CONSTANTS;
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
				(value.currency && value.currency.currencyId !== null) ||
				(value.strategy && value.strategy.id !== null) ||
				(value.type && value.type.id !== null)
		)
	);

	readonly data: InputSignal<DataAccess<Positions>> = input.required();
	readonly isLoaded = computed(() => !this.data().isLoaded);
	readonly isLoading = computed(() => this.data().isLoaded && !this.data().isLoading);
	readonly list = computed(() => {
		const data = this.data().data;

		return data ? data.items : [];
	});
	readonly total = computed(() => {
		const data = this.data().data;

		return data ? data.total : 0;
	});

	ngAfterViewInit(): void {
		this._initFormGroup();

		this.paginationControl.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				map(({ limit, page }: Params, index: number) => {
					let filter = {};

					if (index === 0) {
						const { type, strategy, currency } = this.filterControl.value;

						filter = {
							currencyId: currency.currencyId,
							instrumentType: type.id,
							strategyId: strategy.id,
						};
					}

					return {
						limit,
						page: page + 1,
						...filter,
					};
				})
			)
			.subscribe((value: Params) => {
				this.#dataAccess.params.update((params: Params | null) => ({ ...params, ...value }));
			});

		this.searchControl.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(250))
			.subscribe((value: string | null) => {
				this.#dataAccess.params.update((params: Params | null) => ({ ...params, query: value }));
			});
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

		this.#dataAccess.params.update((params: Params | null) => ({
			...params,
			currencyId: this.#valueDefault.currency.currencyId,
			instrumentType: this.#valueDefault.type.id,
			strategyId: this.#valueDefault.strategy.id,
		}));
	}

	onSubmit(event: Event): void {
		event.preventDefault();

		this.openFilter.set(false);

		const { type, strategy, currency } = this.filterControl.value;
		this.#dataAccess.params.update((params: Params | null) => ({
			...params,
			currencyId: currency.currencyId,
			instrumentType: type.id,
			strategyId: strategy.id,
		}));
	}

	onTrade(event: Event, item: Position): void {
		event.preventDefault();

		const context = this._getAction('showTrade');

		if (context) {
			context.action(item);
		}
	}

	onClick(event: Event, item: Position): void {
		event.preventDefault();

		const context = this._getAction('selectIdea');

		if (context) {
			context.action(item);
		}
	}

	onDblclick(event: Event, item: Position): void {
		event.preventDefault();

		const context = this._getAction('showIdea');

		if (context) {
			context.action(item);
		}
	}

	onContextClick(event: Event, item: Position, button: ActionButton): void {
		event.preventDefault();

		const context = this._getAction(button.type);

		if (context) {
			context.action(item);
		}
	}

	private _initFormGroup(): void {
		const value = this.#localStorage.getItem('filterIdea') || this.filterControl.value;

		this.filterControl.setValue(value);
	}

	private _getAction(type: string): ContextAction | null {
		return getContextAction(this.#actions, this.#map, type);
	}
}

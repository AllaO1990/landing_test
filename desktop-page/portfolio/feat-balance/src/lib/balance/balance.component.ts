import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { HeaderComponent, UiList, UiListItem } from '@ui/components/list';
import { LoaderComponent } from '@ui/components/loader';
import { TuiButton, TuiDialogService, TuiFormatNumberPipe } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiButtonLoading } from '@taiga-ui/kit';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { BalanceDepositService } from 'ui-common/lib/dialog/balance-deposit';
import { BalanceWithdrawalService } from 'ui-common/lib/dialog/balance-withdrawal';
import { debounceTime, filter, Observable, startWith } from 'rxjs';
import { AccountTransaction, AccountTransactions } from 'types/account';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiDay, tuiPure } from '@taiga-ui/cdk';
import { BalanceStore } from './balance.store';
import { ApiPortfolioService } from '@data-access-portfolio/api.service';
import { getParamsFromFilter } from './balance.utils';
import { DialogFilterComponent } from '@ui-portfolio-common/dialog-filter';
import { DialogCore } from 'ui-common/lib/dialog/dialog.core';

@Component({
	selector: 'portfolio-balance',
	imports: [
		AsyncPipe,
		DatePipe,
		HeaderComponent,
		LoaderComponent,
		TuiButton,
		TuiButtonLoading,
		TuiFormatNumberPipe,
		UiList,
		UiListItem,
		WithPaginationComponent,
		ReactiveFormsModule,
		DialogFilterComponent,
	],
	standalone: true,
	templateUrl: './balance.component.html',
	styleUrls: ['./balance.component.scss'],
	providers: [
		{
			provide: BalanceDepositService,
			useFactory: (dialog: DialogService) => new BalanceDepositService(dialog),
			deps: [DIALOG],
		},
		{
			provide: BalanceWithdrawalService,
			useFactory: (dialog: DialogService) => new BalanceWithdrawalService(dialog),
			deps: [DIALOG],
		},
		{
			provide: BalanceStore,
			useFactory: (api: ApiPortfolioService) => new BalanceStore(api),
			deps: [ApiPortfolioService],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioBalanceComponent extends DialogCore implements AfterViewInit {
	readonly #injector: Injector = inject(Injector);
	readonly #dialogService: DialogService = inject(DIALOG);
	readonly #balanceDepositService: BalanceDepositService = inject(BalanceDepositService);
	readonly #balanceWithdrawalService: BalanceWithdrawalService = inject(BalanceWithdrawalService);
	readonly #tuiDialog: TuiDialogService = inject(TuiDialogService);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #store: BalanceStore = inject(BalanceStore);

	readonly transactions$: Observable<AccountTransactions | null> = this.#store.list$;
	readonly itemHeight = 28;
	readonly listLimit: number[] = [10, 50, 100];
	readonly formGroup: FormGroup = new FormGroup({
		filter: new FormControl(null),
		pagination: new FormControl({
			limit: this.listLimit[1],
			page: 0,
		}),
	});

	readonly maxDate = TuiDay.fromLocalNativeDate(new Date());

	@tuiPure
	get label(): string | null {
		return this.context.label || null;
	}

	@tuiPure
	get action(): string | null {
		return this.context.action || null;
	}

	get controlFilter(): FormControl {
		return this.formGroup.get('filter') as FormControl;
	}

	get controlPagination(): FormControl {
		return this.formGroup.get('pagination') as FormControl;
	}

	total$: Observable<number> = this.#store.list$.pipe(
		filter((value: AccountTransactions | null): value is AccountTransactions => value !== null),
		map((value: AccountTransactions) => value.total),
		distinctUntilChanged()
	);

	ngAfterViewInit(): void {
		this.formGroup.valueChanges
			.pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.formGroup.value), debounceTime(0))
			.subscribe((value) => {
				const {
					filter,
					pagination: { page, limit },
				} = value;
				const params = {
					...getParamsFromFilter(filter),
					page: page + 1,
					limit,
				};
				this.#store.load(params);
			});
	}

	async openDialogDeposit(event: Event): Promise<void> {
		event.preventDefault();

		const { broker, portfolio, currency } = this.controlFilter.value;

		this.#balanceDepositService
			.openDialog(this.#injector, {
				max: null,
				label: 'Внести средства',
				action: 'Пополнить',
				data: {
					broker: broker.brokerId !== null ? broker : null,
					portfolio: portfolio.portfolioId !== null ? portfolio : null,
					currency: currency.currencyId !== null ? currency : null,
					type: 'deposit',
				},
			})
			.subscribe(() => this._updateList());
	}

	async openDialogExpense(event: Event): Promise<void> {
		event.preventDefault();

		this.#balanceWithdrawalService
			.openDialog(this.#injector, {
				max: true,
				label: 'Вывести средства',
			})
			.subscribe(() => this._updateList());
	}

	onDelete(event: Event, item: AccountTransaction & { loadingRemove: boolean }): void {
		event.preventDefault();

		this.#tuiDialog
			.open<boolean>(TUI_CONFIRM, {
				appearance: 'dialog-confirm',
				closeable: false,
				size: 'auto',
				data: {
					content: `<p class="tui-text_h6">Удалить внесённую сумму ${item.amount}${item.currency.currencySymbol}?</p>`,
					yes: 'Да',
					no: 'Нет',
				},
			})
			.subscribe((result: boolean) => {
				if (result) {
					item.loadingRemove = true;
					this.#store.delete({ id: item.id, params: getParamsFromFilter(this.controlFilter.value) });
				}
			});
	}

	async onEdit(event: Event, item: AccountTransaction): Promise<void> {
		event.preventDefault();

		this.#balanceDepositService
			.openDialog(this.#injector, {
				data: {
					...item,
					type: 'edit',
				},
				max: null,
				label: 'Изменить',
				action: 'Обновить',
			})
			.subscribe(() => this._updateList());
	}

	private _updateList(): void {
		this.#store.load(getParamsFromFilter(this.controlFilter.value));
	}
}

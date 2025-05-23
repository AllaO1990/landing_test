import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { DialogFilterComponent } from '../dialog-filter/dialog-filter.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { TuiButton, TuiDialogService, TuiFormatNumberPipe } from '@taiga-ui/core';
import { LoaderComponent } from '@ui/components/loader';
import { triggerHeightAnimations } from '@ui/animations/height.animations';
import { PortfolioListDialog } from '../dialog';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { DepositComponent } from '../deposit/deposit.component';
import { WithdrawalComponent } from '../withdrawal/withdrawal.component';
import { debounceTime, filter, Observable, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { BalanceStore } from 'stores/plugins/balance.store';
import { DesktopService } from '@desktop-data/desktop-data';
import { DESKTOP_API } from 'tokens/desktop';
import { getParamsFromFilter } from '../utils';
import { TUI_CONFIRM, TuiButtonLoading } from '@taiga-ui/kit';
import { AccountTransaction, AccountTransactions } from 'types/account';
import { WithPaginationComponent } from 'ui-common/lib/with-pagination';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'lib-portfolio-list-balance',
  standalone: true,
  imports: [
    DialogFilterComponent,
    ReactiveFormsModule,
    NgIf,
    TuiButton,
    LoaderComponent,
    HeaderComponent,
    TuiButtonLoading,
    ListComponent,
    ItemDirective,
    TuiFormatNumberPipe,
    DatePipe,
    AsyncPipe,
    WithPaginationComponent,
  ],
  templateUrl: './balance.component.html',
  styleUrls: ['../dialog.scss', './balance.component.scss'],
  providers: [
    {
      provide: BalanceStore,
      useFactory: (api: DesktopService) => new BalanceStore(api),
      deps: [DESKTOP_API],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [triggerHeightAnimations],
})
export class BalanceComponent extends PortfolioListDialog implements AfterViewInit {
  readonly #injector: Injector = inject(Injector);
  readonly #dialogService: DialogService = inject(DIALOG);
  readonly #tuiDialog: TuiDialogService = inject(TuiDialogService);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #store: BalanceStore = inject(BalanceStore);

  #dialogDepositComponent: PolymorpheusComponent<DepositComponent> | null = null;
  #dialogWithdrawalComponent: PolymorpheusComponent<WithdrawalComponent> | null = null;

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

    if (!this.#dialogDepositComponent) {
      this.#dialogDepositComponent = await import('../deposit/deposit.component')
        .then((m) => m.DepositComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    this._openDialog(
      this.#dialogDepositComponent as PolymorpheusComponent<DepositComponent>,
      { max: null, type: 'deposit' },
      'Внести средства'
    ).subscribe(() => this._updateList());
  }

  async openDialogExpense(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.#dialogWithdrawalComponent) {
      this.#dialogWithdrawalComponent = await import('../withdrawal/withdrawal.component')
        .then((m) => m.WithdrawalComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    this._openDialog(
      this.#dialogWithdrawalComponent as PolymorpheusComponent<WithdrawalComponent>,
      { max: true },
      'Вывести средства'
    ).subscribe(() => this._updateList());
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

    if (!this.#dialogDepositComponent) {
      this.#dialogDepositComponent = await import('../deposit/deposit.component')
        .then((m) => m.DepositComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    this._openDialog(
      this.#dialogDepositComponent as PolymorpheusComponent<DepositComponent>,
      { max: null, ...item, type: 'edit' },
      'Изменить',
      'Обновить'
    ).subscribe(() => this._updateList());
  }

  private _openDialog(
    c: PolymorpheusComponent<any>,
    data: any = null,
    label: string | null = null,
    action = 'Пополнить'
  ): Observable<any> {
    return this.#dialogService
      .open(c, {
        appearance: 'dialog-block',
        data,
        label,
        action,
      })
      .pipe(takeUntilDestroyed(this.#destroyRef));
  }

  private _updateList(): void {
    this.#store.load(getParamsFromFilter(this.controlFilter.value));
  }
}

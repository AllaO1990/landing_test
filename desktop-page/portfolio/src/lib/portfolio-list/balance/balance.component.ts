import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { DialogFilterComponent } from '../dialog-filter/dialog-filter.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { TuiButton, TuiDialogService, TuiFormatNumberPipe } from '@taiga-ui/core';
import { LoaderComponent } from '@ui/components/loader';
import { triggerHeightAnimations } from '@ui/animations/height.animations';
import { PortfolioListDialog } from '../dialog';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { DepositComponent } from '../deposit/deposit.component';
import { WithdrawalComponent } from '../withdrawal/withdrawal.component';
import { Observable, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { BalanceStore } from 'stores/plugins/balance.store';
import { DesktopService } from '@desktop-data/desktop-data';
import { DESKTOP_API } from 'tokens/desktop';
import { getParamsFromFilter } from '../utils';
import { TUI_CONFIRM, TuiButtonLoading } from '@taiga-ui/kit';
import { AccountTransaction, AccountTransactions } from 'types/account';

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
  readonly controlFilter: FormControl = new FormControl(null);
  readonly itemHeight = 28;

  ngAfterViewInit(): void {
    this.controlFilter.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlFilter.value))
      .subscribe((value) => {
        this.#store.load(getParamsFromFilter(value));
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

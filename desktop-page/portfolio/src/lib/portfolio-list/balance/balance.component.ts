import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { DialogFilterComponent } from '../dialog-filter/dialog-filter.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';
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
import { TuiButtonLoading } from '@taiga-ui/kit';

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
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #store: BalanceStore = inject(BalanceStore);

  #dialogDepositComponent: PolymorpheusComponent<DepositComponent> | null = null;
  #dialogWithdrawalComponent: PolymorpheusComponent<WithdrawalComponent> | null = null;

  readonly list$ = this.#store.list$;
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
      { max: null },
      'Внести средства'
    ).subscribe();
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
    ).subscribe();
  }

  private _openDialog(c: PolymorpheusComponent<any>, data: any = null, label: string | null = null): Observable<any> {
    return this.#dialogService
      .open(c, {
        appearance: 'dialog-block',
        data,
        label,
      })
      .pipe(takeUntilDestroyed(this.#destroyRef));
  }
}

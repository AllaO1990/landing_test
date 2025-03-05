import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, forkJoin, Observable, Subject, timer } from 'rxjs';
import { PortfolioListDialog } from '../../dialog';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { AccountFacade } from 'stores/facades/account.facade';
import {
  TuiInputDateTimeModule,
  TuiInputNumberModule,
  TuiSelectModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiButton, TuiNumberFormat } from '@taiga-ui/core';
import { TuiAutoFocus, TuiContext, TuiDay, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { stringifyBroker, stringifyCurrency } from '../../utils';
import { getTuiDayTime } from 'utils/get-tui-day-time';
import { CommissionStore } from 'stores/plugins/commission.store';
import { Params } from '@angular/router';
import { TuiButtonLoading } from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Response } from 'types/response';
import { map } from 'rxjs/operators';

@Component({
  selector: 'lib-commission-add',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    ControlPortfolioComponent,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    NgIf,
    NgForOf,
    TuiButton,
    TuiInputDateTimeModule,
    TuiAutoFocus,
    TuiInputNumberModule,
    TuiNumberFormat,
    TuiButtonLoading,
  ],
  templateUrl: './add.component.html',
  styleUrls: ['../../dialog.scss', './add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommissionAddComponent extends PortfolioListDialog implements AfterViewInit {
  readonly #service: AccountFacade = inject(AccountFacade);
  readonly #store: CommissionStore = inject(CommissionStore);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  readonly portfolios$: Observable<null | AccountPortfolio[]> = this.#service.portfolios$;
  readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$;
  readonly currencies$: Observable<null | AccountCurrency[]> = this.#service.currencies$;

  readonly form: FormGroup = new FormGroup({
    date: new FormControl(null, Validators.required),
    size: new FormControl(null, Validators.required),
    portfolio: new FormControl(null, Validators.required),
    currencyId: new FormControl(null, Validators.required),
    brokerId: new FormControl(null, Validators.required),
  });

  readonly isLoading$: Subject<boolean> = new BehaviorSubject(false);

  @tuiPure
  protected stringifyBroker(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
    return stringifyBroker(items);
  }

  @tuiPure
  protected stringifyCurrency(items: readonly AccountCurrency[]): TuiStringHandler<TuiContext<number>> {
    return stringifyCurrency(items);
  }

  ngAfterViewInit(): void {
    if (this.context.data) {
      const { portfolio, currency, broker, size, date } = this.context.data;

      console.log(date);

      this.form.patchValue({
        date: getTuiDayTime(date || new Date().toISOString()),
        portfolio: portfolio && portfolio.portfolioId !== null ? portfolio : null,
        currencyId: currency && currency.currencyId,
        brokerId: broker && broker.brokerId,
        size,
      });
    }
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.isLoading$.next(true);

    const request =
      this.context.data.id !== undefined
        ? this.#store.updateCommission(this.context.data.id, this._getParams())
        : this.#store.addCommission(this._getParams());

    forkJoin([request, timer(1000)])
      .pipe(
        map(([response]: [Response<any>, number]) => response),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe((_) => {
        this.isLoading$.next(false);
        this.context.completeWith(true);
      });
  }

  private _getParams(): Params {
    const {
      date,
      portfolio: { portfolioId },
      ...other
    } = this.form.value;

    return {
      ...other,
      portfolioId,
      date: (date[0] as TuiDay).toLocalNativeDate(),
    };
  }
}

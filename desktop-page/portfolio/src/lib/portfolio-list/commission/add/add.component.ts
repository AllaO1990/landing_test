import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
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
import { TuiAutoFocus, TuiContext, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { stringifyBroker, stringifyCurrency } from '../../utils';
import { getTuiDayTime } from 'utils/get-tui-day-time';
import { CommissionStore } from 'stores/plugins/commission.store';
import { Params } from '@angular/router';

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
  ],
  templateUrl: './add.component.html',
  styleUrls: ['../../dialog.scss', './add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommissionAddComponent extends PortfolioListDialog implements AfterViewInit {
  readonly #service: AccountFacade = inject(AccountFacade);
  readonly #store: CommissionStore = inject(CommissionStore);

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
      const { portfolio, currency, broker } = this.context.data;

      this.form.patchValue({
        date: getTuiDayTime(new Date().toISOString()),
        portfolio: portfolio && portfolio.portfolioId !== null ? portfolio : null,
        currencyId: currency && currency.currencyId,
        brokerId: broker && broker.brokerId,
      });
    }
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    this.#store.addCommission(this._getParams()).subscribe((res) => console.log(res));
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
      date: `${date[0].toString('YMD', '-')}T${date[1].toString('HH:MM:SS.MSS')}Z`,
    };
  }
}

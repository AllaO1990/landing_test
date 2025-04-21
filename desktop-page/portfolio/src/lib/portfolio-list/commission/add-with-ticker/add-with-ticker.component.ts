import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, filter, forkJoin, Observable, Subject, switchMap, timer } from 'rxjs';
import { PortfolioListDialog } from '../../dialog';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';
import { AccountBroker, AccountPortfolio } from 'types/account';
import { AccountFacade } from 'stores/facades/account.facade';
import {
  TuiInputDateTimeModule,
  TuiInputModule,
  TuiSelectModule,
  TuiTextareaModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/legacy';
import { TuiButton, TuiLink, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import { TuiAutoFocus, TuiContext, TuiDay, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { stringifyBroker } from '../../utils';
import { getTuiDayTime } from 'utils/get-tui-day-time';
import { CommissionStore } from 'stores/plugins/commission.store';
import { Params } from '@angular/router';
import { TuiButtonLoading, TuiInputNumber } from '@taiga-ui/kit';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { StockPosition } from 'types/position';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Response } from 'types/response';

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
    TuiNumberFormat,
    TuiButtonLoading,
    TuiTextareaModule,
    TuiTextfield,
    TuiInputNumber,
    TuiInputModule,
    TuiLink,
  ],
  templateUrl: './add-with-ticker.component.html',
  styleUrls: ['../../dialog.scss', './add-with-ticker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommissionAddWithTickerComponent extends PortfolioListDialog implements AfterViewInit {
  readonly #service: AccountFacade = inject(AccountFacade);
  readonly #store: CommissionStore = inject(CommissionStore);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);

  readonly portfolios$: Observable<null | AccountPortfolio[]> = this.#service.portfolios$;
  readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$;

  readonly form: FormGroup = new FormGroup({
    date: new FormControl(null, Validators.required),
    size: new FormControl(null, Validators.required),
    portfolio: new FormControl(null, Validators.required),
    brokerId: new FormControl(null, Validators.required),
    comment: new FormControl(null),
  });

  minDate: TuiDay | null = null;
  currencySymbol: string | null = null;
  ticker: string | null = null;

  readonly isLoading$: Subject<boolean> = new BehaviorSubject(false);

  @tuiPure
  protected stringifyBroker(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
    return stringifyBroker(items);
  }

  ngAfterViewInit(): void {
    if (this.context.data) {
      const { portfolio, currency, broker, size, date, comment, ideaId, instrument } = this.context.data;

      this.currencySymbol = currency.currencySymbol;
      this.ticker = instrument.ticker;

      this.form.patchValue({
        date: getTuiDayTime(date || new Date().toISOString()),
        portfolio: portfolio && portfolio.portfolioId !== null ? portfolio : null,
        brokerId: broker && broker.brokerId,
        size,
        comment,
        ideaId,
      });

      this.#store.getIdea(this.context.data.ideaId).subscribe((res) => console.log(res));
    }
  }

  onShow(event: Event): void {
    event.preventDefault();

    this.#queryParams.update({ id: this.context.data.ideaId, dialog: 'visible' }, 'merge');
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.isLoading$.next(true);

    const request = this.#store.getIdea(this.context.data.ideaId).pipe(
      filter((idea: StockPosition | null): idea is StockPosition => idea !== null),
      switchMap((position: StockPosition) => {
        console.log(position);

        const body = this._getBody(position);

        return this.#store.editIdea(this.context.data.ideaId, body);
      })
    );

    // const request =
    //   this.context.data.id !== undefined
    //     ? this.#store.updateCommission(this.context.data.id, this._getParams())
    //     : this.#store.addCommission(this._getParams());
    //
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
    const { date, brokerId, size, comment } = this.form.getRawValue();

    return {
      brokerId,
      comment,
      size,
      date: (date[0] as TuiDay).toLocalNativeDate(),
    };
  }

  private _getBody(position: StockPosition) {
    return {
      actions: {
        entries: position.actions.entries.map((item) => ({
          amount: item.amount,
          brokerId: item.brokerId,
          date: item.date,
          price: item.price,
        })),
        outs: position.actions.outs.map((item) => ({
          amount: item.amount,
          brokerId: item.brokerId,
          date: item.date,
          price: item.price,
        })),
      },
      comissions: position.comissions.map((item) => ({
        brokerId: item.brokerId,
        comment: item.comment,
        date: item.date,
        size: item.size,
      })),
      dividends: position.dividends.map((item) => ({
        amount: item.amount,
        brokerId: item.brokerId,
        date: item.date,
        size: item.size,
      })),
      idea: {
        amount: position.idea.entries[0] ? position.idea.entries[0].quantity : null,
        entry: position.idea.entries[0] ? position.idea.entries[0].price : null,
        stop: position.idea.stop ? position.idea.stop.price : null,
        goals: position.idea.targets.map((item) => ({
          amount: item.amount,
          goal: item.price,
        })),
        expirationDate: null,
        comment: '',
        strategyId: null,
        watch: position.idea.subscribed,
        instrumentId: position.idea.instrument.id,
        parentId: position.idea.parentId,
        portfolioId: position.idea.portfolioId,
        positionType: position.idea.positionType,
      },
    };
  }
}

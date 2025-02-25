import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAutoFocus, TuiContext, TuiPopover, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { TuiButton, TuiDataListComponent, TuiNumberFormat } from '@taiga-ui/core';
import { TuiInputNumberModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { AccountFacade } from 'stores/facades/account.facade';
import { Observable } from 'rxjs';
import { ControlPortfolioComponent } from 'ui-common/lib/portfolio';

@Component({
  selector: 'lib-deposit',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    TuiAutoFocus,
    TuiButton,
    TuiDataListComponent,
    TuiTextfieldControllerModule,
    TuiInputNumberModule,
    TuiNumberFormat,
    TuiSelectModule,
    ControlPortfolioComponent,
  ],
  templateUrl: './deposit.component.html',
  styleUrls: ['../dialog.scss', './deposit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositComponent {
  readonly #service: AccountFacade = inject(AccountFacade);

  readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$;
  readonly currencies$: Observable<null | AccountCurrency[]> = this.#service.currencies$;

  readonly size = 's';
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });
  readonly form: FormGroup = new FormGroup({
    amount: new FormControl(null, [Validators.required]),
    brokerId: new FormControl(null, [Validators.required]),
    currencyId: new FormControl(null, [Validators.required]),
    portfolio: new FormControl(null, [Validators.required]),
  });

  @tuiPure
  get label(): string | null {
    return this.context.label;
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (this.context) {
      const { portfolio, ...other } = this.form.value;

      this.context.completeWith({
        ...other,
        portfolioId: portfolio.portfolioId,
      });
    }
  }

  onCancel(event: Event): void {
    event.preventDefault();

    if (this.context) {
      this.context.completeWith(null);
    }
  }

  @tuiPure
  protected stringifyBroker(items: readonly AccountBroker[]): TuiStringHandler<TuiContext<number>> {
    const map = new Map(items.map(({ broker, brokerId }) => [brokerId, broker] as [number, string]));

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }

  @tuiPure
  protected stringifyCurrency(items: readonly AccountCurrency[]): TuiStringHandler<TuiContext<number>> {
    const map = new Map(
      items.map(({ currencySymbol, currencyId }) => [currencyId, currencySymbol] as [number, string])
    );

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }

  @tuiPure
  protected stringifyPortfolio(items: readonly AccountPortfolio[]): TuiStringHandler<TuiContext<number>> {
    const map = new Map(items.map(({ portfolio, portfolioId }) => [portfolioId, portfolio] as [number, string]));

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }
}

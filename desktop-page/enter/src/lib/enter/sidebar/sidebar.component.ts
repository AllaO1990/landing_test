import { TuiSelectModule, TuiTextareaModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiFormatNumberPipe, TuiGroup, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { Idea } from 'types/idea';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { InstrumentComponent } from '../instrument/instrument.component';
import { ValidDateComponent } from './valid-date/valid-date.component';
import { TuiBlock, TuiDataListWrapperComponent, TuiFilter } from '@taiga-ui/kit';
import { STOCK_POSITION_TYPE_LIST } from 'constants/stock-position-type';
import { SIDEBAR_CONSTANTS } from './sidebar.constants';
import { STOCK_STRATEGY_LIST } from 'constants/stock-strategy';
import { STOCK_TIMING_LIST } from 'constants/stock-timing';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { Position } from 'types/position';
import { AccountFacade } from 'stores/facades/account.facade';
import { Observable } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { tap } from 'rxjs/operators';
import { PortfolioComponent } from '../portfolio';

type Item = { id: string; name: string };

@Component({
  selector: 'lib-enter-sidebar',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    InstrumentComponent,
    ValidDateComponent,
    AsyncPipe,
    TuiFilter,
    TuiButton,
    TuiIcon,
    TuiTextareaModule,
    TuiScrollbar,
    TuiFormatNumberPipe,
    TuiGroup,
    TuiBlock,
    NgForOf,
    TuiDataListWrapperComponent,
    TuiSelectModule,
    PortfolioComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterSidebarComponent {
  private readonly _accountStore: AccountFacade = inject(AccountFacade);
  private _data: Idea | Position | null = null;
  private _edit = false;

  readonly strategy: Item[] = STOCK_STRATEGY_LIST;
  readonly timing: Item[] = STOCK_TIMING_LIST;
  readonly positionType: Item[] = STOCK_POSITION_TYPE_LIST;
  readonly constants = SIDEBAR_CONSTANTS;

  readonly brokers$: Observable<null | AccountBroker[]> = this._accountStore.brokers$;
  readonly currencies$: Observable<null | AccountCurrency[]> = this._accountStore.currencies$;
  readonly portfolios$: Observable<null | AccountPortfolio[]> = this._accountStore.portfolios$.pipe(
    tap((list: AccountPortfolio[] | null) => {
      if (list !== null && this.controlPortfolio.value === null) {
        this.controlPortfolio.patchValue(list[0], { emitEvent: false });
      }
    })
  );

  readonly size = 's';

  form: FormGroup = new FormGroup(
    {
      portfolioId: new FormControl({ value: null, disabled: true }, Validators.required),
      parentId: new FormControl({ value: null, disabled: true }, Validators.required),
      instrumentId: new FormControl({ value: null, disabled: true }, Validators.required),
      expirationDate: new FormControl({ value: null, disabled: true }),
      timing: new FormControl({ value: this.timing[1].id, disabled: true }),
      strategyId: new FormControl({ value: null, disabled: true }),
      positionType: new FormControl({ value: null, disabled: true }),
      comment: new FormControl({ value: null, disabled: true }),
    },
    Validators.required
  );

  get controlPortfolio(): FormControl {
    return this.form.get('portfolioId') as FormControl;
  }

  get controlPositionType(): FormControl {
    return this.form.get('positionType') as FormControl;
  }

  get controlStrategy(): FormControl {
    return this.form.get('strategyId') as FormControl;
  }

  get controlTiming(): FormControl {
    return this.form.get('timing') as FormControl;
  }

  public controlFilterTiming: FormControl<Item[] | null> = new FormControl(null);

  public controlFilterStrategy: FormControl<Item[] | null> = new FormControl(null);

  public readonly controlFilterPositionType: FormControl<Item[] | null> = new FormControl(null);

  public controlTextArea = new FormControl(null);

  @Input() set edit(value: boolean) {
    this._edit = value;
    this.form[value ? 'enable' : 'disable']();
  }

  get edit(): boolean {
    return this._edit;
  }

  @Input()
  set data(value: Idea | Position | null) {
    this._data = value;

    if (value) {
      this.controlFilterTiming.disable();
      this.controlFilterTiming.patchValue([this.timing[1]]);
      console.log(this.positionType.find((item: { id: string }) => item.id === value.positionType) || null);

      this.controlStrategy.patchValue((value.strategy && value.strategy.type) || null);
      this.controlPositionType.patchValue(value.positionType || null);
    }
  }

  get data() {
    return this._data;
  }

  readonly stringifyPortfolio: TuiStringHandler<AccountPortfolio> = (item: AccountPortfolio) => item.portfolio;
}

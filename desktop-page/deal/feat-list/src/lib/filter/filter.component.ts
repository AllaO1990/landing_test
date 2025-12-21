import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { TuiScrollbar, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapperComponent, TuiSelect } from '@taiga-ui/kit';
import { filter, Observable, of, shareReplay } from 'rxjs';
import {
  AccountBroker,
  AccountCurrency,
  AccountDealType,
  AccountDealTypes,
  AccountStrategy,
  AccountType,
} from 'types/account';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { AsyncPipe } from '@angular/common';
import { DEAL_TYPES, DELA_LIST_FILTER_CONSTANTS } from './filter.constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RangeWithListComponent } from 'ui-common/lib/range-with-list/range-with-list.component';
import { TuiDayRange } from '@taiga-ui/cdk';
import { getListOfRange } from 'utils/get-list-of-range';
import { TODAY } from 'tokens/desktop/today';

@Component({
  selector: 'deal-filter',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TuiDataListWrapperComponent,
    TuiScrollbar,
    TuiTextfield,
    TuiSelect,
    TuiChevron,
    AsyncPipe,
    RangeWithListComponent,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterDealListComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDealListComponent implements ControlValueAccessor, AfterViewInit {
  static valueDefaultStrategy = { name: 'Все', key: 'all', id: null };
  static valueDefaultType = { name: 'Все', key: 'all', id: null };
  static valueDefaultBroker = { broker: 'Все', brokerId: null };
  static valueDefaultDealType = { name: 'Открытые', id: 'open' };
  static valueDefaultCurrency = { currency: 'Все', currencySymbol: 'Все', currencyId: null };

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #accountFacade: AccountFacade = inject(AccountFacade);
  readonly #today: Date = inject(TODAY);

  protected readonly constants = DELA_LIST_FILTER_CONSTANTS;
  readonly size = 's';
  readonly rangeList: { text: string; range: TuiDayRange }[] = getListOfRange(this.#today);

  stringifyOrderType = signal((x: AccountType) => x.name);
  identityMatcherOrderType = signal((a: AccountType, b: AccountType) => a.id === b.id);
  stringifyStrategy = signal((x: AccountStrategy) => x.name);
  identityMatcherStrategy = signal((a: AccountStrategy, b: AccountStrategy) => a.id === b.id);
  stringifyBroker = signal((x: AccountBroker) => x.broker);
  identityMatcherBroker = signal((a: AccountBroker, b: AccountBroker) => a.brokerId === b.brokerId);
  stringifyDealType = signal((x: AccountDealType) => x.name);
  identityMatcherDealType = signal((a: AccountDealType, b: AccountDealType) => a.id === b.id);
  stringifyCurrency = signal((x: AccountCurrency) => x.currencySymbol || '');
  identityMatcherCurrency = signal((a: AccountCurrency, b: AccountCurrency) => a.currencyId === b.currencyId);

  protected selectRangeHandler = (item: { text: string; range: TuiDayRange }) => item.range;
  protected onChange = (_: any) => {};
  protected onTouched = () => {};

  readonly formGroup: FormGroup = new FormGroup({
    dealType: new FormControl(FilterDealListComponent.valueDefaultDealType),
    type: new FormControl(FilterDealListComponent.valueDefaultType),
    strategy: new FormControl(FilterDealListComponent.valueDefaultStrategy),
    broker: new FormControl(FilterDealListComponent.valueDefaultBroker),
    currency: new FormControl(FilterDealListComponent.valueDefaultCurrency),
    range: new FormControl(this.rangeList[5].range),
  });

  readonly dealTypes$: Observable<AccountDealTypes> = of(DEAL_TYPES);

  readonly strategy$: Observable<AccountStrategy[]> = this.#accountFacade.strategies$.pipe(
    filter((list: AccountStrategy[] | null): list is AccountStrategy[] => list !== null),
    map((list: AccountStrategy[]) => [FilterDealListComponent.valueDefaultStrategy, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly types$: Observable<AccountType[]> = this.#accountFacade.types$.pipe(
    filter((list: AccountType[] | null): list is AccountType[] => list !== null),
    map((list: AccountType[]) => [FilterDealListComponent.valueDefaultType, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly brokers$: Observable<AccountBroker[]> = this.#accountFacade.brokers$.pipe(
    filter((list: null | AccountBroker[]): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [FilterDealListComponent.valueDefaultBroker, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly currency$: Observable<AccountCurrency[] | null> = this.#accountFacade.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [FilterDealListComponent.valueDefaultCurrency, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngAfterViewInit(): void {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value: unknown) => this.onChange(value));
  }

  writeValue(obj: any): void {
    this.formGroup.patchValue(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formGroup[isDisabled ? 'disable' : 'enable']();
  }
}

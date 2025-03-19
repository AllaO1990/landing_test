import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, forwardRef, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { RangeWithListComponent } from 'ui-common/lib/range-with-list/range-with-list.component';
import { TuiButton } from '@taiga-ui/core';
import { BehaviorSubject, filter, Observable, shareReplay, startWith, Subject, switchMap, take, tap } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params } from '@angular/router';

@Component({
  selector: 'lib-dialog-filter',
  standalone: true,
  imports: [
    AsyncPipe,
    TuiSelectModule,
    NgIf,
    ReactiveFormsModule,
    NgForOf,
    RangeWithListComponent,
    TuiButton,
    TuiTextfieldControllerModule,
  ],
  templateUrl: './dialog-filter.component.html',
  styleUrl: './dialog-filter.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DialogFilterComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogFilterComponent implements ControlValueAccessor, AfterViewInit {
  readonly #service: AccountFacade = inject(AccountFacade);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #filterValue$: Subject<Params> = new BehaviorSubject({});

  readonly size = 's';
  readonly maxDate = TuiDay.fromLocalNativeDate(new Date());
  readonly portfolios$: Observable<AccountPortfolio[]> = this.#service.portfolios$.pipe(
    filter((list: AccountPortfolio[] | null): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [{ portfolio: 'Все', portfolioId: null }, ...list]),
    tap((list: AccountPortfolio[]) => this.controlPortfolio.patchValue(list[0])),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly brokers$: Observable<null | AccountBroker[]> = this.#service.brokers$.pipe(
    filter((list: AccountBroker[] | null): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [{ broker: 'Все', brokerId: null }, ...list]),
    tap((list: AccountBroker[]) => this.controlBroker.patchValue(list[0])),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly currencies$: Observable<null | AccountCurrency[]> = this.#service.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [{ currency: 'Все', currencySymbol: 'Все', currencyId: null }, ...list]),
    tap((list: AccountCurrency[]) => this.controlCurrency.patchValue(list[0])),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly today = new Date(new Date().setUTCHours(12, 0, 0, 0));
  readonly rangeList: { text: string; range: TuiDayRange }[] = [
    {
      text: '7',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-7)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '30',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-30)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '90',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(this._getStartDate(-90)),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: '365',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(new Date(new Date().setFullYear(this._getStartDate(-365).getFullYear(), 0, 1))),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
    {
      text: 'С Начала года',
      range: new TuiDayRange(
        TuiDay.fromLocalNativeDate(new Date(new Date().setFullYear(this.today.getFullYear(), 0, 1))),
        TuiDay.fromLocalNativeDate(this.today)
      ),
    },
  ];

  isDisabled = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  readonly form: FormGroup = new FormGroup({
    range: new FormControl(this.rangeList[3].range),
    broker: new FormControl(null),
    currency: new FormControl(null),
    portfolio: new FormControl(null),
  });

  get controlBroker(): FormControl {
    return this.form.get('broker') as FormControl;
  }

  get controlCurrency(): FormControl {
    return this.form.get('currency') as FormControl;
  }

  get controlPortfolio(): FormControl {
    return this.form.get('portfolio') as FormControl;
  }

  readonly isDisabled$: Observable<boolean> = this.form.valueChanges.pipe(
    startWith(this.form.value),
    switchMap((_: Params) =>
      this.#filterValue$
        .asObservable()
        .pipe(map((filter: Params) => JSON.stringify(this.form.value) === JSON.stringify(filter)))
    )
  );

  selectRangeHandler = (item: { text: string; range: TuiDayRange }) => item.range;

  writeValue(obj: any): void {
    this.form.patchValue(obj);
    this.#filterValue$.next(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  ngAfterViewInit(): void {
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.form.value),
        filter((value: any) => value['broker'] !== null && value['currency'] !== null && value['portfolio'] !== null),
        take(1)
      )
      .subscribe((value) => {
        this.#filterValue$.next(value);
        this.onChange(value);
      });
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    this.#filterValue$.next(this.form.value);
    this.onChange(this.form.value);
    this.onTouched();
  }

  private _getStartDate(start: number): Date {
    const date = new Date(this.today);
    return new Date(date.setDate(date.getDate() + start));
  }
}

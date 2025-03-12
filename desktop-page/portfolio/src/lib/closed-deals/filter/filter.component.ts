import { AfterViewInit, ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FILTER_CLOSED_DEALS_CONSTANTS } from './filter.constants';
import { filter, Observable, of, shareReplay, tap } from 'rxjs';
import { AccountBroker, AccountCurrency, AccountPortfolio } from 'types/account';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';

@Component({
  selector: 'lib-filter-closed-deals',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, TuiSelectModule, TuiTextfieldControllerModule, NgIf],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent implements ControlValueAccessor, AfterViewInit {
  readonly #accountFacade: AccountFacade = inject(AccountFacade);

  readonly size = 's';
  readonly constants = FILTER_CLOSED_DEALS_CONSTANTS;
  onChange = (_: any) => {};
  onTouched = () => {};

  readonly formGroup: FormGroup = new FormGroup({
    assets: new FormControl({ value: null, disabled: true }, Validators.required),
    transaction: new FormControl({ value: null, disabled: true }, Validators.required),
    strategy: new FormControl({ value: null, disabled: true }, Validators.required),
    portfolio: new FormControl({ value: null, disabled: false }, Validators.required),
    broker: new FormControl({ value: null, disabled: false }, Validators.required),
    currency: new FormControl({ value: null, disabled: false }, Validators.required),
  });

  get controlAssets() {
    return this.formGroup.get('assets') as FormControl;
  }

  get controlTransaction() {
    return this.formGroup.get('transaction') as FormControl;
  }

  get controlStrategy() {
    return this.formGroup.get('strategy') as FormControl;
  }

  get controlPortfolio() {
    return this.formGroup.get('portfolio') as FormControl;
  }

  get controlBroker() {
    return this.formGroup.get('broker') as FormControl;
  }

  get controlCurrency() {
    return this.formGroup.get('currency') as FormControl;
  }

  readonly assets$: Observable<any[]> = of([]).pipe(
    filter((list: any[] | null): list is any[] => list !== null),
    map((list: any[]) => [{ value: 'Все', id: null }, ...list]),
    tap((list: any[]) => {
      if (list !== null && list.length > 0 && this.controlAssets.value === null) {
        this.controlAssets.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly transaction$: Observable<any[]> = of([]).pipe(
    filter((list: any[] | null): list is any[] => list !== null),
    map((list: any[]) => [{ value: 'Все', id: null }, ...list]),
    tap((list: any[]) => {
      if (list !== null && list.length > 0 && this.controlTransaction.value === null) {
        this.controlTransaction.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly strategy$: Observable<any[]> = of([]).pipe(
    filter((list: any[] | null): list is any[] => list !== null),
    map((list: any[]) => [{ value: 'Все', id: null }, ...list]),
    tap((list: any[]) => {
      if (list !== null && list.length > 0 && this.controlStrategy.value === null) {
        this.controlStrategy.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly portfolios$: Observable<AccountPortfolio[]> = this.#accountFacade.portfolios$.pipe(
    filter((list: AccountPortfolio[] | null): list is AccountPortfolio[] => list !== null),
    map((list: AccountPortfolio[]) => [{ portfolio: 'Все', portfolioId: null }, ...list]),
    tap((list: AccountPortfolio[]) => {
      if (list !== null && list.length > 0 && this.controlPortfolio.value === null) {
        this.controlPortfolio.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly broker$: Observable<null | AccountBroker[]> = this.#accountFacade.brokers$.pipe(
    filter((list: AccountBroker[] | null): list is AccountBroker[] => list !== null),
    map((list: AccountBroker[]) => [{ broker: 'Все', brokerId: null }, ...list]),
    tap((list: null | AccountBroker[]) => {
      if (list !== null && list.length > 0 && this.controlBroker.value === null) {
        this.controlBroker.patchValue(list[0]);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly currency$: Observable<null | AccountCurrency[]> = this.#accountFacade.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [{ currency: 'Все', currencySymbol: 'Все', currencyId: null }, ...list]),
    tap((list: null | AccountCurrency[]) => {
      if (list !== null && list.length > 0) {
        if (this.controlCurrency.value === null) {
          this.controlCurrency.patchValue(list[0]);
        }
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngAfterViewInit(): void {
    this.formGroup.valueChanges.pipe().subscribe((value: any[] | null) => {
      this.onChange(value);
    });
  }

  writeValue(obj: any): void {
    if (obj) {
      this.formGroup.patchValue(obj);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // this.formGroup[isDisabled ? 'disable' : 'enable']();
  }
}

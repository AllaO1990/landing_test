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
import { debounceTime, filter, Observable, shareReplay } from 'rxjs';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { map } from 'rxjs/operators';
import { AccountFacade } from 'stores/facades/account.facade';
import { AsyncPipe } from '@angular/common';
import { IDEA_LIST_FILTER_CONSTANTS } from './filter.constants';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocalStorage } from 'storage/local.storage';
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';

@Component({
  selector: 'idea-filter',
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
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterIdeaListComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterIdeaListComponent implements ControlValueAccessor, AfterViewInit {
  static valueDefaultCurrency = { currency: 'Все', currencySymbol: 'Все', currencyId: null };
  static valueDefaultStrategy = { name: 'Все', key: 'all', id: null };
  static valueDefaultType = { name: 'Все', key: 'all', id: null };

  readonly #localStorage: LocalStorage = inject(LOCAL_STORAGE);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #accountFacade: AccountFacade = inject(AccountFacade);

  protected readonly constants = IDEA_LIST_FILTER_CONSTANTS;
  readonly size = 's';

  stringifyOrderType = signal((x: AccountType) => x.name);
  identityMatcherOrderType = signal((a: AccountType, b: AccountType) => a.id === b.id);
  stringifyStrategy = signal((x: AccountStrategy) => x.name);
  identityMatcherStrategy = signal((a: AccountStrategy, b: AccountStrategy) => a.id === b.id);
  stringifyCurrency = signal((x: AccountCurrency) => x.currencySymbol || '');
  identityMatcherCurrency = signal((a: AccountCurrency, b: AccountCurrency) => a.currencyId === b.currencyId);

  protected onChange = (_: any) => {};
  protected onTouched = () => {};

  readonly formGroup: FormGroup = new FormGroup({
    type: new FormControl(FilterIdeaListComponent.valueDefaultType),
    strategy: new FormControl(FilterIdeaListComponent.valueDefaultStrategy),
    currency: new FormControl(FilterIdeaListComponent.valueDefaultCurrency),
  });

  readonly currency$: Observable<AccountCurrency[] | null> = this.#accountFacade.currencies$.pipe(
    filter((list: AccountCurrency[] | null): list is AccountCurrency[] => list !== null),
    map((list: AccountCurrency[]) => [FilterIdeaListComponent.valueDefaultCurrency, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly strategy$: Observable<AccountStrategy[]> = this.#accountFacade.strategies$.pipe(
    filter((list: AccountStrategy[] | null): list is AccountStrategy[] => list !== null),
    map((list: AccountStrategy[]) => [FilterIdeaListComponent.valueDefaultStrategy, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly types$: Observable<AccountType[]> = this.#accountFacade.types$.pipe(
    filter((list: AccountType[] | null): list is AccountType[] => list !== null),
    map((list: AccountType[]) => [FilterIdeaListComponent.valueDefaultType, ...list]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngAfterViewInit(): void {
    this._initFormGroup();

    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(150))
      .subscribe((value: any) => {
        this.#localStorage.setItem('filterIdea', value);
        this.onChange(value);
      });
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

  private _initFormGroup(): void {
    const value = this.#localStorage.getItem('filterIdea') || {};

    this.formGroup.patchValue(value);
  }
}

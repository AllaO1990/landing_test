import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  InputSignal,
  Signal,
  signal,
} from '@angular/core';
import { PORTFOLIO_CONSTANTS } from '@data-access-portfolio/constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterPortfolioListComponent } from '../filter/filter.component';
import { AsyncPipe } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, tuiNumberFormatProvider, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapperComponent, TuiSelect, TuiSkeleton } from '@taiga-ui/kit';
import { getListOfRange } from 'utils/get-list-of-range';
import { Observable, of, startWith } from 'rxjs';
import { TuiDayRange } from '@taiga-ui/cdk';
import { DataAccessPortfolioService } from '@data-access-portfolio/data-access.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getParamsFromRange } from 'utils/get-params-from-range';
import { Params } from '@angular/router';
import { map } from 'rxjs/operators';
import { DataAccessPortfolioState } from '@data-access-portfolio/store';
import { LoaderComponent } from '@ui/components/loader';
import { AccountBalance } from 'types/account';

interface CalendarRangeItem {
  text: string;
  range: TuiDayRange;
}

@Component({
  selector: 'portfolio-layout',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FilterPortfolioListComponent,
    AsyncPipe,
    TuiFormatNumberPipe,
    TuiButton,
    TuiChevron,
    TuiDataListWrapperComponent,
    TuiTextfield,
    TuiSelect,
    TuiSkeleton,
    LoaderComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  providers: [tuiNumberFormatProvider({ precision: 2, decimalMode: 'always' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit {
  readonly #dataAccess: DataAccessPortfolioService = inject(DataAccessPortfolioService);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #rangeList: CalendarRangeItem[] = getListOfRange(new Date());

  protected readonly size = 's';
  protected readonly constants = PORTFOLIO_CONSTANTS;
  protected readonly controlCalendar: FormControl = new FormControl(this.#rangeList[0]);
  protected readonly calendar$: Observable<CalendarRangeItem[]> = of(this.#rangeList);

  data: InputSignal<DataAccessPortfolioState> = input.required();
  readonly isLoaded = computed(() => !this.data().isLoaded);
  readonly isLoading = computed(() => this.data().isLoaded && !this.data().isLoading);
  readonly balance: Signal<AccountBalance | null> = computed(() => this.data().data);

  stringifyCalendar = signal((x: CalendarRangeItem) => x.text);
  identityMatcherCalendar = signal((a: CalendarRangeItem, b: CalendarRangeItem) => a.range === b.range);

  ngAfterViewInit(): void {
    this.controlCalendar.valueChanges
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        startWith(this.controlCalendar.value),
        map((value: CalendarRangeItem) => getParamsFromRange(value.range))
      )
      .subscribe((value: { from: string | null; to: string | null }) =>
        this.#dataAccess.params.update((params: Params | null) => ({ ...params, ...value }))
      );
  }

  onShowChart(event: Event): void {
    event.preventDefault();
  }
}

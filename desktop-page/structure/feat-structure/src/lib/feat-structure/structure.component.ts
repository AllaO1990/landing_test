import { TuiRingChart } from '@taiga-ui/addon-charts';
import { TuiBlock, TuiPin, TuiSkeleton } from '@taiga-ui/kit';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  input,
  InputSignal,
  Output,
  Signal,
} from '@angular/core';
import { AsyncPipe, DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { StructureIsNaNPipe, StructureListValuePipe } from './structure.pipe';
import { TuiBreakpointService, TuiFormatNumberPipe, TuiGroup, tuiNumberFormatProvider } from '@taiga-ui/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { COLOR_LIST, STRUCTURE_CATEGORY } from './structure.constants';
import { Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoaderComponent } from '@ui/components/loader';
import { UiList, UiListItem } from '@ui/components/list';
import { AccountStructureItem } from 'types/account';
import { StructureService } from './structure.service';
import { DataAccessStructureState } from '@data-access-structure';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface StructureControl {
  name: string;
  value: string;
}

type RingChartSize = 'm' | 'l' | 'xl' | 's' | 'xs';

let COLOR_LIMIT = 5;

@Component({
  selector: 'structure',
  standalone: true,
  imports: [
    TuiRingChart,
    LoaderComponent,
    StructureListValuePipe,
    StructureIsNaNPipe,
    TuiFormatNumberPipe,
    NgTemplateOutlet,
    TuiBlock,
    TuiGroup,
    ReactiveFormsModule,
    AsyncPipe,
    UiList,
    UiListItem,
    TuiPin,
    TuiSkeleton,
  ],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
  providers: [tuiNumberFormatProvider({ precision: 2, decimalMode: 'always' }), StructureService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Structure implements AfterViewInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #service: StructureService = inject(StructureService);

  private readonly _doc: Document = inject(DOCUMENT);
  private readonly _styleId: string = 'structure';
  readonly #ringChartSizeMapper: { [key: string]: RingChartSize } = {
    mobile: 'xl',
    desktopSmall: 'm',
    desktopLarge: 'm',
    desktopLarger: 'm',
    desktopLargest: 'l',
  };

  readonly categories: StructureControl[] = STRUCTURE_CATEGORY;
  readonly controlCategories: FormControl = new FormControl(this.categories[0], Validators.required);

  readonly ringChartSize$: Observable<RingChartSize> = inject(TuiBreakpointService).pipe(
    map((desktopSize) => this._getSize(desktopSize))
  );

  activeItemIndex = Number.NaN;
  summaryCurrencySymbol = '';

  @Output() selectedCategory: EventEmitter<{ name: string; value: string }> = new EventEmitter();

  data: InputSignal<DataAccessStructureState> = input.required();
  isLoaded: Signal<boolean> = computed(() => this.data().isLoaded);
  isLoading: Signal<boolean> = computed(() => this.data().isLoading);
  list: Signal<AccountStructureItem[] | null> = computed(() => {
    const structure = this.data().data;
    if (!structure) {
      return null;
    }

    if (structure.items.length > COLOR_LIMIT) {
      COLOR_LIMIT = structure.items.length;
      this._generateColorList(COLOR_LIMIT);
    }

    return structure.items;
  });
  summary: Signal<number | null> = computed(() => {
    const list = this.list();
    if (!list) {
      return null;
    }

    return list.reduce((acc: number, item: AccountStructureItem) => (acc += item.totalPrice), 0);
  });
  currencySymbol: Signal<string> = computed(() => {
    const structure = this.data().data;

    if (!structure) {
      return '';
    }

    return structure.totalPortfolio.currencySymbol;
  });

  ngAfterViewInit(): void {
    this.controlCategories.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), startWith(this.controlCategories.value))
      .subscribe((value) => this.selectedCategory.emit(value));
  }

  getNumber = (item: AccountStructureItem): number => item.portfolioSharePct;

  private _generateColorList(length: number): void {
    const style = this._getStyleTag();
    const getColor = this._getColor(length);
    const text: string = Array.from(
      { length },
      (_, i: number) => `--tui-chart-categorical-0${i}: ${getColor(i)};`
    ).join('');

    style.innerHTML = `:root{${text}`;
  }

  private _getColor(length: number): (value: number) => string {
    return this.#service.getColor(length, COLOR_LIST);
  }

  private _getStyleTag(): HTMLElement {
    return this.#service.getStyleTag(this._doc, this._styleId);
  }

  private _getSize(desktopSize: null | string): RingChartSize {
    if (desktopSize !== null) {
      return this.#ringChartSizeMapper[desktopSize];
    }
    return 'xl';
  }

  onMouseenter(event: Event, i: number): void {
    event.preventDefault();

    this.activeItemIndex = i;
  }

  onMouseleave(event: Event): void {
    event.preventDefault();

    this.activeItemIndex = Number.NaN;
  }
}

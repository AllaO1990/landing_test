import { TuiRingChart } from '@taiga-ui/addon-charts';
import { TuiBlock, TuiPin } from '@taiga-ui/kit';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, DOCUMENT, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { StructureIsNaNPipe, StructureListValuePipe } from './structure.pipe';
import { scaleLinear } from 'd3-scale';
import { TuiBreakpointService, TuiFormatNumberPipe, TuiGroup, tuiNumberFormatProvider } from '@taiga-ui/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { COLOR_LIST, STRUCTURE_CATEGORY } from './structure.constants';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  Observable,
  shareReplay,
  startWith,
  Subject,
  tap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { LoaderComponent } from '@ui/components/loader';
import { ItemDirective, ListComponent } from '@ui/components/list';
import {
  AccountBroker,
  AccountCurrency,
  AccountPortfolio,
  AccountRange,
  AccountStructure,
  AccountStructureItem,
} from 'types/account';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { Params } from '@angular/router';

interface StructureControl {
  name: string;
  value: string;
}

type RingChartSize = 'm' | 'l' | 'xl' | 's' | 'xs';

let COLOR_LIMIT = 5;

@Component({
  selector: 'portfolio-structure',
  standalone: true,
  imports: [
    TuiRingChart,
    LoaderComponent,
    NgIf,
    StructureListValuePipe,
    StructureIsNaNPipe,
    NgForOf,
    TuiFormatNumberPipe,
    NgTemplateOutlet,
    TuiBlock,
    TuiGroup,
    ReactiveFormsModule,
    AsyncPipe,
    ListComponent,
    ItemDirective,
    TuiPin,
  ],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
  providers: [tuiNumberFormatProvider({ precision: 2, decimalMode: 'always' })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructureComponent implements AfterViewInit {
  readonly #store: PortfolioFacade = inject(PortfolioFacade);
  private readonly _doc: Document = inject(DOCUMENT);
  private readonly _styleId: string = 'structure';
  private readonly _ringChartSizeMapper: { [key: string]: RingChartSize } = {
    mobile: 'xl',
    desktopSmall: 'm',
    desktopLarge: 'm',
    desktopLarger: 'm',
    desktopLargest: 'l',
  };
  readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  readonly categories: StructureControl[] = STRUCTURE_CATEGORY;
  readonly controlCategories: FormControl = new FormControl(this.categories[0], Validators.required);

  readonly ringChartSize$: Observable<RingChartSize> = this.breakpoint$.pipe(
    map((desktopSize) => {
      if (desktopSize !== null) {
        return this._ringChartSizeMapper[desktopSize];
      }
      return 'xl';
    })
  );

  readonly portfolio$: Observable<AccountPortfolio> = this.#store.portfolio$.pipe(
    filter((list: null | AccountPortfolio): list is AccountPortfolio => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly broker$: Observable<AccountBroker> = this.#store.broker$.pipe(
    filter((list: null | AccountBroker): list is AccountBroker => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly currency$: Observable<AccountCurrency> = this.#store.currency$.pipe(
    filter((list: null | AccountCurrency): list is AccountCurrency => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly range$: Observable<AccountRange> = this.#store.range$.pipe(
    filter((list: null | AccountRange): list is AccountRange => list !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly isLoad$: Subject<boolean> = new BehaviorSubject(false);

  activeItemIndex = Number.NaN;
  summary = 0;
  summaryCurrencySymbol = '';

  list$: Observable<AccountStructureItem[] | null> = this.#store.structure$.pipe(
    map((list: null | AccountStructure) => list && list.items),
    tap((list: null | AccountStructureItem[]) => {
      this.isLoad$.next(false);

      if (list !== null) {
        if (list.length > COLOR_LIMIT) {
          COLOR_LIMIT = list.length;
          this._generateColorList(COLOR_LIMIT);
        }

        this.summaryCurrencySymbol = list[0].currencySymbol;
        this.summary = list.reduce((acc: number, item: AccountStructureItem) => (acc += item.totalPrice), 0);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngAfterViewInit(): void {
    combineLatest([
      this.broker$,
      this.currency$,
      this.range$,
      this.portfolio$,
      this.controlCategories.valueChanges.pipe(startWith(this.controlCategories.value)),
    ])
      .pipe(
        debounceTime(0),
        map((params: [AccountBroker, AccountCurrency, AccountRange, AccountPortfolio, { value: string }]) => ({
          brokerId: params[0].brokerId,
          currencyId: params[1].currencyId,
          portfolioId: params[3].portfolioId,
          date: params[2].to,
          groupBy: params[4].value,
        })),
        tap(() => this.isLoad$.next(true))
      )
      .subscribe((params: Params) => this.#store.loadStructure(params));
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
    const add = length / COLOR_LIST.length;
    const domain = Array.from({ length: COLOR_LIST.length }, (_, i: number) => i * add);

    return scaleLinear(domain, COLOR_LIST);
  }

  private _getStyleTag(): HTMLElement {
    const root: HTMLElement | null = this._doc.querySelector(`style#${this._styleId}`);

    if (root !== null) {
      return root;
    }

    const style: HTMLElement = this._doc.createElement('style');
    style.id = this._styleId;
    this._doc.head.appendChild(style);

    return this._doc.querySelector(`style#${this._styleId}`) as HTMLElement;
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

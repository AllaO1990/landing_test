import { TuiRingChart } from '@taiga-ui/addon-charts';
import { TuiBlock, TuiPin, TuiSkeleton } from '@taiga-ui/kit';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input } from '@angular/core';
import { AsyncPipe, DOCUMENT, NgIf, NgTemplateOutlet } from '@angular/common';
import { StructureIsNaNPipe, StructureListValuePipe } from './structure.pipe';
import { TuiBreakpointService, TuiFormatNumberPipe, TuiGroup, tuiNumberFormatProvider } from '@taiga-ui/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { COLOR_LIST, STRUCTURE_CATEGORY } from './structure.constants';
import { BehaviorSubject, Observable, shareReplay, Subject, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoaderComponent } from '@ui/components/loader';
import { ItemDirective, ListComponent } from '@ui/components/list';
import { AccountStructure, AccountStructureItem } from 'types/account';
import { StructureService } from './structure.service';
import { Response } from 'types/response';

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
    NgIf,
    StructureListValuePipe,
    StructureIsNaNPipe,
    TuiFormatNumberPipe,
    NgTemplateOutlet,
    TuiBlock,
    TuiGroup,
    ReactiveFormsModule,
    AsyncPipe,
    ListComponent,
    ItemDirective,
    TuiPin,
    TuiSkeleton,
  ],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
  providers: [tuiNumberFormatProvider({ precision: 2, decimalMode: 'always' }), StructureService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Structure {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #service: StructureService = inject(StructureService);
  readonly #list$: Subject<Response<AccountStructure> | null> = new BehaviorSubject<Response<AccountStructure> | null>(
    null
  );

  private readonly _doc: Document = inject(DOCUMENT);
  private readonly _styleId: string = 'structure';
  private readonly _ringChartSizeMapper: { [key: string]: RingChartSize } = {
    mobile: 'xl',
    desktopSmall: 'm',
    desktopLarge: 'm',
    desktopLarger: 'm',
    desktopLargest: 'l',
  };

  readonly categories: StructureControl[] = STRUCTURE_CATEGORY;
  readonly controlCategories: FormControl = new FormControl(this.categories[0], Validators.required);

  readonly ringChartSize$: Observable<RingChartSize> = inject(TuiBreakpointService).pipe(
    map((desktopSize) => {
      if (desktopSize !== null) {
        return this._ringChartSizeMapper[desktopSize];
      }
      return 'xl';
    })
  );

  readonly isLoad$: Subject<boolean> = new BehaviorSubject(false);

  activeItemIndex = Number.NaN;
  summary = 0;
  summaryCurrencySymbol = '';

  @Input() set list(value: Response<AccountStructure> | null) {
    this.#list$.next(value);
  }

  list$: Observable<AccountStructureItem[] | null> = this.#list$.asObservable().pipe(
    map((response: Response<AccountStructure> | null) => response && response.data),
    tap((structure: null | AccountStructure) => {
      this.isLoad$.next(false);

      if (structure !== null && structure.items) {
        if (structure.items.length > COLOR_LIMIT) {
          COLOR_LIMIT = structure.items.length;
          this._generateColorList(COLOR_LIMIT);
        }

        this.summaryCurrencySymbol = structure.totalPortfolio.currencySymbol;
        this.summary = structure.items.reduce((acc: number, item: AccountStructureItem) => (acc += item.totalPrice), 0);
      }
    }),
    map((structure: null | AccountStructure) => structure && structure.items),
    shareReplay({ bufferSize: 1, refCount: true })
  );

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

  onMouseenter(event: Event, i: number): void {
    event.preventDefault();

    this.activeItemIndex = i;
  }

  onMouseleave(event: Event): void {
    event.preventDefault();

    this.activeItemIndex = Number.NaN;
  }
}

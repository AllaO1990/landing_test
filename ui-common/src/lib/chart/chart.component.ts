import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { combineLatest, Observable, of, shareReplay, startWith, tap } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { ButtonWithListComponent } from './button-with-list';
import {
  CHART_ATR_ICON,
  CHART_EMA_ICON,
  CHART_EMA_LIST,
  CHART_SMA_ICON,
  CHART_SMA_LIST,
  CHART_ZONE_ICON,
  CHART_ZONE_LIST,
} from './chart.constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { map } from 'rxjs/operators';
import { LegendComponent } from './legend';
import { Timeframe } from 'types/timeframe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartComponent } from '@ui/components/chart';
import { SelectFacade } from 'stores/facades/select.facade';
import { LoaderComponent } from '@ui/components/loader';
import { StockEvent } from 'types/stock-event';

interface IndicatorListItem<T = string> {
  name: string;
  value: T;
  disabled: boolean;
  order: number;
}

@Component({
  selector: 'lib-chart',
  standalone: true,
  imports: [
    AsyncPipe,
    ChartComponent,
    ButtonWithListComponent,
    ReactiveFormsModule,
    TuiLoader,
    NgIf,
    TuiButton,
    TuiIcon,
    LegendComponent,
    LoaderComponent,
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCandlestickComponent implements OnInit {
  // private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _destroy$: DestroyRef = inject(DestroyRef);
  private readonly _selectFacade: SelectFacade = inject(SelectFacade);

  toggleLegend = true;
  toggleActions = true;

  emaIcon = CHART_EMA_ICON;
  emaList: IndicatorListItem[] = CHART_EMA_LIST;
  valueEma: IndicatorListItem[] | null = null;
  smaIcon = CHART_SMA_ICON;
  smaList: IndicatorListItem[] = CHART_SMA_LIST;
  valueSma: IndicatorListItem[] | null = null;
  zoneIcon = CHART_ZONE_ICON;
  zoneList: IndicatorListItem<Timeframe>[] = CHART_ZONE_LIST;
  valueZone: IndicatorListItem<Timeframe>[] | null = null;
  artIcon = CHART_ATR_ICON;

  @Input() event: null | StockEvent = null;

  readonly size = 's';
  readonly controlEma: FormControl<IndicatorListItem[] | null> = new FormControl([this.emaList[1], this.emaList[5]]);
  readonly controlSma: FormControl<IndicatorListItem[] | null> = new FormControl([this.smaList[0], this.smaList[1]]);
  readonly controlAtr: FormControl<boolean> = new FormControl<boolean>(true, { nonNullable: true });
  readonly controlZone: FormControl<IndicatorListItem<Timeframe>[] | null> = new FormControl([this.zoneList[0]]);

  readonly selected$: Observable<StockInstrument | null> = this._selectFacade.instrument$;
  readonly candles$: Observable<[string | number, number, number, number, number][] | null> = of(null).pipe(
    shareReplay(1)
  );
  // readonly candles$: Observable<[string | number, number, number, number, number][] | null> = this._store.candles$.pipe(
  //   shareReplay(1)
  // );
  // readonly indicators$: Observable<any[]> = combineLatest([this._store.indicatorEma$, this._store.indicatorSma$]).pipe(
  //   debounceTime(0),
  //   map((data: any[][]) => data.flat())
  // );
  // readonly text$: Observable<string | null> = this._store.indicatorAtr$.pipe(
  //   map((value: { atr: number }) => value && `1 ATR: ${value.atr}`),
  //   shareReplay({ bufferSize: 1, refCount: true })
  // );

  // readonly zone$: Observable<ChartFigure[] | null> = combineLatest([
  //   this._store.zones$.pipe(map((list: ChartFigure[] | null) => list || [])),
  //   this._store.chartFigures$.pipe(map((list: ChartFigure[] | null) => list || [])),
  // ]).pipe(
  //   map(([zones, figures]: [ChartFigure[], ChartFigure[]]) => [...zones, ...figures]),
  //   shareReplay({ bufferSize: 1, refCount: true })
  // );

  legend$: Observable<IndicatorListItem[]> = combineLatest([
    this.controlEma.valueChanges.pipe(
      startWith(this.controlEma.value),
      map((list: IndicatorListItem[] | null) => (list ? list : []))
    ),
    this.controlSma.valueChanges.pipe(
      startWith(this.controlSma.value),
      map((list: IndicatorListItem[] | null) => (list ? list : []))
    ),
  ]).pipe(
    map(([ema, sma]: [IndicatorListItem[], IndicatorListItem[]]) => [...ema, ...sma]),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  isDisabledButtonLegend$: Observable<boolean> = combineLatest([
    this.controlEma.valueChanges,
    this.controlSma.valueChanges,
  ]).pipe(
    map(
      ([emaList, smaList]: [IndicatorListItem[] | null, IndicatorListItem[] | null]) =>
        !((emaList && emaList.length > 0) || (smaList && smaList.length > 0))
    ),
    tap((value: boolean) => (this.toggleLegend = !value))
  );

  ngOnInit(): void {
    this.controlEma.valueChanges
      .pipe(takeUntilDestroyed(this._destroy$), startWith(this.controlEma.value))
      .subscribe((result: IndicatorListItem[] | null) => {
        // this._store.updateIndicatorEmaSelected(this._getValue(result));
      });

    this.controlSma.valueChanges
      .pipe(takeUntilDestroyed(this._destroy$), startWith(this.controlSma.value))
      .subscribe((result: IndicatorListItem[] | null) => {
        // this._store.updateIndicatorSmaSelected(this._getValue(result));
      });

    this.controlZone.valueChanges
      .pipe(takeUntilDestroyed(this._destroy$), startWith(this.controlZone.value))
      .subscribe((result: IndicatorListItem<Timeframe>[] | null) => {
        // this._store.updateConsolidationZoneSelected(this._getValue(result));
      });

    // this._store.updateIndicatorAtrSelected(this.controlAtr.value);
  }

  onToggleAtr(event: Event): void {
    event.preventDefault();

    const value = !this.controlAtr.value;

    this.controlAtr.patchValue(value);
    // this._store.updateIndicatorAtrSelected(value);
  }

  onOpenedEma(event: boolean): void {
    if (!event && this.valueEma !== this.controlEma.value) {
      this._actionEma();
    }
  }

  onToggledEma(): void {
    if (this.valueEma !== this.controlEma.value) {
      this._actionEma();
    }
  }

  onOpenedSma(event: boolean): void {
    if (!event && this.valueSma !== this.controlSma.value) {
      this._actionSma();
    }
  }

  onToggledSma(): void {
    if (this.valueSma !== this.controlSma.value) {
      this._actionSma();
    }
  }

  onOpenedZone(event: boolean): void {
    if (!event && this.valueZone !== this.controlZone.value) {
      this._actionZone();
    }
  }

  onToggledZone(): void {
    if (this.valueZone !== this.controlZone.value) {
      this._actionZone();
    }
  }

  onToggleLegend(event: Event): void {
    event.preventDefault();

    this.toggleLegend = !this.toggleLegend;
  }

  onToggleActions(event: Event): void {
    event.preventDefault();

    this.toggleActions = !this.toggleActions;
  }

  private _getValue<T>(value: IndicatorListItem<T>[] | null): T[] {
    if (value === null) {
      return [];
    }

    return value
      .sort((a: IndicatorListItem<T>, b: IndicatorListItem<T>) => a.order - b.order)
      .map((item: IndicatorListItem<T>) => item.value);
  }

  private _actionEma(): void {
    this.valueEma = this.controlEma.value;
    // this._store.updateIndicatorEmaSelected(this._getValue(this.controlEma.value));
  }

  private _actionSma(): void {
    this.valueSma = this.controlSma.value;
    // this._store.updateIndicatorSmaSelected(this._getValue(this.controlSma.value));
  }

  private _actionZone(): void {
    this.valueZone = this.controlZone.value;
    // this._store.updateConsolidationZoneSelected(this._getValue(this.controlZone.value) as number[]);
  }
}

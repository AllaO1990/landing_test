import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { StockInstrument } from 'types/stock';
import { ButtonWithListComponent } from './button-with-list';
import {
  CHART_ATR_ICON,
  CHART_EMA_ICON,
  CHART_EMA_LIST,
  CHART_IDEA_ICON,
  CHART_SMA_ICON,
  CHART_SMA_LIST,
  CHART_ZONE_ICON,
  CHART_ZONE_LIST,
} from './chart.constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { filter, map } from 'rxjs/operators';
import { LegendComponent } from './legend';
import { Timeframe } from 'types/timeframe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartComponent } from '@ui/components/chart';
import { LoaderComponent } from '@ui/components/loader';
import { StockEvent } from 'types/stock-event';
import { ChartFacade } from 'stores/facades/chart.facade';
import { ConsolidationZonesShape } from 'types/consolidation-zones';
import { SelectFacade } from 'stores/facades/select.facade';
import * as Highcharts from 'highcharts/highstock';
import { EventSelected } from 'types/events';

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
    NgIf,
    TuiButton,
    LegendComponent,
    LoaderComponent,
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCandlestickComponent implements OnInit {
  private readonly _store: ChartFacade = inject(ChartFacade);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _destroy$: DestroyRef = inject(DestroyRef);

  private mapInterval: { [key: string]: Timeframe } = {
    buttonDay: Timeframe.CANDLE_INTERVAL_DAY,
    buttonWeek: Timeframe.CANDLE_INTERVAL_WEEK,
    buttonMonth: Timeframe.CANDLE_INTERVAL_MONTH,
  };

  toggleLegend = false;
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
  ideaIcon = CHART_IDEA_ICON;

  // @Input() event: null | StockEvent = null;

  readonly size = 's';
  readonly controlEma: FormControl<IndicatorListItem[] | null> = new FormControl([this.emaList[0], this.emaList[5]]);
  readonly controlSma: FormControl<IndicatorListItem[] | null> = new FormControl([this.smaList[0], this.smaList[5]]);
  readonly controlAtr: FormControl<boolean> = new FormControl<boolean>(true, { nonNullable: true });
  readonly controlTarget: FormControl<boolean> = new FormControl<boolean>(true, { nonNullable: true });
  readonly controlZone: FormControl<IndicatorListItem<Timeframe>[] | null> = new FormControl([this.zoneList[0]]);

  readonly selected$: Observable<StockInstrument | null> = this._store.selected$;

  readonly isUpdate$: Observable<boolean | null> = this._store.selected$.pipe(
    filter((select: null | StockInstrument): select is StockInstrument => select !== null),
    switchMap((select: StockInstrument) =>
      this._store.instrument$.pipe(
        filter((candles: any | null): candles is any => candles !== null),
        map((candles: any) => select.id !== candles.id)
      )
    ),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  readonly candles$: Observable<any | null> = this._store.instrument$.pipe(shareReplay(1));

  readonly indicators$: Observable<any[]> = combineLatest([this._store.ema$, this._store.sma$]).pipe(
    debounceTime(0),
    map((data: any[][]) => data.flat())
  );

  readonly text$: Observable<{ data: any; instrument: string } | null> = this._store.atr$.pipe(
    map((value: { data: any; instrument: string } | null) => {
      if (!value || !value.data) {
        return null;
      }

      const str = `1 ATR: ${value.data.atr} (${value.data.atrPct}%)`;

      return {
        ...value,
        data: str,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly zoneIdea$: Observable<null | ConsolidationZonesShape> = this._select.event$.pipe(
    filter((event: null | StockEvent): event is StockEvent => event !== null),
    switchMap((event: StockEvent) => {
      if (event.type === EventSelected.STOCK_LIST || event.type === EventSelected.WATCH_LIST) {
        return of(null);
      }

      return this._store.zonesIdea$;
    })
  );

  readonly zone$: Observable<ConsolidationZonesShape | null> = combineLatest([
    this._store.zones$,
    this.zoneIdea$,
    this._store.zonesWatch$,
  ]).pipe(
    debounceTime(0),
    map((list) => this._concatZones(list)),
    distinctUntilChanged((a, b) => a?.instrument === b?.instrument && a?.data.length === b?.data.length),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly figures$: Observable<ConsolidationZonesShape | null> = combineLatest([
    this._store.figure$.pipe(
      switchMap((figure: ConsolidationZonesShape | null) =>
        this.controlTarget.valueChanges.pipe(
          startWith(this.controlTarget.value),
          map((value: boolean) => (value ? figure : null))
        )
      )
    ),
    this._store.figureUser$,
  ]).pipe(
    map((list) => this._concatFigures(list)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

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
    )
    // tap((value: boolean) => (this.toggleLegend = !value))
  );

  ngOnInit(): void {
    this.controlEma.valueChanges
      .pipe(takeUntilDestroyed(this._destroy$), startWith(this.controlEma.value))
      .subscribe((result: IndicatorListItem[] | null) => {
        this._store.updateSelectedEma(this._getValue(result));
      });

    this.controlSma.valueChanges
      .pipe(takeUntilDestroyed(this._destroy$), startWith(this.controlSma.value))
      .subscribe((result: IndicatorListItem[] | null) => {
        this._store.updateSelectedSma(this._getValue(result));
      });

    this.controlZone.valueChanges
      .pipe(takeUntilDestroyed(this._destroy$), startWith(this.controlZone.value))
      .subscribe((result: IndicatorListItem<Timeframe>[] | null) => {
        this._store.updateSelectedConsolidationZones(this._getValue(result));
      });

    this._store.updateSelectedAtr(this.controlAtr.value);
  }

  onToggleAtr(event: Event): void {
    event.preventDefault();

    const value = !this.controlAtr.value;

    this.controlAtr.patchValue(value);
    this._store.updateSelectedAtr(value);
  }

  onToggleTarget(event: Event): void {
    event.preventDefault();

    const value = !this.controlTarget.value;

    this.controlTarget.patchValue(value);
    // this._store.updateFigure(value);
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

  private _concatZones([zones, zonesIdea, zonesWatch]: [
    ConsolidationZonesShape | null,
    ConsolidationZonesShape | null,
    ConsolidationZonesShape | null
  ]): ConsolidationZonesShape | null {
    let data: Highcharts.AnnotationsOptions[] = [];

    if (zones === null) {
      return null;
    }

    data = zones.data;

    if (zonesIdea !== null) {
      if (zones.instrument === zonesIdea.instrument) {
        data = [...data, ...zonesIdea.data];
      }
    }

    if (zonesWatch !== null) {
      if (zones.instrument === zonesWatch.instrument) {
        data = [...data, ...zonesWatch.data];
      }
    }

    return { ...zones, data };
  }

  private _concatFigures([bot, user]: [
    ConsolidationZonesShape | null,
    ConsolidationZonesShape | null
  ]): ConsolidationZonesShape | null {
    if (bot !== null && user !== null) {
      if (bot.instrument === user.instrument) {
        return { ...bot, data: [...bot.data, ...user.data] };
      }

      return user;
    }

    if (bot !== null) {
      return bot;
    }

    return user;
  }

  onEvent(event: { type: string; event: Event }): void {
    if (this.mapInterval[event.type]) {
      this._store.updateInterval(this.mapInterval[event.type]);
    }
  }
}

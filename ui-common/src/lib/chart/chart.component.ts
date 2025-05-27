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
import { filter, map, tap } from 'rxjs/operators';
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
import { LOCAL_STORAGE } from 'tokens/desktop/local-storage';
import { LocalStorage } from 'storage/local.storage';
import { sortText } from 'utils/sort-text';
import { sortNumber } from 'utils/sort-number';

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
  readonly #localStorage: LocalStorage = inject(LOCAL_STORAGE);
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
  valueEma: string[] | null = null;
  smaIcon = CHART_SMA_ICON;
  smaList: IndicatorListItem[] = CHART_SMA_LIST;
  valueSma: string[] | null = null;
  zoneIcon = CHART_ZONE_ICON;
  zoneList: IndicatorListItem<Timeframe>[] = CHART_ZONE_LIST;
  valueZone: number[] | null = null;
  artIcon = CHART_ATR_ICON;
  ideaIcon = CHART_IDEA_ICON;

  readonly size = 's';
  readonly controlEma: FormControl<string[] | null> = new FormControl(
    this.#localStorage.getItem('chartControlEma') || [this.emaList[0].value, this.emaList[5].value]
  );
  readonly controlSma: FormControl<string[] | null> = new FormControl(
    this.#localStorage.getItem('chartControlSma') || [this.smaList[0].value, this.smaList[5].value]
  );
  readonly controlAtr: FormControl<boolean> = new FormControl<boolean>(
    this.#localStorage.getItem('chartControlAtr') ?? true,
    { nonNullable: true }
  );
  readonly controlTarget: FormControl<boolean> = new FormControl<boolean>(
    this.#localStorage.getItem('chartControlTarget') ?? true,
    { nonNullable: true }
  );
  readonly controlZone: FormControl<number[] | null> = new FormControl(
    this.#localStorage.getItem('chartControlZone') || [this.zoneList[0].value]
  );

  readonly isUpdate$: Observable<boolean | null> = this._store.selected$.pipe(
    filter((id: null | string): id is string => id !== null),
    switchMap((id: string) =>
      this._store.instrument$.pipe(
        filter((candles: any | null): candles is any => candles !== null),
        map((candles: any) => id !== candles.id)
      )
    ),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  readonly candles$: Observable<any | null> = this._store.instrument$.pipe(shareReplay(1));

  readonly indicators$: Observable<any[]> = combineLatest([
    this._store.ema$.pipe(map((list: any[] | null) => (list === null ? [] : list))),
    this._store.sma$.pipe(map((list: any[] | null) => (list === null ? [] : list))),
  ]).pipe(
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
    distinctUntilChanged((a, b) => a?.instrument === b?.instrument && a?.data?.length === b?.data?.length),
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
    debounceTime(0),
    map((list) => this._concatFigures(list)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  legend$: Observable<IndicatorListItem[]> = combineLatest([
    this.controlEma.valueChanges.pipe(
      startWith(this.controlEma.value),
      map((list: string[] | null) => (list ? list : []))
    ),
    this.controlSma.valueChanges.pipe(
      startWith(this.controlSma.value),
      map((list: string[] | null) => (list ? list : []))
    ),
  ]).pipe(
    map(([ema, sma]: [string[], string[]]) => [...ema, ...sma]),
    map((list: string[]) => [...this.emaList, ...this.smaList].filter((item) => list.includes(item.value))),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  isDisabledButtonLegend$: Observable<boolean> = combineLatest([
    this.controlEma.valueChanges,
    this.controlSma.valueChanges,
  ]).pipe(
    map(
      ([emaList, smaList]: [string[] | null, string[] | null]) =>
        !((emaList && emaList.length > 0) || (smaList && smaList.length > 0))
    )
    // tap((value: boolean) => (this.toggleLegend = !value))
  );

  valueMatcherEma = (d: IndicatorListItem) => d.value;

  ngOnInit(): void {
    this.controlEma.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroy$),
        tap((result: string[] | null) => this.#localStorage.setItem('chartControlEma', result)),
        startWith(this.controlEma.value)
      )
      .subscribe((result: string[] | null) => {
        this._store.updateSelectedEma(this._getValue(result, sortText));
      });

    this.controlSma.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroy$),
        tap((result: string[] | null) => this.#localStorage.setItem('chartControlSma', result)),
        startWith(this.controlSma.value)
      )
      .subscribe((result: string[] | null) => {
        this._store.updateSelectedSma(this._getValue(result, sortText));
      });

    this.controlZone.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroy$),
        tap((result: number[] | null) => this.#localStorage.setItem('chartControlZone', result)),
        startWith(this.controlZone.value)
      )
      .subscribe((result: number[] | null) => {
        this._store.updateSelectedConsolidationZones(this._getValue(result, sortNumber));
      });

    this._store.updateSelectedAtr(this.controlAtr.value);
  }

  onToggleAtr(event: Event): void {
    event.preventDefault();

    const value = !this.controlAtr.value;

    this.#localStorage.setItem('chartControlAtr', value);
    this.controlAtr.patchValue(value);
    this._store.updateSelectedAtr(value);
  }

  onToggleTarget(event: Event): void {
    event.preventDefault();

    const value = !this.controlTarget.value;

    this.#localStorage.setItem('chartControlTarget', value);
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

  private _getValue<T>(value: T[] | null, sortFn: (a: any, b: any) => number): T[] {
    if (value === null) {
      return [];
    }

    return value.sort(sortFn);
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

  onEvent(event: { type: string; event: Event | null }): void {
    if (this.mapInterval[event.type]) {
      this._store.updateInterval(this.mapInterval[event.type]);
    }
  }
}

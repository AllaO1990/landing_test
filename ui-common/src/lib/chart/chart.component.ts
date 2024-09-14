import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { ChartComponent } from '@ui/chart';
import { combineLatest, debounceTime, Observable, of, shareReplay, startWith, switchMap } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';
import { ButtonWithListComponent } from './button-with-list';
import { CHART_EMA_LIST, CHART_SMA_LIST, CHART_ZONE_LIST } from './chart.constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TuiButtonModule, TuiLoaderModule, TuiSvgModule } from '@taiga-ui/core';
import { map } from 'rxjs/operators';
import { LegendComponent } from './legend';
import { ActiveZone } from 'types/chart';
import { Timeframe } from 'types/timeframe';
import { StockEvent } from 'types/stock-event';
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
    TuiLoaderModule,
    NgIf,
    TuiButtonModule,
    TuiSvgModule,
    LegendComponent,
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCandlestickComponent implements OnInit {
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  toggleLegend = true;
  toggleActions = true;

  emaList: IndicatorListItem[] = CHART_EMA_LIST;
  valueEma: IndicatorListItem[] | null = null;
  smaList: IndicatorListItem[] = CHART_SMA_LIST;
  valueSma: IndicatorListItem[] | null = null;
  zoneList: IndicatorListItem<Timeframe>[] = CHART_ZONE_LIST;
  valueZone: IndicatorListItem<Timeframe>[] | null = null;

  readonly controlEma: FormControl<IndicatorListItem[] | null> = new FormControl([this.emaList[1], this.emaList[5]]);
  readonly controlSma: FormControl<IndicatorListItem[] | null> = new FormControl([this.smaList[0], this.smaList[1]]);
  readonly controlAtr: FormControl<boolean> = new FormControl<boolean>(true, { nonNullable: true });
  readonly controlZone: FormControl<IndicatorListItem<Timeframe>[] | null> = new FormControl([this.zoneList[0]]);

  readonly selected$: Observable<StockInstrument | null> = this._store.selectedInstrument$;
  readonly candles$: Observable<[string | number, number, number, number, number][] | null> = this._store.candles$.pipe(
    shareReplay(1)
  );
  readonly indicators$: Observable<any[]> = combineLatest([this._store.indicatorEma$, this._store.indicatorSma$]).pipe(
    debounceTime(0),
    map((data: any[][]) => data.flat())
  );
  readonly text$: Observable<string | null> = this._store.indicatorAtr$.pipe(
    map((value: { atr: number }) => value && `1 ATR: ${value.atr}`),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly zone$: Observable<ActiveZone[] | null> = this._store.event$.pipe(
    switchMap((event: StockEvent | null) => {
      if (event === null) {
        return of(null);
      }

      if (event.type === EventSelected.STOCK_LIST) {
        return this._store.zones$;
      }

      return this._store.consolidationZones$;
    })
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
  ]).pipe(map(([ema, sma]) => [...ema, ...sma]));

  ngOnInit(): void {
    if (this.valueEma !== this.controlEma.value) {
      this._store.updateIndicatorEmaSelected(this._getValue(this.controlEma.value));
    }

    if (this.valueSma !== this.controlSma.value) {
      this._store.updateIndicatorSmaSelected(this._getValue(this.controlSma.value));
    }

    if (this.valueZone !== this.controlZone.value) {
      this._store.updateConsolidationZoneSelected(this._getValue(this.controlZone.value));
    }

    this._store.updateIndicatorAtrSelected(this.controlAtr.value);
  }

  onToggleAtr(event: Event): void {
    event.preventDefault();

    const value = !this.controlAtr.value;

    this.controlAtr.patchValue(value);
    this._store.updateIndicatorAtrSelected(value);
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
    this._store.updateIndicatorEmaSelected(this._getValue(this.controlEma.value));
  }

  private _actionSma(): void {
    this.valueSma = this.controlSma.value;
    this._store.updateIndicatorSmaSelected(this._getValue(this.controlSma.value));
  }

  private _actionZone(): void {
    this.valueZone = this.controlZone.value;
    this._store.updateConsolidationZoneSelected(this._getValue(this.controlZone.value) as number[]);
  }
}

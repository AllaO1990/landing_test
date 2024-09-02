import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { ChartComponent } from '@ui/chart';
import { BehaviorSubject, combineLatest, debounceTime, Observable, shareReplay, Subject, switchMap } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';
import { ButtonWithListComponent } from './button-with-list/button-with-list.component';
import { CHART_EMA_LIST, CHART_SMA_LIST } from './chart.constants';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { sortText } from 'utils/sort-text';
import { TuiButtonModule, TuiLoaderModule, TuiSvgModule } from '@taiga-ui/core';
import { map } from 'rxjs/operators';

interface IndicatorListItem {
  name: string;
  value: string;
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
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainChartComponent implements OnInit {
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  toggle = true;
  private readonly _text$: Subject<boolean> = new BehaviorSubject<boolean>(this.toggle);
  readonly selected$: Observable<StockInstrument | null> = this._store.selectedInstrument$;
  readonly candles$: Observable<any | null> = this._store.candles$.pipe(shareReplay(1));
  readonly indicators$: Observable<any[]> = combineLatest([this._store.indicatorEma$, this._store.indicatorSma$]).pipe(
    debounceTime(0),
    map((data: any[][]) => data.flat())
  );
  readonly consolidationZones$: Observable<any | null> = this._store.consolidationZones$;
  readonly text$: Observable<string | null> = this._store.indicatorAtr$.pipe(
    map((value: { atr: number }) => value && `1 ATR: ${value.atr}`),
    switchMap((text: string | null) => this._text$.asObservable().pipe(map((value: boolean) => (value ? text : null))))
  );

  emaList: IndicatorListItem[] = CHART_EMA_LIST;
  valueEma: IndicatorListItem[] | null = null;
  smaList: IndicatorListItem[] = CHART_SMA_LIST;
  valueSma: IndicatorListItem[] | null = null;

  readonly controlEma: FormControl<IndicatorListItem[] | null> = new FormControl([this.emaList[1], this.emaList[4]]);
  readonly controlSma: FormControl<IndicatorListItem[] | null> = new FormControl([this.smaList[0], this.smaList[1]]);

  ngOnInit(): void {
    if (this.valueEma !== this.controlEma.value) {
      this._store.updateIndicatorEmaSelected(this._getValue(this.controlEma.value));
    }

    if (this.valueSma !== this.controlSma.value) {
      this._store.updateIndicatorSmaSelected(this._getValue(this.controlSma.value));
    }
  }

  onToggle(event: Event): void {
    event.preventDefault();

    this.toggle = !this.toggle;
    this._text$.next(this.toggle);
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

  private _getValue(value: IndicatorListItem[] | null): string[] {
    if (value === null) {
      return [];
    }

    return value.map((item: IndicatorListItem) => item.value).sort(sortText);
  }

  private _actionEma(): void {
    this.valueEma = this.controlEma.value;
    this._store.updateIndicatorEmaSelected(this._getValue(this.controlEma.value));
  }

  private _actionSma(): void {
    this.valueSma = this.controlSma.value;
    this._store.updateIndicatorSmaSelected(this._getValue(this.controlSma.value));
  }
}

import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, EMPTY, Observable, of, switchMap, tap } from 'rxjs';
import { filter, map, skipWhile } from 'rxjs/operators';
import { ActiveZone, ConsolidationZones } from 'types/chart';
import { ChartState } from 'types/chart-state';
import { getPointsActiveZone, transformActiveConsolidationZones } from 'utils/transform-consolidation-zones';
import { StockId } from 'types/stock';
import { Queue } from 'utils/queue';
import { Response } from 'types/response';
import { MAP_COLOR_CONSOLIDATION } from 'types/color';

export class ChartStore extends ComponentStore<ChartState> {
  private readonly _from: Date = new Date(new Date(2014, 0, 1, 12).setUTCHours(0, 0, 0, 0));
  private readonly _to: Date = new Date(new Date().setUTCHours(23, 59, 59, 0));

  private _queueCandles: Queue<any> = new Queue(3);
  private _colorConsolidation = MAP_COLOR_CONSOLIDATION;
  private _queueChartFigures: Queue<string, Response<ActiveZone>> = new Queue(3);

  public readonly candles$: Observable<any[] | null> = this.select((state: ChartState) => state.candles);

  public readonly consolidationZones$: Observable<ActiveZone[] | null> = this.select(
    (state: ChartState) => state.consolidationZones
  );

  constructor(private readonly _api: DesktopService) {
    super({
      candles: null,
      consolidationZones: null,
    });
  }

  public updateCandles = this.updater((state: ChartState, data: { candles: any[]; index: number }) => {
    const candlesArray = state.candles;
    if (data.index && candlesArray && data.candles) {
      for (let i = 0; i < data.candles.length; i++) {
        candlesArray[candlesArray.length - 1 - i] = data.candles[i];
      }
      return { ...state };
    } else {
      return { ...state, candles: data.candles };
    }
  });

  public updateConsolidationZones = this.updater((state: ChartState, data: any) => {
    return { ...state, consolidationZones: data };
  });

  public readonly loadCandles = this.effect((stream$: Observable<{ source: any | null; index: number }>) => {
    let index = 0;
    return stream$.pipe(
      tap((val) => {
        index = val.index;
      }),
      skipWhile((value) => value.source === null),
      switchMap((data: { source: any; index: number }) => this._getCandles(data)),
      map((data: any) => {
        return data.data.map((item: any) => {
          // x,open,high,low,close
          return [new Date(item.time).valueOf(), item.open, item.high, item.low, item.close];
        });
      }),
      tap((candles) => {
        this.updateCandles({ candles, index });
      }),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    );
  });

  public readonly loadWatchlistConsolidationZones = this.effect((stream$: Observable<{ id: StockId } | null>) => {
    return stream$.pipe(
      filter((value: { id: StockId } | null): value is { id: StockId } => value !== null),
      switchMap((value: { id: StockId }) => this._getWatchlistConsolidationZone(value)),
      map((result: Response<ActiveZone>) => {
        return [
          {
            points: getPointsActiveZone(result.data),
            color: this._colorConsolidation[result.data.timeframe as 5 | 12 | 13],
          },
        ];
      }),
      tap((zones) => {
        this.updateConsolidationZones(zones);
      }),
      catchError((err: Error) => {
        console.error(err);
        return EMPTY;
      })
    );
  });

  public readonly loadChartFigures = this.effect((stream$: Observable<{ id: StockId } | null>) => {
    return stream$.pipe(
      filter((value: { id: StockId } | null): value is { id: StockId } => value !== null),
      switchMap((data: { id: StockId }) => this._getChartFigures(data)),
      map((data: ConsolidationZones) => {
        return transformActiveConsolidationZones(data?.data);
      }),
      tap((zones) => {
        this.updateConsolidationZones(zones);
      }),
      catchError((err: Error) => {
        console.error(err);
        return EMPTY;
      })
    );
  });

  private _getCandles(data: { source: any; index: number }): Observable<any> {
    const value = this._queueCandles.getValue(data.source);

    if (value && data.index === 0) {
      return of(value);
    }

    return this._api.getCandles(data).pipe(
      filter((result: Response<any>) => result !== null && result.data !== null && result.data.length !== 0),
      tap((res: any) => this._queueCandles.setValue(data.source, res))
    );
  }

  private _getWatchlistConsolidationZone(data: { id: StockId }): Observable<Response<ActiveZone>> {
    const key = data.id.toString();
    const value = this._queueChartFigures.getValue(key);

    if (value) {
      return of(value);
    }

    return this._api
      .getWatchlistConsolidationZone(data.id)
      .pipe(tap((res: any) => this._queueChartFigures.setValue(key, res)));
  }

  private _getChartFigures(data: { id: StockId }): Observable<any> {
    const key = data.id.toString();
    const value = this._queueChartFigures.getValue(key);

    if (value) {
      return of(value);
    }

    return this._api
      .getChartFigures(data.id, this._from.toISOString(), this._to.toISOString())
      .pipe(tap((res: any) => this._queueChartFigures.setValue(key, res)));
  }
}

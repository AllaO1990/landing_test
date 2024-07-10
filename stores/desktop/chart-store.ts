import { DesktopService } from '@desktop-data/desktop-data';
import { ComponentStore } from '@ngrx/component-store';
import { catchError, EMPTY, Observable, of, switchMap, tap } from 'rxjs';
import { filter, map, skipWhile } from 'rxjs/operators';
import { ActiveZone, ConsolidationZones } from 'types/chart';
import { ChartState } from 'types/chart-state';
import { Idea } from 'types/idea';
import { transformActiveConsolidationZones } from 'utils/transform-consolidation-zones';

export class ChartStore extends ComponentStore<ChartState> {
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

  public updateCandles = this.updater((state: ChartState, data: { candles: any; index: number }) => {
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
      switchMap((data: { source: any; index: number }) => this._api.getCandles(data)),
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

  public readonly loadConsolidationZones = this.effect(
    (stream$: Observable<{ type: string; value: { id: string } }>) => {
      return stream$.pipe(
        skipWhile((value) => value === null),
        switchMap((data: { type: string; value: { id: string } }) => {
          return this._api.getConsolidationZones(data.value.id);
        }),
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
    }
  );

  public readonly loadConsolidationZonesV2 = this.effect((stream$: Observable<Idea | null>) => {
    return stream$.pipe(
      filter((value: Idea | null): value is Idea => value !== null),
      switchMap((data: Idea) => {
        return this._api.getConsolidationZones(data.id);
      }),
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
}

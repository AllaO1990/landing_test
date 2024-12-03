import { WithQueue } from '../core/with-queue.abstract';
import { DesktopService } from '@desktop-data/desktop-data';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { filter, map, skipWhile } from 'rxjs/operators';
import { StockInstrument } from 'types/stock';
import { Response } from 'types/response';

export interface CandlesState {
  candles: null | any[];
}

export class CandlesStore extends WithQueue<CandlesState> {
  private readonly _from: Date = new Date(new Date(2014, 0, 1, 12).setUTCHours(0, 0, 0, 0));
  private readonly _to: Date = new Date(new Date().setUTCHours(23, 59, 59, 0));

  readonly candles$: Observable<any> = this.select((state: CandlesState) => state.candles);

  constructor(private readonly _api: DesktopService) {
    super({
      candles: null,
    });
  }

  public updateCandles = this.updater((state: CandlesState, data: { candles: any[]; index: number }) => {
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

  public readonly loadCandles = this.effect(
    (
      stream$: Observable<{
        source: StockInstrument | null;
        index: number;
      }>
    ) => {
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
    }
  );

  private _getCandles(data: { source: any; index: number }): Observable<any> {
    const value = this.queue.getValue(data.source);

    if (value && data.index === 0) {
      return of(value);
    }

    return this._api.getCandles(data).pipe(
      filter((result: Response<any>) => result !== null && result.data !== null),
      tap((res: any) => this.queue.setValue(data.source, res))
    );
  }
}

import { WithQueue } from '../core/with-queue.abstract';
import { DesktopService } from '@desktop-data/desktop-data';
import { catchError, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StockInstrument, StockPrice, WithLastPrice } from 'types/stock';
import { getPriceIncrement } from 'utils/get-price-increment';

export type CandlesLoad = {
  source: StockInstrument | null;
  index: number;
};

export type CandlesSelectLoad = {
  source: StockInstrument;
  index: number;
};

export interface CandlesState {
  instrument: null | any;
}

export class CandlesStore extends WithQueue<CandlesState> {
  private readonly _from: Date = new Date(new Date(2014, 0, 1, 12).setUTCHours(0, 0, 0, 0));
  private readonly _to: Date = new Date(new Date().setUTCHours(23, 59, 59, 0));

  readonly instrument$: Observable<any> = this.select((state: CandlesState) => state.instrument);

  constructor(private readonly _api: DesktopService) {
    super({
      instrument: null,
    });
  }

  public updateCandles = this.updater((state: CandlesState, data: { instrument: any; index: number }) => {
    const candlesArray = state.instrument;

    if (data.index && candlesArray && candlesArray.candles && data.instrument.candles) {
      for (let i = 0; i < data.instrument.candles.length; i++) {
        candlesArray.candles[candlesArray.candles.length - 1 - i] = data.instrument.candles[i];
      }
      return { ...state };
    } else {
      return { ...state, instrument: data.instrument };
    }
  });

  public readonly loadCandles = this.effect((stream$: Observable<CandlesLoad>) => {
    let index = 0;

    return stream$.pipe(
      tap((val: CandlesLoad) => (index = val.index)),
      filter((data: CandlesLoad): data is CandlesSelectLoad => data.source !== null),
      switchMap((data: CandlesSelectLoad) =>
        this._getCandles(data).pipe(
          map((candles: any) => ({ ...data.source, ...candles })),
          tap((instrument) => {
            this.updateCandles({ instrument, index });
          })
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    );
  });

  private _getCandles(data: CandlesSelectLoad): Observable<any> {
    const uniq = { id: data.source.id, index: data.index };
    const value = this.queue.getValue(uniq);

    if (value && data.index === 0) {
      return of(value);
    }

    return forkJoin([
      this._api.getActiveStock([data.source.id]).pipe(
        map((result: StockPrice<WithLastPrice>) => {
          const price = result[data.source.id];

          return {
            ...price,
            increment: getPriceIncrement((price && price.minPriceIncrement) || 0),
          };
        })
      ),
      this._api.getCandles({ source: data.source.id, index: data.index }).pipe(
        map((data) =>
          data.map((item: any) => {
            const { time, ...other } = item;

            return { ...other, x: new Date(time).setUTCHours(23, 59, 59, 0) };
          })
        )
      ),
    ]).pipe(
      map((result: [any, any]) => ({
        ...result[0],
        candles: result[1],
      })),
      tap((res: any) => this.queue.setValue(uniq, res))
    );
  }
}

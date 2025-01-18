import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, of, switchMap, tap } from 'rxjs';
import { StockId } from 'types/stock';
import { Response } from 'types/response';
import { map } from 'rxjs/operators';
import { WithQueue } from '../core/with-queue.abstract';
import { getJoinUniq } from 'utils/get-join-uniq';

export interface IndicatorAtr {
  date: string;
  atr: number;
  atrPct: number;
  atr15: number;
  atr15Pct: number;
}

export interface IndicatorAtrState {
  selected: null | boolean;
  value: null | { data: IndicatorAtr; instrument: StockId };
}

export class IndicatorAtrStore extends WithQueue<IndicatorAtrState> {
  readonly selected$: Observable<null | any> = this.select((state: IndicatorAtrState) => state.selected);

  readonly value$: Observable<null | {
    data: IndicatorAtr;
    instrument: StockId;
  }> = this.select((state: IndicatorAtrState) => state.value);

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
      value: null,
    });
  }

  updateSelected = this.updater((state: IndicatorAtrState, selected: boolean) => ({ ...state, selected }));

  updateValue = this.updater(
    (
      state: IndicatorAtrState,
      value: null | {
        data: IndicatorAtr;
        instrument: StockId;
      }
    ) => ({ ...state, value })
  );

  readonly load = this.effect(
    (
      stream$: Observable<{
        id: StockId;
        interval: number;
        date: string;
      } | null>
    ) =>
      stream$.pipe(
        switchMap((data: { id: StockId; interval: number; date: string } | null) =>
          this._getIndicator(data).pipe(tap((data) => this.updateValue(data)))
        )
      )
  );

  private _getIndicator(data: { id: StockId; interval: number; date: string } | null): Observable<{
    data: IndicatorAtr;
    instrument: StockId;
  } | null> {
    if (data === null) {
      return of(null);
    }

    const uniqKey = getJoinUniq(data.id, data.interval, data.date);
    const value: { data: IndicatorAtr; instrument: StockId } | undefined = this.queue.getValue(uniqKey);

    if (value) {
      return of(value);
    }

    return this._api.getIndicatorAtr(data.id, data.interval, data.date).pipe(
      map((value: Response<IndicatorAtr>) => value.data),
      map((value: IndicatorAtr) => ({ data: value, instrument: data.id })),
      tap((value: { data: IndicatorAtr; instrument: StockId }) => this.queue.setValue(uniqKey, value))
    );
  }
}

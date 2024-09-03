import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, of, switchMap, tap } from 'rxjs';
import { Queue } from 'utils/queue';
import { StockId } from 'types/stock';
import { Response } from 'types/response';
import { map } from 'rxjs/operators';
import { indicatorGetUniq } from 'utils/indicators-func';

export interface IndicatorAtrState {
  selected: null | any;
}

export class IndicatorAtrStore extends ComponentStore<IndicatorAtrState> {
  private _queue: Queue<any> = new Queue(3);

  readonly selected$: Observable<null | any> = this.select((state: IndicatorAtrState) => state.selected);

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
    });
  }

  updateSelected = this.updater((state: IndicatorAtrState, selected: any) => ({ ...state, selected }));

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
          this._getIndicator(data).pipe(tap((data) => this.updateSelected(data)))
        )
      )
  );

  private _getIndicator(data: { id: StockId; interval: number; date: string } | null): Observable<any> {
    if (data === null) {
      return of(null);
    }

    const uniqKey = indicatorGetUniq(data.id, data.interval, data.date);
    const value = this._queue.getValue(uniqKey);

    if (value) {
      return of(value);
    }

    return this._api.getIndicatorAtr(data.id, data.interval, data.date).pipe(
      map((value: Response<any>) => value.data),
      tap((value: any) => this._queue.setValue(uniqKey, value))
    );
  }
}

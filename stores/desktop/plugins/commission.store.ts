import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { Commission, CommissionItem } from 'types/commission';
import { Response } from 'types/response';
import { StockPosition } from 'types/position';

export interface CommissionState {
  list: null | CommissionItem[];
  total: null | number;
}

export class CommissionStore extends ComponentStore<CommissionState> {
  list$: Observable<CommissionItem[] | null> = this.select((state) => state.list);
  total$: Observable<number | null> = this.select((state) => state.total);

  constructor(private readonly _api: DesktopService) {
    super({
      total: null,
      list: null,
    });
  }

  readonly updateList = this.updater(
    (state: CommissionState, list: null | CommissionItem[]): CommissionState => ({
      ...state,
      list,
    })
  );

  readonly updateTotal = this.updater(
    (state: CommissionState, total: null | number): CommissionState => ({
      ...state,
      total,
    })
  );

  load = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) => this._api.getCommission(params)),
      tap((response: Response<Commission>) => this.updateList(response.data.items))
      // tap((response: Response<Commission>) => this.updateTotal(response.data.total))
    )
  );

  addCommission(params: Params) {
    return this._api.addCommission(params);
  }

  updateCommission(id: number, params: Params): Observable<Response<any>> {
    return this._api.updateCommission(id, params);
  }

  deleteCommission(id: number): Observable<Response<any>> {
    return this._api.deleteCommission(id);
  }

  getIdea(id: number): Observable<Response<StockPosition | null>> {
    return this._api.getIdea(id);
  }

  editIdea(id: number, body: object): Observable<Response<{ id: number }>> {
    return this._api.editIdea(id, body);
  }
}

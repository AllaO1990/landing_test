import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { Commission } from 'types/commission';
import { Response } from 'types/response';

export interface CommissionState {
  list: null | any;
}

export class CommissionStore extends ComponentStore<CommissionState> {
  list$: Observable<any[]> = this.select((state) => state.list);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }

  readonly updateList = this.updater(
    (state: CommissionState, list: null | any): CommissionState => ({
      ...state,
      list,
    })
  );

  load = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      tap((data) => console.log(data)),
      switchMap((params: Params) => this._api.getCommission(params)),
      tap((response: Response<Commission>) => this.updateList(response.data))
    )
  );
}

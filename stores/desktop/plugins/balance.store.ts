import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { Response } from 'types/response';
import { AccountTransactions } from 'types/account';

interface BalanceState {
  list: null | AccountTransactions;
}

export class BalanceStore extends ComponentStore<BalanceState> {
  list$: Observable<AccountTransactions | null> = this.select((state) => state.list);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
    });
  }

  readonly updateList = this.updater(
    (state: BalanceState, list: null | AccountTransactions): BalanceState => ({
      ...state,
      list,
    })
  );

  load = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) => this._api.getAccountTransactions(params)),
      tap((response: Response<AccountTransactions>) => this.updateList(response.data))
    )
  );

  edit = this.effect((stream$: Observable<{ id: number | string; params: Params }>) =>
    stream$.pipe(
      switchMap((value: { id: number | string; params: Params }) =>
        this._api.editAccountTransactions(value.id, value.params)
      ),
      tap((response: Response<any>) => console.log(response))
    )
  );

  delete = this.effect((stream$: Observable<{ id: number | string; params: Params }>) =>
    stream$.pipe(
      switchMap((value: { id: number | string; params: Params }) =>
        this._api.deleteAccountTransactions(value.id).pipe(tap((response: Response<number>) => this.load(value.params)))
      ),
      tap((response: Response<number>) => console.log(response))
    )
  );
}

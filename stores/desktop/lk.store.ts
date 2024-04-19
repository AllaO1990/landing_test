import { ComponentStore } from '@ngrx/component-store';
import { Injectable } from '@angular/core';
import { DesktopLkState } from '../../types/lk-state';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Stock, StockList, StockListItem } from '../../types/stock';
import { DesktopService } from '../../api/desktop-data/src/lib/desktop-data';
import { filter } from 'rxjs/operators';
import { Response } from '../../types/response';

@Injectable()
export class DesktopLkStore extends ComponentStore<DesktopLkState> {
  public readonly selected$: Observable<any | null> = this.select(
    (state: DesktopLkState) => state.selected
  );

  public readonly stock$: Observable<StockList | null> = this.select(
    (state: DesktopLkState) => state.stock
  );

  public readonly stockActive$: Observable<StockList | null> = this.select(
    (state: DesktopLkState) => state.active
  );

  constructor(private readonly _api: DesktopService) {
    super({ selected: null, stock: null, active: null });

    this.loadStock();
  }

  public updateSelect = this.updater(
    (state: DesktopLkState, selected: any) => ({ ...state, selected })
  );

  public updateStock = this.updater(
    (state: DesktopLkState, stock: StockList) => ({ ...state, stock })
  );

  public updateStockPrice = this.updater(
    (
      state: DesktopLkState,
      price: { [key: string]: { last: number; prev: number } }
    ) => {
      const stock = state.stock.map((item: StockListItem) => {
        if (price[item.id]) {
          return { ...item, ...price[item.id] };
        }

        return item;
      });

      return { ...state, stock };
    }
  );

  public updateActive = this.updater(
    (state: DesktopLkState, active: StockList) => ({ ...state, active })
  );

  public readonly loadStock = this.effect((stream$: Observable<void>) =>
    stream$.pipe(
      switchMap((_) =>
        this._api.getStockList().pipe(
          filter((result: Response<Stock>) => !!result.data),
          tap((result: Response<Stock>) => this.updateStock(result.data.items))
        )
      ),
      catchError((err: Error) => {
        console.error(err);
        return of(null);
      })
    )
  );

  public readonly loadActivePrice = this.effect(
    (stream$: Observable<StockList | null>) =>
      stream$.pipe(
        filter((list: StockList | null): list is StockList => !!list),
        switchMap((list: StockList) => this._api.getActiveStock(list)),
        map((response: Response<any>) => response.data),
        tap((result: { [key: string]: { last: number; prev: number } }) =>
          this.updateStockPrice(result)
        )
      )
  );
}

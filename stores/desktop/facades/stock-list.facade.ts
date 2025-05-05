import { inject, Injectable } from '@angular/core';
import { MainStore } from '../main.store';
import { Observable } from 'rxjs';
import { StockGroupList, StockInstrument, StockListItems, StockPrice, WithLastPrice } from 'types/stock';
import { StockEvent } from 'types/stock-event';

@Injectable()
export class StockListFacade {
  private readonly _store: MainStore = inject(MainStore);
  private readonly _stock = this._store.stock;
  private readonly _price = this._store.price;

  readonly listInstrument$: Observable<StockListItems | null> = this._stock.list$;
  readonly instrument$: Observable<StockInstrument | null> = this._stock.instrument$;
  readonly group$: Observable<StockGroupList[] | null> = this._stock.group$;
  readonly listPrice$: Observable<StockPrice<WithLastPrice> | null> = this._price.list$;
  readonly event$: Observable<null | StockEvent> = this._store.selected.event$;

  readonly selectStockGroupList = this._stock.selectStockGroupList;
  readonly loadPrice = this._store.onLoadPrice;

  readonly addInstrument = this._stock.onAddInstrument;
  readonly deleteInstrument = this._stock.onDeleteInstrument;
  readonly createGroup = this._stock.onCreateGroup;
  readonly editGroup = this._stock.onEditGroup;
  readonly deleteGroup = this._stock.onDeleteGroup;
}

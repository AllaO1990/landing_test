import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';

@Injectable()
export class CandlesFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly instrument$: Observable<null | any> = this._store.candles.instrument$;
  readonly selected$: Observable<null | StockInstrument> = this._store.selected.instrument$;
}

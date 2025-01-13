import { inject, Injectable } from '@angular/core';
import { MainStore } from '../main.store';
import { Observable, of, shareReplay, switchMap } from 'rxjs';
import { StockId, StockInstrument, StockTransaction } from 'types/stock';
import { Position, StockPosition } from 'types/position';
import { filter, map } from 'rxjs/operators';

@Injectable()
export class IdeaFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<Position[] | null> = this._store.idea.list$;
  readonly idea$: Observable<StockPosition> = this._store.idea.idea$.pipe(
    switchMap((idea: StockPosition | null) => {
      if (idea === null) {
        return this._store.selected.instrument$.pipe(
          filter((instrument: null | StockInstrument): instrument is StockInstrument => instrument !== null),
          map((instrument: StockInstrument) => this._getIdea(instrument))
        );
      }
      return of(idea);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly select$: Observable<null | StockTransaction> = this._store.selected.idea$;

  readonly loadIdea = this._store.idea.loadIdea;
  readonly createIdea = this._store.idea.create;
  readonly editIdea = this._store.idea.edit;
  readonly deleteIdea = this._store.idea.delete;

  selectItem(id: StockId): Observable<Position | null> {
    if (id === null) {
      return of(null);
    }

    return this._store.idea.selectItem(id);
  }

  private _getIdea(instrument: StockInstrument): StockPosition {
    return {
      ...DEFAULT_IDEA,
      idea: { ...DEFAULT_IDEA.idea, instrument },
    };
  }
}

const DEFAULT_IDEA = {
  actions: {
    entries: [],
    outs: [],
    position: null,
  },
  idea: {
    author: 'user',
    createdAt: null,
    entries: [],
    id: null,
    inPosition: false,
    inPositionDepositShare: 0,
    inPositionPrice: 0,
    inPositionProfitPercent: 0,
    inPositionQuantity: 0,
    inPositionResult: 0,
    instrument: null,
    portfolioId: null,
    lastPrice: 0,
    minPriceIncrement: 0.00000001,
    positionType: 'long',
    result: {
      profitPercent: 0,
      profitPrice: 0,
    },
    stop: null,
    strategy: null,
    subscribed: true,
    targets: [],
    updatedAt: null,
  },
};

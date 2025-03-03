import { inject, Injectable } from '@angular/core';
import { MainStore } from '../main.store';
import { Observable, of, switchMap, tap } from 'rxjs';
import { StockId, StockInstrument, StockPrice, WithLastPrice } from 'types/stock';
import { Position, StockPosition } from 'types/position';
import { filter, map, shareReplay } from 'rxjs/operators';
import { IndicatorAtr } from 'stores/plugins/indicator.atr.store';

@Injectable()
export class IdeaFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly atr$: Observable<null | { data: IndicatorAtr; instrument: StockId }> = this._store.atr.value$;
  readonly positions$: Observable<Position[] | null> = this._store.idea.positions$;
  readonly ideas$: Observable<Position[] | null> = this._store.idea.ideas$;
  readonly idea$: Observable<StockPosition> = this._store.idea.idea$.pipe(
    switchMap((idea: StockPosition | null) => {
      if (idea === null) {
        return this._store.selected.instrument$.pipe(
          // tap((data) => console.log(data)),
          filter((instrument: null | StockInstrument): instrument is StockInstrument => instrument !== null),
          switchMap((instrument: StockInstrument) =>
            this._store.getPriceOfInstruments([instrument.id]).pipe(
              map((price: StockPrice<WithLastPrice>) => {
                let lastPrice = 0;

                if (price && price[instrument.id]) {
                  lastPrice = price[instrument.id]!.last;
                }

                return this._getIdea(instrument, lastPrice);
              })
            )
          )
        );
      }
      return of(idea);
    }),
    tap((idea: StockPosition) => this._store.selected.updateInstrument(idea.idea.instrument)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly resetIdea = () => this._store.idea.updateIdea(null);
  readonly loadIdea = this._store.idea.loadIdea;
  readonly createIdea = this._store.idea.create;
  readonly editIdea = this._store.idea.edit;
  readonly deleteIdea = this._store.idea.delete;
  readonly updateIdeaUser = this._store.idea.updateIdeaUser;

  private _getIdea(instrument: StockInstrument, lastPrice = 0): StockPosition {
    return {
      ...DEFAULT_IDEA,
      idea: { ...DEFAULT_IDEA.idea, instrument, lastPrice },
    };
  }
}

const DEFAULT_IDEA = {
  actions: {
    entries: [],
    outs: [],
    position: null,
  },
  dividends: [],
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
    parentId: null,
    stop: null,
    strategy: null,
    subscribed: true,
    targets: [],
    updatedAt: null,
  },
};

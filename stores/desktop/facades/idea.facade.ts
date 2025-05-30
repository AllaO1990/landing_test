import { inject, Injectable } from '@angular/core';
import { MainStore } from '../main.store';
import { Observable, of, switchMap, tap } from 'rxjs';
import { StockInstrument, StockPrice, WithLastPrice } from 'types/stock';
import { Position, Positions, StockPosition } from 'types/position';
import { filter, map, shareReplay } from 'rxjs/operators';
import { IndicatorAtr } from 'stores/plugins/indicator.atr.store';

@Injectable()
export class IdeaFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly atr$: Observable<null | { data: IndicatorAtr; instrument: string }> = this._store.atr.value$;
  readonly positions$: Observable<Position[] | null> = this._store.idea.positions$;
  readonly ideas$: Observable<Positions | null> = this._store.idea.ideas$;
  readonly instrument$: Observable<StockInstrument | null> = this._store.idea.instrument$;
  readonly isLoading$: Observable<boolean> = this._store.idea.isLoading$;
  readonly idea$: Observable<StockPosition> = this._store.idea.idea$.pipe(
    switchMap((idea: StockPosition | null) => {
      if (idea === null) {
        return this._store.idea.instrument$.pipe(
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
    tap((idea: StockPosition) => this._store.idea.updateInstrument(idea.idea.instrument)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly loadFigures = this._store.figures.load;
  readonly resetIdea = () => this._store.idea.updateIdea(null);
  readonly loadIdea = this._store.idea.loadIdea;
  readonly loadIdeas = this._store.idea.loadIdeas;
  readonly loadAndCopyIdea = this._store.idea.loadAndCopyIdea;
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
  comissions: [],
  idea: {
    author: 'user',
    createdAt: null,
    entries: [],
    comment: '',
    expirationDate: null,
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

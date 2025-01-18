import { WithQueue } from 'stores/core/with-queue.abstract';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';
import { PortfolioPosition } from 'types/portfolio';
import { StockId } from 'types/stock';
import { DataList } from 'types/response';

export interface PortfolioState {
  list: null | PortfolioPosition[];
  total: null | number;
}

export class PortfolioStore extends WithQueue<PortfolioState> {
  readonly list$: Observable<PortfolioPosition[] | null> = this.select((state: PortfolioState) => state.list);
  readonly total$: Observable<number | null> = this.select((state: PortfolioState) => state.total);

  constructor(private readonly _api: DesktopService) {
    super({
      list: null,
      total: null,
    });
  }

  updateList = this.updater(
    (state: PortfolioState, list: PortfolioPosition[] | null): PortfolioState => ({
      ...state,
      list,
    })
  );

  updateTotal = this.updater(
    (state: PortfolioState, total: number | null): PortfolioState => ({
      ...state,
      total,
    })
  );

  selectItem(id: StockId): Observable<PortfolioPosition | null> {
    return this.select((state: PortfolioState) => {
      if (!state.list) {
        return null;
      }

      return state.list.find((item: PortfolioPosition) => item.ideaId === id) || null;
    });
  }

  readonly load = this.effect((stream$: Observable<Params>) =>
    stream$.pipe(
      switchMap((params: Params) =>
        this._api.getPortfolio(params).pipe(
          tap((result: DataList<PortfolioPosition> | null) => {
            this.updateList(result ? result.items : null);
            this.updateTotal(result ? result.total : null);
          })
        )
      )
    )
  );
}

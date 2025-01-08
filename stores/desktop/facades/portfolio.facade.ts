import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable } from 'rxjs';
import { PortfolioPosition } from 'types/portfolio';

@Injectable()
export class PortfolioFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<PortfolioPosition[] | null> = this._store.portfolio.list$;

  readonly load = this._store.portfolio.load;
}

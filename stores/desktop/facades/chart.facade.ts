import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { ConsolidationZonesShape } from 'types/consolidation-zones';

@Injectable()
export class ChartFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly instrument$: Observable<null | any> = this._store.candles.instrument$;
  readonly selected$: Observable<null | StockInstrument> = this._store.selected.instrument$;
  readonly sma$: Observable<null | any> = this._store.sma.series$;
  readonly ema$: Observable<null | any> = this._store.ema.series$;
  readonly zones$: Observable<null | ConsolidationZonesShape> = this._store.consolidationZones.zones$;
  readonly zonesIdea$: Observable<null | ConsolidationZonesShape> = this._store.consolidationZonesIdea.zones$;
  readonly zonesWatch$: Observable<null | ConsolidationZonesShape> = this._store.consolidationZonesWatch.zones$;

  readonly updateSelectedSma = this._store.sma.updateSelected;
  readonly updateSelectedEma = this._store.ema.updateSelected;
  readonly updateSelectedConsolidationZones = this._store.consolidationZones.updateSelected;
}

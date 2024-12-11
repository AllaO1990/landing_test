import { inject, Injectable } from '@angular/core';
import { MainStore } from 'stores/main.store';
import { Observable, shareReplay, tap } from 'rxjs';
import { Position } from 'types/position';

@Injectable()
export class PositionFacade {
  private readonly _store: MainStore = inject(MainStore);

  readonly list$: Observable<Position[] | null> = this._store.position.list$;
  readonly select$: Observable<null | Position> = this._store.selected.position$.pipe(
    shareReplay(1),
    tap((data) => console.log(data))
  );
}

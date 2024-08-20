import { ComponentStore } from '@ngrx/component-store';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable } from 'rxjs';

export interface IndicatorAtrState {
  selected: null | any;
}

export class IndicatorAtrStore extends ComponentStore<IndicatorAtrState> {
  readonly selected$: Observable<null | any> = this.select((state: IndicatorAtrState) => state.selected);

  constructor(private readonly _api: DesktopService) {
    super({
      selected: null,
    });
  }

  updateSelected = this.updater((state: IndicatorAtrState, selected: any) => ({ ...state, selected }));

  readonly load = this.effect((stream$: Observable<any>) => stream$.pipe());
}

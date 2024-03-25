import { ComponentStore } from '@ngrx/component-store';
import { Injectable } from '@angular/core';
import { DesktopLkState } from '../../types/lk-state';
import { Observable } from 'rxjs';

@Injectable()
export class DesktopLkStore extends ComponentStore<DesktopLkState> {
  public readonly selected$: Observable<any> = this.select(
    (state: DesktopLkState) => state.selected
  );

  constructor() {
    super({ selected: null });
  }

  public updateSelect = this.updater(
    (state: DesktopLkState, selected: any) => ({ ...state, selected })
  );
}

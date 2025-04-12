import { Injectable, Type } from '@angular/core';
import { ActionPlugin } from '../action.types';
import { ActionCheckedComponent } from '../checked/action-checked.component';

@Injectable()
export class ActionCheckedCondition<T> implements ActionPlugin {
  condition(condition: number): boolean {
    return condition === 3;
  }

  getComponent(): Type<ActionCheckedComponent<T>> {
    return ActionCheckedComponent;
  }
}

import { Injectable, Type } from '@angular/core';
import { ActionDefaultComponent } from '../default/action-default.component';
import { ActionPlugin } from '../action.types';

@Injectable()
export class ActionDefaultCondition<T> implements ActionPlugin {
  condition(condition: number): boolean {
    return condition === 0;
  }

  getComponent(): Type<ActionDefaultComponent<T>> {
    return ActionDefaultComponent;
  }
}

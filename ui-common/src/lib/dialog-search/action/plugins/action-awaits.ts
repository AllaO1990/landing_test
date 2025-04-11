import { Injectable, Type } from '@angular/core';
import { ActionPlugin } from '../action.types';
import { ActionAwaitsComponent } from '../awaits/action-awaits.component';

@Injectable()
export class ActionAwaitsCondition<T> implements ActionPlugin {
  condition(condition: number): boolean {
    return condition === 2;
  }

  getComponent(): Type<ActionAwaitsComponent<T>> {
    return ActionAwaitsComponent;
  }
}

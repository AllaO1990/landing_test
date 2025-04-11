import { Injectable, Type } from '@angular/core';
import { ActionPlugin } from '../action.types';
import { ActionApprovalComponent } from '../approval/action-approval.component';

@Injectable()
export class ActionApprovalCondition<T> implements ActionPlugin {
  condition(condition: number): boolean {
    return condition === 1;
  }

  getComponent(): Type<ActionApprovalComponent<T>> {
    return ActionApprovalComponent;
  }
}

import { Type } from '@angular/core';

export interface ActionPlugin {
  condition(condition: number): boolean;

  getComponent(): Type<unknown>;
}

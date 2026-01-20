import { ContextAction } from 'types/context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { Logout } from '../logout';
import { AuthService } from '@core/auth';
import { inject } from '@angular/core';

export class ActionLogout extends ContextActionPlugin {
  #authService: AuthService = inject(AuthService);

  condition(type: string): boolean {
    return type === 'logout';
  }

  getAction(): ContextAction {
    return new Logout(this.#authService);
  }
}

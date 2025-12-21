import { ContextAction } from 'types/context-action';
import { AuthService } from '@core/auth';

export class Logout extends ContextAction {
  constructor(private readonly authService: AuthService) {
    super();
  }

  action(_?: any): void {
    this.authService.logout();
  }
}

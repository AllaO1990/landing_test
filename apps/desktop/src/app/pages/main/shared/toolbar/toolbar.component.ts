import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from 'apps/desktop/src/app/core/auth/auth.service';

@Component({
  selector: 'vt-toolbar-main',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  public readonly links: { path: string[]; name: string }[] = [
    { name: 'Main', path: ['/lk/main-v2'] },
    // { name: 'Main 2', path: './main-v2' },
    // { name: 'Dashboard', path: './dashboard' },
  ];

  constructor(private _authService: AuthService) {}

  public trackByIndex(index: number): number {
    return index;
  }

  logout() {
    this._authService.logout();
  }
}

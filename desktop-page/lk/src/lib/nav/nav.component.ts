import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiGroupModule,
  TuiHostedDropdownComponent,
  TuiHostedDropdownModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Params, RouterModule } from '@angular/router';
import { TuiItemsWithMoreModule } from '@taiga-ui/kit';
import { AuthService } from '@core/auth';
import { DESKTOP_STORE } from 'tokens/desktop';
import { DesktopLkStore } from 'stores/desktop';
import { map, Observable, of, switchMap } from 'rxjs';
import { StockEvent } from 'types/stock-event';

interface NavItem {
  path: any[] | string | null | undefined;
  name: string;
  icon: string;
  disabled: boolean;
  params: Params | null | undefined;
}

type NavList = NavItem[];

@Component({
  selector: 'lk-nav',
  standalone: true,
  imports: [
    NgForOf,
    RouterModule,
    TuiItemsWithMoreModule,
    TuiGroupModule,
    TuiButtonModule,
    TuiHostedDropdownModule,
    TuiDataListModule,
    TuiSvgModule,
    AsyncPipe,
    NgIf,
  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  readonly links$: Observable<NavList> = of([
    { name: 'Терминал', path: '/lk/main-v2', icon: 'tuiIconTrello', disabled: false },
    { name: 'Портфель', path: '/lk/portfolio', icon: 'tuiIconBriefcase', disabled: false },
  ]).pipe(
    switchMap((list) =>
      this._store.event$.pipe(
        map((event: StockEvent | null) =>
          list.map((item, index: number) => ({
            ...item,
            params: index === 0 ? event : null,
          }))
        )
      )
    )
  );

  trackByIndex(_: number, item: NavItem): any {
    return item.path;
  }

  onCloseDropDown(event: Event, item: { disabled: boolean }, hostedDropdown: TuiHostedDropdownComponent): void {
    event.preventDefault();

    if (item.disabled) {
      return;
    }

    hostedDropdown.close();
  }

  logout() {
    this._authService.logout();
  }
}

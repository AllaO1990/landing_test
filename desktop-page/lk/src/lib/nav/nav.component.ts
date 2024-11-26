import { TuiItemsWithMore } from '@taiga-ui/kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { TuiAppearance, TuiButton, TuiDataList, TuiDropdown, TuiGroup } from '@taiga-ui/core';
import { Params, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth';
import { map, Observable, of, switchMap } from 'rxjs';
import { IsDisabledStatePipe } from '@ui/pipes/is-disabled-state.pipe';
import { StockEvent } from 'types/stock-event';
import { SelectFacade } from 'stores/facades/select.facade';

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
    TuiItemsWithMore,
    TuiGroup,
    TuiButton,
    TuiAppearance,
    TuiDropdown,
    TuiDataList,
    AsyncPipe,
    NgIf,
    IsDisabledStatePipe,
  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _select: SelectFacade = inject(SelectFacade);

  readonly size = 's';
  readonly links$: Observable<NavList> = of([
    { name: 'Терминал', path: '/lk/main-v2', icon: '@tui.trello', disabled: false },
    { name: 'Портфель', path: '/lk/portfolio', icon: '@tui.briefcase-business', disabled: false },
  ]).pipe(
    switchMap((list) =>
      this._select.event$.pipe(
        map((event: StockEvent | null) =>
          list.map((item, index: number) => ({
            ...item,
            params: index === 0 ? event : null,
          }))
        )
      )
    )
  );

  isDropdownOpen = false;

  trackByIndex(_: number, item: NavItem): any {
    return item.path;
  }

  onCloseDropDown(event: Event, item: { disabled: boolean }): void {
    event.preventDefault();

    if (item.disabled) {
      return;
    }

    this.isDropdownOpen = false;
  }

  logout() {
    this._authService.logout();
  }
}

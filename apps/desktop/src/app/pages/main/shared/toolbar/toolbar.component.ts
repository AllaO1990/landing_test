import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { DESKTOP_STORE } from 'tokens/desktop';
import { DesktopLkStore } from 'stores/desktop';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { TuiHostedDropdownComponent } from '@taiga-ui/core';
import { DialogService } from '@ui/dialog';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { SearchCardComponent } from '../search-card/search-card.component';

@Component({
  selector: 'vt-toolbar-main',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _injector: Injector = inject(Injector);
  private readonly _dialogService: DialogService = inject(DialogService);

  private readonly _component: PolymorpheusComponent<any> = new PolymorpheusComponent(
    SearchCardComponent,
    this._injector
  );

  public readonly selected$: Observable<StockInstrument | null> = this._store.selectedInstrument$;

  public readonly links: { path: string[]; name: string; icon: string; disabled: boolean }[] = [
    { name: 'Терминал', path: ['/lk/main-v2'], icon: 'tuiIconTrello', disabled: false },
    { name: 'Портфель', path: ['./portfolio'], icon: 'tuiIconBriefcase', disabled: true },
  ];

  public trackByIndex(index: number): number {
    return index;
  }

  onCloseDropDown(event: Event, item: { disabled: boolean }, hostedDropdown: TuiHostedDropdownComponent): void {
    event.preventDefault();

    if (item.disabled) {
      return;
    }

    hostedDropdown.close();
  }

  onSearch(event: Event, selected: StockInstrument): void {
    event.preventDefault();

    this._dialogService
      .open(this._component, {
        data: selected.ticker,
        appearance: 'search-card',
      })
      .subscribe(() => {
        console.log('open');
      });
  }

  logout() {
    this._authService.logout();
  }
}

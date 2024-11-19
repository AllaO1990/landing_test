import { TuiIcon } from '@taiga-ui/core';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { QueryParams } from 'utils/query-params';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventSelected } from 'types/events';
import { DesktopLkStore } from 'stores/desktop';
import { SearchCardComponent } from '../search-card';
import { AsyncPipe, NgIf } from '@angular/common';
import { DIALOG, DialogService } from '@ui/components/dialog';

@Component({
  selector: 'lib-toolbar-search',
  standalone: true,
  imports: [NgIf, AsyncPipe, TuiIcon],
  templateUrl: './toolbar-search.component.html',
  styleUrls: ['./toolbar-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarSearchComponent {
  private readonly _injector: Injector = inject(Injector);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _dialogService: DialogService = inject(DIALOG);

  private readonly _component: PolymorpheusComponent<SearchCardComponent> = new PolymorpheusComponent(
    SearchCardComponent,
    this._injector
  );

  public readonly selected$: Observable<StockInstrument | null> = this._store.selectedInstrument$;

  public trackByIndex(index: number): number {
    return index;
  }

  onSearch(event: Event, selected: StockInstrument): void {
    event.preventDefault();

    this._dialogService
      .open<StockInstrument | null>(this._component, {
        data: selected.ticker,
        appearance: 'search-card',
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((instrument: StockInstrument | null) => {
        if (instrument !== null) {
          this._queryParams.update({
            type: EventSelected.STOCK_LIST,
            id: instrument.id,
          });
        }
      });
  }
}

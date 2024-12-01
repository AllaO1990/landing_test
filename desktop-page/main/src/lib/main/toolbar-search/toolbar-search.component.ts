import { TuiIcon } from '@taiga-ui/core';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { QueryParams } from 'utils/query-params';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventSelected } from 'types/events';
import { AsyncPipe, JsonPipe, NgIf } from '@angular/common';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { SelectFacade } from 'stores/facades/select.facade';
import { SearchDialogComponent } from 'ui-common/lib/search-dialog';

@Component({
  selector: 'lib-toolbar-search',
  standalone: true,
  imports: [NgIf, AsyncPipe, TuiIcon, JsonPipe],
  templateUrl: './toolbar-search.component.html',
  styleUrls: ['./toolbar-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarSearchComponent {
  private readonly _injector: Injector = inject(Injector);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _dialogService: DialogService = inject(DIALOG);

  public readonly selected$: Observable<StockInstrument | null> = this._select.instrument$;

  private _loadComponent: PolymorpheusComponent<SearchDialogComponent> | null = null;

  public trackByIndex(index: number): number {
    return index;
  }

  async onSearch(event: Event, selected: StockInstrument) {
    event.preventDefault();

    this._loadComponent = await import('ui-common/lib/search-dialog')
      .then((m) => m.SearchDialogComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._dialogService
      .open<StockInstrument | null>(this._loadComponent, {
        data: selected.ticker,
        appearance: 'search-dialog',
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

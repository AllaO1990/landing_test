import { TuiIcon } from '@taiga-ui/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';
import { AsyncPipe, NgIf } from '@angular/common';
import { LoaderComponent } from '@ui/components/loader';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { StockListFacade } from 'stores/facades/stock-list.facade';

@Component({
  selector: 'lib-toolbar-search',
  standalone: true,
  imports: [NgIf, AsyncPipe, TuiIcon, LoaderComponent, SearchDialogDirective],
  templateUrl: './toolbar-search.component.html',
  styleUrls: ['./toolbar-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarSearchComponent {
  private readonly _select: StockListFacade = inject(StockListFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  public readonly selected$: Observable<StockInstrument | null> = this._select.instrument$;

  onSelect(event: StockInstrument | null): void {
    if (event !== null) {
      this._queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: event.id,
      });
    }
  }
}

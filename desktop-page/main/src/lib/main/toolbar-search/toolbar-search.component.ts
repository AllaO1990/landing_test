import { TuiIcon } from '@taiga-ui/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { QUERY_PARAMS } from 'tokens/desktop';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';
import { AsyncPipe } from '@angular/common';
import { LoaderComponent } from '@ui/components/loader';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';

@Component({
  selector: 'lib-toolbar-search',
  standalone: true,
  imports: [AsyncPipe, TuiIcon, LoaderComponent, SearchDialogDirective],
  templateUrl: './toolbar-search.component.html',
  styleUrls: ['./toolbar-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarSearchComponent {
  readonly #store: IdeaFacade = inject(IdeaFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  public readonly selected$: Observable<StockInstrument | null> = this.#store.instrument$;

  onSelect(event: StockInstrument | null): void {
    if (event !== null) {
      this._queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: event.id,
      });
    }
  }
}

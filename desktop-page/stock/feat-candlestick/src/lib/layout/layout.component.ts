import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ChartCandlestickComponent } from 'ui-common/lib/chart';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { Observable } from 'rxjs';
import { StockInstrument } from 'types/stock';
import { AsyncPipe } from '@angular/common';
import { TuiButton } from '@taiga-ui/core';
import { QueryParams } from 'utils/query-params';
import { ACTION_EVENTS, QUERY_PARAMS } from 'tokens/desktop';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { ContextAction } from 'types/context-action';
import { getContextAction } from 'utils/get-context-action';
import { ContextActionPlugin } from 'types/context-action-plugin';

@Component({
  selector: 'stock-layout',
  imports: [ChartCandlestickComponent, AsyncPipe, TuiButton, SearchDialogDirective],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockLayoutComponent {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #actions: ContextActionPlugin[] = inject(ACTION_EVENTS);
  readonly #map: Map<string, ContextAction> = new Map();
  readonly #store: IdeaFacade = inject(IdeaFacade);

  readonly instrument$: Observable<StockInstrument | null> = this.#store.instrument$;

  onClose(event: Event): void {
    event.preventDefault();

    this.#queryParams.update({ chart: undefined }, 'merge');
  }

  onSelect(event: StockInstrument | null): void {
    const context = this._getAction('selectStock');

    if (context && event) {
      context.action(event.id);
    }
  }

  private _getAction(type: string): ContextAction | null {
    return getContextAction(this.#actions, this.#map, type);
  }
}

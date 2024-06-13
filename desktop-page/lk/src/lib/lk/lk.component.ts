import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarSearchModule } from '../../../../../apps/desktop/src/app/shared/components/toolbar-search';
import { DesktopLkStore, EntryStore, StockListStore } from 'stores/desktop';
import { DESKTOP_API, DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { DesktopService } from '@desktop-data/desktop-data';
import { QueryParams } from 'utils/query-params';

const createStore = (api: DesktopService, query: QueryParams) =>
  new DesktopLkStore(api, query, new StockListStore(api), new EntryStore(api));

@Component({
  selector: 'lib-lk',
  standalone: true,
  imports: [RouterOutlet, ToolbarSearchModule],
  templateUrl: './lk.component.html',
  styleUrl: './lk.component.scss',
  providers: [
    {
      provide: DESKTOP_STORE,
      useFactory: createStore,
      deps: [DESKTOP_API, QUERY_PARAMS],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LkComponent {}

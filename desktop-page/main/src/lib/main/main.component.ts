import { Component, inject } from '@angular/core';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { ChartModule } from '../../../../../apps/desktop/src/app/pages/main-v2/common/chart/chart.module';
import { OutModule } from '../../../../../apps/desktop/src/app/pages/main-v2/common/out/out.module';
import { DesktopService } from '@desktop-data/desktop-data';
import { Observable } from 'rxjs';
import { StockComponent } from './stock/stock.component';
import { DESKTOP_API, DESKTOP_STORE } from 'tokens/desktop';
import { DesktopLkStore } from 'stores/desktop';
import { EntryModule } from './entry/entry.module';
import { Idea } from 'types/idea';

@Component({
  selector: 'lib-main',
  standalone: true,
  imports: [
    AsyncPipe,
    ChartModule,
    EntryModule,
    OutModule,
    StockComponent,
    JsonPipe,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  private readonly _api: DesktopService = inject(DESKTOP_API);

  public readonly selected$: Observable<any> = this._store.selected$;

  public readonly ideaList$: Observable<Idea[]> = this._api.getIdeaList();

  public readonly tradeList$: Observable<any> = this._api.getTradeList();

  public readonly stockList$: Observable<any> = this._api.getStockList();
}

import { AsyncPipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DesktopService } from '@desktop-data/desktop-data';
import { ChartComponent } from '@ui/chart';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_API, DESKTOP_STORE } from 'tokens/desktop';
import { Idea } from 'types/idea';
import { StockList, StockListPrice, StockPrice } from 'types/stock';
import { EntryModule } from './entry/entry.module';
import { MainService } from './main.service';
import { OutModule } from './out/out.module';
import { StockComponent } from './stock/stock.component';

@Component({
  selector: 'lib-main',
  standalone: true,
  imports: [
    AsyncPipe,
    EntryModule,
    OutModule,
    StockComponent,
    JsonPipe,
    ChartComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  providers: [MainService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  private readonly _service: MainService = inject(MainService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _api: DesktopService = inject(DESKTOP_API);

  public readonly selected$: Observable<any> = this._store.selected$;

  public readonly selectedIdea$: Observable<any> = this._store.selectedIdea$;

  public readonly ideaList$: Observable<Idea[]> = this._api
    .getIdeaList()
    .pipe(map((list: Idea[]) => this._service.sortIdeaList(list)));

  public readonly tradeList$: Observable<any> = this._api.getTradeList();

  public readonly stockList$: Observable<StockList | null> = this._store.stock$;

  public readonly stockPrice$: Observable<StockPrice<StockListPrice> | null> =
    this._store.price$;

  public readonly candles$: Observable<any | null> = this._store.candles$;

  public readonly consolidationZones$: Observable<any | null> =
    this._store.cosolidationZones$;
}

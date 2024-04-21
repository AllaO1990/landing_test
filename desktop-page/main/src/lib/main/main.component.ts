import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {AsyncPipe, JsonPipe} from '@angular/common';
import {ChartModule} from '../../../../../apps/desktop/src/app/pages/main-v2/common/chart/chart.module';
import {DesktopService} from '@desktop-data/desktop-data';
import {Observable} from 'rxjs';
import {StockComponent} from './stock/stock.component';
import {DESKTOP_API, DESKTOP_STORE} from 'tokens/desktop';
import {DesktopLkStore} from 'stores/desktop';
import {EntryModule} from './entry/entry.module';
import {Idea} from 'types/idea';
import {TuiBreakpointMediaKey, TuiBreakpointService} from '@taiga-ui/core';
import {map} from 'rxjs/operators';
import {OutModule} from './out/out.module';
import {MainService} from './main.service';
import {StockList, StockListPrice, StockPrice} from 'types/stock';

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
  providers: [MainService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  private readonly _service: MainService = inject(MainService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  private readonly _breakpoint$: TuiBreakpointService =
    inject(TuiBreakpointService);

  private readonly _api: DesktopService = inject(DESKTOP_API);

  public readonly isSmall$: Observable<boolean> = this._breakpoint$.pipe(
    map(
      (value: TuiBreakpointMediaKey | null) =>
        value === 'desktopSmall' || value === 'mobile'
    )
  );

  public readonly selected$: Observable<any> = this._store.selected$;

  public readonly ideaList$: Observable<Idea[]> = this._api
    .getIdeaList()
    .pipe(map((list: Idea[]) => this._service.sortIdeaList(list)));

  public readonly tradeList$: Observable<any> = this._api.getTradeList();

  public readonly stockList$: Observable<StockList | null> = this._store.stock$;

  public readonly stockPrice$: Observable<StockPrice<StockListPrice> | null> =
    this._store.price$;
}

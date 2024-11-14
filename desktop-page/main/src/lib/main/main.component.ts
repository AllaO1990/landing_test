import { TuiTabs } from '@taiga-ui/kit';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';
import { Idea } from 'types/idea';
import { StockInstrument } from 'types/stock';
import { MainService } from './main.service';
import { TuiBreakpointService, TuiIcon } from '@taiga-ui/core';
import { Position } from 'types/position';
import { ChartCandlestickComponent, TabsComponent } from 'ui-common';
import { StockComponent } from './stock/stock.component';
import { EntryModule } from './entry/entry.module';

@Component({
  selector: 'lib-main',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    TuiTabs,
    TuiIcon,
    TabsComponent,
    EntryModule,
    // OutModule,
    StockComponent,
    ChartCandlestickComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  providers: [MainService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
  activeItemIndex = 0;

  private readonly _service: MainService = inject(MainService);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  public readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  public readonly selected$: Observable<StockInstrument | null> = this._store.selectedInstrument$;

  // public readonly ideaList$: Observable<Idea[] | null> = combineLatest([
  //   this._store.entry$.pipe(map((list: Idea[] | null) => list && this._service.sortIdeaList(list))),
  //   this._store.price$,
  // ]).pipe(
  //   map(([list, price]: [Idea[] | null, StockPrice<WithLastPrice> | null]): Idea[] | null => {
  //     if (!list) {
  //       return null;
  //     }
  //
  //     if (list && !price) {
  //       return list;
  //     }
  //
  //     return list.map((item: Idea) => ({ ...item, lastPrice: price![item.instrument.id]!.last || item.lastPrice }));
  //   })
  // );

  public readonly ideaList$: Observable<Idea[] | null> = this._store.entry$.pipe(
    map((list: Idea[] | null) => list && this._service.sortIdeaList(list))
  );

  public readonly selectedIdea$: Observable<any> = this._store.selectedIdea$;

  public readonly positionList$: Observable<Position[] | null> = this._store.position$;

  public readonly tabs$: Observable<{ text: string; icon: string }[] | null> = this.breakpoint$.pipe(
    map((screen: string | null): { text: string; icon: string }[] | null => {
      if (screen === 'mobile') {
        return this.tabMobileList;
      }

      if (screen === 'desktopSmall') {
        return this.tabTabletList;
      }

      this.activeItemIndex = 0;
      return null;
    })
  );

  public readonly tabMobileList: { text: string; icon: string }[] = [
    {
      icon: '@tui.chart-line',
      text: 'График',
    },
    {
      icon: '@tui.list',
      text: 'Список',
    },
    {
      icon: '@tui.target',
      text: 'Идея',
    },
    {
      icon: '@tui.shopping-cart',
      text: 'Сделка',
    },
  ];

  public readonly tabTabletList: { text: string; icon: string }[] = [
    {
      icon: '@tui.chart-line',
      text: 'График',
    },
    {
      icon: '@tui.target',
      text: 'Идея',
    },
    {
      icon: '@tui.shopping-cart',
      text: 'Сделка',
    },
  ];
}

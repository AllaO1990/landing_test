import { AsyncPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ChartComponent } from '@ui/chart';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DesktopLkStore } from 'stores/desktop';
import { DESKTOP_STORE } from 'tokens/desktop';
import { Idea } from 'types/idea';
import { StockInstrument, StockPrice, WithLastPrice } from 'types/stock';
import { EntryModule } from './entry/entry.module';
import { MainService } from './main.service';
import { OutModule } from './out/out.module';
import { StockComponent } from './stock/stock.component';
import { TuiTabsModule } from '@taiga-ui/kit';
import { TuiBreakpointService, TuiSvgModule } from '@taiga-ui/core';
import { Position } from 'types/position';

@Component({
  selector: 'lib-main',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    EntryModule,
    OutModule,
    StockComponent,
    JsonPipe,
    ChartComponent,
    TuiTabsModule,
    TuiSvgModule,
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

  public readonly ideaList$: Observable<Idea[] | null> = combineLatest([
    this._store.entry$.pipe(map((list: Idea[] | null) => list && this._service.sortIdeaList(list))),
    this._store.price$,
  ]).pipe(
    map(([list, price]: [Idea[] | null, StockPrice<WithLastPrice> | null]): Idea[] | null => {
      if (!list) {
        return null;
      }

      if (list && !price) {
        return list;
      }

      return list.map((item: Idea) => ({ ...item, lastPrice: price![item.instrument.id]!.last || item.lastPrice }));
    })
  );

  public readonly selectedIdea$: Observable<any> = this._store.selectedIdea$;

  public readonly tradeList$: Observable<Position[] | null> = combineLatest([
    this._store.position$,
    this._store.price$,
  ]).pipe(
    map(([list, price]: [Position[] | null, StockPrice<WithLastPrice> | null]): Position[] | null => {
      if (!list) {
        return null;
      }

      if (list && !price) {
        return list;
      }

      // return list.map((item: Position) => ({ ...item, lastPrice: price![item.instrument.id]!.last || item.lastPrice }));
      return list.map((item: Position) => {
        item.lastPrice = price![item.instrument.id]!.last || item.lastPrice;
        return item;
      });
    })
  );

  public readonly candles$: Observable<any | null> = this._store.candles$;

  public readonly consolidationZones$: Observable<any | null> = this._store.consolidationZones$;

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
      icon: 'tuiIconChartLineLarge',
      text: 'График',
    },
    {
      icon: 'tuiIconListLarge',
      text: 'Список',
    },
    {
      icon: 'tuiIconTargetLarge',
      text: 'Идея',
    },
    {
      icon: 'tuiIconShoppingCartLarge',
      text: 'Сделка',
    },
  ];

  public readonly tabTabletList: { text: string; icon: string }[] = [
    {
      icon: 'tuiIconChartLineLarge',
      text: 'График',
    },
    {
      icon: 'tuiIconTargetLarge',
      text: 'Идея',
    },
    {
      icon: 'tuiIconShoppingCartLarge',
      text: 'Сделка',
    },
  ];

  trackByIndex(index: number): number {
    return index;
  }
}

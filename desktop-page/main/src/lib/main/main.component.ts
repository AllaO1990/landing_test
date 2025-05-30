import { AsyncPipe, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { combineLatest, debounceTime, Observable, startWith, switchMap } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { MainService } from './main.service';
import { TuiBreakpointService } from '@taiga-ui/core';
import { Position, Positions } from 'types/position';
import { MAIN_TAB_MOBILE_LIST, MAIN_TAB_TABLET_LIST } from './main.constants';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { TabsComponent } from 'ui-common/lib/tabs';
import { OutComponent } from './out/out.component';
import { StockComponent } from './stock/stock.component';
import { EntryModule } from './entry/entry.module';
import { ChartCandlestickComponent } from 'ui-common/lib/chart';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { StockGroupList, StockInstrument } from 'types/stock';
import { EventSelected } from 'types/events';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params } from '@angular/router';
import { StockListFacade } from 'stores/facades/stock-list.facade';

@Component({
  selector: 'lib-main',
  standalone: true,
  imports: [AsyncPipe, NgIf, TabsComponent, OutComponent, StockComponent, EntryModule, ChartCandlestickComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  providers: [MainService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit {
  activeItemIndex = 0;

  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #stockList: StockListFacade = inject(StockListFacade);
  private readonly _service: MainService = inject(MainService);
  private readonly _idea: IdeaFacade = inject(IdeaFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  readonly #updateQuery$: Observable<[Position[], Position[], StockInstrument]> = this._queryParams.pipe(
    takeUntilDestroyed(this.#destroyRef),
    startWith(this._queryParams.value()),
    filter((params: Params) => !params['id']),
    switchMap(() =>
      combineLatest([
        this.positionList$.pipe(filter((list): list is Position[] => list !== null)),
        this.ideaList$.pipe(filter((list): list is Position[] => list !== null)),
        this.#stockList.group$.pipe(
          filter((group): group is StockGroupList[] => group !== null),
          map((group) => {
            const watch = group.find((item: StockGroupList) => item.type.event === EventSelected.WATCH_LIST) || null;

            if (watch === null) {
              return group[0].items[0];
            }

            return watch.items[0];
          })
        ),
      ]).pipe(debounceTime(100), take(1))
    )
  );

  readonly tabMobileList = MAIN_TAB_MOBILE_LIST;
  readonly tabTabletList = MAIN_TAB_TABLET_LIST;

  public readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  public readonly ideaList$: Observable<Position[] | null> = this._idea.ideas$.pipe(
    map((list: Positions | null) => list && list.items && this._service.sortIdeaList(list.items))
  );

  public readonly positionList$: Observable<Position[] | null> = this._idea.positions$;

  readonly tabs$: Observable<{ text: string; icon: string }[] | null> = this.breakpoint$.pipe(
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

  ngAfterViewInit() {
    this.#updateQuery$.subscribe(([position, idea, instrument]: [Position[], Position[], StockInstrument]) => {
      if (position.length !== 0) {
        this._queryParams.update({
          type: EventSelected.POSITION,
          id: position[0].id,
        });
        return;
      }

      if (idea.length !== 0) {
        this._queryParams.update({
          type: EventSelected.IDEA,
          id: idea[0].id,
        });
        return;
      }

      this._queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: instrument.id,
      });
    });
  }
}

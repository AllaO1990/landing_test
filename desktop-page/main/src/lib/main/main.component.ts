import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { debounceTime, Observable, shareReplay, startWith, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { MainService } from './main.service';
import { TuiBreakpointService } from '@taiga-ui/core';
import { Position } from 'types/position';
import { MAIN_TAB_MOBILE_LIST, MAIN_TAB_TABLET_LIST } from './main.constants';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { PositionFacade } from 'stores/facades/position.facade';
import { TabsComponent } from 'ui-common/lib/tabs';
import { OutComponent } from './out/out.component';
import { StockComponent } from './stock/stock.component';
import { EntryModule } from './entry/entry.module';
import { ChartCandlestickComponent } from 'ui-common/lib/chart';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { EnterDialogService, VtEnterComponent } from 'desktop-page/enter';
import { Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { StockId } from 'types/stock';
import { EventSelected } from 'types/events';

@Component({
  selector: 'lib-main',
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    TabsComponent,
    OutComponent,
    StockComponent,
    EntryModule,
    ChartCandlestickComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  providers: [MainService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit {
  activeItemIndex = 0;

  private readonly _service: MainService = inject(MainService);
  private readonly _idea: IdeaFacade = inject(IdeaFacade);
  private readonly _position: PositionFacade = inject(PositionFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _injector: Injector = inject(Injector);
  private readonly _dialogEnterService: EnterDialogService = inject(EnterDialogService);
  private readonly _query$: Observable<Params> = this._queryParams.pipe(
    takeUntilDestroyed(this._destroyRef),
    startWith(this._queryParams.value()),
    distinctUntilChanged((a: Params, b: Params) => a['dialog'] === b['dialog']),
    filter((params: Params) => params['dialog'] === 'visible'),
    debounceTime(100),
    shareReplay({ refCount: false, bufferSize: 1 })
  );
  private _component: PolymorpheusComponent<VtEnterComponent> | null = null;

  get queryId(): StockId | null {
    return this._queryParams.value()['id'] || null;
  }

  readonly tabMobileList = MAIN_TAB_MOBILE_LIST;
  readonly tabTabletList = MAIN_TAB_TABLET_LIST;

  public readonly breakpoint$: TuiBreakpointService = inject(TuiBreakpointService);

  public readonly ideaList$: Observable<Position[] | null> = this._idea.list$.pipe(
    map((list: Position[] | null) => list && this._service.sortIdeaList(list))
  );

  public readonly positionList$: Observable<Position[] | null> = this._position.list$;

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
    if (!this.queryId) {
      this._queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: '72187db2-44d8-4b2e-8b43-c41fd30c4a39',
      });
    }

    this.onOpenDialog();
  }

  async onOpenDialog() {
    this._component = await import('desktop-page/enter')
      .then((m) => m.VtEnterComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._query$.pipe(switchMap(() => this._dialogEnterService.open(this._component))).subscribe();
  }
}

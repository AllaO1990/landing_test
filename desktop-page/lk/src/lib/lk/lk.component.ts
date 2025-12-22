import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, OnInit } from '@angular/core';
import { Params, RouterOutlet } from '@angular/router';
import { ACTION_EVENTS, DESKTOP_API, GlobalDateRangeService, QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { debounceTime, Observable, shareReplay, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LogoComponent } from '@ui/components/logo';
import { DesktopService } from '@desktop-data/desktop-data';
import { SelectFacade } from 'stores/facades/select.facade';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { StockListFacade } from 'stores/facades/stock-list.facade';
import { ChartFacade } from 'stores/facades/chart.facade';
import { MainStore } from 'stores/main.store';
import { AccountFacade } from 'stores/facades/account.facade';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { EnterDialogService, EnterFullScreenDialogService } from 'desktop-page/enter';
import { ActionDeletePosition } from '../common/plugins/action-delete-position';
import { ActionNewPosition } from '../common/plugins/action-new-position';
import { ActionShowPosition } from '../common/plugins/action-show-position';
import { ActionShowIdea } from '../common/plugins/action-show-idea';
import { ActionCopyIdea } from '../common/plugins/action-copy-idea';
import { TradeDialogService } from 'desktop-page/trade';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { DataAccessIdeaStore } from '@data-access-idea/store';
import { ApiIdeaService } from '@data-access-idea/api.service';
import { DataAccessDealStore } from '@data-access-deal/store';
import { ApiDealService } from '@data-access-deal/api.service';
import { DataAccessPortfolioStore } from '@data-access-portfolio/store';
import { ApiPortfolioService } from '@data-access-portfolio/api.service';
import { DataAccessStructureStore } from '@data-access-structure/store';
import { ApiStructureService } from '@data-access-structure/api.service';
import { UserComponent } from '../user/user.component';
import { ModeComponent } from '../mode/mode.component';
import { ActionLogout } from '../common/plugins/action-logout';
import { ActionShowTrade } from '../common/plugins/action-show-trade';
import { ActionSelectIdea } from '../common/plugins/action-select-idea';
import { ActionSelectTransaction } from '../common/plugins/action-select-transaction';

@Component({
  selector: 'lib-lk',
  standalone: true,
  imports: [RouterOutlet, LogoComponent, UserComponent, ModeComponent],
  templateUrl: './lk.component.html',
  styleUrl: './lk.component.scss',
  providers: [
    {
      provide: MainStore,
      useFactory: (api: DesktopService) => new MainStore(api),
      deps: [DESKTOP_API],
    },
    SelectFacade,
    IdeaFacade,
    StockListFacade,
    ChartFacade,
    AccountFacade,
    PortfolioFacade,
    ApiPortfolioService,
    {
      provide: DataAccessPortfolioStore,
      useFactory: (api: ApiPortfolioService) => new DataAccessPortfolioStore(api),
      deps: [ApiPortfolioService],
    },
    ApiStructureService,
    {
      provide: DataAccessStructureStore,
      useFactory: (api: ApiStructureService) => new DataAccessStructureStore(api),
      deps: [ApiStructureService],
    },
    ApiIdeaService,
    {
      provide: DataAccessIdeaStore,
      useFactory: (api: ApiIdeaService) => new DataAccessIdeaStore(api),
      deps: [ApiIdeaService],
    },
    ApiDealService,
    {
      provide: DataAccessDealStore,
      useFactory: (api: ApiDealService) => new DataAccessDealStore(api),
      deps: [ApiDealService],
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionDeletePosition,
      multi: true,
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionNewPosition,
      multi: true,
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionShowPosition,
      multi: true,
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionSelectIdea,
      multi: true,
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionSelectTransaction,
      multi: true,
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionShowTrade,
      multi: true,
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionShowIdea,
      multi: true,
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionCopyIdea,
      multi: true,
    },
    {
      provide: ACTION_EVENTS,
      useClass: ActionLogout,
      multi: true,
    },
    {
      provide: TradeDialogService,
      useFactory: (dialog: DialogService) => new TradeDialogService(dialog),
      deps: [DIALOG],
    },
    {
      provide: EnterDialogService,
      useFactory: (dialog: EnterFullScreenDialogService) => new EnterDialogService(dialog),
      deps: [EnterFullScreenDialogService],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LkComponent implements OnInit {
  readonly #injector: Injector = inject(Injector);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #dialogTrade: TradeDialogService = inject(TradeDialogService);
  readonly #dialogEnter: EnterDialogService = inject(EnterDialogService);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _globalDateRangeService: GlobalDateRangeService = inject(GlobalDateRangeService);
  private readonly _queryEnter$: Observable<Params> = this._queryParams.pipe(
    takeUntilDestroyed(this.#destroyRef),
    startWith(this._queryParams.value()),
    distinctUntilChanged((a: Params, b: Params) => a['dialog'] === b['dialog']),
    filter((params: Params) => params['dialog'] === 'visible'),
    debounceTime(100),
    shareReplay({ refCount: false, bufferSize: 1 })
  );
  private readonly _queryTrade$: Observable<Params> = this._queryParams.pipe(
    takeUntilDestroyed(this.#destroyRef),
    startWith(this._queryParams.value()),
    distinctUntilChanged((a: Params, b: Params) => a['trade'] === b['trade']),
    filter((params: Params) => params['trade'] === 'visible'),
    debounceTime(100),
    shareReplay({ refCount: false, bufferSize: 1 })
  );

  ngOnInit(): void {
    this._queryParams
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      )
      .subscribe((event: Params) => {
        const { type, id, group, dialog, trade } = event;
        this._select.updateEvent({
          type: type || null,
          id: id || null,
          group: group || null,
          dialog: dialog || null,
          trade: trade || null,
        });
      });

    this._globalDateRangeService.setRange({
      from: new Date(new Date(new Date().getFullYear() - 2, 0, 1, 12).setUTCHours(0, 0, 0, 0)).toISOString(),
      to: new Date(new Date().setUTCHours(23, 59, 59, 0)).toISOString(),
    });

    this._queryEnter$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        switchMap(() => this.#dialogEnter.openEnterDialog(this.#injector))
      )
      .subscribe();

    this._queryTrade$
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        switchMap(() => this.#dialogTrade.openTradeDialog(this.#injector))
      )
      .subscribe(() => console.log('dialog service'));
  }
}

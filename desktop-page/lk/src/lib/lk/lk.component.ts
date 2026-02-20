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
import { ActionDeletePosition } from 'ui-common/lib/plugins/plugins/action-delete-position';
import { ActionNewPosition } from 'ui-common/lib/plugins/plugins/action-new-position';
import { ActionShowPosition } from 'ui-common/lib/plugins/plugins/action-show-position';
import { ActionShowIdea } from 'ui-common/lib/plugins/plugins/action-show-idea';
import { ActionCopyIdea } from 'ui-common/lib/plugins/plugins/action-copy-idea';
import { TradeDialogService } from 'desktop-page/trade';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { DataAccessIdeasStore } from '@data-access-idea/store';
import { ApiIdeasService } from '@data-access-idea/api.service';
import { DataAccessPortfolioStore } from '@data-access-portfolio/store';
import { ApiPortfolioService } from '@data-access-portfolio/api.service';
import { DataAccessStructureStore } from '@data-access-structure/store';
import { ApiStructureService } from '@data-access-structure/api.service';
import { UserComponent } from '../user/user.component';
import { ModeComponent } from '../mode/mode.component';
import { ActionLogout } from 'ui-common/lib/plugins/plugins/action-logout';
import { ActionShowTrade } from 'ui-common/lib/plugins/plugins/action-show-trade';
import { ActionSelectIdea } from 'ui-common/lib/plugins/plugins/action-select-idea';
import { ActionSelectTransaction } from 'ui-common/lib/plugins/plugins/action-select-transaction';
import { ActionSelectStock } from 'ui-common/lib/plugins/plugins/action-select-stock';
import { ActionShowTransaction } from 'ui-common/lib/plugins/plugins/action-show-transaction';
import { Permissions } from 'utils/permissions';
import { PERMISSIONS } from 'tokens/desktop/permission';
import { AsyncPipe } from '@angular/common';
import { DialogApproveService } from 'ui-common/lib/dialog-approve';
import { ApiTradeService } from '@data-access-trade/api.service';
import { LimitStore } from '@feat-trade-limit';
import { DataAccessIdeaService } from '@data-access-idea/ideas/data-access.service';
import { DataAccessDealService } from '@data-access-idea/deals/data-access.service';
import { DataAccessPortfolioService } from '@data-access-portfolio/data-access.service';
import { TradeBrokerStore } from '@data-access-trade/store.broker';

@Component({
	selector: 'lk-layout',
	standalone: true,
	imports: [RouterOutlet, LogoComponent, UserComponent, ModeComponent, AsyncPipe],
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
		DataAccessIdeaService,
		DataAccessDealService,
		DataAccessPortfolioService,
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
		ApiIdeasService,
		{
			provide: DataAccessIdeasStore,
			useFactory: (api: ApiIdeasService) => new DataAccessIdeasStore(api),
			deps: [ApiIdeasService],
		},
		ApiTradeService,
		{
			provide: LimitStore,
			useFactory: (api: ApiTradeService) => new LimitStore(api),
			deps: [ApiTradeService],
		},
		{
			provide: TradeBrokerStore,
			useFactory: (api: ApiTradeService) => new TradeBrokerStore(api),
			deps: [ApiTradeService],
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
			useClass: ActionShowTransaction,
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
			useClass: ActionSelectStock,
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
		{
			provide: DialogApproveService,
			useFactory: (dialog: DialogService) => new DialogApproveService(dialog),
			deps: [DIALOG],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LkComponent implements OnInit {
	readonly #dataAccessIdea: DataAccessIdeaService = inject(DataAccessIdeaService);
	readonly #dataAccessDeal: DataAccessDealService = inject(DataAccessDealService);
	readonly #dataAccessIdeaStore: DataAccessIdeasStore = inject(DataAccessIdeasStore);
	readonly #dataAccessPortfolio: DataAccessPortfolioService = inject(DataAccessPortfolioService);
	readonly #dataAccessPortfolioStore: DataAccessPortfolioStore = inject(DataAccessPortfolioStore);

	readonly #injector: Injector = inject(Injector);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #dialogTrade: TradeDialogService = inject(TradeDialogService);
	readonly #dialogEnter: EnterDialogService = inject(EnterDialogService);
	private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
	readonly #permissions: Permissions = inject(PERMISSIONS);
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
		filter((params: Params) => params['id']),
		distinctUntilChanged((a: Params, b: Params) => a['trade'] === b['trade']),
		filter((params: Params) => params['trade'] === 'visible' && params['id']),
		debounceTime(100),
		shareReplay({ refCount: false, bufferSize: 1 })
	);
	readonly isAccess$: Observable<boolean | null> = this.#permissions.isAccessed$;

	ngOnInit(): void {
		// this.#storeTrade.loadOrderTypes();
		// this._queryParams.pipe(tap((data) => console.log(data))).subscribe();
		//TODO - очищает PARAMS =( разобраться
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
			.subscribe((result: null | string | void) => {
				if (result === 'isUpdate') {
					const paramsIdea = this.#dataAccessIdea.params();
					const paramsDeal = this.#dataAccessDeal.params();
					const paramsPortfolio = this.#dataAccessPortfolio.paramsUrl();
					if (paramsIdea) {
						this.#dataAccessIdeaStore.loadIdeas(paramsIdea);
					}
					if (paramsDeal) {
						this.#dataAccessIdeaStore.loadDeals(paramsPortfolio ? { ...paramsDeal, ...paramsPortfolio } : paramsDeal);
					}
					if (paramsPortfolio) {
						this.#dataAccessPortfolioStore.loadBalance(paramsPortfolio);
					}
				}
			});

		this._queryTrade$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				switchMap((params: Params) => this.#dialogTrade.openTradeDialog(this.#injector, params))
			)
			.subscribe(() => console.log('dialog service'));
	}
}

import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	effect,
	inject,
	Signal,
} from '@angular/core';
import { Observable, startWith, timer } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { IdeaListWrapper } from '@feat-idea-list';
import { StructureWrapper } from '@feat-structure';
import { DialListWrapper } from '@feat-deal-list';
import { PortfolioListWrapper } from '@feat-portfolio-list';
import { Params } from '@angular/router';
import { DataAccessPortfolioStore } from '@data-access-portfolio/store';
import { DataAccessPortfolioService } from '@data-access-portfolio/data-access.service';
import { DataAccessStructureStore } from '@data-access-structure/store';
import { DataAccessStructureService } from '@data-access-structure/data-access.service';
import { DataAccessDealService } from '@data-access-idea/deals/data-access.service';
import { QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { AsyncPipe } from '@angular/common';
import { TuiBreakpointMediaKey, TuiBreakpointService, TuiFormatNumberPipe } from '@taiga-ui/core';
import { StockWrapperComponent } from 'feat-candlestick';
import { PortfolioChartWrapper } from '@feat-portfolio-chart';
import { TabsComponent } from 'ui-common/lib/tabs';
import { PortfolioParams } from '@data-access-portfolio/types';
import { TIMER_INTERVAL } from 'tokens/desktop/timer-interval';
import { DataAccessIdeasStore } from '@data-access-idea/store';
import { DealFilterDialogService, DialogComponent } from '@feat-deals-filter';

@Component({
	selector: 'light-layout',
	standalone: true,
	imports: [
		StructureWrapper,
		IdeaListWrapper,
		DialListWrapper,
		PortfolioListWrapper,
		AsyncPipe,
		StockWrapperComponent,
		PortfolioChartWrapper,
		TabsComponent,
		DialogComponent,
	],
	templateUrl: './layout.component.html',
	styleUrl: './layout.component.scss',
	providers: [
		DataAccessStructureService,
		TuiFormatNumberPipe,
		{
			provide: TIMER_INTERVAL,
			useValue: 60 * 1000 * 15,
		},
		DealFilterDialogService,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightLayoutComponent implements AfterViewInit {
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
	readonly #breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);
	readonly #dataAccessPortfolio: DataAccessPortfolioService = inject(DataAccessPortfolioService);
	readonly #storePortfolio: DataAccessPortfolioStore = inject(DataAccessPortfolioStore);
	readonly #dataAccessStructure: DataAccessStructureService = inject(DataAccessStructureService);
	readonly #storeStructure: DataAccessStructureStore = inject(DataAccessStructureStore);
	readonly #dataAccessDeal: DataAccessDealService = inject(DataAccessDealService);
	readonly #dataAccessDealStore: DataAccessIdeasStore = inject(DataAccessIdeasStore);
	readonly #timerInterval: number = inject(TIMER_INTERVAL);

	activeItemIndex = 0;
	readonly paramsPortfolio: Signal<PortfolioParams | null> = computed(() => {
		const params = this.#dataAccessPortfolio.params();

		if (params === null) {
			return null;
		}

		const { currency, portfolio, ...other } = params;

		return {
			currencyId: currency ? currency.currencyId : null,
			portfolioId: portfolio ? portfolio.portfolioId : null,
			...other,
		};
	});
	readonly paramsStructure: Signal<Params | null> = computed(() =>
		this._getParamsStructure(this.#dataAccessStructure.params(), this.#dataAccessPortfolio.params())
	);
	readonly paramsPortfolio$: Observable<PortfolioParams> = toObservable(this.#dataAccessPortfolio.params).pipe(
		filter((params) => !!params)
	);
	readonly paramsDeal$ = toObservable(this.#dataAccessDeal.params).pipe(filter((params) => !!params));
	readonly isChart$: Observable<boolean> = this.#queryParams.pipe(
		takeUntilDestroyed(this.#destroyRef),
		startWith(this.#queryParams.value()),
		map((params: Params) => !!params['chart']),
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly isShowPortfolioChart$: Observable<boolean> = this.#queryParams.pipe(
		takeUntilDestroyed(this.#destroyRef),
		startWith(this.#queryParams.value()),
		map((params: Params) => params['chart'] && params['chart'] === 'portfolio')
	);
	readonly isShowCandlestickChart$: Observable<boolean> = this.#queryParams.pipe(
		takeUntilDestroyed(this.#destroyRef),
		startWith(this.#queryParams.value()),
		map((params: Params) => params['chart'] && params['chart'] === 'candlestick')
	);
	readonly chartPortfolio$: Observable<any> = this.#queryParams.pipe(
		takeUntilDestroyed(this.#destroyRef),
		startWith(this.#queryParams.value()),
		filter((params: Params) => params['chart'] && params['chart'] === 'portfolio'),
		switchMap(() => this.paramsPortfolio$),
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly isMobile$: Observable<boolean> = this.#breakpoint$.pipe(
		map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile'),
		shareReplay({ refCount: true, bufferSize: 1 })
	);
	readonly tabs$: Observable<{ text: string; icon: string }[] | null> = this.#breakpoint$.pipe(
		map((screen: string | null): { text: string; icon: string }[] | null => {
			if (screen === 'mobile') {
				return [
					{
						icon: '@tui.briefcase-business',
						text: 'Портфель',
					},
					{
						icon: '@tui.chart-pie',
						text: 'Структура',
					},
					{
						icon: '@tui.shopping-cart',
						text: 'Сделка',
					},
					{
						icon: '@tui.lightbulb',
						text: 'Идея',
					},
				];
			}

			this.activeItemIndex = 0;
			return null;
		})
	);

	constructor() {
		effect(() => {
			const params = this.paramsPortfolio();
			if (params) {
				this.#storePortfolio.loadBalance(params);
			}
		});
		effect(() => {
			const params = this.paramsStructure();
			if (params) {
				this.#storeStructure.loadStructure(params);
			}
		});
	}

	ngAfterViewInit(): void {
		this.chartPortfolio$.subscribe((params: Params) => this.#storePortfolio.loadHistory(params));
		this.paramsDeal$
			.pipe(
				switchMap((params: Params) =>
					timer(0, this.#timerInterval).pipe(
						takeUntilDestroyed(this.#destroyRef),
						map(() => params)
					)
				)
			)
			.subscribe((params: Params) => this.#dataAccessDealStore.loadDeals(params));
	}

	private _getParamsStructure(paramsStructure: Params | null, paramsPortfolio: PortfolioParams | null): Params | null {
		if (paramsPortfolio === null && paramsStructure === null) {
			return null;
		}

		let params: Params = {};

		if (paramsPortfolio) {
			params = {
				...params,
				...paramsPortfolio,
				currencyId: paramsPortfolio['currency'] ? paramsPortfolio['currency']['currencyId'] : null,
				portfolioId: paramsPortfolio['portfolio'] ? paramsPortfolio['portfolio']['portfolioId'] : null,
				date: paramsPortfolio['to'],
			};
		}

		if (paramsStructure) {
			params = {
				...params,
				...paramsStructure,
			};
		}

		return params;
	}
}

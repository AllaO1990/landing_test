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
import { combineLatest, debounceTime, Observable, startWith } from 'rxjs';
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
import { DataAccessIdeaService } from '@data-access-idea/data-access.service';
import { DataAccessIdeaStore } from '@data-access-idea/store';
import { DataAccessDealService } from '@data-access-deal/data-access.service';
import { DataAccessDealStore } from '@data-access-deal/store';
import { QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { AsyncPipe } from '@angular/common';
import { PortfolioChartWrapper } from '@feat-portfolio-chart';
import { TuiFormatNumberPipe } from '@taiga-ui/core';

@Component({
  selector: 'main-light',
  standalone: true,
  imports: [StructureWrapper, IdeaListWrapper, DialListWrapper, PortfolioListWrapper, AsyncPipe, PortfolioChartWrapper],
  templateUrl: './light.component.html',
  styleUrl: './light.component.scss',
  providers: [
    DataAccessPortfolioService,
    DataAccessStructureService,
    DataAccessIdeaService,
    DataAccessDealService,
    TuiFormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightComponent implements AfterViewInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #dataAccessPortfolio: DataAccessPortfolioService = inject(DataAccessPortfolioService);
  readonly #storePortfolio: DataAccessPortfolioStore = inject(DataAccessPortfolioStore);
  readonly #dataAccessStructure: DataAccessStructureService = inject(DataAccessStructureService);
  readonly #storeStructure: DataAccessStructureStore = inject(DataAccessStructureStore);
  readonly #dataAccessIdea: DataAccessIdeaService = inject(DataAccessIdeaService);
  readonly #storeIdea: DataAccessIdeaStore = inject(DataAccessIdeaStore);
  readonly #dataAccessDeal: DataAccessDealService = inject(DataAccessDealService);
  readonly #storeDeal: DataAccessDealStore = inject(DataAccessDealStore);

  readonly paramsPortfolio: Signal<Params | null> = computed(() => this.#dataAccessPortfolio.params());
  readonly paramsStructure: Signal<Params | null> = computed(() =>
    this._getParamsStructure(this.#dataAccessStructure.params(), this.#dataAccessPortfolio.params())
  );
  readonly paramsPortfolio$ = toObservable(this.#dataAccessPortfolio.params);
  readonly paramsIdea$: Observable<Params> = combineLatest([
    toObservable(this.#dataAccessPortfolio.params).pipe(
      filter((params: Params | null): params is Params => params !== null),
      map((params: Params) => ({ currencyId: params['currencyId'] }))
    ),
    toObservable(this.#dataAccessIdea.params).pipe(
      filter((params: Params | null): params is Params => params !== null)
    ),
  ]).pipe(
    takeUntilDestroyed(this.#destroyRef),
    map(([portfolio, idea]: [Params, Params]) => Object.assign({}, portfolio, idea)),
    debounceTime(250)
  );
  readonly paramsDeal$: Observable<Params> = combineLatest([
    toObservable(this.#dataAccessPortfolio.params).pipe(
      filter((params: Params | null): params is Params => params !== null)
    ),
    toObservable(this.#dataAccessDeal.params).pipe(
      filter((params: Params | null): params is Params => params !== null)
    ),
  ]).pipe(
    takeUntilDestroyed(this.#destroyRef),
    map(([portfolio, deal]: [Params, Params]) => Object.assign({}, portfolio, deal)),
    debounceTime(250)
  );
  readonly isChart$: Observable<boolean> = this.#queryParams.pipe(
    startWith(this.#queryParams.value()),
    map((params: Params) => !!params['chart']),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly isShowPortfolioChart$: Observable<boolean> = this.#queryParams.pipe(
    takeUntilDestroyed(this.#destroyRef),
    map((params: Params) => params['chart'] && params['chart'] === 'portfolio')
  );
  readonly chartPortfolio$: Observable<any> = this.#queryParams.pipe(
    takeUntilDestroyed(this.#destroyRef),
    filter((params: Params) => params['chart'] && params['chart'] === 'portfolio'),
    switchMap(() => this.paramsPortfolio$),
    shareReplay({ bufferSize: 1, refCount: true })
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
    this.paramsIdea$.subscribe((params: Params) => this.#storeIdea.loadIdaes(params));
    this.paramsDeal$.subscribe((params: Params) => this.#storeDeal.load(params));
    this.chartPortfolio$.subscribe((params: Params) => this.#storePortfolio.loadHistory(params));
  }

  private _getParamsStructure(paramsStructure: Params | null, paramsPortfolio: Params | null): Params | null {
    if (paramsPortfolio === null && paramsStructure === null) {
      return null;
    }

    let params: Params = {};

    if (paramsPortfolio) {
      params = {
        ...params,
        ...paramsPortfolio,
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

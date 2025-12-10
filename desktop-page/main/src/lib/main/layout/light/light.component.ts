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
import { combineLatest, debounceTime, Observable } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'main-light',
  standalone: true,
  imports: [StructureWrapper, IdeaListWrapper, DialListWrapper, PortfolioListWrapper],
  templateUrl: './light.component.html',
  styleUrl: './light.component.scss',
  providers: [DataAccessPortfolioService, DataAccessStructureService, DataAccessIdeaService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightComponent implements AfterViewInit {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #dataAccessPortfolio: DataAccessPortfolioService = inject(DataAccessPortfolioService);
  readonly #storePortfolio: DataAccessPortfolioStore = inject(DataAccessPortfolioStore);
  readonly #dataAccessStructure: DataAccessStructureService = inject(DataAccessStructureService);
  readonly #storeStructure: DataAccessStructureStore = inject(DataAccessStructureStore);
  readonly #dataAccessIdea: DataAccessIdeaService = inject(DataAccessIdeaService);
  readonly #storeIdea: DataAccessIdeaStore = inject(DataAccessIdeaStore);

  readonly paramsPortfolio: Signal<Params | null> = computed(() => this.#dataAccessPortfolio.params());
  readonly paramsStructure: Signal<Params | null> = computed(() =>
    this._getParamsStructure(this.#dataAccessStructure.params(), this.#dataAccessPortfolio.params())
  );
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

  constructor() {
    effect(() => {
      const params = this.paramsPortfolio();
      if (params) {
        this.#storePortfolio.loadAccountBalance(params);
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
    console.log('ngAfterViewInit');

    this.paramsIdea$.subscribe((params: Params) => this.#storeIdea.loadIdaes(params));
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

  private _getParamsIdea(paramsIdea: Params | null, paramsPortfolio: Params | null): Params | null {
    if (paramsPortfolio === null && paramsIdea === null) {
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

    if (paramsIdea) {
      params = {
        ...params,
        ...paramsIdea,
      };
    }

    return params;
  }
}

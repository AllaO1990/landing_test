import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { Structure } from '@feat-structure';
import { DataAccessStructureStore } from '@data-access-structure';
import { AsyncPipe } from '@angular/common';
import { combineLatest, debounceTime, ReplaySubject, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  AccountBroker,
  AccountCurrency,
  AccountPortfolio,
  AccountRange,
  AccountStrategy,
  AccountType,
} from 'types/account';
import { Params } from '@angular/router';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';

@Component({
  selector: 'main-light',
  standalone: true,
  imports: [Structure, AsyncPipe],
  templateUrl: './light.component.html',
  styleUrl: './light.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightComponent implements AfterViewInit {
  readonly #dataAccessStructureState: DataAccessStructureStore = inject(DataAccessStructureStore);
  readonly #store: PortfolioFacade = inject(PortfolioFacade);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #category: Subject<{ name: string; value: string }> = new ReplaySubject(1);

  readonly dataStructure$ = this.#dataAccessStructureState.state$;
  readonly defaultDataStructure = DataAccessStructureStore.defaultState;

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
    // this.#dataAccessStructureState.loadStructure({});

    combineLatest([
      this.#store.broker$,
      this.#store.currency$,
      this.#store.range$,
      this.#store.portfolio$,
      this.#store.type$,
      this.#store.strategy$,
      this.#store.leadToCurrency$,
      this.#category.asObservable(),
    ])
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        debounceTime(0),
        map(
          (
            params: [
              AccountBroker | null,
              AccountCurrency | null,
              AccountRange | null,
              AccountPortfolio | null,
              AccountType | null,
              AccountStrategy | null,
              AccountCurrency | null,
              {
                value: string;
              }
            ]
          ) => ({
            brokerId: params[0] ? params[0].brokerId : null,
            currencyId: params[1] ? params[1].currencyId : null,
            date: params[2] ? params[2].to : null,
            portfolioId: params[3] ? params[3].portfolioId : null,
            instrumentType: params[4] ? params[4].id : null,
            strategyId: params[5] ? params[5].id : null,
            leadToCurrency: params[6] ? params[6].currency : null,
            groupBy: params[7] ? params[7].value : null,
          })
        )
      )
      .subscribe((params: Params) => this.#dataAccessStructureState.loadStructure(params));
  }

  onSelectCategory(value: { name: string; value: string }) {
    this.#category.next(value);
  }
}

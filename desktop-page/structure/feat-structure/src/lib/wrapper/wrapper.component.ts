import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { ReplaySubject, Subject } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Structure } from '../feat-structure/structure.component';
import { DataAccessStructureStore } from '@data-access-structure/store';
import { DataAccessStructureService } from '@data-access-structure/data-access.service';

@Component({
  selector: 'structure-wrapper',
  standalone: true,
  imports: [AsyncPipe, Structure],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StructureWrapper implements AfterViewInit, OnDestroy {
  readonly #storeStructure: DataAccessStructureStore = inject(DataAccessStructureStore);
  readonly #dataAccessStructure: DataAccessStructureService = inject(DataAccessStructureService);
  readonly #store: PortfolioFacade = inject(PortfolioFacade);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #category: Subject<{ name: string; value: string }> = new ReplaySubject(1);

  readonly data$ = this.#storeStructure.state$;

  ngAfterViewInit(): void {
    // combineLatest([
    //   this.#store.broker$,
    //   this.#store.currency$,
    //   this.#store.range$,
    //   this.#store.portfolio$,
    //   this.#store.type$,
    //   this.#store.strategy$,
    //   this.#store.leadToCurrency$,
    //   this.#category.asObservable(),
    // ])
    //   .pipe(
    //     takeUntilDestroyed(this.#destroyRef),
    //     debounceTime(0),
    //     map(
    //       (
    //         params: [
    //           AccountBroker | null,
    //           AccountCurrency | null,
    //           AccountRange | null,
    //           AccountPortfolio | null,
    //           AccountType | null,
    //           AccountStrategy | null,
    //           AccountCurrency | null,
    //           {
    //             value: string;
    //           }
    //         ]
    //       ) => ({
    //         brokerId: params[0] ? params[0].brokerId : null,
    //         currencyId: params[1] ? params[1].currencyId : null,
    //         date: params[2] ? params[2].to : null,
    //         portfolioId: params[3] ? params[3].portfolioId : null,
    //         instrumentType: params[4] ? params[4].id : null,
    //         strategyId: params[5] ? params[5].id : null,
    //         leadToCurrency: params[6] ? params[6].currency : null,
    //         groupBy: params[7] ? params[7].value : null,
    //       })
    //     )
    //   )
    //   .subscribe((params: Params) => this.#dataAccessStructureState.loadStructure(params));
  }

  ngOnDestroy(): void {
    this.#category.complete();
  }

  onSelectCategory(item: { name: string; value: string }) {
    this.#dataAccessStructure.params.set({ groupBy: item.value });
  }
}

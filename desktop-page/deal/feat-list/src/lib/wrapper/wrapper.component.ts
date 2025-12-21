import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { DataAccessDealStore } from '@data-access-deal/store';
import { LayoutComponent } from '../layout/layout.component';
import { DataAccessDealService } from '@data-access-deal/data-access.service';
import { Params } from '@angular/router';

@Component({
  selector: 'deal-list-wrapper',
  standalone: true,
  imports: [AsyncPipe, LayoutComponent],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialListWrapper {
  readonly #dataAccessDeal: DataAccessDealService = inject(DataAccessDealService);
  readonly #dataAccessDealStore: DataAccessDealStore = inject(DataAccessDealStore);

  readonly response$ = this.#dataAccessDealStore.state$;

  constructor() {
    effect(() => {
      const params: Params | null = this.#dataAccessDeal.params();
      
      if (params) {
        this.#dataAccessDealStore.load(params);
      }
    });
  }
}

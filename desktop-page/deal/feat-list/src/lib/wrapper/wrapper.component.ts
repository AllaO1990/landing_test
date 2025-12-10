import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { DataAccessDealStore } from '@data-access-deal/store';
import { LayoutComponent } from '../layout/layout.component';

@Component({
  selector: 'deal-list-wrapper',
  standalone: true,
  imports: [AsyncPipe, LayoutComponent],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialListWrapper {
  readonly #dataAccessDealStore: DataAccessDealStore = inject(DataAccessDealStore);

  readonly response$ = this.#dataAccessDealStore.state$;
}

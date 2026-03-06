import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { DataAccessIdeasStore } from '@data-access-idea/store';
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
	readonly #dataAccessDealStore: DataAccessIdeasStore = inject(DataAccessIdeasStore);

	readonly response$ = this.#dataAccessDealStore.deals$;
}

import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { DataAccess, DataAccessIdeasStore } from '@data-access-idea/store';
import { AsyncPipe } from '@angular/common';
import { AccountCurrency, AccountStrategy, AccountType } from 'types/account';
import { DataAccessIdeaService } from '@data-access-idea/ideas/data-access.service';
import { Params } from '@angular/router';
import { filter, Observable, switchMap, take, timer } from 'rxjs';
import { QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import { EventSelected } from 'types/events';
import { TIMER_INTERVAL } from 'tokens/desktop/timer-interval';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { LayoutComponent } from '../layout/layout.component';
import { Positions } from 'types/position';

interface ValueSubmit {
	search: string;
	type: AccountType;
	strategy: AccountStrategy;
	currency: AccountCurrency;
	page: number;
	limit: number;
}

@Component({
	selector: 'idea-list-wrapper',
	standalone: true,
	imports: [AsyncPipe, LayoutComponent],
	templateUrl: './wrapper.component.html',
	styleUrl: './wrapper.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeaListWrapper implements AfterViewInit {
	readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
	readonly #dataAccessIdea: DataAccessIdeaService = inject(DataAccessIdeaService);
	readonly #dataAccessIdeaStore: DataAccessIdeasStore = inject(DataAccessIdeasStore);
	readonly #timerInterval: number = inject(TIMER_INTERVAL);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly #params$: Observable<Params> = toObservable(this.#dataAccessIdea.params).pipe(filter((params) => !!params));
	readonly response$ = this.#dataAccessIdeaStore.ideas$;

	ngAfterViewInit(): void {
		this.#params$
			.pipe(
				switchMap((params) =>
					timer(0, this.#timerInterval).pipe(
						takeUntilDestroyed(this.#destroyRef),
						map(() => params)
					)
				)
			)
			.subscribe((params) => this.#dataAccessIdeaStore.loadIdeas(params));

		this.response$
			.pipe(
				filter((response: DataAccess<Positions>) => response.data !== null),
				take(1)
			)
			.subscribe((response: DataAccess<Positions>) => {
				const data = response.data && response.data.items;
				const id = this.#queryParams.value()['id'];

				if (data !== null && data.length && !id) {
					this.#queryParams.update({
						id: data[0].id,
						type: EventSelected.IDEA,
					});
				}
			});
	}
}

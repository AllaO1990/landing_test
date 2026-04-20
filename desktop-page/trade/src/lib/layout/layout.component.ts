import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { TuiBreakpointService, TuiButton } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TradeStore } from '@data-access-trade/store.trade';
import {
	BehaviorSubject,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	Observable,
	shareReplay,
	startWith,
	Subject,
	take,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { TradeMobileFormComponent } from '../form/mobile/form.component';
import { TradeDesktopFormComponent } from '../form/desktop/form.component';
import { ApiTradeService } from '@data-access-trade/api.service';
import { StockPosition } from 'types/position';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { TradeJournal, TradeJournalStatus, TradeJournalSystem } from 'types/trade';
import { TuiButtonLoading } from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'trade-layout',
	standalone: true,
	imports: [
		TuiButton,
		ReactiveFormsModule,
		AsyncPipe,
		TradeMobileFormComponent,
		TradeDesktopFormComponent,
		TuiButtonLoading,
	],
	templateUrl: './layout.component.html',
	styleUrls: ['../common/dialog.scss', './layout.component.scss'],
	providers: [
		ApiTradeService,
		{
			provide: TradeStore,
			useFactory: (api: ApiTradeService) => new TradeStore(api),
			deps: [ApiTradeService],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnDestroy {
	readonly #breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #store: TradeStore = inject(TradeStore);
	readonly #idea: IdeaFacade = inject(IdeaFacade);
	readonly #isSubmitted$: Subject<boolean> = new BehaviorSubject<boolean>(false);
	readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

	loading = false;

	readonly isLoading$: Observable<boolean> = this.#store.isLoading$;
	readonly isMobile$: Observable<boolean> = this.#breakpoint$.pipe(
		map((media: TuiBreakpointMediaKey | null): boolean => media === 'mobile'),
		shareReplay({ refCount: true, bufferSize: 1 })
	);

	readonly formGroup: FormGroup = new FormGroup({
		trade: new FormControl(null),
	});

	get controlTrade(): FormControl {
		return this.formGroup.get('trade') as FormControl;
	}

	readonly isDisabled$: Observable<boolean> = this.controlTrade.valueChanges.pipe(
		startWith(this.controlTrade.value),
		map(
			(
				value: {
					journal: { entry: TradeJournal[] | null; out: TradeJournal[] | null; stop: TradeJournal[] | null } | null;
				} | null
			) => {
				if (!value || !value.journal) {
					return true;
				}

				return (
					[...(value.journal.entry || []), ...(value.journal.out || [])].findIndex((item) => item.status === null) === -1
				);
			}
		),
		debounceTime(300)
	);

	ngOnDestroy(): void {
		this.#isSubmitted$.complete();
	}

	onClose(event: Event): void {
		event.preventDefault();

		this.#context.completeWith('isUpdate');
	}

	onSubmit(event: Event): void {
		event.preventDefault();

		this.#store.updateIsLoading(true);

		this.controlTrade.valueChanges
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				startWith(this.controlTrade.getRawValue()),
				distinctUntilChanged((a, b) => {
					return a.position.idea.id === b.position.idea.id;
				}),
				filter((value: { position: StockPosition }) => value.position.idea.author !== 'bot'),
				take(1)
			)
			.subscribe((value) => {
				this._onSubmit(value.position.idea.id as number);
			});

		const {
			idea,
			position,
			journal: { entry, out },
		} = this.formGroup.getRawValue().trade;

		const entries = entry
			.filter((item: { status: string }) => item.status === TradeJournalStatus.EXECUTED)
			.map((item: TradeJournal) => ({
				amount: item.quantity,
				brokerId: item.sourceId,
				date: item.expireDate,
				price: item.price,
			}));
		const outs = out
			.filter((item: { status: string }) => item.status === TradeJournalStatus.EXECUTED)
			.map((item: TradeJournal) => ({
				amount: item.quantity,
				brokerId: item.sourceId,
				date: item.expireDate,
				price: item.price,
			}));

		const positionUpdate = {
			actions: {
				entries: entries,
				outs: outs,
			},
			comissions: [],
			dividends: [],
			idea: {
				amount: idea.entry[0].quantity,
				entry: idea.entry[0].price,
				goals: idea.out.map((item: any) => ({
					amount: item.amount,
					goal: item.price,
				})),
				instrumentId: position.idea.instrument.id,
				parentId: position.idea.parentId,
				portfolioId: position.idea.portfolioId,
				positionType: position.idea.positionType,
				strategyId: position.idea.strategy!.id,
				stop: idea.stop[0].price,
				watch: true,
			},
		};

		if (position.idea.author === 'bot') {
			this.#idea.createIdea(positionUpdate);
		}
	}

	private _onSubmit(ideaId: number): void {
		const {
			journal: { entry, out, stop, remove },
		} = this.formGroup.getRawValue().trade;
		const value = this.formGroup.getRawValue().trade;

		this.controlTrade.patchValue({ ...value, journal: { ...value.journal, remove: [] } });

		const removed = remove.map((item: TradeJournal & TradeJournalSystem) => {
			const { change, isEdit, remove, ...journal } = item;

			return { ...journal, ideaId };
		});

		const update = [...entry, ...out].map((item: TradeJournal & TradeJournalSystem) => {
			const { change, isEdit, remove, ...journal } = item;

			if (journal.status === null) {
				journal.status = TradeJournalStatus.UNLOADING;
			}

			return { ...journal, ideaId };
		});

		this.#store.onSubmitJournal({ removed, update });
	}
}

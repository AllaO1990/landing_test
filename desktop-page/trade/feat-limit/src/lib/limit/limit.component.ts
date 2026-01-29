import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	effect,
	inject,
	input,
	InputSignal,
	signal,
	WritableSignal,
} from '@angular/core';
import { LimitStore } from './limit.store';
import { distinctUntilChanged, filter, map, Observable, shareReplay, switchMap } from 'rxjs';
import { TradeLimit } from '@data-access-trade/types';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { TuiInputNumber, TuiSkeleton } from '@taiga-ui/kit';
import { LoaderComponent } from '@ui/components/loader';
import { TuiButton, TuiFormatNumberPipe, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAutoFocus } from '@taiga-ui/cdk';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'trade-limit',
	imports: [
		AsyncPipe,
		TuiSkeleton,
		LoaderComponent,
		TuiFormatNumberPipe,
		TuiTextfield,
		ReactiveFormsModule,
		TuiInputNumber,
		TuiAutoFocus,
		TuiNumberFormat,
		NgTemplateOutlet,
		TuiButton,
	],
	templateUrl: './limit.component.html',
	styleUrl: './limit.component.scss',
	providers: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareLimit implements AfterViewInit {
	readonly #destroyRef: DestroyRef = inject(DestroyRef);
	readonly #store: LimitStore = inject(LimitStore);

	readonly size = 's';

	readonly limit$: Observable<TradeLimit | null> = this.#store.limit$.pipe(
		shareReplay({ bufferSize: 1, refCount: true })
	);
	readonly isLoading$: Observable<boolean | null> = this.#store.isLoaded$.pipe(
		filter((isLoaded: boolean | null) => isLoaded === true),
		switchMap(() => this.#store.isLoading$),
		map((isLoading: boolean | null) => !isLoading)
	);
	readonly isLoaded$: Observable<boolean | null> = this.#store.isLoaded$.pipe(
		map((isLoaded: boolean | null) => !isLoaded)
	);

	readonly currency: InputSignal<number | null> = input<number | null>(null);
	readonly isEdit: WritableSignal<boolean> = signal(false);

	readonly form: FormGroup = new FormGroup({
		previous: new FormControl(null),
		current: new FormControl(null, Validators.required),
	});

	get controlCurrent(): FormControl {
		return this.form.get('current') as FormControl;
	}

	get controlPrevious(): FormControl {
		return this.form.get('previous') as FormControl;
	}

	constructor() {
		effect(() => {
			const currency = this.currency();

			if (currency !== null) {
				this.#store.loadLimit(currency);
			}
		});
	}
	ngAfterViewInit(): void {
		let updateCount = 0;

		this.limit$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				filter((data: TradeLimit | null): data is TradeLimit => data !== null),
				distinctUntilChanged((a, b) => a.limit === b.limit)
			)
			.subscribe((data: TradeLimit) => {
				const value = data && data.limit;

				this.controlPrevious.patchValue(updateCount === 0 ? value : this.controlCurrent.value, {
					emitEvent: false,
				});
				this.controlCurrent.patchValue(value);
				updateCount++;
			});
	}

	onEdit(event: Event): void {
		event.preventDefault();

		this.controlCurrent.patchValue(this.controlPrevious.value);
		this.form.markAsPristine();

		this.isEdit.set(true);
	}

	onSave(event: Event): void {
		event.preventDefault();

		this.#store.changeLimit({
			currencyId: this.currency(),
			limit: this.controlCurrent.value,
		});

		this.isEdit.set(false);
	}

	onClose(event: Event): void {
		event.preventDefault();

		this.controlCurrent.patchValue(this.controlPrevious.value);

		this.isEdit.set(false);
	}

	onDelete(event: Event): void {
		event.preventDefault();

		const currencyId = this.currency();

		if (currencyId !== null) {
			this.#store.deleteLimit(currencyId);
		}

		this.isEdit.set(false);
	}
}

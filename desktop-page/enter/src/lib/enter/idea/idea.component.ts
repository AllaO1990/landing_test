import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	forwardRef,
	inject,
	Injector,
	Input,
	NgZone,
} from '@angular/core';
import { AsyncPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiDialogService, TuiFormatNumberPipe, TuiHint } from '@taiga-ui/core';
import {
	AbstractControl,
	ControlValueAccessor,
	FormArray,
	FormControl,
	FormGroup,
	NG_VALUE_ACCESSOR,
	ReactiveFormsModule,
} from '@angular/forms';
import { StockPosition, StockPositionIdeaEntry, StockPositionStop, StockPositionTarget } from 'types/position';
import { IdeaService } from './idea.service';
import { HeaderComponent, ItemComponent, UiList, UiListItem } from '@ui/components/list';
import { CheckComponent } from '@ui/components/check';
import { LoaderComponent } from '@ui/components/loader';
import { AddTargetComponent } from './add-target/add-target.component';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { AddEntryComponent } from './add-entry/add-entry.component';
import { AddStopComponent } from './add-stop/add-stop.component';
import {
	BehaviorSubject,
	combineLatest,
	debounceTime,
	defer,
	distinctUntilChanged,
	filter,
	Observable,
	ReplaySubject,
	shareReplay,
	startWith,
	Subject,
	switchMap,
	take,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs/operators';
import { getPriceIncrement } from 'utils/get-price-increment';
import { getNumberPrecision } from 'utils/get-number-precision';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { IndicatorAtr } from 'stores/plugins/indicator.atr.store';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { ColorForPriceEntryPipe, ColorForPriceStopPipe } from '../color.pipe';
import { GetCryptoNumberPipe } from '@ui/pipes/get-crypto-number.pipe';

@Component({
	selector: 'lib-enter-idea',
	standalone: true,
	imports: [
		AsyncPipe,
		ItemComponent,
		UiListItem,
		HeaderComponent,
		TuiButton,
		ReactiveFormsModule,
		NgIf,
		ColorForPriceEntryPipe,
		ColorForPriceStopPipe,
		CheckComponent,
		TuiFormatNumberPipe,
		UiList,
		LoaderComponent,
		GetCryptoNumberPipe,
		TuiHint,
		NgTemplateOutlet,
	],
	templateUrl: './idea.component.html',
	styleUrl: './idea.component.scss',
	providers: [
		IdeaService,
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => EnterIdeaComponent),
			multi: true,
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterIdeaComponent implements ControlValueAccessor, AfterViewInit {
	private readonly _injector: Injector = inject(Injector);
	private readonly _destroyRef: DestroyRef = inject(DestroyRef);
	private readonly _dialogDefaultService: TuiDialogService = inject(TuiDialogService);
	private readonly _dialogService: DialogService = inject(DIALOG);
	private readonly _service: IdeaService = inject(IdeaService);
	private readonly _ideaFacade: IdeaFacade = inject(IdeaFacade);
	private readonly _ngZone: NgZone = inject(NgZone);

	private _dialogTargetComponent: PolymorpheusComponent<AddTargetComponent> | null = null;
	private _dialogEntryComponent: PolymorpheusComponent<AddEntryComponent> | null = null;
	private _dialogStopComponent: PolymorpheusComponent<AddStopComponent> | null = null;

	readonly isEdit$: Subject<boolean> = new BehaviorSubject(false);
	readonly _controlValue: Subject<any | null> = new ReplaySubject(1);

	@Input() formGroup!: FormGroup;

	readonly itemHeight = 28;
	minPriceIncrement = 1e-8;
	priceIncrement = getPriceIncrement(this.minPriceIncrement);
	multiplier = 1;
	inPositionQuantityValue = 0;
	isDisabled = false;
	value: any = null;

	get maxAmount() {
		if (this.formArrayEntries && this.formArrayEntries.value.length > 0) {
			return this.formArrayEntries.value[0].quantity;
		}

		return 0;
	}

	onChange = (_: any) => {};
	onTouched = () => {};

	private readonly _mapForm = {
		entries: this.addEntry,
		targets: this.addTarget,
		stop: this.addStop,
	};

	readonly controlFormArray: FormGroup = new FormGroup({
		entries: new FormArray<FormControl<StockPositionIdeaEntry>>([]),
		targets: new FormArray<FormControl<StockPositionTarget>>([]),
		stop: new FormArray<FormControl<StockPositionStop>>([]),
	});

	get formArrayEntries(): FormArray {
		return this.controlFormArray.get('entries') as FormArray;
	}

	get formArrayTargets(): FormArray {
		return this.controlFormArray.get('targets') as FormArray;
	}

	get formArrayStop(): FormArray {
		return this.controlFormArray.get('stop') as FormArray;
	}

	private readonly _formGroupValueChanges$: Subject<any> = new ReplaySubject(1);

	readonly formGroupValueChanges$: Observable<any> = this._formGroupValueChanges$.asObservable().pipe(
		filter((value: any | null): value is any => value !== null),
		shareReplay({ refCount: true, bufferSize: 1 })
	);

	readonly isCanAddEntry$: Observable<boolean> = this.formGroupValueChanges$.pipe(
		map((value: { sidebar: { positionType: string | null } }) => value.sidebar.positionType !== null),
		distinctUntilChanged(),
		shareReplay({ refCount: true, bufferSize: 1 })
	);

	multiplier$: Observable<number> = this.formGroupValueChanges$.pipe(
		map((data: { sidebar: { positionType: string } }) => data.sidebar && data.sidebar.positionType),
		distinctUntilChanged(),
		map((type: string): number => (type === 'short' ? -1 : 1)),
		tap((value) => (this.multiplier = value)),
		shareReplay({ bufferSize: 1, refCount: false })
	);
	minPriceIncrement$: Observable<number> = this.formGroupValueChanges$.pipe(
		map((data: { minPriceIncrement: number }) => data.minPriceIncrement),
		filter((value: number | null): value is number => value !== null),
		distinctUntilChanged(),
		shareReplay({ bufferSize: 1, refCount: false })
	);
	priceIncrement$: Observable<number> = this.minPriceIncrement$.pipe(map((value: number) => getPriceIncrement(value)));
	entriesList$: Observable<StockPositionIdeaEntry[]> = this._createStream<StockPositionIdeaEntry[]>(
		this.formArrayEntries
	).pipe(startWith(this.formArrayEntries.value), shareReplay({ bufferSize: 1, refCount: false }));
	totalEntry$: Observable<StockPositionIdeaEntry> = combineLatest([this.entriesList$, this.priceIncrement$]).pipe(
		debounceTime(100),
		map(([list, priceIncrement]: [StockPositionIdeaEntry[] | null, number]) =>
			this._service.getTotalEntry(list, priceIncrement)
		)
	);
	targetsList$: Observable<StockPositionTarget[] | null> = this._createStream<StockPositionTarget[]>(
		this.formArrayTargets
	).pipe(startWith(this.formArrayTargets.value), shareReplay({ bufferSize: 1, refCount: false }));
	totalTarget$: Observable<StockPositionTarget> = this.totalEntry$.pipe(
		switchMap((total: StockPositionIdeaEntry) =>
			combineLatest([this.multiplier$, this.targetsList$, this.priceIncrement$]).pipe(
				debounceTime(100),
				map(([multiplier, list, priceIncrement]: [number, StockPositionTarget[] | null, number]) =>
					this._service.getTotalTarget(list, total, multiplier, priceIncrement)
				)
			)
		)
	);
	addTarget$: Observable<boolean> = this.totalEntry$.pipe(
		map((total: StockPositionIdeaEntry) => total.quantity),
		distinctUntilChanged(),
		switchMap((quantity: number) =>
			this.targetsList$.pipe(map((list: StockPositionTarget[] | null) => this._service.getCanAddTarget(list, quantity)))
		)
	);
	stopList$: Observable<StockPositionStop[] | null> = this._createStream<StockPositionStop[]>(this.formArrayStop).pipe(
		startWith(this.formArrayStop.value),
		shareReplay({ bufferSize: 1, refCount: false })
	);
	totalStop$: Observable<StockPositionStop> = combineLatest([
		this.totalEntry$,
		this.targetsList$,
		this.stopList$,
		this.multiplier$,
		this.priceIncrement$,
	]).pipe(
		debounceTime(100),
		map(
			([total, targets, list, multiplier, priceIncrement]: [
				StockPositionIdeaEntry,
				StockPositionTarget[] | null,
				StockPositionStop[] | null,
				number,
				number
			]) => this._service.getTotalStop(list, total, targets, multiplier, priceIncrement)
		)
	);
	lastPrice$: Observable<number> = this._ideaFacade.idea$.pipe(
		map((value: StockPosition) => value.idea.lastPrice),
		shareReplay({ bufferSize: 1, refCount: false })
	);

	ngAfterViewInit(): void {
		const source$: Observable<any> = this._createStream<any>(this.formGroup).pipe(
			debounceTime(0),
			map(() => this.formGroup.getRawValue()),
			shareReplay({ bufferSize: 1, refCount: true })
		);

		source$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result: any) => {
			this._formGroupValueChanges$.next(result);
		});

		this._controlValue
			.asObservable()
			.pipe(debounceTime(0), takeUntilDestroyed(this._destroyRef))
			.subscribe((result) => {
				if (result === null) {
					this.controlFormArray.reset({ entries: [], targets: [], stop: [] });
				} else {
					const { list: entries, status } = this._getEntries(result.entries);

					this._updateFormArray('targets', result.targets);
					this._updateFormArray('stop', result.stop);
					this._updateFormArray('entries', entries, status);
				}

				setTimeout(() => {
					this.formGroup.markAsPristine();
				}, 100);
			});

		this.minPriceIncrement$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result: number) => {
			this.minPriceIncrement = result;
			this.priceIncrement = getPriceIncrement(result);
		});

		combineLatest([
			this.entriesList$.pipe(
				filter(
					(list: StockPositionIdeaEntry[] | null): list is StockPositionIdeaEntry[] => list !== null && list.length === 1
				)
			),
			this.minPriceIncrement$,
			this._ideaFacade.atr$.pipe(
				filter(
					(
						value: null | { data: IndicatorAtr; instrument: string }
					): value is {
						data: IndicatorAtr;
						instrument: string;
					} => value !== null
				)
			),
			this.multiplier$,
			this.isEdit$.asObservable(),
		])
			.pipe(takeUntilDestroyed(this._destroyRef))
			.subscribe((result) => {
				if (result[4]) {
					const entries: StockPositionIdeaEntry[] = result[0];
					const minPriceIncrement = result[1];
					const priceIncrement = getPriceIncrement(minPriceIncrement);
					const indicator: IndicatorAtr = result[2].data;
					const multiplier = result[3];

					if (indicator === null) {
						return;
					}

					const priceEntry = entries[0].price;
					const quantityEntry = entries[0].quantity;

					if (this.formArrayTargets.value.length === 0 || this.formArrayTargets.pristine) {
						const atrList: number[] = [1, 2, 4];
						let quantity = 0;

						const data: StockPositionTarget[] = [0.4, 0.3, 0.3].reduce(
							(acc: StockPositionTarget[], pct: number, index: number, array: number[]) => {
								const price = getNumberPrecision(priceEntry + multiplier * atrList[index] * indicator.atr, priceIncrement);
								let amount = getNumberPrecision(quantityEntry * pct, priceIncrement === 8 ? priceIncrement : 0);

								if (quantityEntry === 1) {
									if (index === 1) {
										amount = 1;
									} else {
										return acc;
									}
								}

								if (index === array.length - 1) {
									amount = getNumberPrecision(quantityEntry - quantity, priceIncrement);

									if (amount === 0) {
										return acc;
									}
								}

								quantity += amount;

								acc.push({
									price: price,
									amount: amount,
									lots: 0,
									totalPrice: price * amount,
									profit: getNumberPrecision((price - priceEntry) * amount * multiplier, this.priceIncrement),
									profitPercent: getNumberPrecision(((price - priceEntry) / priceEntry) * 100 * multiplier, 2),
									depositShare: null,
									reached: false,
									stopDate: null,
									broker: null,
								});

								return acc;
							},
							[]
						);

						if (this.formArrayEntries.value.length) {
							this._updateFormArray('targets', data, true);
						}
					}

					if (this.formArrayStop.value.length === 0 || this.formArrayStop.pristine) {
						const priceStop = getNumberPrecision(priceEntry - indicator.atr * multiplier, priceIncrement);

						const data: StockPositionStop[] = [
							{
								price: priceStop,
								amount: quantityEntry,
								loss: getNumberPrecision((priceStop - priceEntry) * quantityEntry * multiplier, priceIncrement),
								lossPercent: getNumberPrecision(((priceStop - priceEntry) / priceEntry) * 100 * multiplier, priceIncrement),
								depositShare: null,
								stopCandleDate: null,
								amountPercent: 100,
							},
						];

						this._updateFormArray('stop', data, true);
					}

					Promise.resolve().then(() => {
						this.formGroup.markAsPristine();
					});
				}
			});

		this.controlFormArray.valueChanges
			.pipe(takeUntilDestroyed(this._destroyRef), debounceTime(100))
			.subscribe((value) => this.onChange(value));
	}

	writeValue(obj: any): void {
		this.value = obj;

		this.isEdit$.next(obj.entries.length === 0);
		this._controlValue.next(obj);
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.isDisabled = isDisabled;
	}

	onRemoveEntries(event: Event, index: number): void {
		event.preventDefault();

		const list = this.formArrayTargets.value;

		if (list && list.length > 0) {
			this._onConfirmDialog(
				`<p class="tui-text_h6">Удалить строку?</p><p class="tui-text_body-l">Все строки из таблицы Цели, будут удалены</p>`
			).subscribe((result: boolean) => {
				if (result) {
					this.formArrayEntries.removeAt(index);
					this.formArrayTargets.clear();
				}
			});
		} else {
			this.onRemove(event, index, 'entries');
		}
	}

	onRemove(event: Event, index: number, formName: string): void {
		event.preventDefault();

		const formArray = this.controlFormArray.get(formName);

		if (formArray !== null) {
			this._onConfirmDialog('<p class="tui-text_h6">Удалить строку?</p>').subscribe((result: boolean) => {
				if (result) {
					(formArray as FormArray).removeAt(index);
				}
			});
		}
	}

	onEdit(event: Event, index: number, formName: 'stop' | 'entries' | 'targets'): void {
		event.preventDefault();

		const formArray = this.controlFormArray.get(formName);

		if (formArray !== null) {
			this._mapForm[formName].bind(this)(event, (formArray as FormArray).at(index).value, index);
		}
	}

	async addEntry(event: Event, data: object | null = null, control: number | null = null): Promise<void> {
		event.preventDefault();

		if ((this.formGroup.value as any).sidebar.positionType === null) {
			return;
		}

		this._dialogEntryComponent = await import('./add-entry/add-entry.component')
			.then((m) => m.AddEntryComponent)
			.then((c) => new PolymorpheusComponent(c, this._injector));

		this._openDialog(this._dialogEntryComponent as PolymorpheusComponent<AddEntryComponent>, {
			...data,
			minPriceIncrement: this.minPriceIncrement,
		}).subscribe((res: object | null) => {
			if (res) {
				this._updateDataFromDialog(this.formArrayEntries, res, control);
			}
		});
	}

	async addTarget(event: Event, data: object | null = null, control: number | null = null): Promise<void> {
		event.preventDefault();

		const currentPrice = this.formArrayEntries.value[0].price;
		let minPrice = null;
		let maxPrice = null;
		const maxAmount = this.formArrayEntries.value[0].quantity;
		const minDay = this.formArrayEntries.value[0].date;

		if (this.multiplier === 1) {
			minPrice = currentPrice;
		} else {
			maxPrice = currentPrice;
		}

		if (this.formArrayTargets.value.length !== 0 && control !== null && control !== 0) {
			if (this.multiplier === 1) {
				minPrice = this.formArrayTargets.value[control - 1].price;
			} else {
				maxPrice = this.formArrayTargets.value[control - 1].price;
			}
			// maxAmount = this.formArrayTargets.value.reduce(
			//   (acc: number, item: StockPositionTarget) => (acc = acc - item.amount),
			//   maxAmount
			// );
		}

		this._dialogTargetComponent = await import('./add-target/add-target.component')
			.then((m) => m.AddTargetComponent)
			.then((c) => new PolymorpheusComponent(c, this._injector));

		this._openDialog(this._dialogTargetComponent as PolymorpheusComponent<AddTargetComponent>, {
			...data,
			minPriceIncrement: this.minPriceIncrement,
			minPrice,
			maxPrice,
			maxAmount,
			minDay,
		}).subscribe((result: { amount: number; price: number; stopDate: string | null } | null) => {
			if (result) {
				const entries: StockPositionIdeaEntry | null = this.formArrayEntries.value[0];
				let profit = null;
				let profitPercent = null;

				if (entries) {
					profit = getNumberPrecision(
						(result.price * result.amount - entries.price * result.amount) * this.multiplier,
						this.priceIncrement
					);
					profitPercent = getNumberPrecision(((result.price - entries.price) / entries.price) * 100 * this.multiplier, 2);
				}

				const value: StockPositionTarget = {
					price: result.price,
					amount: result.amount,
					lots: 0,
					profit: profit || 0,
					profitPercent: profitPercent,
					depositShare: null,
					totalPrice: result.price * result.amount,
					reached: false,
					stopDate: result.stopDate,
					broker: null,
				};

				this._updateDataFromDialog(this.formArrayTargets, value, control);
			}
		});
	}

	async addStop(event: Event, data: any = null, control: number | null = null): Promise<void> {
		event.preventDefault();

		const currentPrice = this.formArrayEntries.value[0].price;
		let minPrice = null;
		let maxPrice = null;
		const minDay = this.formArrayEntries.value[0].date;

		if (this.multiplier === -1) {
			minPrice = currentPrice;
		} else {
			maxPrice = currentPrice;
		}

		if (this.formArrayTargets.value.length !== 0) {
			const index = this.formArrayTargets.value.findIndex((item: StockPositionTarget) => !item.stopDate);
			if (this.multiplier === -1) {
				minPrice = this.formArrayTargets.value[index].price;
			} else {
				maxPrice = this.formArrayTargets.value[index].price;
			}
		}

		this._dialogStopComponent = await import('./add-stop/add-stop.component')
			.then((m) => m.AddStopComponent)
			.then((c) => new PolymorpheusComponent(c, this._injector));

		this._openDialog(this._dialogStopComponent as PolymorpheusComponent<AddStopComponent>, {
			...data,
			minPriceIncrement: this.minPriceIncrement,
			minPrice,
			maxPrice,
			minDay,
		}).subscribe((result: { price: number; stopCandleDate: string | null } | null) => {
			if (result) {
				const entries: StockPositionIdeaEntry = this.formArrayEntries.value[0];
				const targets: StockPositionTarget[] = this.formArrayTargets.value || [];
				let loss = null;
				let lossPercent = null;
				let amount = 0;

				if (entries) {
					amount = entries.quantity - targets.reduce((acc, item) => (acc += item.stopDate ? item.amount : 0), 0);

					lossPercent = getNumberPrecision(((result.price - entries.price) / entries.price) * 100 * this.multiplier, 2);
					loss = getNumberPrecision((result.price - entries.price) * amount, this.priceIncrement);
				}

				const value: StockPositionStop = {
					depositShare: null,
					lossPercent: lossPercent,
					loss: loss,
					price: result.price,
					stopCandleDate: result.stopCandleDate,
					amount: amount,
					amountPercent: 100,
				};
				this._updateDataFromDialog(this.formArrayStop, value, control);
			}
		});
	}

	private _openDialog(c: PolymorpheusComponent<any>, data: any = null): Observable<any> {
		return this._dialogService
			.open(c, {
				appearance: 'dialog-block',
				data,
			})
			.pipe(takeUntilDestroyed(this._destroyRef));
	}

	private _updateDataFromDialog(formArray: FormArray, data: object | null = null, control: number | null = null): void {
		if (control === null) {
			formArray.setControl(formArray.length, new FormControl(data));
		} else {
			formArray.at(control).patchValue(data);
		}
	}

	private _updateFormArray<T>(formArrayName: 'entries' | 'targets' | 'stop', data: T[], onlySelf = false): void {
		const formArray: FormArray = this.controlFormArray.get(formArrayName) as FormArray;
		if (formArray) {
			formArray.clear();

			data.forEach((_: T, index: number) => {
				formArray.setControl(index, new FormControl(), { emitEvent: false });
			});

			formArray.patchValue(data, { onlySelf });
		}
	}

	private _createStream<T>(control: AbstractControl): Observable<T> {
		const stream$: Observable<T> = defer(() => {
			if (control && control.valueChanges) {
				return control.valueChanges;
			}

			return this._ngZone.onStable.asObservable().pipe(
				take(1),
				switchMap((_) => stream$)
			);
		});

		return stream$;
	}

	private _getEntries(list: StockPositionIdeaEntry[]): { status: boolean; list: StockPositionIdeaEntry[] } {
		if (list.length === 1 && list[0].price === 0) {
			const entries = this.formGroup.value.actions.entries.map((item: any) => ({
				check: false,
				date: item.date,
				depositShare: null,
				price: item.price,
				quantity: item.amount,
				totalPrice: item.totalPrice,
				broker: null,
			}));

			this.isEdit$.next(true);

			return {
				status: true,
				list: [
					{
						...this._service.getTotalEntry(entries),
						check: true,
					},
				],
			};
		}

		return {
			status: false,
			list,
		};
	}

	private _onConfirmDialog(content: string): Observable<boolean> {
		return this._dialogDefaultService.open<boolean>(TUI_CONFIRM, {
			appearance: 'dialog-confirm',
			closeable: false,
			size: 'auto',
			data: {
				content,
				yes: 'Да',
				no: 'Нет',
			},
		});
	}
}

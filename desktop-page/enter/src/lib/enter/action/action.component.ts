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
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, TuiHint, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import {
  StockPosition,
  StockPositionActionEntry,
  StockPositionActionTarget,
  StockPositionCommission,
  StockPositionDividend,
  StockPositionTarget,
} from 'types/position';
import { ActionService } from './action.service';
import { HeaderComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { LoaderComponent } from '@ui/components/loader';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  combineLatest,
  debounceTime,
  defer,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  ReplaySubject,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { AddEntryComponent } from './add-entry/add-entry.component';
import { AddTargetComponent } from './add-target/add-target.component';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GetBrokerPipe } from '@ui/pipes/get-broker.pipe';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { getPriceIncrement } from 'utils/get-price-increment';
import { AddDividendComponent } from './add-dividend/add-dividend.component';
import { AddCommissionComponent } from './add-commission/add-commission.component';
import { TuiTooltip } from '@taiga-ui/kit';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { Params } from '@angular/router';
import { StockInstrument } from 'types/stock';

type DialogType = 'entries' | 'outs' | 'dividends' | 'commissions';

@Component({
  selector: 'lib-enter-action',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    DatePipe,
    HeaderComponent,
    TuiButton,
    TuiFormatNumberPipe,
    TuiScrollbar,
    ListComponent,
    ItemDirective,
    LoaderComponent,
    ReactiveFormsModule,
    GetBrokerPipe,
    TuiHint,
    TuiIcon,
    TuiTooltip,
  ],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss',
  providers: [
    ActionService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EnterActionComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterActionComponent implements ControlValueAccessor, AfterViewInit {
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _ideaFacade: IdeaFacade = inject(IdeaFacade);
  private readonly _service: ActionService = inject(ActionService);
  private readonly _injector: Injector = inject(Injector);
  private readonly _dialogService: DialogService = inject(DIALOG);
  private readonly _ngZone: NgZone = inject(NgZone);

  readonly isDisableTrade$: Observable<boolean> = this._ideaFacade.instrument$.pipe(
    switchMap((instrument: StockInstrument | null) => {
      if (instrument && instrument.source === 'binance') {
        return of(true);
      }

      return this.#queryParams.pipe(
        startWith(this.#queryParams.value()),
        map((value: Params) => value['id'] && (value['type'] === 'position' || value['type'] === 'idea')),
        map((value: boolean | null) => !value),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    })
  );

  readonly canAdd$: Observable<boolean> = this._ideaFacade.idea$.pipe(
    filter((idea: StockPosition | null): idea is StockPosition => idea !== null),
    map((idea: StockPosition) => idea.idea.id !== null)
  );

  readonly lastPrice$: Observable<number> = this._ideaFacade.idea$.pipe(
    map((data: StockPosition) => data.idea.lastPrice),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly itemHeight = 28;
  minPriceIncrement = 1e-8;
  priceIncrement = 8;
  value: any = null;
  isDisabled = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  @Input({ required: true }) formGroup!: FormGroup;

  private _dialogTargetComponent: PolymorpheusComponent<AddTargetComponent> | null = null;
  private _dialogEntryComponent: PolymorpheusComponent<AddEntryComponent> | null = null;
  private _dialogDividendComponent: PolymorpheusComponent<AddDividendComponent> | null = null;
  private _dialogCommissionComponent: PolymorpheusComponent<AddCommissionComponent> | null = null;

  private readonly _controlValue$: Subject<any | null> = new ReplaySubject(1);
  private readonly _formGroupValueChanges$: Subject<any> = new ReplaySubject(1);
  readonly formGroupValueChanges$: Observable<any> = this._formGroupValueChanges$
    .asObservable()
    .pipe(shareReplay({ refCount: true, bufferSize: 1 }));

  readonly controlFormArray: FormGroup = new FormGroup({
    entries: new FormArray<FormControl<StockPositionActionEntry>>([]),
    outs: new FormArray<FormControl<StockPositionActionTarget>>([]),
    dividends: new FormArray<FormControl<StockPositionDividend>>([]),
    commissions: new FormArray<FormControl<StockPositionCommission>>([]),
  });

  get formArrayEntries(): FormArray {
    return this.controlFormArray.get('entries') as FormArray;
  }

  get formArrayTargets(): FormArray {
    return this.controlFormArray.get('outs') as FormArray;
  }

  get formArrayDividends(): FormArray {
    return this.controlFormArray.get('dividends') as FormArray;
  }

  get formArrayCommissions(): FormArray {
    return this.controlFormArray.get('commissions') as FormArray;
  }

  entriesList$: Observable<StockPositionActionEntry[]> = this._createStream<StockPositionActionEntry[]>(
    this.formArrayEntries
  ).pipe(startWith(this.formArrayEntries.value), shareReplay({ bufferSize: 1, refCount: true }));
  targetsList$: Observable<StockPositionActionTarget[]> = this._createStream<StockPositionActionTarget[]>(
    this.formArrayTargets
  ).pipe(startWith(this.formArrayTargets.value), shareReplay({ bufferSize: 1, refCount: true }));
  dividendsList$: Observable<StockPositionDividend[]> = this._createStream<StockPositionDividend[]>(
    this.formArrayDividends
  ).pipe(startWith(this.formArrayDividends.value), shareReplay({ bufferSize: 1, refCount: true }));
  commissionList$: Observable<StockPositionCommission[]> = this._createStream<StockPositionCommission[]>(
    this.formArrayCommissions
  ).pipe(startWith(this.formArrayCommissions.value), shareReplay({ bufferSize: 1, refCount: true }));
  position$: Observable<any> = this.formGroupValueChanges$.pipe(
    filter((value: any | null): value is any => value !== null),
    map((value) => value.lastPrice || 0),
    shareReplay({
      bufferSize: 1,
      refCount: true,
    })
  );

  private readonly _mapForm: Partial<{ [key in DialogType]: (...args: any) => Promise<void> }> = {
    entries: this.addEntry,
    outs: this.addTarget,
    dividends: this.addDividend,
    commissions: this.addCommission,
  };

  readonly isCanAddEntry$: Observable<boolean> = this.formGroupValueChanges$.pipe(
    map((value: { sidebar: { positionType: string | null } }) => value.sidebar.positionType !== null),
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  multiplier$: Observable<number> = this.formGroupValueChanges$.pipe(
    map((data: { sidebar: { positionType: string } }) => data.sidebar && data.sidebar.positionType),
    distinctUntilChanged(),
    map((type: string): number => (type === 'short' ? -1 : 1)),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  minPriceIncrement$: Observable<number> = this.formGroupValueChanges$.pipe(
    map((data: { minPriceIncrement: number }) => data.minPriceIncrement),
    filter((value: number | null): value is number => value !== null),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  priceIncrement$: Observable<number> = this.minPriceIncrement$.pipe(map((value: number) => getPriceIncrement(value)));
  totalEntry$: Observable<StockPositionActionEntry> = combineLatest([this.entriesList$, this.priceIncrement$]).pipe(
    debounceTime(100),
    map(([list, priceIncrement]: [StockPositionActionEntry[] | null, number]) =>
      this._service.getTotalEntry(list, priceIncrement)
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  totalOut$: Observable<StockPositionActionTarget> = combineLatest([
    this.totalEntry$,
    this.targetsList$,
    this.multiplier$,
    this.priceIncrement$,
  ]).pipe(
    debounceTime(100),
    map(
      ([total, target, multiplier, priceIncrement]: [
        StockPositionActionEntry,
        StockPositionActionTarget[],
        number,
        number
      ]) => this._service.getTotalOut(target, total, multiplier, priceIncrement)
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  totalDividend$: Observable<StockPositionDividend> = combineLatest([
    this.totalEntry$,
    this.dividendsList$,
    this.priceIncrement$,
  ]).pipe(
    debounceTime(100),
    map(([entry, dividend, priceIncrement]: [StockPositionActionEntry, StockPositionDividend[], number]) =>
      this._service.getTotalDividend(entry, dividend, priceIncrement)
    )
  );
  totalCommission$: Observable<StockPositionCommission> = combineLatest([this.totalEntry$, this.commissionList$]).pipe(
    debounceTime(100),
    map(([entry, commission]: [StockPositionActionEntry, StockPositionCommission[]]) =>
      this._service.getTotalCommission(entry, commission)
    )
  );
  totalRemainder$: Observable<StockPositionTarget> = combineLatest([
    this.totalEntry$,
    this.totalOut$,
    this.position$,
    this.multiplier$,
    this.priceIncrement$,
  ]).pipe(
    debounceTime(100),
    map(
      ([totalEntry, totalOut, lastPrice, multiplier, priceIncrement]: [
        StockPositionActionEntry,
        StockPositionActionTarget,
        number,
        number,
        number
      ]) => this._service.getTotalRemainder(totalEntry, totalOut, lastPrice, multiplier, priceIncrement)
    )
  );
  totalResult$: Observable<StockPositionActionTarget> = combineLatest([
    this.totalEntry$,
    this.totalOut$,
    this.totalRemainder$,
    this.totalDividend$,
    this.totalCommission$,
    this.lastPrice$,
    this.multiplier$,
    this.priceIncrement$,
  ]).pipe(
    debounceTime(100),
    map(
      ([totalEntry, totalOut, totalRemainder, totalDividend, totalCommission, lastPrice, multiplier, priceIncrement]: [
        StockPositionActionEntry,
        StockPositionActionTarget,
        StockPositionTarget,
        StockPositionDividend,
        StockPositionCommission,
        number,
        number,
        number
      ]) =>
        this._service.getTotalResult(
          totalEntry,
          totalOut,
          totalRemainder,
          totalDividend,
          totalCommission,
          lastPrice,
          multiplier,
          priceIncrement
        )
    )
  );
  isDisableDividends$: Observable<boolean> = combineLatest([this.totalEntry$, this.totalDividend$]).pipe(
    debounceTime(0),
    map(([entry, dividend]: [StockPositionActionEntry, StockPositionDividend]) => entry.amount === dividend.amount),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngAfterViewInit(): void {
    const source$: Observable<any> = this._createStream<any>(this.formGroup).pipe(
      startWith(this.formGroup.getRawValue()),
      map(() => this.formGroup.getRawValue()),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    source$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result) => {
      this._formGroupValueChanges$.next(result);
    });

    this._controlValue$
      .asObservable()
      .pipe(debounceTime(100), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result === null) {
          this.controlFormArray.reset({ entries: [], outs: [], dividends: [] });
        } else {
          this._updateFormArray(
            'entries',
            (result.entries || []).map((item: any) => ({ ...item, depositShare: null })),
            true
          );
          this._updateFormArray(
            'outs',
            (result.outs || []).map((item: any) => ({ ...item, depositShare: null })),
            true
          );
          this._updateFormArray(
            'dividends',
            (result.dividends || []).map((item: any) => ({
              ...item,
              depositShare: null,
            })),
            true
          );
          this._updateFormArray('commissions', result.commissions || [], true);
        }

        setTimeout(() => {
          this.formGroup.markAsPristine();
        }, 100);
      });

    this.minPriceIncrement$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result: number) => {
      this.minPriceIncrement = result;
      this.priceIncrement = getPriceIncrement(result);
    });

    this.controlFormArray.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(100))
      .subscribe((value: any) => this.onChange(value));
  }

  writeValue(obj: any): void {
    this._controlValue$.next(obj);
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

  onTrade(event: Event): void {
    event.preventDefault();

    this.#queryParams.update({
      trade: 'visible',
    });
  }

  async addEntry(event: Event, data: any | null = null, index: number | null = null): Promise<void> {
    event.preventDefault();

    if ((this.formGroup.value as any).sidebar.positionType === null) {
      return;
    }

    const value = this.formGroup.getRawValue();
    const entry = {
      price: null,
      quantity: null,
    };

    if (value) {
      const current = this.formGroup.getRawValue().idea.entries[0];

      if (current) {
        entry.price = current.price;
        entry.quantity = current.quantity;
      }
    }

    this._dialogEntryComponent = await import('./add-entry/add-entry.component')
      .then((m) => m.AddEntryComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._openDialog(this._dialogEntryComponent as PolymorpheusComponent<AddEntryComponent>, {
      ...data,
      price: (data && data.price) || entry.price,
      amount: (data && data.amount) || entry.quantity,
      minPriceIncrement: this.minPriceIncrement,
      isNew: index === null,
    }).subscribe((res: any | null) => {
      if (res) {
        this._updateDataFromDialog(this.formArrayEntries, res, index);

        if (res['commission']) {
          this._updateDataFromDialog(this.formArrayCommissions, this._getCommissionData(res));
        }
      }
    });
  }

  async addTarget(event: Event, data: any | null = null, control: number | null = null): Promise<void> {
    event.preventDefault();

    const value = this.formGroup.getRawValue();
    const target = {
      amount: null,
      price: null,
    };

    if (value) {
      const current = value.idea.targets[this.formArrayTargets.value.length];

      if (current) {
        target.price = current.price;
        target.amount = current.amount;
      }
    }

    const brokerId = this.formArrayEntries.value[0] && this.formArrayEntries.value[0].brokerId;

    this._dialogTargetComponent = await import('./add-target/add-target.component')
      .then((m) => m.AddTargetComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._openDialog(this._dialogTargetComponent as PolymorpheusComponent<AddTargetComponent>, {
      ...data,
      amount: (data && data.amount) || target.amount,
      price: (data && data.price) || target.price,
      brokerId: (data && data['brokerId']) || brokerId,
      minPriceIncrement: this.minPriceIncrement,
      isNew: control === null,
    }).subscribe((result: any | null) => {
      if (result) {
        this._updateDataFromDialog(this.formArrayTargets, result, control);

        if (result['commission']) {
          this._updateDataFromDialog(this.formArrayCommissions, this._getCommissionData(result));
        }
      }
    });
  }

  async addDividend(event: Event, data: any | null = null, controlIndex: number | null = null): Promise<void> {
    event.preventDefault();

    if (this._dialogDividendComponent === null) {
      this._dialogDividendComponent = await import('./add-dividend/add-dividend.component')
        .then((m) => m.AddDividendComponent)
        .then((c) => new PolymorpheusComponent(c, this._injector));
    }

    this._openDialog(this._dialogDividendComponent as PolymorpheusComponent<AddDividendComponent>, {
      ...data,
      entry: this.formArrayEntries.value,
      dividend: this.formArrayDividends.value,
      minPriceIncrement: this.minPriceIncrement,
    }).subscribe((result: object | null) => {
      if (result) {
        this._updateDataFromDialog(this.formArrayDividends, result, controlIndex);
      }
    });
  }

  async addCommission(event: Event, data: any | null = null, controlIndex: number | null = null): Promise<void> {
    event.preventDefault();

    const brokerId = this.formArrayEntries.value[0] && this.formArrayEntries.value[0].brokerId;
    const totalEntry = this.formArrayEntries.value.reduce(
      (acc: number, item: StockPositionActionEntry) => (acc += item.price * item.amount),
      0
    );

    if (this._dialogCommissionComponent === null) {
      this._dialogCommissionComponent = await import('./add-commission/add-commission.component')
        .then((m) => m.AddCommissionComponent)
        .then((c) => new PolymorpheusComponent(c, this._injector));
    }

    this._openDialog(this._dialogCommissionComponent as PolymorpheusComponent<AddCommissionComponent>, {
      ...data,
      brokerId,
      totalEntry,
    }).subscribe((result: object | null) => {
      if (result) {
        this._updateDataFromDialog(this.formArrayCommissions, result, controlIndex);
      }
    });
  }

  onRemove(event: Event, index: number, formName: DialogType): void {
    event.preventDefault();

    const formArray = this.controlFormArray.get(formName);

    if (formArray !== null) {
      (formArray as FormArray).removeAt(index);
    }
  }

  onEdit(event: Event, index: number, formName: DialogType): void {
    event.preventDefault();

    const formArray = this.controlFormArray.get(formName);

    if (formArray !== null) {
      this._mapForm[formName]!.bind(this)!(event, (formArray as FormArray).at(index).value, index);
    }
  }

  private _openDialog(c: PolymorpheusComponent<any>, data: any = null): Observable<any> {
    return this._dialogService
      .open(c, {
        appearance: 'dialog-block',
        data,
      })
      .pipe(takeUntilDestroyed(this._destroyRef));
  }

  private _updateDataFromDialog(formArray: FormArray, data: any | null = null, control: number | null = null): void {
    if (control === null) {
      formArray.setControl(formArray.length, new FormControl(data));
    } else {
      formArray.at(control).patchValue(data);
    }
  }

  private _updateFormArray<T>(formArrayName: DialogType, data: T[], onlySelf = false): void {
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

  private _getCommissionData(data: any): Partial<StockPositionCommission> {
    const { commission, date, brokerId } = data;
    const totalEntry = this.formArrayEntries.value.reduce(
      (acc: number, item: StockPositionActionEntry) => (acc += item.price * item.amount),
      0
    );

    return {
      size: commission,
      date,
      profitPct: totalEntry && (commission / totalEntry) * 100,
      brokerId,
      comment: '',
    };
  }
}

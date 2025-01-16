import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, TuiIcon, TuiLoader } from '@taiga-ui/core';
import {
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { StockPositionIdeaEntry, StockPositionStop, StockPositionTarget } from 'types/position';
import { IdeaService } from './idea.service';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { CheckComponent } from '@ui/components/check';
import { ItemLikeCheckboxDirective } from '@ui/components/list/item/item-like-checkbox.directive';
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
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { getPriceIncrement } from 'utils/get-price-increment';
import { getNumberPrecision } from 'utils/get-number-precision';

@Component({
  selector: 'lib-enter-idea',
  standalone: true,
  imports: [
    AsyncPipe,
    ItemComponent,
    ItemDirective,
    HeaderComponent,
    TuiButton,
    DatePipe,
    ReactiveFormsModule,
    NgIf,
    TuiIcon,
    CheckComponent,
    TuiFormatNumberPipe,
    ListComponent,
    TuiLoader,
    ItemLikeCheckboxDirective,
    LoaderComponent,
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
  private readonly _dialogService: DialogService = inject(DIALOG);
  private readonly _service: IdeaService = inject(IdeaService);

  private _dialogTargetComponent: PolymorpheusComponent<AddTargetComponent> | null = null;
  private _dialogEntryComponent: PolymorpheusComponent<AddEntryComponent> | null = null;
  private _dialogStopComponent: PolymorpheusComponent<AddStopComponent> | null = null;

  readonly isEditEntry$: Subject<boolean> = new BehaviorSubject(false);
  readonly isEditTarget$: Subject<boolean> = new BehaviorSubject(false);
  readonly isEditStop$: Subject<boolean> = new BehaviorSubject(false);
  private readonly _setPristine$: Subject<void> = new Subject<void>();

  readonly itemHeight = 28;
  minPriceIncrement = 1e-8;
  priceIncrement = getPriceIncrement(this.minPriceIncrement);
  multiplier = 1;
  isCanEdit = false;
  inPositionQuantityValue = 0;
  isDisabled = false;
  value: any = null;

  onChange = (_: any) => {};
  onTouched = () => {};

  private readonly _mapForm = {
    entries: this.addEntry,
    targets: this.addTarget,
    stop: this.addStop,
  };

  readonly controlPositionType = new FormControl('long');
  readonly controlMinPriceIncrement = new FormControl(1e-8);

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

  multiplier$: Observable<number> = this.controlPositionType.valueChanges.pipe(
    startWith(this.controlPositionType.value),
    filter((value: string | null): value is string => value !== null),
    map((type: string): number => (type === 'short' ? -1 : 1)),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  priceIncrement$: Observable<number> = this.controlMinPriceIncrement.valueChanges.pipe(
    startWith(this.controlMinPriceIncrement.value),
    filter((value: number | null): value is number => value !== null),
    map((value: number) => getPriceIncrement(value)),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  entriesList$: Observable<StockPositionIdeaEntry[]> = this.formArrayEntries.valueChanges.pipe(
    startWith(this.formArrayEntries.value),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  totalEntry$: Observable<StockPositionIdeaEntry> = this.entriesList$.pipe(
    startWith(this.formArrayEntries.value),
    map((list: StockPositionIdeaEntry[] | null) => this._service.getTotalEntry(list))
  );
  targetsList$: Observable<StockPositionTarget[] | null> = this.formArrayTargets.valueChanges.pipe(
    startWith(this.formArrayTargets.value),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  totalTarget$: Observable<StockPositionTarget> = this.totalEntry$.pipe(
    switchMap((total: StockPositionIdeaEntry) =>
      combineLatest([this.multiplier$, this.targetsList$]).pipe(
        map(([multiplier, list]: [number, StockPositionTarget[] | null]) =>
          this._service.getTotalTarget(list, total, multiplier)
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
  stopList$: Observable<StockPositionStop[] | null> = this.formArrayStop.valueChanges.pipe(
    startWith(this.formArrayStop.value),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  totalStop$: Observable<StockPositionStop> = combineLatest([
    this.totalEntry$,
    this.targetsList$,
    this.stopList$,
    this.multiplier$,
  ]).pipe(
    debounceTime(100),
    map(
      ([total, targets, list, multiplier]: [
        StockPositionIdeaEntry,
        StockPositionTarget[] | null,
        StockPositionStop[] | null,
        number
      ]) => this._service.getTotalStop(list, total, targets, multiplier)
    )
  );

  ngAfterViewInit(): void {
    this.controlMinPriceIncrement.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        startWith(this.controlMinPriceIncrement.value),
        filter((value: number | null): value is number => value !== null),
        shareReplay({ bufferSize: 1, refCount: false })
      )
      .subscribe((result: number) => {
        this.minPriceIncrement = result;
        this.priceIncrement = getPriceIncrement(result);
      });

    this.controlFormArray.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(100))
      .subscribe((value) => this.onChange({ ...(this.value || {}), idea: value }));
  }

  writeValue(obj: any): void {
    this.value = obj;

    if (obj === null) {
      this.controlFormArray.reset({ entries: [], targets: [], stop: [] });
    } else {
      this._updateFormArray('entries', obj.idea.entries, true);
      this._updateFormArray('targets', obj.idea.targets, true);
      this._updateFormArray('stop', obj.idea.stop, true);

      this.controlPositionType.patchValue(obj.positionType);
      this.controlMinPriceIncrement.patchValue(obj.minPriceIncrement);
    }
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

  onRemove(event: Event, index: number, formName: string): void {
    event.preventDefault();

    const formArray = this.controlFormArray.get(formName);

    if (formArray !== null) {
      (formArray as FormArray).removeAt(index);
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

    this._dialogTargetComponent = await import('./add-target/add-target.component')
      .then((m) => m.AddTargetComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._openDialog(this._dialogTargetComponent as PolymorpheusComponent<AddTargetComponent>, {
      ...data,
      minPriceIncrement: this.minPriceIncrement,
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
          profitPercent = getNumberPrecision(
            ((result.price - entries.price) / entries.price) * 100 * this.multiplier,
            2
          );
        }

        const value: StockPositionTarget = {
          price: result.price,
          amount: result.amount,
          profit: profit,
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

    this._dialogStopComponent = await import('./add-stop/add-stop.component')
      .then((m) => m.AddStopComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._openDialog(this._dialogStopComponent as PolymorpheusComponent<AddStopComponent>, {
      ...data,
      minPriceIncrement: this.minPriceIncrement,
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
}

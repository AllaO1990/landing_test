import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, TuiLoader, TuiScrollbar } from '@taiga-ui/core';
import {
  StockPosition,
  StockPositionActionEntry,
  StockPositionActionTarget,
  StockPositionDividend,
  StockPositionTarget,
} from 'types/position';
import { ActionService } from './action.service';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { LoaderComponent } from '@ui/components/loader';
import {
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { combineLatest, debounceTime, filter, Observable, shareReplay, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { AddEntryComponent } from './add-entry/add-entry.component';
import { AddTargetComponent } from './add-target/add-target.component';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GetBrokerPipe } from '@ui/pipes/get-broker.pipe';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { getPriceIncrement } from 'utils/get-price-increment';

type ActionItem = {
  amount: number;
  brokerId: number | null;
  date: string;
  price: number;
};

@Component({
  selector: 'lib-enter-action',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    ItemComponent,
    DatePipe,
    HeaderComponent,
    TuiButton,
    TuiFormatNumberPipe,
    TuiScrollbar,
    ListComponent,
    ItemDirective,
    TuiLoader,
    LoaderComponent,
    ReactiveFormsModule,
    GetBrokerPipe,
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
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _ideaFacade: IdeaFacade = inject(IdeaFacade);
  private readonly _service: ActionService = inject(ActionService);
  private readonly _injector: Injector = inject(Injector);
  private readonly _dialogService: DialogService = inject(DIALOG);

  readonly canAdd$: Observable<boolean> = this._ideaFacade.idea$.pipe(
    filter((idea: StockPosition | null): idea is StockPosition => idea !== null),
    map((idea: StockPosition) => idea.idea.id !== null)
  );

  readonly itemHeight = 28;
  minPriceIncrement = 1e-8;
  priceIncrement = 8;
  value: any = null;
  isDisabled = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  private _dialogTargetComponent: PolymorpheusComponent<AddTargetComponent> | null = null;
  private _dialogEntryComponent: PolymorpheusComponent<AddEntryComponent> | null = null;

  readonly controlMinPriceIncrement = new FormControl(1e-8);

  readonly controlFormArray: FormGroup = new FormGroup({
    entries: new FormArray<FormControl<StockPositionActionEntry>>([]),
    outs: new FormArray<FormControl<StockPositionActionTarget>>([]),
    dividends: new FormArray<FormControl<StockPositionTarget>>([]),
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

  entriesList$: Observable<StockPositionActionEntry[]> = this.formArrayEntries.valueChanges.pipe(
    shareReplay({ bufferSize: 1, refCount: false })
  );
  targetsList$: Observable<StockPositionActionTarget[]> = this.formArrayTargets.valueChanges.pipe(
    shareReplay({ bufferSize: 1, refCount: false })
  );
  dividendsList$: Observable<StockPositionTarget[]> = this.formArrayDividends.valueChanges.pipe(
    startWith(this.formArrayDividends.value),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  private readonly _mapForm = {
    entries: this.addEntry,
    outs: this.addTarget,
  };

  // multiplier$: Observable<number> = this.controlPositionType.valueChanges.pipe(
  //   startWith(this.controlPositionType.value),
  //   filter((value: string | null): value is string => value !== null),
  //   map((type: string): number => (type === 'short' ? -1 : 1)),
  //   shareReplay({ bufferSize: 1, refCount: false })
  // );
  priceIncrement$: Observable<number> = this.controlMinPriceIncrement.valueChanges.pipe(
    startWith(this.controlMinPriceIncrement.value),
    filter((value: number | null): value is number => value !== null),
    map((value: number) => getPriceIncrement(value)),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  totalEntry$: Observable<StockPositionActionEntry> = this.entriesList$.pipe(
    map((list: StockPositionActionEntry[] | null) => this._service.getTotalEntry(list)),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  totalOut$: Observable<StockPositionActionTarget> = combineLatest([this.totalEntry$, this.targetsList$]).pipe(
    debounceTime(100),
    map(([total, target]: [StockPositionActionEntry, StockPositionActionTarget[]]) =>
      this._service.getTotalOut(target, total, 1)
    ),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  totalDividend$: Observable<StockPositionDividend> = this.formArrayDividends.valueChanges.pipe(
    startWith(this.formArrayDividends.value),
    map(() => this._service.getTotalDividend())
  );
  totalRemainder$: Observable<StockPositionTarget> = combineLatest([
    this.totalEntry$,
    this.totalOut$,
    this._ideaFacade.idea$,
  ]).pipe(
    debounceTime(100),
    map(([totalEntry, totalOut, idea]: [StockPositionActionEntry, StockPositionActionTarget, StockPosition]) =>
      this._service.getTotalRemainder(totalEntry, totalOut, idea)
    )
  );
  totalResult$: Observable<StockPositionActionTarget> = combineLatest([
    this.totalEntry$,
    this.totalOut$,
    this.totalRemainder$,
    this._ideaFacade.idea$,
  ]).pipe(
    debounceTime(100),
    map(
      ([totalEntry, totalOut, totalRemainder, idea]: [
        StockPositionActionEntry,
        StockPositionActionTarget,
        StockPositionTarget,
        StockPosition
      ]) => this._service.getTotalResult(totalEntry, totalOut, totalRemainder, idea)
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
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map((value: any) => ({
          entries: this._convertData(value.entries),
          outs: this._convertData(value.outs),
        })),
        debounceTime(100)
      )
      .subscribe((value: any) => this.onChange({ ...(this.value || {}), actions: value }));
  }

  writeValue(obj: any): void {
    this.value = obj;

    if (obj === null) {
      this.controlFormArray.reset({ entries: [], outs: [], dividends: [] });
    } else {
      this._updateFormArray(
        'entries',
        (obj.actions.entries || []).map((item: any) => ({ ...item, depositShare: null })),
        true
      );
      this._updateFormArray(
        'outs',
        (obj.actions.outs || []).map((item: any) => ({ ...item, depositShare: null })),
        true
      );

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

  async addEntry(event: Event, data: object | null = null, index: number | null = null): Promise<void> {
    event.preventDefault();

    this._dialogEntryComponent = await import('./add-entry/add-entry.component')
      .then((m) => m.AddEntryComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._openDialog(this._dialogEntryComponent as PolymorpheusComponent<AddEntryComponent>, {
      ...data,
      minPriceIncrement: this.minPriceIncrement,
    }).subscribe((res: object | null) => {
      if (res) {
        this._updateDataFromDialog(this.formArrayEntries, res, index);
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
    }).subscribe((result: object | null) => {
      if (result) {
        this._updateDataFromDialog(this.formArrayTargets, result, control);
      }
    });
  }

  onRemove(event: Event, index: number, formName: 'entries' | 'outs'): void {
    event.preventDefault();

    const formArray = this.controlFormArray.get(formName);

    if (formArray !== null) {
      (formArray as FormArray).removeAt(index);
    }
  }

  onEdit(event: Event, index: number, formName: 'entries' | 'outs'): void {
    event.preventDefault();

    const formArray = this.controlFormArray.get(formName);

    if (formArray !== null) {
      this._mapForm[formName].bind(this)(event, (formArray as FormArray).at(index).value, index);
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

  private _updateDataFromDialog(formArray: FormArray, data: object | null = null, control: number | null = null): void {
    if (control === null) {
      formArray.setControl(formArray.length, new FormControl(data));
    } else {
      formArray.at(control).patchValue(data);
    }
  }

  private _updateFormArray<T>(formArrayName: 'entries' | 'outs', data: T[], onlySelf = false): void {
    const formArray: FormArray = this.controlFormArray.get(formArrayName) as FormArray;

    if (formArray) {
      formArray.clear();
      data.forEach((_: T, index: number) => {
        formArray.setControl(index, new FormControl(), { emitEvent: false });
      });

      formArray.patchValue(data, { onlySelf });
    }
  }

  private _convertData(
    list: {
      amount: number;
      brokerId: number;
      date: string;
      price: number;
    }[]
  ): ActionItem[] {
    return list.map((item) => ({
      amount: item.amount,
      brokerId: item.brokerId,
      date: item.date,
      price: item.price,
    }));
  }
}

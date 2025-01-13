import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Injector,
  Input,
  NgZone,
} from '@angular/core';
import { AsyncPipe, DatePipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StockPosition, StockPositionIdeaEntry, StockPositionStop, StockPositionTarget } from 'types/position';
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
  defer,
  distinctUntilChanged,
  filter,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs/operators';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { getPriceIncrement } from 'utils/get-price-increment';
import { getNumberPrecision } from 'utils/get-number-precision';

type Goal = {
  amount: number;
  goal: number;
};

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
  providers: [IdeaService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterIdeaComponent implements AfterViewInit {
  private readonly _injector: Injector = inject(Injector);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _dialogService: DialogService = inject(DIALOG);
  private readonly _service: IdeaService = inject(IdeaService);
  private readonly _ideaFacade: IdeaFacade = inject(IdeaFacade);
  private readonly _ngZone: NgZone = inject(NgZone);

  private _dialogTargetComponent: PolymorpheusComponent<AddTargetComponent> | null = null;
  private _dialogEntryComponent: PolymorpheusComponent<AddEntryComponent> | null = null;
  private _dialogStopComponent: PolymorpheusComponent<AddStopComponent> | null = null;

  readonly isEditEntry$: Subject<boolean> = new BehaviorSubject(false);
  readonly isEditTarget$: Subject<boolean> = new BehaviorSubject(false);
  readonly isEditStop$: Subject<boolean> = new BehaviorSubject(false);

  readonly itemHeight = 28;
  minPriceIncrement = 0.01;
  priceIncrement = getPriceIncrement(this.minPriceIncrement);
  multiplier = 1;
  isCanEdit = false;
  inPositionQuantityValue = 0;

  private readonly _mapForm = {
    entries: this.addEntry,
    targets: this.addTarget,
    stop: this.addStop,
  };

  @Input() set formGroup(value: FormGroup) {
    this.form = value.get('idea') as FormGroup;
  }

  form!: FormGroup;

  multiplier$: Observable<number> = defer(() => {
    if (this.form) {
      const positionType = this.form.get('positionType');

      if (positionType) {
        return positionType.valueChanges.pipe(
          distinctUntilChanged(),
          startWith(positionType.value),
          map((result: string) => (result === 'short' ? -1 : 1)),
          tap((multiplier: number) => (this.multiplier = multiplier))
        );
      }
    }

    return this._ngZone.onStable.asObservable().pipe(
      take(1),
      switchMap((_) => this.multiplier$)
    );
  });

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
      this.targetsList$.pipe(
        map((list: StockPositionTarget[] | null) => this._service.getTotalTarget(list, total, this.multiplier))
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
  totalStop$: Observable<StockPositionStop> = combineLatest([this.totalEntry$, this.targetsList$, this.stopList$]).pipe(
    debounceTime(100),
    map(([total, targets, list]: [StockPositionIdeaEntry, StockPositionTarget[] | null, StockPositionStop[] | null]) =>
      this._service.getTotalStop(list, total, targets, this.multiplier)
    )
  );

  ngAfterViewInit(): void {
    this._ideaFacade.idea$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        filter((idea: StockPosition | null): idea is StockPosition => idea !== null)
      )
      .subscribe((idea: StockPosition) => {
        this._setValues(idea);
      });

    this.formArrayEntries.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map(([value]: StockPositionIdeaEntry[]) => ({
          amount: value ? value.quantity : null,
          entry: value ? value.price : null,
        }))
      )
      .subscribe((value: { amount: null | number; entry: number | null }) =>
        this.form.patchValue({
          ...value,
        })
      );

    this.formArrayTargets.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map((list: StockPositionTarget[]) =>
          list.map((item: StockPositionTarget) => ({
            amount: item.amount,
            goal: item.price,
          }))
        )
      )
      .subscribe((goals: Goal[]) => {
        const formArray = this.form.get('goals') as FormArray;

        if (formArray) {
          formArray.clear({ emitEvent: false });
          goals.forEach((goal: Goal, index: number) => {
            formArray.setControl(index, new FormControl(), { emitEvent: false });
          });

          this.form.patchValue({
            goals,
          });
        }
      });

    this.formArrayStop.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(([value]: StockPositionStop[]) =>
        this.form.patchValue({
          stop: value ? value.price : null,
        })
      );
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
        this._updateData(this.formArrayEntries, res, control);
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

        this._updateData(this.formArrayTargets, value, control);
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
        this._updateData(this.formArrayStop, value, control);
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

  private _updateData(formArray: FormArray, data: object | null = null, control: number | null = null): void {
    if (control === null) {
      formArray.setControl(formArray.length, new FormControl(data));
    } else {
      formArray.at(control).patchValue(data);
    }
  }

  private _setValues(value: StockPosition): void {
    this.minPriceIncrement = value.idea.instrument.minPriceIncrement;
    this.priceIncrement = getPriceIncrement(this.minPriceIncrement);

    const entries = value.idea.entries[0];

    this.formArrayEntries.clear();
    if (entries) {
      this.formArrayEntries.setControl(
        0,
        new FormControl<StockPositionIdeaEntry>({
          date: entries.date || null,
          depositShare: entries.depositShare || null,
          broker: null,
          price: entries.price,
          quantity: entries.quantity,
          totalPrice: entries.totalPrice,
        })
      );
    }

    const targets = value.idea.targets;

    this.formArrayTargets.clear();
    if (targets.length) {
      targets.forEach((item: StockPositionTarget, index: number) => {
        this.formArrayTargets.setControl(
          index,
          new FormControl({
            price: item.price,
            amount: item.amount,
            profit: item.profit || null,
            profitPercent: item.profitPercent || null,
            depositShare: item.depositShare || null,
            totalPrice: item.price * item.amount,
            reached: false,
            stopDate: item.stopDate || null,
            broker: null,
          })
        );
      });
    }

    const stop = value.idea.stop;
    this.formArrayStop.clear();
    if (stop) {
      this.formArrayStop.setControl(
        0,
        new FormControl<StockPositionStop>({
          depositShare: stop.depositShare || null,
          lossPercent: stop.lossPercent || null,
          loss: stop.loss || null,
          price: stop.price,
          stopCandleDate: stop.stopCandleDate || null,
          amount: stop.amount || null,
          amountPercent: stop.amountPercent || null,
        })
      );
    }
  }
}

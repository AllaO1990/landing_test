import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  Output,
} from '@angular/core';
import { AsyncPipe, DatePipe, JsonPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Position, StockPositionEntry, StockPositionStop, StockPositionTarget } from 'types/position';
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
  filter,
  Observable,
  shareReplay,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs/operators';
import { EventIdeaSelected } from './idea.types';

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
    JsonPipe,
  ],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss',
  providers: [IdeaService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterIdeaComponent {
  private readonly _injector: Injector = inject(Injector);
  private readonly _destroyed: DestroyRef = inject(DestroyRef);
  private readonly _dialogService: DialogService = inject(DIALOG);
  private readonly _service: IdeaService = inject(IdeaService);
  private readonly _defaultSelectedValue: EventIdeaSelected = {
    amount: 0,
    entry: 0,
    goals: [],
    stop: 0,
  };

  private _dialogTargetComponent: PolymorpheusComponent<AddTargetComponent> | null = null;
  private _dialogEntryComponent: PolymorpheusComponent<AddEntryComponent> | null = null;
  private _dialogStopComponent: PolymorpheusComponent<AddStopComponent> | null = null;

  readonly isEditEntry$: Subject<boolean> = new BehaviorSubject(false);
  readonly isEditTarget$: Subject<boolean> = new BehaviorSubject(false);
  readonly isEditStop$: Subject<boolean> = new BehaviorSubject(false);

  readonly itemHeight = 28;
  priceIncrement = 2;
  multiplier = 1;
  isCanEdit = false;
  inPositionQuantityValue = 0;
  // entryAveragePrice = 0;
  private readonly _mapForm = {
    entries: this.addEntry,
    targets: this.addTarget,
    stop: this.addStop,
  };

  readonly form: FormGroup = new FormGroup({
    entries: new FormArray<FormControl<StockPositionEntry>>([]),
    targets: new FormArray<FormControl<StockPositionTarget>>([]),
    stop: new FormArray<FormControl<StockPositionStop>>([]),
  });

  get formArrayEntries(): FormArray {
    return this.form.get('entries') as FormArray;
  }

  get formArrayTargets(): FormArray {
    return this.form.get('targets') as FormArray;
  }

  get formArrayStop(): FormArray {
    return this.form.get('stop') as FormArray;
  }

  entriesList$: Observable<StockPositionEntry[]> = this.formArrayEntries.valueChanges.pipe(
    startWith(this.formArrayEntries.value),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  average$: Observable<{ price: number; quantity: number }> = this.entriesList$.pipe(
    filter((list: StockPositionEntry[]) => list.length > 0),
    map((list: StockPositionEntry[]) => this._getSum(list)),
    map(({ sumPrice, sumQuantity }: { sumPrice: number; sumQuantity: number }) => ({
      price: sumPrice / sumQuantity,
      quantity: sumQuantity,
    })),
    tap((data) => console.log(data)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  targetsList$: Observable<StockPositionTarget[] | null> = this.isEditTarget$.asObservable().pipe(
    switchMap((status: boolean) => {
      if (status) {
        return this.formArrayTargets.valueChanges.pipe(
          startWith(this.formArrayTargets.value)
          // map((res: { price: number; quantity: number; date: string | null }[]) =>
          //   this._service.updateListTarget(average, res)
          // )
        );

        // return this.average$.pipe(
        //   switchMap((average: { price: number; quantity: number }) =>
        //     this.formArrayTargets.valueChanges.pipe(
        //       startWith(this.formArrayTargets.value),
        //       map((res: { price: number; quantity: number; date: string | null }[]) =>
        //         this._service.updateListTarget(average, res)
        //       )
        //     )
        //   )
        // );
      }

      return this.formArrayTargets.valueChanges;
    }),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  stopList$: Observable<StockPositionStop[] | null> = this.isEditStop$.asObservable().pipe(
    switchMap((status: boolean) => {
      if (status) {
        return this.formArrayStop.valueChanges.pipe(
          startWith(this.formArrayStop.value)
          // map((res: { price: number; date: string | null }[]) => this._service.updateListStop(average, res))
        );
        // return this.average$.pipe(
        //   tap((data) => console.log(data)),
        //   switchMap((average: { price: number; quantity: number }) =>
        //     this.formArrayStop.valueChanges.pipe(
        //       startWith(this.formArrayStop.value),
        //       map((res: { price: number; date: string | null }[]) => this._service.updateListStop(average, res))
        //     )
        //   )
        // );
      }

      return this.formArrayStop.valueChanges;
    }),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  @Input()
  set data(value: { type: string; data: Position } | null) {
    if (value && value.data) {
      console.log('idea', value);

      this.isCanEdit = value.type !== 'position';

      this.isEditEntry$.next(this.isCanEdit);
      this.isEditTarget$.next(this.isCanEdit);
      this.isEditStop$.next(this.isCanEdit);

      this.multiplier = value.data.multiplier;
      this.inPositionQuantityValue = value.data.inPositionQuantityValue;

      this.formArrayEntries.clear();
      this.formArrayTargets.clear();
      this.formArrayStop.clear();

      Promise.resolve().then(() => {
        value.data.entries.forEach((item: StockPositionEntry, index: number) => {
          this.formArrayEntries.setControl(index, new FormControl(item));
        });

        value.data.targets.forEach((item: StockPositionTarget, index: number) => {
          this.formArrayTargets.setControl(index, new FormControl(item));
        });

        if (value.data.stop) {
          this.formArrayStop.setControl(0, new FormControl(value.data.stop));
        }
      });

      // this.priceIncrement = value.priceIncrement;
      // this.inPositionQuantityValue = value.inPositionQuantityValue;
      // this.entryAveragePrice = value.entryAveragePrice;
      //
      // this.listEntry = this._service.getIdeaEntries(value);
      // this.listTarget = this._service.getIdeaTargets(value);
      // this.listStop = this._service.getIdeaStops(value);
      //
      // // this.totalTarget = this._service.getTotalTarget(this.listTarget, value.inPositionPrice);
      // console.log(value, this.totalTarget);
      //
      // this.formEntry = new FormGroup(this._service.getControlFromList(this.listEntry));
      // this.formTarget = new FormGroup(this._service.getControlFromList(this.listTarget));
      // // this.formStop = new FormGroup(this._service.getControlFromList(this.listStop));
    }
  }

  @Output()
  selected: EventEmitter<EventIdeaSelected> = new EventEmitter<EventIdeaSelected>();

  totalEntry$: Observable<StockPositionEntry> = this.entriesList$.pipe(
    startWith(this.formArrayEntries.value),
    map((list: StockPositionEntry[] | null) => this._service.getTotalEntry(list))
  );
  totalTarget$: Observable<StockPositionTarget> = this.totalEntry$.pipe(
    switchMap((total: StockPositionEntry) =>
      this.targetsList$.pipe(
        startWith(this.formArrayTargets.value),
        map((list: StockPositionTarget[] | null) => this._service.getTotalTarget(list, total, this.multiplier))
      )
    )
  );
  totalStop$: Observable<StockPositionStop> = combineLatest([this.totalEntry$, this.targetsList$, this.stopList$]).pipe(
    debounceTime(100),
    map(([total, targets, list]: [StockPositionEntry, StockPositionTarget[] | null, StockPositionStop[] | null]) =>
      this._service.getTotalStop(list, total, targets, this.multiplier)
    )
  );

  onRemove(event: Event, index: number, formName: string): void {
    event.preventDefault();

    const formArray = this.form.get(formName);

    if (formArray !== null) {
      (formArray as FormArray).removeAt(index);
    }
  }

  onEdit(event: Event, index: number, formName: 'stop' | 'entries' | 'targets'): void {
    event.preventDefault();

    const formArray = this.form.get(formName);

    if (formArray !== null) {
      this._mapForm[formName].bind(this)(event, (formArray as FormArray).at(index).value, index);
    }
  }

  async addEntry(event: Event, data: object | null = null, control: number | null = null): Promise<void> {
    event.preventDefault();

    this._dialogEntryComponent = await import('./add-entry/add-entry.component')
      .then((m) => m.AddEntryComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._openDialog(this._dialogEntryComponent as PolymorpheusComponent<AddEntryComponent>, data).subscribe(
      (res: object | null) => {
        if (res) {
          this._updateData(this.formArrayEntries, res, control);
        }
      }
    );
  }

  async addTarget(event: Event, data: object | null = null, control: number | null = null): Promise<void> {
    event.preventDefault();

    this._dialogTargetComponent = await import('./add-target/add-target.component')
      .then((m) => m.AddTargetComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._openDialog(this._dialogTargetComponent as PolymorpheusComponent<AddTargetComponent>, data).subscribe(
      (result: object | null) => {
        if (result) {
          this._updateData(this.formArrayTargets, result, control);
        }
      }
    );
  }

  async addStop(event: Event, data: any = null): Promise<void> {
    event.preventDefault();

    this._dialogStopComponent = await import('./add-stop/add-stop.component')
      .then((m) => m.AddStopComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._openDialog(this._dialogStopComponent as PolymorpheusComponent<AddStopComponent>, data).subscribe(
      (result: object | null) => {
        if (result) {
          this._updateData(this.formArrayStop, result, 0);
        }
      }
    );
  }

  private _openDialog(c: PolymorpheusComponent<any>, data: any = null): Observable<any> {
    return this._dialogService
      .open(c, {
        appearance: 'dialog-block',
        data,
      })
      .pipe(takeUntilDestroyed(this._destroyed));
  }

  private _updateData(formArray: FormArray, data: object | null = null, control: number | null = null): void {
    if (control === null) {
      formArray.setControl(formArray.length, new FormControl(data));
    } else {
      formArray.at(control).patchValue(data);
    }
  }

  private _getSum(list: StockPositionEntry[]) {
    return list.reduce(
      (acc, item: StockPositionEntry) => {
        return {
          sumPrice: acc.sumPrice + item.price * item.quantity,
          sumQuantity: acc.sumQuantity + item.quantity,
        };
      },
      {
        sumPrice: 0,
        sumQuantity: 0,
      }
    );
  }
}

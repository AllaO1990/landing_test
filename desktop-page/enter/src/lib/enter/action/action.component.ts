import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, Input } from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { TuiButton, TuiFormatNumberPipe, TuiLoader, TuiScrollbar } from '@taiga-ui/core';
import { StockPosition, StockPositionDividend, StockPositionIdeaEntry, StockPositionTarget } from 'types/position';
import { ActionService } from './action.service';
import {
  ActionEntry,
  ActionOut,
  ActionRemainder,
  ActionResult,
  ActionTotalEntry,
  ActionTotalOut,
} from './action.types';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '@ui/components/list';
import { LoaderComponent } from '@ui/components/loader';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, filter, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { AddEntryComponent } from './add-entry/add-entry.component';
import { AddTargetComponent } from './add-target/add-target.component';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GetBrokerPipe } from '@ui/pipes/get-broker.pipe';
import { IdeaFacade } from 'stores/facades/idea.facade';

type ActionItem = {
  amount: number;
  brokerId: number;
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
  providers: [ActionService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterActionComponent implements AfterViewInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _ideaFacade: IdeaFacade = inject(IdeaFacade);
  private readonly _service: ActionService = inject(ActionService);
  private readonly _injector: Injector = inject(Injector);
  private readonly _dialogService: DialogService = inject(DIALOG);

  // private _data: { type: string; data: Position | null } | null = null;

  readonly isEditEntry$: Subject<boolean> = new BehaviorSubject(false);

  readonly itemHeight = 28;
  priceIncrement = 0;
  multiplier = 1;

  private _dialogTargetComponent: PolymorpheusComponent<AddTargetComponent> | null = null;
  private _dialogEntryComponent: PolymorpheusComponent<AddEntryComponent> | null = null;

  form!: FormGroup;

  @Input() set formGroup(value: FormGroup) {
    console.log(value);
    this.form = value.get('actions') as FormGroup;
  }

  readonly controlFormArray: FormGroup = new FormGroup({
    entries: new FormArray<FormControl<StockPositionIdeaEntry>>([]),
    outs: new FormArray<FormControl<StockPositionTarget>>([]),
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

  entriesList$: Observable<StockPositionIdeaEntry[]> = this.formArrayEntries.valueChanges.pipe(
    startWith(this.formArrayEntries.value),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  targetsList$: Observable<StockPositionIdeaEntry[]> = this.formArrayTargets.valueChanges.pipe(
    startWith(this.formArrayTargets.value),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  dividendsList$: Observable<StockPositionIdeaEntry[]> = this.formArrayDividends.valueChanges.pipe(
    startWith(this.formArrayDividends.value),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  // @Input()
  // set data(value: { type: string; data: Position | null } | null) {
  //   if (value && value.data) {
  //     this._data = value;
  //
  //     this.multiplier = value.data.multiplier;
  //
  //     this.isEditEntry$.next(value.type !== 'position');
  //
  //     this.formArrayEntries.clear();
  //     this.formArrayTargets.clear();
  //     this.formArrayDividends.clear();
  //
  //     Promise.resolve().then(() => {
  //       (value.data as Position).entries
  //         .filter((item: StockPositionIdeaEntry) => item.date)
  //         .forEach((item: StockPositionIdeaEntry, index: number) => {
  //           this.formArrayEntries.setControl(index, new FormControl(item));
  //         });
  //
  //       (value.data as Position).targets
  //         .filter((item: StockPositionTarget) => item.stopDate)
  //         .forEach((item: StockPositionTarget, index: number) => {
  //           this.formArrayTargets.setControl(index, new FormControl(item));
  //         });
  //
  //       (value.data as Position).dividends.forEach((item: StockPositionDividend, index: number) => {
  //         this.formArrayDividends.setControl(index, new FormControl(item));
  //       });
  //     });
  //
  //     this.priceIncrement = value.data.priceIncrement;
  //
  //     this.listEntry = this._service.getActionEntry(value.data);
  //     this.totalEntry = this._service.getActionTotalEntry(this.listEntry);
  //
  //     this.listOut = this._service.getActionOut(value.data);
  //     this.totalOut = this._service.getActionTotalOut(
  //       this.listOut,
  //       value.data.entryAveragePrice,
  //       value.data.multiplier
  //     );
  //
  //     this.remainder = this._service.getRemainder(value.data);
  //     this.result = this._service.getResult(this.totalOut, this.remainder, value.data);
  //   }
  // }

  listEntry: ActionEntry[] | null = null;
  totalEntry: ActionTotalEntry | null = null;
  listOut: ActionOut[] | null = null;
  totalOut: ActionTotalOut | null = null;
  remainder: ActionRemainder | null = null;
  result: ActionResult | null = null;

  private readonly _mapForm = {
    entries: this.addEntry,
    targets: this.addTarget,
  };

  totalEntry$: Observable<StockPositionIdeaEntry> = this.formArrayEntries.valueChanges.pipe(
    startWith(this.formArrayEntries.value),
    map((list: StockPositionIdeaEntry[] | null) => this._service.getTotalEntry(list))
  );
  totalOut$: Observable<StockPositionTarget> = this.totalEntry$.pipe(
    switchMap((totalEntry: StockPositionIdeaEntry) =>
      this.formArrayTargets.valueChanges.pipe(
        startWith(this.formArrayTargets.value),
        map((list: StockPositionTarget[] | null) => this._service.getTotalOut(list, totalEntry, this.multiplier))
      )
    )
  );
  totalDividend$: Observable<StockPositionDividend> = of(null).pipe(map(() => this._service.getTotalDividend()));
  totalRemainder$: Observable<StockPositionTarget> = of(null).pipe(map(() => this._service.getTotalRemainder()));
  totalResult$: Observable<StockPositionTarget> = of(null).pipe(map(() => this._service.getTotalResult()));

  ngAfterViewInit(): void {
    this._ideaFacade.idea$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        filter((idea: StockPosition | null): idea is StockPosition => idea !== null)
      )
      .subscribe((idea: StockPosition) => this._setValues(idea));

    this.formArrayEntries.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map((list: StockPositionIdeaEntry[]) =>
          list.map(
            (item: StockPositionIdeaEntry): ActionItem => ({
              amount: item.quantity,
              brokerId: item.broker as number,
              date: item.date as string,
              price: item.price,
            })
          )
        )
      )
      .subscribe((result: ActionItem[]) => this._updateFormArray('entries', result));

    this.formArrayTargets.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map((list: StockPositionTarget[]) =>
          list.map((item: StockPositionTarget) => ({
            amount: item.amount,
            brokerId: item.broker as number,
            date: item.stopDate as string,
            price: item.price,
          }))
        )
      )
      .subscribe((result: ActionItem[]) => this._updateFormArray('outs', result));
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

  // addCommonTarget(event: Event): void {
  //   if (this._data && this._data.data) {
  //     const find = this._data.data.targets.find((item: StockPositionTarget) => !item.stopDate) || null;
  //
  //     this.addTarget(event, find);
  //   }
  // }

  onRemove(event: Event, index: number, formName: string): void {
    event.preventDefault();

    const formArray = this.controlFormArray.get(formName);

    if (formArray !== null) {
      (formArray as FormArray).removeAt(index);
    }
  }

  onEdit(event: Event, index: number, formName: 'entries' | 'targets'): void {
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

  private _updateData(formArray: FormArray, data: object | null = null, control: number | null = null): void {
    if (control === null) {
      formArray.setControl(formArray.length, new FormControl(data));
    } else {
      formArray.at(control).patchValue(data);
    }
  }

  private _updateFormArray<T>(formArrayName: string, data: T[]): void {
    const formArray = this.form.get(formArrayName) as FormArray;

    if (formArray) {
      formArray.clear({ emitEvent: false });
      data.forEach((item: T, index: number) => {
        formArray.setControl(index, new FormControl(), { emitEvent: false });
      });

      this.form.patchValue({ [formArrayName]: data });
    }
  }

  private _setValues(data: StockPosition): void {
    console.log(data);
  }
}

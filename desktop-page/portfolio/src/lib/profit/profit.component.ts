import { TuiInputDateRangeModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { TuiAxes, TuiBarChart } from '@taiga-ui/addon-charts';
import { TuiContext, TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { tuiFormatNumber, TuiFormatNumberPipe, TuiHint } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LoaderComponent } from '@ui/components/loader';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { PROFIT_LIST_CONSTANTS } from './profit.constants';
import { ProfitInfoEnum, ProfitInputData } from './profit.types';
import { filter, Observable, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type ListItem = { name: string; value: TuiDayRange };

@Component({
  selector: 'portfolio-profit',
  standalone: true,
  imports: [
    TuiAxes,
    TuiBarChart,
    TuiHint,
    TuiInputDateRangeModule,
    ReactiveFormsModule,
    TuiTextfieldControllerModule,
    LoaderComponent,
    NgForOf,
    TuiFormatNumberPipe,
    NgIf,
    AsyncPipe,
  ],
  templateUrl: './profit.component.html',
  styleUrl: './profit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfitComponent implements OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  readonly today: Date = new Date();
  readonly list = [
    ProfitInfoEnum.TRANSACTIONS_COUNT,
    ProfitInfoEnum.PROFITABLE,
    ProfitInfoEnum.UNPROFITABLE,
    ProfitInfoEnum.TURNOVER,
    ProfitInfoEnum.DEPOSITED,
    ProfitInfoEnum.WITHDRAWN,
    ProfitInfoEnum.COMMISSIONS,
  ];
  readonly constants = PROFIT_LIST_CONSTANTS;
  readonly value = [[3660, 8281, 1069, 9034, 5797, 6918, 8495, 3234, 6204, 1392, 2088, 8637, 8779]];

  readonly labelsX = ['Jan 2019', 'Feb', 'Mar'];
  readonly labelsY = ['0', '10 000'];

  readonly form: FormGroup = new FormGroup({
    range: new FormControl(new TuiDayRange(new TuiDay(2018, 2, 10), new TuiDay(2018, 3, 20)), { nonNullable: true }),
    list: new FormControl(null),
  });

  get controlRange(): FormControl {
    return this.form.get('range') as FormControl;
  }

  get controlList(): FormControl {
    return this.form.get('list') as FormControl;
  }

  readonly list$: Observable<ListItem[]> = of([
    { name: 'С начала года', value: new TuiDayRange(new TuiDay(2018, 2, 10), new TuiDay(2018, 3, 20)) },
    { name: '365', value: new TuiDayRange(new TuiDay(2018, 2, 10), new TuiDay(2018, 3, 20)) },
    { name: '90', value: new TuiDayRange(new TuiDay(2018, 2, 10), new TuiDay(2018, 3, 20)) },
    { name: '30', value: new TuiDayRange(new TuiDay(2018, 2, 10), new TuiDay(2018, 3, 20)) },
    { name: '7', value: new TuiDayRange(new TuiDay(2018, 2, 10), new TuiDay(2018, 3, 20)) },
  ]);

  readonly hint = ({ $implicit }: TuiContext<number>): string =>
    this.value.reduce((result, set) => `${result} ${tuiFormatNumber(set[$implicit])}\n`, '').trim();

  @Input() data: ProfitInputData | null = null;

  trackByIndex(index: number): number {
    return index;
  }

  ngOnInit(): void {
    this.controlRange.valueChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        filter(() => this.controlList.value !== null)
      )
      .subscribe(() => this.controlList.patchValue(null));
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { TuiDataListWrapperModule, TuiSelectModule } from '@taiga-ui/kit';
import { TuiStringHandler } from '@taiga-ui/cdk';
import { TuiTextfieldControllerModule } from '@taiga-ui/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of, switchMap, tap, timer } from 'rxjs';

interface SelectListItem {
  name: string;
  value: string;
}

type SelectList = SelectListItem[];

const PORTFOLIO_LIST = [
  { name: 'Все', value: 'all' },
  { name: 'Ребёнок 1', value: 'child' },
  { name: 'Игральный', value: 'scalping' },
];

const BROKER_LIST = [
  { name: 'Все', value: 'all' },
  { name: 'Тинькофф', value: 'tinkoff' },
  { name: 'Альфа', value: 'alfa' },
  { name: 'ВТБ', value: 'vtb' },
];

const CURRENCY_LIST = [
  { name: '₽', value: 'RUB' },
  { name: '$', value: 'USD' },
  { name: '€', value: 'EUR' },
  { name: '£', value: 'CHF' },
  { name: '¥', value: 'JPY' },
];

@Component({
  selector: 'portfolio-filter',
  standalone: true,
  imports: [
    NgFor,
    ReactiveFormsModule,
    AsyncPipe,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiDataListWrapperModule,
    NgIf,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent {
  readonly formGroup: FormGroup = new FormGroup({
    portfolio: new FormControl({ value: null, disabled: false }, Validators.required),
    broker: new FormControl({ value: null, disabled: false }, Validators.required),
    currency: new FormControl({ value: null, disabled: false }, Validators.required),
  });

  get controlPortfolio() {
    return this.formGroup.get('portfolio') as FormControl;
  }

  get controlBroker() {
    return this.formGroup.get('broker') as FormControl;
  }

  get controlCurrency() {
    return this.formGroup.get('currency') as FormControl;
  }

  readonly portfolio$: Observable<SelectList> = timer(0).pipe(
    switchMap((_) => of(PORTFOLIO_LIST)),
    tap((list) => {
      this.controlPortfolio.enable({ emitEvent: false });
      this.controlPortfolio.patchValue(list[0]);
    })
  );

  readonly broker$: Observable<SelectList> = timer(1300).pipe(
    switchMap((_) => of(BROKER_LIST)),
    tap((list) => {
      this.controlBroker.enable({ emitEvent: false });
      this.controlBroker.patchValue(list[0]);
    })
  );

  readonly currency$: Observable<SelectList> = timer(900).pipe(
    switchMap((_) => of(CURRENCY_LIST)),
    tap((list) => {
      this.controlCurrency.enable({ emitEvent: false });
      this.controlCurrency.patchValue(list[0]);
    })
  );

  readonly stringify: TuiStringHandler<SelectListItem> = (item: SelectListItem) => item.name;
}

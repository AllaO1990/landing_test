import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiContext, TuiPopover, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiButton, TuiDataListComponent, TuiDataListDirective, TuiTextfield } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { Observable, of } from 'rxjs';
import { TuiInputNumber } from '@taiga-ui/kit';

@Component({
  selector: 'trade-request',
  standalone: true,
  imports: [
    TuiButton,
    NgForOf,
    ReactiveFormsModule,
    TuiDataListComponent,
    TuiDataListDirective,
    TuiInputDateModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    AsyncPipe,
    NgIf,
    TuiInputNumber,
    TuiTextfield,
  ],
  templateUrl: './request.component.html',
  styleUrls: ['../common/dialog.scss', './request.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestTradeComponent implements AfterViewInit {
  readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly size = 's';
  readonly formGroup: FormGroup = new FormGroup({
    action: new FormControl(null, Validators.required),
    type: new FormControl(null, Validators.required),
    price: new FormControl(null, Validators.required),
    amount: new FormControl(null, Validators.required),
  });

  types$: Observable<{ name: string; id: string }[]> = of([
    { name: 'Лимитная цена', id: '1' },
    { name: 'Лучшая цена', id: '2' },
    { name: 'Рыночная', id: '3' },
    { name: 'Тейк-профит', id: '4' },
    { name: 'Стоп-лосс', id: '5' },
  ]);

  actions$: Observable<{ name: string; id: string }[]> = of([
    { name: 'Купить', id: '1' },
    { name: 'Продать', id: '2' },
  ]);

  onCancel(event: Event): void {
    event.preventDefault();

    if (this.#context) {
      this.#context.completeWith(null);
    }
  }

  onSave(event: Event): void {
    event.preventDefault();

    if (this.#context) {
      this.#context.completeWith(this.formGroup.value);
    }
  }

  ngAfterViewInit(): void {
    if (this.#context) {
      const { type, action, amount, price } = this.#context;

      this.formGroup.patchValue({
        action: action && action.id,
        amount,
        type: type && type.id,
        price,
      });
    }
  }

  @tuiPure
  protected stringifyActions(items: readonly { name: string; id: string }[]): TuiStringHandler<TuiContext<string>> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [string, string]));

    return ({ $implicit }: TuiContext<string>) => map.get($implicit) || '';
  }

  @tuiPure
  protected stringifyTypes(items: readonly { name: string; id: string }[]): TuiStringHandler<TuiContext<string>> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [string, string]));

    return ({ $implicit }: TuiContext<string>) => map.get($implicit) || '';
  }
}

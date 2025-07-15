import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiContext, TuiPopover, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiButton, TuiDataListComponent, TuiDataListDirective, TuiTextfield } from '@taiga-ui/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { Observable, of } from 'rxjs';
import { TuiInputNumber } from '@taiga-ui/kit';
import { TradeStore } from '../common/store';
import { TradeOrderTypes } from '../common/api.types';

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
  readonly #store: TradeStore = inject(TradeStore);
  readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly size = 's';
  readonly formGroup: FormGroup = new FormGroup({
    direction: new FormControl(null, Validators.required),
    orderType: new FormControl(null, Validators.required),
    price: new FormControl(null, Validators.required),
    quantity: new FormControl(null, Validators.required),
  });

  types$: Observable<TradeOrderTypes | null> = this.#store.orderTypes$;

  actions$: Observable<{ name: string; id: boolean }[]> = of([
    { name: 'Купить', id: true },
    { name: 'Продать', id: false },
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
      const { orderType, direction, quantity, price } = this.#context;

      this.formGroup.patchValue({
        direction: direction !== undefined && direction,
        quantity,
        orderType: orderType && orderType.id,
        price,
      });
    }
  }

  @tuiPure
  protected stringifyActions(items: readonly { name: string; id: boolean }[]): TuiStringHandler<TuiContext<boolean>> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [boolean, string]));

    return ({ $implicit }: TuiContext<boolean>) => map.get($implicit) || '';
  }

  @tuiPure
  protected stringifyTypes(items: TradeOrderTypes): TuiStringHandler<TuiContext<number>> {
    const map = new Map(items.map(({ name, id }) => [id, name] as [number, string]));

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }
}

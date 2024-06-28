import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe, JsonPipe, NgIf } from '@angular/common';
import { TuiButtonModule, TuiSvgModule } from '@taiga-ui/core';
import {
  HeaderComponent,
  ItemComponent,
  ItemDirective,
  ListComponent,
} from '../list';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StockId } from 'types/stock';

@Component({
  selector: 'lib-enter-idea',
  standalone: true,
  imports: [
    ListComponent,
    JsonPipe,
    ItemComponent,
    ItemDirective,
    HeaderComponent,
    TuiButtonModule,
    DatePipe,
    ReactiveFormsModule,
    NgIf,
    TuiSvgModule,
  ],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterIdeaComponent {
  @Input() data: any | null = null;

  listEntry = [
    {
      id: '4',
      checked: true,
      date: '2024-06-27T10:00:00.000',
      price: 17.8265,
      quantity: 9,
      totalPrice: 160.439,
      depositShare: 0.016,
    },
    {
      id: '5',
      checked: false,
      date: '2024-06-27T10:00:00.000',
      price: 17.8265,
      quantity: 9,
      totalPrice: 160.439,
      depositShare: 0.016,
    },
  ];

  formEntry = new FormGroup(this._getControlFromList(this.listEntry));

  listTarget = [
    {
      id: '4',
      checked: true,
      date: '2024-06-27T10:00:00.000',
      price: 2.13698,
      profit: 8,
      profitPercent: 0.05,
      depositShare: 0.0002,
      quantity: 9,
      quantityPercent: 0.2,
    },
    {
      id: '5',
      checked: false,
      date: '2024-06-27T10:00:00.000',
      price: 2.13698,
      profit: 8,
      profitPercent: 0.05,
      depositShare: 0.0002,
      quantity: 9,
      quantityPercent: 0.2,
    },
    {
      id: '6',
      checked: false,
      date: '2024-06-27T10:00:00.000',
      price: 2.13698,
      profit: 8,
      profitPercent: 0.05,
      depositShare: 0.0002,
      quantity: 9,
      quantityPercent: 0.2,
    },
    {
      id: '7',
      checked: false,
      date: '2024-06-27T10:00:00.000',
      price: 2.13698,
      profit: 8,
      profitPercent: 0.05,
      depositShare: 0.0002,
      quantity: 9,
      quantityPercent: 0.2,
    },
  ];

  formTarget = new FormGroup(this._getControlFromList(this.listTarget));

  listStop = [
    {
      id: '4',
      checked: true,
      date: '2024-06-27T10:00:00.000',
      price: 2.13698,
      loss: 8,
      lossPercent: -0.02,
      depositShare: 0.0002,
      quantity: 9,
      quantityPercent: 0.2,
    },
    {
      id: '5',
      checked: true,
      date: '2024-06-27T10:00:00.000',
      price: 2.13698,
      loss: 8,
      lossPercent: -0.02,
      depositShare: 0.0002,
      quantity: 9,
      quantityPercent: 0.2,
    },
    {
      id: '6',
      checked: false,
      date: '2024-06-27T10:00:00.000',
      price: 2.13698,
      loss: 8,
      lossPercent: -0.02,
      depositShare: 0.0002,
      quantity: 9,
      quantityPercent: 0.2,
    },
    {
      id: '7',
      checked: false,
      date: '2024-06-27T10:00:00.000',
      price: 2.13698,
      loss: 8,
      lossPercent: -0.02,
      depositShare: 0.0002,
      quantity: 9,
      quantityPercent: 0.2,
    },
  ];

  formStop = new FormGroup(this._getControlFromList(this.listStop));

  onRemove(event: Event, data: { id: StockId }): void {
    event.preventDefault();

    this.listTarget = this.listTarget.filter(
      (item: { id: StockId }) => item.id !== data.id
    );
  }

  private _getControlFromList(list: { id: StockId; checked: boolean }[]): {
    [key: string]: FormControl<boolean>;
  } {
    return list.reduce(
      (
        acc: { [key: string]: FormControl<boolean> },
        item: { id: StockId; checked: boolean }
      ) => {
        acc[item.id] = new FormControl<boolean>(item.checked, {
          nonNullable: true,
        });

        return acc;
      },
      {}
    );
  }
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe, JsonPipe, NgIf } from '@angular/common';
import { TuiButtonModule, TuiFormatNumberPipeModule, TuiSvgModule } from '@taiga-ui/core';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '../list';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StockId } from 'types/stock';
import { CheckComponent } from '../list/check/check.component';

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
    CheckComponent,
    TuiFormatNumberPipeModule,
  ],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterIdeaComponent {
  private _data: any = null;
  public readonly itemHeight = 28;

  @Input()
  set data(value: any | null) {
    this._data = value;

    if (value) {
      this.listEntry = value.entries.map((item: any, index: number) => ({
        id: index.toString(),
        ...item,
        date: item.date,
        checked: !!item.date,
      }));

      this.listTarget = value.targets.map((item: any, index: number) => ({
        id: index.toString(),
        ...item,
        quantity: '-',
        quantityPercent: '-',
        date: item.stopDate,
        checked: !!item.stopDate,
      }));

      this.listStop = [
        {
          id: '0',
          ...value.stop,
          checked: false,
          date: '',
        },
      ];

      this.formEntry = new FormGroup(this._getControlFromList(this.listEntry));
      this.formTarget = new FormGroup(this._getControlFromList(this.listTarget));
      this.formStop = new FormGroup(this._getControlFromList(this.listStop));
    }
  }

  get data() {
    return this._data;
  }

  listEntry: any[] = [
    // {
    //   id: '4',
    //   checked: true,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 17.8265,
    //   quantity: 9,
    //   totalPrice: 160.439,
    //   depositShare: 0.016,
    // },
    // {
    //   id: '5',
    //   checked: false,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 17.8265,
    //   quantity: 9,
    //   totalPrice: 160.439,
    //   depositShare: 0.016,
    // },
  ];

  formEntry = new FormGroup(this._getControlFromList(this.listEntry));

  listTarget: any[] = [
    // {
    //   id: '4',
    //   checked: true,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 2.13698,
    //   profit: 8,
    //   profitPercent: 0.05,
    //   depositShare: 0.0002,
    //   quantity: 9,
    //   quantityPercent: 0.2,
    // },
    // {
    //   id: '5',
    //   checked: false,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 2.13698,
    //   profit: 8,
    //   profitPercent: 0.05,
    //   depositShare: 0.0002,
    //   quantity: 9,
    //   quantityPercent: 0.2,
    // },
    // {
    //   id: '6',
    //   checked: false,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 2.13698,
    //   profit: 8,
    //   profitPercent: 0.05,
    //   depositShare: 0.0002,
    //   quantity: 9,
    //   quantityPercent: 0.2,
    // },
    // {
    //   id: '7',
    //   checked: false,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 2.13698,
    //   profit: 8,
    //   profitPercent: 0.05,
    //   depositShare: 0.0002,
    //   quantity: 9,
    //   quantityPercent: 0.2,
    // },
  ];

  formTarget = new FormGroup(this._getControlFromList(this.listTarget));

  listStop: any[] = [
    // {
    //   id: '4',
    //   checked: true,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 2.13698,
    //   loss: 8,
    //   lossPercent: -0.02,
    //   depositShare: 0.0002,
    //   quantity: 9,
    //   quantityPercent: 0.2,
    // },
    // {
    //   id: '5',
    //   checked: true,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 2.13698,
    //   loss: 8,
    //   lossPercent: -0.02,
    //   depositShare: 0.0002,
    //   quantity: 9,
    //   quantityPercent: 0.2,
    // },
    // {
    //   id: '6',
    //   checked: false,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 2.13698,
    //   loss: 8,
    //   lossPercent: -0.02,
    //   depositShare: 0.0002,
    //   quantity: 9,
    //   quantityPercent: 0.2,
    // },
    // {
    //   id: '7',
    //   checked: false,
    //   date: '2024-06-27T10:00:00.000',
    //   price: 2.13698,
    //   loss: 8,
    //   lossPercent: -0.02,
    //   depositShare: 0.0002,
    //   quantity: 9,
    //   quantityPercent: 0.2,
    // },
  ];

  formStop = new FormGroup(this._getControlFromList(this.listStop));

  onRemove(event: Event, data: { id: StockId }): void {
    event.preventDefault();

    this.listTarget = this.listTarget.filter((item: { id: StockId }) => item.id !== data.id);
  }

  private _getControlFromList(list: { id: StockId; checked: boolean }[]): {
    [key: string]: FormControl<boolean>;
  } {
    return list.reduce((acc: { [key: string]: FormControl<boolean> }, item: { id: StockId; checked: boolean }) => {
      acc[item.id] = new FormControl<boolean>(
        { value: item.checked, disabled: true },
        {
          nonNullable: true,
        }
      );

      return acc;
    }, {});
  }
}

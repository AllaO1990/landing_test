import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '../list';
import { DatePipe } from '@angular/common';
import { TuiButtonModule } from '@taiga-ui/core';

@Component({
  selector: 'lib-enter-action',
  standalone: true,
  imports: [ListComponent, ItemComponent, ItemDirective, DatePipe, HeaderComponent, TuiButtonModule],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterActionComponent {
  listEntry = [
    // {
    //   id: '4',
    //   date: '2024-06-27T10:00:00.000',
    //   price: 17.8265,
    //   quantity: 9,
    //   totalPrice: 160.439,
    //   depositShare: 0.016,
    // },
    // {
    //   id: '5',
    //   date: '2024-06-27T10:00:00.000',
    //   price: 17.8265,
    //   quantity: 9,
    //   totalPrice: 160.439,
    //   depositShare: 0.016,
    // },
  ];

  listOut = [
    // {
    //   id: '4',
    //   date: '2024-06-27T10:00:00.000',
    //   price: 17.8265,
    //   quantity: 9,
    //   totalPrice: 160.439,
    //   profit: 8,
    //   profitPercent: 0.05,
    //   depositShare: 0.016,
    //   broker: 'Тинькофф',
    // },
    // {
    //   id: '5',
    //   date: '2024-06-27T10:00:00.000',
    //   price: 17.8265,
    //   quantity: 9,
    //   totalPrice: 160.439,
    //   profit: 8,
    //   profitPercent: 0.05,
    //   depositShare: 0.016,
    //   broker: 'Альфа',
    // },
    // {
    //   id: '6',
    //   date: '2024-06-27T10:00:00.000',
    //   price: 17.8265,
    //   quantity: 9,
    //   totalPrice: 160.439,
    //   profit: 8,
    //   profitPercent: 0.05,
    //   depositShare: 0.016,
    //   broker: 'Сбер',
    // },
  ];
}

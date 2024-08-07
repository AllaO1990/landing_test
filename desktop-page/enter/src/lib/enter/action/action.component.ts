import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HeaderComponent, ItemComponent, ItemDirective, ListComponent } from '../list';
import { DatePipe, NgIf } from '@angular/common';
import { TuiButtonModule, TuiFormatNumberPipeModule, TuiScrollbarModule } from '@taiga-ui/core';
import { Position, StockPositionEntry, StockPositionTarget } from 'types/position';

export interface ActionEntryItem {
  id: string;
  date: string | null;
  price: number;
  quantity: number;
  totalPrice: number;
  depositShare: number;
}

export interface ActionOutItem {
  id: string;
  date: string | null;
  price: number;
  amount: number;
  totalPrice: number;
  profit: number;
  profitPercent: number;
  depositShare: number;
  broker: string | null;
}

@Component({
  selector: 'lib-enter-action',
  standalone: true,
  imports: [
    NgIf,
    ListComponent,
    ItemComponent,
    ItemDirective,
    DatePipe,
    HeaderComponent,
    TuiButtonModule,
    TuiFormatNumberPipeModule,
    TuiScrollbarModule,
  ],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterActionComponent {
  @Input()
  set data(value: Position) {
    if (value) {
      this.listEntry = this._getListEntry(value.entries);
      this.totalEntry = this._getTotalEntry(this.listEntry);

      this.priceIncrement = value.priceIncrement;
      this.listOut = this._getListOut(value.targets, value.entryAveragePrice, value.multiplier);
      this.remainder = this._getRemainder(value.targets, value.entryAveragePrice, value.lastPrice, value.multiplier);
      this.result = this._getResult(this.listOut, value.entryAveragePrice, value.multiplier);

      console.log(value);
    }
  }

  listEntry: ActionEntryItem[] = [];
  totalEntry: ActionEntryItem | null = null;

  listOut: ActionOutItem[] = [];

  priceIncrement = 0;
  remainder: any = null;

  result: any = null;

  private _getListEntry(list: StockPositionEntry[]): ActionEntryItem[] {
    return list.map((item: StockPositionEntry, index: number) => ({
      id: index.toString(),
      ...item,
    }));
  }

  private _getTotalEntry(list: ActionEntryItem[]): ActionEntryItem {
    const start = { id: '', date: '', price: 0, totalPrice: 0, depositShare: 0, quantity: 0 };

    if (!list.length) {
      return start;
    }

    const total = list.reduce((acc: ActionEntryItem, item: ActionEntryItem) => {
      acc.price += item.price;
      acc.totalPrice += item.totalPrice;
      acc.depositShare += item.depositShare;
      acc.quantity += item.quantity;

      return acc;
    }, start);

    total.price = total.price / list.length;

    return total;
  }

  private _getListOut(list: StockPositionTarget[], averagePrice: number, multiplier: number): ActionOutItem[] {
    return list
      .filter((item: StockPositionTarget) => !!item.stopDate)
      .map((item: StockPositionTarget, index: number) => ({
        id: index.toString(),
        ...item,
        date: item.stopDate,
        amount: item.amount,
        broker: null,
        totalPrice: item.amount * item.price,
        profit: (item.price - averagePrice) * item.amount * multiplier,
      }));
  }

  private _getRemainder(list: StockPositionTarget[], averagePrice: number, lastPrice: number, multiplier: number): any {
    const remainder = list.reduce(
      (acc: any, item: StockPositionTarget) => {
        if (item.stopDate) {
          return acc;
        }

        return {
          ...acc,
          amount: acc.amount + item.amount,
          totalPrice: acc.totalPrice + item.amount * averagePrice,
          totalProfit: acc.profit + item.amount * lastPrice,
          depositShare: acc.depositShare + item.depositShare,
        };
      },
      { price: lastPrice, amount: 0, totalPrice: 0, totalProfit: 0, profit: 0, profitPercent: 0, depositShare: 0 }
    );

    remainder.profit = (remainder.totalProfit - remainder.totalPrice) * multiplier;
    remainder.profitPercent = remainder.profit / remainder.totalPrice;

    return remainder;
  }

  private _getResult(list: ActionOutItem[], averagePrice: number, multiplier: number): any {
    if (!list.length) {
      return null;
    }

    const total = list.reduce(
      (acc: ActionOutItem, item: ActionOutItem) => ({
        ...acc,
        price: (acc.price += item.price),
        amount: (acc.amount += item.amount),
        totalPrice: (acc.totalPrice += item.totalPrice),
        profit: (acc.profit += item.profit),
        depositShare: acc.depositShare + item.depositShare,
      }),
      {
        price: 0,
        totalPrice: 0,
        depositShare: 0,
        amount: 0,
        profit: 0,
        profitPercent: 0,
        date: '',
        broker: null,
        id: '',
      }
    );

    total.price = total.price / list.length;
    total.profitPercent = total.profit / total.totalPrice;

    return total;
  }
}

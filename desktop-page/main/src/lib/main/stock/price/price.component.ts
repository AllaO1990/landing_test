import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {StockListItemPrice} from "types/stock";
import {NgIf} from "@angular/common";
import {TuiFormatNumberPipeModule} from "@taiga-ui/core";

@Component({
  selector: 'vt-stock-price',
  standalone: true,
  imports: [
    NgIf,
    TuiFormatNumberPipeModule
  ],
  templateUrl: './price.component.html',
  styleUrl: './price.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceComponent {
  public value: null | { price: number; change: number; changePercent: number } = null;

  @Input() set data(value: null | StockListItemPrice) {
    if (value) {
      const {prev, last} = value;

      this.value = {
        price: last,
        change: (last - prev),
        changePercent: (last - prev) / 100
      };
    }
  }
}

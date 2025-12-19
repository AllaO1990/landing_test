import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartCandlestickComponent } from 'ui-common/lib/chart';

@Component({
  selector: 'stock-layout',
  imports: [ChartCandlestickComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockLayoutComponent {}

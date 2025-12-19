import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StockLayoutComponent } from '../layout/layout.component';

@Component({
  selector: 'stock-candlestick-wrapper',
  imports: [StockLayoutComponent],
  templateUrl: './wrapper.component.html',
  styleUrl: './wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockWrapperComponent {}

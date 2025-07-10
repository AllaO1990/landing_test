import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { IconTickerComponent } from '@ui/components/icon-ticker';
import { StockInstrument } from 'types/stock';

@Component({
  selector: 'lib-instrument',
  standalone: true,
  imports: [NgIf, IconTickerComponent],
  templateUrl: './instrument.component.html',
  styleUrl: './instrument.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstrumentComponent {
  @Input() data: StockInstrument | null = null;
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StockInstrument } from 'types/stock';
import { NgIf, NgTemplateOutlet } from '@angular/common';
import { TuiIconPipe } from '@taiga-ui/core';

@Component({
  selector: 'ui-icon-ticker',
  standalone: true,
  imports: [NgIf, NgTemplateOutlet, TuiIconPipe],
  templateUrl: './icon-ticker.component.html',
  styleUrl: './icon-ticker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconTickerComponent {
  isError = false;

  @Input() instrument: StockInstrument | null = null;

  onErrorImg(event: Event): void {
    event.preventDefault();

    this.isError = true;
  }
}

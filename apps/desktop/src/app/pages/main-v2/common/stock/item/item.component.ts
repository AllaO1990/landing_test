import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
} from '@angular/core';
import { TuiRadioComponent } from '@taiga-ui/kit';

@Component({
  selector: 'vt-stock-list-item',
  standalone: true,
  templateUrl: './item.component.html',
  host: {
    '[attr.checked]': 'checked || null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockListItemComponent extends TuiRadioComponent<unknown> {
  @HostListener('click', ['$event'])
  public onClick(event: Event): void {
    event.preventDefault();

    this.onChecked(!this.checked);
  }
}

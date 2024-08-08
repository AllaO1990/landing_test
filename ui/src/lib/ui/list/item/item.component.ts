import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { TuiCheckboxComponent } from '@taiga-ui/kit';
import { TuiSvgModule } from '@taiga-ui/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lib-list-item',
  exportAs: '[libListItem]',
  standalone: true,
  imports: [NgIf, TuiSvgModule],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  host: {
    '[class.checked]': 'value',
    '[class.disabled]': 'disabled',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemComponent extends TuiCheckboxComponent {
  @HostListener('click', ['$event']) onClick(event: Event): void {
    event.preventDefault();

    this.value = !this.value;
  }
}

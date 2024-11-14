import { TuiIcon } from '@taiga-ui/core';
import { TuiCheckbox } from '@taiga-ui/kit';
import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lib-list-item',
  exportAs: '[libListItem]',
  standalone: true,
  imports: [NgIf, TuiIcon],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  host: {
    '[class.checked]': 'control.value',
    '[class.disabled]': 'control.disabled',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemComponent extends TuiCheckbox {
  @HostListener('click', ['$event']) onClick(event: Event): void {
    event.preventDefault();

    // this.value = !this.value;
  }

  @Input() value: any;
}

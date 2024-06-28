import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
} from '@angular/core';
import { TuiCheckboxComponent } from '@taiga-ui/kit';
import { TuiSvgModule } from '@taiga-ui/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lib-enter-list-item',
  standalone: true,
  imports: [NgIf, TuiSvgModule],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemComponent extends TuiCheckboxComponent {
  @HostListener('click', ['$event']) onClick(event: Event): void {
    event.preventDefault();

    this.value = !this.value;
  }
}

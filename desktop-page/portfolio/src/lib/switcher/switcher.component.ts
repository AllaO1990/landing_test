import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'portfolio-switcher',
  standalone: true,
  imports: [NgFor],
  templateUrl: './switcher.component.html',
  styleUrl: './switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitcherComponent {
  readonly list: { name: string; value: any }[] = [
    { name: '₽', value: '' },
    { name: '$', value: '' },
    { name: '€', value: '' },
    { name: '£', value: '' },
    { name: '¥', value: '' },
  ];

  trackByIndex(index: number): number {
    return index;
  }
}

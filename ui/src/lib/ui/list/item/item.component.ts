import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lib-list-item',
  exportAs: '[libListItem]',
  standalone: true,
  imports: [NgIf],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  host: {},
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemComponent {}

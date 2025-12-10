import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-list-item',
  exportAs: '[libListItem]',
  standalone: true,
  imports: [],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  host: {},
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemComponent {}

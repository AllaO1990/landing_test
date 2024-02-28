import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'vt-layout-start',
  templateUrl: './layout-start.component.html',
  styleUrls: ['./layout-start.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutStartComponent {
  constructor() {}
}

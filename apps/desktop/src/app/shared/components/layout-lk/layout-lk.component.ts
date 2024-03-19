import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DesktopStubService } from '@desktop-data/desktop-data';

@Component({
  selector: 'vt-layout-lk',
  templateUrl: './layout-lk.component.html',
  styleUrls: ['./layout-lk.component.scss'],
  providers: [
    DesktopStubService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutLkComponent {
  constructor() {}
}

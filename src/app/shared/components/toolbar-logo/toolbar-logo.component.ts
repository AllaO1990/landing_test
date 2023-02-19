import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'vt-toolbar-logo',
  templateUrl: './toolbar-logo.component.html',
  styleUrls: ['./toolbar-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarLogoComponent {

  constructor() { }
}

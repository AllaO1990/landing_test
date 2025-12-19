import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'light-toolbar',
  imports: [],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {}

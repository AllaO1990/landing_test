import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavComponent } from '../nav';

@Component({
  selector: 'pro-toolbar',
  imports: [NavComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarProComponent {}

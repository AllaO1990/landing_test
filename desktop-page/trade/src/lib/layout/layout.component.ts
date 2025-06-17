import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'trade-layout',
  standalone: true,
  imports: [],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {}

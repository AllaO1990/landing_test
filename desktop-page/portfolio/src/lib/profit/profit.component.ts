import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'portfolio-profit',
  standalone: true,
  imports: [],
  templateUrl: './profit.component.html',
  styleUrl: './profit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfitComponent {}

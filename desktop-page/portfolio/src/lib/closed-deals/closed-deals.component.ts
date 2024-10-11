import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'portfolio-closed-deals',
  standalone: true,
  imports: [],
  templateUrl: './closed-deals.component.html',
  styleUrl: './closed-deals.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClosedDealsComponent {}

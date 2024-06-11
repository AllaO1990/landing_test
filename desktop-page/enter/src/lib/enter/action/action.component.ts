import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-enter-action',
  standalone: true,
  imports: [],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterActionComponent {}

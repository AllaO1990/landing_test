import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-enter-idea',
  standalone: true,
  imports: [],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterIdeaComponent {}

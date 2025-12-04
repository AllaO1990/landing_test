import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'idea-list',
  standalone: true,
  imports: [],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeaList {}

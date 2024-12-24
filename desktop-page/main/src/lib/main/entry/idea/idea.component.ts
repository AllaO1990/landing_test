import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IdeaType } from './idea.types';

@Component({
  selector: 'vt-entry-idea',
  templateUrl: './idea.component.html',
  styleUrls: ['./idea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryIdeaComponent {
  @Input() data!: IdeaType;
}

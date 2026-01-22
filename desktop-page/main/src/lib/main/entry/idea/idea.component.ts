import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IdeaType } from './idea.types';

@Component({
	selector: 'vt-entry-ideas',
	templateUrl: './idea.component.html',
	styleUrls: ['./idea.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryIdeaComponent {
	@Input() data!: IdeaType;
}

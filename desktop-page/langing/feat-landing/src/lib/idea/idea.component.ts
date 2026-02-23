import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiLink, TuiNotification } from '@taiga-ui/core';

@Component({
	selector: 'landing-idea',
	imports: [TuiLink, TuiNotification],
	standalone: true,
	templateUrl: './idea.component.html',
	styleUrl: './idea.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeaComponent {}

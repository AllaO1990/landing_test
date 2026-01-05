import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'vt-toolbar-start',
	templateUrl: './toolbar-start.component.html',
	styleUrls: ['./toolbar-start.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarStartComponent {
	public readonly links: { path: string[]; name: string }[] = [
		{ name: 'Sign in', path: ['./form-email'] },
		// { name: 'Sign up', path: ['./sign-up'] },
	];

	public trackByIndex(index: number): number {
		return index;
	}
}

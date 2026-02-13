import {ChangeDetectionStrategy, Component, inject, TemplateRef} from '@angular/core';
import {POLYMORPHEUS_CONTEXT} from '@taiga-ui/polymorpheus';
import {TuiButton, TuiDialogContext} from '@taiga-ui/core';
import {TuiAutoFocus, tuiPure} from '@taiga-ui/cdk';
import {NgTemplateOutlet} from '@angular/common';

type Context = TuiDialogContext<boolean, { template: TemplateRef<any>; context: any }>;

@Component({
	selector: 'lib-dialog-approve',
	standalone: true,
	imports: [TuiButton, TuiAutoFocus, NgTemplateOutlet],
	templateUrl: './dialog-approve.component.html',
	styleUrl: './dialog-approve.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogApproveComponent {
	readonly size = 's';
	readonly context: Context = inject(POLYMORPHEUS_CONTEXT) as Context;

	@tuiPure
	get data() {
		return this.context.data;
	}

	submit(event: Event): void {
		event.preventDefault();

		this.context.completeWith(true);
	}

	cancel(event: Event): void {
		event.preventDefault();

		this.context.completeWith(false);
	}
}

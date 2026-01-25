import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { POLYMORPHEUS_CONTEXT, PolymorpheusOutlet } from '@taiga-ui/polymorpheus';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, ViewEncapsulation } from '@angular/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { TuiDialogCloseService } from '@taiga-ui/core';

type CustomContext = {
	appearance: string | undefined;
	closeable: boolean | undefined;
};

@Component({
	selector: 'ui-dialog',
	templateUrl: './dialog.component.html',
	styleUrl: './dialog.component.scss',
	standalone: true,
	host: {
		'[attr.appearance]': 'context.appearance || null',
		'[class.lib-dialog]': 'true',
	},
	imports: [PolymorpheusOutlet],
	providers: [TuiDialogCloseService],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class DialogComponent {
	readonly context: TuiPopover<any, CustomContext> = inject(POLYMORPHEUS_CONTEXT);
	readonly #close$: TuiDialogCloseService = inject(TuiDialogCloseService);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	constructor() {
		if (this.context.closeable) {
			this.#close$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.context.$implicit.complete());
		}
	}
}

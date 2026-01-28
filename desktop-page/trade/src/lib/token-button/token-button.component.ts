import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { TuiButton, TuiDialogService, TuiGroup } from '@taiga-ui/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeTokenSource } from '@data-access-trade/types';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { TradeStore } from '../common/store';
import { TradeTokenButtonDialogService } from './token-button.dialog.service';
import { DIALOG, DialogService } from '@ui/components/dialog';

@Component({
	selector: 'trade-token-button',
	standalone: true,
	imports: [TuiGroup, TuiButton, NgIf],
	templateUrl: './token-button.component.html',
	styleUrl: './token-button.component.scss',
	providers: [
		{
			provide: TradeTokenButtonDialogService,
			useFactory: (dialog: DialogService) => new TradeTokenButtonDialogService(dialog),
			deps: [DIALOG],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenButtonComponent {
	readonly #dialogDefaultService: TuiDialogService = inject(TuiDialogService);
	readonly #injector: Injector = inject(Injector);
	readonly #dialog: TradeTokenButtonDialogService = inject(TradeTokenButtonDialogService);
	readonly #store: TradeStore = inject(TradeStore);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly size = 's';

	@Input() value: any = null;

	addToken(event: Event): void {
		event.preventDefault();

		this.#dialog
			.openTradeToken(this.#injector, this.value)
			.pipe(takeUntilDestroyed(this.#destroyRef))
			.subscribe((value: null | TradeTokenSource) => {
				if (value !== null) {
					this.#store.changeToken(value);
				}
			});
	}

	removeToken(event: Event): void {
		event.preventDefault();

		const { token } = this.value;

		if (token) {
			this.#dialogDefaultService
				.open<boolean>(TUI_CONFIRM, {
					appearance: 'dialog-confirm',
					closeable: false,
					size: 'auto',
					data: {
						content: '<p class="tui-text_h6">Удалить токен?</p>',
						yes: 'Да',
						no: 'Нет',
					},
				})
				.pipe(takeUntilDestroyed(this.#destroyRef))
				.subscribe((result: boolean) => {
					if (result) {
						this.#store.removeToken(token);
					}
				});
		}
	}
}

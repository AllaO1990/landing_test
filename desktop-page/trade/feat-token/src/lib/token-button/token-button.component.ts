import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  Output,
} from '@angular/core';
import {TuiButton, TuiGroup} from '@taiga-ui/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TradeTokenSource} from '@data-access-trade/types';
import {TradeTokenDialogService} from '../token/token.dialog.service';
import {DIALOG, DialogService} from '@ui/components/dialog';
import {DialogApproveService} from 'ui-common/lib/dialog-approve';
import {TradeTokenCompleted, TradeTokenCompleteType} from './token-button.types';

@Component({
	selector: 'trade-token-button',
	standalone: true,
	imports: [TuiGroup, TuiButton],
	templateUrl: './token-button.component.html',
	styleUrl: './token-button.component.scss',
	providers: [
		{
			provide: TradeTokenDialogService,
			useFactory: (dialog: DialogService) => new TradeTokenDialogService(dialog),
			deps: [DIALOG],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenButtonComponent {
	readonly #dialogApproveService: DialogApproveService = inject(DialogApproveService);
	readonly #injector: Injector = inject(Injector);
	readonly #dialog: TradeTokenDialogService = inject(TradeTokenDialogService);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	#isOpened = false;

	readonly size = 's';

	@Input() value: any = null;

	@Output() completed: EventEmitter<TradeTokenCompleted> = new EventEmitter();

	addToken(event: Event): void {
		event.preventDefault();

		if (this.#isOpened) {
			return;
		}

		this.#isOpened = true;

		this.#dialog
			.openTradeToken(this.#injector, this.value)
			.pipe(takeUntilDestroyed(this.#destroyRef))
			.subscribe((value: null | TradeTokenSource) => {
				this.#isOpened = false;

				if (value !== null) {
					this.completed.emit({ type: TradeTokenCompleteType.CHANGE, data: value });
				}
			});
	}

	removeToken(event: Event): void {
		event.preventDefault();

		const { token } = this.value;

		if (token) {
			this.#dialogApproveService
				.openDialog(this.#injector, {
					data: {
						context: '<div class="tui-text_h6">Удалить токен?</div>',
					},
				})
				.pipe(takeUntilDestroyed(this.#destroyRef))
				.subscribe((result: boolean) => {
					if (result) {
						this.completed.emit({ type: TradeTokenCompleteType.REMOVE, data: token });
					}
				});
		}
	}
}

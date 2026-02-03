import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAutoFocus, TuiContext, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TradeSource, TradeSources } from '@data-access-trade/types';
import { DialogCoreComponent } from '@ui/components/dialog';

@Component({
	selector: 'trade-token',
	standalone: true,
	imports: [TuiButton, ReactiveFormsModule, TuiTextfieldControllerModule, TuiTextfield, TuiAutoFocus],
	templateUrl: './token.component.html',
	styleUrls: ['./token.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeTokenComponent extends DialogCoreComponent implements AfterViewInit {
	readonly formGroup: FormGroup = new FormGroup({
		name: new FormControl<string | null>(null, Validators.required),
		source: new FormControl<number | null>({ value: null, disabled: true }, Validators.required),
		sourceId: new FormControl(null, Validators.required),
		token: new FormControl<string | null>(null, Validators.required),
	});

	typeTitle: 'add' | 'change' = 'add';

	ngAfterViewInit(): void {
		if (this.context) {
			const { source, token } = this.context;

			if (source) {
				this.formGroup.patchValue({ source: source.name, sourceId: source.id });

				if (!token) {
					this.formGroup.patchValue({ name: source.name });
				}
			}

			if (token) {
				this.typeTitle = 'change';
				this.formGroup.patchValue({ name: token.name });
			}
		}
	}

	@tuiPure
	protected stringifySources(items: TradeSources): TuiStringHandler<TuiContext<number>> {
		const map = new Map(items.map(({ name, id }: TradeSource) => [id, name] as [number, string]));

		return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
	}

	onSave(event: Event): void {
		event.preventDefault();

		if (this.context) {
			this.context.completeWith(this.formGroup.value);
		}
	}
}

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
} from '@angular/core';
import { StockPositionTarget } from 'types/position';
import { HeaderComponent, UiList, UiListItem } from '@ui/components/list';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { GetCryptoNumberPipe } from '@ui/pipes/get-crypto-number.pipe';
import { TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';

type Action = { event: Event; type: string; data: { index: number } };
type Option = { precision: number; precisionQuantity: number };

@Component({
	selector: 'lib-list-mobile',
	templateUrl: './list-mobile.component.html',
	styleUrls: ['./list-mobile.component.scss'],
	standalone: true,
	imports: [
		UiList,
		UiListItem,
		AsyncPipe,
		GetCryptoNumberPipe,
		TuiButton,
		TuiFormatNumberPipe,
		NgTemplateOutlet,
		HeaderComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListMobileComponent {
	readonly itemHeight = 60;

	readonly type: InputSignal<string> = input<string>('crypto');

	readonly list: InputSignal<StockPositionTarget[]> = input<StockPositionTarget[]>([]);

	readonly index: InputSignal<number | null> = input<number | null>(null);

	readonly option: InputSignal<Option> = input<Option>({ precision: Infinity, precisionQuantity: Infinity });

	readonly precision = computed(() => this.option().precision);

	readonly precisionQuantity = computed(() => this.option().precisionQuantity);

	readonly action: OutputEmitterRef<Action> = output();

	onEdit(event: Event, index: number): void {
		event.preventDefault();

		this.action.emit({ event, type: 'edit', data: { index } });
	}

	onRemove(event: Event, index: number): void {
		event.preventDefault();

		this.action.emit({ event, type: 'remove', data: { index } });
	}
}

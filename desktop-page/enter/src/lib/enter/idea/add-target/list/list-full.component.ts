import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
} from '@angular/core';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { GetCryptoNumberPipe } from '@ui/pipes/get-crypto-number.pipe';
import { HeaderComponent, ItemComponent, UiList, UiListItem } from '@ui/components/list';
import { TuiButton, TuiFormatNumberPipe } from '@taiga-ui/core';
import { StockPositionTarget } from 'types/position';

type Action = { event: Event; type: string; data: { index: number } };

@Component({
	selector: 'lib-list-full',
	templateUrl: './list-full.component.html',
	styleUrls: ['./list-full.component.scss'],
	standalone: true,
	imports: [
		AsyncPipe,
		GetCryptoNumberPipe,
		ItemComponent,
		TuiButton,
		TuiFormatNumberPipe,
		UiList,
		UiListItem,
		HeaderComponent,
		NgTemplateOutlet,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListFullComponent {
	readonly itemHeight = 28;

	readonly list: InputSignal<StockPositionTarget[]> = input<StockPositionTarget[]>([]);

	readonly index: InputSignal<number | null> = input<number | null>(null);

	readonly option: InputSignal<{ precision: number }> = input<{ precision: number }>({ precision: Infinity });

	readonly precision = computed(() => this.option().precision);

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

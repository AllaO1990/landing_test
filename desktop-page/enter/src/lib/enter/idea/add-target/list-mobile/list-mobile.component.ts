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

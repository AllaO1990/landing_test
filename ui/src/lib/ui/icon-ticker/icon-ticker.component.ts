import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StockInstrument } from 'types/stock';
import { NgTemplateOutlet } from '@angular/common';
import { TuiIconPipe } from '@taiga-ui/core';
import { IconTickerSrcPipe } from './icon-ticker.pipe';

@Component({
	selector: 'ui-icon-ticker',
	standalone: true,
	imports: [NgTemplateOutlet, TuiIconPipe, IconTickerSrcPipe],
	templateUrl: './icon-ticker.component.html',
	styleUrl: './icon-ticker.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconTickerComponent {
	isError = false;

	@Input() instrument: StockInstrument | null = null;

	onErrorImg(event: Event): void {
		event.preventDefault();

		this.isError = true;
	}
}

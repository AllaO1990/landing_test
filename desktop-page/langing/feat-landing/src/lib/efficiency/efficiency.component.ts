import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SafeHtmlPipe } from '../sanitizer/dom-sanitizer.pipe';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

interface Efficiency {
	title: string;
	text: string;
}

@Component({
	selector: 'landing-efficiency',
	imports: [SafeHtmlPipe, TuiButton, TuiIcon],
	standalone: true,
	templateUrl: './efficiency.component.html',
	styleUrl: './efficiency.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EfficiencyComponent {
	readonly data: Efficiency[] = [
		{
			title: '36,8%',
			text: 'Средняя годовая доходность за вычетом всех комиссий брокера (скачать отчет)',
		},
		{
			title: '15 000 +',
			text: 'Проанализированных активов',
		},
		{
			title: '24/7',
			text: 'Непрерывный мониторинг рынка',
		},
	];
}

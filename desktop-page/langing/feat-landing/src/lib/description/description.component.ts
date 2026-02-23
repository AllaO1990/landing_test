import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { SafeHtmlPipe } from '../sanitizer/dom-sanitizer.pipe';

interface Description {
	icon: string;
	iconBackground: string;
	title: string;
	text: string;
}

type Descriptions = Description[];

@Component({
	selector: 'landing-description',
	imports: [TuiIcon, SafeHtmlPipe],
	standalone: true,
	templateUrl: './description.component.html',
	styleUrl: './description.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionComponent {
	readonly data: Descriptions = [
		{
			icon: '@tui.flame',
			iconBackground: '@tui.flame-filled',
			title: 'Эффективно',
			text:
				'Генерация точных торговых идей на основе анализа больших данных и передовых математических алгоритмов, многофакторного анализа, учитывающего технические индикаторы, фундаментальные данные и рыночные тренды.',
		},
		{
			icon: '@tui.shield',
			iconBackground: '@tui.shield-filled',
			title: 'Безопасно',
			text:
				'<p>Надежность и защита данных обеспечена сервисами.</p><p>Управление рисками обеспечено регулярным улучшением алгоритмов на основе новых данных и изменяющихся рыночных условий с прохождением тщательного тестирования на историии перед внедрением.</p>',
		},
		{
			icon: '@tui.zap',
			iconBackground: '@tui.zap-filled',
			title: 'Просто',
			text:
				'<p>Автоматический расчет оптимальных точек входа и выхода для каждой торговой идеи.</p><p>Интеграция с Телеграм и брокером позволяет совершать сделки в 2 клика.</p>',
		},
	];
}

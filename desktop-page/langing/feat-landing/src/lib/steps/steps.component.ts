import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SafeHtmlPipe } from '../sanitizer/dom-sanitizer.pipe';
import { TuiBadge } from '@taiga-ui/kit';

interface Step {
	title: string;
	text: string;
}

type Steps = Step[];

@Component({
	selector: 'landing-steps',
	imports: [SafeHtmlPipe, TuiBadge],
	standalone: true,
	templateUrl: './steps.component.html',
	styleUrl: './steps.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsComponent {
	readonly data: Steps = [
		{
			title: 'Завести брокерский счет',
			text: 'Необходим для ведения биржевой торговли. Подойдут как российские, так и зарубежные счета.',
		},
		{
			title: 'Установить приложение Telegram',
			text: ' Чтобы получать сообщения обо всех идеях и сигналы ко входу и выходу. Инвестиции в вашем кармане!',
		},
		{
			title: 'Зарегистрироваться',
			text:
				'<p>На нашем сайте, чтобы получить полный доступ ко всем сервисам. Требуется только почта.</p><p><a href="/">Зарабатывать вместе с GrinTrade</a></p>',
		},
	];
}

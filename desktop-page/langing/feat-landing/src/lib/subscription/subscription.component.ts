import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiChip } from '@taiga-ui/kit';

@Component({
	selector: 'landing-subscription',
	imports: [TuiButton, TuiIcon, TuiChip],
	templateUrl: './subscription.component.html',
	styleUrl: './subscription.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionComponent {
	readonly list: { title: string; subtitle: string; text: string }[] = [
		{
			title: 'Идеи',
			subtitle: 'Получай идеи с высокой вероятностью успеха каждый день или проверяй свои. ',
			text:
				'Доверься ИИ и продвинутым математическим моделям, либо создавай свои идеи, проверяй их и отслеживай исполнение.',
		},
		{
			title: 'Сделки',
			subtitle: 'Занимайся любимыми делами, всю рутину берем на себя.',
			text: 'В онлайн режиме отслеживаются все сделки, и при наступлении события присылаются уведомления в Телеграмме.',
		},
		{
			title: 'Портфель',
			subtitle: 'Твоя история под контролем.',
			text:
				'Совершай сделки через сервис, и все сделки будут формироваться автоматически, или веди подробный учет самостоятельно. Анализируй статистику в удобных форматах на сайте или в Excel.',
		},
	];
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiNotification } from '@taiga-ui/core';

@Component({
	selector: 'landing-invest',
	imports: [TuiNotification],
	standalone: true,
	templateUrl: './invest.component.html',
	styleUrl: './invest.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestComponent {}

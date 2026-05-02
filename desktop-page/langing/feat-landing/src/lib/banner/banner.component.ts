import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

@Component({
	selector: 'landing-banner',
	imports: [TuiButton, TuiIcon],
	standalone: true,
	templateUrl: './banner.component.html',
	styleUrl: './banner.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerComponent {}

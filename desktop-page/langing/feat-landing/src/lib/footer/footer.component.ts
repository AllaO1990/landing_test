import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiLink } from '@taiga-ui/core';

@Component({
	selector: 'landing-footer',
	imports: [TuiLink],
	standalone: true,
	templateUrl: './footer.component.html',
	styleUrl: './footer.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}

import { AfterViewInit, Component, inject } from '@angular/core';
import { WINDOW } from 'tokens/desktop';
import { TuiLink } from '@taiga-ui/core';

@Component({
	selector: 'payment-layout',
	standalone: true,
	imports: [TuiLink],
	templateUrl: './payment.component.html',
	styleUrl: './payment.component.scss',
})
export class PaymentComponent implements AfterViewInit {
	#window: Window = inject(WINDOW);

	readonly link = 'https://t.me/GrinTradeBot';

	ngAfterViewInit(): void {
		this.#window.open(this.link);
	}
}

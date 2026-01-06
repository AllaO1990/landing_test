import { AfterViewInit, Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { WINDOW } from 'tokens/desktop';
import { TuiAppearance, TuiButton, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { AuthService } from '@core/auth';
import { tuiPure } from '@taiga-ui/cdk';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'payment-layout',
	standalone: true,
	imports: [TuiCardLarge, TuiTitle, TuiHeader, TuiButton, TuiAppearance],
	templateUrl: './payment.component.html',
	styleUrl: './payment.component.scss',
})
export class PaymentComponent implements AfterViewInit {
	readonly #window: Window = inject(WINDOW);
	readonly #auth: AuthService = inject(AuthService);
	readonly #router: Router = inject(Router);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly size = 'm';
	readonly link = 'https://t.me/GrinTradeBot';

	alreadySubscription: WritableSignal<boolean> = signal(false);

	@tuiPure
	get url() {
		return this.#router.parseUrl(this.#auth.getUrl() || '/lk');
	}

	ngAfterViewInit(): void {
		this.#window.open(this.link);
	}

	onAlreadySubscription(event: Event): void {
		event.preventDefault();
		this.alreadySubscription.set(true);
		this.#auth.updatePermission();

		this.#auth
			.getPermission()
			.pipe(takeUntilDestroyed(this.#destroyRef))
			.subscribe(() => {
				this.alreadySubscription.set(false);
				this.#router.navigateByUrl(this.url);
			});
	}
}

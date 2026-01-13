import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { WINDOW } from 'tokens/desktop';
import { TuiAppearance, TuiButton, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { AuthService } from '@core/auth';
import { tuiPure } from '@taiga-ui/cdk';
import { Router, UrlTree } from '@angular/router';
import { PERMISSIONS } from 'tokens/desktop/permission';
import { Permissions, PermissionsState } from 'utils/permissions';
import { finalize, map, Observable, shareReplay } from 'rxjs';
import { TuiButtonLoading } from '@taiga-ui/kit';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getPathFromFragment } from 'utils/get-path-from-fragment';

@Component({
	selector: 'payment-layout',
	standalone: true,
	imports: [TuiCardLarge, TuiTitle, TuiHeader, TuiButton, TuiAppearance, TuiButtonLoading, AsyncPipe],
	templateUrl: './payment.component.html',
	styleUrl: './payment.component.scss',
})
export class PaymentComponent implements AfterViewInit {
	readonly #window: Window = inject(WINDOW);
	readonly #permissions: Permissions = inject(PERMISSIONS);
	readonly #auth: AuthService = inject(AuthService);
	readonly #router: Router = inject(Router);
	readonly #destroyRef: DestroyRef = inject(DestroyRef);

	readonly size = 'm';
	readonly link = 'https://t.me/GrinTradeBot';

	isLoading$: Observable<boolean> = this.#permissions.state$.pipe(
		map((state: PermissionsState) => state.isLoading),
		shareReplay({ bufferSize: 1, refCount: true })
	);

	@tuiPure
	get url() {
		return this.#router.parseUrl(this.#auth.getUrl() || '/lk');
	}

	ngAfterViewInit(): void {
		this.#window.open(this.link);

		this.#permissions.isAccessed$
			.pipe(
				takeUntilDestroyed(this.#destroyRef),
				finalize(() => console.log('finalize #permissions'))
			)
			.subscribe((isAccess: boolean | null) => {
				if (isAccess) {
					this.#router.navigateByUrl(this._getUrlTree());
				}
			});
	}

	onAlreadySubscription(event: Event): void {
		event.preventDefault();

		this.#permissions.load();
	}

	private _getUrlTree(): UrlTree {
		const path = getPathFromFragment(this.#router.parseUrl(this.#router.url));

		if (path) {
			return this.#router.parseUrl(path);
		}

		return this.#router.createUrlTree(['lk']);
	}
}

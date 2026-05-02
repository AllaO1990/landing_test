import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { AuthService } from '@core/auth';
import { Router } from '@angular/router';

@Component({
	selector: 'landing-toolbar',
	imports: [TuiButton],
	standalone: true,
	templateUrl: './toolbar.component.html',
	styleUrl: './toolbar.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
	readonly #auth: AuthService = inject(AuthService);
	readonly #router: Router = inject(Router);

	onClick(event: Event): void {
		event.preventDefault();
		let url = this.#router.createUrlTree(['login']);

		if (this.#auth.isLoggedIn) {
			url = this.#router.createUrlTree(['lk']);
		}

		this.#router.navigateByUrl(url);
	}
}

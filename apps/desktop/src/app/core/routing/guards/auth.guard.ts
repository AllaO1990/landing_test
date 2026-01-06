import { inject, Injectable } from '@angular/core';
import { CanMatch, GuardResult, MaybeAsync, Route, Router, UrlSegment } from '@angular/router';
import { AuthService } from '@core/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanMatch {
	readonly #authService: AuthService = inject(AuthService);
	readonly #router: Router = inject(Router);

	canMatch(route: Route, segments: UrlSegment[]): MaybeAsync<GuardResult> {
		if (!this.#authService.isLoggedIn) {
			return true;
		}

		this.#router.navigate(['lk']);
		return false;
	}
}

import { inject } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	CanActivateFn,
	GuardResult,
	MaybeAsync,
	Router,
	RouterStateSnapshot,
	UrlTree,
} from '@angular/router';
import { AuthService } from '@core/auth';

export const authGuardCanActivate: CanActivateFn = (
	route: ActivatedRouteSnapshot,
	state: RouterStateSnapshot
): MaybeAsync<GuardResult> => {
	console.log('authGuardCanActivate', route, state);

	const _authService: AuthService = inject(AuthService);
	const _router: Router = inject(Router);

	if (!_authService.isLoggedIn) {
		return true;
	}

	const urlTree: UrlTree = _router.parseUrl(state.url);

	return _router.createUrlTree(['lk'], { fragment: urlTree.fragment || `path="${state.url}"` });
};

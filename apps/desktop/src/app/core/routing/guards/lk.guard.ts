import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@core/auth';
import { Permissions } from 'utils/permissions';
import { PERMISSIONS } from 'tokens/desktop/permission';
import { map } from 'rxjs/operators';
import { getPathFromFragment } from 'utils/get-path-from-fragment';

const URL_PAYMENT = '/lk/payment';

export const lkGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	const _auth: AuthService = inject(AuthService);
	const _permission: Permissions = inject(PERMISSIONS);
	const _router: Router = inject(Router);
	const urlTree: UrlTree = _router.parseUrl(state.url);

	if (_auth.isLoggedIn) {
		return _permission.isAccessed$.pipe(
			map((isAccessed: boolean | null) => {
				if (isAccessed === null) {
					return true;
				}

				if (!isAccessed) {
					if (state.url.includes(URL_PAYMENT)) {
						return true;
					}

					return _router.createUrlTree([URL_PAYMENT], { fragment: urlTree.fragment || `path="${state.url}"` });
				}

				const url = getPathFromFragment(urlTree);

				if (url) {
					return _router.createUrlTree([url]);
				}

				return true;
			})
		);
	}

	return _router.createUrlTree(['/'], { fragment: urlTree.fragment || `path="${state.url}"` });
};

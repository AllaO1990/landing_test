import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@core/auth';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Response } from 'types/response';

export const paymentGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	const auth: AuthService = inject(AuthService);
	const router: Router = inject(Router);

	if (auth.isLoggedIn) {
		return auth.getPermission().pipe(
			map((response: Response<string[]>) => response.data.findIndex((item) => item === 'site.access') !== -1),
			map((status: boolean) => {
				if (status) {
					return router.createUrlTree(['/lk']);
				}

				return true;
			})
		);
	}

	auth.setUrl(state.url);
	return router.parseUrl(`/#path="${state.url}"`);
};

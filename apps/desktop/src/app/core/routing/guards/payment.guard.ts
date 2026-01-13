import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Permissions } from 'utils/permissions';
import { PERMISSIONS } from 'tokens/desktop/permission';

export const paymentGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	const router: Router = inject(Router);
	const permission: Permissions = inject(PERMISSIONS);

	console.log('paymentGuardCanActivate');

	return permission.isAccessed$.pipe(
		map((isAccessed: boolean | null) => (isAccessed ? router.createUrlTree(['lk']) : true))
	);
};
			// return router.parseUrl(`/#path="${state.url}"`);

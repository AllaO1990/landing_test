import { inject, Injectable } from '@angular/core';
import {
	ActivatedRoute,
	ActivatedRouteSnapshot,
	CanActivate,
	CanActivateChild,
	CanActivateChildFn,
	CanActivateFn,
	Router,
	RouterStateSnapshot,
	UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/auth';
import { map } from 'rxjs/operators';
import { Response } from 'types/response';

@Injectable({
	providedIn: 'root',
})
export class LkGuard implements CanActivate, CanActivateChild {
	readonly #auth: AuthService = inject(AuthService);
	readonly #router: Router = inject(Router);
	readonly #route: ActivatedRoute = inject(ActivatedRoute);

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		if (this.#auth.isLoggedIn) {
			return true;
		}

		this.#auth.setUrl(state.url);
		return this.#router.parseUrl(`/#path="${state.url}"`);
	}

	canActivateChild(
		childRoute: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		if (this.#auth.isLoggedIn) {
			return true;
		}

		return this.#router.parseUrl('/');
	}
}

export const lkGuardCanActivate: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	const auth: AuthService = inject(AuthService);
	const router: Router = inject(Router);

	if (auth.isLoggedIn) {
		return auth.getPermission().pipe(
			map((response: Response<string[]>) => response.data.findIndex((item) => item === 'site.access') !== -1),
			map((status: boolean) => {
				if (status) {
					return true;
				}
				const url = auth.getUrl() || state.url;

				return router.createUrlTree(['/payment'], { fragment: `path="${url}"` });
			})
		);
	}

	auth.setUrl(state.url);
	return router.parseUrl(`/#path="${state.url}"`);
};

export const lkGuardCanActivateChild: CanActivateChildFn = (
	childRoute: ActivatedRouteSnapshot,
	state: RouterStateSnapshot
): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
	const auth: AuthService = inject(AuthService);
	const router: Router = inject(Router);

	console.log('lkGuardCanActivateChild', childRoute.routeConfig);

	if (auth.isLoggedIn) {
		return true;
	}

	return router.parseUrl('/');
};

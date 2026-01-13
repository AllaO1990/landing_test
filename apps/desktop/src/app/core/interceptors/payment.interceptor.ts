import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Permissions } from 'utils/permissions';
import { PERMISSIONS } from 'tokens/desktop/permission';

const URL_PAYMENT = '/lk/payment';

export const paymentInterceptor: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
	const _router: Router = inject(Router);
	const _permission: Permissions = inject(PERMISSIONS);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			// if (error.status === 403) {
			// 	if (!_router.url.includes(URL_PAYMENT)) {
			// 		_permission.load();
			// 		_permission.isAccessed$.pipe(take(1)).subscribe((isAccessed: boolean) => {
			// 			if (!isAccessed) {
			// 				console.log(_router.url);
			//
			// 				// _router.navigate([URL_PAYMENT], { fragment: `path="${_router.url}"` });
			// 			}
			// 		});
			// 	}
			// }

			return throwError(() => 'error');
		})
	);
};

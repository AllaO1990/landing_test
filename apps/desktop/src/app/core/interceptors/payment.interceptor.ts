import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { AuthService } from '@core/auth';

export const paymentInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
	const _router: Router = inject(Router);
	const auth: AuthService = inject(AuthService);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status === 403) {
				auth.updatePermission();

				auth
					.getPermission()
					.pipe(
						tap((data) => console.log(data)),
						finalize(() => console.log('paymentInterceptor'))
					)
					.subscribe(() => {
						_router.navigate(['/payment']);
					});
			}

			return throwError(() => error);
		})
	);
};

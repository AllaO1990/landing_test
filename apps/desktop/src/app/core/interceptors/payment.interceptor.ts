import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { VtLocalStorageService } from '@core/storage';

export const paymentInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const _router: Router = inject(Router);
  const _storage: VtLocalStorageService = inject(VtLocalStorageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        _storage.setObject('user', {});
        _router.navigate(['/payment']);
      }

      return throwError(() => error);
    })
  );
};

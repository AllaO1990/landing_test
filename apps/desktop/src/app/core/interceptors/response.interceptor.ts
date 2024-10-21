import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/auth';

export const responseInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // const _snackbar = inject(MatSnackBar);

  const _authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse, data: any) => {
      if (error.status === 401) {
        _authService.logout();
        // window.location.href = '/login';
      }

      return throwError(() => {
        const message = error.message;
        return new Error(message);
      });
    })
  );
};

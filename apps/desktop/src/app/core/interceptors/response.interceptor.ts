import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { catchError, throwError } from 'rxjs';
import { AuthService } from '@core/auth';
import { TuiAlertService } from '@taiga-ui/core';
import { Router } from '@angular/router';

export const responseInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // const _snackbar = inject(MatSnackBar);
  const _alerts: TuiAlertService = inject(TuiAlertService);
  const _statusList = [400, 404, 500];

  const _authService = inject(AuthService);
  const _router: Router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse, data: any) => {
      if (error.status === 401) {
        _authService.logout();
        _router.navigate(['/login']);
        // window.location.href = '/login';
      }

      if (
        _statusList.find((status: number) => status === error.status) &&
        error.url &&
        error.url.indexOf('/auth/') === -1
      ) {
        _alerts
          .open(`<p><strong>${error.error.message}</strong></p> ${error.url}`, {
            label: `Error ${error.status}`,
            appearance: 'negative',
            autoClose: 5000,
          })
          .subscribe();
      }

      return throwError(() => error);
      // return throwError(() => {
      //   const message = error.message;
      //   return new Error(message);
      // });
    })
  );
};

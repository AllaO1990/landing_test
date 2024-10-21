import { Inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/auth';

@Injectable({
  providedIn: 'root',
})
export class LkGuard implements CanActivate, CanActivateChild {
  constructor(
    @Inject(AuthService) private readonly _auth: AuthService,
    @Inject(Router) private readonly _router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this._auth.isLoggedIn) {
      return true;
    }

    return this._router.parseUrl('/');
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this._auth.isLoggedIn) {
      return true;
    }

    return this._router.parseUrl('/');
  }
}

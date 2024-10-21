import { Inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '@core/auth';

@Injectable({
  providedIn: 'root',
})
export class RegistrationGuard implements CanActivate, CanLoad {
  constructor(
    @Inject(AuthService) private readonly _auth: AuthService,
    @Inject(Router) private readonly _router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (state.url === '/registration' && this._auth.isLoggedIn) {
      return this._router.parseUrl('/');
    }

    return true;
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (route.path !== 'registration' && !this._auth.isLoggedIn) {
      return this._router.parseUrl('/');
    }

    return true;
  }
}

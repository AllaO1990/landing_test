import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanLoad, CanActivate {
  constructor(private _authService: AuthService, private _router: Router) {}

  canLoad(
    route: Route
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    /* if (!this._authService.isLoggedIn && route.path !== 'login') {
      return this._router.parseUrl('/');
    }
 */

    if (!this._authService.isLoggedIn) {
      return true;
    }

    this._router.navigate(['lk']);
    return false;
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    /* if (state.url === '/login' && this._authService.isLoggedIn) {
      return this._router.parseUrl('/');
    } */

    return true;
  }
}

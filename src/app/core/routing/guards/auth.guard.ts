import { Injectable } from '@angular/core';
import {
  CanLoad,
  Route,
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanLoad, CanActivate {
  constructor(private _authService: AuthService, private _router: Router) {}

  canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
    if (!this._authService.isLoggedIn && route.path !== 'login') {
      this._router.navigate(['/login']);
      return false;
    }

    return true;
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (state.url === '/login' && this._authService.isLoggedIn) {
      return false;
    }

    return true;
  }
}

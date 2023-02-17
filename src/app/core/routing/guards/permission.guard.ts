import {Inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    @Inject(Router) private readonly _router: Router
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (false) {
      return this._router.parseUrl(this._getPathCanActivate(route) + '/403');
    }

    return true;
  }

  private _getPathCanActivate(route: ActivatedRouteSnapshot, path: string = ''): string {
    if (route.parent && route.routeConfig) {
      return this._getPathCanActivate(route.parent, path + route.routeConfig.path);
    }

    return path;
  }
}

import {Inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {PERMISSION_TOKEN} from "../../permission/permission.token";

@Injectable({
  providedIn: 'root'
})
export class ForbiddenGuard implements CanActivate {
  constructor(
    @Inject(Router) private readonly _router: Router,
    @Inject(PERMISSION_TOKEN) private readonly _permission: boolean
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this._permission) {
      return this._router.parseUrl('/');
    }

    return true;
  }
}

import {forwardRef, inject, InjectionToken} from "@angular/core";
import {PermissionService} from "./permission.service";

export const PERMISSION_TOKEN = new InjectionToken<boolean>('permission token',
  {
    providedIn: 'root',
    factory: () => inject(forwardRef(() => PermissionService)).permission
  }
);

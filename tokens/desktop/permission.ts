import { InjectionToken } from '@angular/core';
import { Permissions } from 'utils/permissions';

export const PERMISSIONS: InjectionToken<Permissions> = new InjectionToken<Permissions>('permissions');

import { InjectionToken } from '@angular/core';
import { DesktopService } from '../../api/desktop-data/src/lib/desktop-data';

export const DESKTOP_API: InjectionToken<DesktopService> =
  new InjectionToken<DesktopService>('Desktop API Service');

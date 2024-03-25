import { InjectionToken } from '@angular/core';
import { DesktopService } from '../../api/desktop-data/src/lib/desktop-data';

export const DESKTOP_API = new InjectionToken<DesktopService>(
  'Desktop API Service'
);

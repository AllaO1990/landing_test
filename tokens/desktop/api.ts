import { InjectionToken } from '@angular/core';
import { DesktopService } from '@desktop-data/desktop-data';

export const DESKTOP_API: InjectionToken<DesktopService> = new InjectionToken<DesktopService>('Desktop API Service');

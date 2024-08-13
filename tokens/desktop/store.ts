import { InjectionToken } from '@angular/core';
import { DesktopLkStore } from '../../stores/desktop';

export const DESKTOP_STORE = new InjectionToken<DesktopLkStore>('desktop store');

import { InjectionToken } from '@angular/core';
import { DesktopLkStore } from '../../stores/desktop';
import { DesktopLkState } from '../../types/lk-state';

export const DESKTOP_STORE = new InjectionToken<DesktopLkStore>(
  'desktop store'
);

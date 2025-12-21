import { InjectionToken } from '@angular/core';
import { ContextActionPlugin } from 'types/context-action-plugin';

export const ACTION_EVENTS = new InjectionToken<ContextActionPlugin[]>('Context action events');

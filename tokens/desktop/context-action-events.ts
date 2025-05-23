import { InjectionToken } from '@angular/core';
import { ContextActionPlugin } from '../../types/context-action-plugin';

export const CONTEXT_ACTION_EVENTS = new InjectionToken<ContextActionPlugin[]>('Context action events');

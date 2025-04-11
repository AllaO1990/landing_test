import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ActionService } from './action.service';
import { ActionPlugin } from './action.types';

export const SEARCH_DIALOG_ACTION_TOKEN = new InjectionToken<Observable<any>>('Search dialog action token');

export const SEARCH_DIALOG_ACTION_SERVICE_TOKEN = new InjectionToken<ActionService<any>>(
  'Search dialog action service token'
);

export const SEARCH_DIALOG_ACTION_CONDITION_TOKEN: InjectionToken<ActionPlugin[]> = new InjectionToken(
  'Search dialog action condition token'
);

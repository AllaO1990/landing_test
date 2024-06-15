import { InjectionToken } from '@angular/core';
import { QueryParams } from 'utils/query-params';

export const QUERY_PARAMS: InjectionToken<QueryParams> =
  new InjectionToken<QueryParams>('Query params');

import { forkJoin, map, Observable, timer } from 'rxjs';

export const forkJoinTimer = <T>(source$: Observable<T>, delay = 1000): Observable<T> =>
	forkJoin([source$, timer(delay)]).pipe(map(([source]: [T, number]) => source));

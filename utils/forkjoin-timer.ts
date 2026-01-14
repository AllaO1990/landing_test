import { forkJoin, map, Observable, timer } from 'rxjs';

export const forkJoinTimer = <T>(source$: Observable<T>, time = 1000): Observable<T> =>
	forkJoin([source$, timer(time)]).pipe(map(([source]: [T, number]) => source));

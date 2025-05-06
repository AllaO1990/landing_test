import { BehaviorSubject, finalize, Observable, Subject, switchMap, timer } from 'rxjs';

export class TimerInterval {
  #restart$: Subject<void> = new BehaviorSubject<void>(undefined);

  readonly interval = (timerInterval: number): Observable<number> =>
    this.#restart$.asObservable().pipe(
      switchMap((_) => timer(0, timerInterval)),
      finalize(() => console.log('finalize TimerInterval'))
    );

  restart(): void {
    this.#restart$.next();
  }
}

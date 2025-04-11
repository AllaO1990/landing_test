import { Injectable } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';

@Injectable()
export class ActionService<T> {
  readonly action$: Subject<T> = new ReplaySubject(1);

  update(value: T): void {
    this.action$.next(value);
  }
}

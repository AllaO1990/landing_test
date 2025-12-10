import { Injectable, signal, WritableSignal } from '@angular/core';
import { Params } from '@angular/router';

@Injectable()
export class DataAccessMainService {
  readonly params: WritableSignal<Params> = signal({});
}

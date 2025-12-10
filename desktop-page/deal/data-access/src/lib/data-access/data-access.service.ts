import { Injectable, signal, WritableSignal } from '@angular/core';
import { Params } from '@angular/router';

@Injectable()
export class DataAccessDealService {
  readonly params: WritableSignal<Params | null> = signal(null);
}

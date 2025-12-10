import { Injectable, signal, WritableSignal } from '@angular/core';
import { Params } from '@angular/router';

@Injectable()
export class DataAccessPortfolioService {
  readonly params: WritableSignal<Params | null> = signal(null);
}

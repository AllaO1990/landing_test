import { Injectable, signal, WritableSignal } from '@angular/core';
import { Params } from '@angular/router';

@Injectable()
export class DataAccessStructureService {
  readonly params: WritableSignal<Params | null> = signal(null);
}

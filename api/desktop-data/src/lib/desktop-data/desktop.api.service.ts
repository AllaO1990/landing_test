import {Injectable} from '@angular/core';
import {DesktopAbstractService} from './desktop.abstract.service';
import {Observable, of} from "rxjs";

@Injectable()
export class DesktopApiService extends DesktopAbstractService {
  getListIdea(): Observable<unknown> {
    return of(undefined);
  }

}

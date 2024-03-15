import {DesktopAbstractService} from './desktop.abstract.service';
import {inject, Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable()
export class DesktopStubService extends DesktopAbstractService {
  private readonly _http: HttpClient = inject(HttpClient);

  getListIdea(): Observable<unknown> {
    return this._http.get<unknown>(`assets/mocks/list-idea.json`);
  }
}

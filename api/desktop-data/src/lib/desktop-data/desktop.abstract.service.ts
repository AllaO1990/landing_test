import {Observable} from "rxjs";

export abstract class DesktopAbstractService {
  public abstract getIdeaList(): Observable<unknown>;
}

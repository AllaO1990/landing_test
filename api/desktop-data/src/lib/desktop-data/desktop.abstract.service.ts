import {Observable} from "rxjs";

export abstract class DesktopAbstractService {
  public abstract getListIdea(): Observable<unknown>;
}

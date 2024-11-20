import { ActivatedRoute, Params, QueryParamsHandling, Router } from '@angular/router';
import { Observable, share, Subscriber } from 'rxjs';
import { inject } from '@angular/core';

export const queryParams = () => new QueryParams(inject(Router), inject(ActivatedRoute));

export class QueryParams<T = any> extends Observable<T> {
  protected params$: Observable<Params> = this._activatedRoute.queryParams.pipe(
    share({
      resetOnRefCountZero: true,
    })
  );

  constructor(private readonly _router: Router, private readonly _activatedRoute: ActivatedRoute) {
    super((subscriber: Subscriber<any>) => {
      const subscription = this.params$.subscribe(subscriber);

      return () => subscription.unsubscribe();
    });
  }

  value(): Params {
    return this._activatedRoute.snapshot.queryParams;
  }

  update(params: Params, handling: QueryParamsHandling | null = 'merge'): Promise<boolean> {
    return this._router.navigate([], {
      queryParams: params,
      queryParamsHandling: handling,
    });
  }
}

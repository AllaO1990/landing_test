import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { Params, RouterOutlet } from '@angular/router';
import { ToolbarSearchModule } from '../../../../../apps/desktop/src/app/shared/components/toolbar-search';
import {
  ChartStore,
  DesktopLkStore,
  EntryStore,
  StockListStore,
} from 'stores/desktop';
import { DESKTOP_API, DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { DesktopService } from '@desktop-data/desktop-data';
import { QueryParams } from 'utils/query-params';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StockId } from 'types/stock';
import { EventSelected } from 'types/events';

const createStore = (api: DesktopService) =>
  new DesktopLkStore(
    api,
    new StockListStore(api),
    new EntryStore(api),
    new ChartStore(api)
  );

@Component({
  selector: 'lib-lk',
  standalone: true,
  imports: [RouterOutlet, ToolbarSearchModule],
  templateUrl: './lk.component.html',
  styleUrl: './lk.component.scss',
  providers: [
    {
      provide: DESKTOP_STORE,
      useFactory: createStore,
      deps: [DESKTOP_API, QUERY_PARAMS],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LkComponent implements OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);

  get queryId(): StockId | null {
    return this._queryParams.value()['id'] || null;
  }

  ngOnInit(): void {
    const stream$ = this._queryParams.pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    combineLatest([
      this._getParamsKey<EventSelected>('type', stream$),
      this._getParamsKey<StockId>('id', stream$),
    ])
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(300))
      .subscribe(([type, id]: [EventSelected, StockId]) =>
        this._store.updateEvent({ type, id })
      );

    if (!this.queryId) {
      this._queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: '72187db2-44d8-4b2e-8b43-c41fd30c4a39',
      });
    }
  }

  private _getParamsKey<T>(
    key: string,
    stream$: Observable<Params>
  ): Observable<T> {
    return stream$.pipe(
      filter((params: Params) => !!params[key]),
      map((params: Params) => params[key]),
      distinctUntilChanged()
    );
  }
}

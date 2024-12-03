import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Params, RouterOutlet } from '@angular/router';
// import {
//   ChartStore,
//   ConsolidationZonesStore,
//   DesktopLkStore,
//   EntryStore,
//   IndicatorAtrStore,
//   IndicatorEmaStore,
//   IndicatorSmaStore,
//   PositionStore,
//   _stockListStore,
// } from 'stores/desktop';
import { DESKTOP_API, GlobalDateRangeService, QUERY_PARAMS } from 'tokens/desktop';
import { QueryParams } from 'utils/query-params';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  shareReplay,
  startWith,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StockId } from 'types/stock';
import { EventSelected } from 'types/events';
import { NavComponent } from '../nav';
import { LogoComponent } from '@ui/components/logo';
import { MainStore } from '../../../../../stores/desktop/main.store';
import { DesktopService } from '@desktop-data/desktop-data';
import { SelectFacade } from 'stores/facades/select.facade';
import { PositionFacade } from 'stores/facades/position.facade';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { StockListFacade } from 'stores/facades/stock-list.facade';

// const createStore = (api: DesktopService) =>
//   new DesktopLkStore(
//     api,
//     new _stockListStore(api),
//     new EntryStore(api),
//     new PositionStore(api),
//     new ChartStore(api),
//     new IndicatorAtrStore(api),
//     new IndicatorEmaStore(api),
//     new IndicatorSmaStore(api),
//     new ConsolidationZonesStore(api)
//   );

@Component({
  selector: 'lib-lk',
  standalone: true,
  imports: [RouterOutlet, NavComponent, LogoComponent],
  templateUrl: './lk.component.html',
  styleUrl: './lk.component.scss',
  providers: [
    {
      provide: MainStore,
      useFactory: (api: DesktopService) => new MainStore(api),
      deps: [DESKTOP_API],
    },
    SelectFacade,
    PositionFacade,
    IdeaFacade,
    StockListFacade,
    // {
    //   provide: DESKTOP_STORE,
    //   useFactory: createStore,
    //   deps: [DESKTOP_API, QUERY_PARAMS],
    // },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LkComponent implements OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _globalDateRangeService: GlobalDateRangeService = inject(GlobalDateRangeService);

  get queryId(): StockId | null {
    return this._queryParams.value()['id'] || null;
  }

  ngOnInit(): void {
    const stream$ = this._queryParams.pipe(shareReplay({ bufferSize: 1, refCount: true }));

    combineLatest([
      this._getParamsKey<EventSelected>('type', stream$),
      this._getParamsKey<StockId>('id', stream$),
      this._getParamsKey<StockId>('group', stream$).pipe(startWith('')),
    ])
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(300))
      .subscribe(([type, id, group]: [EventSelected, StockId, StockId | undefined]) =>
        this._select.updateEvent({
          type,
          id,
          group,
        })
      );

    if (!this.queryId) {
      this._queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: '72187db2-44d8-4b2e-8b43-c41fd30c4a39',
      });
    }

    this._globalDateRangeService.setRange({
      from: new Date(new Date(new Date().getFullYear() - 1, 0, 1, 12).setUTCHours(0, 0, 0, 0)).toISOString(),
      to: new Date(new Date().setUTCHours(23, 59, 59, 0)).toISOString(),
    });
  }

  private _getParamsKey<T>(key: string, stream$: Observable<Params>): Observable<T> {
    return stream$.pipe(
      filter((params: Params) => !!params[key]),
      map((params: Params) => params[key]),
      distinctUntilChanged()
    );
  }
}

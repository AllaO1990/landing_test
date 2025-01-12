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
import { shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavComponent } from '../nav';
import { LogoComponent } from '@ui/components/logo';
import { DesktopService } from '@desktop-data/desktop-data';
import { SelectFacade } from 'stores/facades/select.facade';
import { PositionFacade } from 'stores/facades/position.facade';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { StockListFacade } from 'stores/facades/stock-list.facade';
import { ChartFacade } from 'stores/facades/chart.facade';
import { MainStore } from 'stores/main.store';
import { AccountFacade } from 'stores/facades/account.facade';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';

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
    ChartFacade,
    AccountFacade,
    PortfolioFacade,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LkComponent implements OnInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _globalDateRangeService: GlobalDateRangeService = inject(GlobalDateRangeService);

  ngOnInit(): void {
    this._queryParams
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      )
      .subscribe((event: Params) => {
        const { type, id, group } = event;
        this._select.updateEvent({
          type: type || null,
          id: id || null,
          group: group || null,
        });
      });

    this._globalDateRangeService.setRange({
      from: new Date(new Date(new Date().getFullYear() - 1, 0, 1, 12).setUTCHours(0, 0, 0, 0)).toISOString(),
      to: new Date(new Date().setUTCHours(23, 59, 59, 0)).toISOString(),
    });
  }
}

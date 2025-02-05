import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, OnInit } from '@angular/core';
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
import { debounceTime, Observable, shareReplay, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavComponent } from '../nav';
import { LogoComponent } from '@ui/components/logo';
import { DesktopService } from '@desktop-data/desktop-data';
import { SelectFacade } from 'stores/facades/select.facade';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { StockListFacade } from 'stores/facades/stock-list.facade';
import { ChartFacade } from 'stores/facades/chart.facade';
import { MainStore } from 'stores/main.store';
import { AccountFacade } from 'stores/facades/account.facade';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { EnterDialogService, VtEnterComponent } from 'desktop-page/enter';

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
  private readonly _injector: Injector = inject(Injector);
  private readonly _dialogEnterService: EnterDialogService = inject(EnterDialogService);
  private readonly _query$: Observable<Params> = this._queryParams.pipe(
    takeUntilDestroyed(this._destroyRef),
    startWith(this._queryParams.value()),
    distinctUntilChanged((a: Params, b: Params) => a['dialog'] === b['dialog']),
    filter((params: Params) => params['dialog'] === 'visible'),
    debounceTime(100),
    shareReplay({ refCount: false, bufferSize: 1 })
  );

  private _component: PolymorpheusComponent<VtEnterComponent> | null = null;

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
      from: new Date(new Date(new Date().getFullYear() - 2, 0, 1, 12).setUTCHours(0, 0, 0, 0)).toISOString(),
      to: new Date(new Date().setUTCHours(23, 59, 59, 0)).toISOString(),
    });

    this.onOpenDialog();
  }

  async onOpenDialog() {
    this._component = await import('desktop-page/enter')
      .then((m) => m.VtEnterComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._query$.pipe(switchMap(() => this._dialogEnterService.open(this._component))).subscribe();
  }
}

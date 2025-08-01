import { ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, OnInit } from '@angular/core';
import { Params, RouterOutlet } from '@angular/router';
import { CONTEXT_ACTION_EVENTS, DESKTOP_API, GlobalDateRangeService, QUERY_PARAMS } from 'tokens/desktop';
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
import { ActionDeletePosition } from '../common/plugins/action-delete-position';
import { ActionNewPosition } from '../common/plugins/action-new-position';
import { ActionShowPosition } from '../common/plugins/action-show-position';
import { ActionShowIdea } from '../common/plugins/action-show-idea';
import { ActionCopyIdea } from '../common/plugins/action-copy-idea';
import { TradeDialogService } from 'desktop-page/trade';
import { DIALOG, DialogService } from '@ui/components/dialog';

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
    {
      provide: CONTEXT_ACTION_EVENTS,
      useClass: ActionDeletePosition,
      multi: true,
    },
    {
      provide: CONTEXT_ACTION_EVENTS,
      useClass: ActionNewPosition,
      multi: true,
    },
    {
      provide: CONTEXT_ACTION_EVENTS,
      useClass: ActionShowPosition,
      multi: true,
    },
    {
      provide: CONTEXT_ACTION_EVENTS,
      useClass: ActionShowIdea,
      multi: true,
    },
    {
      provide: CONTEXT_ACTION_EVENTS,
      useClass: ActionCopyIdea,
      multi: true,
    },
    {
      provide: TradeDialogService,
      useFactory: (dialog: DialogService) => new TradeDialogService(dialog),
      deps: [DIALOG],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LkComponent implements OnInit {
  readonly #injector: Injector = inject(Injector);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #dialogTrade: TradeDialogService = inject(TradeDialogService);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _globalDateRangeService: GlobalDateRangeService = inject(GlobalDateRangeService);
  private readonly _dialogEnterService: EnterDialogService = inject(EnterDialogService);
  private readonly _queryEnter$: Observable<Params> = this._queryParams.pipe(
    takeUntilDestroyed(this.#destroyRef),
    startWith(this._queryParams.value()),
    distinctUntilChanged((a: Params, b: Params) => a['dialog'] === b['dialog']),
    filter((params: Params) => params['dialog'] === 'visible'),
    debounceTime(100),
    shareReplay({ refCount: false, bufferSize: 1 })
  );
  private readonly _queryTrade$: Observable<Params> = this._queryParams.pipe(
    takeUntilDestroyed(this.#destroyRef),
    startWith(this._queryParams.value()),
    distinctUntilChanged((a: Params, b: Params) => a['trade'] === b['trade']),
    filter((params: Params) => params['trade'] === 'visible'),
    debounceTime(100),
    shareReplay({ refCount: false, bufferSize: 1 })
  );

  private _componentEnter: PolymorpheusComponent<VtEnterComponent> | null = null;

  ngOnInit(): void {
    this._queryParams
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        shareReplay({
          bufferSize: 1,
          refCount: true,
        })
      )
      .subscribe((event: Params) => {
        const { type, id, group, dialog } = event;
        this._select.updateEvent({
          type: type || null,
          id: id || null,
          group: group || null,
          dialog: dialog || null,
        });
      });

    this._globalDateRangeService.setRange({
      from: new Date(new Date(new Date().getFullYear() - 2, 0, 1, 12).setUTCHours(0, 0, 0, 0)).toISOString(),
      to: new Date(new Date().setUTCHours(23, 59, 59, 0)).toISOString(),
    });

    this.onOpenDialog();

    this._queryTrade$
      .pipe(switchMap(() => this.#dialogTrade.openTradeDialog(this.#injector)))
      .subscribe(() => console.log('dialog service'));

    // this._queryParams.pipe(
    //   takeUntilDestroyed(this.#destroyRef),
    //   startWith(this._queryParams.value()),
    //   distinctUntilChanged((a: Params, b: Params) => a['trade'] === b['trade']),
    //   filter((params: Params) => params['trade'] === 'visible'),
    //   debounceTime(100)
    // );
  }

  async onOpenDialog() {
    this._componentEnter = await import('desktop-page/enter')
      .then((m) => m.VtEnterComponent)
      .then((c) => new PolymorpheusComponent(c, this.#injector));

    this._queryEnter$.pipe(switchMap(() => this._dialogEnterService.open(this._componentEnter))).subscribe();
  }
}

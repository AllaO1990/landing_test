import { TuiTabs } from '@taiga-ui/kit';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TUI_WINDOW_SIZE, TuiPopover } from '@taiga-ui/cdk';
import { TuiBreakpointService, TuiButton, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { combineLatest, distinctUntilChanged, filter, Observable, of, shareReplay, switchMap } from 'rxjs';
import { EnterActionComponent } from './action/action.component';
import { EnterIdeaComponent } from './idea/idea.component';
import { EnterSidebarComponent } from './sidebar/sidebar.component';
import { map, tap } from 'rxjs/operators';
import { InstrumentComponent } from './instrument/instrument.component';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { MOBILE_LIST, TABLET_LANDSCAPE_LIST, TABLET_PORTRAIT_LIST } from './enter.constants';
import { StockEvent } from 'types/stock-event';
import { EventSelected } from 'types/events';
import { LoaderComponent } from '@ui/components/loader';
import { SelectFacade } from 'stores/facades/select.facade';
import { ChartCandlestickComponent } from 'ui-common/lib/chart';
import { StockInstrument, StockPrice, WithLastPrice } from 'types/stock';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { StockListFacade } from 'stores/facades/stock-list.facade';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';

type ScreenOrientation = 'landscape' | 'portrait';

export interface TabItem {
  text: string;
  icon: string;
}

@Component({
  selector: 'lib-enter',
  standalone: true,
  imports: [
    NgIf,
    TuiButton,
    EnterActionComponent,
    EnterIdeaComponent,
    EnterSidebarComponent,
    DatePipe,
    AsyncPipe,
    TuiScrollbar,
    NgForOf,
    TuiTabs,
    TuiIcon,
    InstrumentComponent,
    LoaderComponent,
    ChartCandlestickComponent,
    SearchDialogDirective,
  ],
  templateUrl: './enter.component.html',
  styleUrl: './enter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VtEnterComponent {
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _stock: StockListFacade = inject(StockListFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  isEdit = false;

  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, {
    optional: true,
  });

  readonly data$: Observable<any> = this._select.event$.pipe(
    filter((event: StockEvent | null): event is StockEvent => event !== null),
    switchMap((event: StockEvent) => {
      this.isEdit = false;

      if (event.type === EventSelected.POSITION) {
        return this._select.position$;
      }

      if (event.type === EventSelected.IDEA) {
        return this._select.idea$;
      }

      if (event.type === EventSelected.STOCK_LIST) {
        this.isEdit = true;

        return this._select.instrument$.pipe(
          filter((instrument: StockInstrument | null): instrument is StockInstrument => instrument !== null),
          distinctUntilChanged((a, b) => a.id !== b.id),
          switchMap((instrument: StockInstrument) =>
            this._stock.getPrice([instrument.id]).pipe(
              filter((price: StockPrice<WithLastPrice> | null): price is StockPrice<WithLastPrice> => price !== null),
              map((price: StockPrice<WithLastPrice>) => price[instrument.id] || null),
              filter((price: WithLastPrice | null): price is WithLastPrice => price !== null),
              map((price: WithLastPrice) => {
                const quantity = Math.floor(50000 / price.last);

                return {
                  instrument,
                  createdAt: new Date().toISOString(),
                  inPositionDepositShare: 0,
                  price,
                  entries: [
                    {
                      date: '',
                      depositShare: null,
                      price: price.last,
                      quantity,
                      totalPrice: quantity * price.last,
                    },
                  ],
                  targets: [],
                  stop: {},
                };
              })
            )
          )
        );
      }

      return of(null);
    }),
    tap((data: any) => (this.isDisabled = data === null)),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  public readonly breakpoint$: Observable<TuiBreakpointMediaKey | null> = inject(TuiBreakpointService);
  public readonly orientation$: Observable<ScreenOrientation> = inject(TUI_WINDOW_SIZE).pipe(
    map(({ width, height }): ScreenOrientation => (width > height ? 'landscape' : 'portrait')),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public readonly tabs$: Observable<TabItem[] | null> = combineLatest([this.breakpoint$, this.orientation$]).pipe(
    map(([screen, orientation]): TabItem[] | null => this._condition(screen, orientation))
  );

  readonly size = 's';
  isDisabled = true;
  activeItemIndex = 0;

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }

  onSelect(event: StockInstrument | null): void {
    if (event !== null) {
      this._queryParams.update({
        // type: EventSelected.STOCK_LIST,
        id: event.id,
        // dialog: 'visible',
      });
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  private _condition(screen: TuiBreakpointMediaKey | null, orientation: ScreenOrientation): TabItem[] | null {
    if (screen === 'mobile') {
      return MOBILE_LIST;
    }

    if (screen === 'desktopSmall' && orientation === 'landscape') {
      if (this.activeItemIndex > 1) {
        this.activeItemIndex = 1;
      }
      return TABLET_LANDSCAPE_LIST;
    }

    if (screen === 'desktopSmall' && orientation === 'portrait') {
      if (this.activeItemIndex > 2) {
        this.activeItemIndex = 2;
      }
      return TABLET_PORTRAIT_LIST;
    }

    this.activeItemIndex = 0;
    return null;
  }
}

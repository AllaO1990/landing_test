import { TuiTable } from '@taiga-ui/addon-table';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, JsonPipe, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { WRAPPER_TABLE_HEADER } from './table.constants';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { TuiFormatNumberPipe, TuiHint, TuiIcon, TuiScrollable, TuiScrollbar } from '@taiga-ui/core';
import { INPUT_DATA } from '../constants';
import { StockId } from 'types/stock';
import { GetPositionTypePipe } from '@ui/pipes/get-posiotion-type.pipe';
import { GetStrategyNamePipe } from '@ui/pipes/get-strategy-name.pipe';
import { PortfolioFacade } from 'stores/facades/portfolio.facade';
import { Observable, tap } from 'rxjs';
import { PortfolioPosition } from 'types/portfolio';
import { LoaderComponent } from '@ui/components/loader';
import { PolymorpheusTemplate } from '@taiga-ui/polymorpheus';
import { TuiLet } from '@taiga-ui/cdk';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { EventSelected } from 'types/events';

@Component({
  selector: 'lib-wrapper-table',
  standalone: true,
  imports: [
    TuiTable,
    NgForOf,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    TuiScrollbar,
    AsyncPipe,
    CdkVirtualForOf,
    DatePipe,
    GetPositionTypePipe,
    TuiFormatNumberPipe,
    GetStrategyNamePipe,
    NgIf,
    TuiIcon,
    TuiScrollable,
    LoaderComponent,
    NgTemplateOutlet,
    TuiHint,
    JsonPipe,
    PolymorpheusTemplate,
    TuiLet,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WrapperTableComponent implements OnInit {
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _service: PortfolioFacade = inject(PortfolioFacade);

  readonly columns = [
    'date',
    'positionType',
    'ticker',
    'entry',
    'entryPosition',
    'out',
    'outPosition',
    'dividend',
    'profitRealized',
    'remainderInPosition',
    // 'profitNotRealized',
    'result',
    'deposit',
    'strategy',
    'broker',
    'comment',
    'author',
  ];

  readonly header = WRAPPER_TABLE_HEADER;

  data$: Observable<PortfolioPosition[] | null> = this._service.list$.pipe(
    tap(
      (list: PortfolioPosition[] | null) =>
        list &&
        this._queryParams.update({
          type: EventSelected.POSITION,
          id: list[0].ideaId,
        })
    )
  );

  data = INPUT_DATA;

  ngOnInit(): void {
    const today = new Date().setUTCHours(12, 0, 0, 0);
    const start = new Date(new Date(today).setDate(-365 + new Date(today).getDate())).toISOString();
    const end = new Date(today).toISOString();

    this._service.load({
      brokerId: 1,
      currencyId: 1,
      from: start,
      portfolioId: 4,
      to: end,
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackById(_: number, item: PortfolioPosition): StockId {
    return item.ideaId;
  }

  onClick(event: Event, item: PortfolioPosition): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.POSITION,
      id: item.ideaId,
    });
  }
}

import { TuiTable } from "@taiga-ui/addon-table";
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { WRAPPER_TABLE_HEADER } from './table.constants';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { TuiFormatNumberPipe, TuiScrollbar, TuiIcon } from '@taiga-ui/core';
import { INPUT_DATA } from '../constants';
import { StockId } from 'types/stock';
import { GetPositionTypePipe } from '@ui/pipes/get-posiotion-type.pipe';
import { GetStrategyNamePipe } from '@ui/pipes/get-strategy-name.pipe';

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
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WrapperTableComponent {
  readonly columns = [
    'date',
    'positionType',
    'ticker',
    'lastPrice',
    'costInPosition',
    'resultPrice',
    'costOutPosition',
    'dividend',
    'profitRealized',
    'remainderInPosition',
    'profitNotRealized',
    'result',
    'deposit',
    'strategy',
    'broker',
    'comment',
    'author',
  ];

  readonly header = WRAPPER_TABLE_HEADER;

  data = INPUT_DATA;

  trackByIndex(index: number): number {
    return index;
  }

  trackById(_: number, item: { id: StockId }): StockId {
    return item.id;
  }
}

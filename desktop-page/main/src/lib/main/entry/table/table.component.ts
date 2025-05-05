import { TuiTable } from '@taiga-ui/addon-table';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { TuiFormatNumberPipe, TuiLoader, TuiScrollable, TuiScrollbar } from '@taiga-ui/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { QUERY_PARAMS } from 'tokens/desktop';
import { EventSelected } from 'types/events';
import { StockId } from 'types/stock';
import { getColor, getRGBA } from 'utils/get-color';
import { QueryParams } from 'utils/query-params';
import { ENTRY_HEADER } from '../entry.constants';
import { EntryHeaderItem } from '../entry.types';
import { DatePassedPipe } from '../../common/pipe/date-passed.pipe';
import { GetStrategyNamePipe } from '@ui/pipes/get-strategy-name.pipe';
import { SelectFacade } from 'stores/facades/select.facade';
import { Position } from 'types/position';
import { ColorToPositionPipe } from './color.pipe';

@Component({
  selector: 'vt-entry-table',
  standalone: true,
  imports: [
    CommonModule,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
    TuiFormatNumberPipe,
    TuiLoader,
    TuiScrollbar,
    TuiTable,
    DatePassedPipe,
    GetStrategyNamePipe,
    TuiScrollable,
    ColorToPositionPipe,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryTableComponent {
  protected getColorBackGround = (v: number) => getRGBA(getColor(v), 0.1);

  private readonly _store: SelectFacade = inject(SelectFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  public readonly header: EntryHeaderItem[] = ENTRY_HEADER;
  public readonly columnList: string[] = this.header.map((item: { name: string }) => item.name);

  public activeIdeaId$: Observable<StockId | null> = this._store.idea$.pipe(distinctUntilChanged());

  @Input() data: Position[] | null = null;

  public trackById(index: number, item: Position): number | string | null {
    return item.id;
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public onDblclick(event: Event, item: Position): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.IDEA,
      id: item.id,
      dialog: 'visible',
    });
  }

  public onClick(event: Event, item: Position): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.IDEA,
      id: item.id,
    });
  }

  // private _conditionActive(selected: StockEvent): string | null {
  //   return selected.type === EventSelected.IDEA ? selected.id : null;
  // }
}

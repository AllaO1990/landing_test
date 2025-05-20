import { TuiTable } from '@taiga-ui/addon-table';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { OUT_HEADER } from '../out.constants';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  TuiDataList,
  TuiDataListComponent,
  TuiDialogService,
  TuiDropdown,
  TuiFormatNumberPipe,
  TuiHint,
  TuiIcon,
  TuiScrollable,
  TuiScrollbar,
} from '@taiga-ui/core';
import { OutHeaderItem } from '../out.types';
import { AsyncPipe, DatePipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Position } from 'types/position';
import { DatePassedPipe } from '../../common/pipe/date-passed.pipe';
import { Idea } from 'types/idea';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { getColor, getRGBA } from 'utils/get-color';
import { Observable, shareReplay } from 'rxjs';
import { StockId } from 'types/stock';
import { distinctUntilChanged } from 'rxjs/operators';
import { ColorPriceDirective, LastPriceDirective } from '@ui/components/price';
import { LoaderComponent } from '@ui/components/loader';
import { SelectFacade } from 'stores/facades/select.facade';
import { ColorOutToPositionPipe } from './color.pipe';
import { TUI_CONFIRM } from '@taiga-ui/kit';
import { IdeaFacade } from 'stores/facades/idea.facade';

@Component({
  selector: 'vt-out-table',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgTemplateOutlet,
    TuiTable,
    TuiScrollbar,
    TuiScrollable,
    TuiFormatNumberPipe,
    DatePipe,
    DatePassedPipe,
    AsyncPipe,
    LastPriceDirective,
    ColorPriceDirective,
    TuiHint,
    LoaderComponent,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    ColorOutToPositionPipe,
    TuiDataListComponent,
    TuiDataList,
    TuiDropdown,
    TuiIcon,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutTableComponent {
  protected getColorBackGround = (v: number) => getRGBA(getColor(v), 0.1);
  readonly #dialogDefaultService: TuiDialogService = inject(TuiDialogService);
  readonly #idea: IdeaFacade = inject(IdeaFacade);

  private readonly _store: SelectFacade = inject(SelectFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  public readonly header: OutHeaderItem[] = OUT_HEADER;
  public readonly columnList: string[] = this.header.map((item: { name: string }) => item.name);

  public activeIdeaId$: Observable<StockId | null> = this._store.idea$.pipe(
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  @Input() data: Position[] | null = null;

  onDblclick(event: Event, item: Position) {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.POSITION,
      id: item.id,
      dialog: 'visible',
    });
  }

  onNewPosition(event: Event, item: Position) {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.STOCK_LIST,
      id: item.instrument.id,
      dialog: 'visible',
    });
  }

  onDeletePosition(event: Event, item: Position) {
    event.preventDefault();

    const ideaId = item.id;

    if (ideaId !== null) {
      this.#dialogDefaultService
        .open<boolean>(TUI_CONFIRM, {
          appearance: 'dialog-confirm',
          size: 'auto',
          closeable: false,
          data: {
            content: '<p class="tui-text_h6">Удалить идею безвозвратно?</h2>',
            yes: 'Да',
            no: 'Нет',
          },
        })
        .subscribe((result: boolean) => {
          if (result) {
            this.#idea.deleteIdea(ideaId);
          }
        });
    }
  }

  onClick(event: Event, item: Idea): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.POSITION,
      id: item.id,
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackById(_: number, item: Position): StockId | null {
    return item.id;
  }
}

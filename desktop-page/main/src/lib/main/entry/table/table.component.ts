import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import {
  TuiFormatNumberPipeModule,
  TuiLoaderModule,
  TuiScrollbarModule,
} from '@taiga-ui/core';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { Idea } from 'types/idea';
import { EntryHeaderItem } from '../entry.types';
import { ENTRY_HEADER } from '../entry.constants';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import {
  EnterDialogModule,
  EnterDialogService,
  VtEnterComponent,
} from 'desktop-page/enter';
import { DesktopLkStore } from '../../../../../../../stores/desktop';
import { DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { DatePassedPipe } from './date-passed.pipe';
import { StrategyNamePipe } from './strategy-name.pipe';
import { EventSelected } from 'types/events';
import { StockId } from 'types/stock';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { StockEvent } from 'types/stock-event';
import { Observable } from 'rxjs';
import { getColor, getRGBA } from 'utils/get-color';
import { QueryParams } from 'utils/query-params';

@Component({
  selector: 'vt-entry-table',
  standalone: true,
  imports: [
    CommonModule,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
    TuiFormatNumberPipeModule,
    TuiLoaderModule,
    TuiScrollbarModule,
    TuiTableModule,
    VtEnterComponent,
    EnterDialogModule,
    DatePassedPipe,
    StrategyNamePipe,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryTableComponent {
  protected getColorBackGround = (v: number) => getRGBA(getColor(v), 0.1);

  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  protected readonly dialogEnterService: EnterDialogService =
    inject(EnterDialogService);

  public readonly header: EntryHeaderItem[] = ENTRY_HEADER;

  public readonly columnList: string[] = this.header.map(
    (item: { name: string }) => item.name
  );

  public activeIdeaId$: Observable<StockId | null> =
    this._store.selectedIdea$.pipe(
      map((result: Idea | null) => (result ? result.id : null)),
      distinctUntilChanged()
    );

  @Input() data: Idea[] | null = null;

  public trackById(index: number, item: Idea): number | string {
    return item.id;
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public onDblclick(event: Event, item: any): void {
    event.preventDefault();

    this.dialogEnterService
      .open(new PolymorpheusComponent(VtEnterComponent), {
        data: item,
      })
      .subscribe();

    // this.dialogService
    //   .open(new PolymorpheusComponent(VtEnterComponent), {
    //     // size: 'page',
    //     // closeable: false,
    //     // dismissible: false,
    //     data: item,
    //   })
    //   .subscribe();

    // console.log(this.dialogEnterService);
    // console.log(item);

    // this.dialogEnterService.openDialog(item).subscribe();
  }

  public onClick(event: Event, item: Idea): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.IDEA,
      id: item.id,
    });
  }

  private _conditionActive(selected: StockEvent): StockId | null {
    return selected.type === EventSelected.IDEA ? selected.id : null;
  }
}

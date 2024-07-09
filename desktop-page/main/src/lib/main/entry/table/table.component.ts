import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Injector, Input } from '@angular/core';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { TuiDialogService, TuiFormatNumberPipeModule, TuiLoaderModule, TuiScrollbarModule } from '@taiga-ui/core';
import { EnterDialogService, VtEnterComponent } from 'desktop-page/enter';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { EventSelected } from 'types/events';
import { Idea } from 'types/idea';
import { StockId } from 'types/stock';
import { StockEvent } from 'types/stock-event';
import { getColor, getRGBA } from 'utils/get-color';
import { QueryParams } from 'utils/query-params';
import { DesktopLkStore } from '../../../../../../../stores/desktop';
import { ENTRY_HEADER } from '../entry.constants';
import { EntryHeaderItem } from '../entry.types';
import { DatePassedPipe } from './date-passed.pipe';
import { StrategyNamePipe } from './strategy-name.pipe';

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
    // EnterDialogModule,
    DatePassedPipe,
    StrategyNamePipe,
    // TuiDialogModule,
    // EnterDialogComponent,
    // PolymorpheusModule,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryTableComponent {
  private readonly _injector: Injector = inject(Injector);

  protected getColorBackGround = (v: number) => getRGBA(getColor(v), 0.1);

  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  protected readonly dialogEnterService: EnterDialogService = inject(EnterDialogService);

  protected readonly dialogService: TuiDialogService = inject(TuiDialogService);

  public readonly header: EntryHeaderItem[] = ENTRY_HEADER;

  public readonly columnList: string[] = this.header.map((item: { name: string }) => item.name);

  public activeIdeaId$: Observable<StockId | null> = this._store.selectedIdea$.pipe(
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

  public onDblclick(event: Event, item: Idea): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.IDEA,
      id: item.id,
    });

    this.dialogEnterService.openDialog(item, this._injector).subscribe();
  }

  // public onClick(event: Event, item: Idea): void {
  //   event.preventDefault();
  //
  //   this._queryParams.update({
  //     type: EventSelected.IDEA,
  //     id: item.id,
  //   });
  //
  //   this.dialogEnterService.openDialog(item, this._injector).subscribe();
  // }

  private _conditionActive(selected: StockEvent): StockId | null {
    return selected.type === EventSelected.IDEA ? selected.id : null;
  }
}

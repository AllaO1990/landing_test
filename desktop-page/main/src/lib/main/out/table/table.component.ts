import { TuiTable } from '@taiga-ui/addon-table';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector, Input } from '@angular/core';
import { OUT_HEADER } from '../out.constants';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { TuiFormatNumberPipe, TuiHint, TuiScrollable, TuiScrollbar } from '@taiga-ui/core';
import { OutHeaderItem } from '../out.types';
import { AsyncPipe, DatePipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Position } from 'types/position';
import { DatePassedPipe } from '../../common/pipe/date-passed.pipe';
import { Idea } from 'types/idea';
import { EventSelected } from 'types/events';
import { QueryParams } from 'utils/query-params';
import { DESKTOP_STORE, QUERY_PARAMS } from 'tokens/desktop';
import { EnterDialogService, VtEnterComponent } from 'desktop-page/enter';
import { getColor, getRGBA } from 'utils/get-color';
import { Observable, startWith, switchMap } from 'rxjs';
import { StockId } from 'types/stock';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { DesktopLkStore } from 'stores/desktop';
import { ColorPriceDirective, LastPriceDirective } from '@ui/components/price';
import { LoaderComponent } from '@ui/components/loader';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutTableComponent implements AfterViewInit {
  protected getColorBackGround = (v: number) => getRGBA(getColor(v), 0.1);

  private readonly _injector: Injector = inject(Injector);
  private readonly _store: DesktopLkStore = inject(DESKTOP_STORE);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _dialogEnterService: EnterDialogService = inject(EnterDialogService);
  private readonly _component: PolymorpheusComponent<VtEnterComponent> = new PolymorpheusComponent(
    VtEnterComponent,
    this._injector
  );

  public readonly header: OutHeaderItem[] = OUT_HEADER;
  public readonly columnList: string[] = this.header.map((item: { name: string }) => item.name);

  public activeIdeaId$: Observable<StockId | null> = this._store.selectedPosition$.pipe(
    map((result: Position | null) => (result ? result.id : null)),
    distinctUntilChanged()
  );

  @Input() data: Position[] | null = null;

  ngAfterViewInit(): void {
    this._queryParams
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        startWith(this._queryParams.value()),
        filter((params: Params) => params['id'] && params['type'] && params['dialog'] === 'visible'),
        switchMap(() => this._dialogEnterService.open(this._component))
      )
      .subscribe();
  }

  onDblclick(event: Event, item: Position): void {
    event.preventDefault();

    this._queryParams.update({
      type: EventSelected.POSITION,
      id: item.id,
      dialog: 'visible',
    });
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

  trackById(_: number, item: Position): StockId {
    return item.id;
  }
}

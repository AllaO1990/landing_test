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
import { QUERY_PARAMS } from 'tokens/desktop';
import { EnterDialogService, VtEnterComponent } from 'desktop-page/enter';
import { getColor, getRGBA } from 'utils/get-color';
import { Observable, shareReplay, startWith, switchMap } from 'rxjs';
import { StockId } from 'types/stock';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { ColorPriceDirective, LastPriceDirective } from '@ui/components/price';
import { LoaderComponent } from '@ui/components/loader';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { Params } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SelectFacade } from 'stores/facades/select.facade';

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
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _dialogEnterService: EnterDialogService = inject(EnterDialogService);
  private readonly _query$: Observable<Params> = this._queryParams.pipe(
    takeUntilDestroyed(this._destroyRef),
    startWith(this._queryParams.value()),
    filter((params: Params) => params['id'] && params['type'] && params['dialog'] === 'visible'),
    shareReplay({ refCount: false, bufferSize: 1 })
  );
  private _component: PolymorpheusComponent<VtEnterComponent> | null = null;

  public readonly header: OutHeaderItem[] = OUT_HEADER;
  public readonly columnList: string[] = this.header.map((item: { name: string }) => item.name);

  public activeIdeaId$: Observable<StockId | null> = this._select.position$.pipe(
    map((result: Position | null) => (result ? result.id : null)),
    distinctUntilChanged()
  );

  @Input() data: Position[] | null = null;

  ngAfterViewInit() {
    this.onOpenDialog();
  }

  async onOpenDialog() {
    this._component = await import('desktop-page/enter')
      .then((m) => m.VtEnterComponent)
      .then((c) => new PolymorpheusComponent(c, this._injector));

    this._query$.pipe(switchMap(() => this._dialogEnterService.open(this._component))).subscribe();
  }

  onDblclick(event: Event, item: Position) {
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

import { TuiTabs } from '@taiga-ui/kit';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TUI_WINDOW_SIZE, TuiPopover } from '@taiga-ui/cdk';
import { TuiBreakpointService, TuiButton, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { combineLatest, distinctUntilChanged, filter, Observable, shareReplay, startWith } from 'rxjs';
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
import { StockId, StockInstrument } from 'types/stock';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import { StockPosition } from 'types/position';
import { IdeaFacade } from 'stores/facades/idea.facade';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    ReactiveFormsModule,
  ],
  templateUrl: './enter.component.html',
  styleUrl: './enter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VtEnterComponent implements AfterViewInit {
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _idea: IdeaFacade = inject(IdeaFacade);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);

  private readonly _ideaId$: Observable<StockId | null> = this._select.event$.pipe(
    takeUntilDestroyed(this._destroyRef),
    filter((event: StockEvent | null): event is StockEvent => event !== null),
    map((event: StockEvent) =>
      event.type === EventSelected.IDEA || event.type === EventSelected.POSITION ? event.id : null
    ),
    distinctUntilChanged()
  );

  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, {
    optional: true,
  });

  ideaId: number | null = null;
  ideaAuthor: string | null = null;
  ideaParentId: number | null = null;

  readonly form: FormGroup = new FormGroup({
    actions: new FormGroup({
      entries: new FormArray([]),
      outs: new FormArray([]),
    }),
    idea: new FormGroup({
      amount: new FormControl(null, Validators.required),
      entry: new FormControl(null, Validators.required),
      goals: new FormArray([], Validators.required),
      stop: new FormControl(null, Validators.required),
      instrumentId: new FormControl(null, Validators.required),
      portfolioId: new FormControl(null, Validators.required),
      expirationDate: new FormControl(null),
      strategyId: new FormControl(null, Validators.required),
      positionType: new FormControl(null, Validators.required),
      comment: new FormControl(''),
      parentId: new FormControl(null),
      watch: new FormControl(true, Validators.required),
    }),
  });

  readonly data$: Observable<StockPosition> = this._idea.idea$.pipe(
    filter((idea: StockPosition | null): idea is StockPosition => idea !== null),
    tap((data: StockPosition) => {
      console.log('isShowSearch$', data);
      this.ideaId = data.idea.id;
      this.ideaParentId = (data.idea as any).parentId || null;
      this.ideaAuthor = data.idea.author;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly isShowSearch$: Observable<boolean> = this.data$.pipe(
    map((data: StockPosition) => data.idea.id === null),
    distinctUntilChanged(),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
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
  isDisabled = false;
  activeItemIndex = 0;

  ngAfterViewInit(): void {
    this._idea.loadIdea(this._ideaId$);

    // this.form.valueChanges.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((res) => console.log('form', res));
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }

  onSearch(event: StockInstrument | null): void {
    if (event !== null) {
      this._queryParams.update({
        type: EventSelected.STOCK_LIST,
        id: event.id,
      });
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  onSubmit(event: Event, ideaId: number | null): void {
    event.preventDefault();

    if (ideaId === null) {
      this._idea.createIdea(this.form.value);
    } else {
      this._idea.editIdea({ id: ideaId.toString(), body: this.form.value });
    }

    console.log(this.form.value);
  }

  onDelete(event: Event, ideaId: number | null): void {
    event.preventDefault();

    if (ideaId !== null) {
      this._idea.deleteIdea(ideaId.toString());
    }
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

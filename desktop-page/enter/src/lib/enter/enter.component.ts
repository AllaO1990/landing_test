import { TuiButtonLoading, TuiTabs } from '@taiga-ui/kit';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TUI_WINDOW_SIZE, TuiPopover } from '@taiga-ui/cdk';
import { TuiAlertService, TuiBreakpointService, TuiButton, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  merge,
  Observable,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
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
import { StockPosition, StockPositionIdeaEntry, StockPositionStop, StockPositionTarget } from 'types/position';
import { IdeaFacade } from 'stores/facades/idea.facade';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnterIdeaSubscribeDirective } from './enter.directive';

type ScreenOrientation = 'landscape' | 'portrait';

export interface TabItem {
  text: string;
  icon: string;
}

function maxAmount(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const entries = control.value.entries;
    const targets = control.value.targets;

    if (!entries) {
      return null;
    }

    if (entries.length === 0 || entries[0] === null) {
      return null;
    }

    if (targets && targets.length === 0) {
      return null;
    }

    const targetsAmount = targets
      .filter((item: any) => item !== null)
      .reduce(
        (
          acc: number,
          item: {
            amount: number;
          }
        ) => (acc += item.amount),
        0
      );

    return entries[0].quantity !== targetsAmount ? { maxAmount: true } : null;
  };
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
    EnterIdeaSubscribeDirective,
    TuiButtonLoading,
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
  readonly #alerts: TuiAlertService = inject(TuiAlertService);

  private readonly _ideaId$: Observable<StockId | null> = this._select.event$.pipe(
    takeUntilDestroyed(this._destroyRef),
    filter((event: StockEvent | null): event is StockEvent => event !== null),
    map((event: StockEvent) =>
      event.type === EventSelected.IDEA ||
      event.type === EventSelected.POSITION ||
      event.type === EventSelected.TRANSACTION
        ? event.id
        : null
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
    actions: new FormControl({ entries: [], outs: [], position: null }),
    idea: new FormControl({ entries: [], targets: [], stop: [] }, maxAmount()),
    sidebar: new FormControl({
      instrumentId: null,
      portfolioId: null,
      expirationDate: null,
      strategyId: null,
      positionType: null,
      comment: '',
      parentId: null,
    }),
    watch: new FormControl(true),
    minPriceIncrement: new FormControl(null),
  });

  get controlActions(): FormControl {
    return this.form.get('actions') as FormControl;
  }

  get controlIdea(): FormControl {
    return this.form.get('idea') as FormControl;
  }

  get controlSidebar(): FormControl {
    return this.form.get('sidebar') as FormControl;
  }

  get controlWatch(): FormControl {
    return this.form.get('watch') as FormControl;
  }

  readonly data$: Observable<StockPosition> = this._idea.idea$.pipe(
    filter((idea: StockPosition | null): idea is StockPosition => idea !== null),
    tap((data: StockPosition) => {
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
  isDisabled$: Observable<boolean> = merge(this.form.statusChanges).pipe(
    map((_) => this.form.invalid || this.form.pristine),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  activeItemIndex = 0;

  ngAfterViewInit(): void {
    this._idea.loadIdea(this._ideaId$);

    this.controlIdea.statusChanges
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        map((_) => this.controlIdea.errors),
        filter((value: ValidationErrors | null): value is ValidationErrors => value !== null),
        filter((value: ValidationErrors) => value['maxAmount']),
        switchMap((_) => {
          return this.#alerts.open('Количество во входе не соответсвтует колучеству в целях', {
            appearance: 'negative',
            autoClose: 3000,
          });
        })
      )
      .subscribe();

    this.data$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result: StockPosition) => {
      const targets = this._getIdeaTargets(result.idea.targets);
      const entries = this._getIdeaEntries(result.idea.entries);
      const stop = this._getIdeStop(result.idea.stop ? [result.idea.stop] : []);

      this.form.patchValue({
        actions: result.actions,
        idea: {
          entries,
          targets,
          stop,
        },
        sidebar: {
          strategyId: 4,
          positionType: result.idea.positionType,
          expirationDate: null,
          instrumentId: result.idea.instrument.id,
          parentId: result.idea.parentId,
          portfolioId: result.idea.portfolioId,
          comment: '',
        },
        minPriceIncrement: result.idea.instrument.minPriceIncrement,
      });
    });
  }

  trackByIndex(index: number): number {
    return index;
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

  onSubscribe(event: boolean | null): void {
    console.log(event);

    this.controlWatch.patchValue(event);
    // if (ideaId === null) {
    // } else {
    //   console.log(ideaId);
    // }
  }

  onSubmit(event: Event, ideaId: number | null): void {
    event.preventDefault();

    if (ideaId === null) {
      this._idea.createIdea(this._getValueToSubmit(this.form.value));
    } else {
      this._idea.editIdea({ id: ideaId.toString(), body: this._getValueToSubmit(this.form.value) });
    }
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

  private _getValueToSubmit(value: any | null): any {
    if (value === null) {
      return null;
    }

    return {
      actions: {
        entries: value.actions.entries.map((item: any) => ({
          amount: item.amount,
          brokerId: item.brokerId,
          date: item.date,
          price: item.price,
        })),
        outs: value.actions.outs.map((item: any) => ({
          amount: item.amount,
          brokerId: item.brokerId,
          date: item.date,
          price: item.price,
        })),
      },
      idea: {
        goals:
          value &&
          (value.idea.targets || []).map((item: any) => ({
            amount: item.amount,
            goal: item.price,
          })),
        instrumentId: value.sidebar.instrumentId,
        parentId: value.sidebar.parentId,
        portfolioId: value.sidebar.portfolioId,
        positionType: value.sidebar.positionType,
        strategyId: value.sidebar.strategyId,
        amount: value.idea.entries[0] ? value.idea.entries[0].quantity : null,
        entry: value.idea.entries[0] ? value.idea.entries[0].price : null,
        stop: value.idea.stop[0] ? value.idea.stop[0].price : null,
        watch: value.watch || true,
      },
    };
  }

  private _getIdeaEntries(list: any[]): StockPositionIdeaEntry[] {
    return list.map((item) => ({
      date: item.date || null,
      depositShare: item.depositShare || null,
      broker: null,
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    }));
  }

  private _getIdeaTargets(list: any[]): StockPositionTarget[] {
    return list.map((item) => ({
      price: item.price,
      amount: item.amount,
      profit: item.profit || null,
      profitPercent: item.profitPercent || null,
      depositShare: item.depositShare || null,
      totalPrice: item.price * item.amount,
      reached: false,
      stopDate: item.stopDate || null,
      broker: null,
    }));
  }

  private _getIdeStop(list: any[]): StockPositionStop[] {
    return list.map((item) => ({
      depositShare: item.depositShare || null,
      lossPercent: item.lossPercent || null,
      loss: item.loss || null,
      price: item.price,
      stopCandleDate: item.stopCandleDate || null,
      amount: item.amount || null,
      amountPercent: item.amountPercent || 100,
    }));
  }
}

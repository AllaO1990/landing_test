import { TUI_CONFIRM, TuiButtonLoading, TuiTabs } from '@taiga-ui/kit';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, Injector } from '@angular/core';
import { TUI_WINDOW_SIZE, TuiPopover } from '@taiga-ui/cdk';
import {
  TuiAlertService,
  TuiBreakpointService,
  TuiButton,
  TuiDialogService,
  TuiHintDirective,
  TuiIcon,
  TuiNotification,
  TuiScrollbar,
} from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT, PolymorpheusComponent, PolymorpheusContent } from '@taiga-ui/polymorpheus';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  merge,
  Observable,
  of,
  pairwise,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  timer,
} from 'rxjs';
import { EnterActionComponent } from './action/action.component';
import { EnterIdeaComponent } from './idea/idea.component';
import { EnterSidebarComponent } from './sidebar/sidebar.component';
import { map } from 'rxjs/operators';
import { InstrumentComponent } from 'ui-common/lib/instrument/instrument.component';
import { TuiBreakpointMediaKey } from '@taiga-ui/core/services/breakpoint.service';
import { MOBILE_LIST, TABLET_LANDSCAPE_LIST, TABLET_PORTRAIT_LIST } from './enter.constants';
import { EventSelected } from 'types/events';
import { LoaderComponent } from '@ui/components/loader';
import { SelectFacade } from 'stores/facades/select.facade';
import { ChartCandlestickComponent } from 'ui-common/lib/chart';
import { StockInstrument } from 'types/stock';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { SearchDialogDirective } from 'ui-common/lib/dialog-search';
import {
  StockPosition,
  StockPositionActionEntry,
  StockPositionIdeaEntry,
  StockPositionStop,
  StockPositionTarget,
} from 'types/position';
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
import { triggerHeightAnimations } from '@ui/animations/height.animations';
import { EnterFinishComponent } from './finish/finish.component';
import { DIALOG, DialogService } from '@ui/components/dialog';
import { Params } from '@angular/router';

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
    TuiNotification,
    TuiHintDirective,
  ],
  templateUrl: './enter.component.html',
  styleUrl: './enter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [triggerHeightAnimations],
})
export class VtEnterComponent implements AfterViewInit {
  private readonly _dialogDefaultService: TuiDialogService = inject(TuiDialogService);
  private readonly _destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _select: SelectFacade = inject(SelectFacade);
  private readonly _idea: IdeaFacade = inject(IdeaFacade);
  private readonly _alerts = inject(TuiAlertService);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  private readonly _isShowCopyNotify$: Subject<void> = new Subject<void>();
  readonly #injector: Injector = inject(Injector);
  readonly #dialog: DialogService = inject(DIALOG);

  #dialogFinish: PolymorpheusContent<EnterFinishComponent> | null = null;

  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, {
    optional: true,
  });

  readonly isDisableTrade$: Observable<boolean> = this._idea.instrument$.pipe(
    switchMap((instrument: StockInstrument | null) => {
      if (instrument && instrument.source === 'binance') {
        return of(true);
      }

      return this._queryParams.pipe(
        startWith(this._queryParams.value()),
        map((value: Params) => value['id'] && (value['type'] === 'position' || value['type'] === 'idea')),
        map((value: boolean | null) => !value),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    })
  );

  readonly form: FormGroup = new FormGroup({
    actions: new FormControl({ entries: [], dividends: [], commissions: [], outs: [], position: null }),
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
    lastPrice: new FormControl(null),
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

  readonly maxAmount$: Observable<boolean> = this.controlIdea.statusChanges.pipe(
    takeUntilDestroyed(this._destroyRef),
    map((_) => this.controlIdea.errors),
    map((value: ValidationErrors | null) => Boolean(value && value['maxAmount'])),
    distinctUntilChanged()
  );

  readonly data$: Observable<StockPosition> = this._idea.idea$.pipe(
    filter((idea: StockPosition | null): idea is StockPosition => idea !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly isShowSearch$: Observable<boolean> = this.data$.pipe(
    map((data: StockPosition) => data.idea.id === null),
    distinctUntilChanged(),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly isShowCopyNotify$: Observable<boolean> = this._isShowCopyNotify$.pipe(
    switchMap(() =>
      timer(3000).pipe(
        map((_) => false),
        startWith(true)
      )
    ),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly isCanCopy$: Observable<boolean> = this.data$.pipe(
    map((data: StockPosition) => data.idea.author === 'bot'),
    distinctUntilChanged(),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly isLoading$: Observable<boolean> = this._idea.isLoading$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

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
    this.data$
      .pipe(startWith(null), takeUntilDestroyed(this._destroyRef), pairwise())
      .subscribe(([last, result]: [StockPosition | null, StockPosition | null]) => {
        // console.log(result);
        if (last !== null && result !== null) {
          if (
            result.idea.id !== null &&
            last.idea.id === result.idea.id &&
            last.idea.instrument.id === result.idea.instrument.id
          ) {
            this._alerts.open(null, { appearance: 'positive', label: 'Данные Обновлены' }).subscribe();
            // this._idea.loadFigures(result.idea.id);
            this._idea.loadFigures({
              ideaId: result.idea.id,
              instrumentId: result.idea.instrument.id,
            });

            const params = this._getDialogFinishType(result);

            if (params !== null) {
              this._showDialogFinish(params);
            }
          }
        }

        if (result) {
          const targets = this._getIdeaTargets(
            result.idea.targets,
            result.actions.outs,
            result.idea.positionType === 'long' ? 1 : -1
          );
          const entries = this._getIdeaEntries(result.idea.entries, result.actions.entries);
          const stop = this._getIdeStop(
            result.idea.stop ? [result.idea.stop] : [],
            result.actions.outs,
            result.idea.positionType === 'long' ? 1 : -1
          );

          const action: 'disable' | 'enable' = result.idea.author === 'bot' ? 'disable' : 'enable';

          // if (result.actions.entries.length !== 0) {
          //   action = 'disable';
          // }

          this.form.patchValue({
            actions: {
              ...result.actions,
              dividends: result.dividends,
              commissions: result.comissions.map((item) => ({
                ...item,
                profitPct: item.profitPct && Math.abs(item.profitPct as number),
              })),
            },
            idea: {
              entries,
              targets,
              stop,
            },
            sidebar: {
              author: result.idea.author,
              strategyId: null,
              positionType: result.idea.positionType,
              expirationDate: null,
              instrumentId: result.idea.instrument.id,
              parentId: result.idea.parentId,
              portfolioId: result.idea.portfolioId,
              comment: '',
            },
            lastPrice: result.idea.lastPrice,
            minPriceIncrement: result.idea.instrument.minPriceIncrement,
          });

          this.controlIdea[action]();
          // this.controlActions[action]();
          this.controlSidebar[action]();
        }
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  onClose(event: Event): void {
    event.preventDefault();

    if (this.form.pristine) {
      this.context.$implicit.complete();

      return;
    }

    this._dialogDefaultService
      .open<boolean>(TUI_CONFIRM, {
        appearance: 'dialog-confirm',
        size: 'auto',
        closeable: false,
        data: {
          content: '<p class="tui-text_h6">Данные не сохранены.<br/> Хотите закрыть?</h2>',
          yes: 'Да',
          no: 'Нет',
        },
      })
      .subscribe((result: boolean) => {
        if (result) {
          this.context.$implicit.complete();
        }
      });
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
    this.controlWatch.patchValue(event);
  }

  onSubmit(event: Event, ideaId: number | null): void {
    event.preventDefault();

    if (ideaId === null) {
      this._idea.createIdea(this._getValueToSubmit(this.form.getRawValue()));
    } else {
      this._idea.editIdea({ id: ideaId, body: this._getValueToSubmit(this.form.getRawValue()) });
    }
  }

  onDelete(event: Event, ideaId: number | null): void {
    event.preventDefault();

    if (ideaId !== null) {
      this._dialogDefaultService
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
            this._idea.deleteIdea(ideaId);
          }
        });
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
      dividends: value.actions.dividends.map((item: any) => ({
        amount: item.amount,
        brokerId: item.brokerId,
        date: item.date,
        size: item.size,
      })),
      comissions: value.actions.commissions.map((item: any) => ({
        brokerId: item.brokerId,
        comment: item.comment,
        date: item.date,
        size: item.size,
      })),
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
        stop: value.idea.stop[0] && value.idea.stop[0].price ? value.idea.stop[0].price : null,
        watch: value.watch || true,
      },
    };
  }

  private _getIdeaEntries(list: any[], actions: StockPositionActionEntry[]): StockPositionIdeaEntry[] {
    const check = !!(actions[0] && actions[0].date);

    return list
      .filter((item) => item.price !== 0)
      .map((item, index: number) => ({
        check: index === 0 && check,
        date: item.date || null,
        depositShare: item.depositShare || null,
        broker: null,
        price: item.price || null,
        quantity: item.quantity || null,
        totalPrice: item.totalPrice || null,
      }));
  }

  private _getDialogFinishType(value: StockPosition | null): 'profit' | 'loss' | null {
    if (value === null) {
      return null;
    }

    const {
      actions: { entries, outs },
      idea: { positionType },
    } = value;

    const getCommon = (
      list: {
        amount: number;
        price: number;
      }[]
    ) =>
      list.reduce(
        (
          acc: { amount: number; total: number },
          item: {
            amount: number;
            price: number;
          }
        ) => {
          acc.amount += item.amount;
          acc.total += item.price * item.amount;

          return acc;
        },
        { amount: 0, total: 0 }
      );

    const entry = getCommon(entries);
    const out = getCommon(outs);

    if (entry.amount !== out.amount || entry.amount === 0) {
      return null;
    }

    if (positionType === 'long') {
      return out.total > entry.total ? 'profit' : 'loss';
    }

    return out.total < entry.total ? 'profit' : 'loss';
  }

  private async _showDialogFinish(type: 'profit' | 'loss' | null = null): Promise<void> {
    if (this.#dialogFinish === null) {
      this.#dialogFinish = await import('./finish/finish.component')
        .then((m) => m.EnterFinishComponent)
        .then((c) => new PolymorpheusComponent(c, this.#injector));
    }

    this.#dialog
      .open(this.#dialogFinish, {
        appearance: 'dialog-block',
        data: { type },
      })
      .subscribe();
  }

  private _getIdeaTargets(list: any[], outs: any[] = [], direction: 1 | -1 = 1): StockPositionTarget[] {
    return list.map((item) => {
      let stopDate = item.stopDate;

      if (stopDate === null) {
        const findIndex = outs.findIndex((out) => {
          if (direction === 1) {
            return out.price * 1.005 >= item.price;
          }
          return out.price * 0.995 <= item.price;
        });

        if (findIndex !== -1) {
          stopDate = outs[findIndex].date;
        }
      }

      return {
        price: item.price || null,
        amount: item.amount || null,
        profit: item.profit || null,
        profitPercent: item.profitPercent || null,
        depositShare: item.depositShare || null,
        totalPrice: item.price * item.amount,
        reached: false,
        stopDate: stopDate || null,
        broker: null,
      };
    });
  }

  private _getIdeStop(list: any[], outs: any[] = [], direction: 1 | -1 = 1): StockPositionStop[] {
    return list
      .filter((item) => item.price !== 0)
      .map((item) => {
        let stopDate = item.stopDate;

        if (stopDate === null) {
          const findIndex = outs.findIndex((out) => {
            if (direction === 1) {
              return out.price * 0.995 <= item.price;
            }
            return out.price * 1.005 >= item.price;
          });

          if (findIndex !== -1) {
            stopDate = outs[findIndex].date;
          }
        }

        return {
          depositShare: item.depositShare || null,
          lossPercent: item.lossPercent || null,
          loss: item.loss || null,
          price: item.price || null,
          stopCandleDate: item.stopCandleDate || stopDate,
          amount: item.amount || null,
          amountPercent: item.amountPercent || null,
        };
      });
  }

  onCopy(event: Event): void {
    event.preventDefault();

    this._idea.updateIdeaUser();
    this._isShowCopyNotify$.next();

    setTimeout(() => {
      this.form.markAsDirty();
    }, 500);
  }

  onTrade(event: MouseEvent): void {
    event.preventDefault();

    this._queryParams.update({
      trade: 'visible',
    });
  }
}

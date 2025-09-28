import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { TradeFormComponent } from '../form/form.component';
import { TuiButton } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../common/api.service';
import { TradeStore } from '../common/store';
import { BehaviorSubject, filter, map, Observable, pairwise, startWith, Subject, switchMap, timer } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValue } from '../form/form.types';

@Component({
  selector: 'trade-layout',
  standalone: true,
  imports: [TradeFormComponent, TuiButton, ReactiveFormsModule, AsyncPipe],
  templateUrl: './layout.component.html',
  styleUrls: ['../common/dialog.scss', './layout.component.scss'],
  providers: [
    ApiService,
    {
      provide: TradeStore,
      useFactory: (api: ApiService) => new TradeStore(api),
      deps: [ApiService],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements AfterViewInit, OnDestroy {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #store: TradeStore = inject(TradeStore);
  readonly #isSubmitted$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly formGroup: FormGroup = new FormGroup({
    trade: new FormControl(null),
  });

  readonly isDisabled$: Observable<boolean> = this.formGroup.valueChanges.pipe(
    map((value) => ({ entry: value.trade.entry, out: value.trade.out })),
    map((value: { entry: { status: number }[]; out: { status: number }[] }) => {
      const { entry, out } = value;

      if (!entry || !out) {
        return true;
      }
      if (entry.length === 0 && out.length === 0) {
        return true;
      }

      const entryIndex = entry.findIndex((item) => item.status === 0);
      const outIndex = out.findIndex((item) => item.status === 0);

      return entryIndex === -1 && outIndex === -1;
    })
  );

  ngAfterViewInit(): void {
    this.#store.loadOrderTypes();

    this.#isSubmitted$
      .asObservable()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        filter((isSubmitted: boolean) => isSubmitted),
        switchMap(() =>
          this.formGroup.valueChanges.pipe(
            switchMap((value) => timer(100).pipe(map(() => value))),
            startWith(this.formGroup.value),
            map((value: { trade: { entry: ControlValue[] } }): ControlValue[] => value.trade.entry),
            pairwise(),
            // tap(([first, second]: [ControlValue[], ControlValue[]]) =>
            //   console.log(first, first[0] && first[0].status, second[0] && second[0].status)
            // ),
            filter(
              ([first, second]: [ControlValue[], ControlValue[]]) =>
                (!first || !first[0] || (first[0] && first[0].status !== 2)) &&
                second &&
                second[0] &&
                second[0].status === 2
            ),
            // tap(([first, second]: [ControlValue[], ControlValue[]]) =>
            //   console.log('after filter', first[0] && first[0].status, second, second[0] && second[0].status)
            // ),
            map((data: [ControlValue[], ControlValue[]]) => data[1])
          )
        )
        // take(1)
      )
      .subscribe(() => {
        const {
          filter: { account, instrument, source },
          out,
        } = this.formGroup.value.trade;

        if (account && instrument && source) {
          const outOrders = this._getOrders(
            out.filter((item: { status: number }) => item.status === 0),
            account.accountId,
            instrument.id,
            source.id
          );

          if (outOrders.length > 0) {
            this.#store.addOrders(outOrders);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.#isSubmitted$.complete();
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    this.#isSubmitted$.next(true);
    const { filter, entry, out } = this.formGroup.getRawValue().trade;
    const { account, instrument, source } = filter;

    const entryOrders = this._getOrders(
      entry.filter((item: { status: number }) => item.status === 0),
      account.accountId,
      instrument.id,
      source.id
    );

    if (entryOrders.length > 0) {
      this.#store.addOrders(entryOrders);

      return;
    }

    const outOrders = this._getOrders(
      out.filter((item: { status: number }) => item.status === 0),
      account.accountId,
      instrument.id,
      source.id
    );

    if (outOrders.length > 0) {
      this.#store.addOrders(outOrders);
    }
  }

  private _getOrders(orders: any[], accountId: string, instrumentId: string, sourceId: number): any[] {
    return orders.map((item) => {
      const { total, quantity, lots, lot, ...order } = item;

      return {
        ...order,
        quantity: lots,
        // quantity: getNumberPrecision(quantity / lot, 0),
        lot,
        accountId,
        instrumentId,
        sourceId,
      };
    });
  }
}

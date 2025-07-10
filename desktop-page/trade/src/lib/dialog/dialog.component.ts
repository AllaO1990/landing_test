import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Injector,
  OnDestroy,
} from '@angular/core';
import { TradeLayoutComponent } from '../layout/layout.component';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiButton } from '@taiga-ui/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Params } from '@angular/router';
import { TradeDialogService } from './dialog.service';

@Component({
  selector: 'trade-dialog',
  standalone: true,
  imports: [TradeLayoutComponent, TuiButton],
  templateUrl: './dialog.component.html',
  styleUrls: ['../common/dialog.scss', './dialog.component.scss'],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogTradeComponent implements AfterViewInit, OnDestroy {
  readonly #injector: Injector = inject(Injector);
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly #dialog: TradeDialogService = inject(TradeDialogService);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  ngAfterViewInit(): void {
    this.#queryParams
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        filter((params: Params) => !params['trade'])
      )
      .subscribe(() => this.context.completeWith());
  }

  ngOnDestroy(): void {
    const { trade, ...other } = this.#queryParams.value();
    this.#queryParams.update(other, '');
  }

  onClose(event: Event): void {
    event.preventDefault();

    this.context.$implicit.complete();
  }

  onConfirm(event: Event): void {
    event.preventDefault();

    this.#dialog.openTradeConfirm(this.#injector).subscribe((value) => console.log(value));
    // this.context.$implicit.complete();
  }
}

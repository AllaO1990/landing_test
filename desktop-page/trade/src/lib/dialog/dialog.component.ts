import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Params } from '@angular/router';
import { LayoutComponent } from '../layout/layout.component';

@Component({
  selector: 'trade-dialog',
  standalone: true,
  imports: [LayoutComponent],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogTradeComponent implements AfterViewInit, OnDestroy {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  readonly #queryParams: QueryParams = inject(QUERY_PARAMS);
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
}

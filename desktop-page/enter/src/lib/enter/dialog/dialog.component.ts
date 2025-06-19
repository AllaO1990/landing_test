import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { POLYMORPHEUS_CONTEXT, PolymorpheusOutlet } from '@taiga-ui/polymorpheus';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { TuiDialogCloseService } from '@taiga-ui/core';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';
import { filter } from 'rxjs';
import { Params } from '@angular/router';

@Component({
  selector: 'lib-enter-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  standalone: true,
  imports: [PolymorpheusOutlet],
  providers: [TuiDialogCloseService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterDialogComponent implements AfterViewInit, OnDestroy {
  readonly #destroyRef: DestroyRef = inject(DestroyRef);
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);
  private _close$ = inject(TuiDialogCloseService);

  constructor() {
    this._close$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.context.$implicit.complete());
  }

  ngAfterViewInit(): void {
    this._queryParams
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        filter((params: Params) => !params['dialog'])
      )
      .subscribe(() => this.context.completeWith());
  }

  onClick(response: boolean): void {
    this.context.completeWith(response);
  }

  ngOnDestroy(): void {
    const { dialog, ...other } = this._queryParams.value();
    this._queryParams.update(other, '');
  }
}

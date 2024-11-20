import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { POLYMORPHEUS_CONTEXT, PolymorpheusOutlet, PolymorpheusTemplate } from '@taiga-ui/polymorpheus';
import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { TuiButton, TuiDialogCloseService } from '@taiga-ui/core';
import { QueryParams } from 'utils/query-params';
import { QUERY_PARAMS } from 'tokens/desktop';

@Component({
  selector: 'lib-enter-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  standalone: true,
  imports: [PolymorpheusTemplate, PolymorpheusOutlet, TuiButton, JsonPipe],
  providers: [TuiDialogCloseService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterDialogComponent implements OnDestroy {
  private readonly _queryParams: QueryParams = inject(QUERY_PARAMS);
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);
  private _close$ = inject(TuiDialogCloseService);

  constructor() {
    this._close$.pipe(takeUntilDestroyed()).subscribe(() => this.context.$implicit.complete());
  }

  onClick(response: boolean): void {
    this.context.completeWith(response);
  }

  ngOnDestroy(): void {
    const { dialog, ...other } = this._queryParams.value();
    this._queryParams.update(other, '');
  }
}

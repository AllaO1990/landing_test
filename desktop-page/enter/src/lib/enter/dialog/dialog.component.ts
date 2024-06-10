import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Self,
} from '@angular/core';
import { TuiDestroyService, TuiDialog } from '@taiga-ui/cdk';
import { TuiDialogCloseService } from '@taiga-ui/core';
import { Observable, takeUntil } from 'rxjs';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'lib-enter-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  providers: [TuiDialogCloseService, TuiDestroyService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterDialogComponent {
  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    readonly context: TuiDialog<any, any>,
    @Inject(TuiDialogCloseService) close$: Observable<unknown>,
    @Self() @Inject(TuiDestroyService) destroy$: Observable<unknown>
  ) {
    close$
      .pipe(takeUntil(destroy$))
      .subscribe(() => this.context.$implicit.complete());
  }

  onClick(response: boolean): void {
    this.context.completeWith(response);
  }
}

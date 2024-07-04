import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiDestroyService, TuiDialog } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiDialogCloseService } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT, PolymorpheusModule } from '@tinkoff/ng-polymorpheus';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'lib-enter-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  standalone: true,
  imports: [PolymorpheusModule, TuiButtonModule, JsonPipe],
  providers: [TuiDialogCloseService, TuiDestroyService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterDialogComponent {
  readonly context: TuiDialog<any, any> = inject(POLYMORPHEUS_CONTEXT);
  private _close$ = inject(TuiDialogCloseService);
  private _destroy$ = inject(TuiDestroyService, { self: true });
  constructor() {
    this._close$.pipe(takeUntil(this._destroy$)).subscribe(() => this.context.$implicit.complete());
  }

  onClick(response: boolean): void {
    this.context.completeWith(response);
  }
}

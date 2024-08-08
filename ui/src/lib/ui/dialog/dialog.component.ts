import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { TuiDestroyService, TuiDialog } from '@taiga-ui/cdk';
import { TuiDialogCloseService } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT, PolymorpheusModule } from '@tinkoff/ng-polymorpheus';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'lib-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  standalone: true,
  host: {
    '[attr.appearance]': 'context.appearance',
    '[class.lib-dialog]': 'true',
  },
  imports: [PolymorpheusModule],
  providers: [TuiDialogCloseService, TuiDestroyService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DialogComponent {
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

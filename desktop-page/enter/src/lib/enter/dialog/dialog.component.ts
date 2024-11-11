import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PolymorpheusTemplate, PolymorpheusOutlet } from "@taiga-ui/polymorpheus";
import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { TuiDialogCloseService, TuiButton } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'lib-enter-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  standalone: true,
  imports: [PolymorpheusTemplate, PolymorpheusOutlet, TuiButton, JsonPipe],
  providers: [TuiDialogCloseService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterDialogComponent {
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);
  private _close$ = inject(TuiDialogCloseService);

  constructor() {
    this._close$.pipe(takeUntilDestroyed()).subscribe(() => this.context.$implicit.complete());
  }

  onClick(response: boolean): void {
    this.context.completeWith(response);
  }
}

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { POLYMORPHEUS_CONTEXT, PolymorpheusOutlet } from '@taiga-ui/polymorpheus';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { TuiDialogCloseService } from '@taiga-ui/core';
import { filter } from 'rxjs';

@Component({
  selector: 'lib-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  standalone: true,
  host: {
    '[attr.appearance]': 'context.appearance || null',
    '[class.lib-dialog]': 'true',
  },
  imports: [PolymorpheusOutlet],
  providers: [TuiDialogCloseService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DialogComponent {
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);
  private _close$ = inject(TuiDialogCloseService);

  constructor() {
    this._close$
      .pipe(
        takeUntilDestroyed(),
        filter((event: unknown) => event instanceof KeyboardEvent)
      )
      .subscribe(() => this.context.$implicit.complete());
  }

  onClick(response: boolean): void {
    this.context.completeWith(response);
  }
}

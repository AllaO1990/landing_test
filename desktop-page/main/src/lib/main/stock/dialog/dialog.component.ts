import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiButton, TuiDialogContext } from '@taiga-ui/core';
import { StockGroup } from 'types/stock';
import { TuiAutoFocus, tuiPure } from '@taiga-ui/cdk';

type Context = TuiDialogContext<boolean, StockGroup>;

@Component({
  selector: 'lib-stock-dialog',
  standalone: true,
  imports: [TuiButton, TuiAutoFocus],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  readonly size = 's';
  readonly context: Context = inject(POLYMORPHEUS_CONTEXT) as Context;

  @tuiPure
  get data() {
    return this.context.data;
  }

  submit(event: Event): void {
    event.preventDefault();

    this.context.completeWith(true);
  }

  cancel(event: Event): void {
    event.preventDefault();

    this.context.completeWith(false);
  }
}

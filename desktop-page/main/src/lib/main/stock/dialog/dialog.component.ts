import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiButtonModule, TuiDialogContext } from '@taiga-ui/core';
import { StockGroup } from 'types/stock';

type Context = TuiDialogContext<boolean, StockGroup>;

@Component({
  selector: 'lib-stock-dialog',
  standalone: true,
  imports: [TuiButtonModule],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  readonly context: Context = inject(POLYMORPHEUS_CONTEXT) as Context;

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

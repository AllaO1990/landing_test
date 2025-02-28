import { TuiDay, TuiPopover, tuiPure } from '@taiga-ui/cdk';
import { inject } from '@angular/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';

export class PortfolioListDialog {
  readonly size = 's';
  readonly maxDate = TuiDay.fromLocalNativeDate(new Date());
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });

  @tuiPure
  get label(): string | null {
    return this.context.label || null;
  }

  onCancel(event: Event): void {
    event.preventDefault();

    if (this.context) {
      this.context.completeWith(null);
    }
  }
}

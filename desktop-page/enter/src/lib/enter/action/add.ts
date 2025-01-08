import { FormGroup } from '@angular/forms';
import { TuiPopover } from '@taiga-ui/cdk';
import { AfterViewInit, Directive, inject } from '@angular/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';

@Directive()
export abstract class AddForm implements AfterViewInit {
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });
  readonly size = 's';

  abstract form: FormGroup;

  ngAfterViewInit(): void {
    this.form.enable({ emitEvent: false });
  }

  onCancel(event: Event): void {
    event.preventDefault();

    if (this.context) {
      this.context.completeWith(null);
    }
  }
}

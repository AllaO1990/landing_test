import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiInputNumberModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiButton, TuiTextfieldOptionsDirective } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lib-target-add',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiInputNumberModule,
    TuiTextfieldControllerModule,
    TuiTextfieldOptionsDirective,
    TuiButton,
    NgIf,
  ],
  templateUrl: './target-add.component.html',
  styleUrl: './target-add.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetAddComponent implements AfterViewInit {
  private readonly _mapper = {
    '1': 0.4,
    '2': 0.3,
    '3': 0.3,
  };
  readonly context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });

  readonly size = 's';

  readonly form: FormGroup = new FormGroup(
    {
      price: new FormControl({ value: null, disabled: true }),
      amount: new FormControl({ value: null, disabled: true }),
    },
    Validators.required
  );

  get controlAmount(): FormControl {
    return this.form.get('amount') as FormControl;
  }

  ngAfterViewInit(): void {
    if (this.context && this.context.data) {
      const { quantity, target } = this.context.data;
      this.controlAmount.patchValue(this._getValue(quantity, target));
    }
    this.form.enable();
  }

  onSubmit(event: any): void {}

  onCancel(event: Event): void {
    if (this.context) {
      event.preventDefault();

      this.context.$implicit.complete();
    }
  }

  private _getValue(quantity: number | undefined, target: number | undefined): number | null {
    if (quantity === undefined) {
      return null;
    }

    if (target === undefined) {
      return null;
    }

    const percent = this._mapper[target.toString() as '1' | '2' | '3'];

    if (!percent) {
      return null;
    }

    return Math.floor(quantity * percent);
  }
}

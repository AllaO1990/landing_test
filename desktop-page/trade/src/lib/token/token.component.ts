import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAutoFocus, TuiContext, TuiPopover, tuiPure, TuiStringHandler } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { TuiInputDateModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TradeSource, TradeSources } from '../common/api.types';
import { NgIf } from '@angular/common';

@Component({
  selector: 'trade-token',
  standalone: true,
  imports: [
    TuiButton,
    ReactiveFormsModule,
    TuiInputDateModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiTextfield,
    TuiAutoFocus,
    NgIf,
  ],
  templateUrl: './token.component.html',
  styleUrls: ['../common/dialog.scss', './token.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeTokenComponent implements AfterViewInit {
  readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly size = 's';
  readonly formGroup: FormGroup = new FormGroup({
    name: new FormControl<string | null>(null, Validators.required),
    source: new FormControl<number | null>({ value: null, disabled: true }, Validators.required),
    sourceId: new FormControl(null, Validators.required),
    token: new FormControl<string | null>(null, Validators.required),
  });

  typeTitle: 'add' | 'change' = 'add';

  ngAfterViewInit(): void {
    if (this.#context) {
      const { source, token } = this.#context;

      if (source) {
        this.formGroup.patchValue({ source: source.name, sourceId: source.id });

        if (!token) {
          this.formGroup.patchValue({ name: source.name });
        }
      }

      if (token) {
        this.typeTitle = 'change';
        this.formGroup.patchValue({ name: token.name });
      }
    }
  }

  @tuiPure
  protected stringifySources(items: TradeSources): TuiStringHandler<TuiContext<number>> {
    const map = new Map(items.map(({ name, id }: TradeSource) => [id, name] as [number, string]));

    return ({ $implicit }: TuiContext<number>) => map.get($implicit) || '';
  }

  onCancel(event: Event): void {
    event.preventDefault();

    if (this.#context) {
      this.#context.completeWith(null);
    }
  }

  onSave(event: Event): void {
    event.preventDefault();

    if (this.#context) {
      this.#context.completeWith(this.formGroup.value);
    }
  }
}

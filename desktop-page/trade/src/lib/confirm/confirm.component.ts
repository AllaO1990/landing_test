import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { Observable, of } from 'rxjs';
import { Token } from 'types/token';

@Component({
  selector: 'trade-confirm',
  standalone: true,
  imports: [ReactiveFormsModule, TuiButton, TuiSelectModule, TuiTextfieldControllerModule, TuiTextfield],
  templateUrl: './confirm.component.html',
  styleUrls: ['../common/dialog.scss', './confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmTradeComponent {
  readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT);

  readonly size = 's';
  readonly formGroup: FormGroup = new FormGroup({
    token: new FormControl(null, Validators.required),
  });
  readonly tokens$: Observable<Token> = of({ name: 'Тинькоф Токен', sourceId: 1, tokenId: 1 });

  onCancel(event: Event): void {
    event.preventDefault();

    if (this.#context) {
      this.#context.completeWith(null);
    }
  }
}

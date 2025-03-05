import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton, TuiLink } from '@taiga-ui/core';
import { Router } from '@angular/router';
import { TuiPopover } from '@taiga-ui/cdk';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';

@Component({
  selector: 'lib-enter-finish',
  standalone: true,
  imports: [TuiLink, TuiButton],
  templateUrl: './finish.component.html',
  styleUrl: './finish.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterFinishComponent {
  readonly #context: TuiPopover<any, any> = inject(POLYMORPHEUS_CONTEXT, { optional: true });
  readonly #router: Router = inject(Router);

  onClick(event: Event): void {
    event.stopPropagation();

    this.#router.navigate(['/lk/portfolio']);
    this.onClose(event);
  }

  onClose(event: Event): void {
    event.preventDefault();

    if (this.#context) {
      this.#context.completeWith(null);
    }
  }
}

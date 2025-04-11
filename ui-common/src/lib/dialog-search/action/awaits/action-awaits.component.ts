import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { TuiButton, TuiHint } from '@taiga-ui/core';
import { TuiContext } from '@taiga-ui/cdk/types/context';
import { ActionService } from '../action.service';
import { SEARCH_DIALOG_ACTION_SERVICE_TOKEN } from '../action.providers';

@Component({
  selector: 'lib-action-awaits',
  standalone: true,
  imports: [TuiButton, TuiHint],
  templateUrl: './action-awaits.component.html',
  styleUrl: './action-awaits.component.scss',
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionAwaitsComponent<T> {
  readonly #service: ActionService<T> = inject(SEARCH_DIALOG_ACTION_SERVICE_TOKEN);

  context: TuiContext<T> | null = injectContext();

  onClick(event: Event): void {
    event.preventDefault();

    if (this.context) {
      const { $implicit } = this.context;

      this.#service.update($implicit as T);
    }
  }
}

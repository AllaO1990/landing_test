import { ChangeDetectionStrategy, Component, inject, Input, Output } from '@angular/core';

import { StockInstrument } from 'types/stock';
import { PolymorpheusComponent, PolymorpheusOutlet } from '@taiga-ui/polymorpheus';
import { ActionService } from './action.service';
import { Observable } from 'rxjs';
import {
  SEARCH_DIALOG_ACTION_CONDITION_TOKEN,
  SEARCH_DIALOG_ACTION_SERVICE_TOKEN,
  SEARCH_DIALOG_ACTION_TOKEN,
} from './action.providers';
import { ActionPlugin } from './action.types';
import { ActionDefaultCondition } from './plugins/action-default';
import { ActionApprovalCondition } from './plugins/action-approval';
import { ActionAwaitsCondition } from './plugins/action-awaits';
import { ActionCheckedCondition } from './plugins/action-checked';

@Component({
  selector: 'lib-action',
  standalone: true,
  imports: [PolymorpheusOutlet],
  templateUrl: './action.component.html',
  styleUrl: './action.component.scss',
  providers: [
    {
      provide: SEARCH_DIALOG_ACTION_SERVICE_TOKEN,
      useClass: ActionService,
    },
    {
      provide: SEARCH_DIALOG_ACTION_TOKEN,
      useFactory: (service: ActionService<StockInstrument>) => service.action$,
      deps: [SEARCH_DIALOG_ACTION_SERVICE_TOKEN],
    },
    {
      provide: SEARCH_DIALOG_ACTION_CONDITION_TOKEN,
      useClass: ActionDefaultCondition,
      multi: true,
    },
    {
      provide: SEARCH_DIALOG_ACTION_CONDITION_TOKEN,
      useClass: ActionApprovalCondition,
      multi: true,
    },
    {
      provide: SEARCH_DIALOG_ACTION_CONDITION_TOKEN,
      useClass: ActionAwaitsCondition,
      multi: true,
    },
    {
      provide: SEARCH_DIALOG_ACTION_CONDITION_TOKEN,
      useClass: ActionCheckedCondition,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionComponent {
  readonly #plugins: ActionPlugin[] = inject(SEARCH_DIALOG_ACTION_CONDITION_TOKEN);
  readonly #action: Observable<StockInstrument> = inject(SEARCH_DIALOG_ACTION_TOKEN);

  component: PolymorpheusComponent<unknown> | null = null;
  context: { $implicit: null | StockInstrument } = { $implicit: null };

  @Input() set data(value: StockInstrument) {
    const plugin = this.#plugins.find((plugin: ActionPlugin) => plugin.condition(value.subscriptionStatus)) || null;

    this.context = {
      $implicit: value,
    };

    this.component = plugin && new PolymorpheusComponent(plugin.getComponent());
  }

  @Output() action: Observable<StockInstrument> = this.#action;
}

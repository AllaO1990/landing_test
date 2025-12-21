import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { ACTION_EVENTS } from 'tokens/desktop';
import { ContextActionPlugin } from 'types/context-action-plugin';
import { ContextAction } from 'types/context-action';

@Component({
  selector: 'lk-user',
  imports: [TuiAvatar, TuiDropdown, TuiDataList],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  readonly #actions: ContextActionPlugin[] = inject(ACTION_EVENTS);
  readonly mapAction = new Map<string, ContextAction>();

  protected open = false;

  readonly items = [
    {
      name: 'Настройки',
      icon: '@tui.settings',
      disabled: true,
      action: 'settings',
    },
    {
      name: 'Выход',
      icon: '@tui.log-out',
      disabled: false,
      action: 'logout',
    },
  ];

  onClick(event: Event, type: string): void {
    event.preventDefault();

    this.open = false;

    const contextAction = this._getAction(type);

    if (contextAction) {
      contextAction.action();
    }
  }

  _getAction(type: string): ContextAction | null {
    let contextAction = this.mapAction.get(type);

    if (!contextAction) {
      const find = this.#actions.find((item) => item.condition(type)) || null;

      try {
        if (!find) {
          throw new Error('Plugin ACTION_EVENTS');
        }

        this.mapAction.set(type, find.getAction());
        contextAction = find.getAction();
      } catch (e) {
        console.warn(`Action ${type} not found: ${e}`);
      }
    }

    return contextAction || null;
  }
}

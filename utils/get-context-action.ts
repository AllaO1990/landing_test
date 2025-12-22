import { ContextAction } from '../types/context-action';
import { ContextActionPlugin } from '../types/context-action-plugin';

export const getContextAction = (
  list: ContextActionPlugin[],
  map: Map<string, ContextAction>,
  type: string
): ContextAction | null => {
  let contextAction = map.get(type);

  if (!contextAction) {
    const find = list.find((item) => item.condition(type)) || null;

    try {
      if (!find) {
        throw new Error('Plugin ACTION_EVENTS');
      }

      map.set(type, find.getAction());
      contextAction = find.getAction();
    } catch (e) {
      console.warn(`Action ${type} not found: ${e}`);
    }
  }

  return contextAction || null;
};

import { ContextAction } from './context-action';

export abstract class ContextActionPlugin {
  abstract condition(type: string): boolean;

  abstract getAction(): ContextAction;
}

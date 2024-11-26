import { Queue } from 'utils/queue';
import { ComponentStore } from '@ngrx/component-store';

export abstract class WithQueue<T extends object> extends ComponentStore<T> {
  protected queue: Queue<any> = new Queue(3);
}

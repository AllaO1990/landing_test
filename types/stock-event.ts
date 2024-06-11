import { EventSelected } from './events';

export type StockEvent<T = any> = { type: EventSelected; value: T };

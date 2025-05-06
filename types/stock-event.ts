import { EventSelected } from './events';
import { StockId } from './stock';

export type StockEvent = { type: EventSelected; id: string | StockId; group?: string; dialog?: 'visible' };

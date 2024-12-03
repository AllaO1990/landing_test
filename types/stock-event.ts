import { EventSelected } from './events';
import { StockId } from './stock';

export type StockEvent = { type: EventSelected; id: StockId; group?: StockId };

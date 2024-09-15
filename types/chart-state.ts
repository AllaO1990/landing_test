import { ActiveZone } from './chart';

export interface ChartState {
  candles: null | any[];
  consolidationZones: null | ActiveZone[];
}

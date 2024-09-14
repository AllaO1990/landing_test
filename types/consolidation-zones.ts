import { ActiveZone } from './chart';

export interface ConsolidationZonesState {
  selected: null | number[];
  zones: null | ActiveZone[];
}

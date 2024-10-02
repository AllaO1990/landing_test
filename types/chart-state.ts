import { ChartFigure } from './chart';

export interface ChartState {
  candles: null | any[];
  consolidationZones: null | ChartFigure[];
}

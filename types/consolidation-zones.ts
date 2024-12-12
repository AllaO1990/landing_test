import * as Highcharts from 'highcharts/highstock';

export interface ConsolidationZonesShape {
  data: Highcharts.AnnotationsOptions[];
  instrument: string;
}

export interface ConsolidationZonesState {
  selected: null | number[];
  zones: null | ConsolidationZonesShape;
}

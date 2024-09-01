export interface IndicatorSmaState {
  selected: null | any;
  series: null | any;
}

export interface IndicatorSmaParams {
  id: string;
  interval: number;
  period: {
    from: string;
    to: string;
  };
  types: string[];
}

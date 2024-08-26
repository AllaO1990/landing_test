export interface IndicatorEmaState {
  selected: null | any;
  series: null | any;
}

export interface IndicatorEmaParams {
  id: string;
  interval: number;
  period: {
    from: string;
    to: string;
  };
  types: string[];
}

export interface TvWidgetOptions {
  autosize: boolean;
  symbol: string;
  interval: string;
  timezone: string;
  theme: string;
  style: string;
  locale: string;
  enable_publishing: boolean;
  debug: boolean;
  disabled_features: string[];
  hide_legend: boolean;
  hide_side_toolbar: boolean;
  allow_symbol_change: boolean;
  overrides?: Overrides;
  whitelabel: string;
  studies: Study[];
  container_id: string;
  [key: string]: any;
}

interface Study {
  id: string;
  inputs: Inputs;
  [key: string]: any;
}

interface Inputs {
  length?: number;
  color?: string;
  [key: string]: any;
}

interface Overrides {
  'paneProperties.background'?: string;
  'paneProperties.vertGridProperties.color'?: string;
  'paneProperties.horzGridProperties.color'?: string;
  'symbolWatermarkProperties.transparency'?: number;
  'scalesProperties.textColor'?: string;
  'mainSeriesProperties.candleStyle.wickUpColor'?: string;
  'mainSeriesProperties.candleStyle.wickDownColor'?: string;
  [key: string]: any;
}

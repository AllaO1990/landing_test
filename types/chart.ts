export interface ConsolidationZones {
  success: boolean;
  message: string;
  data: ConsolidationZonesData;
}

export interface ConsolidationZonesData {
  activeZones: ActiveZone[];
  ideaParams: IdeaParams;
}

export interface ActiveZone {
  id: number;
  timeframe: number;
  startTime: Date;
  endTime: Date;
  high: number;
  low: number;
  isActive: boolean;
  splash: boolean;
}

export interface IdeaParams {
  id: string;
  isActive: boolean;
  positionType: string;
  priceInPlan: number;
  priceIn: number;
  priceInDate: Date;
  stop: number;
  stopDate: Date;
  targets: Target[];
}

export interface Target {
  value: number;
  reached: boolean;
  date: string | null;
}

export interface ChartFigure {
  id: string;
  points: Highcharts.AnnotationShapePointOptions[];
  color: string;
  dash: boolean | undefined;
}

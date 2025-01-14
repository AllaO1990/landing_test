export interface ConsolidationZones {
  success: boolean;
  message: string;
  data: ConsolidationZonesData;
}

export interface ConsolidationZonesIdea {
  success: boolean;
  message: string;
  data: ActiveZone;
}

export interface ConsolidationZonesData {
  activeZones: ActiveZone[];
  ideaParams: IdeaParams;
}

export interface FigureIdea {
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
  priceInPlan: number | null;
  priceInCandleDate: string;
  priceIn: number | null;
  priceInDate: Date | null;
  stop: number;
  stopDate: Date | null;
  stopCandleDate: string | null;
  targets: Target[];
  entryPrice: number | null;
  entryDate: string | null;
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

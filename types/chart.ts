export interface ConsolidationZones {
  success: boolean;
  message: string;
  data: ConsolidationZonesData;
}

export interface ConsolidationZonesData {
  activeZones: ActiveZone[];
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

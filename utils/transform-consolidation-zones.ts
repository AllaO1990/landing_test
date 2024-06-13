import { ActiveZone } from '../types/chart';

export function transformActiveConsolidationZones(zones: ActiveZone[]) {
  const commonAxisValues = { xAxis: 0, yAxis: 0 };

  return zones?.map((item) => {
    return [
      {
        x: new Date(item.startTime).valueOf(),
        y: item.low,
        ...commonAxisValues,
      },
      {
        x: new Date(item.startTime).valueOf(),
        y: item.high,
        ...commonAxisValues,
      },
      {
        x: new Date(item.endTime).valueOf(),
        y: item.high,
        ...commonAxisValues,
      },
      {
        x: new Date(item.endTime).valueOf(),
        y: item.low,
        ...commonAxisValues,
      },
      {
        x: new Date(item.startTime).valueOf(),
        y: item.low,
        ...commonAxisValues,
      },
    ];
  });
}

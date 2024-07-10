import { ConsolidationZonesData } from '../types/chart';

export function transformActiveConsolidationZones(zones: ConsolidationZonesData) {
  const commonAxisValues = { xAxis: 0, yAxis: 0 };

  const activeZones = zones?.activeZones.map((item) => {
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

  const priceIn = [
    { x: new Date(zones.ideaParams.priceInDate).valueOf(), y: zones.ideaParams.priceIn, ...commonAxisValues },
    { x: new Date().setFullYear(2029).valueOf(), y: zones.ideaParams.priceIn, ...commonAxisValues },
  ];

  const stop = [
    { x: new Date(zones.ideaParams.stopDate).valueOf(), y: zones.ideaParams.stop, ...commonAxisValues },
    { x: new Date().setFullYear(2029).valueOf(), y: zones.ideaParams.stop, ...commonAxisValues },
  ];

  // ideaZones.push(...activeZones);

  const targets = zones.ideaParams.targets.map((item) => {
    return [
      { x: new Date().valueOf(), y: item.value, ...commonAxisValues },
      { x: new Date().setFullYear(2029).valueOf(), y: item.value, ...commonAxisValues },
    ];
  });

  return [
    { points: [...activeZones], color: 'rgba(0, 64, 255, 1)' },
    { points: [priceIn], color: 'rgba(64, 224, 208, 1)' },
    { points: [stop], color: 'rgba(255,0,0,1)', dash: true },
    { points: targets, color: 'rgba(64, 224, 208, 1)', dash: true },
  ];
}

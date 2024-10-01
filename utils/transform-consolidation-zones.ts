import { ActiveZone, ConsolidationZonesData } from '../types/chart';
import { MAP_COLOR_CONSOLIDATION } from '../types/color';

export function transformActiveConsolidationZones(zones: ConsolidationZonesData) {
  const mapConsolidation = MAP_COLOR_CONSOLIDATION;
  const commonAxisValues = { xAxis: 0, yAxis: 0 };

  const priceIn = [
    { x: new Date(zones.ideaParams.priceInDate).valueOf(), y: zones.ideaParams.priceIn, ...commonAxisValues },
    { x: new Date().setFullYear(2029).valueOf(), y: zones.ideaParams.priceIn, ...commonAxisValues },
  ];

  const stop = [
    { x: new Date(zones.ideaParams.stopDate).valueOf(), y: zones.ideaParams.stop, ...commonAxisValues },
    { x: new Date().setFullYear(2029).valueOf(), y: zones.ideaParams.stop, ...commonAxisValues },
  ];

  const targets = zones.ideaParams.targets.map((item) => {
    return [
      { x: new Date().valueOf(), y: item.value, ...commonAxisValues },
      { x: new Date().setFullYear(2029).valueOf(), y: item.value, ...commonAxisValues },
    ];
  });

  return [
    // ...zones?.activeZones.map((zone) => ({
    //   points: getPointsActiveZone(zone, commonAxisValues),
    //   color: mapConsolidation[zone.timeframe as 5 | 12 | 13],
    //   id: 'zones',
    // })),
    { points: priceIn, color: 'rgba(64, 224, 208, 1)', id: 'line-enter' },
    { points: stop, color: 'rgba(255,0,0,1)', dash: true, id: 'line-stop' },
    ...targets.map((target, index) => ({
      points: target,
      color: 'rgba(0, 255, 0, 1)',
      dash: true,
      id: `line-target-${index + 1}`,
    })),
  ];
}

export const getPointsActiveZone = (zone: ActiveZone, axisValues = { xAxis: 0, yAxis: 0 }) => [
  {
    x: new Date(zone.startTime).valueOf(),
    y: zone.low,
    ...axisValues,
  },
  {
    x: new Date(zone.startTime).valueOf(),
    y: zone.high,
    ...axisValues,
  },
  {
    x: new Date(zone.endTime).valueOf(),
    y: zone.high,
    ...axisValues,
  },
  {
    x: new Date(zone.endTime).valueOf(),
    y: zone.low,
    ...axisValues,
  },
  {
    x: new Date(zone.startTime).valueOf(),
    y: zone.low,
    ...axisValues,
  },
];

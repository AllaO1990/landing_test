import { ActiveZone, FigureIdea } from '../types/chart';
import { MAP_COLOR_CONSOLIDATION } from '../types/color';

export function transformActiveConsolidationZones(zones: FigureIdea) {
  const mapConsolidation = MAP_COLOR_CONSOLIDATION;
  const commonAxisValues = { xAxis: 0, yAxis: 0 };
  const today = new Date().setUTCHours(12, 0, 0, 0);
  const setYear = new Date(today).getFullYear() + 4;

  let priceIn = [
    { x: new Date(zones.ideaParams.priceInCandleDate).valueOf(), y: zones.ideaParams.priceInPlan, ...commonAxisValues },
    { x: new Date().setFullYear(setYear).valueOf(), y: zones.ideaParams.priceInPlan, ...commonAxisValues },
  ];

  if (zones.ideaParams.entryDate) {
    priceIn = [
      { x: new Date(zones.ideaParams.entryDate).valueOf(), y: zones.ideaParams.entryPrice, ...commonAxisValues },
      { x: new Date().setFullYear(setYear).valueOf(), y: zones.ideaParams.entryPrice, ...commonAxisValues },
    ];
  }

  let stop = [
    { x: new Date(zones.ideaParams.stopCandleDate || today).valueOf(), y: zones.ideaParams.stop, ...commonAxisValues },
    { x: new Date().setFullYear(setYear).valueOf(), y: zones.ideaParams.stop, ...commonAxisValues },
  ];

  if (zones.ideaParams.stopDate) {
    stop = [
      { x: new Date(zones.ideaParams.stopDate).valueOf(), y: zones.ideaParams.stop, ...commonAxisValues },
      { x: new Date().setFullYear(setYear).valueOf(), y: zones.ideaParams.stop, ...commonAxisValues },
    ];
  }

  const currentDate = new Date().valueOf();

  const targets = zones.ideaParams.targets.map((item) => {
    const startDate = item.date !== null ? new Date(item.date).valueOf() : today;
    return [
      { x: startDate, y: item.value, ...commonAxisValues },
      { x: new Date().setFullYear(setYear).valueOf(), y: item.value, ...commonAxisValues },
    ];
  });

  return [
    { points: priceIn, color: 'rgba(64, 224, 208, 1)', id: 'line-enter', dash: !zones.ideaParams.entryDate },
    { points: stop, color: 'rgba(255,0,0,1)', id: 'line-stop', dash: !zones.ideaParams.stopDate },
    ...targets.map((target, index) => ({
      points: target,
      color: 'rgba(0, 255, 0, 1)',
      dash: !zones.ideaParams.targets[index].date,
      id: `line-target-${index + 1}`,
    })),
  ];
}

export const getHorizontalBeam = (x: string | Date, y: number, axisValues = { xAxis: 0, yAxis: 0 }) => [
  { x: new Date(x).valueOf(), y, ...axisValues },
  { x: new Date().setFullYear(2029).valueOf(), y, ...axisValues },
];

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

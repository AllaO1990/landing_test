import { SeriesSplineOptions } from 'highcharts';

export const indicatorTransformToSeries = (
  data: { dates: string[] } & {
    [key: string]: number[];
  }
): SeriesSplineOptions[] => {
  const series: { id: string; type: 'spline'; data: [number, number][] }[] = Object.keys(data)
    .filter((item: string) => item !== 'dates')
    .map((item: string) => ({
      id: item,
      type: 'spline',
      data: [],
    }));

  return data.dates.reduce((acc, item: string, index: number) => {
    const valueOf = new Date(item).valueOf();

    acc.forEach((row: { id: string; data: [number, null | number][] }) => {
      const value = data[row.id][index];
      row.data.push([valueOf, value === 0 ? null : value]);
    });

    return acc;
  }, series);
};

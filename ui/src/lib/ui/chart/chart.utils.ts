import * as Highcharts from 'highcharts/highstock';

export function WheelSetExtremes(chart: Highcharts.Chart, axisName: 'yAxis' | 'xAxis' = 'yAxis', deltaY = 0): void {
  const axis: Highcharts.Axis = chart[axisName][0];
  const min = axis.min;
  const max = axis.max;

  if (min && max) {
    let zoomOffset = (max - min) / 2;
    const centerAxis = zoomOffset + min;

    zoomOffset += deltaY * axis.toValue(1);

    if (zoomOffset < 0) {
      zoomOffset = 0;
    }

    axis.setExtremes(centerAxis - zoomOffset, centerAxis + zoomOffset, true, false);
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { scaleLinear } from 'd3-scale';
import { HSLColor, RGBColor } from 'd3-color';
import { Position } from 'types/position';
import { getRGBA } from 'utils/get-color';

const getColor = scaleLinear<string, string, never>([0, 0.5, 1], ['#039322', '#EEF1F9', '#FF103B']);

@Pipe({
  name: 'colorOutToPosition',
  standalone: true,
})
export class ColorOutToPositionPipe implements PipeTransform {
  defaultGreenColor = getRGBA(getColor(0), 0.1);
  defaultRedColor = getRGBA(getColor(1), 0.1);

  transform(item: Position, ...args: any[]): RGBColor | HSLColor | null {
    if (item.currentTarget === null) {
      return null;
    }

    const price = Math.abs(((item.lastPrice - item.currentTarget.price) / item.currentTarget.price) * 100);

    if (price <= 0.5) {
      return this.defaultGreenColor;
    }

    if (item.stop) {
      const stopPrice = Math.abs(((item.lastPrice - item.stop.price) / item.currentTarget.price) * 100);

      return stopPrice <= 0.5 ? this.defaultRedColor : null;
    }

    return null;
  }
}

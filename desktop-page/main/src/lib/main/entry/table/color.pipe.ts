import { Pipe, PipeTransform } from '@angular/core';
import { scaleLinear } from 'd3-scale';
import { HSLColor, RGBColor } from 'd3-color';
import { Position } from 'types/position';
import { getRGBA } from 'utils/get-color';

const getColor = scaleLinear<string, string, never>([0, 0.5], ['#039322', '#EEF1F9']);

@Pipe({
  name: 'colorToPosition',
  standalone: true,
})
export class ColorToPositionPipe implements PipeTransform {
  defaultColor = getRGBA(getColor(0), 0.1);

  transform(item: Position, ...args: any[]): RGBColor | HSLColor | null {
    const entries = item.entries;

    if ((entries.length === 0 && entries[0] !== null) || item.priceToTarget === null) {
      return null;
    }

    return item.priceToTarget <= 0.5 ? this.defaultColor : null;
  }
}

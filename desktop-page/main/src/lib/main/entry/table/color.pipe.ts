import { Pipe, PipeTransform } from '@angular/core';
import { getRGBA } from 'utils/get-color';
import { scaleLinear } from 'd3-scale';
import { HSLColor, RGBColor } from 'd3-color';
import { Position } from 'types/position';

const getColor = scaleLinear<string, string, never>([0, 1], ['#039322', '#EEF1F9']);

@Pipe({
  name: 'colorToPosition',
  standalone: true,
})
export class ColorToPositionPipe implements PipeTransform {
  transform(item: Position, ...args: any[]): RGBColor | HSLColor | null {
    const entries = item.entries;

    if (entries.length === 0 && entries[0] !== null) {
      return null;
    }

    const value = Math.abs(((item.lastPrice - entries[0].price) / entries[0].price) * 100);
    
    return getRGBA(getColor(value), 0.1);
  }
}

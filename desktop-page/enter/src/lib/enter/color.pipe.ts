import { Pipe, PipeTransform } from '@angular/core';
import { scaleLinear } from 'd3-scale';
import { HSLColor, RGBColor } from 'd3-color';
import { getRGBA } from 'utils/get-color';

const getColor = scaleLinear<string, string, never>([0, 0.5, 1], ['#039322', '#EEF1F9', '#FF103B']);

@Pipe({
  name: 'colorForPrice',
  standalone: true,
})
export class ColorForPricePipe implements PipeTransform {
  defaultGreenColor = getRGBA(getColor(0), 0.1);
  defaultRedColor = getRGBA(getColor(1), 0.1);

  transform(
    currentPrice: number | null,
    lastPrice: number | null = null,
    stopPrice: number | null = null
  ): RGBColor | HSLColor | null {
    if (currentPrice === null) {
      return null;
    }

    if (lastPrice === null) {
      return null;
    }

    if (lastPrice * 0.995 >= currentPrice) {
      return this.defaultGreenColor;
    }

    if (stopPrice === null) {
      return null;
    }

    return this._getPrice(stopPrice, lastPrice) <= 0.5 ? this.defaultRedColor : null;
  }

  private _getPrice(currentPrice: number, lastPrice: number): number {
    return Math.abs(((lastPrice - currentPrice) / currentPrice) * 100);
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { scaleLinear } from 'd3-scale';
import { HSLColor, RGBColor } from 'd3-color';
import { getRGBA } from 'utils/get-color';

const getColor = scaleLinear<string, string, never>([0, 0.5, 1], ['#039322', '#EEF1F9', '#FF103B']);

@Pipe({
  name: 'colorForPriceEntry',
  standalone: true,
})
export class ColorForPriceEntryPipe implements PipeTransform {
  defaultGreenColor = getRGBA(getColor(0), 0.1);

  transform(
    list: any[],
    index: number,
    key: string,
    multiplier: number | null,
    lastPrice: number | null = null,
    precision = 0.005
  ): RGBColor | HSLColor | null {
    if (list.length === 0) {
      return null;
    }

    if (multiplier === null) {
      return null;
    }

    if (lastPrice === null) {
      return null;
    }

    const price = this._getPrice(lastPrice, precision, multiplier);
    const currentTarget = this._comparePrice(price, list[index][key], multiplier);

    if (list[index + 1]) {
      const nextTarget = this._comparePrice(price, list[index + 1][key], multiplier * -1);

      return currentTarget && nextTarget ? this.defaultGreenColor : null;
    }

    return currentTarget ? this.defaultGreenColor : null;
  }

  _getPrice(price: number, precision: number, multiplier: number): number {
    return price * (1 + precision * multiplier);
  }

  _comparePrice(lastPrice: number, targetPrice: number, multiplier: number): boolean {
    if (multiplier === 1) {
      return lastPrice >= targetPrice;
    }
    return lastPrice <= targetPrice;
  }
}

@Pipe({
  name: 'colorForPriceStop',
  standalone: true,
})
export class ColorForPriceStopPipe implements PipeTransform {
  defaultRedColor = getRGBA(getColor(1), 0.1);

  transform(
    stopPrice: number | null,
    lastPrice: number | null = null,
    multiplier: number | null,
    precision = 0.005
  ): RGBColor | HSLColor | null {
    if (stopPrice === null) {
      return null;
    }

    if (lastPrice === null) {
      return null;
    }

    if (multiplier === null) {
      return null;
    }

    const price = this._getPrice(lastPrice, precision, multiplier);

    return this._comparePrice(price, stopPrice, multiplier) ? this.defaultRedColor : null;
  }

  _getPrice(price: number, precision: number, multiplier: number): number {
    return price * (1 - precision * multiplier);
  }

  _comparePrice(lastPrice: number, targetPrice: number, multiplier: number): boolean {
    if (multiplier === 1) {
      return lastPrice <= targetPrice;
    }
    return lastPrice >= targetPrice;
  }
}

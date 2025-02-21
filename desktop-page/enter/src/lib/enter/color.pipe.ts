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

    let flag = false;

    if (multiplier === 1) {
      flag = lastPrice * (1 + precision) >= list[index][key];
    } else {
      flag = lastPrice * (1 - precision) <= list[index][key];
    }

    return flag ? this.defaultGreenColor : null;
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

    let flag = false;

    if (multiplier === 1) {
      flag = lastPrice * (1 - precision) <= stopPrice;
    } else {
      flag = lastPrice * (1 + precision) >= stopPrice;
    }

    return flag ? this.defaultRedColor : null;
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'datePassed',
  standalone: true,
})
export class DatePassedPipe implements PipeTransform {
  transform(value: string | Date, compare: string | Date | undefined = undefined): number {
    let date;

    if (compare) {
      date = new Date(compare);
    } else {
      date = new Date();
      date.setUTCHours(23, 59, 59, 0);
    }

    const calc = date.valueOf() - new Date(value).valueOf();

    return Math.floor(calc / (1000 * 60 * 60 * 24));
  }
}

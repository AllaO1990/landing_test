import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'datePassed',
  standalone: true,
})
export class DatePassedPipe implements PipeTransform {
  transform(value: string | Date, compare: string | Date = new Date()): number {
    const calc = new Date(compare).valueOf() - new Date(value).valueOf();
    
    return Math.floor(calc / (1000 * 60 * 60 * 24));
  }
}

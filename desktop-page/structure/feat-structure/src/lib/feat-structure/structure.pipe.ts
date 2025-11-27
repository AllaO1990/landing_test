import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getListValue',
  standalone: true,
})
export class StructureListValuePipe implements PipeTransform {
  transform<T>(list: T[], fn: (v: T) => number): number[] {
    return list.map((item: T) => fn(item));
  }
}

@Pipe({
  name: 'getIsNaN',
  standalone: true,
})
export class StructureIsNaNPipe implements PipeTransform {
  transform(value: number): boolean {
    return isNaN(value);
  }
}

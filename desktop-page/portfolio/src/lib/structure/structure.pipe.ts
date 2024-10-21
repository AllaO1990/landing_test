import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getListValue',
  standalone: true,
})
export class StructureListValuePipe implements PipeTransform {
  transform(list: { value: number }[]): number[] {
    return list.map((item: { value: number }) => item.value);
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

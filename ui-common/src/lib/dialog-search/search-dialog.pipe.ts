import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'searchDialogListLength',
  standalone: true,
})
export class SearchDialogListLengthPipe implements PipeTransform {
  transform(total: null | number, limit: number): null | number {
    return total && Math.ceil(total / limit);
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import type { TuiInteractiveState } from '@taiga-ui/core/types';

@Pipe({
  name: 'isDisabledState',
  standalone: true,
})
export class IsDisabledStatePipe implements PipeTransform {
  transform(value: boolean): TuiInteractiveState | null {
    return value ? 'disabled' : null;
  }
}

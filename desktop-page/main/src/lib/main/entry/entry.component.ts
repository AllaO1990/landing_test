import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  ENTRY_CONSTANTS,
  ENTRY_FILTER_STOCK,
  ENTRY_FILTER_STRATEGY,
} from './entry.constants';
import { Idea } from 'types/idea';
import { EntryEnums } from './entry.enums';

@Component({
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryComponent {
  public controlSearch: FormControl<string | null> = new FormControl(null);
  public controlFilterStock: FormControl<{ id: string; name: string } | null> =
    new FormControl(null);
  public controlFilterStrategy: FormControl<{
    id: string;
    name: string;
  } | null> = new FormControl(null);
  public openMore = false;
  public constants: { [key in EntryEnums]: string } = ENTRY_CONSTANTS;

  @Input() data: Idea[] | null = null;

  public filterStock: { id: string; name: string }[] = ENTRY_FILTER_STOCK;

  public filterStrategy: { id: string; name: string }[] = ENTRY_FILTER_STRATEGY;

  public onOpenMore(): void {
    this.openMore = !this.openMore;
  }

  public onObscuredMore(obscured: boolean): void {
    if (obscured) {
      this.openMore = false;
    }
  }

  public onActiveZoneMore(active: boolean): void {
    this.openMore = active && this.openMore;
  }
}

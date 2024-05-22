import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OUT_CONSTANTS } from './out.constants';
import { OutEnums } from './out.enums';
import { MAIN_FILTER_STOCK, MAIN_FILTER_STRATEGY } from '../main.constants';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'vt-out',
  templateUrl: './out.component.html',
  styleUrls: ['./out.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutComponent {
  public readonly constants: { [key in OutEnums]: string } = OUT_CONSTANTS;
  public readonly filterStock: { id: string; name: string }[] =
    MAIN_FILTER_STOCK;
  public readonly filterStrategy: { id: string; name: string }[] =
    MAIN_FILTER_STRATEGY;

  public readonly controlSearch: FormControl<string | null> = new FormControl(
    null
  );
  public readonly controlFilterStock: FormControl<{
    id: string;
    name: string;
  } | null> = new FormControl(null);
  public readonly controlFilterStrategy: FormControl<{
    id: string;
    name: string;
  } | null> = new FormControl(null);

  public openMore = false;

  @Input() data = [];

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

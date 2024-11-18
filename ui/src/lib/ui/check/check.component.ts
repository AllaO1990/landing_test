import { TuiIcon } from '@taiga-ui/core';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lib-check',
  standalone: true,
  imports: [TuiIcon, NgIf],
  templateUrl: './check.component.html',
  styleUrl: './check.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckComponent {
  private _value: boolean | null = false;

  @Input()
  set value(value: any) {
    this._value = value;
  }

  get value() {
    return this._value;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';

export type VtChipStatus = 'keep' | 'sell' | 'buy';

@Component({
  selector: 'vt-chip',
  templateUrl: './chip.component.html',
  styleUrls: ['./chip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'vt-chip',
  },
})
export class VtChipComponent implements OnInit {
  @Input() status: VtChipStatus = 'sell';

  constructor() {}

  ngOnInit(): void {}
}

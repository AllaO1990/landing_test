import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'vt-out',
  templateUrl: './out.component.html',
  styleUrls: ['./out.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OutComponent {

  public data = Array.from({length: 100}, (_, i: number) => ({
    id: i,
    direction: 'buy',
    ticker: 'MOEX',
    cost: 4600,
    enter: 4500,
    stop: 4382,
    luck: 10,
    idea: !!(i % 4)
  }));

  constructor() {
  }
}

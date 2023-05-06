import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'vt-entry',
  templateUrl: './entry.component.html',
  styleUrls: ['./entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryComponent implements OnInit {

  public data = Array.from({length: 100}, (_, i: number) => ({
    id: i,
    direction: 'buy',
    ticker: 'MOEX',
    cost: 4600,
    enter: 4500,
    stop: 4382,
    luck: 10,
    idea: !!(i % 8)
  }));

  constructor() { }

  ngOnInit(): void {
  }

}

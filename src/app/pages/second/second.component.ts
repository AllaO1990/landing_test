import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'gpn-second',
  templateUrl: './second.component.html',
  styleUrls: ['./second.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecondComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}

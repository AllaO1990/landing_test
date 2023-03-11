import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'vt-main-v2',
  templateUrl: './main-v2.component.html',
  styleUrls: ['./main-v2.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainV2Component implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

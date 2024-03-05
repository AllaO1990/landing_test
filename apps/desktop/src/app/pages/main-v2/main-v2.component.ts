import {ChangeDetectionStrategy, Component, OnInit,} from '@angular/core';
import {DesktopStubService} from "../../../../../../api/desktop-data/src/lib/desktop-data";

@Component({
  selector: 'vt-main-v2',
  templateUrl: './main-v2.component.html',
  styleUrls: ['./main-v2.component.scss'],
  providers: [
    DesktopStubService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainV2Component implements OnInit {
  constructor() {
  }

  ngOnInit(): void {
  }
}

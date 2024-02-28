import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'vt-sale-toolbar-start',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}

import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'vt-page-404',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}

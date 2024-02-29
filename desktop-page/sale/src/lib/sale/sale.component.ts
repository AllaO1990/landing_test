import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'vt-sale',
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
